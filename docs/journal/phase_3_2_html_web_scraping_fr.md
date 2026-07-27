# 📌 Séance 3.2 : Scraping Web HTML pour les URLs
**Date :** 27 Juillet 2026

*Cette séance a introduit les capacités de scraping web dans le module `extractor.py`, avec un focus sur l'extraction de texte propre et optimisé pour les LLMs à partir de HTML brut, en utilisant `httpx` et `BeautifulSoup4`.*

---

### 1. 🎓 Nouveaux Concepts Introduits

*   **HTML Cleaning Pipeline (Pipeline de nettoyage HTML) :** Un pipeline spécialement conçu pour parser le HTML brut, supprimer les balises bruyantes (comme `<script>`, `<style>`, `<nav>`, `<footer>`), et extraire uniquement le texte lisible par un humain.
*   **Réduction de Bruit (Noise Reduction) :** Dans le contexte des LLMs, le bruit fait référence aux caractères et balises qui consomment de précieux tokens sans contribuer au sens. Leur suppression réduit les coûts d'API et améliore la vitesse de raisonnement du LLM.

---

### 2. 🧠 Prises de Décisions & Choix Techniques

#### [Dilemme A : Librairie de Parsing HTML]
*   **Option A.1 : Suppression de balises basée sur des Regex.**
    *   *Avantage/Inconvénient :* Rapide et sans dépendance, mais extrêmement fragile face à du HTML mal formaté ou des structures imbriquées.
*   **Option A.2 : Utilisation de BeautifulSoup4 (Retenue).**
    *   *Pourquoi ce choix ?* `bs4` est le standard de l'industrie pour le parsing robuste de HTML en Python. Il gère sans effort le HTML malformé et fournit des APIs puissantes comme `.decompose()` pour supprimer sélectivement certaines balises avant d'extraire le texte.

#### [Dilemme B : Requêtes Réseau]
*   **Option B.1 : Utilisation des bibliothèques intégrées `urllib` ou `requests`.**
    *   *Avantage/Inconvénient :* `urllib` est lourd. `requests` est standard mais strictement synchrone.
*   **Option B.2 : Utilisation de `httpx` (Retenue).**
    *   *Pourquoi ce choix ?* `httpx` est moderne, entièrement typé, et propose des APIs synchrones et asynchrones. Bien que nous utilisions le mode synchrone ici, cela nous prépare parfaitement à une future concurrence asynchrone si nous décidons de scraper plusieurs URLs simultanément.

---

### 3. 🛠️ Implémentation & Auto-Documentation

Implémentation de `extract_from_url` dans `core/extractor.py`.

#### Tests ajoutés :
*   `test_extract_from_url_success` : Utilise `unittest.mock.patch` pour vérifier que `bs4` supprime correctement `<nav>`, `<header>`, `<footer>`, et `<script>`, renvoyant un texte parfaitement normalisé.
*   `test_extract_from_url_http_error` : Valide qu'une erreur 404 se traduit correctement par une `ExtractionError` du domaine.
*   `test_extract_from_url_network_error` : Valide qu'un timeout ou un échec DNS lève proprement une `ExtractionError`.

#### Commandes de validation à exécuter localement :
```bash
make lint
make test
```

---

### 4. 📌 Bilan du Jour

1.  **[Scraping Web]** Intégration de `httpx` et `BeautifulSoup4` pour un parsing HTML robuste.
2.  **[Réduction du Bruit]** Implémentation de la décomposition ciblée des balises pour préserver les tokens.
3.  **[Résilience]** Ajout d'une gestion des erreurs réseau directement liée à la hiérarchie des exceptions personnalisées.
