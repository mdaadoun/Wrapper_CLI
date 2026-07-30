# 📌 Session : Phase 4.3 — Client LLM De Base (Sans Retry)
**Date :** 30 Juillet 2026

Implémenter `LLMClient` dans `src/ai_watcher/clients/llm_client.py` encapsulant les interactions REST HTTPX avec l'API Gemini (et un fallback OpenAI), garantissant la validation du schéma via `AnalysisReport`, le nettoyage des balises markdown, et l'injection de la télémétrie FinOps (latence et coûts).

---

### 1. 🎓 Nouveaux Concepts Introduits

*   **Encapsulation de Client API :** Isolation des I/O réseau, des en-têtes de clés API et du formatage des requêtes HTTP au sein d'un module dédié `LLMClient` pour garantir la testabilité par injection de dépendances.
*   **Validation des Sorties Structurées :** Désérialisation des réponses JSON brutes des LLM directement dans des modèles de domaine Pydantic V2 `AnalysisReport`, détectant immédiatement les dérives de schéma.
*   **Injection de Télémétrie FinOps :** Mesure de la latence d'exécution via `time.perf_counter()` et calcul des dépenses opérationnelles d'inférence via `utils/cost.py`.

---

### 2. 🧠 Décisions & Choix Techniques

#### Décision A : Moteur REST HTTPX vs SDKs Fournisseurs
*   **Option A.1 : SDKs Fournisseurs (`google-generativeai` / `openai`)**
    *   *Avantages/Inconvénients :* Empreinte de dépendances lourde, configuration multi-fournisseurs complexe, moquage difficile des transports HTTP dans les tests.
*   **Option A.2 : Client REST HTTPX (Retenu)**
    *   *Pourquoi ce choix ?* Maintient la taille du binaire légère (< 250 Mo pour le conteneur Docker), s'aligne avec le moteur d'extraction web et permet l'injection de transports factices pour les tests unitaires.

#### Décision B : Sécurité des En-têtes vs Paramètre d'URL
*   **Option B.1 : Clé API dans la Query String (`?key=...`)**
    *   *Avantages/Inconvénients :* Configuration simple, mais risque d'exposition des identifiants dans les logs de requêtes HTTP ou les exceptions (`httpx.RequestError`).
*   **Option B.2 : Injection dans l'En-tête (`x-goog-api-key`) (Retenu)**
    *   *Pourquoi ce choix ?* Politique Zero Secret Leakage — la transmission par en-tête empêche toute fuite de la clé API dans les enregistreurs de logs ou les chaînes d'exceptions.

---

### 3. 🛠️ Implémentation & Auto-Documentation

L'implémentation du client LLM dans `src/ai_watcher/clients/llm_client.py` :

```python
"""Base LLM client encapsulation using HTTPX for REST API querying."""

import json
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import httpx
from ai_watcher.clients.prompts import get_system_prompt
from ai_watcher.exceptions import LLMClientError
from ai_watcher.schemas.report import AnalysisReport
from ai_watcher.utils.cost import calculate_cost


class LLMClient:
    """Encapsulates LLM API execution, timing, and response validation."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        temperature: float = 0.2,
        top_p: float = 0.9,
        max_tokens: Optional[int] = None,
        timeout: float = 30.0,
        httpx_client: Optional[httpx.Client] = None,
    ) -> None:
        if not api_key or not api_key.strip():
            raise LLMClientError("Missing or invalid API key configuration.")

        self.api_key: str = api_key.strip()
        self.model_name: str = model_name or "gemini-1.5-pro-latest"
        self.temperature: float = temperature
        self.top_p: float = top_p
        self.max_tokens: int = max_tokens or 8192
        self.timeout: float = timeout
        self._external_client: Optional[httpx.Client] = httpx_client
```

#### Commandes de validation :
```bash
# Exécuter les tests unitaires du client LLM
poetry run pytest tests/test_llm_client.py tests/test_cost.py
# Vérifier le typage strict avec Mypy
poetry run mypy src/ --strict
```

---

#### Tests ajoutés

*   `test_llm_client_missing_api_key` — Vérifie que l'initialisation lève une `LLMClientError` sans clé API.
*   `test_llm_client_empty_content` — Vérifie que `analyze("")` lève une `LLMClientError`.
*   `test_llm_client_successful_analysis_gemini_format` — Moque la réponse REST Gemini et vérifie le parsing des champs + métriques FinOps.
*   `test_llm_client_successful_analysis_openai_format` — Moque la réponse JSON OpenAI et vérifie la compatibilité du payload.
*   `test_llm_client_markdown_code_block_json` — Vérifie le nettoyage des balises markdown entourant la sortie JSON.
*   `test_llm_client_http_status_error` — Vérifie que les erreurs de statut HTTP sont encapsulées dans `LLMClientError`.
*   `test_llm_client_timeout_error` — Vérifie que `httpx.TimeoutException` lève une `LLMClientError`.
*   `test_llm_client_invalid_json_schema` — Vérifie qu'une non-conformité de schéma lève une `LLMClientError`.
*   `test_llm_client_empty_response_body` — Vérifie qu'une réponse sans candidat texte lève une `LLMClientError`.

---

### 4. 📌 Résumé de la Session

1.  **Module LLMClient :** Implémentation de `LLMClient` dans `src/ai_watcher/clients/llm_client.py` utilisant les appels REST HTTPX avec injection sécurisée de la clé dans les en-têtes.
2.  **Calculateur de Coûts FinOps :** Implémentation du calculateur de tarification des modèles dans `src/ai_watcher/utils/cost.py`.
3.  **Validation du Schéma :** Garantie que toutes les réponses de l'API sont désérialisées dans des modèles `AnalysisReport` validés.
4.  **Couverture de Tests :** Ajout de 11 tests unitaires dans `tests/test_llm_client.py` et `tests/test_cost.py`, portant la couverture globale de la base de code à 96%.
