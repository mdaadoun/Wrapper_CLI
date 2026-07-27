# 📌 Séance 1.3 : Structure de Répertoire Modulaire (Modular Directory Structure)
**Date :** 26 Juillet 2026

Le but de cette séance est de mettre en place une structure de paquet Python propre et modulaire (`src/ai_watcher/`), respectant le principe de responsabilité unique (SRP). L'architecture sépare clairement l'interface CLI, la configuration, la logique métier et l'accès réseau.

---

### 1. 🎓 Nouveaux Concepts Introduits

*   **Single Responsibility Principle (SRP) :** Principe de conception logicielle (le "S" de SOLID) stipulant que chaque classe, module ou fonction ne doit avoir qu'une seule raison de changer. Ici, la logique de formatage est séparée de la logique d'extraction, elle-même séparée de la gestion du client API.
*   **Domain Exceptions :** Pratique consistant à définir des classes d'exceptions personnalisées (ex. `WatcherError`, `ExtractionError`) spécifiques au domaine métier de l'application, plutôt que de lever des erreurs génériques Python (`ValueError` ou `Exception`).

---

### 2. 🧠 Prises de Décisions & Choix Techniques

#### Dilemme A : Architecture du projet (Monolithe vs Modulaire)
*   **Option A.1 : Un fichier unique (`main.py`)**
    *   *Avantage/Inconvénient :* Rapide à écrire pour un script, mais devient impossible à maintenir, à tester unitairement et à relire dès que le projet dépasse quelques centaines de lignes.
*   **Option A.2 : Structure de paquet modulaire selon les spécifications (Retenue)**
    *   *Pourquoi ce choix ?* En découpant en sous-dossiers (`core/`, `clients/`, `utils/`, `formatters/`), chaque composant devient isolable et testable indépendamment. Cela prépare le projet à évoluer sainement, tout en restant compréhensible pour de nouveaux contributeurs.

---

### 3. 🛠️ Implémentation & Auto-Documentation

La structure de répertoire suivante a été créée dans `src/ai_watcher/` :
*   `__init__.py` : Marqueur de paquet Python.
*   `main.py` : Point d'entrée de l'interface CLI (Typer).
*   `config.py` : Chargement de la configuration via `pydantic-settings` et `.env`.
*   `exceptions.py` : Exceptions du domaine personnalisées.
*   `core/` : Logique métier (extraction, analyse).
*   `clients/` : Client LLM encapsulé.
*   `utils/` : Utilitaires transverses (calculateur de coûts, cache).
*   `formatters/` : Rendu Markdown et terminal (Rich).

#### Commandes de validation à exécuter localement :
```bash
poetry run ruff check --fix .
poetry run ruff format .
make lint
poetry run python -c "from src.ai_watcher import main"
```
*Le linter et le formateur s'assurent que les nouveaux fichiers respectent le standard (les imports ont été réordonnés automatiquement). L'import de `main` vérifie que la structure du paquet Python est correcte.*

---

#### Tests ajoutés

*   Aucun test spécifique n'est ajouté ici, la structure vide est validée par le typage strict (`make lint`).

### 4. 📌 Bilan du Jour

1.  **Squelette d'architecture créé** : Les modules clés sont instanciés avec leurs fichiers `__init__.py`.
2.  **Point d'entrée fonctionnel** : `main.py` initialise l'application Typer.
3.  **Validation du pipeline** : Le linter et l'interpréteur Python valident l'arborescence sans erreur.
