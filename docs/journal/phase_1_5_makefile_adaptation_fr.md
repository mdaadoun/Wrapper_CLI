# 📌 Séance 1.5 : Adaptation du Makefile pour l'Interface CLI & Dépendances Typer
**Date :** 27 Juillet 2026

Le but de cette séance est d'adapter le point d'entrée d'automatisation (Makefile) du projet pour refléter le changement de contexte d'une application serveur web (Uvicorn / FastAPI) vers un outil en ligne de commande (CLI avec Typer). Elle traite également de la résolution d'une incompatibilité de dépendances entre Typer et Click.

---

### 1. 🎓 Nouveaux Concepts Introduits

*   **Unified Command Interface (Interface de Commande Unifiée) :** Modèle de conception d'automatisation dans lequel le `Makefile` demeure l'unique point d'entrée pour toutes les commandes de développement, masquant la complexité des outils sous-jacents (Poetry, Pytest, Typer, Docker).
*   **CLI vs Serveur Web (Typer vs Uvicorn) :** Un outil CLI s'exécute à la demande pour accomplir une tâche puis s'arrête, alors qu'un serveur Web tourne en boucle d'écoute HTTP. Les règles du Makefile doivent refléter cette différence sémantique.

---

### 2. 🧠 Prises de Décisions & Choix Techniques

#### Dilemme A : Remplacement de la cible `make dev` par `make run`
*   **Option A.1 : Conserver `make dev` et le rediriger vers le CLI**
    *   *Inconvénient :* Le terme `dev` ("development server") implique un processus persistent ou à rechargement automatique (`--reload`), ce qui est trompeur pour un CLI ponctuel.
*   **Option A.2 : Remplacer par `make run` avec gestion des arguments `ARGS` (Retenue)**
    *   *Pourquoi ce choix ?* `make run` est sémantiquement exact pour l'exécution d'un binaire ou script CLI. La transmission de variables `$(ARGS)` permet de passer des fanions (flags) et sous-commandes de manière fluide, ex: `make run ARGS="--help"`.

#### Dilemme B : Résolution de l'erreur `TypeError` Typer/Click
*   **Option B.1 : Verrouiller Click sur une version antérieure (< 8.2)**
    *   *Inconvénient :* Crée une dette technique en bloquant les mises à jour de sécurité et de fonctionnalités de Click.
*   **Option B.2 : Mettre à jour Typer vers la version 0.15+ / 0.27+ (Retenue)**
    *   *Pourquoi ce choix ?* `poetry add "typer[all]@latest"` résout l'incompatibilité de signature de méthode `make_metavar()` avec Click 8.2+ tout en maintenant le projet sur des versions modernes.

---

### 3. 🛠️ Implémentation & Auto-Documentation

#### Modification du `Makefile` :
```makefile
run:
	poetry run python -m src.ai_watcher.main $(ARGS)
```

#### Commandes de validation à exécuter localement :
```bash
make run ARGS="--help"
```
*Succès attendu : Affichage propre du menu d'aide Rich / Typer avec statut de sortie 0.*

---

#### Tests ajoutés

*   `tests/test_cli.py` : Un test avec `CliRunner` de Typer valide l'exécution sans erreur du menu d'aide `--help` et l'affichage des informations principales du CLI.

---

### 4. 📌 Bilan du Jour

1.  **Makefile adapté :** Remplacement de `make dev` par `make run ARGS="..."`.
2.  **Mise à jour Poetry :** Typer mis à jour vers la version récente compatible Click 8.2+.
3.  **Validation E2E :** `make run ARGS="--help"` s'exécute parfaitement.
