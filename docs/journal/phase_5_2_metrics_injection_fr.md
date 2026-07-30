# Journal de Développement 5.2 : Injection des Métriques dans le Rapport

**Date :** 2026-07-30

Amélioration de `LLMClient.analyze()` pour chronométrer précisément les requêtes API via `time.perf_counter()`, extraire les nombres de tokens d'entrée/sortie depuis les réponses (schémas Gemini et OpenAI), calculer les coûts via `cost.py` et renseigner les métriques FinOps dans l'objet `AnalysisReport`.

---

### 1. Concepts Introduits

- **Instrumentation Transparente des Métriques :** Mesure du temps de réponse API par compteurs haute précision (`time.perf_counter()`) et extraction de la consommation de tokens au niveau de la couche transport client.
- **Intégration du Calculateur FinOps :** Mapping dynamique des tokens d'entrée/sortie vers l'estimation des coûts USD basée sur la grille tarifaire par modèle.

---

### 2. Décisions d'Architecture (ADR)

#### ADR 1 : Extraction des métriques au niveau du client LLM
- **Option 1 (Décorateur de niveau supérieur) :** Mesurer la latence et les tokens dans la couche CLI ou l'orchestrateur.
- **Option 2 (Sélectionnée - Frontière Client) :** Intégrer `perf_counter()` et le parsing d'usage dans `LLMClient.analyze()` avant l'instanciation de `AnalysisReport`.
- **Raisonnement :** Maintient la logique métier découplée du suivi des tokens tout en garantissant que chaque rapport généré porte des métriques exactes de latence, tokens et coût.

---

### 3. Implémentation & Code

```python
# src/ai_watcher/clients/llm_client.py
start_time = time.perf_counter()
# ... appel réseau ...
elapsed_time = round(time.perf_counter() - start_time, 4)

report_dict["prompt_tokens"] = prompt_tokens
report_dict["completion_tokens"] = completion_tokens
report_dict["total_tokens"] = prompt_tokens + completion_tokens
report_dict["execution_time_seconds"] = elapsed_time
report_dict["estimated_cost_usd"] = calculate_cost(
    model=self.model_name,
    prompt_tokens=prompt_tokens,
    completion_tokens=completion_tokens,
)
```

Validation :
```bash
cd projets/3_Wrapper_CLI
./.venv/bin/pytest tests/test_llm_client.py -v
```

---

### 4. Checklist & Livrables de la Session
1. [x] `LLMClient.analyze()` chronomètre l'exécution via `time.perf_counter()`
2. [x] `LLMClient._parse_response()` extrait les compteurs de tokens pour Gemini et OpenAI
3. [x] `calculate_cost()` calcule le coût USD estimé et l'injecte dans `AnalysisReport`
4. [x] Suite de tests unitaires validée avec 100% de couverture sur `LLMClient`
