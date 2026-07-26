# 📌 Séance 1.4 : Gestion des Secrets & Variables d'Environnement (Secrets & Environment Configuration)
**Date :** 26 Juillet 2026

Le but de cette séance est de sécuriser la gestion de la configuration, en particulier la clé d'API Gemini (`GEMINI_API_KEY`), en séparant strictement le code des variables d'environnement. Cela permet d'éviter toute fuite d'information et d'assurer que l'application soit configurable sans modifier le code source.

---

### 1. 🎓 Nouveaux Concepts Introduits

*   **12-Factor App (Configuration) :** Méthodologie stipulant une séparation stricte entre le code et la configuration (tout ce qui varie entre les déploiements : clés API, ports, URLs). La configuration doit être stockée dans l'environnement.
*   **detect-secrets :** Hook pre-commit de sécurité (Yelp) qui analyse le code avant chaque commit pour bloquer l'ajout accidentel de secrets (clés API, mots de passe, tokens) en dur dans le dépôt Git.

---

### 2. 🧠 Prises de Décisions & Choix Techniques

#### Dilemme A : Méthode de chargement des variables d'environnement
*   **Option A.1 : Utiliser `os.environ.get()` partout dans le code**
    *   *Avantage/Inconvénient :* Standard, mais n'offre aucune validation de type (un port deviendra une string au lieu d'un int) et éparpille la logique de configuration, ce qui la rend difficile à maintenir. Ne permet pas d'échouer rapidement (Fail Fast) si une variable manque.
*   **Option A.2 : Pydantic V2 avec `pydantic-settings` (Retenue)**
    *   *Pourquoi ce choix ?* Pydantic valide et cast automatiquement les types. Il centralise toutes les variables dans une classe unique (`Settings`), et lève une erreur explicite au démarrage (Fail Fast) s'il manque une clé critique comme `GEMINI_API_KEY`. C'est robuste, fortement typé, et offre une excellente DX (Developer Experience). L'utilisation de `SecretStr` masque la valeur de la clé dans les logs Python.

---

### 3. 🛠️ Implémentation & Auto-Documentation

*   Ajout d'un fichier `.env.example` à la racine contenant un modèle des variables requises (`GEMINI_API_KEY`, `MODEL_NAME`, `MAX_TOKENS`).
*   Ajout de `.env` dans le `.gitignore` pour éviter les fuites.
*   Modification de `src/ai_watcher/config.py` pour définir la classe `Settings` validant que `GEMINI_API_KEY` est fournie. Une fonction `get_settings()` encapsule l'instanciation pour rattraper l'erreur Pydantic par défaut (`ValidationError`) et lancer une `ConfigurationError` propre au domaine.

#### Commandes de validation à exécuter localement :
```bash
poetry run python -m pytest
```
*Le lancement des tests vérifie la présence et le comportement de ce module. Sans fichier `.env` ou variable déclarée, le test unitaire s'assure qu'une erreur `ConfigurationError` est bien levée.*

---

#### Tests ajoutés

*   `test_config.py` : Un nouveau fichier de tests unitaires a été créé pour vérifier la levée de la `ConfigurationError` lorsque la variable `GEMINI_API_KEY` est absente de l'environnement, et pour s'assurer du chargement correct quand elle est présente (via `monkeypatch` de pytest).

### 4. 📌 Bilan du Jour

1.  **Fichier `.env.example` disponible** : Modèle fourni pour les nouveaux contributeurs.
2.  **`pydantic-settings` installé et configuré** : La classe `Settings` centralise et sécurise la configuration.
3.  **Tests unitaires au vert** : Vérification du cas passant et du cas d'erreur de la configuration.
