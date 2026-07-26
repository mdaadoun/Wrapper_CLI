# 📖 Glossaire Technique : Wrapper CLI de Veille IA

Ce glossaire définit les concepts d'ingénierie logicielle, d'IA et de FinOps manipulés dans le cadre du **Projet 3 : Wrapper CLI**.

---

## 🛠️ Concepts d'Ingénierie Logicielle & CLI

### Engineering Blueprint Reuse
Pratique consistant à réutiliser un socle d'infrastructure éprouvé (fichiers de configuration, linting, CI/CD) comme point de départ standardisé pour de nouveaux projets, évitant ainsi de recréer la "plomberie" initiale.

### Single Responsibility Principle (SRP)
Principe de conception logicielle (le "S" de SOLID) stipulant qu'une classe, un module ou un fichier ne doit avoir qu'une seule et unique raison de changer, favorisant la modularité et la testabilité du code.

### Gestion Déclarative des Dépendances (Declarative Dependency Management)
Paradigme dans lequel le développeur déclare l'état désiré du système (ex. : `typer` version `^0.12.0` dans `pyproject.toml`) et confie à un outil (comme Poetry) la résolution et l'installation de l'arbre de dépendances, créant ainsi une source de vérité unique et déterministe.

### CLI (Command Line Interface)
Interface en ligne de commande permettant à l'utilisateur d'interagir avec une application en saisissant des lignes de texte dans un terminal.

### Typer
Framework Python moderne basé sur Click et les annotations de type Python (Type Hints) pour créer des applications CLI autodocumentées avec validation automatique.

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
