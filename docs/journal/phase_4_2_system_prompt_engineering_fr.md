# 📌 Session : Phase 4.2 — Conception du Prompt Systémique & Respect du Schéma
**Date :** 30 Juillet 2026

Concevoir et rédiger le prompt système principal pour AI Watcher CLI dans `clients/prompts.py`, en appliquant des instructions de rôle d'analyste senior, des contraintes de concision, et les spécifications du schéma JSON Pydantic V2 avec une réponse d'exemple validée.

---

### 1. 🎓 Nouveaux Concepts Introduits

*   **Prompt Engineering Systémique :** Structuration d'instructions système incluant rôle, contraintes de formatage et schéma JSON pour maximiser le respect des consignes et la qualité des réponses du LLM.
*   **Ancrage de Schéma Few-Shot (Grounding) :** Intégration directe d'un exemple JSON valide dans le prompt système pour fournir au LLM une référence concrète parseable par `AnalysisReport.model_validate_json()`.
*   **Contrainte Sans Markdown Fences :** Instruction exigeant du LLM qu'il renvoie un objet JSON pur sans balises triple-backticks markdown pour simplifier le parsing en aval.

---

### 2. 🧠 Décisions & Choix Techniques

#### Décision A : Stockage du Prompt en Constante Typée vs Chargeur Dynamique
*   **Option A.1 : Chargement Dynamique depuis un fichier (YAML/Jinja2)**
    *   *Avantages/Inconvénients :* Permet de modifier le prompt sans toucher au code Python, mais ajoute des I/O disque et des risques de résolution de chemin en CLI.
*   **Option A.2 : Constante de Module Typée (`SYSTEM_PROMPT`) (Retenu)**
    *   *Pourquoi ce choix ?* Garantit le typage strict, élimine toute latence d'I/O disque, simplifie les tests unitaires et facilite le packaging.

#### Décision B : Exemple JSON Intégré vs Description Pure du Schéma
*   **Option B.1 : Description textuelle du schéma uniquement**
    *   *Avantages/Inconvénients :* Empreinte de tokens plus faible, mais risque accru de sorties mal formées avec des modèles plus petits.
*   **Option B.2 : Description du schéma + Exemple JSON Few-Shot Validé (Retenu)**
    *   *Pourquoi ce choix ?* L'inclusion d'un exemple JSON concret et testé augmente drastiquement la conformité du LLM aux noms de champs, formats de dates et valeurs d'énumérations.

---

### 3. 🛠️ Implémentation & Auto-Documentation

Le module de prompt système dans `src/ai_watcher/clients/prompts.py` :

```python
"""System prompt engineering definitions for LLM analysis and JSON schema enforcement."""

from ai_watcher.exceptions import WatcherError
from ai_watcher.schemas.report import AnalysisReport
from pydantic import ValidationError

SAMPLE_ANALYSIS_REPORT_JSON: str = """{
  "source": "https://example.com/ai-update",
  "analyzed_at": "2026-07-30T10:00:00Z",
  "model_used": "gpt-4o-mini",
  "title": "Autonomous Agent Framework Release",
  "summary": "A novel open-source agent orchestration framework has been introduced...",
  "key_points": [
    "Native multi-agent orchestration layer",
    "Sub-100ms response latency on edge runtime engines",
    "Built-in security guardrails and schema enforcement"
  ],
  "impact_technical": "Eliminates custom glue code for tool calling and output parsing...",
  "impact_business": "Accelerates time-to-market for enterprise AI features...",
  "impact_regulatory": "Enhances compliance with EU AI Act auditability standards...",
  "recommendation": "Evaluate framework integration for upcoming Q3 agentic workflow rollout.",
  "priority": "high",
  "prompt_tokens": 450,
  "completion_tokens": 180,
  "total_tokens": 630,
  "estimated_cost_usd": 0.000315,
  "execution_time_seconds": 0.85,
  "is_cached": false
}"""
```

#### Commandes de validation :
```bash
# Exécuter les tests unitaires du prompt
python3 -m pytest tests/test_prompts.py
# Vérifier le typage strict avec Mypy
python3 -m mypy src/ai_watcher/clients tests/test_prompts.py
```

---

#### Tests ajoutés

*   `test_system_prompt_is_typed_constant` — Vérifie que `SYSTEM_PROMPT` est une constante chaîne non vide.
*   `test_system_prompt_content_constraints` — Vérifie la présence du rôle, de la limite à 200 mots, des 3 à 5 points clés et des priorités.
*   `test_sample_analysis_report_json_parseable` — Valide que `SAMPLE_ANALYSIS_REPORT_JSON` se parse via `AnalysisReport.model_validate_json()`.
*   `test_validate_sample_report_function` — Vérifie la fonction helper `validate_sample_report()`.
*   `test_get_sample_analysis_report_json_helper` — Vérifie l'accesseur du JSON brut.
*   `test_embedded_sample_in_system_prompt_is_parseable` — Vérifie que l'exemple dans `SYSTEM_PROMPT` est valide.

---

### 4. 📌 Résumé de la Session

1.  **Conception du Prompt Systémique :** Définition de `SYSTEM_PROMPT` dans `src/ai_watcher/clients/prompts.py` avec persona, contraintes de format et exemple.
2.  **Respect du Schéma :** Validation que `SAMPLE_ANALYSIS_REPORT_JSON` est parsé sans erreur par `AnalysisReport.model_validate_json()`.
3.  **Encapsulation des Erreurs :** Capture des `ValidationError` pour lever une exception métier `WatcherError`.
4.  **Couverture de Tests :** Création de `tests/test_prompts.py` avec 6 tests unitaires passés avec succès à 100% de couverture.
