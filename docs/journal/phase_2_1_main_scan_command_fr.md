# 📌 Séance 2.1 : Implémentation de la Commande Principale `scan` via Typer
**Date :** 27 Juillet 2026

Cette séance est consacrée au développement de la commande principale `scan` dans `src/ai_watcher/main.py`. L'objectif est de mettre en place le routage déclaratif des arguments et des options CLI pour autoriser la saisie d'une source (texte brut, fichier, URL) de manière implicite ou explicite.

---

### 1. 🎓 Nouveaux Concepts Introduits

*   **Declarative CLI Framework (Framework CLI Déclaratif) :** Approche moderne de création d'interfaces en ligne de commande (implémentée par Typer) où le type des arguments, leur caractère obligatoire et la documentation du menu `--help` sont automatiquement inférés depuis les annotations de type (`Type Hints`) et docstrings Python.
*   **Argument Positionnel vs Option CLI :**
    *   *Argument positionnel (`source`) :* Valeur obligatoire transmise directement sans fanion.
    *   *Option CLI (`--text / -t`, `--file / -f`, `--url / -u`) :* Fanions optionnels permettant de forcer un mode de traitement explicite.

---

### 2. 🧠 Prises de Décisions & Choix Techniques

#### Dilemme A : Structure de l'application Typer (Commande unique vs Sous-commandes)
*   **Option A.1 : Utiliser Typer en mode commande unique (sans callback)**
    *   *Inconvénient :* Dans ce mode, Typer exécute directement la fonction au niveau racine sans exiger le mot-clé `scan` (ex: `python main.py "Hello"` au lieu de `python main.py scan "Hello"`), ce qui restreint l'extensibilité future vers d'autres sous-commandes (ex: `history`, `config`, `export`).
*   **Option A.2 : Utiliser un callback principal `@app.callback()` avec la sous-commande `@app.command()` `scan` (Retenue)**
    *   *Pourquoi ce choix ?* Permet de conserver le mot-clé explicite `scan` tout en réservant la racine pour d'autres commandes futures de l'outil CLI.

#### Dilemme B : Gestion des modes de saisie (`text`, `file`, `url`)
*   **Option B.1 : Exiger obligatoirement un fanion (ex: `scan --mode text "Hello"`)**
    *   *Inconvénient :* Augmente la friction d'utilisation au quotidien pour le développeur.
*   **Option B.2 : Autoriser la détection automatique par défaut avec surcharge par drapeaux booléens courts (`-t`, `-f`, `-u`) (Retenue)**
    *   *Pourquoi ce choix ?* Améliore l'ergonomie utilisateur (DX) tout en permettant à l'utilisateur de désamboguer manuellement une source si nécessaire.

---

### 3. 🛠️ Implémentation & Auto-Documentation

Le point d'entrée `src/ai_watcher/main.py` intègre la commande `scan` :

```python
@app.command()
def scan(
    source: str = typer.Argument(..., help="Source to scan: raw text, file path, or URL."),
    text: bool = typer.Option(False, "--text", "-t", help="Force source mode to raw text."),
    file: bool = typer.Option(False, "--file", "-f", help="Force source mode to file path."),
    url: bool = typer.Option(False, "--url", "-u", help="Force source mode to web URL."),
) -> None:
    ...
```

#### Commandes de validation à exécuter localement :
```bash
poetry run python -m src.ai_watcher.main scan "Hello World"
make run ARGS="scan --help"
```

---

#### Tests ajoutés

*   `tests/test_cli.py` : Ajout de 5 cas de tests unitaires couvrant :
    - L'aide générale du CLI (`--help`).
    - L'aide spécifique de la commande (`scan --help`).
    - Le mode automatique par défaut.
    - L'activation forcée de chacun des fanions (`-t`, `--file`, `-u`).

---

### 4. 📌 Bilan du Jour

1.  **Commande `scan` opérationnelle :** Prise en charge de l'argument positionnel `source` et des options `-t`, `-f`, `-u`.
2.  **Validation Typer :** Le menu d'aide `--help` est généré automatiquement avec les descriptions et raccourcis.
3.  **Suite de tests validée :** 9 tests au vert avec un taux de couverture de 97.83%.
