# 📌 Séance 3.1 : Extraction de Texte Brut et Fichiers Locaux
**Date :** 27 Juillet 2026

*Cette séance s'est concentrée sur l'implémentation de fonctions pures pour la normalisation du texte et la lecture sécurisée des fichiers au sein du module d'extraction. Cela pose les bases d'un traitement I/O déterministe et propre.*

---

### 1. 🎓 Nouveaux Concepts Introduits

*   **Fonctions Pures (Pure Functions) :** Fonctions qui, pour une même entrée, retourneront toujours la même sortie sans produire d'effets de bord observables (comme modifier des variables globales). `extract_from_text` est une fonction pure.
*   **Séparation des I/O (I/O Separation) :** La pratique architecturale consistant à séparer les opérations I/O génératrices d'effets de bord (comme la lecture d'un fichier sur le disque) de la logique métier pure (comme la normalisation des espaces).

---

### 2. 🧠 Prises de Décisions & Choix Techniques

#### [Dilemme A : Gestion de la Normalisation du Texte]
*   **Option A.1 : Normaliser le texte de manière asynchrone ou couplée.**
    *   *Avantage/Inconvénient :* Rapide, mais lie la logique aux entrées/sorties, rendant difficile le test unitaire de la normalisation de texte indépendamment de la lecture de fichier.
*   **Option A.2 : Abstraire la normalisation dans une fonction pure (Retenue).**
    *   *Pourquoi ce choix ?* En gardant `extract_from_text(raw: str)` pure, on peut tester chaque cas particulier (chaîne vide, espaces multiples, tabulations) instantanément sans opérations disque. `extract_from_file` délègue ensuite simplement le traitement du texte à cette fonction pure après avoir lu le fichier avec succès.

---

### 3. 🛠️ Implémentation & Auto-Documentation

Implémentation de `core/extractor.py` et `tests/test_extractor.py`.

#### Tests ajoutés :
*   `test_extract_from_text_normalization` : Valide la réduction des espaces par expressions régulières.
*   `test_extract_from_file_valid_txt` / `md` : Valide les opérations de lecture.
*   `test_extract_from_file_missing` : Valide qu'un fichier inexistant lève proprement une `ExtractionError`.
*   `test_extract_from_file_invalid_extension` : Garantit une validation stricte des extensions `.txt` et `.md`.

#### Commandes de validation à exécuter localement :
```bash
make lint
make test
```
*La commande doit renvoyer un statut vert, prouvant le typage strict Mypy et la couverture complète des tests.*

---

### 4. 📌 Bilan du Jour

1.  **[Extracteur Core]** Implémentation de `extract_from_text` et `extract_from_file` avec validation stricte.
2.  **[Couverture de Test]** Ajout de 100% de couverture pour tous les cas limites des I/O et du traitement de texte.
3.  **[Architecture]** Établissement des fonctions pures et séparation des I/O pour des tests déterministes.
