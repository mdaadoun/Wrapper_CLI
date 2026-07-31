# Journal de Développement Session 10.2 : Injection de Secrets au Runtime

**Date :** 31-07-2026

Implémentation de l'injection dynamique de secrets au runtime pour l'outil CLI et l'environnement d'exécution du conteneur. Application stricte de la politique de zéro secret pré-intégré dans les couches d'image Docker et le contrôle de version via la configuration de `BaseSettings` Pydantic pour résoudre les alias de variables d'environnement (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `AI_WATCHER_API_KEY`) dynamiquement lors de l'exécution.

---

### 1. Concepts Introduits

- **Injection Dynamique de Secrets au Runtime** : Fourniture de clés API et de d'identifiants sensibles aux applications conteneurisées lors de l'exécution via des variables d'environnement, évitant toute persistance dans les images de conteneurs.
- **Politique de Zéro Secret Pré-intégré** : Norme de sécurité garantissant qu'aucune clé API, jeton ou identifiant n'est écrit en dur dans le code source ou embarqué dans les couches du système de fichiers du conteneur.
- **Résolution d'Alias de Variables d'Environnement** : Configuration des analyseurs de paramètres pour mapper plusieurs noms de variables d'environnement standard vers un champ d'identifiant interne unique.

---

### 2. Décisions d'Architecture (ADR)

#### ADR 1 : Fourniture de Secrets au Runtime via Variables d'Environnement
- **Option 1** : Écriture en dur d'identifiants API par défaut dans les fichiers de configuration ou les couches d'image Docker.
- **Option 2 (Sélectionnée)** : Injection dynamique des identifiants API au runtime via variables d'environnement (`docker run -e OPENAI_API_KEY=...`).
- **Raisonnement** : Garantit que les images de conteneurs ne contiennent aucun secret en dur, conformément aux meilleures pratiques de sécurité, et prévient les fuites accidentelles dans l'historique des couches.

#### ADR 2 : Repli et Résolution d'Alias pour Variables d'Environnement
- **Option 1** : Exigence stricte d'une variable unique (uniquement `GEMINI_API_KEY`).
- **Option 2 (Sélectionnée)** : `AliasChoices` Pydantic prenant en charge `GEMINI_API_KEY`, `OPENAI_API_KEY`, et `AI_WATCHER_API_KEY`.
- **Raisonnement** : Maximise l'ergonomie développeur et la compatibilité avec les outils d'orchestration de conteneurs standards sans nécessiter de scripts wrappers personnalisés.

---

### 3. Implémentation & Code

Voir `src/ai_watcher/config.py`, `tests/test_secrets_injection.py`, et `tests/test_config.py`.

---

### 4. Liste de Contrôle & Livrables de la Session

- [x] Configuration de Pydantic `BaseSettings` avec `AliasChoices` pour charger dynamiquement les variables d'environnement de clés API au runtime.
- [x] Création d'une suite de tests unitaires ciblés `tests/test_secrets_injection.py` validant les alias de variables d'environnement, les codes de sortie en cas de secret manquant, et l'affichage d'erreurs claires.
- [x] Application de la politique de zéro secret en dur à travers la base de code et la configuration des images Docker.
- [x] Validation de 100 % de réussite des tests sur 195 cas de test avec 99,67 % de couverture de code.
