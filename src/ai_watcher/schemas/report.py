"""Structured Pydantic V2 data model for LLM analysis reports and FinOps metrics."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AnalysisReport(BaseModel):
    """Immutable data contract for LLM analysis outputs and FinOps metrics."""

    model_config = ConfigDict(frozen=True)

    # Context & Origin
    source: str = Field(description="Raw source text, filepath, or URL scanned")
    analyzed_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of analysis execution",
    )
    model_used: str = Field(description="Exact LLM model identifier used")

    # Core Analysis Deliverables
    title: str = Field(description="Short synthetic title")
    summary: str = Field(description="Executive summary (max 200 words)")
    key_points: List[str] = Field(description="3 to 5 key bullet points")
    impact_technical: str = Field(description="Architecture & engineering impact")
    impact_business: str = Field(description="Business & product impact")
    impact_regulatory: Optional[str] = Field(
        default=None, description="Compliance/AI Act impact"
    )
    recommendation: str = Field(description="Actionable next step for dev team")
    priority: Literal["low", "medium", "high"] = Field(
        description="Priority level: 'low' | 'medium' | 'high'"
    )

    # FinOps Observability
    prompt_tokens: int = Field(default=0, ge=0, description="Prompt token count")
    completion_tokens: int = Field(
        default=0, ge=0, description="Completion token count"
    )
    total_tokens: int = Field(default=0, ge=0, description="Total token count")
    estimated_cost_usd: float = Field(
        default=0.0, ge=0.0, description="Estimated USD cost"
    )
    execution_time_seconds: float = Field(
        default=0.0, ge=0.0, description="Execution time in seconds"
    )
    is_cached: bool = Field(
        default=False, description="Whether report was served from cache"
    )

    @model_validator(mode="before")
    @classmethod
    def _compute_total_tokens(cls, data: Any) -> Any:
        """Auto-compute total_tokens if prompt and completion tokens are provided."""
        if isinstance(data, dict):
            prompt: int = data.get("prompt_tokens", 0)
            completion: int = data.get("completion_tokens", 0)
            total: int = data.get("total_tokens", 0)
            if total == 0 and (prompt > 0 or completion > 0):
                updated: Dict[str, Any] = dict(data)
                updated["total_tokens"] = prompt + completion
                return updated
        return data
