# 📖 Guide d'Architecture & Référence du Code Source

Ce document présente une explication détaillée de l'architecture du projet `Wrapper_CLI`, des modules, des commandes et de la configuration de build.

---

## 🛠️ 1. Architecture Modulaire : `src/ai_watcher/`

L'application repose sur le **Single Responsibility Principle (SRP)**. Le code est organisé en modules clairs :
- **`main.py` :** Point d'entrée principal (CLI Typer). Gère le routage des sous-commandes (ex: `scan`), la validation des arguments positionnels (`source`), les fanions de mode (`--text/-t`, `--file/-f`, `--url/-u`), les options de format d'export (`--output/-o`), et le fanion du mode démo (`--demo/-d`).
  - *Fonction `scan()` :* Reçoit la source utilisateur, résout le mode d'évaluation (auto par défaut, ou surchargé par drapeau), transmet l'entrée au pipeline d'ingestion, initialise `LLMClient` (mode réel ou démo), et effectue le rendu via `display_report()`, la sortie JSON stdout, ou l'export vers des fichiers `.md`/`.json` via `export_markdown()`.
- **`config.py` :** Chargement de la configuration et des variables d'environnement (via `pydantic-settings`).
- **`exceptions.py`:** Définition des erreurs personnalisées du domaine via une **Hiérarchie d'Exceptions** granulaire (`WatcherError` comme base, étendue par `EmptySourceError`, `ExtractionError`, `LLMClientError`, `ConfigurationError`, `UnknownModelError`, `ExportError`). Cela permet une gestion d'erreur ciblée et des messages utilisateur clairs sans faire planter l'interpréteur.
- **`core/` :** Logique métier.
  - **`detector.py` :** Inférence déterministe du type de source
  - **`extractor.py` :** Fonctions pures pour normaliser les textes bruts, lire les fichiers `.txt`/`.md`, et scraper/nettoyer les URLs via `httpx` et `BeautifulSoup4`. (`SourceType.URL`, `SourceType.FILE`, `SourceType.TEXT`) et levée de `EmptySourceError` si la chaîne est vide.
- **`schemas/` :** Contrats de données strictement typés pour les entités métier et les sorties structurées de l'LLM.
  - **`report.py` (`AnalysisReport`) :** Modèle de données immuable Pydantic V2 (`ConfigDict(frozen=True)`). Définit le contexte (`source`, `analyzed_at`, `model_used`), les livrables d'analyse (`title`, `summary`, `key_points`, `impact_technical`, `impact_business`, `impact_regulatory`, `recommendation`, `priority`), et la télémétrie FinOps (`prompt_tokens`, `completion_tokens`, `total_tokens`, `estimated_cost_usd`, `execution_time_seconds`, `is_cached`). Inclut `@model_validator(mode="before")` pour l'auto-calcul de `total_tokens`.
- **`clients/` :** Encapsulation des clients LLM et prompt engineering.
  - **`llm_client.py` (`LLMClient`, `get_mock_analysis_report`) :** Client d'API LLM de base encapsulant les interactions REST HTTPX aux formats Google Gemini et OpenAI. La méthode `analyze(content: str, source: str, demo: bool) -> AnalysisReport` gère la construction du payload, la mesure du temps via `time.perf_counter()`, le nettoyage des balises markdown (`_clean_json_text()`), le parsing de la réponse (`_parse_response()`) et l'injection de la télémétrie FinOps. Supporte `demo_mode=True` et l'utilitaire `get_mock_analysis_report()` pour court-circuiter les requêtes REST et retourner un modèle `AnalysisReport` simulé pour des tests hors-ligne à coût zéro sans clé API.
  - **`prompts.py` (`SYSTEM_PROMPT`, `SAMPLE_ANALYSIS_REPORT_JSON`) :** Module de prompt engineering systémique. Définit le persona d'analyste senior IA, les contraintes de formatage (JSON pur, résumé de max 200 mots, 3 à 5 points clés, énumération des priorités `"low"`|`"medium"`|`"high"`) et le schéma JSON `AnalysisReport`. Inclut une réponse exemple JSON validée et un helper `validate_sample_report()` encapsulant les erreurs dans `WatcherError`.
- **`utils/` :** Utilitaires transverses (calculateur de coûts, mise en cache).
  - **`cache.py` (`ContentCache`, `compute_content_hash`) :** Module de hachage de contenu SHA-256 et de mise en cache JSON locale sur disque (`~/.cache/ai_watcher/cache.json`). Gère la récupération du cache, la validation TTL, la sérialisation de `AnalysisReport` avec `is_cached=True`, la persistance atomique du cache et sa purge.
  - **`cost.py` (`calculate_cost`, `MODEL_PRICING`) :** Fonction pure FinOps calculant le coût USD par inférence. Utilise une matrice de 40 modèles (USD par 1M tokens) couvrant 8 fournisseurs (OpenAI, Google, Anthropic, Meta, Mistral, DeepSeek, Cohere, Amazon). Lève `UnknownModelError` pour les modèles inconnus. Recherche insensible à la casse. Coût arrondi à 6 décimales.

- **`formatters/` :** Modules de formatage de sortie et d'exportation de fichiers.
  - **`console.py` (`display_report`, `PRIORITY_COLORS`) :** Module de formatage console affichant le rapport d'analyse `AnalysisReport` dans un panneau Rich stylisé. Intègre le rendu Markdown pour le résumé exécutif, des puces pour les points clés, des thèmes de couleur dynamiques (`green`, `yellow`, `red`) basés sur le niveau de priorité (`low`, `medium`, `high`), ainsi qu'un tableau Rich dédié résumant les métriques d'inférence FinOps (modèle, jetons prompt/complétion/totaux, latence et coût USD avec coloration par seuil).
  - **`markdown.py` (`render_markdown_report`, `export_markdown`) :** Générateur de document Markdown et exportateur de fichiers. Convertit une instance `AnalysisReport` en une chaîne Markdown formatée (avec métadonnées, résumé, points clés sous forme de liste à puces, impacts et tableau de métriques FinOps) et l'écrit sur disque, en gérant les erreurs d'E/S de fichier via le wrapper `ExportError`.


---

## 📦 2. Manifeste & Environnement Projet : `pyproject.toml` et `.env.example`

- **`pyproject.toml` :** Déclaration centralisée du projet via Poetry. Définit les dépendances du CLI, l'outillage de qualité (`pytest`, `ruff`, `mypy`, `pre-commit`, `detect-secrets`) et les paramètres des linters.
- **`.env.example` :** Modèle de configuration détaillant les variables requises (comme `GEMINI_API_KEY`) selon la méthodologie 12-Factor App.

---

## 🛠️ 3. Automatisation des Tâches : `Makefile`

- **Rôle :** Offre une interface de commandes unifiée pour les workflows (`make install`, `make lint`, `make test`, `make docker-build`, `make onboarding-check`).

---

## 🐳 4. Conteneurisation & Sécurité : `Dockerfile`

- **Rôle :** Image Docker de production multi-stage produisant un conteneur d'exécution non-root ultra-sécurisé et léger (< 250 Mo).

---

## 🔐 5. Contrôle Qualité Pré-Commit : `.pre-commit-config.yaml`

- **Rôle :** Configure les hooks Git pre-commit locaux pour vérifier le style, le typage strict et détecter les secrets (`detect-secrets`).

---

## 🚀 6. Simulation d'Onboarding : `scripts/simulate_onboarding.sh`

- **Rôle :** Script de validation automatisé E2E qui valide le scénario Zero-Setup Friction en moins de 300 secondes.

---

## ⚙️ 7. Configuration de l'Espace de Travail IDE : `.vscode/`

- **Rôle :** Configure l'espace de travail VSCode (`.vscode/settings.json`) et les recommandations d'extensions (`.vscode/extensions.json`).
- **Concepts Clés :**
  - **`extensions.json` :** Propose automatiquement l'installation des extensions officielles `charliermarsh.ruff` (linter/formateur) et `ms-python.python` dès l'ouverture du projet.
  - **`settings.json` :** Aligne le comportement de l'IDE local sur la CI/CD en activant le formatage automatique à la sauvegarde via Ruff (`editor.formatOnSave`: `true`), la correction automatique des erreurs et imports (`source.fixAll`, `source.organizeImports`) et les règles de nettoyage de fin de ligne.

---

## 🧪 8. Validation Initiale : `tests/test_core.py`

- **Rôle :** Un module de test de base permettant à `pytest` de s'exécuter avec succès sur une base de code nouvellement initialisée (ou nettoyée).
- **Concept :** Évite les erreurs "no tests ran" (code de sortie 5) lors des appels automatiques du `Makefile` pendant le setup initial.
