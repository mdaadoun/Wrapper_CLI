# 📌 Séance 2.3 : Module d'Exceptions Personnalisées
**Date :** 27 Juillet 2026

*Cette séance s'est concentrée sur l'implémentation d'une hiérarchie d'exceptions granulaire et robuste pour le CLI AI Watcher. L'objectif est d'améliorer la gestion ciblée des erreurs et de fournir des retours clairs à l'utilisateur sans faire planter l'interpréteur.*

---

### 1. 🎓 Nouveaux Concepts Introduits

*   **Hiérarchie d'Exceptions :** Une structure en arbre de classes d'erreurs personnalisées héritant d'une classe de base commune. Cela permet aux développeurs d'attraper des erreurs métier spécifiques (comme une configuration manquante) sans masquer par inadvertance les exceptions système.
*   **Gestion Granulaire des Erreurs :** La pratique consistant à lever des exceptions précises et très descriptives, spécifiques à différents modes de défaillance (ex: extraction vs API LLM). Cela permet aux couches supérieures de l'application d'afficher des messages UI appropriés.

---

### 2. 🧠 Prises de Décisions & Choix Techniques

#### [Dilemme A : Classe de Base des Exceptions]
*   **Option A.1 : Hériter directement de `Exception` partout.**
    *   *Avantage/Inconvénient :* Simple, mais rend impossible la capture globale de "toutes les erreurs de l'application" dans le wrapper CLI principal sans attraper aussi les erreurs génériques de Python.
*   **Option A.2 : Créer une classe de base `WatcherError` (Retenue).**
    *   *Pourquoi ce choix ?* En faisant hériter toutes les exceptions personnalisées (`EmptySourceError`, `ExtractionError`, `LLMClientError`, `ConfigurationError`) de `WatcherError`, l'application Typer peut attraper globalement `WatcherError`. Elle gère ainsi les échecs connus de manière élégante en affichant un message d'erreur stylisé et en quittant avec le code `1`, sans afficher de traces d'appels Python indésirables.

---

### 3. 🛠️ Implémentation & Auto-Documentation

Implémentation de `exceptions.py` avec typage strict et intégration dans `main.py`, `config.py`, et `detector.py`.

#### Tests ajoutés :
*   `test_exception_hierarchy` : Valide la structure d'héritage des classes d'exceptions personnalisées.
*   Des fonctions de test spécifiques vérifiant que chaque exception (`EmptySourceError`, `ExtractionError`, `LLMClientError`, `ConfigurationError`) peut être levée et attrapée avec succès.

#### Commandes de validation à exécuter localement :
```bash
make lint
make test
```
*La commande doit renvoyer un statut vert avec 100% de couverture, garantissant que toutes les exceptions sont correctement intégrées et typées.*

---

### 4. 📌 Bilan du Jour

1.  **[Hiérarchie d'Exceptions]** Création de la classe de base `WatcherError` et des sous-classes d'exceptions spécifiques.
2.  **[Validation Stricte]** Mise à jour du code pour passer les vérifications `mypy` et `ruff`.
3.  **[Ajout à la Suite de Tests]** Création de `tests/test_exceptions.py` pour valider le comportement correct des exceptions, intégré automatiquement au dashboard interactif.
