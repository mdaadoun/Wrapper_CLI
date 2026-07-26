# 🗺️ Feuille de Route Détaillée (Roadmap) : Wrapper CLI de Veille IA

Cette feuille de route détaille l'ordre chronologique des étapes pour réaliser le **Projet 3 : Wrapper CLI de Veille IA Automatisée**, avec pour chaque étape les concepts théoriques abordés, la progression et les critères de validation.

**Base de départ :** Socle d'ingénierie hérité du Projet 2 (AIPE Framework : Poetry, Pre-commit, Ruff, Mypy, Pytest, Docker multi-stage, Makefile).

---

## 📊 Tableau de Bord Synthétique des Phases

```text
Phase 1 : Adaptation Socle ──> Phase 2 : CLI Squelette ──> Phase 3 : Ingestion ──> Phase 4 : Client LLM ──> Phase 5 : FinOps ──> Phase 6 : Rich UI ──> Phase 7 : Cache ──> Phase 8 : Résilience ──> Phase 9 : Tests ──> Phase 10 : Docker & Livraison
     (⏳ À faire)              (⏳ À faire)            (⏳ À faire)          (⏳ À faire)          (⏳ À faire)       (⏳ À faire)        (⏳ À faire)       (⏳ À faire)         (⏳ À faire)        (⏳ À faire)
```

---

## Phase 1 : Adaptation du Socle Technique — ⏳ À faire
*Objectif : Transformer le blueprint AIPE hérité en projet CLI autonome avec les bonnes dépendances.*

### Étape 1.1 : Nettoyage du code hérité — ⏳ À faire
*   **Description :** Supprimer le code spécifique au projet 2 (routes FastAPI dans `src/`, tests liés au framework AIPE, dashboard Flask). Conserver uniquement la structure de base : `pyproject.toml`, `.pre-commit-config.yaml`, `Makefile`, `Dockerfile`, `.gitignore`, `.vscode/`.
*   **Concept clé :** Réutilisation d'un blueprint d'ingénierie — on ne repart pas de zéro, on adapte un socle éprouvé.
*   **Critère de validation :** Le dossier `src/` est vide (hormis `__init__.py`), le dossier `tests/` est vide, et `make lint` s'exécute sans erreur sur le projet vide.

### Étape 1.2 : Mise à jour des dépendances Poetry — ⏳ À faire
*   **Description :** Adapter `pyproject.toml` : remplacer les dépendances de production (FastAPI, Uvicorn) par celles du CLI (`typer[all]`, `rich`, `httpx`, `beautifulsoup4`, `tenacity`, `python-dotenv`). Conserver Pydantic V2 (déjà présent). Régénérer le `poetry.lock` via `poetry lock && poetry install`.
*   **Concept clé :** Gestion déclarative des dépendances — le fichier `pyproject.toml` est la seule source de vérité.
*   **Critère de validation :** La commande `poetry install` s'exécute sans erreur et `poetry run python -c "import typer; import rich; import httpx"` réussit.

### Étape 1.3 : Création de l'arborescence modulaire — ⏳ À faire
*   **Description :** Mettre en place la structure de paquets définie dans le cahier des charges (ST-03) :
    ```
    src/ai_watcher/
    ├── __init__.py
    ├── main.py          # Point d'entrée CLI (Typer)
    ├── config.py        # Settings Pydantic + chargement .env
    ├── exceptions.py    # Exceptions métier personnalisées
    ├── core/            # Logique métier (extractor, analyzer)
    ├── clients/         # Client LLM encapsulé
    ├── utils/           # Cache, calculatrice de coûts
    └── formatters/      # Rendu Rich et export Markdown
    ```
*   **Concept clé :** Architecture modulaire à responsabilité unique — chaque dossier a un rôle précis et testable indépendamment.
*   **Critère de validation :** Tous les fichiers `__init__.py` sont créés, `make lint` passe sur la structure vide, et l'import `from src.ai_watcher import main` fonctionne.

### Étape 1.4 : Configuration des secrets et variables d'environnement — ⏳ À faire
*   **Description :** Créer le fichier `.env.example` à la racine avec les variables attendues (`OPENAI_API_KEY`, `MODEL_NAME`, `MAX_TOKENS`). Implémenter `config.py` avec `pydantic-settings` ou `python-dotenv` pour charger et valider ces variables. S'assurer que `.env` est dans `.gitignore`.
*   **Concept clé :** Séparation stricte configuration/code (12-Factor App) et prévention des fuites de secrets.
*   **Critère de validation :** Lancer l'application sans fichier `.env` lève une erreur explicite. Le hook `detect-secrets` bloque toute tentative de commit d'une clé en dur.

### Étape 1.5 : Adaptation du Makefile — ⏳ À faire
*   **Description :** Mettre à jour les cibles du Makefile pour le contexte CLI : remplacer `make dev` (qui lançait Uvicorn) par `make run` (qui exécute la commande CLI principale). Ajouter `make run ARGS="--help"` comme raccourci de démonstration.
*   **Concept clé :** Interface de commande unifiée — le Makefile reste le point d'entrée unique pour tout développeur.
*   **Critère de validation :** `make run ARGS="--help"` affiche l'aide Typer du CLI sans erreur.

---

## Phase 2 : Squelette CLI avec Typer — ⏳ À faire
*Objectif : Créer le point d'entrée CLI fonctionnel avec le routage des arguments et options.*

### Étape 2.1 : Commande principale `scan` — ⏳ À faire
*   **Description :** Implémenter dans `main.py` une application Typer avec une commande `scan` acceptant un argument positionnel `source` (le texte, chemin de fichier ou URL à analyser). Ajouter les options `--text / -t`, `--file / -f`, `--url / -u` pour le mode explicite de saisie.
*   **Concept clé :** Framework CLI déclaratif — Typer infère automatiquement l'aide, la validation des types et les messages d'erreur à partir des annotations Python.
*   **Critère de validation :** `poetry run python -m src.ai_watcher.main scan "Hello World"` affiche un message de confirmation sans crash. `--help` documente correctement toutes les options.

### Étape 2.2 : Détection automatique du type de source — ⏳ À faire
*   **Description :** Implémenter dans `main.py` une logique de détection : si la source commence par `http://` ou `https://`, c'est une URL ; si elle correspond à un chemin de fichier existant, c'est un fichier ; sinon, c'est du texte brut. Lever une exception propre `EmptySourceError` si la source est vide ou constituée uniquement d'espaces.
*   **Concept clé :** Ergonomie utilisateur — la détection automatique élimine le besoin de drapeaux explicites dans le cas courant.
*   **Critère de validation :** Le CLI identifie correctement les 3 types de sources et affiche le type détecté. Une source vide (`""`) produit un code de retour `1` avec un message d'erreur explicite.

### Étape 2.3 : Module d'exceptions personnalisées — ⏳ À faire
*   **Description :** Créer `exceptions.py` avec les classes d'exceptions métier : `EmptySourceError`, `ExtractionError`, `LLMClientError`, `ConfigurationError`. Chaque exception hérite d'une classe de base `WatcherError`.
*   **Concept clé :** Hiérarchie d'exceptions — permet un traitement d'erreur granulaire et des messages utilisateur ciblés sans crash de l'interpréteur.
*   **Critère de validation :** Chaque exception peut être levée et attrapée individuellement. `make lint` (Mypy strict) valide le typage de la hiérarchie.

---

## Phase 3 : Module d'Ingestion Multi-Sources — ⏳ À faire
*Objectif : Récupérer et nettoyer le contenu textuel des 3 types de sources d'entrée (SF-01 du CDCF).*

### Étape 3.1 : Extraction de texte direct et fichiers locaux — ⏳ À faire
*   **Description :** Implémenter dans `core/extractor.py` deux fonctions pures : `extract_from_text(raw: str) -> str` (nettoyage des espaces superflus) et `extract_from_file(path: Path) -> str` (lecture de fichiers `.txt` et `.md` avec validation d'existence et d'extension).
*   **Concept clé :** Fonctions pures et séparation I/O — chaque extracteur a une entrée et une sortie prévisibles, testables sans effet de bord.
*   **Critère de validation :** Passer un fichier `.md` existant renvoie son contenu nettoyé. Passer un fichier inexistant lève `ExtractionError`. Mypy valide le typage strict.

### Étape 3.2 : Scraping HTML pour les URLs — ⏳ À faire
*   **Description :** Ajouter `extract_from_url(url: str) -> str` utilisant HTTPX pour la requête HTTP et BeautifulSoup4 pour l'extraction du texte visible (suppression des balises `<script>`, `<style>`, `<nav>`, `<footer>`, nettoyage des espaces multiples).
*   **Concept clé :** Pipeline de nettoyage HTML — transformer du HTML brut en texte exploitable par un LLM nécessite un nettoyage agressif pour réduire le bruit et le nombre de tokens consommés.
*   **Critère de validation :** Passer l'URL `https://example.com` renvoie un texte propre sans balises. Une URL invalide (timeout, 404) lève `ExtractionError` avec un message explicite.

### Étape 3.3 : Orchestrateur d'extraction — ⏳ À faire
*   **Description :** Créer dans `core/extractor.py` une fonction façade `extract(source: str, source_type: SourceType) -> str` qui dispatche vers le bon extracteur en fonction du type détecté en Phase 2.2. Ajouter la validation Pydantic de la longueur minimale du contenu extrait.
*   **Concept clé :** Pattern Façade — exposer une interface unique et simple au reste du pipeline, masquant la complexité interne des 3 extracteurs.
*   **Critère de validation :** La fonction `extract` traite correctement les 3 types de sources et lève `EmptySourceError` si le contenu extrait est vide après nettoyage.

---

## Phase 4 : Client LLM & Structured Outputs — ⏳ À faire
*Objectif : Interroger les API LLM et garantir des réponses structurées conformes au schéma Pydantic (SF-02).*

### Étape 4.1 : Modélisation des données de sortie (Pydantic V2) — ⏳ À faire
*   **Description :** Implémenter dans `schemas/report.py` le modèle `AnalysisReport` tel que défini dans le cahier des charges (ST-02) : `title`, `summary`, `key_points`, `impact_technical`, `impact_business`, `impact_regulatory`, `recommendation`, `priority`, et les champs FinOps (`prompt_tokens`, `completion_tokens`, `estimated_cost_usd`, `execution_time_seconds`).
*   **Concept clé :** Structured Outputs & Contrat de données — Pydantic V2 valide automatiquement le JSON renvoyé par le LLM et lève une erreur si le format est non-conforme.
*   **Critère de validation :** Instancier un `AnalysisReport` avec des données valides réussit. Instancier avec un champ manquant (`key_points` absent) lève `ValidationError`. Mypy strict valide la totalité du modèle.

### Étape 4.2 : Conception du prompt systémique — ⏳ À faire
*   **Description :** Rédiger dans `clients/prompts.py` le prompt système instruisant le LLM d'agir comme un analyste senior IA. Le prompt inclut : le rôle, les contraintes de format (JSON conforme au schéma `AnalysisReport`), les contraintes de concision (max 200 mots pour le résumé, 3 à 5 points clés), et un exemple de sortie attendue.
*   **Concept clé :** Prompt Engineering systémique — la qualité et la fiabilité de la sortie dépendent directement de la rigueur des instructions système, pas du contenu utilisateur.
*   **Critère de validation :** Le prompt est stocké sous forme de constante typée. Il mentionne explicitement le schéma JSON attendu et inclut un exemple de réponse parsable par `AnalysisReport.model_validate_json()`.

### Étape 4.3 : Client LLM de base (sans retry) — ⏳ À faire
*   **Description :** Implémenter dans `clients/llm_client.py` une classe `LLMClient` encapsulant l'appel API (via le SDK OpenAI ou HTTPX direct). La méthode `analyze(content: str) -> AnalysisReport` envoie le prompt système + le contenu utilisateur, parse la réponse JSON et retourne un objet `AnalysisReport` validé.  Paramètres configurables : `model`, `temperature` (0.0–0.3), `top_p` (0.9), `max_tokens`.
*   **Concept clé :** Encapsulation du client API — isoler l'appel réseau dans une couche dédiée permet de le mocker en test, de le remplacer par un autre provider, et de centraliser la gestion d'erreurs.
*   **Critère de validation :** Avec une clé API valide, `LLMClient().analyze("OpenAI lance GPT-5")` renvoie un `AnalysisReport` complet et validé. Sans clé, une `LLMClientError` est levée.

### Étape 4.4 : Mode démo avec réponse mockée — ⏳ À faire
*   **Description :** Ajouter un mode `--demo` au CLI qui court-circuite l'appel API et retourne un `AnalysisReport` pré-rempli avec des données de démonstration réalistes. Ce mode permet de tester l'intégralité du pipeline (ingestion → formatage → affichage) sans consommer de crédit API.
*   **Concept clé :** Développement découplé — pouvoir tester le pipeline bout-en-bout sans dépendance externe accélère les itérations et réduit les coûts de développement.
*   **Critère de validation :** `make run ARGS="scan 'test' --demo"` affiche un rapport complet sans aucun appel réseau.

---

## Phase 5 : Calculatrice FinOps — ⏳ À faire
*Objectif : Mesurer et calculer le coût financier exact de chaque appel d'API (SF-03).*

### Étape 5.1 : Grille tarifaire et calculatrice de coût — ⏳ À faire
*   **Description :** Implémenter dans `utils/cost.py` un dictionnaire de tarifs par modèle (prix par million de tokens en entrée et en sortie) et une fonction `calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float` qui retourne le coût en USD.
*   **Concept clé :** Observabilité FinOps — dans un contexte de production, chaque appel d'API a un coût marginal direct. Le tracking granulaire permet d'optimiser les budgets et de détecter les dérives.
*   **Critère de validation :** `calculate_cost("gpt-4o-mini", prompt_tokens=1000, completion_tokens=500)` retourne une valeur cohérente avec la grille tarifaire publique. Passer un modèle inconnu lève une exception explicite.

### Étape 5.2 : Injection des métriques dans le rapport — ⏳ À faire
*   **Description :** Enrichir la méthode `LLMClient.analyze()` pour chronométrer l'appel (`time.perf_counter()`), extraire les compteurs de tokens depuis la réponse API (`usage.prompt_tokens`, `usage.completion_tokens`), calculer le coût via `cost.py`, et injecter ces valeurs dans l'objet `AnalysisReport` avant de le retourner.
*   **Concept clé :** Instrumentation transparente — les métriques sont collectées au plus proche de l'appel, sans surcoût de complexité pour le code appelant.
*   **Critère de validation :** Le rapport retourné contient des valeurs non-nulles pour `prompt_tokens`, `completion_tokens`, `estimated_cost_usd` et `execution_time_seconds`.

---

## Phase 6 : Affichage Console Enrichi avec Rich — ⏳ À faire
*Objectif : Offrir une expérience console premium avec des rendus visuels élégants (SF-04).*

### Étape 6.1 : Panneau de rendu Markdown — ⏳ À faire
*   **Description :** Implémenter dans `formatters/console.py` une fonction `display_report(report: AnalysisReport) -> None` qui affiche la synthèse dans un panneau Rich stylisé : titre coloré, résumé en Markdown, points clés en puces, impacts et recommandation avec codes couleur (vert pour `low`, jaune pour `medium`, rouge pour `high`).
*   **Concept clé :** UX en terminal — une sortie bien formatée augmente la lisibilité, la crédibilité et l'adoption d'un outil CLI par les développeurs.
*   **Critère de validation :** L'exécution en mode `--demo` affiche un panneau coloré dans le terminal avec une structure claire et lisible.

### Étape 6.2 : Tableau récapitulatif des métriques FinOps — ⏳ À faire
*   **Description :** Ajouter sous le panneau principal un tableau Rich résumant les métriques d'inférence : modèle utilisé, tokens entrée/sortie, coût USD, latence en secondes. Utiliser un code couleur pour le coût (vert si < $0.01, jaune si < $0.05, rouge au-delà).
*   **Concept clé :** Reporting visuel instantané — le développeur voit immédiatement l'impact économique de sa requête.
*   **Critère de validation :** Le tableau s'affiche correctement avec les valeurs numériques alignées et colorées.

### Étape 6.3 : Formats d'export (`--output`) — ⏳ À faire
*   **Description :** Implémenter dans `formatters/` les options d'export : `console` (défaut, rendu Rich), `json` (sortie brute `AnalysisReport.model_dump_json(indent=2)` sur stdout), `markdown` (écriture dans un fichier `.md` via `formatters/markdown.py`). L'option se configure via `--output / -o`.
*   **Concept clé :** Interopérabilité des formats — la sortie JSON permet l'intégration dans des pipelines CI/CD, le Markdown facilite l'archivage et le partage.
*   **Critère de validation :** `scan "test" --demo -o json` produit du JSON valide parsable. `scan "test" --demo -o report.md` crée un fichier Markdown lisible.

---

## Phase 7 : Système de Cache Local — ⏳ À faire
*Objectif : Éviter les appels API redondants pour le même contenu et réduire les coûts (SF-05).*

### Étape 7.1 : Mécanisme de persistance par empreinte de hachage — ⏳ À faire
*   **Description :** Implémenter dans `utils/cache.py` un système de cache basé sur un hash SHA-256 du contenu extrait. Les rapports sont stockés dans un fichier JSON local (`~/.cache/ai_watcher/cache.json`). Chaque entrée contient : le hash, le timestamp de création, le TTL et le rapport sérialisé.
*   **Concept clé :** Idempotence — analyser deux fois le même contenu doit produire le même résultat sans consommer de crédit API supplémentaire.
*   **Critère de validation :** Un premier appel `scan` effectue l'appel API et enregistre le résultat. Un second appel identique retourne le résultat caché instantanément (latence < 100ms) avec un message `[CACHE HIT]`.

### Étape 7.2 : TTL configurable et invalidation — ⏳ À faire
*   **Description :** Ajouter les options CLI `--cache-ttl <secondes>` (durée de validité, défaut : 3600s) et `--no-cache` (désactive totalement le cache). Implémenter la purge automatique des entrées expirées au démarrage.
*   **Concept clé :** Fraîcheur des données vs économie — le TTL permet à l'utilisateur de contrôler le compromis entre actualité de l'analyse et coûts d'API.
*   **Critère de validation :** Avec `--cache-ttl 0`, chaque appel passe par l'API. Avec `--no-cache`, aucun fichier de cache n'est lu ni écrit. Une entrée expirée est automatiquement ignorée et recalculée.

---

## Phase 8 : Résilience Réseau (Retry & Backoff) — ⏳ À faire
*Objectif : Tolérer les pannes transitoires des API sans crash de l'application (ST-04).*

### Étape 8.1 : Décorateur Tenacity avec backoff exponentiel — ⏳ À faire
*   **Description :** Décorer la méthode d'appel API dans `llm_client.py` avec `@retry` de Tenacity. Configuration : maximum **4 tentatives**, backoff exponentiel avec jitter (2s → 4s → 8s + aléa), interception des erreurs HTTP 429 (Rate Limit), 5xx (Erreur Serveur) et `ConnectionError` (coupure réseau).
*   **Concept clé :** Backoff exponentiel avec jitter — l'ajout d'un délai aléatoire empêche la "tempête de reconnexion" (*thundering herd*) lorsque plusieurs clients retentent simultanément.
*   **Critère de validation :** En simulant un serveur qui renvoie 3 erreurs 429 puis une réponse valide, l'appel réussit après les retries. Le log affiche un avertissement jaune à chaque tentative (`⚠️ Retry 2/4 — attente 4.2s…`).

### Étape 8.2 : Échec gracieux et code de sortie — ⏳ À faire
*   **Description :** Si toutes les tentatives échouent, l'application affiche un message d'erreur explicite via Rich (panneau rouge), enregistre l'erreur dans les logs, et retourne un code de sortie `1` sans crash de l'interpréteur Python (pas de traceback non géré).
*   **Concept clé :** Fail gracefully — une application de production ne doit jamais exposer des tracebacks techniques à l'utilisateur final.
*   **Critère de validation :** En simulant une panne réseau totale, le CLI affiche `❌ Échec après 4 tentatives` dans un panneau rouge Rich et retourne le code `1`. Aucun traceback Python n'est visible.

---

## Phase 9 : Suite de Tests Automatisés — ⏳ À faire
*Objectif : Garantir la qualité et la non-régression avec une couverture ≥ 80%.*

### Étape 9.1 : Tests unitaires des extracteurs — ⏳ À faire
*   **Description :** Créer `tests/unit/test_extractor.py` avec des cas de test pour chaque type de source : texte valide/vide, fichier existant/inexistant, URL valide/invalide (avec mock HTTPX). Valider que les exceptions correctes sont levées dans chaque cas d'erreur.
*   **Concept clé :** Tests unitaires mockés — isoler chaque composant de ses dépendances (réseau, système de fichiers) pour des tests rapides et déterministes.
*   **Critère de validation :** `make test` exécute les tests d'extraction en < 2 secondes avec 100% de couverture sur `core/extractor.py`.

### Étape 9.2 : Tests unitaires du client LLM (mocks) — ⏳ À faire
*   **Description :** Créer `tests/unit/test_llm_client.py` avec des mocks des réponses API (succès, erreur 429, timeout, JSON malformé). Tester le comportement du retry Tenacity et la validation Pydantic des réponses.
*   **Concept clé :** Mock des dépendances externes — ne jamais consommer de crédit API ni dépendre du réseau dans les tests automatisés.
*   **Critère de validation :** Les tests couvrent les scénarios succès, retry-puis-succès, et échec-total. Aucun appel HTTP réel n'est effectué.

### Étape 9.3 : Tests unitaires FinOps et Cache — ⏳ À faire
*   **Description :** Créer `tests/unit/test_cost.py` (calculs tarifaires exacts) et `tests/unit/test_cache.py` (hit, miss, expiration TTL, flag `--no-cache`). Utiliser des fichiers temporaires (`tmp_path` de Pytest) pour isoler le cache.
*   **Concept clé :** Tests déterministes de la logique métier — les calculs financiers et la gestion du cache sont des composants critiques qui nécessitent une couverture exhaustive.
*   **Critère de validation :** `make test` passe avec couverture complète sur `utils/cost.py` et `utils/cache.py`.

### Étape 9.4 : Test d'intégration CLI bout-en-bout — ⏳ À faire
*   **Description :** Créer `tests/integration/test_cli.py` utilisant `typer.testing.CliRunner` pour simuler des invocations complètes du CLI en mode `--demo`. Vérifier le code de retour, la présence des sections clés dans la sortie (titre, résumé, tableau FinOps), et le fonctionnement des formats d'export.
*   **Concept clé :** Test d'intégration end-to-end — valider que tous les composants (CLI → extraction → analyse → formatage) fonctionnent ensemble correctement.
*   **Critère de validation :** `make test` inclut au moins 5 scénarios d'intégration couvrant les 3 types de sources en mode démo. Couverture globale du projet ≥ 80%.

---

## Phase 10 : Conteneurisation & Livraison — ⏳ À faire
*Objectif : Empaqueter l'outil CLI dans un conteneur Docker prêt à l'emploi et finaliser la documentation.*

### Étape 10.1 : Adaptation du Dockerfile multi-stage pour CLI — ⏳ À faire
*   **Description :** Adapter le Dockerfile hérité : le stage `builder` compile les dépendances Poetry, le stage `runtime` copie le `.venv` et le code source. Remplacer le `CMD` (qui lançait Uvicorn) par un `ENTRYPOINT` pointant vers le CLI (`poetry run python -m src.ai_watcher.main`). Conserver la sécurisation non-root (`appuser`).
*   **Concept clé :** Conteneur CLI vs conteneur serveur — l'`ENTRYPOINT` permet d'utiliser le conteneur comme un exécutable autonome (`docker run ai-watcher scan "..."``).
*   **Critère de validation :** `docker build -t ai-watcher .` réussit avec une image < 300 Mo. `docker run ai-watcher scan "test" --demo` affiche le rapport complet.

### Étape 10.2 : Fichier `.env` et secrets en conteneur — ⏳ À faire
*   **Description :** Documenter et implémenter le passage de la clé API au conteneur via variable d'environnement : `docker run -e OPENAI_API_KEY=sk-... ai-watcher scan "..."`. Vérifier que la clé n'est jamais écrite dans l'image.
*   **Concept clé :** Injection de secrets au runtime — les secrets ne sont jamais "baked" dans l'image Docker, ils sont injectés dynamiquement à l'exécution.
*   **Critère de validation :** `docker history ai-watcher` ne contient aucune trace de clé API. L'exécution sans variable d'environnement produit une erreur explicite.

### Étape 10.3 : Finalisation de la documentation & README — ⏳ À faire
*   **Description :** Mettre à jour le `README.md` avec : description du projet, instructions d'installation (`make install`), exemples d'utilisation (3 types de sources), tableau des options CLI, instructions Docker, et section FinOps. Alimenter le journal d'apprentissage avec les enseignements de chaque phase.
*   **Concept clé :** Documentation comme produit — un outil sans documentation claire est un outil inutilisé.
*   **Critère de validation :** Un développeur externe peut cloner le dépôt, lire le README et exécuter sa première analyse en moins de 5 minutes.

---

## 📋 Checklist de Livraison (Definition of Done)

- [ ] `ruff check .` et `mypy src/ --strict` : **zéro** erreur
- [ ] `pytest --cov=src` : couverture ≥ **80%**
- [ ] `detect-secrets` : aucun secret en dur dans le code
- [ ] CLI fonctionne sur les **3 types de sources** (texte, fichier, URL)
- [ ] Métriques **FinOps** affichées et exactes après chaque analyse
- [ ] Rendu **Rich** avec panneaux colorés et tableau récapitulatif
- [ ] **Cache local** fonctionnel avec TTL configurable
- [ ] **Retry Tenacity** : l'application survit aux pannes transitoires sans crash
- [ ] **Docker** : `docker run ai-watcher scan "test" --demo` fonctionne
- [ ] **README** complet et journal d'apprentissage à jour
