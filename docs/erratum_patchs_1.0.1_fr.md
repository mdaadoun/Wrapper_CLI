# 📄 Erratum & Patch Architectural : AI Watcher CLI Wrapper

**Statut du Document :** Patch Approuvé
**Version Cible :** 1.0.1
**Objectif :** Résoudre les cas limites liés aux limites de tokens, à l'invalidation du Cache, aux sorties structurées de l'API, aux limitations du scraping, et au respect des limites de taux.

---

## Partie 1 : Corrections Architecturales (Mises à jour FTRS & SAS)

Appliquez les modifications suivantes à vos spécifications existantes :

### 1. FTRS TS-04 : Mise à jour de la Contrainte d'Outillage

* **Original :** `BeautifulSoup4` pour le web scraping (suppression manuelle des balises).
* **Correction :** Remplacer ou augmenter avec `readability-lxml` (un portage Python du Readability de Mozilla) pour extraire le texte principal de l'article et contourner le bruit injecté par JS, les bannières de cookies, et les menus de navigation.

### 2. SAS 3.1 & Règle 3 : Sorties Structurées Natives

* **Original :** S'appuyer sur les invites système (system prompts) pour faire respecter la conformité Pydantic/JSON.
* **Correction :** Le `LLMClient` DOIT utiliser les fonctionnalités de sortie structurée natives du fournisseur (par exemple, en passant le schéma JSON directement dans le `response_format` d'OpenAI ou en utilisant `instructor`). L'incitation (prompting) seule est interdite pour l'application du schéma.

### 3. SAS 3.3 : Clé du Mécanisme de Cache

* **Original :** Clé de Cache = `SHA-256(cleaned_extracted_text + model_name)`.
* **Correction :** Clé de Cache = `SHA-256(cleaned_extracted_text + model_name + SCHEMA_VERSION)`. Une constante `SCHEMA_VERSION` (par exemple, `"v1"`) doit être définie dans `config.py` et incrémentée chaque fois que le modèle Pydantic `AnalysisReport` change pour éviter les crashs d'analyse.

### 4. SAS 3.2 : Résilience & Politique Réseau

* **Original :** Tenacity utilise strictement un backoff exponentiel jusqu'à 10s pour HTTP 429.
* **Correction :** Le client doit tenter de lire l'en-tête HTTP `Retry-After` sur les réponses 429. S'il est présent, le mécanisme de réessai doit se mettre en pause (sleep) pour la durée exacte demandée par le fournisseur avant de reprendre la boucle de backoff de Tenacity.

---

## Partie 2 : Feuille de Route Supplémentaire (Étapes d'Intégration)

Insérez ces étapes dans votre tableau de bord de suivi de Phase existant pour implémenter les corrections de l'erratum.

### Mise à jour de la Phase 3 : Ingestion & Découpage (Chunking)

**Étape 3.2 (Patch) : Extraction Sémantique HTML**

* **Description :** Mettre à jour `extract_from_url` dans `core/extractor.py`. Récupérer le HTML brut via HTTPX, mais le faire passer à travers `readability.Document(html).summary()` avant d'utiliser BeautifulSoup pour supprimer les balises restantes.
* **Concept Clé :** Isolation du contenu — laisser des heuristiques dédiées identifier le "corps de l'article" évite de gaspiller des tokens sur les barres latérales et les pieds de page.
* **Critère de Validation :** Le scraping d'une URL de nouvelles technologiques denses n'extrait que le texte de l'article, ignorant complètement les liens de navigation et les espaces publicitaires.

**Étape 3.4 (Nouveau) : Découpeur de Document Sensible aux Tokens (Token-Aware Document Chunker)**

* **Description :** Implémenter `core/chunker.py` avec une fonction `chunk_text(text: str, max_tokens: int = 15000) -> list[str]`. Utiliser `tiktoken` (ou une approximation simple par ratio de caractères) pour diviser les textes massifs aux limites de paragraphe (`\n\n`) s'ils dépassent la fenêtre de contexte.
* **Concept Clé :** Gestion de la Fenêtre de Contexte — prévient les erreurs de l'API `HTTP 400 Context Length Exceeded` et les coûts FinOps illimités.
* **Critère de Validation :** Le passage d'une chaîne de texte de 50 000 mots retourne une liste de chaînes plus petites, aucune ne dépassant la limite de tokens définie.

### Mise à jour de la Phase 4 : Client LLM

**Étape 4.2.1 (Patch) : Intégration de la Charge Utile (Payload) du Schéma JSON**

* **Description :** Mettre à jour `clients/llm_client.py`. Au lieu de simplement demander du JSON dans l'invite (prompt), extraire le schéma en utilisant `AnalysisReport.model_json_schema()` et le passer au SDK de l'API (par exemple, `response_format={"type": "json_schema", "json_schema": {"name": "report", "schema": ...}}` d'OpenAI).
* **Concept Clé :** Déterminisme au Niveau de l'API — décharger la conformité du schéma sur les contraintes grammaticales internes du fournisseur LLM garantit zéro erreur d'analyse.
* **Critère de Validation :** L'API retourne un JSON 100% conforme sur 50 appels consécutifs à une température de `0.3` sans jamais produire de blocs Markdown (blockticks).

### Mise à jour de la Phase 7 : Cache Local

**Étape 7.1.1 (Patch) : Clés de Cache Sensibles au Schéma**

* **Description :** Ajouter `SCHEMA_VERSION = "1.0"` à `config.py`. Mettre à jour la fonction de hachage dans `utils/cache.py` pour concaténer `text + model + SCHEMA_VERSION` avant le hachage.
* **Concept Clé :** Prévention de l'Empoisonnement du Cache — dissocier les charges utiles (payloads) mises en cache des futures mises à jour du code.
* **Critère de Validation :** Le changement de `SCHEMA_VERSION` à `"1.1"` force un échec de Cache (cache miss) sur les URL précédemment traitées, déclenchant un nouvel appel API.

### Mise à jour de la Phase 8 : Résilience Réseau

**Étape 8.1.1 (Patch) : Intercepteur `Retry-After` Dynamique**

* **Description :** À l'intérieur de `llm_client.py`, envelopper l'appel API dans un bloc `try/except` *à l'intérieur* de la fonction décorée Tenacity. Attraper `httpx.HTTPStatusError`. Si `status_code == 429` et que `'Retry-After'` est dans les en-têtes, exécuter `time.sleep(int(headers['Retry-After']))` avant de relancer l'exception pour que Tenacity l'attrape.
* **Concept Clé :** Conformité avec le Fournisseur — respecter les demandes explicites de backoff du serveur évite les bannissements d'IP.
* **Critère de Validation :** Une réponse 429 simulée (mocked) avec `Retry-After: 30` fait que l'application se met en pause pendant exactement 30 secondes avant que Tenacity ne consigne la prochaine tentative.
