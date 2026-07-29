# ❓ FAQ Entretien : Wrapper CLI de Veille IA

Questions-réponses clés pour défendre l'architecture et les choix d'ingénierie du **Projet 3 : Wrapper CLI** lors d'un entretien technique.

---

### Q1 : Pourquoi avoir choisi Typer plutôt que argparse natif ou Click ?
**Réponse :** Typer s'appuie sur le typage statique moderne de Python (Type Hints). Il permet de déclarer la CLI de façon expressive et de générer automatiquement la validation des arguments, la conversion des types et l'aide `--help` sans code boilerplate, tout en reposant sur la maturité de Click en sous-couche.

### Q2 : Comment garantissez-vous que le LLM retourne un format JSON valide ?
**Réponse :** Nous combinons trois niveaux de sécurité :
1. Un prompt système d'ingénierie stricte spécifiant le schéma de sortie attendu.
2. Le mode *Structured Outputs* / `response_format` du SDK API.
3. La validation stricte à la réception via un modèle **Pydantic V2** (`AnalysisReport.model_validate_json()`). En cas d'erreur de parsing, une exception personnalisée est levée.

### Q3 : Comment avez-vous abordé la question de la résilience réseau (Rate Limits, coupures) ?
**Réponse :** Nous utilisons la bibliothèque **Tenacity** avec une stratégie de **backoff exponentiel enrichi de jitter** (jusqu'à 4 tentatives max). En cas d'erreur transitoire (HTTP 429 ou 5xx), l'application émet un log d'avertissement et retient la requête de façon progressive sans interrompre prématurément le thread. Si la panne persiste, elle échoue proprement avec un code de sortie `1` et un message clair sans exposer de traceback technique.

### Q4 : Quel est votre mécanisme de contrôle des coûts (FinOps) ?
**Réponse :**
1. **Mesure directe** : Extraction des compteurs de tokens (`prompt` et `completion`) et calcul du coût exact en USD basé sur les tarifs au million de tokens.
2. **Système de cache local** : Hachage SHA-256 du contenu d'entrée avec TTL configurable pour éviter de re-traiter les contenus identiques.
3. **Limitation explicite** : Utilisation du paramètre `max_tokens` pour brider la longueur des réponses générées.

### Q5 : Pourquoi utiliser un build Docker multi-stage non-root pour un outil CLI ?
**Réponse :** Le build multi-stage sépare la phase d'installation des outils de compilation (Poetry, pip) du runtime final, réduisant le poids de l'image (de ~600 Mo à < 250 Mo). L'exécution sous un utilisateur non-privilégié `appuser` (UID 1000) respecte le principe de moindre privilège pour une utilisation sécurisée en conteneur CI/CD.

### Q6 : Pourquoi avez-vous démarré ce projet en nettoyant le code d'un projet précédent plutôt qu'en créant un dépôt vierge ?
**Réponse :** C'est une application du principe "Engineering Blueprint Reuse". Repartir d'un socle d'ingénierie approuvé permet de bénéficier instantanément de l'infrastructure de qualité et de sécurité (Poetry, Ruff, Mypy, pre-commit avec detect-secrets, Makefile, Dockerfile) sans perdre de temps à tout reconfigurer. Cela garantit un pipeline CI robuste dès la première ligne de code métier.

### Q7 : Pourquoi utiliser une structure de répertoires aussi découpée (`core/`, `clients/`, `utils/`, `formatters/`) au lieu d'un seul fichier `main.py` pour un outil CLI ?
**Réponse :** Cette architecture respecte le principe de responsabilité unique (SRP). Dans un fichier monolithique, la logique de formatage, l'extraction et l'appel API sont fortement couplés, rendant le code difficile à tester et à maintenir. En séparant chaque responsabilité, les modules deviennent testables unitairement (ex. on peut tester le formateur sans appeler l'API réseau) et le projet peut évoluer ou être repris par d'autres développeurs de façon claire.

### Q8 : Pourquoi charger la configuration via Pydantic (`pydantic-settings`) plutôt qu'avec de simples appels à `os.environ.get()` ?
**Réponse :** Pydantic apporte trois avantages majeurs par rapport à `os.environ` : le typage fort (il convertit automatiquement les valeurs, par ex. de string à int), la validation centralisée, et la capacité d'échouer rapidement ("Fail Fast"). Si une clé d'API requise est absente de `.env`, l'application plante explicitement dès son démarrage avec un message clair, plutôt que de planter silencieusement plus loin dans l'exécution lors de l'appel HTTP. Le type `SecretStr` masque également la valeur dans les logs.

### 5. Transition vers le CLI & Automatisation (Makefile)

**Q : Pourquoi avoir structuré le point d'entrée de ce projet avec Typer plutôt qu'un serveur classique comme Uvicorn ?**
*Réponse attendue :* L'application (Wrapper_CLI) est un outil asynchrone destiné à l'extraction de contenu ponctuelle et automatisée. Un CLI (Command Line Interface) s'exécute à la demande et s'éteint, ce qui est parfait pour une automatisation CI/CD ou des cron jobs. Typer permet de générer des CLI typés très rapidement avec une génération d'aide automatique (`--help`), là où Uvicorn est conçu pour des daemons/serveurs web écoutant en continu. Le Makefile a été adapté en conséquence avec `make run` pour faciliter l'injection d'arguments.

### 6. Routage CLI & Options Typer (Étape 2.1)

**Q : Pourquoi utiliser des arguments positionnels combinés à des drapeaux booléens courts (comme `-t`, `-f`, `-u`) dans un CLI de production ?**
*Réponse attendue :* L'argument positionnel obligatoire (`source`) simplifie l'usage courant en permettant de fournir directement une chaîne de caractères sans saisir de drapeaux superflus. Les drapeaux booléens optionnels (`--text / -t`, `--file / -f`, `--url / -u`) permettent de résoudre les ambiguïtés manuellement lorsque la détection automatique n'est pas souhaitée (par exemple si une chaîne de texte ressemble à une URL). Typer permet de déclarer ces drapeaux de façon propre et typée via `typer.Option`.

### 7. Détection Automatique de Source & Inférence d'Intention (Étape 2.2)

**Q : Comment concevoir une heuristique de détection automatique des entrées CLI sans créer de faux positifs ou d'effets de bord ?**
*Réponse attendue :* Une heuristique de détection CLI efficace doit être strictement ordonnée et déterministe. On valide en premier lieu les préfixes explicites (ex: `http://` ou `https://` pour les URL), puis l'existence physique du fichier sur le système de fichiers (`Path.exists() & Path.is_file()`). Tout autre contenu est traité par défaut comme du texte brut. Pour garantir la sécurité et la flexibilité, des fanions d'invalidation explicites (`-t`, `-f`, `-u`) permettent à l'utilisateur de surcharger manuellement la détection si une ambiguïté se présente. Les entrées vides doivent lever immédiatement une exception dédiée (`EmptySourceError`) selon le principe du Fail-Fast.

### 8. Gestion Granulaire des Exceptions (Étape 2.3)

**Q: Pourquoi utiliser une Hiérarchie d Exceptions personnalisée plutôt que de lever des exceptions génériques ?**
*Expected Answer:* Une hiérarchie personnalisée (comme une base `WatcherError` avec des sous-classes `ExtractionError`, `ConfigurationError`) permet de capturer des erreurs de domaine spécifiques sans masquer les exceptions système sans rapport. Cela permet à l application principale de gérer les échecs prévus proprement (ex: afficher un message clair et quitter avec un code 1) au lieu de planter brutalement.

### 9. Fonctions Pures et Architecture (Étape 3.1)

**Q: Pourquoi séparer la normalisation de texte dans une fonction pure plutôt que de le faire à la volée pendant la lecture du fichier ?**
*Expected Answer:* Séparer la logique métier (normalisation) des opérations d entrées/sorties (lecture) suit le principe des fonctions pures. Cela permet aux développeurs de tester tous les cas particuliers du texte (chaîne vide, tabulations bizarres) instantanément sans toucher au disque. Les tests d I/O se concentrent ensuite uniquement sur l existence du fichier et ses permissions, réduisant la complexité des tests.

### 10. Scraping Web et Optimisation des Tokens (Étape 3.2)

**Q: Pourquoi utilisons-nous BeautifulSoup4 pour supprimer certaines balises HTML avant d envoyer le texte au LLM ?**
*Expected Answer:* Les balises comme `<script>`, `<style>`, `<nav>`, et `<footer>` contiennent du code générique ou des liens de navigation qui n apportent rien au contenu principal. Les supprimer réduit le "bruit", ce qui minimise directement la consommation de tokens (réduisant les coûts) et aide le LLM à se concentrer uniquement sur le contexte métier pertinent, améliorant la précision des réponses.

### 11. Patron Façade pour l Orchestration (Étape 3.3)

**Q: Pourquoi utiliser le patron Façade pour la fonction `extract()` plutôt que de laisser les appelants utiliser directement les extracteurs individuels ?**
*Expected Answer:* Le patron Façade offre trois avantages : (1) Centralisation du routage — les appelants n'ont pas besoin de connaître la logique de dispatch selon le `SourceType`. (2) Validation uniforme — tous les flux d'extraction passent par la validation Pydantic `ExtractedContent`, garantissant un résultat non vide. (3) Point d'import unique — le reste du code importe uniquement `extract` depuis `core/extractor`.

### 12. Modélisation des Données avec Pydantic V2 (Étape 4.1)

**Q: Pourquoi utiliser Pydantic V2 au lieu de dataclasses standard ou de TypedDict pour modéliser les sorties JSON du LLM ?**
*Expected Answer:* Pydantic V2 offre quatre avantages majeurs : (1) Parsing JSON natif via `model_validate_json()`, gérant le typage, les champs manquants et le parsing datetime ISO 8601. (2) Validation stricte au moment de l'exécution (ex: jetons non négatifs `ge=0`, énumération stricte des priorités). (3) Génération automatique de schémas JSON via `model_json_schema()` réinjectable directement dans les prompts système pour les sorties structurées. (4) Performances élevées grâce au cœur en Rust (`pydantic-core`).

### 13. Entités Immuables et Métriques FinOps (Étape 4.1)

**Q: Pourquoi modéliser `AnalysisReport` comme une entité immuable (`frozen=True`) et y intégrer directement la télémétrie FinOps ?**
*Expected Answer:* (1) L'immuabilité (`ConfigDict(frozen=True)`) garantit la sécurité multi-thread et évite toute modification accidentelle lors du passage dans les couches d'affichage et de mise en cache. (2) L'intégration de la télémétrie FinOps (`prompt_tokens`, `completion_tokens`, `estimated_cost_usd`, `execution_time_seconds`) dans le rapport garantit que les métriques d'observabilité financière restent indissociables des résultats d'analyse.
