# 📌 Séance : Phase 4.1 — Modélisation des Données de Sortie (Pydantic V2)
**Date :** 29 Juillet 2026

Mise en œuvre du modèle de données `AnalysisReport` dans `schemas/report.py` en utilisant Pydantic V2, établissant un contrat de données strictement validé et immuable pour les sorties structurées de l'LLM et les métriques d'observabilité FinOps.

---

### 1. 🎓 Nouveaux Concepts Introduits

*   **Contrat de Données Pydantic V2 :** Schéma de validation strictement typé imposant les types de champs, les limites de valeurs et les clés requises sur les réponses JSON de l'LLM au moment de l'exécution.
*   **Entité de Domaine Immuable (`frozen=True`) :** Option de configuration de modèle empêchant les mutations d'état accidentelles après instanciation, préservant l'intégrité des données.
*   **Injection de Télémétrie FinOps :** Intégration des métadonnées d'exécution (jetons, coût USD, latence, statut de cache) directement dans le rapport d'analyse.

---

### 2. 🧠 Prises de Décisions & Choix Techniques

#### Dilemme A : Pydantic V2 BaseModel vs `dataclass` standard Python
*   **Option A.1 : `dataclass` standard avec logique de parsing manuelle**
    *   *Avantage/Inconvénient :* Zéro dépendance tierce, mais exige une logique manuelle verbeuse pour le parsing JSON et la validation.
*   **Option A.2 : Pydantic V2 `BaseModel` (Retenue)**
    *   *Pourquoi ce choix ?* Support natif de `model_validate_json()`, validation de types automatique, parsing datetime ISO 8601 et performances élevées via `pydantic-core` (Rust).

#### Dilemme B : Auto-calcul du total des jetons vs Calcul côté appelant
*   **Option B.1 : Forcer l'appelant à calculer `total_tokens` manuellement**
    *   *Avantage/Inconvénient :* Duplique la logique de calcul à chaque point d'appel.
*   **Option B.2 : Pré-calcul via `@model_validator(mode="before")` (Retenue)**
    *   *Pourquoi ce choix ?* Le modèle calcule automatiquement `total_tokens` dès que `prompt_tokens` et `completion_tokens` sont fournis, garantissant la cohérence interne du modèle.

---

### 3. 🛠️ Implémentation & Auto-Documentation

Modèle `AnalysisReport` dans `src/ai_watcher/schemas/report.py` :

```python
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class AnalysisReport(BaseModel):
    model_config = ConfigDict(frozen=True)

    source: str = Field(description="Source brute scannée")
    analyzed_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    model_used: str = Field(description="Identifiant du modèle LLM")

    title: str = Field(description="Titre synthétique")
    summary: str = Field(description="Résumé exécutif")
    key_points: List[str] = Field(description="3 à 5 points clés")
    impact_technical: str = Field(description="Impact technique")
    impact_business: str = Field(description="Impact business")
    impact_regulatory: Optional[str] = Field(default=None)
    recommendation: str = Field(description="Recommandation actionnable")
    priority: Literal["low", "medium", "high"] = Field(description="Priorité")

    prompt_tokens: int = Field(default=0, ge=0)
    completion_tokens: int = Field(default=0, ge=0)
    total_tokens: int = Field(default=0, ge=0)
    estimated_cost_usd: float = Field(default=0.0, ge=0.0)
    execution_time_seconds: float = Field(default=0.0, ge=0.0)
    is_cached: bool = Field(default=False)
```

#### Commandes de validation :
```bash
python3 -m pytest tests/test_schemas.py
python3 -m mypy src/ai_watcher/schemas tests/test_schemas.py
```

---

### 4. 📌 Bilan du Jour

1.  **Modélisation des Sorties :** Création de `AnalysisReport` dans `src/ai_watcher/schemas/report.py` avec validation Pydantic V2.
2.  **Immuabilité :** Configuration de `ConfigDict(frozen=True)` et contraintes de non-négativité sur la télémétrie.
3.  **Couverture de Tests :** Ajout de `tests/test_schemas.py` avec 8 cas de test validant 100% du package `schemas`.
4.  **Typage Statique :** Validation Mypy sans aucune erreur.
