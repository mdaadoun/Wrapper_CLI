# 📌 Session 3.2: HTML Web Scraping for URLs
**Date :** 27 July 2026

*This session introduced web scraping capabilities to the `extractor.py` module, focusing on extracting clean, LLM-friendly text from raw HTML using `httpx` and `BeautifulSoup4`.*

---

### 1. 🎓 New Concepts Introduced

*   **HTML Cleaning Pipeline:** A pipeline specifically designed to parse raw HTML, remove non-content noisy tags (like `<script>`, `<style>`, `<nav>`, `<footer>`), and extract the human-readable text.
*   **Noise Reduction:** In the context of LLMs, noise refers to characters and markup that consume valuable tokens without contributing meaning. Stripping these reduces API costs and improves LLM reasoning speed.

---

### 2. 🧠 Decisions & Technical Choices

#### [Dilemma A: HTML Parsing Library]
*   **Option A.1 : Regex-based tag stripping.**
    *   *Pros/Cons :* Fast and dependency-free, but highly brittle when dealing with poorly formatted HTML and nested structures.
*   **Option A.2 : Using BeautifulSoup4 (Selected).**
    *   *Why this choice ?* `bs4` is the industry standard for robust HTML parsing in Python. It effortlessly handles malformed HTML and provides powerful APIs like `.decompose()` to selectively strip specific tags before extracting text.

#### [Dilemma B: Network Requests]
*   **Option B.1 : Using the built-in `urllib` or `requests`.**
    *   *Pros/Cons :* `urllib` is clunky. `requests` is standard but strictly synchronous.
*   **Option B.2 : Using `httpx` (Selected).**
    *   *Why this choice ?* `httpx` is modern, fully type-annotated, and provides both sync and async APIs. While we use sync here, it perfectly sets us up for future async concurrency if we decide to scrape multiple URLs simultaneously.

---

### 3. 🛠️ Implementation & Self-Documentation

Implemented `extract_from_url` in `core/extractor.py`.

#### Added Tests:
*   `test_extract_from_url_success`: Uses `unittest.mock.patch` to verify `bs4` strips `<nav>`, `<header>`, `<footer>`, and `<script>` correctly, returning perfectly normalized text.
*   `test_extract_from_url_http_error`: Validates that a 404 error correctly translates to a domain `ExtractionError`.
*   `test_extract_from_url_network_error`: Validates that a timeout or DNS failure gracefully raises an `ExtractionError`.

#### Local validation commands to run:
```bash
make lint
make test
```

---

### 4. 📌 Session Summary

1.  **[Web Scraping]** Integrated `httpx` and `BeautifulSoup4` for robust HTML parsing.
2.  **[Noise Reduction]** Implemented targeted tag decomposition to preserve tokens.
3.  **[Resilience]** Added network error handling directly linked to the custom exception hierarchy.
