# 📌 Session : Phase 4.4 — Mode Démo avec Réponse Moquée
**Date :** 30 Juillet 2026

Ajouter l'option CLI `--demo` et la génération de réponses LLM simulées pour permettre l'exécution complète hors-ligne du pipeline sans coût réseau.

---

### 1. 🎓 Nouveaux Concepts Introduits

*   **Pipeline Démo Découplé :** Court-circuitage des requêtes API externes via des générateurs de réponses factices injectés pour tester l'exécution complète hors-ligne.
*   **Exécution Sans Identifiants (Zero-Credential Execution) :** Exécution intégrale du CLI sans nécessiter de clé API ni de fichier de configuration d'environnement.
*   **Ingestion de Télémétrie Synthétique :** Simulation du nombre de jetons de prompt/complétion et des métriques FinOps pour tester l'affichage en aval sans engendrer de coûts d'API réels.

---

### 2. 🧠 Décisions & Choix Techniques

#### Décision A : Emplacement du Générateur de Réponses Moquées
*   **Option A.1 : Dictionnaire factice en ligne dans main.py**
    *   *Avantages/Inconvénients :* Rapide à mettre en œuvre, mais duplique la structure du schéma de rapport et risque de diverger des réponses des modèles réels.
*   **Option A.2 : Encapsulation de `get_mock_analysis_report()` dans le module `LLMClient` avec le paramètre `demo_mode` (Retenu)**
    *   *Pourquoi ce choix ?* Centraliser la création du rapport factice au sein du client LLM garantit la conformité stricte au schéma (`AnalysisReport` Pydantic V2) et évite de dupliquer la logique de fallback.

#### Décision B : Gestion des Flags CLI vs Validation d'Environnement
*   **Option B.1 : Exiger `GEMINI_API_KEY` même lorsque `--demo` est spécifié**
    *   *Avantages/Inconvénients :* Impose une cohérence d'environnement, mais empêche les capacités de démonstration hors-ligne en l'absence de variables d'environnement.
*   **Option B.2 : Court-circuiter entièrement la validation de clé API quand `demo_mode=True` (Retenu)**
    *   *Pourquoi ce choix ?* Permet un onboarding immédiat et des tests hors-ligne instantanés sans fichier `.env` ni clé API valide.

---

### 3. 🛠️ Implémentation & Auto-Documentation

L'implémentation du mode démo dans `LLMClient`, les formateurs console et le point d'entrée principal CLI :

```python
# Court-circuit du mode démo dans src/ai_watcher/clients/llm_client.py
def get_mock_analysis_report(source: str = "raw_text", content: str = "") -> AnalysisReport:
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
```

#### Commandes de validation :
```bash
# Exécuter la commande scan CLI en mode démo
PYTHONPATH=src poetry run python -m src.ai_watcher.main scan 'test' --demo
# Exécuter la suite de tests incluant les tests du mode démo
poetry run pytest tests/test_cli.py tests/test_llm_client.py
```

---

#### Tests ajoutés

*   `test_llm_client_demo_mode_initialization` — Vérifie que `LLMClient` en mode démo s'initialise proprement sans clé API.
*   `test_llm_client_demo_mode_returns_mock_report` — Vérifie que `analyze` renvoie un rapport moqué valide sans appel HTTP.
*   `test_scan_demo_mode_text` — Vérifie que la commande `scan` avec le flag `--demo` s'exécute de bout en bout pour du texte avec un code de retour 0.
*   `test_scan_demo_mode_short_flag` — Vérifie que l'option courte `-d` déclenche le mode démo.
*   `test_scan_demo_mode_file` — Vérifie `scan` en mode démo avec un fichier en entrée.
*   `test_scan_demo_mode_url` — Vérifie `scan` en mode démo avec une URL en entrée.

---

### 4. 📌 Résumé de la Session

1.  **Option CLI Mode Démo :** Ajout de l'option `--demo` / `-d` à la commande `scan` Typer dans `src/ai_watcher/main.py`.
2.  **Générateur d'Analyse Moquée :** Implémentation de `get_mock_analysis_report()` et du paramètre `demo_mode=True` dans `LLMClient`.
3.  **Formateur Console :** Implémentation de `display_report()` dans `src/ai_watcher/formatters/console.py` pour le rendu du rapport sur stdout.
4.  **Couverture de Tests :** Ajout de 6 nouveaux tests unitaires/intégration, portant le total à 104 tests réussis avec 96,35 % de couverture.
