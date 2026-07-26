# 📖 Guide d'Architecture & Référence du Code Source

Ce document présente une explication détaillée de l'architecture du projet `Wrapper_CLI`, des modules, des commandes et de la configuration de build.

---

## 🛠️ 1. Point d'Entrée Principal : `src/ai_watcher/__init__.py`

- **Rôle :** Point d'entrée du paquet principal de l'outil CLI d'analyse et de veille IA.

---

## 📦 2. Manifeste & Environnement Projet : `pyproject.toml`

- **Rôle :** Déclaration centralisée du projet via Poetry. Définit les dépendances du CLI, l'outillage de qualité (`pytest`, `ruff`, `mypy`, `pre-commit`, `detect-secrets`) et les paramètres des linters.

---

## 🛠️ 3. Automatisation des Tâches : `Makefile`

- **Rôle :** Offre une interface de commandes unifiée pour les workflows (`make install`, `make lint`, `make test`, `make docker-build`, `make onboarding-check`).

---

## 🐳 4. Conteneurisation & Sécurité : `Dockerfile`

- **Rôle :** Image Docker de production multi-stage produisant un conteneur d'exécution non-root ultra-sécurisé et léger (< 250 Mo).

---

## 🔐 5. Contrôle Qualité Pré-Commit : `.pre-commit-config.yaml`

- **Rôle :** Configure les hooks Git pre-commit locaux pour vérifier le style, le typage strict et détecter les secrets (`detect-secrets`).

---

## 🚀 6. Simulation d'Onboarding : `scripts/simulate_onboarding.sh`

- **Rôle :** Script de validation automatisé E2E qui valide le scénario Zero-Setup Friction en moins de 300 secondes.
