# 📖 Glossaire Technique : Wrapper CLI de Veille IA

Ce glossaire définit les concepts d'ingénierie logicielle, d'IA et de FinOps manipulés dans le cadre du **Projet 3 : Wrapper CLI**.

---

## 🛠️ Concepts d'Ingénierie Logicielle & CLI

### Engineering Blueprint Reuse
Pratique consistant à réutiliser un socle d'infrastructure éprouvé (fichiers de configuration, linting, CI/CD) comme point de départ standardisé pour de nouveaux projets, évitant ainsi de recréer la "plomberie" initiale.

### Unified Command Interface (Interface de Commande Unifiée)
Modèle de conception d'automatisation logicielle dans lequel un fichier central (Makefile) sert de point d'entrée unique et homogène pour l'ensemble des tâches de développement, de test et de déploiement.

### Single Responsibility Principle (SRP)
Principe de conception logicielle (le "S" de SOLID) stipulant qu'une classe, un module ou un fichier ne doit avoir qu'une seule et unique raison de changer, favorisant la modularité et la testabilité du code.

### 12-Factor App (Méthodologie)
Ensemble de 12 bonnes pratiques pour créer des applications web ou CLI modernes. La règle concernant la configuration exige une stricte séparation entre le code source et la configuration (qui varie selon les environnements), cette dernière devant être stockée dans les variables d'environnement.

### detect-secrets
Outil de sécurité (souvent utilisé comme hook pre-commit) développé par Yelp. Il utilise l'heuristique et l'entropie pour analyser le code source avant le commit afin de bloquer l'insertion accidentelle de mots de passe, tokens ou clés API en clair dans un dépôt Git.

### Gestion Déclarative des Dépendances (Declarative Dependency Management)
Paradigme dans lequel le développeur déclare l'état désiré du système (ex. : `typer` version `^0.12.0` dans `pyproject.toml`) et confie à un outil (comme Poetry) la résolution et l'installation de l'arbre de dépendances, créant ainsi une source de vérité unique et déterministe.

### CLI (Command Line Interface)
Interface en ligne de commande permettant à l'utilisateur d'interagir avec une application en saisissant des lignes de texte dans un terminal.

### Typer
Framework Python moderne basé sur Click et les annotations de type Python (Type Hints) pour créer des applications CLI autodocumentées avec validation automatique.

### Declarative CLI Framework (Framework CLI Déclaratif)
Approche d'ingénierie logicielle dans laquelle la structure de l'interface en ligne de commande (arguments, options, types, messages d'aide) est définie de manière déclarative par les signatures de fonctions et leurs annotations de type.

### Détection Automatique du Type de Source (Automatic Source Type Detection)
Pattern d'ergonomie CLI dans lequel le système inspecte la valeur saisie par l'utilisateur pour déterminer automatiquement son type (`URL`, `FILE` ou `TEXT`) sans exiger l'ajout de fanions explicites dans les cas courants.

### Fail-Fast Validation
Principe d'ingénierie consistant à vérifier immédiatement la validité des données d'entrée dès le point d'entrée de l'application et à lever une erreur explicite avant d'allouer des ressources ou d'exécuter un traitement coûteux.

### Positional Argument vs CLI Option
- **Argument positionnel** : Paramètre obligatoire d'une commande CLI identifié par sa position dans la ligne de commande (ex: `source` dans `scan <source>`).
- **Option CLI (Fanion / Flag)** : Paramètre facultatif préfixé par un ou deux tirets (ex: `-t` ou `--text`), modifiant le comportement de la commande.

### Rich
Bibliothèque Python permettant un rendu visuel riche dans le terminal (panneaux colorés, syntaxe Markdown, tableaux, barres de progression, spinners).

### Façade Pattern
Patron de conception (Design Pattern) structurant qui fournit une interface simplifiée et unifiée devant un ensemble complexe de classes ou sous-systèmes (ex: orchestrateur d'extraction multi-sources).

---

## 🤖 Concepts d'Intelligence Artificielle

### Structured Output
Technique permettant de contraindre un LLM à retourner une réponse strictement conforme à un schéma prédéfini (JSON Schema ou modèle Pydantic), éliminant l'imprévisibilité du texte libre.

### Prompt System (System Prompt)
Instruction initiale de haut niveau donnée au modèle pour lui assigner un rôle (ex: *Analyste Senior IA*), un contexte et des contraintes de comportement avant de lui transmettre le contenu utilisateur.

### Temperature & Top_P
Paramètres de contrôle du déterminisme du LLM. Une température basse (0.0 – 0.3) réduit la variabilité et favorise la fidélité factuelle, indispensable pour l'analyse technique.

---

## 💰 Concepts FinOps & Observabilité

### FinOps (Financial Operations)
Pratique de gestion financière appliquée aux ressources cloud et API d'IA visant à mesurer, suivre et optimiser les coûts d'inférence au jeton près.

### Prompt Tokens vs Completion Tokens
- **Prompt Tokens** : Nombre de jetons envoyés au modèle (instructions système + contenu source).
- **Completion Tokens** : Nombre de jetons générés par le modèle dans sa réponse.

### Hash SHA-256 & Idempotence
Technique de hachage permettant d'identifier de manière unique un contenu d'entrée. Si la même empreinte est soumise, le système renvoie le résultat en cache sans refaire d'appel API payant (propriété d'idempotence).

### Backoff Exponentiel avec Jitter
Stratégie de réessai (Retry) qui augmente exponentiellement le temps d'attente entre deux tentatives échouées en y ajoutant une composante aléatoire (jitter) pour éviter de surcharger l'API cible.

### Hiérarchie d exceptions
Un modèle d architecture où des classes d exceptions personnalisées héritent d une classe de base commune. Cela permet une gestion granulaire des erreurs et des retours ciblés sans plantages génériques de l interpréteur.

### Fonctions Pures & Séparation des I/O
Une pratique architecturale séparant les opérations I/O génératrices d effets de bord (comme lire des fichiers) des fonctions pures déterministes (comme la normalisation de texte), permettant des tests unitaires très prévisibles et instantanés.

### Pipeline de Nettoyage HTML
Une séquence d opérations conçue pour analyser le HTML brut, supprimer les balises bruyantes non liées au contenu principal (comme script, style, nav, footer), et extraire le texte lisible pour minimiser la consommation de tokens pour le LLM.

### Contrat de Données Pydantic V2
Patron de validation aux frontières de l'architecture utilisant des modèles Pydantic V2 pour parser et imposer des contrats de type stricts, des valeurs par défaut et des contraintes de valeurs sur les sorties JSON du LLM.

### Entité Immuable (`frozen=True`)
Patron de modélisation de domaine imposant des objets de données en lecture seule après instanciation (`ConfigDict(frozen=True)`), évitant les mutations d'état accidentelles.

### Schéma de Télémétrie FinOps
Patron de conception de schéma intégrant les métriques de coût opérationnel (`prompt_tokens`, `completion_tokens`, `estimated_cost_usd`, `execution_time_seconds`) aux côtés des livrables métier au sein d'une entité unique.

### Prompt Engineering Systémique
Pratique consistant à rédiger des instructions système de haute précision spécifiant le persona LLM, le format de sortie, les règles métier et les limites pour garantir la livraison de données structurées.

### Ancrage de Schéma Few-Shot (Grounding)
Fourniture d'exemples de sortie complets et validés dans le contexte du prompt pour guider le modèle vers le respect exact de la syntaxe et du schéma `AnalysisReport.model_validate_json()`.

### Contrainte Sans Markdown Fences
Instruction exigeant du LLM qu'il renvoie un objet JSON pur sans balises triple-backticks markdown afin de simplifier le parsing en aval.

### LLMClient
Composant de domaine encapsulant les interactions REST avec les API LLM via HTTPX, mesurant la latence, nettoyant les balises markdown, injectant la télémétrie FinOps et validant le modèle `AnalysisReport` retourné.

### Grille Tarifaire FinOps (FinOps Cost Matrix)
Dictionnaire de correspondance associant chaque identifiant de modèle LLM aux tarifs de prompt et de complétion pour 1 000 jetons afin de calculer les coûts opérationnels en temps réel.

### Nettoyage des Balises Markdown (Markdown Fence Stripping)
Utilitaire de prétraitement supprimant la syntaxe des blocs de code markdown (```json ... ```) d'une réponse LLM brute avant la désérialisation JSON.

### Mode Démo / Réponse Moquée (Demo Mode / Mocked Response)
Mode de fonctionnement dans les outils de développement dans lequel les services réseau externes sont court-circuités et où des données factices statiques ou programmatiques conformes aux schémas de domaine sont retournées pour permettre des tests hors-ligne et une itération à coût zéro.

### Évaluation en Court-Circuit (Short-Circuit Evaluation)
Bypass des opérations lourdes ou coûteuses (telles que les appels réseau HTTP REST vers les endpoints LLM) tôt dans l'exécution du code lorsque des conditions de drapeaux spécifiques (ex: `--demo`) sont remplies.

### Télémétrie Synthétique (Synthetic Telemetry)
Métriques simulées de performance et de coûts financiers (nombre de jetons, estimations de coûts en USD, latence d'exécution) rattachées aux réponses factices pour tester les interfaces de rapport FinOps sans consommation d'API en direct.

### Matrice de Tarification (Pricing Matrix)
Dictionnaire associant les identifiants de modèles à leurs taux d'entrée/sortie (USD par 1M tokens). La matrice du Wrapper CLI couvre 40+ modèles sur 8 fournisseurs (OpenAI, Google, Anthropic, Meta, Mistral, DeepSeek, Cohere, Amazon).

### Tarification par 1M Tokens (Per-1M Token Pricing)
Standard industriel (2025+) où les taux sont exprimés pour 1 000 000 tokens plutôt que pour 1 000. Simplifie le calcul mental et s'aligne sur les pages de tarification officielles.

### UnknownModelError
Exception personnalisée (`WatcherError` → `UnknownModelError`) levée lorsque `calculate_cost()` reçoit un nom de modèle absent de la matrice. Garantit un suivi FinOps strict en rejetant les modèles inconnus avec un message d'erreur listant les modèles pris en charge.

### Arrondi du Coût Token (Token Cost Rounding)
Coût financier arrondi à 6 décimales via `round()` de Python pour éviter le bruit numérique dans les rapports tout en capturant la précision sub-centime.

### Injection de métriques
Le processus consistant à remplir les métadonnées d'exécution (latence, nombre de jetons, coûts calculés) dans les structures de données du domaine lors du traitement de la sortie.

### Métadonnées d'utilisation
Structure de réponse de l'API contenant les métriques de consommation de jetons (`promptTokenCount`, `candidatesTokenCount`, `prompt_tokens`, `completion_tokens`).

### Rich Panel
Composant d'interface utilisateur de la bibliothèque Python Rich qui dessine des encadrés avec bordures stylisées autour du texte ou des éléments de rendu en terminal.

### Rich Markdown
Classe de rendu dans Rich qui analyse les chaînes au format Markdown et les affiche avec un formatage adapté au terminal au sein des applications console.
