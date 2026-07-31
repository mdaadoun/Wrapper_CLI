# 🏛️ Spécification d'Architecture Logicielle : AI Watcher CLI Wrapper

> **Statut :** Standard Actif
> **Version :** 1.0.0
> **Périmètre :** Architecture & Invariants Techniques pour `ai-watcher`

---

## 1. Vue d'Ensemble & Topologie du Système

`ai-watcher` est un utilitaire CLI local mono-processus conçu pour l'ingestion de texte haute performance et tolérante aux pannes, l'analyse basée sur un LLM, et le reporting structuré.

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                 CLI ENTRYPOINT                                   │
│                                (src/main.py)                                     │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                                         ▼
                               ┌───────────────────┐
                               │  Config & Models  │
                               │(config.py, schemas)
                               └─────────┬─────────┘
                                         │
                  ┌──────────────────────┼──────────────────────┐
                  │                      │                      │
                  ▼                      ▼                      ▼
        ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
        │ Extractor Engine │   │ Cache Persistence│   │ LLM Client Engine│
        │ (core/extractor) │   │  (utils/cache)   │   │  (clients/llm)   │
        └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
                 │                      │                      │
                 │              Hash    │ Hit                  │ Network / API
                 └───────────────► [SHA-256] ──────────────────┤ Call (Tenacity)
                                        │ Miss                 │
                                        ▼                      ▼
                               ┌──────────────────────────────────┐
                               │     Structured Output Schema     │
                               │   (schemas/report.AnalysisReport)│
                               └────────────────┬─────────────────┘
                                                │
                                                ▼
                               ┌──────────────────────────────────┐
                               │        Formatters & FinOps       │
                               │(formatters/console, utils/cost)  │
                               └────────────────┬─────────────────┘
                                                │
                                                ▼
                                   [Rich Console / JSON / MD]

```

---

## 2. Invariants & Règles Architecturales (Règles d'Application de l'IA)

> ⚠️ **CONFORMITÉ STRICTE REQUISE :** Toute pull request ou diff généré par un LLM violant ces règles DOIT être rejeté.

### Règle 1 : Limites des Dépendances en Couches (Flux Directionnel Strict)

* **Règle :** Les dépendances s'écoulent **UNIQUEMENT** vers le bas.
* `main.py` ──> `core/`, `clients/`, `formatters/`, `utils/`
* `core/` ──> `clients/`, `utils/`, `schemas/`, `exceptions.py`
* `clients/` ──> `schemas/`, `exceptions.py`, `utils/cost.py`
* `formatters/` ──> `schemas/`
* `schemas/` & `exceptions.py` ──> **AUCUNE DÉPENDANCE INTERNE** (Modules feuilles)


* **Violation :** `core/` important `main.py`, ou `formatters/` appelant `clients/` directement.

### Règle 2 : Hiérarchie des Exceptions & Politique de Tolérance Zéro pour les Crashs à Nu

* **Règle :** Aucune exception brute tierce (`httpx.HTTPError`, `bs4.FeatureNotFound`, `openai.APIError`) ne doit remonter au-delà des limites du module.
* **Invariant :** Toutes les exceptions internes DOIVENT hériter de `WatcherError` dans `src/ai_watcher/exceptions.py`.
* `EmptySourceError` (Validation de l'entrée)
* `ExtractionError` (E/S fichier, Web scraping)
* `LLMClientError` (Réseau, Auth, Limites de Taux, échec de Validation du Schéma)
* `ConfigurationError` (`.env` manquant ou paramètres invalides)


* **Expérience Utilisateur :** Le CLI doit se terminer avec un Code de Sortie `1` et afficher un panneau d'erreur rouge propre stylisé avec Rich. **Les traces de pile (stack traces) en production sont interdites.**

### Règle 3 : Contrats d'Entrée & Sortie (Primauté de Pydantic V2)

* **Règle :** Les données échangées à travers les limites des modules DOIVENT être encapsulées dans des modèles Pydantic.
* **Invariant :** Le passage direct de `dict` bruts pour les données du domaine est interdit. `LLMClient.analyze()` DOIT retourner une instance de modèle `AnalysisReport` entièrement validée.
* **Déterminisme :** Les paramètres d'inférence du modèle doivent imposer `temperature <= 0.3` et `top_p = 0.9`.

### Règle 4 : Observabilité FinOps & Injection de Métadonnées

* **Règle :** Chaque chemin d'exécution qui interagit avec un LLM **DOIT** capturer et injecter les métriques FinOps dans `AnalysisReport` :
1. `prompt_tokens` (compte exact de la réponse de l'API)
2. `completion_tokens` (compte exact de la réponse de l'API)
3. `execution_time_seconds` (mesuré via `time.perf_counter()`)
4. `estimated_cost_usd` (calculé via la matrice de prix dans `utils/cost.py`)



### Règle 5 : Fonctions Pures & Isolation des Effets Secondaires

* **Règle :** `core/extractor.py` et `utils/cost.py` doivent rester des **fonctions pures** sans état global ni effets secondaires.
* **Limites des Effets Secondaires :** Les E/S fichiers pour le Cache sont restreintes à `utils/cache.py`. Les E/S réseau sont restreintes à `core/extractor.py` (scraping) et `clients/llm_client.py` (API).

---

## 3. Spécifications des Modules Principaux

### 3.1 Contrat de Schéma de Données (`src/ai_watcher/schemas/report.py`)

```python
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AnalysisReport(BaseModel):
    model_config = ConfigDict(frozen=True)

    # Context & Origin
    source: str = Field(description="Raw source, filepath, or URL scanned")
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)
    model_used: str = Field(description="Exact LLM model identifier used")

    # Core Analysis Deliverables
    title: str = Field(description="Short synthetic title")
    summary: str = Field(description="Executive summary (max 200 words)")
    key_points: List[str] = Field(description="3 to 5 key bullet points")
    impact_technical: str = Field(
        description="Architecture & engineering impact"
    )
    impact_business: str = Field(description="Business & product impact")
    impact_regulatory: Optional[str] = Field(
        default=None, description="Compliance/AI Act impact"
    )
    recommendation: str = Field(
        description="Actionable next step for dev team"
    )
    priority: str = Field(description="Priority: 'low' | 'medium' | 'high'")

    # Injected FinOps Observability
    prompt_tokens: int = Field(default=0, ge=0)
    completion_tokens: int = Field(default=0, ge=0)
    total_tokens: int = Field(default=0, ge=0)
    estimated_cost_usd: float = Field(default=0.0, ge=0.0)
    execution_time_seconds: float = Field(default=0.0, ge=0.0)
    is_cached: bool = Field(default=False)

```

### 3.2 Résilience & Politique Réseau (`src/ai_watcher/clients/llm_client.py`)

Les interactions avec l'API distante DOIVENT utiliser `@tenacity.retry` avec les paramètres suivants :

* **Déclencheurs de Réessai (Retry Triggers) :** `httpx.TimeoutException`, `httpx.HTTPStatusError` (HTTP 429, 500, 502, 503, 504), `LLMClientError`.
* **Stratégie :** Backoff exponentiel avec jitter aléatoire.
* **Tentatives Max :** 4 tentatives.
* **Progression du Backoff :** Délai initial de 2s, délai maximum de 10s.
* **Journalisation :** Les réessais interceptés émettent `logger.warning("Retry attempt {n} after failure: {exc}")`.

### 3.3 Mécanisme de Cache (`src/ai_watcher/utils/cache.py`)

* **Chemin de Stockage :** Par défaut à `~/.cache/ai_watcher/cache.json`.
* **Clé de Cache :** `SHA-256(cleaned_extracted_text + model_name)`.
* **Charge Utile (Payload) :** JSON sérialisé de `AnalysisReport`.
* **Invalidation :** TTL expiré (`--cache-ttl` en secondes) ou drapeau explicite `--no-cache`.

---

## 4. Pile Technologique & Contraintes d'Outillage

| Rôle | Outil / Bibliothèque | Version Imposée / Contrainte |
| --- | --- | --- |
| **Langage** | Python | `>= 3.11, < 3.13` avec typage strict (`mypy --strict`) |
| **Framework CLI** | Typer | Annotations de type strictes pour les drapeaux et les arguments |
| **Moteur HTTP** | HTTPX | Utilisé pour le web scraping (avec un user-agent de navigateur) |
| **Scraping** | BeautifulSoup4 | Parseur : `html.parser`. Supprimer `<script>`, `<style>`, `<nav>`, `<footer>` |
| **Formatage** | Rich | Panneaux, Tableaux, Rendu Markdown |
| **Résilience** | Tenacity | Wrappers décorés sur les E/S externes |
| **Linter / Formateur** | Ruff | Configuré via `pyproject.toml` |

---

## 5. Contrôles de Sécurité & FinOps

1. **Zéro Fuite de Secret :** `OPENAI_API_KEY` ou `GEMINI_API_KEY` ne doivent **JAMAIS** être codés en dur, écrits dans des fichiers journaux, ou inclus dans des messages d'erreur.
2. **Prix Déterministe :** Les tarifs des modèles par 1 000 000 de tokens sont définis strictement dans `utils/cost.py`. Les modèles inconnus retombent à `0.0` avec un avertissement de log plutôt que de lancer une erreur non gérée.
3. **Isolation de Conteneur :** Le `Dockerfile` de production utilise un utilisateur non-root non privilégié (`appuser`, UID 10001) et définit `ENTRYPOINT ["poetry", "run", "python", "-m", "src.ai_watcher.main"]`.
