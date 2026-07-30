"""Base LLM client encapsulation using HTTPX for REST API querying."""

import json
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import httpx
from ai_watcher.clients.prompts import get_system_prompt
from ai_watcher.exceptions import LLMClientError
from ai_watcher.schemas.report import AnalysisReport
from ai_watcher.utils.cost import calculate_cost
from pydantic import ValidationError


def get_mock_analysis_report(
    source: str = "raw_text", content: str = ""
) -> AnalysisReport:
    """Generate pre-filled mock AnalysisReport for demo mode and offline testing."""
    snippet = content[:60] + "..." if len(content) > 60 else content
    return AnalysisReport(
        source=source,
        analyzed_at=datetime.now(timezone.utc),
        model_used="gemini-1.5-pro-latest (mocked)",
        title="[DEMO] Synthetic AI Tech Radar Report",
        summary=f"Synthetic analysis generated in demo mode for content: '{snippet}'",
        key_points=[
            "Architectural decoupling enables zero-cost offline demo testing.",
            "Pydantic V2 domain contracts guarantee runtime type safety.",
            "FinOps instrumentation tracks token volume and estimated expenditure.",
        ],
        impact_technical="Modular client design isolates transport logic for zero-latency offline runs.",
        impact_business="Reduces operational API expenses during dev/testing cycles by 100%.",
        impact_regulatory="Data privacy maintained with local evaluation bypassing external endpoints.",
        recommendation="Enable local response caching to minimize redundant production API costs.",
        priority="medium",
        prompt_tokens=350,
        completion_tokens=150,
        total_tokens=500,
        estimated_cost_usd=0.00175,
        execution_time_seconds=0.015,
        is_cached=False,
    )


class LLMClient:
    """Encapsulates LLM API execution, timing, and response validation."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        temperature: float = 0.2,
        top_p: float = 0.9,
        max_tokens: Optional[int] = None,
        timeout: float = 30.0,
        httpx_client: Optional[httpx.Client] = None,
        demo_mode: bool = False,
    ) -> None:
        """Initialize client with injected configuration."""
        self.demo_mode: bool = demo_mode
        if not demo_mode and (not api_key or not api_key.strip()):
            raise LLMClientError("Missing or invalid API key configuration.")

        self.api_key: str = (api_key or "demo-key").strip()
        self.model_name: str = model_name or "gemini-1.5-pro-latest"
        self.temperature: float = temperature
        self.top_p: float = top_p
        self.max_tokens: int = max_tokens or 8192
        self.timeout: float = timeout
        self._external_client: Optional[httpx.Client] = httpx_client

    def _get_client(self) -> httpx.Client:
        """Return injected or new HTTPX client."""
        if self._external_client is not None:
            return self._external_client
        return httpx.Client(timeout=self.timeout)

    def analyze(
        self, content: str, source: str = "raw_text", demo: bool = False
    ) -> AnalysisReport:
        """Send prompt and content to API and parse returned report."""
        if not content or not content.strip():
            raise LLMClientError("Content to analyze cannot be empty.")

        if self.demo_mode or demo:
            return get_mock_analysis_report(source=source, content=content)

        start_time = time.perf_counter()
        system_prompt = get_system_prompt()
        prompt_text = f"{system_prompt}\n\nCONTENT TO ANALYZE:\n{content}"

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.api_key,
        }
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt_text}],
                }
            ],
            "generationConfig": {
                "temperature": self.temperature,
                "topP": self.top_p,
                "maxOutputTokens": self.max_tokens,
                "responseMimeType": "application/json",
            },
        }

        client = self._get_client()
        should_close = self._external_client is None

        try:
            response = client.post(url, headers=headers, json=payload)
            if response.status_code != 200:
                raise LLMClientError(
                    f"LLM API request failed with status {response.status_code}: {response.text}"
                )
            data: Dict[str, Any] = response.json()
        except httpx.TimeoutException as e:
            raise LLMClientError(f"LLM API request timed out: {e}") from e
        except (httpx.RequestError, json.JSONDecodeError) as e:
            raise LLMClientError(f"LLM API request error: {e}") from e
        finally:
            if should_close:
                client.close()

        elapsed_time = round(time.perf_counter() - start_time, 4)

        return self._parse_response(
            data=data,
            source=source,
            execution_time=elapsed_time,
        )

    def _parse_response(
        self,
        data: Dict[str, Any],
        source: str,
        execution_time: float,
    ) -> AnalysisReport:
        """Parse raw API dictionary into validated AnalysisReport object."""
        raw_text: str = ""
        prompt_tokens: int = 0
        completion_tokens: int = 0

        if (
            "candidates" in data
            and isinstance(data["candidates"], list)
            and len(data["candidates"]) > 0
        ):
            candidate = data["candidates"][0]
            parts = candidate.get("content", {}).get("parts", [])
            if parts and isinstance(parts, list) and "text" in parts[0]:
                raw_text = str(parts[0]["text"])

            usage = data.get("usageMetadata", {})
            prompt_tokens = int(usage.get("promptTokenCount", 0))
            completion_tokens = int(usage.get("candidatesTokenCount", 0))

        elif (
            "choices" in data
            and isinstance(data["choices"], list)
            and len(data["choices"]) > 0
        ):
            choice = data["choices"][0]
            message = choice.get("message", {})
            raw_text = str(message.get("content", ""))

            usage = data.get("usage", {})
            prompt_tokens = int(usage.get("prompt_tokens", 0))
            completion_tokens = int(usage.get("completion_tokens", 0))

        if not raw_text:
            raise LLMClientError(
                "LLM API returned an empty or unparseable response body."
            )

        cleaned_text = self._clean_json_text(raw_text)

        try:
            report_dict = json.loads(cleaned_text)
            if not isinstance(report_dict, dict):
                raise LLMClientError("LLM response JSON is not an object.")

            report_dict["source"] = source
            report_dict["model_used"] = self.model_name
            report_dict["analyzed_at"] = datetime.now(timezone.utc).isoformat()
            report_dict["prompt_tokens"] = prompt_tokens
            report_dict["completion_tokens"] = completion_tokens
            report_dict["total_tokens"] = prompt_tokens + completion_tokens
            report_dict["execution_time_seconds"] = execution_time
            report_dict["estimated_cost_usd"] = calculate_cost(
                model=self.model_name,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
            )

            return AnalysisReport.model_validate(report_dict)

        except (json.JSONDecodeError, ValidationError) as e:
            raise LLMClientError(
                f"Failed to validate LLM response against AnalysisReport schema: {e}"
            ) from e

    @staticmethod
    def _clean_json_text(text: str) -> str:
        """Strip markdown syntax blocks surrounding JSON content."""
        cleaned = text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            cleaned = "\n".join(lines).strip()
        return cleaned
