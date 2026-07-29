"""
Unit tests for the extractor module.
Covers: text normalisation, file extraction, SSRF-safe URL extraction,
        _validate_ip, _SSRFSafeTransport, redirect handling, and the
        unified extract() facade.
"""

from pathlib import Path
from unittest.mock import patch

import httpx
import pytest

from src.ai_watcher.core.detector import SourceType
from src.ai_watcher.core.extractor import (
    _SSRFSafeTransport,
    _validate_ip,
    extract,
    extract_from_file,
    extract_from_text,
    extract_from_url,
)
from src.ai_watcher.exceptions import EmptySourceError, ExtractionError

# ═══════════════════════════════════════════════════════════════════════════
# extract_from_text
# ═══════════════════════════════════════════════════════════════════════════


def test_extract_from_text_normalization() -> None:
    """Ensure raw text is properly whitespace-normalized."""
    raw = "Hello   \t  World!\n\nThis is a    test."
    expected = "Hello World!\nThis is a test."
    assert extract_from_text(raw) == expected


def test_extract_from_text_empty() -> None:
    """Ensure empty text returns empty string."""
    assert extract_from_text("") == ""
    assert extract_from_text("   \n  ") == ""


def test_extract_from_text_tabs_only() -> None:
    """Tabs-only input should return empty string."""
    assert extract_from_text("\t\t\t") == ""


def test_extract_from_text_preserves_single_newlines() -> None:
    """Single newlines between non-empty lines are preserved."""
    raw = "Line 1\nLine 2\nLine 3"
    assert extract_from_text(raw) == "Line 1\nLine 2\nLine 3"


def test_extract_from_text_collapses_blank_lines() -> None:
    """Multiple consecutive blank lines are removed."""
    raw = "A\n\n\n\nB"
    assert extract_from_text(raw) == "A\nB"


# ═══════════════════════════════════════════════════════════════════════════
# extract_from_file
# ═══════════════════════════════════════════════════════════════════════════


def test_extract_from_file_valid_txt(tmp_path: Path) -> None:
    """Ensure a valid .txt file can be extracted."""
    test_file = tmp_path / "test.txt"
    test_file.write_text("Valid   text\n\nhere.", encoding="utf-8")
    assert extract_from_file(test_file) == "Valid text\nhere."


def test_extract_from_file_valid_md(tmp_path: Path) -> None:
    """Ensure a valid .md file can be extracted."""
    test_file = tmp_path / "test.md"
    test_file.write_text("# Title\n\nSome   content.", encoding="utf-8")
    assert extract_from_file(test_file) == "# Title\nSome content."


def test_extract_from_file_missing() -> None:
    """Ensure ExtractionError is raised when file does not exist."""
    missing_path = Path("/non/existent/path.txt")
    with pytest.raises(ExtractionError, match="File not found"):
        extract_from_file(missing_path)


def test_extract_from_file_invalid_extension(tmp_path: Path) -> None:
    """Ensure ExtractionError is raised for unsupported extensions."""
    test_file = tmp_path / "test.pdf"
    test_file.write_text("Fake PDF content", encoding="utf-8")
    with pytest.raises(ExtractionError, match="Unsupported file extension"):
        extract_from_file(test_file)


def test_extract_from_file_directory(tmp_path: Path) -> None:
    """Ensure ExtractionError is raised when path is a directory."""
    with pytest.raises(ExtractionError, match="Path is not a regular file"):
        extract_from_file(tmp_path)


def test_extract_from_file_empty_content(tmp_path: Path) -> None:
    """An empty .txt file produces an empty string (facade will catch it)."""
    test_file = tmp_path / "empty.txt"
    test_file.write_text("", encoding="utf-8")
    assert extract_from_file(test_file) == ""


# ═══════════════════════════════════════════════════════════════════════════
# _validate_ip  —  SSRF IP-level guard
# ═══════════════════════════════════════════════════════════════════════════


class TestValidateIp:
    """Tests for the _validate_ip helper used at connect time."""

    @pytest.mark.parametrize(
        "ip",
        [
            "127.0.0.1",  # loopback
            "10.0.0.1",  # private class A
            "172.16.0.1",  # private class B
            "192.168.1.1",  # private class C
            "169.254.1.1",  # link-local
            "0.0.0.1",  # current network
            "100.64.0.1",  # carrier-grade NAT
            "198.18.0.1",  # benchmark testing
            "::1",  # IPv6 loopback
            "fc00::1",  # IPv6 unique-local
            "fe80::1",  # IPv6 link-local
        ],
    )
    def test_private_ips_are_blocked(self, ip: str) -> None:
        """All private/reserved IPs must raise ExtractionError."""
        with pytest.raises(ExtractionError, match="SSRF blocked"):
            _validate_ip(ip)

    @pytest.mark.parametrize(
        "ip",
        [
            "8.8.8.8",  # Google DNS
            "1.1.1.1",  # Cloudflare
            "93.184.216.34",  # example.com
            "2606:4700::1",  # Cloudflare IPv6
        ],
    )
    def test_public_ips_are_allowed(self, ip: str) -> None:
        """Public IPs must not raise."""
        _validate_ip(ip)  # should not raise

    def test_unparseable_ip_is_ignored(self) -> None:
        """Garbage strings are silently skipped (httpx will handle them)."""
        _validate_ip("not-an-ip")  # should not raise


# ═══════════════════════════════════════════════════════════════════════════
# _SSRFSafeTransport  —  connect-time SSRF validation
# ═══════════════════════════════════════════════════════════════════════════


class TestSSRFSafeTransport:
    """Tests for the custom httpx transport that validates IPs at connect time."""

    def test_blocks_private_ip_at_connect_time(self) -> None:
        """Transport must reject requests whose hostname resolves to a private IP."""
        transport = _SSRFSafeTransport(retries=0)
        request = httpx.Request("GET", "https://evil.com")

        # Simulate DNS resolving to 127.0.0.1 (DNS rebinding attack)
        fake_addrinfo = [(2, 1, 6, "", ("127.0.0.1", 0))]
        with patch(
            "src.ai_watcher.core.extractor.socket.getaddrinfo",
            return_value=fake_addrinfo,
        ):
            with pytest.raises(ExtractionError, match="SSRF blocked"):
                transport.handle_request(request)

    def test_allows_public_ip_and_delegates_to_super(self) -> None:
        """Transport must delegate to parent when IP is public."""
        transport = _SSRFSafeTransport(retries=0)
        request = httpx.Request("GET", "https://example.com")

        fake_addrinfo = [(2, 1, 6, "", ("93.184.216.34", 0))]
        mock_response = httpx.Response(200, request=request)

        with patch(
            "src.ai_watcher.core.extractor.socket.getaddrinfo",
            return_value=fake_addrinfo,
        ):
            with patch.object(
                httpx.HTTPTransport, "handle_request", return_value=mock_response
            ):
                resp = transport.handle_request(request)
                assert resp.status_code == 200

    def test_dns_failure_raises_extraction_error(self) -> None:
        """Transport must wrap DNS failures in ExtractionError."""
        transport = _SSRFSafeTransport(retries=0)
        request = httpx.Request("GET", "https://nonexistent.invalid")

        import socket as _socket

        with patch(
            "src.ai_watcher.core.extractor.socket.getaddrinfo",
            side_effect=_socket.gaierror("Name or service not known"),
        ):
            with pytest.raises(ExtractionError, match="DNS resolution failed"):
                transport.handle_request(request)

    def test_blocks_when_any_resolved_ip_is_private(self) -> None:
        """If hostname resolves to multiple IPs and ANY is private, block."""
        transport = _SSRFSafeTransport(retries=0)
        request = httpx.Request("GET", "https://dual-stack.example.com")

        # First IP is public, second is private — must still block
        fake_addrinfo = [
            (2, 1, 6, "", ("93.184.216.34", 0)),
            (2, 1, 6, "", ("10.0.0.1", 0)),
        ]
        with patch(
            "src.ai_watcher.core.extractor.socket.getaddrinfo",
            return_value=fake_addrinfo,
        ):
            with pytest.raises(ExtractionError, match="SSRF blocked"):
                transport.handle_request(request)


# ═══════════════════════════════════════════════════════════════════════════
# extract_from_url  —  full URL extraction with SSRF-safe transport
# ═══════════════════════════════════════════════════════════════════════════


def _make_html_response(
    html: str, status_code: int = 200, url: str = "https://example.com"
) -> httpx.Response:
    """Helper: build a realistic httpx.Response for testing."""
    return httpx.Response(
        status_code=status_code,
        text=html,
        request=httpx.Request("GET", url),
    )


def test_extract_from_url_success() -> None:
    """Ensure a valid URL returns clean text stripped of noisy tags."""
    html_content = """
    <html>
      <head><title>Test</title></head>
      <body>
        <nav>Ignore this</nav>
        <header>Header noise</header>
        <main>
            <h1>Main Title</h1>
            <p>This is  some   useful text.</p>
            <script>console.log("no!");</script>
        </main>
        <footer>Footer noise</footer>
      </body>
    </html>
    """
    response = _make_html_response(html_content)

    with patch.object(_SSRFSafeTransport, "handle_request", return_value=response):
        result = extract_from_url("https://example.com")

    expected = "Test\nMain Title\nThis is some useful text."
    assert result == expected


def test_extract_from_url_http_error() -> None:
    """Ensure HTTP errors raise ExtractionError."""
    response = _make_html_response("", status_code=404)

    with patch.object(_SSRFSafeTransport, "handle_request", return_value=response):
        with pytest.raises(ExtractionError, match="HTTP Error 404"):
            extract_from_url("https://example.com/404")


def test_extract_from_url_network_error() -> None:
    """Ensure network errors raise ExtractionError."""
    with patch.object(
        _SSRFSafeTransport,
        "handle_request",
        side_effect=httpx.ConnectError("Connection refused"),
    ):
        with pytest.raises(ExtractionError, match="Network error"):
            extract_from_url("https://example.com/timeout")


def test_extract_from_url_no_hostname() -> None:
    """URL with no parseable hostname raises ExtractionError."""
    with pytest.raises(ExtractionError, match="URL has no hostname"):
        extract_from_url("not-a-url")


def test_extract_from_url_follows_redirects() -> None:
    """Redirects are followed up to _MAX_REDIRECTS and final page is parsed."""
    redirect_response = httpx.Response(
        status_code=301,
        headers={"Location": "https://example.com/final"},
        request=httpx.Request("GET", "https://example.com/start"),
    )
    # Build a next_request manually so the redirect logic can read it
    redirect_response._request = httpx.Request("GET", "https://example.com/start")

    final_html = "<html><body><p>Final page</p></body></html>"
    final_response = _make_html_response(final_html, url="https://example.com/final")

    call_count = 0

    def fake_handle(request: httpx.Request) -> httpx.Response:
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            # Simulate redirect: build a response with is_redirect=True
            resp = httpx.Response(
                status_code=301,
                headers={"Location": "https://example.com/final"},
                request=request,
            )
            return resp
        return final_response

    with patch.object(_SSRFSafeTransport, "handle_request", side_effect=fake_handle):
        result = extract_from_url("https://example.com/start")

    assert result == "Final page"
    assert call_count == 2


def test_extract_from_url_too_many_redirects() -> None:
    """Exceeding _MAX_REDIRECTS raises ExtractionError."""

    def always_redirect(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            status_code=301,
            headers={"Location": "https://example.com/loop"},
            request=request,
        )

    with patch.object(
        _SSRFSafeTransport, "handle_request", side_effect=always_redirect
    ):
        with pytest.raises(ExtractionError, match="Too many redirects"):
            extract_from_url("https://example.com/loop")


def test_extract_from_url_ssrf_blocked_via_transport() -> None:
    """Transport blocks requests to private IPs at connect time (integration)."""
    fake_addrinfo = [(2, 1, 6, "", ("127.0.0.1", 0))]
    with patch(
        "src.ai_watcher.core.extractor.socket.getaddrinfo", return_value=fake_addrinfo
    ):
        with pytest.raises(ExtractionError, match="SSRF blocked"):
            extract_from_url("https://evil.com")


# ═══════════════════════════════════════════════════════════════════════════
# Facade: extract()
# ═══════════════════════════════════════════════════════════════════════════


def test_extract_facade_text() -> None:
    """Facade dispatches to text extractor and validates output."""
    result = extract("Hello   World", SourceType.TEXT)
    assert result == "Hello World"
    assert len(result) > 0


def test_extract_facade_text_empty_raises() -> None:
    """Facade raises EmptySourceError when text is empty after cleaning."""
    with pytest.raises(EmptySourceError, match="empty after cleaning"):
        extract("   \n  ", SourceType.TEXT)


def test_extract_facade_file(tmp_path: Path) -> None:
    """Facade dispatches to file extractor and validates output."""
    test_file = tmp_path / "test.txt"
    test_file.write_text("File   content.", encoding="utf-8")
    result = extract(str(test_file), SourceType.FILE)
    assert result == "File content."


def test_extract_facade_file_missing_raises() -> None:
    """Facade raises ExtractionError when file does not exist."""
    with pytest.raises(ExtractionError, match="File not found"):
        extract("/nonexistent/file.txt", SourceType.FILE)


def test_extract_facade_url() -> None:
    """Facade dispatches to URL extractor and validates output."""
    html_content = "<html><body><p>URL   text.</p></body></html>"
    response = _make_html_response(html_content)

    with patch.object(_SSRFSafeTransport, "handle_request", return_value=response):
        result = extract("https://example.com", SourceType.URL)

    assert result == "URL text."


def test_extract_facade_url_empty_raises() -> None:
    """Facade raises EmptySourceError when URL content is empty after cleaning."""
    html_content = "<html><body><script>noise</script></body></html>"
    response = _make_html_response(html_content)

    with patch.object(_SSRFSafeTransport, "handle_request", return_value=response):
        with pytest.raises(EmptySourceError, match="empty after cleaning"):
            extract("https://example.com/empty", SourceType.URL)


def test_extract_facade_pydantic_validation() -> None:
    """Facade returns validated ExtractedContent with correct metadata."""
    result = extract("Valid text", SourceType.TEXT)
    assert isinstance(result, str)
    assert result == "Valid text"
