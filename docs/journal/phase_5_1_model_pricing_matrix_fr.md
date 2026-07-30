# Journal Dev Session 5.1: Matrice de Tarification & Calculateur de Coûts

**Date:** 2026-07-30

Implémentation du module de calcul de coûts FinOps — une matrice de tarification complète couvrant 40 modèles avec levée stricte de `UnknownModelError` pour les modèles inconnus, migration du format legacy par-1K vers la norme industrielle par-1M tokens.

---

### 1. Concepts Introduits

- **Tarification par 1M Tokens :** Standard industriel (2025+) où les taux sont exprimés pour 1 000 000 tokens plutôt que pour 1 000. Simplifie le calcul mental : `gpt-4o-mini = 0,15 $ / 0,60 $ par 1M`.
- **UnknownModelError :** Exception personnalisée héritant de `WatcherError`, levée lorsque `calculate_cost()` reçoit un modèle absent de la matrice. Aucun repli silencieux.
- **Intégrité de la Matrice :** Invariants vérifiés par les tests : tous les taux > 0, taux de sortie >= taux d'entrée, minimum 20 modèles.

---

### 2. Décisions Architecturales (ADR)

#### ADR 1 : Migration du format par-1K vers par-1M
- **Option 1 (par-1K) :** Format legacy, petits décimaux (0,00015). Utilisé dans le cost.py initial.
- **Option 2 (par-1M) :** Aligné sur les pages de tarification actuelles d'OpenAI/Google/Anthropic. Nombres plus clairs (0,15 vs 0,00015).
- **Sélectionné :** Par-1M. Justification : Standard industriel, lisibilité, arithmétique simplifiée.

#### ADR 2 : UnknownModelError au lieu du repli par défaut
- **Option 1 (repli silencieux) :** Estimation du coût avec des taux par défaut. Masque les erreurs de configuration.
- **Option 2 (erreur stricte) :** Levée de `UnknownModelError` forçant l'ajout du modèle dans la matrice.
- **Sélectionné :** Erreur stricte. Justification : La précision FinOps exige que chaque modèle ait des taux connus.

#### ADR 3 : Matrice multi-fournisseurs au lieu d'un seul fournisseur
- **Option 1 (mono-fournisseur) :** Uniquement les modèles Gemini.
- **Option 2 (multi-fournisseur) :** 40 modèles couvrant OpenAI, Google, Anthropic, Meta, Mistral, DeepSeek, Cohere, Amazon.
- **Sélectionné :** Multi-fournisseur. Justification : Source unique de vérité pour le calcul des coûts.

---

### 3. Implémentation & Code

```python
# utils/cost.py — fonction calculate_cost
def calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    pricing = MODEL_PRICING.get(model.lower())
    if pricing is None:
        raise UnknownModelError(f"Unknown model '{model}'. ...")
    cost = (prompt_tokens / 1_000_000.0 * pricing["input_per_1m"]) + (
        completion_tokens / 1_000_000.0 * pricing["output_per_1m"])
    return round(cost, 6)
```

Intégration avec `LLMClient._parse_response()` existant :
```python
# llm_client.py lignes 196-200
report_dict["estimated_cost_usd"] = calculate_cost(
    model=self.model_name,
    prompt_tokens=prompt_tokens,
    completion_tokens=completion_tokens,
)
```

Validation :
```bash
cd projets/3_Wrapper_CLI
poetry run python -m pytest tests/test_cost.py -v
# 13 passed
```

---

### 4. Checklist & Livrables
1. [x] `exceptions.py` — Ajout de `UnknownModelError(WatcherError)`
2. [x] `utils/cost.py` — Matrice 40 modèles par-1M, insensible à la casse, erreur stricte
3. [x] `tests/test_cost.py` — 13 tests (modèles connus, inconnus, casse, intégrité, cas limites)
4. [x] 13 tests validés
5. [x] `tmp_metadata.json` — Métadonnées brutes écrites à la racine du projet
