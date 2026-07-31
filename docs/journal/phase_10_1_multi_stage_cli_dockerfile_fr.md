# Journal de Développement Session 10.1 : Adaptation Dockerfile CLI Multi-Stage

**Date :** 31-07-2026

Adaptation du Dockerfile multi-stage pour empaqueter l'application AI Watcher en tant que conteneur CLI exécutable et non-privilégié au lieu d'un serveur web. Configuration de l'étape builder pour compiler les dépendances via Poetry, mise en place de l'étape runtime avec un surcoût minimal, remplacement du CMD serveur par un ENTRYPOINT explicite pointant vers le module CLI Typer, et vérification des contrôles de sécurité avec l'exécution sous l'utilisateur non-root `appuser`.

---

### 1. Concepts Introduits

- **Paradigme de Conteneur CLI Exécutable** : Utilisation de la directive Docker `ENTRYPOINT` au lieu de `CMD` afin que le conteneur agisse directement comme un exécutable en ligne de commande recevant dynamiquement ses arguments lors du `docker run`.
- **Optimisation de Build Multi-Stage** : Séparation des dépendances de build (Poetry, chaîne d'outils de compilation) dans l'étape builder par rapport aux artefacts d'exécution (`.venv`, code source Python) pour obtenir une empreinte d'image légère (< 250 Mo).
- **Exécution Non-Privilégiée & Moindre Privilège** : Exécution des processus du conteneur sous un utilisateur système non-root dédié (`appuser:1000`) et un groupe (`appgroup`) pour renforcer la sécurité au runtime.

---

### 2. Décisions d'Architecture (ADR)

#### ADR 1 : ENTRYPOINT `["python", "-m", "src.ai_watcher.main"]` avec arguments par défaut CMD
- **Option 1** : Conserver `CMD ["uvicorn", ...]`.
- **Option 2 (Sélectionnée)** : `ENTRYPOINT ["python", "-m", "src.ai_watcher.main"]` avec `CMD ["scan", "--help"]`.
- **Raisonnement** : Permet aux développeurs et aux scripts CI/CD d'invoquer les commandes conteneurisées sans friction (ex: `docker run ai-watcher scan "text" --demo`) tout en fournissant une aide par défaut lorsqu'exécuté sans argument.

#### ADR 2 : Renforcement de Sécurité Non-root (`appuser:1000`)
- **Option 1** : Exécuter en tant qu'utilisateur root par défaut.
- **Option 2 (Sélectionnée)** : Groupe système explicite `appgroup` et utilisateur `appuser` avec propriété des fichiers via `chown`.
- **Raisonnement** : Prévient les risques d'évasion de conteneur en appliquant le principe de moindre privilège au niveau du système d'exploitation.

---

### 3. Implémentation & Code

Voir `Dockerfile`, `tests/test_dockerfile.py`, `.dockerignore`, et `Makefile`.

---

### 4. Liste de Contrôle & Livrables de la Session

- [x] Adaptation du Dockerfile multi-stage pour l'entrypoint CLI et suppression des résidus de serveur web `EXPOSE`/`HEALTHCHECK`.
- [x] Création de la suite de tests unitaires `tests/test_dockerfile.py` couvrant la structure multi-stage, l'entrypoint, les privilèges utilisateur et les règles `.dockerignore`.
- [x] Validation de 100 % de réussite des tests sur 190 items au total.
