# 📋 CAHIER DES CHARGES TECHNIQUE & FONCTIONNEL (CDCF)

**Projet 1 :** Wrapper CLI de Veille IA Automatisée
**Base de départ :** Environnement standardisé du Kit Projet 0 (Docker, Poetry, Ruff, Mypy, Pytest)
**Niveau :** Débutant à Intermédiaire (Junior Dev → AI Product Engineer)

-----

## 🧭 1. Contexte & Objectifs Produit

### 1.1 Contexte Métier

Dans un écosystème de l'IA en évolution continue (nouveaux modèles, benchmarks, grilles tarifaires), une équipe produit passe plusieurs heures par jour à éplucher manuellement les newsletters, blogs tech, dépêches et flux RSS pour identifier les tendances. Cette tâche artisanale est chronophage, sujette aux biais d'attention et déconnectée des workflows terminaux des développeurs. De plus, les interfaces web classiques (type ChatGPT/Claude) ne permettent pas de mesurer précisément les métriques d'ingénierie essentielles (coûts au million de tokens, latences réelles de calcul).

### 1.2 Objectif Principal

Développer un **outil en ligne de commande (CLI)** industriel, résilient, typé et hautement configurable en Python. Cet outil automatise la récupération, l'analyse et la synthèse de textes bruts ou de sources d'actualités technologiques par l'intermédiaire de LLM, tout en assurant un contrôle strict FinOps (calcul des tokens, estimation budgétaire en USD) et une tolérance totale aux pannes réseau. Le programme est conçu pour être exécuté à la demande ou de manière automatisée via une tâche programmée (`cron` ou pipeline CI/CD).

### 1.3 Indicateurs Clés de Performance (KPI Produit)

  * **Temps de génération moyen :** \< 15 secondes par analyse.
  * **Fiabilité de structuration :** Taux de conformité des outputs JSON/Pydantic \> 98%.
  * **Intelligence Économique :** Coût moyen par analyse stabilisé en dessous de $0.05.
  * **Flexibilité d'entrée :** Capacité à traiter indifféremment 3 types de sources (URL, fichier local, texte direct).

-----

## 🎯 2. Spécifications Fonctionnelles (MVP)

### SF-01 : Saisie Utilisateur & Gestion des Sources

Le CLI doit accepter plusieurs modes de capture d'information pour sa commande principale :

  * **Texte direct :** Saisie brute entre guillemets via l'argument principal ou l'option `--text` / `-t`.
  * **Fichier local :** Lecture de fichiers textes ou Markdown (`.txt`, `.md`).
  * **URL (Web scraping) :** Extraction du contenu textuel d'une page HTML (ex: Hacker News, TechCrunch, arXiv) avec un pipeline de nettoyage (suppression des balises et des espaces superflus).
  * **Validation :** Si la saisie est vide, inexistante ou constituée uniquement d'espaces, l'application doit lever une erreur explicite, renvoyer un code de retour `1` et s'interrompre proprement sans crash de l'interpréteur Python.

### SF-02 : Pipeline de Génération par LLM (Orchestration)

  * **Consignes du modèle :** Le système injecte le texte nettoyé dans un prompt systémique rigoureux qui instruit le LLM d'agir comme un analyste senior spécialisé en IA.
  * **Contrainte de format :** La réponse finale doit être structurée selon un schéma de données strict (résumé exécutif, impacts clés, recommandations).
  * **Contrainte de taille :** La génération est bridée via un paramètre `max_tokens` (configurable, par défaut entre 300 et 500 tokens pour les résumés simples, extensible jusqu'à 2000 tokens pour les analyses d'impact approfondies) afin d'éviter le gaspillage de budget.

### SF-03 : Tracking Métriques & Observabilité FinOps

Après chaque appel d'API réussi, le système extrait les métadonnées de consommation et calcule en temps réel :

  * Le nombre exact de **tokens d'entrée** (*Prompt tokens*).
  * Le nombre exact de **tokens de sortie** (*Completion tokens*).
  * Le **temps d'exécution global** de la requête (latence en secondes ou millisecondes).
  * Le **coût financier précis en USD**, calculé dynamiquement d'après la grille tarifaire au million de tokens du modèle sélectionné.

### SF-04 : Affichage Console Enrichi & Formats de Sortie

Le CLI s'appuie sur la bibliothèque **Rich** pour proposer une expérience utilisateur haut de gamme :

  * **Rendu Markdown :** Affichage de la synthèse dans un panneau élégant prenant correctement en charge la syntaxe enrichie (titres, puces, gras).
  * **Tableau récapitulatif :** Un tableau récapitule de manière hiérarchisée les métriques FinOps de l'inférence (durée, tokens, coût exact).
  * **Options d'export (F5) :** L'utilisateur peut choisir le format via l'option `--output` / `-o` :
      * `console` : Affichage Rich interactif (par défaut).
      * `json` : Sortie brute exploitable pour les pipelines logiciels en aval.
      * `markdown` : Sauvegarde directe dans un fichier externe (ex: `--output report.md`).

### SF-05 : Système de Cache Local (Performance & FinOps)

  * Pour éviter le re-traitement redondant du même contenu (et économiser la latence et les coûts d'API), l'application doit intégrer un système de persistance locale.
  * Les données analysées sont stockées (par empreinte de hachage ou URI) dans un fichier JSON local (ex: `~/.cache/veille_ia.json`).
  * Durée de validité du cache réglable (ex: `--cache-ttl 3600`), débrayable à la demande à l'aide d'un drapeau `--no-cache`.

-----

## 🛠️ 3. Spécifications Techniques & Architecture

### ST-01 : Alignement Environnement Écosystème

  * **Runtime :** Python **3.11+** avec typage statique strict.
  * **Gestionnaire de dépendances :** **Poetry** configuré en mode strict avec fichier `poetry.lock` reproductible.
  * **Secrets :** Isolation absolue de la clé d'authentification (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.) via un fichier `.env` local, chargé à l'aide de `python-dotenv` ou `pydantic-settings`. Un fichier `.env.example` anonymisé doit être présent à la racine.

### ST-02 : Modélisation des Données (Pydantic V2)

Le traitement de l'information s'appuie sur des structures de données strictement typées pour la validation des requêtes et le parsing des réponses :

``` python
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class AnalysisReport(BaseModel):
    source: str = Field(description="Source ou URL analysée")
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)
    model_used: str = Field(description="Identifiant exact du modèle ayant effectué l'inférence")

    title: str = Field(description="Titre synthétique de l'actualité IA")
    summary: str = Field(description="Résumé condensé (max 200 mots)")
    key_points: List[str] = Field(description="3 à 5 points clés essentiels extraits")

    impact_technical: str = Field(description="Impact sur les architectures logicielles et les outils")
    impact_business: str = Field(description="Opportunités ou menaces commerciales")
    impact_regulatory: Optional[str] = Field(None, description="Implications vis-à-vis du RGPD ou de l'AI Act si pertinent")

    recommendation: str = Field(description="Action concrète recommandée pour l'équipe technique")
    priority: str = Field(description="Niveau de priorité : high, medium, low")

    # Métriques FinOps injectées au runtime
    prompt_tokens: int = Field(default=0)
    completion_tokens: int = Field(default=0)
    total_tokens: int = Field(default=0)
    estimated_cost_usd: float = Field(default=0.0)
    execution_time_seconds: float = Field(default=0.0)

```

### ST-03 : Architecture Modulaire des Dossiers

L'arborescence du projet s'inscrit dans la continuité directe du Projet 0 en isolant de manière granulaire les responsabilités logicielles :

``` text
cli-ai-watcher/
├── .env.example              # Gabarit des variables d'environnement (clé API)
├── pyproject.toml            # Fichier de configuration Poetry et outils de dev
├── README.md                 # Documentation d'installation et de prise en main
├── src/
│   └── ai_watcher/
│       ├── __init__.py
│       ├── main.py           # Point d'entrée de la CLI (Framework Typer ou Click)
│       ├── config.py         # Chargement des Settings et validation via Pydantic
│       ├── exceptions.py     # Définition des exceptions douces de l'application
│       ├── core/
│       │   ├── __init__.py
│       │   ├── extractor.py  # Logique d'extraction (Scraping HTML / Lecture fichiers)
│       │   ├── chunker.py    # Découpage sémantique intelligent si texte volumineux
│       │   └── analyzer.py   # Orchestration du pipeline et de l'analyse
│       ├── clients/
│       │   ├── __init__.py
│       │   └── llm_client.py # Client d'appel API encapsulé avec Tenacity (Retry)
│       ├── utils/
│       │   ├── __init__.py
│       │   ├── cache.py      # Mécanisme de persistance et TTL du cache local
│       │   └── cost.py       # Grille tarifaire et calculatrice de coût FinOps
│       └── formatters/
│           ├── __init__.py
│           ├── console.py    # Génération des layouts et tableaux Rich
│           └── markdown.py   # Logique d'écriture et export de fichiers .md
└── tests/
    ├── __init__.py
    ├── unit/                 # Tests unitaires mockés (extractor, chunker, prompt)
    └── integration/          # Tests de bout en bout (appels réels ou mockés du client)

```

### ST-04 : Paramétrage du Modèle & Résilience Réseau

  * **Déterminisme Accru :** Pour garantir la fidélité factuelle et l'exactitude des synthèses techniques, la température du modèle doit être configurée de manière basse, entre `0.0` et `0.3`, associée à un `Top_p` de `0.9`.
  * **Politique de Robustesse (Retry Policy) :** Les appels réseau vers les serveurs tiers étant soumis à des micro-coupures ou des surcharges, le module `llm_client.py` doit intercepter obligatoirement les erreurs transitoires (Rate Limits HTTP 429, Erreurs Serveur HTTP 5xx, Timeouts) via la bibliothèque **Tenacity**.
      * Stratégie retenue : **Backoff exponentiel enrichi de Jitter**.
      * Paramètres : Maximum **4 tentatives**, attente progressive interpolée (ex: 2s, 4s, 8s).
      * **Logging :** Émission systématique d'un log d'avertissement jaune (`logger.warning`) indiquant le numéro de la tentative en cours avant de suspendre temporairement le thread.

-----

## 📦 4. Stack Technique Mandatée

| Composant           | Technologie Choisie | Rôle Architectural                                                        |
| :------------------ | :------------------ | :------------------------------------------------------------------------ |
| **Langage**         | Python 3.11+        | Runtime d'exécution principal et typage statique.                         |
| **Gestionnaire**    | Poetry              | Résolution, isolation et verrouillage des dépendances.                    |
| **Interface CLI**   | Typer (ou Click)    | Framework de routage des arguments et options de la console.              |
| **Client HTTP**     | HTTPX / OpenAI SDK  | Client asynchrone / synchrone pour les requêtes distantes.                |
| **Résilience**      | Tenacity            | Décorateur d'automatisation des retries et du backoff exponentiel.        |
| **Validation**      | Pydantic V2         | Modélisation stricte et typage des structures de données d'entrée/sortie. |
| **Interface UX**    | Rich                | Moteur de rendu de texte Markdown, spinners de chargement et tableaux.    |
| **Qualité & Style** | Ruff + Mypy         | Outils d'analyse statique et de conformité aux standards de code.         |
| **Tests**           | Pytest + Pytest-cov | Suite d'exécution des tests automatisés et mesure de couverture.          |

-----

## ✅ 5. Critères d'Acceptation (Definition of Done - DoD)

Pour déclarer le **Projet 1** finalisé et prêt à l'emploi, l'ensemble des cases suivantes doit être validé :

### Qualité d'Ingénierie & Robustesse

- [ ] **Zéro Déviation de Style :** L'exécution des outils de contrôle qualité statique (`ruff check .` et `mypy src/ --strict`) s'effectue sans soulever la moindre alerte ou erreur.
- [ ] **Couverture de Code :** Les tests automatisés (`pytest --cov=src`) couvrent au minimum **80%** des lignes de code logiques, incluant des scénarios mockés pour le comportement des retries et du cache.
- [ ] **Sécurité des Secrets :** Aucune clé d'authentification ou jeton d'API n'est écrit en dur dans les fichiers sources. Le script `detect-secrets` ou la configuration pre-commit intercepte tout oubli éventuel.
- [ ] **Résilience Vérifiée :** Lors d'une coupure réseau simulée, l'application ne crash pas ; elle affiche ses logs de retry successifs dans la console avant d'échouer proprement si la panne persiste.

### Validation Fonctionnelle

- [ ] **Routage des Commandes :** La commande de base `poetry run python src/ai_watcher/main.py scan "<source>"` s'exécute correctement sur les trois types de sources demandés (URL, Fichier, Chaîne).
- [ ] **Exactitude FinOps :** Les coûts calculés et présentés en fin de traitement reflètent la réalité de la tarification du français (surcoût sémantique de 30% à 50% pris en compte lors des multiplications volumétriques).
- [ ] **Rendu Visuel :** Les synthèses générées sont correctement mises en forme à l'aide de Rich sous forme de panneaux stylisés et colorés, avec un affichage distinct pour les succès (vert), les alertes (jaune) et les échecs (rouge).

-----

Souhaitez-vous que nous passions à la génération du **squelette de code initial** du projet, incluant la configuration du fichier `pyproject.toml` et l'architecture complète des premiers modules Python ?
