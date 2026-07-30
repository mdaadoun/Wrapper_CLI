"""Unit test suite for LLMClient module and API response parsing."""

from unittest.mock import MagicMock, patch

import httpx
import pytest
from ai_watcher.clients.llm_client import LLMClient
from ai_watcher.clients.prompts import SAMPLE_ANALYSIS_REPORT_JSON
from ai_watcher.exceptions import LLMClientError
from ai_watcher.schemas.report import AnalysisReport


def test_llm_client_missing_api_key() -> None:
    """Verify LLMClient initialization raises LLMClientError when no API key is provided."""
    with pytest.raises(LLMClientError, match="Missing or invalid API key"):
        LLMClient(api_key="")


def test_llm_client_empty_content() -> None:
    """Verify analyze raises LLMClientError when input content is empty."""
    client = LLMClient(api_key="test-api-key")
    with pytest.raises(LLMClientError, match="Content to analyze cannot be empty"):
        client.analyze("")


def test_llm_client_successful_analysis_gemini_format() -> None:
    """Verify analyze parses Gemini REST API response correctly into AnalysisReport."""
    mock_httpx = MagicMock(spec=httpx.Client)
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": SAMPLE_ANALYSIS_REPORT_JSON}]}}],
        "usageMetadata": {
            "promptTokenCount": 450,
            "candidatesTokenCount": 180,
            "totalTokenCount": 630,
        },
    }
    mock_httpx.post.return_value = mock_response

    client = LLMClient(api_key="test-key", httpx_client=mock_httpx)
    report = client.analyze(
        content="OpenAI releases new agent SDK.", source="http://example.com"
    )

    assert isinstance(report, AnalysisReport)
    assert report.source == "http://example.com"
    assert report.prompt_tokens == 450
    assert report.completion_tokens == 180
    assert report.total_tokens == 630
    assert report.estimated_cost_usd > 0.0
    assert report.execution_time_seconds >= 0.0


def test_llm_client_successful_analysis_openai_format() -> None:
    """Verify analyze parses OpenAI format response correctly into AnalysisReport."""
    mock_httpx = MagicMock(spec=httpx.Client)
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [{"message": {"content": SAMPLE_ANALYSIS_REPORT_JSON}}],
        "usage": {
            "prompt_tokens": 300,
            "completion_tokens": 150,
        },
    }
    mock_httpx.post.return_value = mock_response

    client = LLMClient(api_key="test-key", httpx_client=mock_httpx)
    report = client.analyze(content="New AI framework announcement.", source="raw_text")

    assert isinstance(report, AnalysisReport)
    assert report.prompt_tokens == 300
    assert report.completion_tokens == 150
    assert report.total_tokens == 450


def test_llm_client_markdown_code_block_json() -> None:
    """Verify analyze handles responses wrapped in markdown json code fences."""
    mock_httpx = MagicMock(spec=httpx.Client)
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    fenced_json = f"```json\n{SAMPLE_ANALYSIS_REPORT_JSON}\n```"
    mock_response.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": fenced_json}]}}]
    }
    mock_httpx.post.return_value = mock_response

    client = LLMClient(api_key="test-key", httpx_client=mock_httpx)
    report = client.analyze(content="Valid content to analyze.")

    assert report.title == "Autonomous Agent Framework Release"


def test_llm_client_http_status_error() -> None:
    """Verify analyze raises LLMClientError on non-200 HTTP response."""
    mock_httpx = MagicMock(spec=httpx.Client)
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 401
    mock_response.text = "Unauthorized API Key"
    mock_httpx.post.return_value = mock_response

    client = LLMClient(api_key="test-key", httpx_client=mock_httpx)
    with pytest.raises(LLMClientError, match="status 401"):
        client.analyze(content="Sample content")


def test_llm_client_timeout_error() -> None:
    """Verify analyze raises LLMClientError when HTTP request times out."""
    mock_httpx = MagicMock(spec=httpx.Client)
    mock_httpx.post.side_effect = httpx.TimeoutException("Request timed out")

    client = LLMClient(api_key="test-key", httpx_client=mock_httpx)
    with pytest.raises(LLMClientError, match="timed out"):
        client.analyze(content="Sample content")


def test_llm_client_invalid_json_schema() -> None:
    """Verify analyze raises LLMClientError when response violates AnalysisReport schema."""
    mock_httpx = MagicMock(spec=httpx.Client)
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": '{"invalid": "data"}'}]}}]
    }
    mock_httpx.post.return_value = mock_response

    client = LLMClient(api_key="test-key", httpx_client=mock_httpx)
    with pytest.raises(LLMClientError, match="validate LLM response"):
        client.analyze(content="Sample content")


def test_llm_client_empty_response_body() -> None:
    """Verify analyze raises LLMClientError when response body has no text candidates."""
    mock_httpx = MagicMock(spec=httpx.Client)
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = {}
    mock_httpx.post.return_value = mock_response

    client = LLMClient(api_key="test-key", httpx_client=mock_httpx)
    with pytest.raises(LLMClientError, match="empty or unparseable"):
        client.analyze(content="Sample content")


def test_llm_client_demo_mode_initialization() -> None:
    """Verify LLMClient in demo mode requires no API key."""
    client = LLMClient(demo_mode=True)
    assert client.demo_mode is True
    assert client.api_key == "demo-key"  # pragma: allowlist secret


def test_llm_client_demo_mode_returns_mock_report() -> None:
    """Verify analyze returns valid mock report without HTTP calls when demo_mode is True."""
    client = LLMClient(demo_mode=True)
    report = client.analyze(content="Test content for demo mode.", source="test_source")
    assert isinstance(report, AnalysisReport)
    assert report.source == "test_source"
    assert "[DEMO]" in report.title
    assert report.prompt_tokens > 0
    assert report.total_tokens == report.prompt_tokens + report.completion_tokens
    assert report.estimated_cost_usd > 0.0


def test_llm_client_retry_success_after_initial_failures() -> None:
    """Verify tenacity retries on 429 rate limits and succeeds on attempt 4."""
    mock_httpx = MagicMock(spec=httpx.Client)

    res_429 = MagicMock(spec=httpx.Response)
    res_429.status_code = 429
    res_429.text = "Rate limit exceeded"

    res_200 = MagicMock(spec=httpx.Response)
    res_200.status_code = 200
    res_200.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": SAMPLE_ANALYSIS_REPORT_JSON}]}}]
    }

    mock_httpx.post.side_effect = [res_429, res_429, res_429, res_200]

    client = LLMClient(api_key="test-key", httpx_client=mock_httpx)

    with patch("time.sleep") as mock_sleep:
        report = client.analyze(content="Retry test content")
        assert report.title == "Autonomous Agent Framework Release"
        assert mock_httpx.post.call_count == 4
        assert mock_sleep.call_count == 3


def test_llm_client_retry_exhausted_max_attempts() -> None:
    """Verify tenacity raises LLMRetryableError after 4 failed retry attempts on 503."""
    from ai_watcher.exceptions import LLMRetryableError

    mock_httpx = MagicMock(spec=httpx.Client)

    res_503 = MagicMock(spec=httpx.Response)
    res_503.status_code = 503
    res_503.text = "Service Unavailable"

    mock_httpx.post.return_value = res_503

    client = LLMClient(api_key="test-key", httpx_client=mock_httpx)

    with patch("time.sleep") as mock_sleep:
        with pytest.raises(LLMRetryableError, match="status 503"):
            client.analyze(content="503 test content")
        assert mock_httpx.post.call_count == 4
        assert mock_sleep.call_count == 3


def test_llm_client_retry_network_error_recovery() -> None:
    """Verify tenacity retries on network errors and recovers on attempt 2."""
    mock_httpx = MagicMock(spec=httpx.Client)

    res_200 = MagicMock(spec=httpx.Response)
    res_200.status_code = 200
    res_200.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": SAMPLE_ANALYSIS_REPORT_JSON}]}}]
    }

    mock_httpx.post.side_effect = [
        httpx.ConnectError("Connection refused"),
        res_200,
    ]

    client = LLMClient(api_key="test-key", httpx_client=mock_httpx)

    with patch("time.sleep") as mock_sleep:
        report = client.analyze(content="Network recovery content")
        assert report.title == "Autonomous Agent Framework Release"
        assert mock_httpx.post.call_count == 2
        assert mock_sleep.call_count == 1


def test_llm_client_non_retryable_http_error() -> None:
    """Verify non-retryable 401 error fails immediately without retrying."""
    mock_httpx = MagicMock(spec=httpx.Client)

    res_401 = MagicMock(spec=httpx.Response)
    res_401.status_code = 401
    res_401.text = "Unauthorized Key"

    mock_httpx.post.return_value = res_401

    client = LLMClient(api_key="test-key", httpx_client=mock_httpx)

    with patch("time.sleep") as mock_sleep:
        with pytest.raises(LLMClientError, match="status 401"):
            client.analyze(content="401 test content")
        assert mock_httpx.post.call_count == 1
        assert mock_sleep.call_count == 0
