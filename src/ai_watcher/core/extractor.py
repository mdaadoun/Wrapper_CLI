"""
Data extraction module for AI Watcher CLI.
Implements pure functions for predictable I/O and text processing.
Provides a Facade (extract) dispatching to the right extractor by source type.
"""

import ipaddress
import re
import socket
from pathlib import Path
from urllib.parse import urlparse

import httpx
from ai_watcher.core.detector import SourceType
from ai_watcher.exceptions import EmptySourceError, ExtractionError
from bs4 import BeautifulSoup
from pydantic import BaseModel, Field


# ── Pydantic validation model for extracted content ──────────────────────
class ExtractedContent(BaseModel):
    """Validates that extracted content meets minimum length requirements."""

    text: str = Field(..., min_length=1, description="Cleaned extracted text")
    source_type: SourceType = Field(..., description="Detected source type")
    char_count: int = Field(..., ge=1, description="Character count after cleaning")

    @classmethod
    def from_text(cls, text: str, source_type: SourceType) -> "ExtractedContent":
        """Build validated instance; raises EmptySourceError if text is empty."""
        cleaned = text.strip()
        if not cleaned:
            raise EmptySourceError(
                f"Extracted content is empty after cleaning (source_type={source_type.value})."
            )
        return cls(text=cleaned, source_type=source_type, char_count=len(cleaned))


# ── Pure text normalisation ──────────────────────────────────────────────
def extract_from_text(raw: str) -> str:
    """
    Normalise whitespaces in raw text.
    Replaces multiple spaces/tabs with single spaces, keeps newlines.
    """
    if not raw:
        return ""
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in raw.splitlines()]
    text = "\n".join(line for line in lines if line)
    return text


# ── File extraction ──────────────────────────────────────────────────────
def extract_from_file(path: Path) -> str:
    """
    Read and extract text from a local .txt or .md file.
    Raises ExtractionError on failure.
    """
    if not path.exists():
        raise ExtractionError(f"File not found: {path}")

    if not path.is_file():
        raise ExtractionError(f"Path is not a regular file: {path}")

    if path.suffix.lower() not in (".txt", ".md"):
        raise ExtractionError(
            f"Unsupported file extension '{path.suffix}'. Only .txt and .md are supported."
        )

    try:
        content = path.read_text(encoding="utf-8")
        return extract_from_text(content)
    except Exception as e:
        raise ExtractionError(f"Failed to read file {path}: {str(e)}") from e


# ── SSRF guard: reject requests to private / reserved IP ranges ──────────
_PRIVATE_RANGES = [
    ipaddress.ip_network("127.0.0.0/8"),  # loopback
    ipaddress.ip_network("10.0.0.0/8"),  # private class A
    ipaddress.ip_network("172.16.0.0/12"),  # private class B
    ipaddress.ip_network("192.168.0.0/16"),  # private class C
    ipaddress.ip_network("169.254.0.0/16"),  # link-local
    ipaddress.ip_network("0.0.0.0/8"),  # current network
    ipaddress.ip_network("100.64.0.0/10"),  # carrier-grade NAT
    ipaddress.ip_network("198.18.0.0/15"),  # benchmark testing
    ipaddress.ip_network("::1/128"),  # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),  # IPv6 unique-local
    ipaddress.ip_network("fe80::/10"),  # IPv6 link-local
]


def _validate_ip(ip_str: str) -> None:
    """
    Raise :class:`ExtractionError` if *ip_str* falls within a
    private / reserved range.  Used at **connect time** inside the
    custom transport to eliminate TOCTOU / DNS-rebinding gaps.
    """
    try:
        addr = ipaddress.ip_address(ip_str)
    except ValueError:
        return  # unparseable → let httpx handle the error
    for net in _PRIVATE_RANGES:
        if addr in net:
            raise ExtractionError(
                f"SSRF blocked: resolved IP {addr} is in private range {net}."
            )


# ── SSRF-safe httpx transport ────────────────────────────────────────────
class _SSRFSafeTransport(httpx.HTTPTransport):
    """
    Wraps the default httpx transport and validates **every** resolved IP
    at the socket-connect level.

    This eliminates two attack vectors that pre-request DNS checks miss:
    * **DNS rebinding** — first lookup returns a public IP, second (at
      connect time) returns 127.0.0.1.
    * **Open-redirect bypass** — even with manual redirect handling,
      the *final* TCP connection is always validated here.
    """

    def handle_request(self, request: httpx.Request) -> httpx.Response:
        # Resolve hostname and validate ALL addresses before connecting
        hostname = request.url.host
        if hostname is None:
            raise ExtractionError("Request URL has no hostname.")

        try:
            addrinfo = socket.getaddrinfo(str(hostname), None)
        except socket.gaierror as e:
            raise ExtractionError(f"DNS resolution failed for '{hostname}': {e}") from e

        for _family, _, _, _, sockaddr in addrinfo:
            _validate_ip(str(sockaddr[0]))

        return super().handle_request(request)


# ── URL / web scraping extraction ────────────────────────────────────────
_USER_AGENT = (
    "ai-watcher/1.0 Mozilla/5.0 "
    "(X11; Linux x86_64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

_MAX_REDIRECTS = 5


def extract_from_url(url: str) -> str:
    """
    Fetch and clean text from a webpage URL.
    Strips noise tags (script, style, nav, footer) and normalises whitespace.

    **SSRF protection (defence-in-depth):**

    1. **Connect-time validation** — ``_SSRFSafeTransport`` validates every
       resolved IP against ``_PRIVATE_RANGES`` at the TCP-connect level,
       eliminating DNS-rebinding TOCTOU.
    2. **Per-hop redirect validation** — redirects are followed manually so
       each target hostname is checked before a new request is issued.
    """
    # Validate the initial hostname (fast-fail before creating a client)
    parsed = urlparse(url)
    hostname = parsed.hostname
    if hostname is None:
        raise ExtractionError(f"URL has no hostname: {url}")

    transport = _SSRFSafeTransport(retries=0)

    try:
        with httpx.Client(
            transport=transport,
            headers={"User-Agent": _USER_AGENT},
            timeout=10.0,
            follow_redirects=False,
        ) as client:
            current_url = url
            for _ in range(_MAX_REDIRECTS):
                response = client.get(current_url)

                if not response.is_redirect:
                    break

                # ── Per-hop redirect SSRF check (defence-in-depth) ───
                redirect_url = (
                    str(response.next_request.url) if response.next_request else None
                )
                if redirect_url is None:
                    raise ExtractionError(
                        f"Redirect with no Location header from {current_url}"
                    )
                redirect_parsed = urlparse(redirect_url)
                redirect_host = redirect_parsed.hostname
                if redirect_host is None:
                    raise ExtractionError(
                        f"Redirect URL has no hostname: {redirect_url}"
                    )
                # The transport will also validate at connect time, but
                # rejecting here avoids the DNS lookup entirely.
                current_url = redirect_url
            else:
                raise ExtractionError(
                    f"Too many redirects (>{_MAX_REDIRECTS}) starting from {url}"
                )

            response.raise_for_status()

    except httpx.HTTPStatusError as e:
        raise ExtractionError(f"HTTP Error {e.response.status_code} for {url}") from e
    except httpx.RequestError as e:
        raise ExtractionError(f"Network error while fetching {url}: {str(e)}") from e

    soup = BeautifulSoup(response.text, "html.parser")

    # Remove noisy elements
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    raw_text = soup.get_text(separator="\n", strip=True)
    return extract_from_text(raw_text)


# ── Facade: unified extraction entry point ───────────────────────────────
def extract(source: str, source_type: SourceType) -> str:
    """
    Facade — single entry point for all extraction strategies.

    Dispatches to the appropriate extractor based on *source_type*,
    then validates the result with Pydantic (non-empty guarantee).

    Parameters
    ----------
    source : str
        Raw input: plain text, file path, or URL.
    source_type : SourceType
        Detected or forced type (TEXT, FILE, URL).

    Returns
    -------
    str
        Cleaned, non-empty text ready for LLM analysis.

    Raises
    ------
    EmptySourceError
        If the cleaned output is empty or whitespace-only.
    ExtractionError
        If file I/O, HTTP, or parsing fails.
    """
    # 1. Dispatch to the right internal extractor
    if source_type == SourceType.TEXT:
        raw = extract_from_text(source)
    elif source_type == SourceType.FILE:
        raw = extract_from_file(Path(source))
    elif source_type == SourceType.URL:
        raw = extract_from_url(source)
    else:
        # Defensive: should never happen if SourceType enum is exhaustive
        raise ExtractionError(f"Unknown source type: {source_type}")

    # 2. Pydantic validation — guarantees non-empty result
    validated = ExtractedContent.from_text(raw, source_type)

    return validated.text
