# 🚀 CLI de Veille IA Automatisée (Wrapper_CLI)

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Poetry](https://img.shields.io/badge/poetry-1.7+-60A5FA?style=flat-square&logo=poetry&logoColor=white)](https://python-poetry.org/)
[![FastAPI 0.110+](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker Multi-Stage](https://img.shields.io/badge/docker-Multi--Stage-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Ruff](https://img.shields.io/badge/linter-Ruff-009688?style=flat-square)](https://github.com/astral-sh/ruff)
[![Mypy strict](https://img.shields.io/badge/typing-Mypy%20strict-blue?style=flat-square)](https://mypy-lang.org/)

[🇬🇧 English version available here](README.md)

**Wrapper_CLI** est un outil en ligne de commande (CLI) industriel, résilient, typé et hautement configurable en Python pour automatiser la veille technologique IA, l'analyse d'impact et la mesure FinOps des requêtes LLM.

---

## 🎯 Caractéristiques Clés & Spécifications

* **Zero-Setup Friction :** Onboarding en moins de 5 minutes (`make install` $\to$ prêt à développer).
* **Typage Strict :** Couverture 100% Mypy strict dans `src/`.
* **Contrôle Qualité Automatique :** Hooks pre-commit (`detect-secrets`, `ruff`, `mypy`).
* **Conteneurisation Sécurisée :** Docker multi-stage non-root (< 250 Mo).

---

## 📂 Structure du Dépôt

```text
Wrapper_CLI/
│
├── README.md                   # Présentation principale en anglais & Guide de démarrage
├── README_fr.md                # Version française de la présentation
│
├── docs/                       # Spécifications et documentation d'architecture
    ├── specifications_fr.md    # Cahier des charges fonctionnel et technique
    ├── roadmap_fr.md           # Feuille de route chronologique par étapes
    ├── glossary_fr.md          # Glossaire des concepts techniques clés
    ├── questions_fr.md         # FAQ interactive pour simulation d'entretien
    ├── code_fr.md              # Guide d'architecture et référence du code source
    └── journal_fr.md           # Journal de bord d'apprentissage et choix d'architecture
```

---

## 🚀 Démarrage Rapide

### 1. Initialiser le projet (Onboarding)
```bash
make install
```

### 2. Exécuter les contrôles de qualité (Ruff + Mypy strict)
```bash
make lint
```

### 3. Lancer la suite de tests
```bash
make test
```
