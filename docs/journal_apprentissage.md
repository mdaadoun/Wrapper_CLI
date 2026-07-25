# 📓 Journal d'Apprentissage : Wrapper CLI de Veille IA

Ce journal documente les séances de cadrage, de conception et les décisions d'architecture prises lors du développement du projet **3_Wrapper_CLI**.

---

## 📅 Séance 1 : Initialisation du Dépôt & Cadrage (25 Juillet 2026)

### Objectif de la séance
Mettre en place la structure initiale du projet `3_Wrapper_CLI` à partir de la base d'ingénierie AIPE Framework et formaliser les spécifications fonctionnelles du CLI de veille.

### Sujets abordés & Décisions
1. **Socle d'Ingenierie** :
   - Réutilisation du Blueprint `2_AIPE_Framework` (Poetry, Pre-commit, Ruff, Mypy, Pytest, Docker multi-stage).
   - Nettoyage des historiques d'apprentissage du projet 2 et intégration du cahier des charges spécifique au CLI.
2. **Architecture du CLI** :
   - Choix des bibliothèques `Typer` (ou Click) pour l'interface de commande et `Rich` pour le rendu visuel console.
   - Pydantic pour la validation des formats d'entrée et de sortie des synthèses LLM.

---
