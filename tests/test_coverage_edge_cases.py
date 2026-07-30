"""Unit tests specifically covering defensive edge cases and fallback branches."""

from pathlib import Path
from unittest.mock import MagicMock, patch

import httpx
import pytest
from ai_watcher.clients.llm_client import LLMClient
from ai_watcher.clients.prompts import validate_sample_report
from ai_watcher.core.detector import SourceType, detect_source_type
from ai_watcher.core.extractor import (
    ExtractionError,
    _SSRFSafeTransport,
    extract,
    extract_from_file,
)
from ai_watcher.exceptions import LLMClientError, WatcherError


def test_llm_client_default_httpx_client_creation() -> None:
    """Cover llm_client.py line 77, 129: default httpx.Client creation and close."""
    client = LLMClient(api_key="test-key")
    with patch.object(httpx.Client, "post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [
                {
                    "message": {
                        "content": '{"source": "test", "title": "T", "summary": "S", "key_points": ["K1", "K2", "K3"], "impact_technical": "T", "impact_business": "B", "impact_regulatory": null, "recommendation": "R", "priority": "low"}'
                    }
                }
            ]
        }
        mock_post.return_value = mock_response

        report = client.analyze("Sample input text")
        assert report.title == "T"


def test_llm_client_request_error_handling() -> None:
    """Cover llm_client.py line 126: httpx.RequestError handling."""
    mock_httpx = MagicMock(spec=httpx.Client)
    mock_httpx.post.side_effect = httpx.RequestError("Connection refused")

    client = LLMClient(api_key="test-key", httpx_client=mock_httpx)
    with pytest.raises(LLMClientError, match="LLM API request error"):
        client.analyze("Sample text")


def test_llm_client_json_not_a_dict() -> None:
    """Cover llm_client.py line 187: JSON response is a primitive/list instead of dict."""
    mock_httpx = MagicMock(spec=httpx.Client)
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [{"message": {"content": "[1, 2, 3]"}}]
    }
    mock_httpx.post.return_value = mock_response

    client = LLMClient(api_key="test-key", httpx_client=mock_httpx)
    with pytest.raises(LLMClientError, match="LLM response JSON is not an object"):
        client.analyze("Sample text")


def test_validate_sample_report_validation_error() -> None:
    """Cover prompts.py lines 84-85: ValidationError in validate_sample_report."""
    with patch(
        "ai_watcher.clients.prompts.SAMPLE_ANALYSIS_REPORT_JSON",
        '{"invalid": "json"}',
    ):
        with pytest.raises(WatcherError, match="Sample JSON validation failed"):
            validate_sample_report()


def test_detector_invalid_path_character() -> None:
    """Cover detector.py lines 46-48: OSError/ValueError when checking path."""
    source = "invalid\0path"
    st = detect_source_type(source)
    assert st == SourceType.TEXT


def test_extract_from_file_read_error(tmp_path: Path) -> None:
    """Cover extractor.py lines 72-73: Exception when reading file text."""
    test_file = tmp_path / "test.txt"
    test_file.write_text("Hello world", encoding="utf-8")

    with patch.object(
        Path, "read_text", side_effect=PermissionError("Permission denied")
    ):
        with pytest.raises(ExtractionError, match="Failed to read file"):
            extract_from_file(test_file)


def test_ssrf_transport_request_no_hostname() -> None:
    """Cover extractor.py line 126: Request URL with no host."""
    transport = _SSRFSafeTransport()
    req = MagicMock(spec=httpx.Request)
    req.url = MagicMock()
    req.url.host = None

    with pytest.raises(ExtractionError, match="Request URL has no hostname"):
        transport.handle_request(req)


def test_extract_from_url_redirect_no_location() -> None:
    """Cover extractor.py line 190: Redirect without location header."""
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.is_redirect = True
    mock_response.next_request = None

    mock_client = MagicMock(spec=httpx.Client)
    mock_client.get.return_value = mock_response
    mock_client.__enter__.return_value = mock_client
    mock_client.__exit__.return_value = None

    with patch("httpx.Client", return_value=mock_client):
        with patch("ai_watcher.core.extractor._SSRFSafeTransport"):
            with pytest.raises(
                ExtractionError, match="Redirect with no Location header"
            ):
                from ai_watcher.core.extractor import extract_from_url

                extract_from_url("http://example.com")


def test_extract_from_url_redirect_no_hostname() -> None:
    """Cover extractor.py line 196: Redirect URL without hostname."""
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.is_redirect = True
    mock_req = MagicMock()
    mock_req.url = "http:///no-host-path"
    mock_response.next_request = mock_req

    mock_client = MagicMock(spec=httpx.Client)
    mock_client.get.return_value = mock_response
    mock_client.__enter__.return_value = mock_client
    mock_client.__exit__.return_value = None

    with patch("httpx.Client", return_value=mock_client):
        with patch("ai_watcher.core.extractor._SSRFSafeTransport"):
            with pytest.raises(ExtractionError, match="Redirect URL has no hostname"):
                from ai_watcher.core.extractor import extract_from_url

                extract_from_url("http://example.com")


def test_extract_unknown_source_type() -> None:
    """Cover extractor.py line 260: Unknown source type in facade."""
    with pytest.raises(ExtractionError, match="Unknown source type"):
        extract("some text", "UNKNOWN_TYPE")  # type: ignore[arg-type]
