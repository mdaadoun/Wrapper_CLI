# 🚀 Automated AI Watcher CLI (Wrapper_CLI) — Surveillance Technologique Automatisée

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.2+-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Poetry](https://img.shields.io/badge/poetry-1.7+-60A5FA?style=flat-square&logo=poetry&logoColor=white)](https://python-poetry.org/)
[![FastAPI 0.110+](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker Multi-Stage](https://img.shields.io/badge/docker-Multi--Stage-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Ruff](https://img.shields.io/badge/linter-Ruff-009688?style=flat-square)](https://github.com/astral-sh/ruff)
[![Mypy strict](https://img.shields.io/badge/typing-Mypy%20strict-blue?style=flat-square)](https://mypy-lang.org/)

[🇬🇧 English version available here](README.md)

**Wrapper_CLI** est une application CLI Python industrielle, résiliente, typée et hautement configurable permettant d'automatiser la veille technologique en IA, l'analyse d'impact et le suivi FinOps des requêtes LLM.

---

## 🎯 Fonctionnalités Clés & Spécifications

* **Onboarding Rapide (< 5 min) :** Prise en main zéro-friction (`make install` $\to$ prêt à développer).
* **Typage Stricte 100% :** Couverture totale Mypy en mode strict dans `src/`.
* **Gatekeeping Qualité Automatisé :** Hooks pre-commit (`detect-secrets`, `ruff`, `mypy`).
* **Conteneurisation Sécurisée :** Build Docker multi-stage non-root (< 250 Mo).
* **Dashboard Interactif Next.js :** Interface intégrée (`make dashboard`) pour le suivi de la feuille de route, la FAQ technique, le lanceur de tests QA et l'explorateur de code.

---

## 📂 Structure du Répertoire

```text
Wrapper_CLI/
│
├── README.md                   # Présentation principale en Anglais
├── README_fr.md                # Présentation du projet en Français
│
├── dashboard/                  # Dashboard interactif Next.js TypeScript & simulateur QA
│   ├── src/app/                # Routes App Router (Présentation, Roadmap, Glossaire, FAQ, Code)
│   └── src/lib/                # Analyseur AST de tests & parser Markdown
│
├── docs/                       # Spécifications et documentation technique
    ├── specifications_fr.md   # Cahier des charges fonctionnel et technique
    ├── roadmap_fr.md          # Feuille de route chronologique en 6 phases
    ├── glossary_fr.md         # Glossaire technique des concepts du CLI
    ├── questions_fr.md        # FAQ interactive d'entretien
    ├── code_fr.md             # Guide d'architecture du code source
    └── journal_fr.md          # Journal de bord et décisions d'architecture (ADR)
```

---

## 🚀 Démarrage Rapide

### 1. Initialiser le projet
```bash
make install
```

### 2. Lancer le Dashboard Interactif Next.js
```bash
make dashboard
```

### 3. Valider le style et les types (Ruff + Mypy)
```bash
make lint
```

### 4. Exécuter la suite de tests
```bash
make test
```
