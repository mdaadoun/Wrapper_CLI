# Journal de Dev Session 7.1 : Persistance du Hash de Contenu SHA-256

**Date :** 2026-07-30

Implémentation du hachage de contenu SHA-256 et du système de cache JSON local persistant sur disque pour contourner les appels d'inférence LLM pour les contenus identiques.

---

### 1. Concepts Introduits

- **Hachage de Contenu SHA-256 :** Calcul d'empreinte numérique idempotente pour le texte extrait afin d'identifier de manière unique les contenus identiques.
- **Persistance de Cache JSON Local :** Recherche de cache à latence nulle stockée dans `~/.cache/ai_watcher/cache.json` évitant la consommation de crédits d'API LLM.
- **Validation de Fraîcheur TTL (Time-to-Live) :** Invalidation automatique des enregistrements d'analyse obsolètes basée sur l'horodatage de création.

---

### 2. Décisions d'Architecture (ADR)

#### ADR 1 : Module Utilitaire ContentCache Découplé dans `utils/cache.py`
- **Option 1 (Intégrer la logique de cache directement dans le CLI principal ou dans LLMClient) :** Logique de cache fortement couplée.
- **Option 2 (Sélectionnée - Module utilitaire ContentCache dédié) :** Découpler la gestion du cache de l'interface CLI et de la logique client LLM dans `utils/cache.py`.
- **Raisonnement :** Respecte le principe de responsabilité unique (SRP) et permet de tester unitairement la persistance de manière isolée.

#### ADR 2 : Hachage du Contenu Brut Extrait vs Chemin Source
- **Option 1 (Hacher la chaîne source comme le chemin de fichier ou l'URL) :** Clé de cache basée sur l'identifiant de la source.
- **Option 2 (Sélectionnée - Hacher le texte extrait brut) :** Calculer l'empreinte SHA-256 directement sur le texte brut.
- **Raisonnement :** Garantit une vraie idempotence de contenu, même si le même texte provient de fichiers ou d'URLs différents.

#### ADR 3 : Repli Gracieux en Cas de Corruption du Cache
- **Option 1 (Lever une exception si le fichier de cache JSON est corrompu) :** Échec de l'exécution lors de la lecture du cache.
- **Option 2 (Sélectionnée - Gestion défensive des erreurs renvoyant un cache miss) :** Envelopper les I/O de fichiers et le parsing Pydantic dans des blocs try-except.
- **Raisonnement :** Évite les plantages du CLI lors de la lecture d'un fichier de cache invalide ou corrompu.

---

### 3. Implémentation & Code

```python
# src/ai_watcher/utils/cache.py
def compute_content_hash(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()

class ContentCache:
    def get(self, content_hash: str) -> Optional[AnalysisReport]:
        cache_data = self._load()
        entry = cache_data.get(content_hash)
        if not entry:
            return None
        ...
        report_dict["is_cached"] = True
        return AnalysisReport(**report_dict)
```

Validation :
```bash
cd projets/3_Wrapper_CLI
./.venv/bin/pytest tests/test_cache.py tests/test_cli.py -v
```

---

### 4. Checklist de Session & Livrables

1. [x] `src/ai_watcher/utils/cache.py` créé avec la classe `ContentCache` et le helper `compute_content_hash`.
2. [x] Intégration de la recherche et persistance du cache dans la commande scan de `src/ai_watcher/main.py`.
3. [x] Ajout du badge indicateur `[CACHE HIT]` dans le formateur console dans `src/ai_watcher/formatters/console.py`.
4. [x] Création de la suite de tests unitaires dans `tests/test_cache.py` atteignant 100% de couverture de code sur le module cache.
