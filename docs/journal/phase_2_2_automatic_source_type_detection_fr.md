# 📌 Séance 2.2 : Détection Automatique du Type de Source et Ergonomie CLI
**Date :** 27 Juillet 2026

Cette séance est consacrée à la mise en place de la logique de détection automatique des sources (`URL`, `FILE`, `TEXT`) et à la gestion stricte des entrées vides via l'exception `EmptySourceError`.

---

### 1. 🎓 Nouveaux Concepts Introduits

*   **User Ergonomics (Ergonomie Utilisateur / Developer Experience) :** Principe de conception visant à minimiser l'effort cognitif et la friction d'utilisation en inférant automatiquement l'intention de l'utilisateur (URL, fichier ou texte brut) sans l'obliger à spécifier un fanion dans les cas d'usage courants.
*   **Fail-Fast Input Validation :** Stratégie de validation précoce qui rejette immédiatement les entrées invalides (chaînes vides ou constituées uniquement d'espaces) avec une interruption propre (Exit Code 1) avant d'engager des traitements lourds (I/O réseau ou système de fichiers).

---

### 2. 🧠 Prises de Décisions & Choix Techniques

#### Dilemme A : Emplacement de la logique de détection
*   **Option A.1 : Placer toute la logique if/else directement dans la fonction `scan` de `main.py`**
    *   *Inconvénient :* Viole le Single Responsibility Principle (SRP) en mélangeant le routage CLI Typer et la logique métier de détection de source. Rend la détection difficile à tester unitairement.
*   **Option A.2 : Encapsuler la logique dans un module dédié `src/ai_watcher/core/detector.py` (Retenue)**
    *   *Pourquoi ce choix ?* Isole la fonction pure `detect_source_type()` et l'énumération `SourceType`, facilitant des tests unitaires complets et indépendants du framework CLI Typer.

#### Dilemme B : Heuristique de détection des types
*   **Option B.1 : Analyse par expression régulière complexe (Regex)**
    *   *Inconvénient :* Complexité accrue, risque d'erreurs d'évaluation sur les chemins relatifs et ralentissement de l'inférence.
*   **Option B.2 : Vérification ordonnée simple (`startswith("http")` -> `Path.exists()` -> `TEXT`) (Retenue)**
    *   *Pourquoi ce choix ?* Approche déterministe et performante :
        1. Si la chaîne commence par `http://` ou `https://` -> `SourceType.URL`.
        2. Si le chemin existe sur le système de fichiers et pointe vers un fichier (`Path.is_file()`) -> `SourceType.FILE`.
        3. Sinon -> `SourceType.TEXT`.

---

### 3. 🛠️ Implémentation & Auto-Documentation

Module `src/ai_watcher/core/detector.py` :

```python
def detect_source_type(
    source: str,
    force_text: bool = False,
    force_file: bool = False,
    force_url: bool = False,
) -> SourceType:
    if not source or not source.strip():
        raise EmptySourceError("Source cannot be empty or whitespace-only.")
    ...
```

Interception propre dans `src/ai_watcher/main.py` :

```python
try:
    source_type = detect_source_type(source, text, file, url)
    typer.echo(f"Scanning source [{source_type.value} mode]: {source}")
except WatcherError as err:
    typer.secho(f"Error: {err}", fg=typer.colors.RED, err=True)
    raise typer.Exit(code=1) from err
```

#### Commandes de validation à exécuter localement :
```bash
poetry run python -m src.ai_watcher.main scan "https://example.com"
poetry run python -m src.ai_watcher.main scan "pyproject.toml"
poetry run python -m src.ai_watcher.main scan "Raw text payload"
poetry run python -m src.ai_watcher.main scan ""
```
*Le cas de la chaîne vide doit renvoyer l'erreur `Error: Source cannot be empty or whitespace-only.` avec un code de sortie 1.*

---

#### Tests ajoutés

*   `tests/test_detector.py` : Tests unitaires dédiés pour la fonction `detect_source_type()` couvrant les URL, chemins de fichiers réels (avec `tmp_path`), textes bruts, surcharges forcées (`-t`, `-f`, `-u`) et levée de `EmptySourceError`.
*   `tests/test_cli.py` : Tests d'intégration CLI vérifiant l'affichage des 3 modes auto-détectés et le code de retour `1` en cas de source vide.

---

### 4. 📌 Bilan du Jour

1.  **Détection automatique opérationnelle :** Identification transparente des URL, fichiers et textes bruts.
2.  **Validation d'entrée Fail-Fast :** Rejet explicite des sources vides avec Exit Code 1.
3.  **Qualité & Couverture :** 17 tests unitaires au vert (95.95% de couverture, 0 erreur Mypy/Ruff).
