# 📌 Séance 1.2 : Mise à Jour des Dépendances Poetry (Poetry Dependencies Update)
**Date :** 26 Juillet 2026

Le but de cette séance est d'adapter les dépendances du projet depuis un socle web (FastAPI) vers une application en ligne de commande (CLI). L'objectif est de s'appuyer sur des bibliothèques dédiées comme Typer, Rich, HTTPX, BeautifulSoup4 et Tenacity, tout en conservant Pydantic V2, via une approche déclarative.

---

### 1. 🎓 Nouveaux Concepts Introduits

*   **Declarative Dependency Management :** Approche de gestion des dépendances où l'état désiré du projet (bibliothèques et versions requises) est déclaré dans un fichier unique (ici `pyproject.toml`). C'est la source unique de vérité (*single source of truth*), contrairement aux installations manuelles ou scripts impératifs. L'outil (Poetry) se charge de résoudre et d'installer l'arbre de dépendances.

---

### 2. 🧠 Prises de Décisions & Choix Techniques

#### Dilemme A : Choix des bibliothèques pour l'interface CLI
*   **Option A.1 : Utiliser `argparse` natif et des `print()` standards**
    *   *Avantage/Inconvénient :* Zéro dépendance externe, mais le code devient très verbeux (beaucoup de boilerplate pour parser les arguments) et l'interface utilisateur manque d'attrait visuel.
*   **Option A.2 : Utiliser Typer et Rich (Retenue)**
    *   *Pourquoi ce choix ?* Typer se base sur les annotations de type (Type Hints) pour générer automatiquement la validation des arguments et l'aide, ce qui offre un code très lisible et robuste. Rich apporte des fonctionnalités de formatage terminal avancées (couleurs, barres de progression, tableaux) essentielles pour une expérience utilisateur premium.

#### Dilemme B : Outil HTTP pour la veille et les appels API
*   **Option B.1 : Conserver `requests` (Standard de facto)**
    *   *Avantage/Inconvénient :* Très connu mais synchrone par défaut et moins optimisé pour des requêtes modernes asynchrones si le besoin s'en fait sentir.
*   **Option B.2 : Adopter `httpx` (Retenue)**
    *   *Pourquoi ce choix ?* `httpx` offre une API compatible avec `requests` tout en supportant nativement l'asynchrone (HTTP/2, async/await). C'est un choix moderne plus robuste pour les interactions avec des API d'IA qui peuvent avoir des temps de latence variables.

---

### 3. 🛠️ Implémentation & Auto-Documentation

Les dépendances de production `fastapi` et `uvicorn` ont été retirées, et les bibliothèques suivantes ajoutées dans le fichier `pyproject.toml` :
*   `typer[all]` : Pour le CLI.
*   `rich` : Pour l'UI du terminal.
*   `httpx` : Pour les requêtes réseau.
*   `beautifulsoup4` : Pour le scraping et nettoyage HTML.
*   `tenacity` : Pour la résilience (backoff exponentiel).
*   `python-dotenv` : Pour la gestion des variables d'environnement.

#### Fichier de configuration :
```toml
# pyproject.toml
[tool.poetry.dependencies]
python = "^3.10"
pydantic = "^2.6.4"
typer = {extras = ["all"], version = "^0.12.3"}
rich = "^13.7.1"
httpx = "^0.27.0"
beautifulsoup4 = "^4.12.3"
tenacity = "^8.2.3"
python-dotenv = "^1.0.1"
```

#### Commandes de validation à exécuter localement :
```bash
poetry lock
poetry install
poetry run python -c "import typer; import rich; import httpx"
```
*Ces commandes regénèrent le fichier `poetry.lock` garantissant une installation déterministe, installent l'environnement, puis vérifient que les modules sont bien importables.*

---

#### Tests ajoutés

*   Aucun test spécifique ajouté à cette étape, la validation se fait par le test d'importation des dépendances.

### 4. 📌 Bilan du Jour

1.  **Fichier de configuration mis à jour** : `pyproject.toml` reflète le changement de scope (Web vers CLI).
2.  **Lockfile généré** : `poetry.lock` a été mis à jour de façon déterministe.
3.  **Validation d'environnement** : Les dépendances critiques (Typer, Rich, HTTPX) s'importent sans erreur, confirmant que l'environnement virtuel est prêt.
