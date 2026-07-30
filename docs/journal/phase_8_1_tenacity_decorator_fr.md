# Journal de Dév Session 8.1 : Décorateur Tenacity avec Backoff Exponentiel

**Date:** 2026-07-30

Mise en œuvre de la résilience réseau à l'aide du décorateur Tenacity `@retry` avec un backoff exponentiel et une gigue (jitter) aléatoire pour gérer les erreurs HTTP 429, HTTP 5xx et les erreurs de connexion transitoires.

---

### 1. Concepts Introduits

- **Backoff Exponentiel avec Jitter :** Délai augmentant de manière exponentielle avec une variation aléatoire entre les tentatives pour éviter les pics de type "troupeau foudroyant" sur les API.
- **Classification Granulaire des Exceptions :** Séparation des erreurs transitoires (429, 5xx, connexion) des erreurs client non réessayables (401, 400).
- **Décorateur de Réessai Tenacity :** Orchestration déclarative des réessais avec des limites configurables, des stratégies d'attente et des callbacks de log.

---

### 2. Décisions d'Architecture (ADR)

#### ADR 1 : Décorateur Tenacity @retry sur le transport interne
- Option 1 : Boucle manuelle avec appels explicites à time.sleep.
- Option 2 (Sélectionnée) : Décorer la méthode interne _post_with_retry avec Tenacity @retry en utilisant wait_exponential_jitter.
- **Justification :** Le décorateur déclaratif isole la logique de transport, élimine le code répétitif et garantit une gigue fiable.

#### ADR 2 : Hiérarchie des Exceptions via LLMRetryableError
- Option 1 : Réessayer sur toute Exception ou LLMClientError générique.
- Option 2 (Sélectionnée) : Introduire LLMRetryableError héritant de LLMClientError pour cibler explicitement les erreurs 429, 5xx et réseau.
- **Justification :** Empêche les réessais inutiles sur les erreurs client permanentes (ex: 401) tout en préservant la compatibilité ascendante.

#### ADR 3 : Observabilité via before_sleep
- Option 1 : Réessais silencieux sans retour console.
- Option 2 (Sélectionnée) : Callback d'avertissement Rich Console affichant des indicateurs jaunes avec le numéro de tentative.
- **Justification :** Fournit un retour utilisateur clair et instantané lors de coupures réseau transitoires.

---

### 3. Implémentation & Code

Voir `src/ai_watcher/clients/llm_client.py` et `src/ai_watcher/exceptions.py`.

---

### 4. Checklist & Livrables

- [x] Définition de `LLMRetryableError`.
- [x] Implémentation de Tenacity `@retry` avec jitter.
- [x] Intégration du callback de logging `before_sleep`.
- [x] Tests unitaires validés.
