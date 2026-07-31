# 🚀 Automated AI Watcher CLI (Wrapper_CLI) — Surveillance Technologique Automatisée

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.2+-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Poetry](https://img.shields.io/badge/poetry-1.7+-60A5FA?style=flat-square&logo=poetry&logoColor=white)](https://python-poetry.org/)
[![FastAPI 0.110+](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker Multi-Stage](https://img.shields.io/badge/docker-Multi--Stage-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Ruff](https://img.shields.io/badge/linter-Ruff-009688?style=flat-square)](https://github.com/astral-sh/ruff)
[![Mypy strict](https://img.shields.io/badge/typing-Mypy%20strict-blue?style=flat-square)](https://mypy-lang.org/)

[🇬🇧 English version available here](README.md)

**AI Watcher CLI (Wrapper_CLI)** est une application CLI Python industrielle, résiliente, typée et hautement configurable permettant d'automatiser la veille technologique en IA, l'analyse d'impact et le suivi FinOps des requêtes LLM.

---

## 🎯 Fonctionnalités Clés & Spécifications

* **Onboarding Rapide (< 5 min) :** Prise en main zéro-friction (`make install` $\to$ prêt à développer).
* **Ingestion de Données Multi-Sources :** Détection automatique transparente ou flags explicites pour **Texte Brut**, **Fichiers Locaux** (`.txt`, `.md`), et **URLs Web** (via BeautifulSoup4).
* **Métriques FinOps de Coûts & Tokens :** Calcul précis des coûts à travers plus de 40 modèles LLM avec suivi de l'efficacité des tokens (tokens par seconde).
* **Transport Résilient & Fallbacks :** Décorateur de relance Tenacity intégré avec backoff exponentiel et mode hors ligne `--demo`.
* **Mise en Cache SHA-256 Intelligente :** Cache de contenu JSON local avec durée de vie configurable (`--cache-ttl`) et options de contournement (`--no-cache`).
* **Moteur d'Export Multi-Formats :** Interface console enrichie (Rich UI), rapports Markdown formatés (`-o report.md`), et sortie JSON brute Pydantic V2 (`-o json`).
* **Conteneurisation Multi-Stage Sécurisée :** Runtime conteneurisé non-root (< 250 Mo) respectant les politiques de zéro-secret-intégré.
* **Dashboard Interactif Next.js :** Interface web (`make dashboard`) avec exécuteur de tests AST dynamique, feuille de route interactive, FAQ technique et explorateur de code.

---

## 💻 Exemples d'Utilisation CLI sur 3 Sources d'Entrée

### 1. Ingestion de Texte Brut
```bash
# Auto-détection de texte brut en mode démo hors ligne
ai-watcher scan "Google announces Gemini 1.5 Pro with 2M token context window." --demo

# Mode texte brut explicite
ai-watcher scan -t "Quantum computing breakthrough achieved." --demo
```

### 2. Ingestion de Fichier Local
```bash
# Auto-détection d'un fichier markdown/texte local
ai-watcher scan ./docs/specifications_en.md --demo

# Mode fichier local explicite avec export personnalisé de rapport Markdown
ai-watcher scan -f ./article.txt -o summary.md --demo
```

### 3. Ingestion d'URL Web
```bash
# Scraping d'URL Web auto-détecté
ai-watcher scan https://news.ycombinator.com --demo

# Mode URL Web explicite avec sortie JSON brute sur stdout
ai-watcher scan -u https://example.com/tech-news -o json --demo
```

---

## 🎛️ Référence des Options (Flags)

| Flag | Raccourci | Description | Par défaut |
| :--- | :--- | :--- | :--- |
| `source` | *(Positionnel)* | Entrée source à analyser (chaîne de texte, chemin de fichier, ou URL HTTP/HTTPS) | **Requis** |
| `--text` | `-t` | Force l'interprétation de l'entrée comme une chaîne de texte brut | `False` |
| `--file` | `-f` | Force l'interprétation de l'entrée comme un chemin de fichier local | `False` |
| `--url` | `-u` | Force l'interprétation de l'entrée comme une URL web | `False` |
| `--output` | `-o` | Destination de sortie : `console` (Rich UI), `json` (stdout), ou nom de fichier (`.md`, `.json`) | `console` |
| `--demo` | `-d` | Exécute en mode démo hors ligne avec des réponses LLM mockées | `False` |
| `--cache-ttl` | | Durée de vie du cache local en secondes (0 force une nouvelle analyse) | `3600` |
| `--no-cache` | | Contourne la lecture et l'écriture du cache local | `False` |

---

## 🐳 Instructions de Déploiement & d'Exécution Docker

AI Watcher est prêt à être packagé avec une image de conteneur Docker multi-stage non-root.

### 1. Construire l'Image Docker
```bash
docker build -t ai-watcher .
```

### 2. Exécuter en Mode Démo Hors Ligne
```bash
docker run --rm ai-watcher scan "Dockerized AI analysis demo" --demo
```

### 3. Exécuter avec Injection de Secrets d'API en Direct
```bash
docker run --rm -e GEMINI_API_KEY="$GEMINI_API_KEY" ai-watcher scan "https://news.ycombinator.com"
```

---

## 💰 Décomposition des Coûts FinOps & Tokens

AI Watcher intègre une matrice de tarification supportant plus de 40 modèles LLM (OpenAI GPT-4o, Anthropic Claude 3.5, Google Gemini 1.5, Meta Llama 3).

### Logique de Tarification & Métriques
* **Formule de Coût :**
  $$\text{Coût Total (USD)} = \frac{\text{Tokens d'Entrée} \times \text{Prix d'Entrée}}{1,000,000} + \frac{\text{Tokens de Sortie} \times \text{Prix de Sortie}}{1,000,000}$$
* **Affichage du Tableau des Métriques :** Affiche les tokens d'entrée/sortie, la latence en secondes, le débit (tokens/sec), et le coût calculé en USD arrondi à 6 décimales.

---

## 🚀 Guide de Démarrage Rapide (Développement & Dashboard)

### 1. Onboarding & Installation
```bash
make install
```

### 2. Lancer le Dashboard Interactif Next.js
```bash
make dashboard
```

### 3. Valider le style et les types (Ruff + Mypy Strict)
```bash
make lint
```

### 4. Exécuter la Suite Complète de Tests & Couverture
```bash
make test
```

---

## 📂 Structure du Répertoire

```text
Wrapper_CLI/
│
├── README.md                   # Présentation principale en Anglais & manuel d'utilisation CLI
├── README_fr.md                # Présentation du projet en Français
├── Dockerfile                  # Fichier de build Docker multi-stage de production
├── Makefile                    # Commandes développeur (install, lint, test, dashboard)
├── pyproject.toml              # Dépendances Poetry & configurations d'outils
│
├── dashboard/                  # Dashboard interactif Next.js 16 TypeScript
│   ├── src/app/                # Routes App Router (Présentation, Roadmap, Glossaire, FAQ, Code)
│   └── src/lib/                # Analyseur AST de tests & parser Markdown
│
├── docs/                       # Spécifications et documentation technique
│   ├── specifications_fr.md   # Cahier des charges fonctionnel et technique
│   ├── roadmap_fr.md          # Feuille de route chronologique en 6 phases
│   ├── glossary_fr.md         # Glossaire technique des concepts du CLI
│   ├── questions_fr.md        # FAQ interactive d'entretien
│   ├── code_fr.md             # Guide d'architecture du code source
│   └── journal/               # Journal de bord et décisions d'architecture (ADR)
│
├── src/ai_watcher/             # Package Python principal
│   ├── clients/               # Client de transport LLM & mock du mode démo
│   ├── core/                  # Détecteur de type de source & extracteur d'ingestion
│   ├── formatters/            # UI console enrichie & exportateur markdown
│   ├── schemas/               # Modèles de données Pydantic V2
│   └── utils/                 # Calculateur de coûts FinOps, cache SHA-256 & helpers doc
│
└── tests/                      # Suite de tests automatisés (Pytest + Coverage)
```
