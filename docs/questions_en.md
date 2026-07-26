# ❓ Technical Interview FAQ: AI Watcher CLI Wrapper

Targeted questions and answers covering architecture design choices and engineering decisions for **Project 3: Wrapper CLI**.

---

### Q1. Why choose Typer over argparse or Click for a production CLI?
**Answer:** Typer combines Click's robustness with native Python 3.10+ type hints. It automatically generates CLI option parsing, help menus, and shell autocompletion while remaining 100% compliant with strict static typing tools like Mypy.

---

### Q2. How does FinOps token tracking function in this CLI?
**Answer:** Inference calls return exact prompt and completion token metadata. The CLI multiplies token counts against a model pricing matrix per million tokens to calculate exact USD costs per request in real-time.
