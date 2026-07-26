# 📓 Architecture Decision Records & Logbook (ADR)

Chronological log of architectural decisions and learning records for **Project 3: Wrapper CLI**.

---

## 📅 Session 1: Repository Initialization & Scope (July 25, 2026)

### Session Goal
Set up initial structure for `3_Wrapper_CLI` from AIPE Framework baseline and formalize functional specifications for AI Watcher CLI.

### Topics Covered & Decisions
1. **Engineering Baseline**:
   - Reuse `2_AIPE_Framework` blueprint (Poetry, Pre-commit, Ruff, Mypy, Pytest, multi-stage Docker).
   - Clean Project 2 learning logs and integrate CLI-specific functional requirements.
2. **CLI Architecture**:
   - Selected `Typer` (over argparse/Click) for typed command routing and `Rich` for console UI rendering.
   - Pydantic V2 for input validation and LLM response schema enforcement.

---

## 📌 ADR 001: Selection of Typer & Rich for CLI Stack

* **Date:** 2026-07-26
* **Status:** Accepted
* **Context:** Need an industrial, typed, and visually clear CLI interface for tech surveillance.
* **Decision:** Selected `typer` for argument routing & Mypy compliance, combined with `rich` for terminal UI rendering.
