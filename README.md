# 🚀 Wrapper CLI de Veille IA Automatisée

Outil en ligne de commande (CLI) industriel, résilient, typé et hautement configurable en Python pour automatiser la veille technologique IA, l'analyse d'impact et la mesure FinOps des requêtes LLM.

## 🛠️ Stack Technique

- **Langage & Isolation** : Python 3.10+, Poetry
- **Interface CLI & UI** : Typer / Click, Rich
- **Validation & Schémas** : Pydantic v2
- **Scraping & Reseau** : HTTPX, BeautifulSoup4
- **Qualité & CI/CD** : Ruff, Mypy (strict), Pytest, Pre-commit (detect-secrets)
- **Conteneurisation** : Docker Multi-stage (non-root)

## 📋 Démarrage Rapide

```bash
# Configuration de l'environnement
make install

# Exécuter les vérifications de qualité
make lint

# Lancer la suite de tests
make test
```

## 📚 Documentation

- [Cahier des charges (CDCF)](file:///home/michael/Code/ai-engineering/projets/3_Wrapper_CLI/docs/cahier_charges.md)
- [Feuille de route (Roadmap)](file:///home/michael/Code/ai-engineering/projets/3_Wrapper_CLI/docs/roadmap_details.md)
- [Journal d'apprentissage](file:///home/michael/Code/ai-engineering/projets/3_Wrapper_CLI/docs/journal_apprentissage.md)
