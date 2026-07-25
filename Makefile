# ==============================================================================
# Makefile - Interface de Commande Unifiée pour AIPE_Framework
# ==============================================================================
# Ce fichier sert d'interface d'entrée unique pour toutes les tâches courantes du
# projet (onboarding, nettoyage, linting, tests, lancement).
# Il permet d'abstraire la complexité des outils sous-jacents (Poetry, pytest, Ruff)
# et d'offrir une expérience développeur fluide (Zero-Setup Friction).
# ==============================================================================

# .PHONY indique à Make que ces cibles ne correspondent pas à des fichiers physiques
# sur le disque. Ainsi, même s'il existe un dossier nommé "install" ou "test",
# la commande `make install` ou `make test` s'exécutera toujours.
.PHONY: install clean lint test dev dashboard docker-build onboarding-check help

# La cible par défaut qui s'exécute si on tape juste `make`
help:
	@echo "======================================================================"
	@echo "                   AIPE_Framework - Commandes Disponibles              "
	@echo "======================================================================"
	@echo "  make install      - Onboarding : Installe les dépendances (Poetry) et"
	@echo "                      configure physiquement les hooks de commit locaux."
	@echo "  make clean        - Entretien : Supprime les caches de compilation,"
	@echo "                      de typage et de couverture de test."
	@echo "  make lint         - Qualité : Lance l'analyse Ruff (style & imports)"
	@echo "                      et le vérificateur de types Mypy (strict)."
	@echo "  make test         - QA : Exécute la suite complète de tests avec pytest."
	@echo "  make dashboard    - Interface : Démarre le dashboard interactif Flask"
	@echo "                      sur le port local 5001."
	@echo "  make dev          - Run : Démarre le microservice FastAPI de production"
	@echo "                      en mode rechargement automatique (reload)."
	@echo "  make docker-build - Docker : Construit l'image de production multi-stage"
	@echo "                      et affiche son poids final (objectif : < 250 Mo)."
	@echo "  make onboarding-check - Simulation : Clone le projet dans un dossier"
	@echo "                      temporaire et valide l'onboarding en < 5 min."
	@echo "======================================================================"

# --- 1. AUTOMATISATION DE L'ONBOARDING ET DU NETTOYAGE ---

# Installe les dépendances déclarées dans pyproject.toml via Poetry,
# puis initialise le hook pre-commit dans le répertoire Git (.git/hooks/pre-commit).
install:
	poetry install
	poetry run pre-commit install

# Purge tous les caches de tests et d'analyse statique ainsi que les fichiers
# de compilation Python compilés (*.pyc / __pycache__) pour repartir sur un état propre.
clean:
	@echo "Nettoyage des répertoires de cache et fichiers temporaires..."
	rm -rf .pytest_cache .mypy_cache .ruff_cache htmlcov .coverage
	# find . -type d -name "__pycache__" : cherche récursivement les dossiers __pycache__
	# -exec rm -rf {} + : applique la commande rm -rf sur tous les résultats trouvés
	find . -type d -name "__pycache__" -exec rm -rf {} +
	# find . -type f -name "*.pyc" -delete : cherche et supprime tous les fichiers .pyc
	find . -type f -name "*.pyc" -delete
	@echo "Nettoyage terminé."

# --- 2. INTÉGRATION DES VALIDATEURS ET EXÉCUTION ---

# Lance les vérifications de qualité de code statiques.
# 'poetry run' garantit l'exécution dans le contexte de l'environnement virtuel.
lint:
	@echo "--- [1/3] Analyse statique du style & imports (Ruff) ---"
	poetry run ruff check .
	@echo "--- [2/3] Validation du formatage du code (Ruff Format) ---"
	poetry run ruff format --check .
	@echo "--- [3/3] Vérification stricte des types statiques (Mypy) ---"
	poetry run python -m mypy src/

# Lance tous les tests unitaires et d'intégration via pytest
test:
	poetry run python -m pytest

# Démarre le serveur FastAPI (défini dans l'Étape 4.1)
dev:
	poetry run uvicorn src.main:app --reload --port 8000

# Lance le dashboard local interactif Flask
dashboard:
	poetry run python dashboard/app.py

# --- 3. CONTENEURISATION DE PRODUCTION ---

# Construit l'image Docker multi-stage de production (Étape 5.1).
# L'option '-t' attribue un nom et un tag à l'image.
# Après la construction, la taille de l'image est affichée pour vérifier
# le respect du critère de validation (< 250 Mo).
docker-build:
	@echo "--- Construction de l'image Docker multi-stage de production ---"
	docker build -t aipe-framework:latest .
	@echo "--- Poids de l'image finale ---"
	@docker images aipe-framework:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# --- 4. SIMULATION D'ONBOARDING (ZERO-SETUP FRICTION) ---

# Exécute le script de simulation d'onboarding complet (Étape 6.2).
# Ce script clone le projet dans un dossier temporaire, exécute 'make install',
# vérifie la cohérence de l'environnement et teste le healthcheck de l'API.
# Le chronomètre global doit rester sous les 300 secondes (5 minutes).
onboarding-check:
	@echo "--- Simulation d'onboarding Zero-Setup Friction ---"
	bash scripts/simulate_onboarding.sh
