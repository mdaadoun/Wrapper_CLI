# Journal de Dev Session 6.3: Implémentation des Formats d'Exportation (--output)

**Date:** 2026-07-30

Implémentation des options d'exportation dans la commande CLI `scan` (`--output` / `-o`) supportant `console` (panneau UI Rich par défaut), `json` (sortie stdout ou fichier `.json`), et `markdown` (exportation de fichier `.md` via `formatters/markdown.py`).

---

### 1. Concepts Introduits

- **Exportateur d'Output Multi-Formats:** Découplage de la structure de données d'analyse interne vis-à-vis des formats de présentation et d'exportation.
- **Sérialisation Interopérable de Rapport:** Fourniture de JSON structuré pour la consommation programmatique et de Markdown pour la documentation et l'archivage.

---

### 2. Décisions d'Architecture (ADR)

#### ADR 1: Architecture Découplée des Formateurs d'Exportation
- **Option 1 (Intégrer la sérialisation directement dans les méthodes du schéma AnalysisReport):** Ajouter le rendu d'exportation directement sur les modèles Pydantic.
- **Option 2 (Sélectionnée - Module de formateurs dédié avec fonctions de rendu console et markdown spécialisées):** Séparer la logique d'exportation de fichier dans `formatters/markdown.py`.
- **Justification:** Maintient le principe de responsabilité unique (SRP) en gardant les modèles de schéma axés uniquement sur la validation des données et les règles métier, tandis que la représentation visuelle/fichier réside dans les formateurs.

---

### 3. Implémentation & Code

```python
# src/ai_watcher/formatters/markdown.py
def export_markdown(report: AnalysisReport, output_path: Path | str) -> Path:
    try:
        path = Path(output_path)
        md_content = render_markdown_report(report)
        path.write_text(md_content, encoding="utf-8")
        return path
    except OSError as err:
        raise ExportError(
            f"Failed to export Markdown report to '{output_path}': {err}"
        ) from err
```

Validation:
```bash
cd projets/3_Wrapper_CLI
./.venv/bin/pytest tests/test_export.py tests/test_cli.py -v
```

---

### 4. Liste de Contrôle et Livrables
1. [x] `src/ai_watcher/formatters/markdown.py` créé avec `render_markdown_report` et `export_markdown`
2. [x] Commande `scan` dans `src/ai_watcher/main.py` mise à jour avec l'option `--output` / `-o`
3. [x] Gestion des exceptions `ExportError` et suite de tests unitaires mise à jour dans `tests/test_export.py`
