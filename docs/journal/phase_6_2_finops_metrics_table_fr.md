# Journal de Dev Session 6.2: Implémentation du Tableau de Métriques FinOps

**Date:** 2026-07-30

Implémentation du rendu par tableau Rich (`Table`) dans `formatters/console.py` pour les métriques d'inférence FinOps, incluant le codage couleur dynamique du coût (< 0,01 $ vert, < 0,05 $ jaune, >= 0,05 $ rouge) et le formatage des jetons et de la latence.

---

### 1. Concepts Introduits

- **Tableau de Métriques FinOps en Terminal:** Présentation des métriques opérationnelles LLM (jetons de prompt, jetons de complétion, jetons totaux, coût USD, latence) dans un tableau Rich clair sous le panneau d'analyse principal.
- **Codage Couleur du Coût par Seuils:** Coloration dynamique de la colonne Coût selon l'impact financier (< 0,01 $ vert, < 0,05 $ jaune, >= 0,05 $ rouge) pour un retour visuel immédiat.

---

### 2. Décisions d'Architecture (ADR)

#### ADR 1: Composant Rich Table pour le Rendu de la Télémétrie
- **Option 1 (Affichage texte brut clé-valeur):** Afficher les métriques sous forme de simples lignes de texte clé-valeur sous le panneau.
- **Option 2 (Sélectionnée - Composant Rich Table stylisé):** Positionner un composant `Table` stylisé directement sous le panneau de rapport principal avec des en-têtes cyan et des colonnes numériques alignées.
- **Justification:** Améliore considérablement l'UX du terminal avec des colonnes numériques alignées, des en-têtes distincts et une mise en valeur par couleur basée sur des seuils financiers.

---

### 3. Implémentation & Code

```python
# src/ai_watcher/formatters/console.py
    metrics_table = Table(title="FinOps Metrics", show_header=True, header_style="bold cyan")
    metrics_table.add_column("Model", style="white", justify="left")
    metrics_table.add_column("Prompt Tokens", style="dim", justify="right")
    metrics_table.add_column("Completion Tokens", style="dim", justify="right")
    metrics_table.add_column("Total Tokens", style="bold", justify="right")
    metrics_table.add_column("Cost (USD)", style=cost_style, justify="right")
    metrics_table.add_column("Latency (s)", style="white", justify="right")

    metrics_table.add_row(
        report.model_used,
        f"{report.prompt_tokens:,}",
        f"{report.completion_tokens:,}",
        f"{report.total_tokens:,}",
        f"${report.estimated_cost_usd:.4f}",
        f"{report.execution_time_seconds:.4f}s",
    )
    target_console.print(metrics_table)
```

Validation:
```bash
cd projets/3_Wrapper_CLI
./.venv/bin/pytest tests/test_formatters.py tests/test_cli.py -v
```

---

### 4. Liste de Contrôle et Livrables
1. [x] Composant Rich Table intégré dans `display_report()` dans `formatters/console.py`
2. [x] Règles de coloration par seuil appliquées à `estimated_cost_usd` (< 0,01 $ vert, < 0,05 $ jaune, >= 0,05 $ rouge)
3. [x] Suite de tests unitaires mise à jour dans `tests/test_formatters.py` et `tests/test_cli.py`
