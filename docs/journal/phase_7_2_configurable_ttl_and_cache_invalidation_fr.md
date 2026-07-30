# Journal de Dev Session 7.2 : TTL Configurable et Invalidation de Cache

**Date :** 2026-07-30

Implémentation des contrôles de durée de vie (TTL) configurables, des options CLI (`--cache-ttl` et `--no-cache`), et de la purge automatique au démarrage des enregistrements de cache expirés dans `ContentCache`.

---

### 1. Concepts Introduits

- **Durée de vie configurable (TTL Configurable) :** Évaluation dynamique du TTL permettant un contrôle fin par l'utilisateur et le système sur la fraîcheur des données versus l'économie de coûts.
- **Invalidation et Purge Automatique du Cache :** Ramasse-miettes automatique en arrière-plan nettoyant les entrées expirées ou corrompues dès l'initialisation de `ContentCache`.
- **Flags CLI de Contrôle du Cache :** Options `--cache-ttl <secondes>` (3600s par défaut) pour personnaliser l'expiration des entrées et `--no-cache` pour contourner totalement la lecture et l'écriture du cache sur disque.

---

### 2. Décisions d'Architecture (ADR)

#### ADR 1 : TTL Dynamique et Surchargeable dans ContentCache
- **Option 1 (Hardcoder un TTL d'entrée fixe) :** Durée de vie stricte de 24 heures sans flexibilité pour l'appelant.
- **Option 2 (Sélectionnée - Supporter un TTL par défaut et la surcharge à l'exécution) :** Conserver un TTL par défaut de 3600s tout en permettant aux appelants de passer un `ttl` personnalisé à `cache.get(content_hash, ttl=...)`.
- **Raisonnement :** Permet aux utilisateurs du CLI de forcer des contraintes de fraîcheur ad-hoc (ex: `--cache-ttl 0`) sans corrompre ni altérer les métadonnées enregistrées.

#### ADR 2 : Auto-Purge au Démarrage des Entrées Expirées
- **Option 1 (Commande de purge manuelle) :** Exiger des utilisateurs qu'ils invoquent périodiquement une commande de nettoyage.
- **Option 2 (Sélectionnée - Purge automatique à l'initialisation) :** Déclencher `purge_expired()` automatiquement dans `ContentCache.__init__()`.
- **Raisonnement :** Garantit que la taille du cache sur disque reste bornée et évite l'accumulation d'entrées obsolètes au fil du temps.

#### ADR 3 : Modes d'Exécution Doubles `--no-cache` vs `--cache-ttl 0`
- **Option 1 (Flag unique de rafraîchissement forcé) :** Écraser le cache à chaque réexécution forcée.
- **Option 2 (Sélectionnée - Séparer `--no-cache` de `--cache-ttl 0`) :** `--no-cache` évite la lecture et l'écriture pour préserver l'état sur disque, tandis que `--cache-ttl 0` force la réanalyse et met à jour le cache.
- **Raisonnement :** Offre un contrôle opérationnel très fin pour le test, le débogage et la mise à jour persistante du cache.

---

### 3. Implémentation & Code

```python
# src/ai_watcher/utils/cache.py
class ContentCache:
    def __init__(self, cache_file: Optional[Path | str] = None, auto_purge: bool = True) -> None:
        ...
        if auto_purge and self.cache_file.exists():
            self.purge_expired()

    def get(self, content_hash: str, ttl: Optional[int] = None) -> Optional[AnalysisReport]:
        ...
        effective_ttl = ttl if ttl is not None else entry.get("ttl", 3600)
        if effective_ttl <= 0:
            return None
        ...

    def purge_expired(self) -> int:
        ...
```

Validation :
```bash
cd projets/3_Wrapper_CLI
./.venv/bin/pytest tests/test_cache.py tests/test_cli.py -v
```

---

### 4. Checklist de Session & Livrables

1. [x] Mise à jour du TTL par défaut dans `src/ai_watcher/config.py` (`cache_ttl_seconds = 3600`).
2. [x] Implémentation de `purge_expired()`, de l'initialisation `auto_purge`, et de la surcharge du TTL dans `src/ai_watcher/utils/cache.py`.
3. [x] Ajout des flags `--cache-ttl` et `--no-cache` à la commande `scan` dans `src/ai_watcher/main.py`.
4. [x] Extension de la suite de tests dans `tests/test_cache.py` atteignant 100% de couverture sur l'invalidation du cache et les flags CLI.
5. [x] Enregistrement des définitions de tests dans `dashboard/src/app/page.tsx` pour l'interface du tableau de bord.
