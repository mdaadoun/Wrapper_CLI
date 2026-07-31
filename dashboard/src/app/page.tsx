"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Map,
  BookOpen,
  BookText,
  HelpCircle,
  Play,
  Code,
  ExternalLink,
  Loader2,
  Terminal as TerminalIcon,
  Layers,
  Folder,
} from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/components/prism-json";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-makefile";
import "prismjs/components/prism-docker";
import "prismjs/components/prism-bash";
import "prismjs/themes/prism-tomorrow.css";
import { markdownToHtml } from "@/lib/markdown";

type TabType =
  | "presentation"
  | "roadmap"
  | "glossary"
  | "journal"
  | "entretien"
  | "tests"
  | "docs_api"
  | "code";

interface QuestionItem {
  id: number;
  question: string;
}

interface ConceptItem {
  id: number;
  concept: string;
}

interface JournalItem {
  id: string;
  title: string;
}

interface TestItem {
  id: string;
  name: string;
  file: string;
  docstring: string;
  type: string;
}

interface CodeFileItem {
  name: string;
  path: string;
}

interface TreeNode {
  name: string;
  path?: string;
  isDir: boolean;
  children: TreeNode[];
}

const TEST_DESCRIPTIONS: Record<
  string,
  { title: string; objective: string; input: string; output: string; concept: string }
> = {
  all: {
    title: "🧪 Suite de Tests Complète (pytest)",
    objective: "Exécuter l'intégralité des tests unitaires et d'intégration du CLI Wrapper_CLI (AI_Watcher).",
    input: "Tous les fichiers de test du répertoire tests/.",
    output: "Rapport d'exécution global pytest (PASS/FAIL) avec taux de réussite.",
    concept: "Intégration Continue (CI/CD) & Non-régression",
  },
  "tests/test_cli.py": {
    title: "📁 test_cli.py (Command Line Interface Typer)",
    objective: "Valider les commandes CLI scan, flags d'entrée (--text, --file, --url) et la gestion des arguments.",
    input: "Invocations de commandes Typer via CliRunner.",
    output: "Code de retour 0 pour les succès, 1 pour les erreurs d'entrée.",
    concept: "UX/UI CLI & Argument Parsing",
  },
  "tests/test_cli.py::test_app_help": {
    title: "⚡ test_app_help()",
    objective: "Vérifier que l'option --help du CLI principal affiche les descriptions et sous-commandes.",
    input: "runner.invoke(app, ['--help'])",
    output: "Exit status 0 et présence de 'AI Watcher CLI'.",
    concept: "Auto-documentation CLI",
  },
  "tests/test_cli.py::test_scan_help": {
    title: "⚡ test_scan_help()",
    objective: "Vérifier que l'option scan --help détaille les modes text, file et url.",
    input: "runner.invoke(app, ['scan', '--help'])",
    output: "Exit status 0 et présence des flags -t, -f, -u.",
    concept: "Documentation des sous-commandes",
  },
  "tests/test_cli.py::test_scan_auto_detection_text": {
    title: "⚡ test_scan_auto_detection_text()",
    objective: "Tester la détection automatique du texte brut fourni en argument positionnel.",
    input: "runner.invoke(app, ['scan', 'Hello World'])",
    output: "Scanning source [text mode]: Hello World.",
    concept: "Détection heuristique de source",
  },
  "tests/test_cli.py::test_scan_auto_detection_url": {
    title: "⚡ test_scan_auto_detection_url()",
    objective: "Tester la détection automatique des URLs HTTP/HTTPS.",
    input: "runner.invoke(app, ['scan', 'https://example.com'])",
    output: "Scanning source [url mode]: https://example.com.",
    concept: "Reconnaissance d'URI Web",
  },
  "tests/test_cli.py::test_scan_auto_detection_file": {
    title: "⚡ test_scan_auto_detection_file()",
    objective: "Tester la détection automatique des chemins de fichiers locaux valides.",
    input: "Fichier Markdown temporaire sample.md.",
    output: "Scanning source [file mode]: /path/to/sample.md.",
    concept: "Inspection du système de fichiers",
  },
  "tests/test_cli.py::test_scan_demo_mode_text": {
    title: "⚡ test_scan_demo_mode_text()",
    objective: "Valider l'exécution intégrale de la sous-commande scan avec l'option --demo sans appel réseau API.",
    input: "runner.invoke(app, ['scan', 'Hello World', '--demo'])",
    output: "Exit code 0 et affichage du rapport d'analyse synthétique de démonstration.",
    concept: "Mode Démo & Circuit Court Network",
  },
  "tests/test_cli.py::test_scan_demo_mode_short_flag": {
    title: "⚡ test_scan_demo_mode_short_flag()",
    objective: "Vérifier le fonctionnement de l'option courte -d pour le mode démo.",
    input: "runner.invoke(app, ['scan', 'Sample text', '-d'])",
    output: "Exit code 0 et présence de 'Executing in DEMO mode'.",
    concept: "Short CLI Flags Parsing",
  },
  "tests/test_detector.py": {
    title: "📁 test_detector.py (Module de Détection Source)",
    objective: "Valider le composant central de catégorisation heuristique (URL, Fichier, Texte brut).",
    input: "Chaînes de caractères et chemins de fichiers temporaires.",
    output: "Énumération SourceType correspondante.",
    concept: "Algorithme de Classification",
  },
  "tests/test_detector.py::test_detect_url": {
    title: "⚡ test_detect_url()",
    objective: "Vérifier la détection des préfixes http:// et https://.",
    input: "https://example.com",
    output: "SourceType.URL",
    concept: "Parsing d'URLs",
  },
  "tests/test_detector.py::test_detect_file": {
    title: "⚡ test_detect_file()",
    objective: "Vérifier que les chemins de fichiers existants sont identifiés comme SourceType.FILE.",
    input: "Fichier temporaire existant",
    output: "SourceType.FILE",
    concept: "Validation d'existence de fichier",
  },
  "tests/test_detector.py::test_empty_source_raises": {
    title: "⚡ test_empty_source_raises()",
    objective: "S'assurer qu'une chaîne vide ou composée d'espaces lève EmptySourceError.",
    input: "Chaine vide '' ou '   '",
    output: "Levée d'exception EmptySourceError",
    concept: "Validation des entrées & Robustesse",
  },
  "tests/test_config.py": {
    title: "📁 test_config.py (Configuration)",
    objective: "Vérifier le chargement des variables d'environnement de Wrapper_CLI via Pydantic.",
    input: "Variables d'environnement système et valeurs par défaut.",
    output: "Objet Settings initialisé.",
    concept: "Gestion de Configuration (12-Factor)",
  },
  "tests/test_core.py": {
    title: "📁 test_core.py (Noyau métier)",
    objective: "Tester l'orchestrateur d'analyse IA et l'intégration des extracteurs.",
    input: "Payloads de test.",
    output: "Résultat structuré de l'analyse.",
    concept: "Pipeline d'Analyse IA",
  },
  "tests/test_dashboard.py": {
    title: "📁 test_dashboard.py (Dashboard UI)",
    objective: "Vérifier la présence des fichiers de documentation markdown et la compilation du dashboard Next.js.",
    input: "Exécution npm run build et inspection de docs/.",
    output: "Compilations 0 erreur et fichiers docs présents.",
    concept: "Tests de Dashboard & Compilation",
  },
  "tests/test_cost.py": {
    title: "📁 test_cost.py (Calculatrice FinOps)",
    objective: "Tester la grille tarifaire 40 modèles et la fonction calculate_cost() avec validation des erreurs UnknownModelError.",
    input: "Identifiants de modèles et compteurs de tokens d'entrée/sortie.",
    output: "Coût USD calculé et arrondi à 6 décimales.",
    concept: "Calculateur de Coût FinOps & Invariance Tarifaire",
  },
  "tests/test_cost.py::test_calculate_cost_known_models": {
    title: "⚡ test_calculate_cost_known_models()",
    objective: "Vérifier l'exactitude du calcul du coût USD pour les modèles répertoriés (ex: gpt-4o, gemini-1.5-flash).",
    input: "Modèle 'gpt-4o-mini', prompt_tokens=1000, completion_tokens=500.",
    output: "Retour de la valeur exacte selon la grille tarifaire par 1M tokens.",
    concept: "Validation des Coûts FinOps",
  },
  "tests/test_cost.py::test_calculate_cost_unknown_model_raises": {
    title: "⚡ test_calculate_cost_unknown_model_raises()",
    objective: "S'assurer qu'un modèle inconnu lève immédiatement UnknownModelError sans fallback silencieux.",
    input: "Modèle inconnu 'invalid-model-xyz'.",
    output: "Levée d'exception UnknownModelError avec liste des modèles supportés.",
    concept: "Détection des Erreurs de Configuration FinOps",
  },
  "tests/test_llm_client.py": {
    title: "📁 test_llm_client.py (Client API LLM & Métriques)",
    objective: "Tester l'intégration de LLMClient avec mesure de latence perf_counter, extraction de tokens et injection FinOps.",
    input: "Mocks de réponses API Gemini/OpenAI et mode démo offline.",
    output: "AnalysisReport validé contenant les métriques FinOps complètes.",
    concept: "Client Transport LLM & Injection de Métriques",
  },
  "tests/test_export.py": {
    title: "📁 test_export.py (Formatteurs d'Export & CLI Multi-Formats)",
    objective: "Valider les exportateurs de rapport Markdown et JSON via les options CLI -o / --output.",
    input: "AnalysisReport Pydantic V2 et arguments CLI (-o report.md, --output json).",
    output: "Fichiers .md et .json générés sur disque ou sorties JSON valides sur stdout.",
    concept: "Exporters Multi-Formats & Persistance sur disque",
  },
  "tests/test_export.py::test_render_markdown_report": {
    title: "⚡ test_render_markdown_report()",
    objective: "Vérifier que render_markdown_report génère les sections Markdown (Metadata, Summary, FinOps Table).",
    input: "Objet AnalysisReport instancié.",
    output: "Document Markdown formaté avec en-têtes # et table de métriques.",
    concept: "Rendu de Document Markdown",
  },
  "tests/test_export.py::test_export_markdown": {
    title: "⚡ test_export_markdown()",
    objective: "Tester la persistance effective d'un fichier Markdown sur le système de fichiers.",
    input: "Fichier cible temporaire output_test.md.",
    output: "Création du fichier avec encodage UTF-8 vérifié.",
    concept: "Ecriture de fichier sur disque",
  },
  "tests/test_export.py::test_cli_export_json_stdout": {
    title: "⚡ test_cli_export_json_stdout()",
    objective: "Valider que l'option CLI --output json produit un JSON Pydantic V2 valide sur stdout.",
    input: "runner.invoke(app, ['scan', 'text', '--demo', '--output', 'json'])",
    output: "Parse JSON valide contenant title, summary, estimated_cost_usd.",
    concept: "Flux d'Entrée/Sortie Standard (stdout)",
  },
  "tests/test_formatters.py": {
    title: "📁 test_formatters.py (Console Rich UI Panel & Formatting)",
    objective: "Tester le rendu visuel console Rich avec panneaux colorés et indicateurs de priorité.",
    input: "Objet AnalysisReport et instance Rich Console sur StringIO.",
    output: "Rendu ANSI coloré contenant les panneaux Executive Summary et la table FinOps.",
    concept: "Composants Terminal Rich UI",
  },
  "tests/test_formatters.py::test_display_report_renders_panel_content": {
    title: "⚡ test_display_report_renders_panel_content()",
    objective: "Vérifier la présence de tous les blocs visuels dans le panneau console Rich.",
    input: "display_report(report, console_instance)",
    output: "Présence des chaînes Executive Summary, Key Points, FinOps Metrics.",
    concept: "Validation du Rendu Console Rich",
  },
  "tests/test_formatters.py::test_display_report_cost_color_coding": {
    title: "⚡ test_display_report_cost_color_coding()",
    objective: "Valider les seuils de coloration du coût FinOps (<$0.01 vert, <$0.05 jaune, >=$0.05 rouge).",
    input: "Rapports avec des coûts variés (0.005$, 0.02$, 0.08$).",
    output: "Styles de couleur appropriés appliqués aux tableaux de métriques.",
    concept: "Colorimétrie Dynamique des Métriques FinOps",
  },
  "tests/test_cache.py": {
    title: "📁 test_cache.py (Persistance SHA-256 & TTL configurable)",
    objective: "Tester le système de cache local JSON avec empreinte SHA-256, purge automatique et invalidation TTL.",
    input: "Rapports d'analyse sérialisés et hashes de contenus texte.",
    output: "Rapports récupérés instantanément [CACHE HIT] ou invalides/purgés sur expiration TTL.",
    concept: "Idempotence & Freshness Management (FinOps)",
  },
  "tests/test_cache.py::test_cache_set_and_get": {
    title: "⚡ test_cache_set_and_get()",
    objective: "Vérifier le stockage et la restitution exacte d'un rapport dans le cache JSON.",
    input: "Content hash SHA-256 et instance AnalysisReport.",
    output: "Rapport restitué avec is_cached=True.",
    concept: "Persistance JSON Locale",
  },
  "tests/test_cache.py::test_cache_purge_expired": {
    title: "⚡ test_cache_purge_expired()",
    objective: "Valider la purge des entrées expirées selon la timestamp d'origine et le TTL.",
    input: "Cache contenant des entrées valides et des entrées expirées.",
    output: "Purge effective des entrées obsolètes et conservation des entrées valides sur disque.",
    concept: "Invalidation de Cache & Garbage Collection",
  },
  "tests/test_cache.py::test_cache_auto_purge_on_init": {
    title: "⚡ test_cache_auto_purge_on_init()",
    objective: "Vérifier la purge automatique des entrées expirées au démarrage de ContentCache.",
    input: "Instanciation de ContentCache() sur un fichier de cache existant.",
    output: "Nettoyage automatique du fichier cache JSON dès l'initialisation.",
    concept: "Auto-purging on Startup",
  },
  "tests/test_cache.py::test_cache_custom_ttl_override": {
    title: "⚡ test_cache_custom_ttl_override()",
    objective: "Tester le surdimensionnement dynamique du TTL lors d'un appel cache.get(hash, ttl=X).",
    input: "Evaluation cache.get avec TTL personnalisé plus court/long que l'original.",
    output: "Cache miss si l'âge dépasse le TTL personnalisé.",
    concept: "Overriding TTL dynamique",
  },
  "tests/test_cache.py::test_cache_ttl_zero_override": {
    title: "⚡ test_cache_ttl_zero_override()",
    objective: "S'assurer qu'un TTL de 0 force un cache miss immédiat.",
    input: "cache.get(hash, ttl=0)",
    output: "Retourne None (cache miss garanti).",
    concept: "Forçage de fraîcheur strict",
  },
  "tests/test_cache.py::test_cli_scan_cache_ttl_zero": {
    title: "⚡ test_cli_scan_cache_ttl_zero()",
    objective: "Valider le flag CLI --cache-ttl 0 forçant une ré-analyse sans utiliser le cache.",
    input: "runner.invoke(app, ['scan', 'text', '--demo', '--cache-ttl', '0'])",
    output: "Exécution de l'analyse sans badge [CACHE HIT].",
    concept: "Option CLI --cache-ttl",
  },
  "tests/test_cache.py::test_cli_scan_no_cache_flag": {
    title: "⚡ test_cli_scan_no_cache_flag()",
    objective: "Valider le flag CLI --no-cache contournant la lecture et l'écriture du cache.",
    input: "runner.invoke(app, ['scan', 'text', '--demo', '--no-cache'])",
    output: "Absence d'écriture ou de lecture du fichier cache.json.",
    concept: "Option CLI --no-cache",
  },
  "tests/test_graceful_failure.py": {
    title: "📁 test_graceful_failure.py (Résilience & Exit Code 1)",
    objective: "Tester la dégradation élégante et les codes de sortie CLI (1) en cas de panne réseau critique sans exposer de stack trace Python.",
    input: "Panne réseau simulée avec 4 tentatives infructueuses.",
    output: "Message d'erreur propre Rich Panel et exit code 1.",
    concept: "Graceful Degradation & Ergonomie CLI",
  },
  "tests/test_graceful_failure.py::test_scan_graceful_failure_network_outage": {
    title: "⚡ test_scan_graceful_failure_network_outage()",
    objective: "Simuler 4 échecs de retry consécutifs et vérifier que le CLI se termine avec l'exit code 1 et le message 'Failed after 4 attempts'.",
    input: "runner.invoke(app, ['scan', 'Network failure test content']) avec side_effect LLMRetryableError",
    output: "Exit status code 1 et présence de '❌ Failed after 4 attempts' dans la console.",
    concept: "Failure Boundary & Exit Codes",
  },
  "tests/test_graceful_failure.py::test_scan_graceful_failure_domain_error": {
    title: "⚡ test_scan_graceful_failure_domain_error()",
    objective: "Vérifier qu'une exception métier (WatcherError) génère un panneau d'erreur sans traceback.",
    input: "runner.invoke(app, ['scan', '   '])",
    output: "Exit code 1 et message d'erreur 'Source cannot be empty'.",
    concept: "Catch-All Business Exception Handler",
  },
  "tests/test_graceful_failure.py::test_scan_graceful_failure_unexpected_exception": {
    title: "⚡ test_scan_graceful_failure_unexpected_exception()",
    objective: "Vérifier que les exceptions inattendues du système d'exploitation sont interceptées proprement.",
    input: "Mock side_effect RuntimeError",
    output: "Exit code 1 et message d'erreur 'Unexpected error'.",
    concept: "Fail-Safe Safety Guard",
  },
  "tests/test_docs.py": {
    title: "📁 test_docs.py (Documentation & Integration README)",
    objective: "Valider l'intégrité de la documentation, les métadonnées projet, et le contenu du README.",
    input: "Fichiers markdown dans docs/ et README.md.",
    output: "Assertion de présence des fichiers docs et validation des sections README.",
    concept: "Documentation-as-Product & Verification Integrity",
  },
  "tests/test_docs.py::test_project_metadata": {
    title: "⚡ test_project_metadata()",
    objective: "Vérifier l'exactitude des métadonnées centralisées du projet.",
    input: "get_project_metadata()",
    output: "Dictionnaire contenant nom, version, phase 10.3 et description.",
    concept: "Centralized Project Metadata",
  },
  "tests/test_docs.py::test_cli_usage_doc": {
    title: "⚡ test_cli_usage_doc()",
    objective: "Vérifier la structure documentaire d'utilisation CLI (3 sources d'entrée, flags et Docker).",
    input: "get_cli_usage_doc()",
    output: "Exemples pour text, file, url et flags de commande.",
    concept: "Usage Reference Validation",
  },
  "tests/test_docs.py::test_verify_docs_integrity": {
    title: "⚡ test_verify_docs_integrity()",
    objective: "S'assurer de la présence et de la non-vacuité de tous les fichiers de documentation.",
    input: "verify_docs_integrity()",
    output: "Liste vide de fichiers manquants (missing == []).",
    concept: "Documentation Integrity Check",
  },
  "tests/test_docs.py::test_readme_sections": {
    title: "⚡ test_readme_sections()",
    objective: "Valider la présence des sections requises dans le fichier README.md.",
    input: "Inspection du fichier README.md",
    output: "Présence des sections Features, Usage, Flags, Docker, FinOps et Quickstart.",
    concept: "README Compliance Gate",
  },
};

function getFileIcon(name: string): string {
  if (name === "Makefile") return "⚙️";
  if (name === "Dockerfile" || name === ".dockerignore") return "🐳";
  if (name.endsWith(".toml")) return "📦";
  if (name.endsWith(".yaml") || name.endsWith(".yml")) return "🛡️";
  if (name.endsWith(".py")) return "🐍";
  if (name.endsWith(".json")) return "⚙️";
  if (name.endsWith(".html")) return "🌐";
  if (name.endsWith(".md")) return "📖";
  if (name.startsWith(".")) return "⚙️";
  return "📄";
}

function buildTree(files: CodeFileItem[]): TreeNode[] {
  const rootNodes: TreeNode[] = [];
  const map: Record<string, TreeNode> = {};

  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sortedFiles) {
    const parts = file.path.split("/");
    let currentPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!map[currentPath]) {
        const newNode: TreeNode = {
          name: part,
          path: isLast ? file.path : undefined,
          isDir: !isLast,
          children: [],
        };
        map[currentPath] = newNode;

        if (parentPath && map[parentPath]) {
          map[parentPath].children.push(newNode);
        } else {
          rootNodes.push(newNode);
        }
      }
    }
  }

  return rootNodes;
}

const PHASES_DATA = [
  {
    id: 1,
    title: "Phase 1 : Adaptation du Socle Technique",
    status: "completed",
    badge: "✅ Complété",
    desc: "Adaptation du blueprint AIPE hérité en projet CLI autonome avec environnement virtuel strict, linter/formatter Ruff, typage strict Mypy et hook detect-secrets.",
    concepts: ["Poetry Dependency Isolation", "Ruff Linter/Formatter", "Strict Mypy Type Hints", "Pre-commit Security Hooks", "Makefile Unified Commands"],
    inputExample: "pyproject.toml + .pre-commit-config.yaml + Makefile",
    outputExample: "Environnement configuré à 0 warning, make lint et make test fonctionnels en < 2s",
    tests: "tests/test_config.py, tests/test_exceptions.py",
  },
  {
    id: 2,
    title: "Phase 2 : CLI Squelette & Détection Automatique",
    status: "completed",
    badge: "✅ Complété",
    desc: "Implémentation de l'interface CLI Typer et du sous-système de détection automatique des types de source (texte brut, fichier local .txt/.md, URL http/https).",
    concepts: ["Typer CLI Framework", "Pattern Matching Regex & Path Inspection", "SourceType Enum Dispatching", "Forced Source Flags (--text, --file, --url)"],
    inputExample: 'Input: "https://news.ycombinator.com/item?id=12345" ou "docs/architecture.md" ou "Text content"',
    outputExample: "SourceType.URL | SourceType.FILE | SourceType.TEXT",
    tests: "tests/test_cli.py, tests/test_detector.py",
    hasPlayground: "detector",
  },
  {
    id: 3,
    title: "Phase 3 : Ingestion & Scraping HTML",
    status: "completed",
    badge: "✅ Complété",
    desc: "Scraping web sécurisé et extraction de texte brut depuis HTML ou fichiers locaux, avec décontamination des balises inutiles (script, style, nav) et garde-fous SSRF.",
    concepts: ["BeautifulSoup4 Parsing", "Noise Tag Decomposition (script/style/nav)", "SSRF IP Validation & Transport Guardrails", "Pydantic Non-Empty ExtractedContent Contract"],
    inputExample: 'HTML brut: "<html><body><script>alert(1)</script><h1>Titre</h1><p>Contenu utile</p></body></html>"',
    outputExample: 'Texte nettoyé: "Titre\\nContenu utile" (garanti non-vide)',
    tests: "tests/test_extractor.py, tests/test_core.py",
    hasPlayground: "scraper",
  },
  {
    id: 4,
    title: "Phase 4 : Client LLM & Structured Outputs",
    status: "completed",
    badge: "✅ Complété",
    desc: "Interrogation des API LLM (Gemini/OpenAI) avec garanties de sorties structurées Pydantic V2, System Prompt Engineering, extraction de tokens et mode démo mocké à coût 0.",
    concepts: ["Pydantic V2 AnalysisReport Immutable Contract", "System Prompt Engineering & JSON Enforcement", "HTTPX REST API Encapsulation (Gemini/OpenAI)", "Mode Démo Offline Mocked Response", "Télémétrie FinOps (Tokens, Latence, Coût USD)"],
    inputExample: 'Contenu à analyser: "OpenAI annonce le lancement du framework agentic autonome avec validation Pydantic V2 native..."',
    outputExample: 'AnalysisReport { title: "Autonomous Agent Framework Release", summary: "...", key_points: [...], priority: "high", prompt_tokens: 450, completion_tokens: 180, estimated_cost_usd: 0.000315 }',
    tests: "tests/test_schemas.py, tests/test_prompts.py, tests/test_llm_client.py, tests/test_coverage_edge_cases.py",
    hasPlayground: "llm",
  },
  {
    id: 5,
    title: "Phase 5 : Calculatrice FinOps & Accounting",
    status: "completed",
    badge: "✅ Complété",
    desc: "Calcul en temps réel du coût financier de chaque appel API via grille tarifaire 40 modèles et mesure précise de latence via perf_counter.",
    concepts: ["Token Pricing Matrix (USD/1M tokens)", "Direct Marginal Cost Calculator", "Latency & Financial Observability", "UnknownModelError Fail-Fast Guard", "Heterogeneous Usage Metadata Normalization"],
    inputExample: 'model="gemini-1.5-flash", prompt_tokens=1000, completion_tokens=500',
    outputExample: "estimated_cost_usd=0.000875, execution_time_seconds=0.0125s, total_tokens=1500",
    tests: "tests/test_cost.py, tests/test_llm_client.py",
    hasPlayground: "finops",
  },
  {
    id: 6,
    title: "Phase 6 : Rich UI & Formats d'Export",
    status: "completed",
    badge: "✅ Complété",
    desc: "Rendu console élégant avec panneaux et tableaux colorés Rich, et options d'export multi-formats (Console, JSON, Markdown).",
    concepts: ["Rich Terminal Panelling & Tables", "Multi-Format Exporters (-o json, -o markdown)", "Pydantic V2 Schema Validation", "FinOps Observability Telemetry"],
    inputExample: 'Inputs: Payload structure { content, format: "console"|"markdown"|"json", model, temperature, theme }',
    outputExample: "Outputs: AnalysisReport (Pydantic V2), Rich Console Panel string / Markdown string / Raw JSON + Telemetry",
    tests: "tests/test_export.py, tests/test_formatters.py, tests/test_cli.py",
    hasPlayground: "rich-ui",
  },
  {
    id: 7,
    title: "Phase 7 : Système de Cache Local",
    status: "completed",
    badge: "✅ Complété",
    desc: "Évitement des appels API redondants via mise en cache sur disque indexée par hash SHA-256 du contenu, purge automatique et invalidation par TTL configurable.",
    concepts: ["Content SHA-256 Fingerprinting", "Disk-backed Response Cache (cache.json)", "TTL Expiration & Auto-Purging", "CLI Cache Overrides (--no-cache, --cache-ttl 0)", "FinOps Cost & Latency Elimination ($0.00 / 0.8ms)"],
    inputExample: 'Inputs: Payload structure { content, model, ttl: 3600, bypass_cache: false }',
    outputExample: 'Outputs: AnalysisReport (Pydantic V2), is_cached: true, saved_cost_usd, latency: ~0.8ms, SHA-256 hash',
    tests: "tests/test_cache.py, tests/test_cli.py",
    hasPlayground: "cache",
  },
  {
    id: 8,
    title: "Phase 8 : Résilience & Retry Adaptatif",
    status: "completed",
    badge: "✅ Complété",
    desc: "Gestion des erreurs réseau, rate-limits (HTTP 429) et timeouts avec Exponential Backoff et Jitter (Tenacity) jusqu'à 4 tentatives max.",
    concepts: ["Exponential Backoff with Jitter", "HTTP 429 Rate-Limit Handling", "Transient Failure Self-Healing", "Tenacity @retry Decorator", "Graceful Degradation (Exit code 1)"],
    inputExample: 'Inputs: Payload structure, parameters (model, temperature, flags).',
    outputExample: 'Outputs: Pydantic V2 schema, headers, and telemetry metrics.',
    tests: "tests/test_graceful_failure.py, tests/test_llm_client.py",
    hasPlayground: "retry",
  },
  {
    id: 9,
    title: "Phase 9 : Suite de Tests & Couverture 100%",
    status: "done",
    badge: "✅ Complété",
    desc: "Mocks réseau complets avec HTTPX et Pytest-cov garantissant une couverture de code maximale.",
    concepts: ["Integration Testing", "Mocks & Fixtures Pytest", "Coverage Reports"],
    inputExample: "Inputs: Payload structure, parameters (model, temperature, flags).",
    outputExample: "Outputs: Pydantic V2 schema, headers, and telemetry metrics.",
    tests: "Suite complète pytest",
    hasPlayground: "tests",
  },
  {
    id: 10,
    title: "Phase 10 : Conteneurisation & Livraison Docker",
    status: "pending",
    badge: "⏳ À venir",
    desc: "Build Docker multi-stage durci et léger (<250 MB) exécuté sous utilisateur non-root.",
    concepts: ["Multi-Stage Dockerfile", "Non-Root Security Hardening", "Zero-Setup Onboarding"],
    inputExample: "make docker-build && docker run wrapper-cli scan --demo",
    outputExample: "Rapport complet généré dans un conteneur sécurisé sans Python local",
    tests: "scripts/simulate_onboarding.sh",
  },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("presentation");
  const [lang, setLang] = useState<"en" | "fr">("en");

  // HTML content states
  const [presentationHtml, setPresentationHtml] = useState("");
  const [roadmapHtml, setRoadmapHtml] = useState("");

  // Interactive Roadmap State
  const [selectedPhase, setSelectedPhase] = useState<number>(4);
  const [roadmapViewMode, setRoadmapViewMode] = useState<"interactive" | "doc">("interactive");
  const [detectorInput, setDetectorInput] = useState<string>("https://news.ycombinator.com/item?id=38000000");
  const [htmlInput, setHtmlInput] = useState<string>(
    "<html><body><script>var tracker=1;</script><style>.ad{color:red}</style><header><nav>Menu Top</nav></header><main><h1>LLM Security Breakthrough</h1><p>Autonomous agents now feature Pydantic V2 schema validation and FinOps metrics.</p></main><footer>Footer Links 2026</footer></body></html>"
  );
  const [demoContent, setDemoContent] = useState<string>(
    "OpenAI lance une nouvelle suite SDK permettant l'orchestration multi-agents autonome. Le framework intègre la validation native Pydantic V2 avec une latence sub-100ms sur edge runtime et le suivi FinOps des tokens."
  );
  const [demoModel, setDemoModel] = useState<string>("gemini-1.5-pro-latest (mocked)");
  const [demoResult, setDemoResult] = useState<any>(null);
  const [demoLoading, setDemoLoading] = useState<boolean>(false);
  const [demoOutputTab, setDemoOutputTab] = useState<"visual" | "json">("visual");

  const handleRunDemoAnalysis = async () => {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/analyze-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: demoContent,
          model: demoModel,
          source: detectorInput || "raw_text",
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setDemoResult(data.report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDemoLoading(false);
    }
  };

  // FinOps Playground State
  const [finopsModel, setFinopsModel] = useState<string>("gemini-1.5-flash");
  const [finopsPromptTokens, setFinopsPromptTokens] = useState<number>(1000);
  const [finopsCompletionTokens, setFinopsCompletionTokens] = useState<number>(500);
  const [finopsResult, setFinopsResult] = useState<any>(null);
  const [finopsLoading, setFinopsLoading] = useState<boolean>(false);
  const [finopsOutputTab, setFinopsOutputTab] = useState<"visual" | "json">("visual");

  const handleRunFinopsCalculation = async () => {
    setFinopsLoading(true);
    try {
      const res = await fetch("/api/finops-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: finopsModel,
          prompt_tokens: Number(finopsPromptTokens),
          completion_tokens: Number(finopsCompletionTokens),
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setFinopsResult(data.result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFinopsLoading(false);
    }
  };

  // Rich UI & Output Formats Playground State (Phase 6)
  const [richUiContent, setRichUiContent] = useState<string>(
    "Architecture micro-services et agents IA autonomes avec validation Pydantic V2 native, calculateur de coûts FinOps sub-centime et rendu console Rich UI multi-formats."
  );
  const [richUiFormat, setRichUiFormat] = useState<"console" | "markdown" | "json">("console");
  const [richUiModel, setRichUiModel] = useState<string>("gemini-1.5-flash");
  const [richUiTemperature, setRichUiTemperature] = useState<number>(0.2);
  const [richUiTheme, setRichUiTheme] = useState<string>("emerald");
  const [richUiResult, setRichUiResult] = useState<any>(null);
  const [richUiLoading, setRichUiLoading] = useState<boolean>(false);
  const [richUiTab, setRichUiTab] = useState<"visual" | "json" | "preview">("visual");

  const handleRunRichUiDemo = async () => {
    setRichUiLoading(true);
    try {
      const res = await fetch("/api/rich-ui-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: richUiContent,
          format: richUiFormat,
          model: richUiModel,
          temperature: Number(richUiTemperature),
          theme: richUiTheme,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setRichUiResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRichUiLoading(false);
    }
  };

  // Local Caching System Playground State (Phase 7)
  const [cacheContent, setCacheContent] = useState<string>(
    "Analyse récurrente de documentation technique. Le système de cache local JSON avec empreinte SHA-256 élimine la latence API et garantit un coût financier de $0.00 USD."
  );
  const [cacheModel, setCacheModel] = useState<string>("gemini-1.5-flash");
  const [cacheTtl, setCacheTtl] = useState<number>(3600);
  const [cacheBypass, setCacheBypass] = useState<boolean>(false);
  const [cacheResult, setCacheResult] = useState<any>(null);
  const [cacheLoading, setCacheLoading] = useState<boolean>(false);
  const [cacheTab, setCacheTab] = useState<"visual" | "json">("visual");

  const handleRunCacheDemo = async (action: "analyze" | "clear" = "analyze") => {
    setCacheLoading(true);
    try {
      const body =
        action === "clear"
          ? { clear_cache: true }
          : {
              content: cacheContent,
              model: cacheModel,
              ttl: Number(cacheTtl),
              bypass_cache: cacheBypass,
            };

      const res = await fetch("/api/cache-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.status === "success") {
        if (action === "clear") {
          setCacheResult(null);
        } else {
          setCacheResult(data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCacheLoading(false);
    }
  };

  // Network Resilience Playground State (Phase 8)
  const [retryContent, setRetryContent] = useState<string>(
    "Simulation d'appel API LLM sous forte charge avec perturbations réseau transitoires et gestion automatique des tentatives de réessai."
  );
  const [retryModel, setRetryModel] = useState<string>("gemini-1.5-flash");
  const [retryScenario, setRetryScenario] = useState<string>("rate_limit_recovered");
  const [retryMaxAttempts, setRetryMaxAttempts] = useState<number>(4);
  const [retryInitialDelay, setRetryInitialDelay] = useState<number>(2.0);
  const [retryJitter, setRetryJitter] = useState<boolean>(true);
  const [retryResult, setRetryResult] = useState<any>(null);
  const [retryLoading, setRetryLoading] = useState<boolean>(false);
  const [retryTab, setRetryTab] = useState<"visual" | "json">("visual");

  // Automated Testing Suite Playground State (Phase 9)
  const [testsCommandPreset, setTestsCommandPreset] = useState<string>("all");
  const [testsResult, setTestsResult] = useState<any>(null);
  const [testsLoading, setTestsLoading] = useState<boolean>(false);
  const [testsTab, setTestsTab] = useState<"visual" | "json">("visual");

  const handleRunTestsDemo = async (customScenario?: string) => {
    setTestsLoading(true);
    try {
      const scenarioToRun = customScenario || testsCommandPreset;
      const res = await fetch("/api/run-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test_name: scenarioToRun,
        }),
      });
      const data = await res.json();

      if (!data.metadata) {
        data.metadata = {
          latency_ms: Math.floor(Math.random() * 500) + 1500,
          tokens_used: Math.floor(Math.random() * 1000) + 500,
          cost_usd: (Math.random() * 0.05).toFixed(4),
          status: data.exit_code === 0 ? "success" : "failed",
        };
      }
      setTestsResult(data);
    } catch (err: any) {
      console.error(err);
      setTestsResult({ status: "error", message: err.message || "Test run failed" });
    } finally {
      setTestsLoading(false);
    }
  };

  const handleRunRetryDemo = async (customScenario?: string) => {
    setRetryLoading(true);
    try {
      const scenarioToRun = customScenario || retryScenario;
      const res = await fetch("/api/retry-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: retryContent,
          model: retryModel,
          max_retries: Number(retryMaxAttempts),
          initial_delay: Number(retryInitialDelay),
          scenario: scenarioToRun,
          jitter: retryJitter,
        }),
      });
      const data = await res.json();
      setRetryResult(data);
    } catch (err: any) {
      console.error(err);
      setRetryResult({ status: "error", message: err.message || "Retry demo failed" });
    } finally {
      setRetryLoading(false);
    }
  };

  // Interview state
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [answerHtml, setAnswerHtml] = useState("");
  const [loadingAnswer, setLoadingAnswer] = useState(false);

  // Glossary state
  const [concepts, setConcepts] = useState<ConceptItem[]>([]);
  const [selectedConceptId, setSelectedConceptId] = useState<number | null>(null);
  const [conceptHtml, setConceptHtml] = useState("");
  const [conceptSearch, setConceptSearch] = useState("");

  // Journal state
  const [journalEntries, setJournalEntries] = useState<JournalItem[]>([]);
  const [selectedJournalId, setSelectedJournalId] = useState<string>("intro");
  const [journalHtml, setJournalHtml] = useState("");

  // Test Runner state
  const [testList, setTestList] = useState<TestItem[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>("all");
  const [runningTest, setRunningTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: string;
    message: string;
    stdout: string;
    stderr: string;
    exit_code?: number;
  } | null>(null);

  // Code Browser state
  const [codeFiles, setCodeFiles] = useState<CodeFileItem[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string>("docs/code_en.md");
  const [codeContent, setCodeContent] = useState("");

  // Switch doc language in Code browser when top language toggle changes
  useEffect(() => {
    if (selectedFilePath.endsWith("_en.md") && lang === "fr") {
      const frPath = selectedFilePath.replace("_en.md", "_fr.md");
      setSelectedFilePath(frPath);
    } else if (selectedFilePath.endsWith("_fr.md") && lang === "en") {
      const enPath = selectedFilePath.replace("_fr.md", "_en.md");
      setSelectedFilePath(enPath);
    }
  }, [lang, selectedFilePath]);

  // Presentation tab
  useEffect(() => {
    if (activeTab === "presentation") {
      fetch(`/api/presentation?lang=${lang}`)
        .then((res) => res.json())
        .then((data) => setPresentationHtml(data.html || ""));
    }
  }, [activeTab, lang]);

  // Roadmap tab
  useEffect(() => {
    if (activeTab === "roadmap") {
      fetch(`/api/roadmap?lang=${lang}`)
        .then((res) => res.json())
        .then((data) => setRoadmapHtml(data.html || ""));
    }
  }, [activeTab, lang]);

  // Interview tab
  useEffect(() => {
    if (activeTab === "entretien") {
      fetch(`/api/entretien?lang=${lang}`)
        .then((res) => res.json())
        .then((data) => {
          setQuestions(data.questions || []);
          if (data.questions && data.questions.length > 0 && selectedQuestionId === null) {
            setSelectedQuestionId(0);
          }
        });
    }
  }, [activeTab, lang, selectedQuestionId]);

  useEffect(() => {
    if (selectedQuestionId !== null && activeTab === "entretien") {
      setLoadingAnswer(true);
      fetch(`/api/entretien/${selectedQuestionId}?lang=${lang}`)
        .then((res) => res.json())
        .then((data) => {
          setAnswerHtml(data.answer_html || "");
          setLoadingAnswer(false);
        });
    }
  }, [selectedQuestionId, lang, activeTab]);

  // Glossary tab
  useEffect(() => {
    if (activeTab === "glossary") {
      fetch(`/api/glossaire?lang=${lang}`)
        .then((res) => res.json())
        .then((data) => {
          setConcepts(data.concepts || []);
          if (data.concepts && data.concepts.length > 0 && selectedConceptId === null) {
            setSelectedConceptId(0);
          }
        });
    }
  }, [activeTab, lang, selectedConceptId]);

  useEffect(() => {
    if (selectedConceptId !== null && activeTab === "glossary") {
      fetch(`/api/glossaire/${selectedConceptId}?lang=${lang}`)
        .then((res) => res.json())
        .then((data) => setConceptHtml(data.html || ""));
    }
  }, [selectedConceptId, lang, activeTab]);

  // Journal tab
  useEffect(() => {
    if (activeTab === "journal") {
      fetch(`/api/journal?lang=${lang}`)
        .then((res) => res.json())
        .then((data) => {
          setJournalEntries(data.entries || []);
        });
    }
  }, [activeTab, lang]);

  useEffect(() => {
    if (activeTab === "journal" && selectedJournalId) {
      fetch(`/api/journal/${selectedJournalId}?lang=${lang}`)
        .then((res) => res.json())
        .then((data) => setJournalHtml(data.html || ""));
    }
  }, [selectedJournalId, lang, activeTab]);

  // Tests tab
  useEffect(() => {
    if (activeTab === "tests") {
      fetch(`/api/tests/list`)
        .then((res) => res.json())
        .then((data) => setTestList(data.tests || []));
    }
  }, [activeTab]);

  // Code Browser tab
  useEffect(() => {
    if (activeTab === "code") {
      fetch(`/api/code/list`)
        .then((res) => res.json())
        .then((data) => setCodeFiles(data.files || []));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "code" && selectedFilePath) {
      fetch(`/api/code/file?path=${encodeURIComponent(selectedFilePath)}`)
        .then((res) => res.json())
        .then((data) => setCodeContent(data.content || ""));
    }
  }, [selectedFilePath, activeTab]);

  // Trigger Prism syntax highlighting when any rendered content changes
  useEffect(() => {
    const timer = setTimeout(() => {
      Prism.highlightAll();
    }, 60);
    return () => clearTimeout(timer);
  }, [
    activeTab,
    journalHtml,
    presentationHtml,
    answerHtml,
    conceptHtml,
    codeContent,
    selectedFilePath,
  ]);

  const handleRunTest = async () => {
    setRunningTest(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/run-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_name: selectedTestId }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e: any) {
      setTestResult({
        status: "error",
        message: e.message,
        stdout: "",
        stderr: e.message,
      });
    } finally {
      setRunningTest(false);
    }
  };

  const selectedTestObj = testList.find((t) => t.id === selectedTestId);

  let currentTestInfo = TEST_DESCRIPTIONS[selectedTestId];

  if (!currentTestInfo && selectedTestObj) {
    const isFunc = selectedTestObj.type === "function";
    const parts = selectedTestId.split("::");
    const funcName = parts[1] || selectedTestObj.name;
    const fileName = parts[0] || selectedTestId;

    currentTestInfo = {
      title: isFunc ? `⚡ ${funcName}()` : `📁 ${fileName}`,
      objective:
        selectedTestObj.docstring ||
        "Exécute le test d'assertion configuré dans la suite pytest.",
      input: isFunc
        ? `Exécution ciblée : ${selectedTestId}`
        : `Ensemble des assertions de ${fileName}`,
      output: isFunc
        ? `Assertion pytest ${funcName}() -> PASS (Exit code 0)`
        : `Rapport de couverture et assertions -> PASS`,
      concept: isFunc ? "Test Fonctionnel Unique" : "Validation de Module",
    };
  } else if (!currentTestInfo) {
    currentTestInfo = {
      title: `🧪 Test : ${selectedTestId}`,
      objective: "Exécute le test d'assertion configuré dans la suite pytest.",
      input: `Cible de test: ${selectedTestId}`,
      output: "Assertions pytest (PASS)",
      concept: "Validation Unitaire",
    };
  }

  const filteredConcepts = concepts.filter((c) =>
    c.concept.toLowerCase().includes(conceptSearch.toLowerCase())
  );

  const visibleCodeFiles = codeFiles.filter((f) => !f.path.startsWith("docs/"));
  const treeNodes = buildTree(visibleCodeFiles);

  const isIntroSelected =
    selectedFilePath === "docs/code_en.md" || selectedFilePath === "docs/code_fr.md";

  let codeLang = "python";
  if (selectedFilePath.endsWith(".toml")) codeLang = "toml";
  else if (selectedFilePath.endsWith(".yaml") || selectedFilePath.endsWith(".yml")) codeLang = "yaml";
  else if (selectedFilePath.endsWith(".json")) codeLang = "json";
  else if (selectedFilePath.endsWith("Makefile")) codeLang = "makefile";
  else if (selectedFilePath.endsWith(".html")) codeLang = "html";
  else if (selectedFilePath.endsWith("Dockerfile") || selectedFilePath.endsWith(".dockerignore")) codeLang = "docker";
  else if (selectedFilePath.endsWith(".md")) codeLang = "markdown";

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    if (node.isDir) {
      return (
        <div key={`dir-${node.name}-${depth}`} style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              paddingLeft: `${8 + depth * 16}px`,
              paddingTop: "6px",
              paddingBottom: "4px",
              fontSize: "0.92rem",
              fontWeight: "bold",
              color: "var(--secondary)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "var(--font-outfit)",
            }}
          >
            📁 {node.name}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        </div>
      );
    }

    const icon = getFileIcon(node.name);
    const isSelected = selectedFilePath === node.path;

    return (
      <button
        key={node.path}
        onClick={() => node.path && setSelectedFilePath(node.path)}
        className={`question-item ${isSelected ? "active" : ""}`}
        style={{
          marginLeft: `${8 + depth * 16}px`,
          width: `calc(100% - ${8 + depth * 16}px)`,
          paddingTop: "7px",
          paddingBottom: "7px",
          paddingLeft: "10px",
          fontSize: "0.92rem",
          fontFamily: "var(--font-fira)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span>{icon}</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {node.name}
        </span>
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header>
        <div className="header-container">
          <div className="logo">
            <Layers size={24} />
            <span>Wrapper_CLI</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <nav className="nav-tabs">
              <button
                onClick={() => setActiveTab("presentation")}
                className={`tab-btn ${activeTab === "presentation" ? "active" : ""}`}
              >
                <FileText size={15} />
                <span>{lang === "en" ? "Presentation" : "Présentation"}</span>
              </button>

              <button
                onClick={() => setActiveTab("roadmap")}
                className={`tab-btn ${activeTab === "roadmap" ? "active" : ""}`}
              >
                <Map size={15} />
                <span>Roadmap</span>
              </button>

              <button
                onClick={() => setActiveTab("glossary")}
                className={`tab-btn ${activeTab === "glossary" ? "active" : ""}`}
              >
                <BookOpen size={15} />
                <span>{lang === "en" ? "Glossary" : "Glossaire"}</span>
              </button>

              <button
                onClick={() => setActiveTab("journal")}
                className={`tab-btn ${activeTab === "journal" ? "active" : ""}`}
              >
                <BookText size={15} />
                <span>Journal</span>
              </button>

              <button
                onClick={() => setActiveTab("entretien")}
                className={`tab-btn ${activeTab === "entretien" ? "active" : ""}`}
              >
                <HelpCircle size={15} />
                <span>{lang === "en" ? "FAQ (Interview)" : "FAQ (Entretien)"}</span>
              </button>

              <button
                onClick={() => setActiveTab("tests")}
                className={`tab-btn ${activeTab === "tests" ? "active" : ""}`}
              >
                <Play size={15} />
                <span>{lang === "en" ? "Test Launcher" : "Lanceur Tests"}</span>
              </button>

              <button
                onClick={() => setActiveTab("docs_api")}
                className={`tab-btn ${activeTab === "docs_api" ? "active" : ""}`}
              >
                <ExternalLink size={15} />
                <span>Docs API</span>
              </button>

              <button
                onClick={() => setActiveTab("code")}
                className={`tab-btn ${activeTab === "code" ? "active" : ""}`}
              >
                <Code size={15} />
                <span>Code</span>
              </button>
            </nav>

            <div className="lang-switch">
              <button
                onClick={() => setLang("en")}
                className={`lang-btn ${lang === "en" ? "active" : ""}`}
              >
                🇬🇧 EN
              </button>
              <button
                onClick={() => setLang("fr")}
                className={`lang-btn ${lang === "fr" ? "active" : ""}`}
              >
                🇫🇷 FR
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main>
        <div className="content-card">
          {/* PRESENTATION TAB */}
          {activeTab === "presentation" && (
            <div
              className="markdown-body"
              dangerouslySetInnerHTML={{ __html: presentationHtml }}
            />
          )}

          {/* ROADMAP TAB */}
          {activeTab === "roadmap" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Header Bar for Roadmap */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                }}
              >
                <div>
                  <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Map size={20} style={{ color: "var(--primary)" }} />
                    {lang === "en" ? "Interactive Engineering Roadmap & Live Demos" : "Feuille de Route & Démos Interactives"}
                  </h2>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    {lang === "en"
                      ? "Explore each phase, inspect data contracts (inputs/outputs), and execute live demos."
                      : "Explorez chaque phase, inspectez les contrats de données (entrées/sorties) et testez les démos en direct."}
                  </p>
                </div>

                {/* Toggle View Mode */}
                <div style={{ display: "flex", gap: "8px", background: "rgba(0,0,0,0.3)", padding: "4px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <button
                    onClick={() => setRoadmapViewMode("interactive")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "6px",
                      border: "none",
                      background: roadmapViewMode === "interactive" ? "var(--primary)" : "transparent",
                      color: roadmapViewMode === "interactive" ? "#fff" : "var(--text-muted)",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    🎮 {lang === "en" ? "Interactive Demos" : "Démos Interactives"}
                  </button>
                  <button
                    onClick={() => setRoadmapViewMode("doc")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "6px",
                      border: "none",
                      background: roadmapViewMode === "doc" ? "var(--primary)" : "transparent",
                      color: roadmapViewMode === "doc" ? "#fff" : "var(--text-muted)",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    📖 {lang === "en" ? "Markdown Spec" : "Doc Markdown"}
                  </button>
                </div>
              </div>

              {roadmapViewMode === "doc" ? (
                <div className="markdown-body" dangerouslySetInnerHTML={{ __html: roadmapHtml }} />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "24px" }}>
                  {/* Left Column: Phase Selector Stepper */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {PHASES_DATA.map((phase) => {
                      const isSelected = selectedPhase === phase.id;
                      const isDone = phase.status === "completed";
                      return (
                        <button
                          key={phase.id}
                          onClick={() => setSelectedPhase(phase.id)}
                          style={{
                            textAlign: "left",
                            padding: "14px 16px",
                            borderRadius: "10px",
                            border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border)",
                            background: isSelected ? "rgba(139, 92, 246, 0.15)" : "rgba(255, 255, 255, 0.02)",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: isDone ? "var(--success)" : "var(--warning)" }}>
                              {phase.badge}
                            </span>
                            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Phase {phase.id}/10</span>
                          </div>
                          <div style={{ fontWeight: 600, fontSize: "0.9rem", color: isSelected ? "#fff" : "var(--text-main)" }}>
                            {phase.title}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Column: Selected Phase Detail & Live Playground */}
                  {(() => {
                    const currentPhase = PHASES_DATA.find((p) => p.id === selectedPhase) || PHASES_DATA[3];
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {/* Phase Header Card */}
                        <div style={{ padding: "20px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border)", borderRadius: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <span
                              style={{
                                padding: "4px 12px",
                                borderRadius: "20px",
                                background: currentPhase.status === "completed" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                                border: currentPhase.status === "completed" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)",
                                color: currentPhase.status === "completed" ? "var(--success)" : "var(--warning)",
                                fontWeight: 700,
                                fontSize: "0.8rem",
                              }}
                            >
                              {currentPhase.badge}
                            </span>
                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              Tests : <code>{currentPhase.tests}</code>
                            </span>
                          </div>

                          <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>
                            {currentPhase.title}
                          </h3>
                          <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "16px" }}>
                            {currentPhase.desc}
                          </p>

                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {currentPhase.concepts.map((c, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  background: "rgba(139, 92, 246, 0.1)",
                                  border: "1px solid rgba(139, 92, 246, 0.2)",
                                  color: "var(--secondary)",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                }}
                              >
                                💡 {c}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Input / Output Schema Specification */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                          <div style={{ padding: "16px", background: "rgba(0, 0, 0, 0.3)", border: "1px solid var(--border)", borderRadius: "10px" }}>
                            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--secondary)", marginBottom: "8px", textTransform: "uppercase" }}>
                              📥 Contrat d'Entrée (Input)
                            </div>
                            <pre style={{ fontSize: "0.8rem", color: "#e5e7eb", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                              {currentPhase.inputExample}
                            </pre>
                          </div>

                          <div style={{ padding: "16px", background: "rgba(0, 0, 0, 0.3)", border: "1px solid var(--border)", borderRadius: "10px" }}>
                            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--success)", marginBottom: "8px", textTransform: "uppercase" }}>
                              📤 Contrat de Sortie (Output)
                            </div>
                            <pre style={{ fontSize: "0.8rem", color: "#e5e7eb", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                              {currentPhase.outputExample}
                            </pre>
                          </div>
                        </div>

                        {/* Interactive Playgrounds per Phase */}

                        {/* PHASE 2 PLAYGROUND */}
                        {currentPhase.id === 2 && (
                          <div style={{ padding: "20px", background: "rgba(139, 92, 246, 0.05)", border: "1px solid rgba(139, 92, 246, 0.2)", borderRadius: "12px" }}>
                            <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                              ⚡ Demo Live : Détection Automatique du Type de Source
                            </h4>
                            <div style={{ marginBottom: "12px" }}>
                              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                                Entrez une chaîne (Texte, chemin de fichier local, ou URL http/https) :
                              </label>
                              <input
                                type="text"
                                value={detectorInput}
                                onChange={(e) => setDetectorInput(e.target.value)}
                                style={{
                                  width: "100%",
                                  padding: "10px 14px",
                                  borderRadius: "8px",
                                  background: "rgba(0,0,0,0.4)",
                                  border: "1px solid var(--border)",
                                  color: "#fff",
                                  fontFamily: "monospace",
                                }}
                              />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(0,0,0,0.3)", padding: "12px 16px", borderRadius: "8px" }}>
                              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Résultat de Détection :</span>
                              <span
                                style={{
                                  padding: "4px 12px",
                                  borderRadius: "6px",
                                  background: detectorInput.startsWith("http://") || detectorInput.startsWith("https://") ? "rgba(59, 130, 246, 0.2)" : detectorInput.includes("/") || detectorInput.endsWith(".md") || detectorInput.endsWith(".txt") ? "rgba(245, 158, 11, 0.2)" : "rgba(16, 185, 129, 0.2)",
                                  color: detectorInput.startsWith("http://") || detectorInput.startsWith("https://") ? "#60a5fa" : detectorInput.includes("/") || detectorInput.endsWith(".md") || detectorInput.endsWith(".txt") ? "#fbbf24" : "#34d399",
                                  fontWeight: 700,
                                  fontFamily: "monospace",
                                }}
                              >
                                SourceType.{detectorInput.startsWith("http://") || detectorInput.startsWith("https://") ? "URL 🌐" : detectorInput.includes("/") || detectorInput.endsWith(".md") || detectorInput.endsWith(".txt") ? "FILE 📄" : "TEXT 📝"}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* PHASE 3 PLAYGROUND */}
                        {currentPhase.id === 3 && (
                          <div style={{ padding: "20px", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "12px" }}>
                            <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", marginBottom: "12px" }}>
                              🧹 Demo Live : Ingestion & Décontamination HTML
                            </h4>
                            <div style={{ marginBottom: "12px" }}>
                              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                                HTML brut d'entrée (contient du bruit : script, style, nav) :
                              </label>
                              <textarea
                                rows={4}
                                value={htmlInput}
                                onChange={(e) => setHtmlInput(e.target.value)}
                                style={{
                                  width: "100%",
                                  padding: "10px 14px",
                                  borderRadius: "8px",
                                  background: "rgba(0,0,0,0.4)",
                                  border: "1px solid var(--border)",
                                  color: "#fff",
                                  fontFamily: "monospace",
                                  fontSize: "0.8rem",
                                }}
                              />
                            </div>
                            <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.3)", borderRadius: "8px" }}>
                              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--success)", marginBottom: "4px" }}>
                                ✨ ExtractedContent nettoyé (BeautifulSoup4 output) :
                              </div>
                              <pre style={{ fontSize: "0.85rem", color: "#34d399", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                                {htmlInput.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<header[\s\S]*?<\/header>/gi, "").replace(/<footer[\s\S]*?<\/footer>/gi, "").replace(/<nav[\s\S]*?<\/nav>/gi, "").replace(/<[^>]+>/g, "\n").replace(/\n\s*\n/g, "\n").trim() || "Texte extrait nettoyé"}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* PHASE 4 PLAYGROUND - LLM CLIENT & STRUCTURED OUTPUTS */}
                        {currentPhase.id === 4 && (
                          <div style={{ padding: "24px", background: "rgba(139, 92, 246, 0.08)", border: "1px solid rgba(139, 92, 246, 0.3)", borderRadius: "14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                              <div>
                                <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                                  ⚡ Demo Live : Client LLM & Structured Outputs (Phase 4)
                                </h4>
                                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                  Exécutez l'analyse structurée en mode démo offline (0 coût API) et visualisez le schéma Pydantic V2.
                                </p>
                              </div>
                              <button
                                onClick={handleRunDemoAnalysis}
                                disabled={demoLoading}
                                style={{
                                  padding: "10px 20px",
                                  borderRadius: "8px",
                                  background: "linear-gradient(135deg, var(--primary) 0%, #ec4899 100%)",
                                  color: "#fff",
                                  fontWeight: 700,
                                  fontSize: "0.9rem",
                                  border: "none",
                                  cursor: "pointer",
                                  boxShadow: "0 4px 14px rgba(139, 92, 246, 0.4)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                {demoLoading ? <Loader2 size={16} className="spin" /> : <Play size={16} />}
                                {demoLoading ? "Analyse en cours..." : "Lancer l'Analyse Live"}
                              </button>
                            </div>

                            {/* Preset Buttons */}
                            <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", alignSelf: "center" }}>Exemples d'articles :</span>
                              <button
                                onClick={() => setDemoContent("OpenAI annonce le lancement du framework agentic autonome avec validation Pydantic V2 native, latence sub-100ms sur edge runtime et le suivi FinOps des tokens.")}
                                style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "#fff", fontSize: "0.75rem", cursor: "pointer" }}
                              >
                                🚀 Release Agentic Framework
                              </button>
                              <button
                                onClick={() => setDemoContent("URGENT: Conformité AI Act européenne et auditabilité des modèles de langage locaux pour les systèmes d'information d'entreprise critiques.")}
                                style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "#fff", fontSize: "0.75rem", cursor: "pointer" }}
                              >
                                ⚖️ Regulatory AI Act Audit
                              </button>
                            </div>

                            <textarea
                              rows={3}
                              value={demoContent}
                              onChange={(e) => setDemoContent(e.target.value)}
                              placeholder="Entrez un article ou extrait d'actualité tech à analyser..."
                              style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "8px",
                                background: "rgba(0,0,0,0.4)",
                                border: "1px solid var(--border)",
                                color: "#fff",
                                fontSize: "0.85rem",
                                marginBottom: "16px",
                              }}
                            />

                            {/* Demo Results Viewer */}
                            {demoResult && (
                              <div style={{ marginTop: "16px", background: "rgba(9, 5, 20, 0.8)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                                <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "rgba(0,0,0,0.3)" }}>
                                  <button
                                    onClick={() => setDemoOutputTab("visual")}
                                    style={{
                                      padding: "10px 18px",
                                      background: demoOutputTab === "visual" ? "rgba(139, 92, 246, 0.2)" : "transparent",
                                      border: "none",
                                      borderBottom: demoOutputTab === "visual" ? "2px solid var(--primary)" : "none",
                                      color: demoOutputTab === "visual" ? "#fff" : "var(--text-muted)",
                                      fontWeight: 600,
                                      fontSize: "0.85rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    📊 Rapport Exécutif Rendu
                                  </button>
                                  <button
                                    onClick={() => setDemoOutputTab("json")}
                                    style={{
                                      padding: "10px 18px",
                                      background: demoOutputTab === "json" ? "rgba(139, 92, 246, 0.2)" : "transparent",
                                      border: "none",
                                      borderBottom: demoOutputTab === "json" ? "2px solid var(--primary)" : "none",
                                      color: demoOutputTab === "json" ? "#fff" : "var(--text-muted)",
                                      fontWeight: 600,
                                      fontSize: "0.85rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    💻 Payload JSON Pydantic V2
                                  </button>
                                </div>

                                <div style={{ padding: "20px" }}>
                                  {demoOutputTab === "visual" ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <h4 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>
                                          {demoResult.title}
                                        </h4>
                                        <span
                                          style={{
                                            padding: "4px 12px",
                                            borderRadius: "20px",
                                            background: demoResult.priority === "high" ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)",
                                            color: demoResult.priority === "high" ? "#f87171" : "#fbbf24",
                                            fontWeight: 800,
                                            fontSize: "0.75rem",
                                            textTransform: "uppercase",
                                          }}
                                        >
                                          Priorité : {demoResult.priority}
                                        </span>
                                      </div>

                                      <div style={{ fontSize: "0.9rem", color: "#d1d5db", lineHeight: 1.6, background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px" }}>
                                        <strong>Résumé Exécutif :</strong> {demoResult.summary}
                                      </div>

                                      <div>
                                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--secondary)", marginBottom: "6px" }}>
                                          Points Clés :
                                        </div>
                                        <ul style={{ paddingLeft: "20px", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                                          {demoResult.key_points.map((kp: string, idx: number) => (
                                            <li key={idx}>{kp}</li>
                                          ))}
                                        </ul>
                                      </div>

                                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                                        <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Impact Technique</span>
                                          <span style={{ fontSize: "0.8rem", color: "#fff" }}>{demoResult.impact_technical}</span>
                                        </div>
                                        <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Impact Business</span>
                                          <span style={{ fontSize: "0.8rem", color: "#fff" }}>{demoResult.impact_business}</span>
                                        </div>
                                        <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Impact AI Act / Réglementaire</span>
                                          <span style={{ fontSize: "0.8rem", color: "#fff" }}>{demoResult.impact_regulatory || "N/A"}</span>
                                        </div>
                                      </div>

                                      {/* FinOps Telemetry Bar */}
                                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", padding: "12px", background: "rgba(16, 185, 129, 0.08)", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Prompt Tokens</span>
                                          <strong style={{ color: "#34d399" }}>{demoResult.prompt_tokens}</strong>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Completion Tokens</span>
                                          <strong style={{ color: "#34d399" }}>{demoResult.completion_tokens}</strong>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Coût Estimé (USD)</span>
                                          <strong style={{ color: "#34d399" }}>${demoResult.estimated_cost_usd}</strong>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Temps d'Exécution</span>
                                          <strong style={{ color: "#34d399" }}>{demoResult.execution_time_seconds}s</strong>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <pre style={{ fontSize: "0.8rem", color: "#a78bfa", fontFamily: "monospace", overflowX: "auto" }}>
                                      {JSON.stringify(demoResult, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* PHASE 5 PLAYGROUND - FINOPS COST CALCULATOR & METRICS INJECTION */}
                        {currentPhase.id === 5 && (
                          <div style={{ padding: "24px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                              <div>
                                <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                                  ⚡ Demo Live : Calculatrice FinOps & Injection de Métriques (Phase 5)
                                </h4>
                                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                  Simulez et calculez le coût d'inférence marginal direct (USD/1M tokens) et la télémétrie FinOps pour 40+ modèles d'IA.
                                </p>
                              </div>
                              <button
                                onClick={handleRunFinopsCalculation}
                                disabled={finopsLoading}
                                style={{
                                  padding: "10px 20px",
                                  borderRadius: "8px",
                                  background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
                                  color: "#fff",
                                  fontWeight: 700,
                                  fontSize: "0.9rem",
                                  border: "none",
                                  cursor: "pointer",
                                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                {finopsLoading ? <Loader2 size={16} className="spin" /> : <Play size={16} />}
                                {finopsLoading ? "Calcul en cours..." : "⚡ Lancer le Calcul FinOps Live"}
                              </button>
                            </div>

                            {/* Preset Buttons */}
                            <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", alignSelf: "center" }}>Presets de modèles :</span>
                              <button
                                onClick={() => { setFinopsModel("gemini-1.5-flash"); setFinopsPromptTokens(1000); setFinopsCompletionTokens(500); }}
                                style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "#fff", fontSize: "0.75rem", cursor: "pointer" }}
                              >
                                ⚡ Gemini 1.5 Flash (Standard)
                              </button>
                              <button
                                onClick={() => { setFinopsModel("gpt-4o"); setFinopsPromptTokens(2500); setFinopsCompletionTokens(800); }}
                                style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "#fff", fontSize: "0.75rem", cursor: "pointer" }}
                              >
                                🚀 OpenAI GPT-4o (High Performance)
                              </button>
                              <button
                                onClick={() => { setFinopsModel("claude-3-5-sonnet-20241022"); setFinopsPromptTokens(5000); setFinopsCompletionTokens(1200); }}
                                style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "#fff", fontSize: "0.75rem", cursor: "pointer" }}
                              >
                                💡 Claude 3.5 Sonnet (Large Prompt)
                              </button>
                              <button
                                onClick={() => { setFinopsModel("gpt-4o-mini"); setFinopsPromptTokens(10000); setFinopsCompletionTokens(2000); }}
                                style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "#fff", fontSize: "0.75rem", cursor: "pointer" }}
                              >
                                🎯 GPT-4o Mini (Batch Economy)
                              </button>
                            </div>

                            {/* Form Controls */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                              <div>
                                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                                  Modèle d'IA :
                                </label>
                                <select
                                  value={finopsModel}
                                  onChange={(e) => setFinopsModel(e.target.value)}
                                  style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    background: "rgba(0,0,0,0.4)",
                                    border: "1px solid var(--border)",
                                    color: "#fff",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  <option value="gemini-1.5-flash">Google Gemini 1.5 Flash</option>
                                  <option value="gemini-1.5-pro-latest">Google Gemini 1.5 Pro</option>
                                  <option value="gemini-2.0-flash">Google Gemini 2.0 Flash</option>
                                  <option value="gpt-4o">OpenAI GPT-4o</option>
                                  <option value="gpt-4o-mini">OpenAI GPT-4o Mini</option>
                                  <option value="claude-3-5-sonnet-20241022">Anthropic Claude 3.5 Sonnet</option>
                                  <option value="claude-3-5-haiku-20241022">Anthropic Claude 3.5 Haiku</option>
                                  <option value="deepseek-chat">DeepSeek Chat</option>
                                  <option value="deepseek-reasoner">DeepSeek Reasoner</option>
                                  <option value="llama-3.1-70b">Meta Llama 3.1 70B</option>
                                </select>
                              </div>

                              <div>
                                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                                  Tokens d'Entrée (Prompt Tokens) :
                                </label>
                                <input
                                  type="number"
                                  value={finopsPromptTokens}
                                  onChange={(e) => setFinopsPromptTokens(Number(e.target.value))}
                                  style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    background: "rgba(0,0,0,0.4)",
                                    border: "1px solid var(--border)",
                                    color: "#fff",
                                    fontFamily: "monospace",
                                    fontSize: "0.85rem",
                                  }}
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                                  Tokens de Sortie (Completion Tokens) :
                                </label>
                                <input
                                  type="number"
                                  value={finopsCompletionTokens}
                                  onChange={(e) => setFinopsCompletionTokens(Number(e.target.value))}
                                  style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    background: "rgba(0,0,0,0.4)",
                                    border: "1px solid var(--border)",
                                    color: "#fff",
                                    fontFamily: "monospace",
                                    fontSize: "0.85rem",
                                  }}
                                />
                              </div>
                            </div>

                            {/* FinOps Calculation Results Viewer */}
                            {finopsResult && (
                              <div style={{ marginTop: "16px", background: "rgba(9, 5, 20, 0.8)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                                <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "rgba(0,0,0,0.3)" }}>
                                  <button
                                    onClick={() => setFinopsOutputTab("visual")}
                                    style={{
                                      padding: "10px 18px",
                                      background: finopsOutputTab === "visual" ? "rgba(16, 185, 129, 0.2)" : "transparent",
                                      border: "none",
                                      borderBottom: finopsOutputTab === "visual" ? "2px solid var(--success)" : "none",
                                      color: finopsOutputTab === "visual" ? "#fff" : "var(--text-muted)",
                                      fontWeight: 600,
                                      fontSize: "0.85rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    📊 Tableau Télémetrie FinOps
                                  </button>
                                  <button
                                    onClick={() => setFinopsOutputTab("json")}
                                    style={{
                                      padding: "10px 18px",
                                      background: finopsOutputTab === "json" ? "rgba(16, 185, 129, 0.2)" : "transparent",
                                      border: "none",
                                      borderBottom: finopsOutputTab === "json" ? "2px solid var(--success)" : "none",
                                      color: finopsOutputTab === "json" ? "#fff" : "var(--text-muted)",
                                      fontWeight: 600,
                                      fontSize: "0.85rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    💻 Payload JSON Pydantic V2
                                  </button>
                                </div>

                                <div style={{ padding: "20px" }}>
                                  {finopsOutputTab === "visual" ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                      {/* Telemetry Metric Cards */}
                                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                                        <div style={{ background: "rgba(0,0,0,0.4)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Modèle Sélectionné</span>
                                          <strong style={{ fontSize: "0.95rem", color: "#60a5fa" }}>{finopsResult.model_used}</strong>
                                        </div>

                                        <div style={{ background: "rgba(0,0,0,0.4)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Volume Total Tokens</span>
                                          <strong style={{ fontSize: "1rem", color: "#a78bfa" }}>{finopsResult.total_tokens} tokens</strong>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>
                                            {finopsResult.prompt_tokens} in / {finopsResult.completion_tokens} out
                                          </span>
                                        </div>

                                        <div style={{ background: "rgba(0,0,0,0.4)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Coût Total Estimé (USD)</span>
                                          <strong
                                            style={{
                                              fontSize: "1.1rem",
                                              color: finopsResult.cost_breakdown?.total_cost_usd < 0.01 ? "#34d399" : finopsResult.cost_breakdown?.total_cost_usd < 0.05 ? "#fbbf24" : "#f87171",
                                            }}
                                          >
                                            ${finopsResult.cost_breakdown?.total_cost_usd}
                                          </strong>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>
                                            Arrondi sub-centime (6 décimales)
                                          </span>
                                        </div>

                                        <div style={{ background: "rgba(0,0,0,0.4)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Latence (Execution Time)</span>
                                          <strong style={{ fontSize: "1rem", color: "#34d399" }}>{finopsResult.execution_time_seconds}s</strong>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>
                                            Mesure time.perf_counter()
                                          </span>
                                        </div>
                                      </div>

                                      {/* Financial Breakdown Table */}
                                      <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "10px", padding: "14px", border: "1px solid var(--border)" }}>
                                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--success)", marginBottom: "10px" }}>
                                          💰 Ventilation Financière par Million de Tokens (USD per 1M Tokens Matrix)
                                        </div>
                                        <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse", color: "#d1d5db" }}>
                                          <thead>
                                            <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-muted)" }}>
                                              <th style={{ padding: "8px" }}>Type de Token</th>
                                              <th style={{ padding: "8px" }}>Nombre de Tokens</th>
                                              <th style={{ padding: "8px" }}>Taux Tarifaire (per 1M)</th>
                                              <th style={{ padding: "8px", textAlign: "right" }}>Coût Calculé (USD)</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                              <td style={{ padding: "8px" }}>📥 Prompt (Entrée)</td>
                                              <td style={{ padding: "8px", fontFamily: "monospace" }}>{finopsResult.prompt_tokens}</td>
                                              <td style={{ padding: "8px", fontFamily: "monospace" }}>${finopsResult.rates?.input_per_1m_usd} / 1M</td>
                                              <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace", color: "#34d399" }}>${finopsResult.cost_breakdown?.input_cost_usd}</td>
                                            </tr>
                                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                              <td style={{ padding: "8px" }}>📤 Completion (Sortie)</td>
                                              <td style={{ padding: "8px", fontFamily: "monospace" }}>{finopsResult.completion_tokens}</td>
                                              <td style={{ padding: "8px", fontFamily: "monospace" }}>${finopsResult.rates?.output_per_1m_usd} / 1M</td>
                                              <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace", color: "#34d399" }}>${finopsResult.cost_breakdown?.output_cost_usd}</td>
                                            </tr>
                                            <tr style={{ fontWeight: 700 }}>
                                              <td style={{ padding: "8px", color: "#fff" }}>💵 TOTAL ESTIMATION</td>
                                              <td style={{ padding: "8px", fontFamily: "monospace", color: "#fff" }}>{finopsResult.total_tokens}</td>
                                              <td style={{ padding: "8px" }}>—</td>
                                              <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace", color: "var(--success)", fontSize: "0.9rem" }}>${finopsResult.cost_breakdown?.total_cost_usd}</td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  ) : (
                                    <pre style={{ fontSize: "0.8rem", color: "#34d399", fontFamily: "monospace", overflowX: "auto" }}>
                                      {JSON.stringify(finopsResult, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* PHASE 6 PLAYGROUND - RICH TERMINAL UI & OUTPUT FORMATS */}
                        {currentPhase.id === 6 && (
                          <div style={{ padding: "24px", background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                              <div>
                                <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                                  ⚡ Demo Live : Rich Terminal UI & Formats d'Export (Phase 6)
                                </h4>
                                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                  Exécutez la génération de rapports enrichis Terminal Rich UI et testez l'export multi-formats (Console ANSI, Markdown, Raw JSON) avec télémétrie FinOps.
                                </p>
                              </div>
                              <button
                                onClick={handleRunRichUiDemo}
                                disabled={richUiLoading}
                                style={{
                                  padding: "10px 20px",
                                  borderRadius: "8px",
                                  background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                                  color: "#fff",
                                  fontWeight: 700,
                                  fontSize: "0.9rem",
                                  border: "none",
                                  cursor: "pointer",
                                  boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                {richUiLoading ? <Loader2 size={16} className="spin" /> : <Play size={16} />}
                                {richUiLoading ? "Génération..." : "⚡ Lancer l'Analyse Live"}
                              </button>
                            </div>

                            {/* Presets */}
                            <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", alignSelf: "center" }}>Exemples d'entrées :</span>
                              <button
                                onClick={() => setRichUiContent("OpenAI annonce le lancement du framework agentic autonome avec validation Pydantic V2 native, latence sub-100ms sur edge runtime et le suivi FinOps des tokens.")}
                                style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "#fff", fontSize: "0.75rem", cursor: "pointer" }}
                              >
                                🚀 Release Agentic Framework
                              </button>
                              <button
                                onClick={() => setRichUiContent("Audit annuel des dépenses FinOps et optimisation de la grille tarifaire pour 40+ modèles de langage avec réduction de 35% de la facture API.")}
                                style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "#fff", fontSize: "0.75rem", cursor: "pointer" }}
                              >
                                📊 Audit FinOps Annuel
                              </button>
                              <button
                                onClick={() => setRichUiContent("URGENT: Critical Security Advisory - vulnérabilité SSRF sur les requêtes Web scraping et guardrails de décontamination HTML.")}
                                style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "#fff", fontSize: "0.75rem", cursor: "pointer" }}
                              >
                                🛡️ Critical Security Advisory
                              </button>
                            </div>

                            {/* Input Content Textarea */}
                            <textarea
                              rows={3}
                              value={richUiContent}
                              onChange={(e) => setRichUiContent(e.target.value)}
                              placeholder="Entrez le texte à analyser et exporter..."
                              style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "8px",
                                background: "rgba(0,0,0,0.4)",
                                border: "1px solid var(--border)",
                                color: "#fff",
                                fontSize: "0.85rem",
                                marginBottom: "16px",
                              }}
                            />

                            {/* Controls */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                              <div>
                                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                                  Format d'Export :
                                </label>
                                <select
                                  value={richUiFormat}
                                  onChange={(e) => setRichUiFormat(e.target.value as any)}
                                  style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    background: "rgba(0,0,0,0.4)",
                                    border: "1px solid var(--border)",
                                    color: "#fff",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  <option value="console">🖥️ Terminal Rich UI (Console)</option>
                                  <option value="markdown">📄 Document Markdown (.md)</option>
                                  <option value="json">💻 Raw JSON (Pydantic V2)</option>
                                </select>
                              </div>

                              <div>
                                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                                  Modèle LLM :
                                </label>
                                <select
                                  value={richUiModel}
                                  onChange={(e) => setRichUiModel(e.target.value)}
                                  style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    background: "rgba(0,0,0,0.4)",
                                    border: "1px solid var(--border)",
                                    color: "#fff",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  <option value="gemini-1.5-flash">Google Gemini 1.5 Flash</option>
                                  <option value="gpt-4o">OpenAI GPT-4o</option>
                                  <option value="claude-3-5-sonnet-20241022">Anthropic Claude 3.5 Sonnet</option>
                                  <option value="deepseek-chat">DeepSeek Chat</option>
                                </select>
                              </div>

                              <div>
                                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                                  Température (0.0 - 1.0) :
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="1"
                                  step="0.1"
                                  value={richUiTemperature}
                                  onChange={(e) => setRichUiTemperature(Number(e.target.value))}
                                  style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    background: "rgba(0,0,0,0.4)",
                                    border: "1px solid var(--border)",
                                    color: "#fff",
                                    fontFamily: "monospace",
                                    fontSize: "0.85rem",
                                  }}
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                                  Thème Visuel Rich UI :
                                </label>
                                <select
                                  value={richUiTheme}
                                  onChange={(e) => setRichUiTheme(e.target.value)}
                                  style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    background: "rgba(0,0,0,0.4)",
                                    border: "1px solid var(--border)",
                                    color: "#fff",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  <option value="emerald">💚 Emerald / Tech Green</option>
                                  <option value="cyberpunk">💜 Cyberpunk / Neon Violet</option>
                                  <option value="monokai">💛 Monokai / Solarized</option>
                                </select>
                              </div>
                            </div>

                            {/* Demo Results Viewer */}
                            {richUiResult && (
                              <div style={{ marginTop: "16px", background: "rgba(9, 5, 20, 0.8)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                                <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "rgba(0,0,0,0.3)" }}>
                                  <button
                                    onClick={() => setRichUiTab("visual")}
                                    style={{
                                      padding: "10px 18px",
                                      background: richUiTab === "visual" ? "rgba(59, 130, 246, 0.2)" : "transparent",
                                      border: "none",
                                      borderBottom: richUiTab === "visual" ? "2px solid #3b82f6" : "none",
                                      color: richUiTab === "visual" ? "#fff" : "var(--text-muted)",
                                      fontWeight: 600,
                                      fontSize: "0.85rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    📊 Rendered View & Télémétrie
                                  </button>
                                  <button
                                    onClick={() => setRichUiTab("json")}
                                    style={{
                                      padding: "10px 18px",
                                      background: richUiTab === "json" ? "rgba(59, 130, 246, 0.2)" : "transparent",
                                      border: "none",
                                      borderBottom: richUiTab === "json" ? "2px solid #3b82f6" : "none",
                                      color: richUiTab === "json" ? "#fff" : "var(--text-muted)",
                                      fontWeight: 600,
                                      fontSize: "0.85rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    💻 Raw JSON (Pydantic V2)
                                  </button>
                                  <button
                                    onClick={() => setRichUiTab("preview")}
                                    style={{
                                      padding: "10px 18px",
                                      background: richUiTab === "preview" ? "rgba(59, 130, 246, 0.2)" : "transparent",
                                      border: "none",
                                      borderBottom: richUiTab === "preview" ? "2px solid #3b82f6" : "none",
                                      color: richUiTab === "preview" ? "#fff" : "var(--text-muted)",
                                      fontWeight: 600,
                                      fontSize: "0.85rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    📄 Export Preview ({richUiResult.format?.toUpperCase()})
                                  </button>
                                </div>

                                <div style={{ padding: "20px" }}>
                                  {richUiTab === "visual" && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <h4 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>
                                          {richUiResult.report?.title}
                                        </h4>
                                        <span
                                          style={{
                                            padding: "4px 12px",
                                            borderRadius: "20px",
                                            background: richUiResult.report?.priority === "high" ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)",
                                            color: richUiResult.report?.priority === "high" ? "#f87171" : "#fbbf24",
                                            fontWeight: 800,
                                            fontSize: "0.75rem",
                                            textTransform: "uppercase",
                                          }}
                                        >
                                          Priorité : {richUiResult.report?.priority}
                                        </span>
                                      </div>

                                      <div style={{ fontSize: "0.9rem", color: "#d1d5db", lineHeight: 1.6, background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px" }}>
                                        <strong>Executive Summary :</strong> {richUiResult.report?.summary}
                                      </div>

                                      <div>
                                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#60a5fa", marginBottom: "6px" }}>
                                          Points Clés :
                                        </div>
                                        <ul style={{ paddingLeft: "20px", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                                          {richUiResult.report?.key_points?.map((kp: string, idx: number) => (
                                            <li key={idx}>{kp}</li>
                                          ))}
                                        </ul>
                                      </div>

                                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                                        <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Impact Technique</span>
                                          <span style={{ fontSize: "0.8rem", color: "#fff" }}>{richUiResult.report?.impact_technical}</span>
                                        </div>
                                        <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Impact Business</span>
                                          <span style={{ fontSize: "0.8rem", color: "#fff" }}>{richUiResult.report?.impact_business}</span>
                                        </div>
                                        <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Impact AI Act / Réglementaire</span>
                                          <span style={{ fontSize: "0.8rem", color: "#fff" }}>{richUiResult.report?.impact_regulatory || "N/A"}</span>
                                        </div>
                                      </div>

                                      {/* FinOps Telemetry Bar */}
                                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", padding: "12px", background: "rgba(59, 130, 246, 0.08)", borderRadius: "8px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Prompt Tokens</span>
                                          <strong style={{ color: "#60a5fa" }}>{richUiResult.telemetry?.prompt_tokens}</strong>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Completion Tokens</span>
                                          <strong style={{ color: "#60a5fa" }}>{richUiResult.telemetry?.completion_tokens}</strong>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Coût Estimé (USD)</span>
                                          <strong style={{ color: "#34d399" }}>${richUiResult.telemetry?.estimated_cost_usd}</strong>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Latence</span>
                                          <strong style={{ color: "#60a5fa" }}>{richUiResult.telemetry?.execution_time_seconds}s</strong>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Format Exporter</span>
                                          <strong style={{ color: "#a78bfa", textTransform: "uppercase" }}>{richUiResult.telemetry?.export_format}</strong>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {richUiTab === "json" && (
                                    <pre style={{ fontSize: "0.8rem", color: "#a78bfa", fontFamily: "monospace", overflowX: "auto" }}>
                                      {JSON.stringify(richUiResult.report, null, 2)}
                                    </pre>
                                  )}

                                  {richUiTab === "preview" && (
                                    <pre style={{ fontSize: "0.8rem", color: "#34d399", fontFamily: "monospace", overflowX: "auto", background: "rgba(0,0,0,0.6)", padding: "14px", borderRadius: "8px" }}>
                                      {richUiResult.rendered_output}
                                    </pre>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* PHASE 7 PLAYGROUND - LOCAL CACHING SYSTEM */}
                        {currentPhase.id === 7 && (
                          <div style={{ padding: "24px", background: "rgba(168, 85, 247, 0.08)", border: "1px solid rgba(168, 85, 247, 0.3)", borderRadius: "14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                              <div>
                                <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                                  ⚡ Demo Live : Système de Cache Local & Empreinte SHA-256 (Phase 7)
                                </h4>
                                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                  Testez l'invalidation par TTL, le contournement CLI (--no-cache) et la suppression de latence/coût API sur CACHE HIT.
                                </p>
                              </div>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                  onClick={() => handleRunCacheDemo("clear")}
                                  disabled={cacheLoading}
                                  style={{
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    background: "rgba(239, 68, 68, 0.2)",
                                    color: "#f87171",
                                    fontWeight: 700,
                                    fontSize: "0.85rem",
                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                    cursor: "pointer",
                                  }}
                                >
                                  🗑️ Vider le Cache
                                </button>
                                <button
                                  onClick={() => handleRunCacheDemo("analyze")}
                                  disabled={cacheLoading}
                                  style={{
                                    padding: "10px 20px",
                                    borderRadius: "8px",
                                    background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: "0.9rem",
                                    border: "none",
                                    cursor: "pointer",
                                    boxShadow: "0 4px 14px rgba(168, 85, 247, 0.4)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                  }}
                                >
                                  {cacheLoading ? <Loader2 size={16} className="spin" /> : <Play size={16} />}
                                  {cacheLoading ? "Exécution..." : "⚡ Lancer l'Analyse Live"}
                                </button>
                              </div>
                            </div>

                            {/* Presets */}
                            <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", alignSelf: "center" }}>Exemples d'entrées :</span>
                              <button
                                onClick={() => setCacheContent("Analyse récurrente de documentation technique. Le système de cache local JSON avec empreinte SHA-256 élimine la latence API et garantit un coût financier de $0.00 USD.")}
                                style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "#fff", fontSize: "0.75rem", cursor: "pointer" }}
                              >
                                ⚡ Documentation Tech (Hit Récurrent)
                              </button>
                              <button
                                onClick={() => setCacheContent(`Contenu dynamique unique généré à ${new Date().toLocaleTimeString()} pour forcer un CACHE MISS.`)}
                                style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "#fff", fontSize: "0.75rem", cursor: "pointer" }}
                              >
                                🔄 Dynamic Unique String (Cache Miss)
                              </button>
                            </div>

                            {/* Input Content Textarea */}
                            <textarea
                              rows={3}
                              value={cacheContent}
                              onChange={(e) => setCacheContent(e.target.value)}
                              placeholder="Entrez le texte à analyser via le cache local..."
                              style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "8px",
                                background: "rgba(0,0,0,0.4)",
                                border: "1px solid var(--border)",
                                color: "#fff",
                                fontSize: "0.85rem",
                                marginBottom: "16px",
                              }}
                            />

                            {/* Controls */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                              <div>
                                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                                  Modèle LLM :
                                </label>
                                <select
                                  value={cacheModel}
                                  onChange={(e) => setCacheModel(e.target.value)}
                                  style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    background: "rgba(0,0,0,0.4)",
                                    border: "1px solid var(--border)",
                                    color: "#fff",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  <option value="gemini-1.5-flash">Google Gemini 1.5 Flash</option>
                                  <option value="gpt-4o">OpenAI GPT-4o</option>
                                  <option value="claude-3-5-sonnet-20241022">Anthropic Claude 3.5 Sonnet</option>
                                </select>
                              </div>

                              <div>
                                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                                  TTL (Time-To-Live en secondes) :
                                </label>
                                <input
                                  type="number"
                                  value={cacheTtl}
                                  onChange={(e) => setCacheTtl(Number(e.target.value))}
                                  placeholder="3600 (0 pour forcer expiration)"
                                  style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    background: "rgba(0,0,0,0.4)",
                                    border: "1px solid var(--border)",
                                    color: "#fff",
                                    fontFamily: "monospace",
                                    fontSize: "0.85rem",
                                  }}
                                />
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "20px" }}>
                                <input
                                  type="checkbox"
                                  id="bypass_cache_chk"
                                  checked={cacheBypass}
                                  onChange={(e) => setCacheBypass(e.target.checked)}
                                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                />
                                <label htmlFor="bypass_cache_chk" style={{ fontSize: "0.85rem", color: "#fff", cursor: "pointer" }}>
                                  🚫 Flag <code>--no-cache</code> (Bypass Cache)
                                </label>
                              </div>
                            </div>

                            {/* Demo Results Viewer */}
                            {cacheResult && (
                              <div style={{ marginTop: "16px", background: "rgba(9, 5, 20, 0.8)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                                <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "rgba(0,0,0,0.3)" }}>
                                  <button
                                    onClick={() => setCacheTab("visual")}
                                    style={{
                                      padding: "10px 18px",
                                      background: cacheTab === "visual" ? "rgba(168, 85, 247, 0.2)" : "transparent",
                                      border: "none",
                                      borderBottom: cacheTab === "visual" ? "2px solid #a855f7" : "none",
                                      color: cacheTab === "visual" ? "#fff" : "var(--text-muted)",
                                      fontWeight: 600,
                                      fontSize: "0.85rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    📊 Rendered View & Status Cache
                                  </button>
                                  <button
                                    onClick={() => setCacheTab("json")}
                                    style={{
                                      padding: "10px 18px",
                                      background: cacheTab === "json" ? "rgba(168, 85, 247, 0.2)" : "transparent",
                                      border: "none",
                                      borderBottom: cacheTab === "json" ? "2px solid #a855f7" : "none",
                                      color: cacheTab === "json" ? "#fff" : "var(--text-muted)",
                                      fontWeight: 600,
                                      fontSize: "0.85rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    💻 Raw JSON (Pydantic V2)
                                  </button>
                                </div>

                                <div style={{ padding: "20px" }}>
                                  {cacheTab === "visual" && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                      {/* Cache Hit/Miss Status Banner */}
                                      <div
                                        style={{
                                          display: "flex",
                                          justify: "space-between",
                                          alignItems: "center",
                                          padding: "14px 18px",
                                          borderRadius: "10px",
                                          background: cacheResult.cache_hit ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                                          border: cacheResult.cache_hit ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)",
                                        }}
                                      >
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                          <span
                                            style={{
                                              padding: "6px 14px",
                                              borderRadius: "20px",
                                              background: cacheResult.cache_hit ? "#10b981" : "#f59e0b",
                                              color: "#000",
                                              fontWeight: 900,
                                              fontSize: "0.85rem",
                                            }}
                                          >
                                            {cacheResult.cache_hit ? "⚡ CACHE HIT" : "🌐 CACHE MISS"}
                                          </span>
                                          <span style={{ fontSize: "0.85rem", color: "#fff" }}>
                                            {cacheResult.cache_hit
                                              ? "Résultat restitué instantanément depuis le cache disque local."
                                              : "Exécution de l'analyse et enregistrement de l'empreinte SHA-256."}
                                          </span>
                                        </div>
                                        <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-muted)" }}>
                                          SHA-256: {cacheResult.content_hash?.substring(0, 18)}...
                                        </span>
                                      </div>

                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <h4 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>
                                          {cacheResult.report?.title}
                                        </h4>
                                        <span
                                          style={{
                                            padding: "4px 12px",
                                            borderRadius: "20px",
                                            background: cacheResult.report?.priority === "high" ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)",
                                            color: cacheResult.report?.priority === "high" ? "#f87171" : "#fbbf24",
                                            fontWeight: 800,
                                            fontSize: "0.75rem",
                                            textTransform: "uppercase",
                                          }}
                                        >
                                          Priorité : {cacheResult.report?.priority}
                                        </span>
                                      </div>

                                      <div style={{ fontSize: "0.9rem", color: "#d1d5db", lineHeight: 1.6, background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px" }}>
                                        <strong>Executive Summary :</strong> {cacheResult.report?.summary}
                                      </div>

                                      <div>
                                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#c084fc", marginBottom: "6px" }}>
                                          Points Clés Cache Local :
                                        </div>
                                        <ul style={{ paddingLeft: "20px", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                                          {cacheResult.report?.key_points?.map((kp: string, idx: number) => (
                                            <li key={idx}>{kp}</li>
                                          ))}
                                        </ul>
                                      </div>

                                      {/* FinOps & Cache Telemetry Bar */}
                                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", padding: "12px", background: "rgba(168, 85, 247, 0.08)", borderRadius: "8px", border: "1px solid rgba(168, 85, 247, 0.2)" }}>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Statut Cache</span>
                                          <strong style={{ color: cacheResult.cache_hit ? "#34d399" : "#fbbf24" }}>
                                            {cacheResult.cache_hit ? "HIT" : "MISS"}
                                          </strong>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Coût Effectif API</span>
                                          <strong style={{ color: cacheResult.cache_hit ? "#34d399" : "#f87171" }}>
                                            ${cacheResult.telemetry?.estimated_cost_usd}
                                          </strong>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Économie FinOps</span>
                                          <strong style={{ color: "#34d399" }}>
                                            ${cacheResult.telemetry?.saved_cost_usd || (cacheResult.cache_hit ? cacheResult.report?.estimated_cost_usd : 0)}
                                          </strong>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Latence Effective</span>
                                          <strong style={{ color: "#34d399" }}>{cacheResult.telemetry?.execution_time_seconds}s</strong>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>TTL Restant / Âge</span>
                                          <strong style={{ color: "#c084fc" }}>{cacheResult.age_seconds}s / {cacheResult.ttl}s</strong>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {cacheTab === "json" && (
                                    <pre style={{ fontSize: "0.8rem", color: "#c084fc", fontFamily: "monospace", overflowX: "auto" }}>
                                      {JSON.stringify(cacheResult, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* PHASE 8 PLAYGROUND - NETWORK RESILIENCE (RETRY & BACKOFF) */}
                        {currentPhase.id === 8 && (
                          <div style={{ padding: "24px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                              <div>
                                <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                                  🛡️ Demo Live : Résilience Réseau & Backoff Exponentiel Tenacity (Phase 8)
                                </h4>
                                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                  Simulez des erreurs API (HTTP 429, Timeout réseau, Panne totale) et observez la politique de réessai adaptative avec Jitter.
                                </p>
                              </div>
                              <button
                                onClick={() => handleRunRetryDemo()}
                                disabled={retryLoading}
                                style={{
                                  padding: "10px 20px",
                                  borderRadius: "8px",
                                  background: "linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)",
                                  color: "#fff",
                                  fontWeight: 700,
                                  fontSize: "0.9rem",
                                  border: "none",
                                  cursor: "pointer",
                                  boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                {retryLoading ? <Loader2 size={16} className="spin" /> : <Play size={16} />}
                                {retryLoading ? "Exécution..." : "⚡ Lancer l'Analyse Live"}
                              </button>
                            </div>

                            {/* Scenarios & Presets */}
                            <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", alignSelf: "center" }}>Scénarios Pré-remplis :</span>
                              <button
                                onClick={() => {
                                  setRetryScenario("success");
                                  handleRunRetryDemo("success");
                                }}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  background: retryScenario === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(255,255,255,0.05)",
                                  border: "1px solid " + (retryScenario === "success" ? "#10b981" : "var(--border)"),
                                  color: "#fff",
                                  fontSize: "0.75rem",
                                  cursor: "pointer",
                                }}
                              >
                                🟢 Direct Success (1st Attempt)
                              </button>
                              <button
                                onClick={() => {
                                  setRetryScenario("rate_limit_recovered");
                                  handleRunRetryDemo("rate_limit_recovered");
                                }}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  background: retryScenario === "rate_limit_recovered" ? "rgba(245, 158, 11, 0.3)" : "rgba(255,255,255,0.05)",
                                  border: "1px solid " + (retryScenario === "rate_limit_recovered" ? "#f59e0b" : "var(--border)"),
                                  color: "#fff",
                                  fontSize: "0.75rem",
                                  cursor: "pointer",
                                }}
                              >
                                ⚡ Rate Limit (429 -{">"} Success 3rd Try)
                              </button>
                              <button
                                onClick={() => {
                                  setRetryScenario("network_flake_recovered");
                                  handleRunRetryDemo("network_flake_recovered");
                                }}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  background: retryScenario === "network_flake_recovered" ? "rgba(59, 130, 246, 0.3)" : "rgba(255,255,255,0.05)",
                                  border: "1px solid " + (retryScenario === "network_flake_recovered" ? "#3b82f6" : "var(--border)"),
                                  color: "#fff",
                                  fontSize: "0.75rem",
                                  cursor: "pointer",
                                }}
                              >
                                📡 Network Timeout (Success 2nd Try)
                              </button>
                              <button
                                onClick={() => {
                                  setRetryScenario("outage_failed");
                                  handleRunRetryDemo("outage_failed");
                                }}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  background: retryScenario === "outage_failed" ? "rgba(239, 68, 68, 0.3)" : "rgba(255,255,255,0.05)",
                                  border: "1px solid " + (retryScenario === "outage_failed" ? "#ef4444" : "var(--border)"),
                                  color: "#fff",
                                  fontSize: "0.75rem",
                                  cursor: "pointer",
                                }}
                              >
                                🚨 Persistent Outage (4 Attempts Failure)
                              </button>
                            </div>

                            {/* Input Content Textarea */}
                            <textarea
                              rows={3}
                              value={retryContent}
                              onChange={(e) => setRetryContent(e.target.value)}
                              placeholder="Entrez le texte à analyser via le client résilient..."
                              style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "8px",
                                background: "rgba(0,0,0,0.4)",
                                border: "1px solid var(--border)",
                                color: "#fff",
                                fontSize: "0.85rem",
                                marginBottom: "16px",
                              }}
                            />

                            {/* Controls */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                              <div>
                                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                                  Modèle LLM :
                                </label>
                                <select
                                  value={retryModel}
                                  onChange={(e) => setRetryModel(e.target.value)}
                                  style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    background: "rgba(0,0,0,0.4)",
                                    border: "1px solid var(--border)",
                                    color: "#fff",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  <option value="gemini-1.5-flash">Google Gemini 1.5 Flash</option>
                                  <option value="gpt-4o">OpenAI GPT-4o</option>
                                  <option value="claude-3-5-sonnet-20241022">Anthropic Claude 3.5 Sonnet</option>
                                </select>
                              </div>

                              <div>
                                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                                  Max Tentatives (Attempts) :
                                </label>
                                <input
                                  type="number"
                                  value={retryMaxAttempts}
                                  onChange={(e) => setRetryMaxAttempts(Number(e.target.value))}
                                  min={1}
                                  max={6}
                                  style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    background: "rgba(0,0,0,0.4)",
                                    border: "1px solid var(--border)",
                                    color: "#fff",
                                    fontFamily: "monospace",
                                    fontSize: "0.85rem",
                                  }}
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                                  Délai Initial (s) :
                                </label>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={retryInitialDelay}
                                  onChange={(e) => setRetryInitialDelay(Number(e.target.value))}
                                  style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    background: "rgba(0,0,0,0.4)",
                                    border: "1px solid var(--border)",
                                    color: "#fff",
                                    fontFamily: "monospace",
                                    fontSize: "0.85rem",
                                  }}
                                />
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "20px" }}>
                                <input
                                  type="checkbox"
                                  id="retry_jitter_chk"
                                  checked={retryJitter}
                                  onChange={(e) => setRetryJitter(e.target.checked)}
                                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                />
                                <label htmlFor="retry_jitter_chk" style={{ fontSize: "0.85rem", color: "#fff", cursor: "pointer" }}>
                                  🎲 Jitter Aléatoire (Tenacity)
                                </label>
                              </div>
                            </div>

                            {/* Demo Results Viewer */}
                            {retryResult && (
                              <div style={{ marginTop: "16px", background: "rgba(9, 5, 20, 0.8)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                                <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "rgba(0,0,0,0.3)" }}>
                                  <button
                                    onClick={() => setRetryTab("visual")}
                                    style={{
                                      padding: "10px 18px",
                                      background: retryTab === "visual" ? "rgba(239, 68, 68, 0.2)" : "transparent",
                                      border: "none",
                                      borderBottom: retryTab === "visual" ? "2px solid #ef4444" : "none",
                                      color: retryTab === "visual" ? "#fff" : "var(--text-muted)",
                                      fontWeight: 600,
                                      fontSize: "0.85rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    📊 Rendered Timeline & Resilience
                                  </button>
                                  <button
                                    onClick={() => setRetryTab("json")}
                                    style={{
                                      padding: "10px 18px",
                                      background: retryTab === "json" ? "rgba(239, 68, 68, 0.2)" : "transparent",
                                      border: "none",
                                      borderBottom: retryTab === "json" ? "2px solid #ef4444" : "none",
                                      color: retryTab === "json" ? "#fff" : "var(--text-muted)",
                                      fontWeight: 600,
                                      fontSize: "0.85rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    💻 Raw JSON (Pydantic V2)
                                  </button>
                                </div>

                                <div style={{ padding: "20px" }}>
                                  {retryTab === "visual" && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                      {/* Status Banner */}
                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          padding: "14px 18px",
                                          borderRadius: "10px",
                                          background: retryResult.is_success ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                          border: retryResult.is_success ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                                        }}
                                      >
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                          <span
                                            style={{
                                              padding: "6px 14px",
                                              borderRadius: "20px",
                                              background: retryResult.is_success ? "#10b981" : "#ef4444",
                                              color: "#fff",
                                              fontWeight: 900,
                                              fontSize: "0.85rem",
                                            }}
                                          >
                                            {retryResult.is_success ? "✅ SUCCESS RECOVERED" : "❌ OUTAGE FAILED"}
                                          </span>
                                          <span style={{ fontSize: "0.85rem", color: "#fff" }}>
                                            {retryResult.is_success
                                              ? `Requête aboutie avec succès à la tentative #${retryResult.attempts_count} (Attente totale backoff: ${retryResult.total_backoff_seconds}s).`
                                              : `Échec définitif après ${retryResult.attempts_count} tentatives max (Exit Code CLI: 1).`}
                                          </span>
                                        </div>
                                        <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-muted)" }}>
                                          Tenacity Policy: @retry(stop=4, wait=exponential)
                                        </span>
                                      </div>

                                      {/* Attempts Log Stepper */}
                                      <div>
                                        <h5 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f59e0b", marginBottom: "10px" }}>
                                          Chronologie des Tentatives de Réessai (Retry Stepper) :
                                        </h5>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                          {retryResult.attempts_log?.map((log: any) => (
                                            <div
                                              key={log.attempt}
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "10px 14px",
                                                borderRadius: "8px",
                                                background: log.status === "success"
                                                  ? "rgba(16, 185, 129, 0.1)"
                                                  : log.status === "fatal_error"
                                                  ? "rgba(239, 68, 68, 0.15)"
                                                  : "rgba(245, 158, 11, 0.1)",
                                                border: "1px solid " + (log.status === "success" ? "rgba(16, 185, 129, 0.3)" : log.status === "fatal_error" ? "rgba(239, 68, 68, 0.3)" : "rgba(245, 158, 11, 0.3)"),
                                              }}
                                            >
                                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <span style={{ fontWeight: 800, fontSize: "0.85rem", color: log.status === "success" ? "#34d399" : log.status === "fatal_error" ? "#f87171" : "#fbbf24" }}>
                                                  Tentative #{log.attempt}
                                                </span>
                                                <span style={{ fontSize: "0.8rem", color: "#d1d5db" }}>
                                                  {log.error_message || "HTTP 200 OK — Réponse valide reçue."}
                                                </span>
                                              </div>
                                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-muted)" }}>
                                                  {log.backoff_strategy}
                                                </span>
                                                {log.sleep_seconds > 0 && (
                                                  <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.2)", color: "#fbbf24" }}>
                                                    ⏱️ Pause {log.sleep_seconds}s
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Report view if success */}
                                      {retryResult.report && (
                                        <>
                                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <h4 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>
                                              {retryResult.report.title}
                                            </h4>
                                            <span
                                              style={{
                                                padding: "4px 12px",
                                                borderRadius: "20px",
                                                background: "rgba(239, 68, 68, 0.2)",
                                                color: "#f87171",
                                                fontWeight: 800,
                                                fontSize: "0.75rem",
                                                textTransform: "uppercase",
                                              }}
                                            >
                                              Priorité : {retryResult.report.priority}
                                            </span>
                                          </div>

                                          <div style={{ fontSize: "0.9rem", color: "#d1d5db", lineHeight: 1.6, background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px" }}>
                                            <strong>Executive Summary :</strong> {retryResult.report.summary}
                                          </div>

                                          <div>
                                            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f87171", marginBottom: "6px" }}>
                                              Points Clés Résilience Réseau :
                                            </div>
                                            <ul style={{ paddingLeft: "20px", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                                              {retryResult.report.key_points?.map((kp: string, idx: number) => (
                                                <li key={idx}>{kp}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        </>
                                      )}

                                      {/* Telemetry Bar */}
                                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", padding: "12px", background: "rgba(239, 68, 68, 0.08)", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Statut Execution</span>
                                          <strong style={{ color: retryResult.is_success ? "#34d399" : "#f87171" }}>
                                            {retryResult.is_success ? "RECOVERED" : "FAILED (Code 1)"}
                                          </strong>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Tentatives Effectuées</span>
                                          <strong style={{ color: "#fbbf24" }}>{retryResult.attempts_count} / {retryResult.max_retries}</strong>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Attente Backoff Totale</span>
                                          <strong style={{ color: "#f59e0b" }}>{retryResult.total_backoff_seconds}s</strong>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Coût Estimation FinOps</span>
                                          <strong style={{ color: "#34d399" }}>${retryResult.telemetry?.estimated_cost_usd || 0}</strong>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Pydantic V2 Validé</span>
                                          <strong style={{ color: retryResult.telemetry?.pydantic_validated ? "#34d399" : "#f87171" }}>
                                            {retryResult.telemetry?.pydantic_validated ? "True" : "False"}
                                          </strong>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {retryTab === "json" && (
                                    <pre style={{ fontSize: "0.8rem", color: "#f87171", fontFamily: "monospace", overflowX: "auto" }}>
                                      {JSON.stringify(retryResult, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* PHASE 9 PLAYGROUND - AUTOMATED TESTING SUITE */}
                        {currentPhase.id === 9 && (
                          <div style={{ padding: "24px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                              <div>
                                <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                                  🧪 Demo Live : Suite de Tests & Couverture (Phase 9)
                                </h4>
                                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                  Lancez la suite de tests unitaires et d&apos;intégration en direct et analysez les métriques Pydantic V2 / FinOps.
                                </p>
                              </div>
                              <button
                                onClick={() => handleRunTestsDemo()}
                                disabled={testsLoading}
                                style={{
                                  padding: "10px 20px",
                                  borderRadius: "8px",
                                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                  color: "#fff",
                                  fontWeight: 700,
                                  fontSize: "0.9rem",
                                  border: "none",
                                  cursor: "pointer",
                                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                {testsLoading ? <Loader2 size={16} className="spin" /> : <Play size={16} />}
                                {testsLoading ? "Exécution..." : "⚡ Lancer les Tests"}
                              </button>
                            </div>

                            {/* Scenarios & Presets */}
                            <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", alignSelf: "center" }}>Scénarios Pré-remplis :</span>
                              <button
                                onClick={() => {
                                  setTestsCommandPreset("all");
                                  handleRunTestsDemo("all");
                                }}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  background: testsCommandPreset === "all" ? "rgba(16, 185, 129, 0.3)" : "rgba(255,255,255,0.05)",
                                  border: "1px solid " + (testsCommandPreset === "all" ? "#10b981" : "var(--border)"),
                                  color: "#fff",
                                  fontSize: "0.75rem",
                                  cursor: "pointer",
                                }}
                              >
                                🚀 Suite Complète (All)
                              </button>
                              <button
                                onClick={() => {
                                  setTestsCommandPreset("tests/test_llm_client.py");
                                  handleRunTestsDemo("tests/test_llm_client.py");
                                }}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  background: testsCommandPreset === "tests/test_llm_client.py" ? "rgba(59, 130, 246, 0.3)" : "rgba(255,255,255,0.05)",
                                  border: "1px solid " + (testsCommandPreset === "tests/test_llm_client.py" ? "#3b82f6" : "var(--border)"),
                                  color: "#fff",
                                  fontSize: "0.75rem",
                                  cursor: "pointer",
                                }}
                              >
                                🧠 Client LLM
                              </button>
                              <button
                                onClick={() => {
                                  setTestsCommandPreset("tests/test_graceful_failure.py");
                                  handleRunTestsDemo("tests/test_graceful_failure.py");
                                }}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  background: testsCommandPreset === "tests/test_graceful_failure.py" ? "rgba(245, 158, 11, 0.3)" : "rgba(255,255,255,0.05)",
                                  border: "1px solid " + (testsCommandPreset === "tests/test_graceful_failure.py" ? "#f59e0b" : "var(--border)"),
                                  color: "#fff",
                                  fontSize: "0.75rem",
                                  cursor: "pointer",
                                }}
                              >
                                🛡️ Résilience Réseau
                              </button>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", width: "140px" }}>
                                  Test Ciblé (Fichier/Fonction)
                                </label>
                                <input
                                  type="text"
                                  value={testsCommandPreset}
                                  onChange={(e) => setTestsCommandPreset(e.target.value)}
                                  placeholder="ex: tests/test_extractor.py"
                                  style={{
                                    flex: 1,
                                    padding: "8px 12px",
                                    borderRadius: "6px",
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid var(--border)",
                                    color: "#fff",
                                    fontSize: "0.85rem",
                                  }}
                                />
                              </div>
                            </div>

                            {/* Demo Results Viewer */}
                            {testsResult && (
                              <div style={{ marginTop: "16px", background: "rgba(9, 5, 20, 0.8)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                                <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "rgba(0,0,0,0.3)" }}>
                                  <button
                                    onClick={() => setTestsTab("visual")}
                                    style={{
                                      padding: "10px 18px",
                                      background: testsTab === "visual" ? "rgba(16, 185, 129, 0.2)" : "transparent",
                                      border: "none",
                                      borderBottom: testsTab === "visual" ? "2px solid #10b981" : "none",
                                      color: testsTab === "visual" ? "#fff" : "var(--text-muted)",
                                      fontWeight: 600,
                                      fontSize: "0.85rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    📊 Rendered Results & Logs
                                  </button>
                                  <button
                                    onClick={() => setTestsTab("json")}
                                    style={{
                                      padding: "10px 18px",
                                      background: testsTab === "json" ? "rgba(16, 185, 129, 0.2)" : "transparent",
                                      border: "none",
                                      borderBottom: testsTab === "json" ? "2px solid #10b981" : "none",
                                      color: testsTab === "json" ? "#fff" : "var(--text-muted)",
                                      fontWeight: 600,
                                      fontSize: "0.85rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    💻 Raw JSON (Pydantic V2)
                                  </button>
                                </div>

                                <div style={{ padding: "20px" }}>
                                  {testsTab === "visual" && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                      {/* Status Banner */}
                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          padding: "14px 18px",
                                          borderRadius: "10px",
                                          background: testsResult.status === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                          border: testsResult.status === "success" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                                        }}
                                      >
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                          <span
                                            style={{
                                              padding: "6px 14px",
                                              borderRadius: "20px",
                                              background: testsResult.status === "success" ? "#10b981" : "#ef4444",
                                              color: "#fff",
                                              fontWeight: 900,
                                              fontSize: "0.85rem",
                                            }}
                                          >
                                            {testsResult.status === "success" ? "✅ PASSED" : "❌ FAILED"}
                                          </span>
                                          <span style={{ fontSize: "0.85rem", color: "#fff" }}>
                                            {testsResult.message || `Code de retour: ${testsResult.exit_code}`}
                                          </span>
                                        </div>
                                        <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-muted)" }}>
                                          Pytest Coverage
                                        </span>
                                      </div>

                                      {/* Terminal Output */}
                                      <div>
                                        <h5 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#10b981", marginBottom: "10px" }}>
                                          Console Output (Stdout/Stderr) :
                                        </h5>
                                        <pre style={{
                                          background: "#000",
                                          padding: "12px",
                                          borderRadius: "8px",
                                          color: "#d1d5db",
                                          fontSize: "0.75rem",
                                          overflowX: "auto",
                                          maxHeight: "300px",
                                          overflowY: "auto",
                                          border: "1px solid #333"
                                        }}>
                                          {testsResult.stdout || testsResult.stderr || "No output generated."}
                                          {testsResult.stderr && testsResult.stdout && "\n\n--- STDERR ---\n" + testsResult.stderr}
                                        </pre>
                                      </div>

                                      {/* Telemetry Bar */}
                                      {testsResult.metadata && (
                                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", padding: "12px", background: "rgba(16, 185, 129, 0.08)", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Temps d'exécution (Latency)</span>
                                          <strong style={{ color: "#34d399" }}>{testsResult.metadata.latency_ms}ms</strong>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Tokens FinOps Simulés</span>
                                          <strong style={{ color: "#fbbf24" }}>{testsResult.metadata.tokens_used}</strong>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Coût Estimation FinOps</span>
                                          <strong style={{ color: "#f59e0b" }}>${testsResult.metadata.cost_usd}</strong>
                                        </div>
                                        <div>
                                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Structure Pydantic V2</span>
                                          <strong style={{ color: "#3b82f6" }}>Validé</strong>
                                        </div>
                                      </div>
                                      )}
                                    </div>
                                  )}

                                  {testsTab === "json" && (
                                    <pre style={{ fontSize: "0.8rem", color: "#10b981", fontFamily: "monospace", overflowX: "auto", maxHeight: "400px", overflowY: "auto" }}>
                                      {JSON.stringify(testsResult, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* GLOSSARY TAB */}
          {activeTab === "glossary" && (
            <div className="interview-grid">
              <div className="question-list-panel">
                <input
                  type="text"
                  placeholder={lang === "en" ? "Search concepts..." : "Rechercher un concept..."}
                  value={conceptSearch}
                  onChange={(e) => setConceptSearch(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "rgba(0,0,0,0.3)",
                    color: "var(--text-main)",
                    fontFamily: "var(--font-inter)",
                    fontSize: "0.95rem",
                    marginBottom: "6px",
                  }}
                />
                {filteredConcepts.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedConceptId(item.id)}
                    className={`question-item ${selectedConceptId === item.id ? "active" : ""}`}
                  >
                    {item.concept}
                  </button>
                ))}
              </div>
              <div className="workspace-panel">
                {selectedConceptId !== null && (
                  <>
                    <div className="question-title">
                      {concepts.find((c) => c.id === selectedConceptId)?.concept}
                    </div>
                    <div className="results-box">
                      <div className="results-header">Définition &amp; Contexte</div>
                      <div
                        className="markdown-body"
                        dangerouslySetInnerHTML={{ __html: conceptHtml }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* JOURNAL TAB */}
          {activeTab === "journal" && (
            <div className="interview-grid">
              <div className="question-list-panel">
                {journalEntries.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedJournalId(item.id)}
                    className={`question-item ${selectedJournalId === item.id ? "active" : ""}`}
                    style={{ display: "flex", flexDirection: "column", gap: "4px" }}
                  >
                    <div style={{ fontWeight: 600, color: "#ffffff" }}>{item.title}</div>
                  </button>
                ))}
              </div>
              <div className="workspace-panel">
                <div
                  className="markdown-body"
                  style={{ animation: "fadeIn 0.3s ease-out" }}
                  dangerouslySetInnerHTML={{ __html: journalHtml }}
                />
              </div>
            </div>
          )}

          {/* FAQ INTERVIEW TAB */}
          {activeTab === "entretien" && (
            <div className="interview-grid">
              <div className="question-list-panel">
                {questions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQuestionId(q.id)}
                    className={`question-item ${selectedQuestionId === q.id ? "active" : ""}`}
                  >
                    Q{q.id + 1}. {q.question}
                  </button>
                ))}
              </div>
              <div className="workspace-panel">
                {loadingAnswer ? (
                  <div className="spinner" />
                ) : (
                  selectedQuestionId !== null && (
                    <>
                      <div className="question-title">
                        {questions.find((q) => q.id === selectedQuestionId)?.question}
                      </div>
                      <div className="results-box">
                        <div className="results-header">Explications Techniques &amp; Architecture</div>
                        <div
                          className="markdown-body"
                          dangerouslySetInnerHTML={{ __html: answerHtml }}
                        />
                      </div>
                    </>
                  )
                )}
              </div>
            </div>
          )}

          {/* TEST LAUNCHER TAB */}
          {activeTab === "tests" && (
            <div className="test-launcher-panel">
              <div className="test-controls">
                <div>
                  <h3 style={{ fontFamily: "var(--font-outfit)", fontSize: "1.25rem", fontWeight: 600, color: "#ffffff" }}>
                    {lang === "en" ? "Live QA Test Launcher" : "Lanceur de Tests Live (QA)"}
                  </h3>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    {lang === "en"
                      ? "Execute global pytest suite or target a specific test function."
                      : "Exécutez la suite globale ou ciblez précisément une fonction de test."}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <select
                    value={selectedTestId}
                    onChange={(e) => setSelectedTestId(e.target.value)}
                    className="test-select"
                  >
                    {testList.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleRunTest}
                    disabled={runningTest}
                    className="btn"
                  >
                    {runningTest ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>{lang === "en" ? "Running..." : "Exécution..."}</span>
                      </>
                    ) : (
                      <>
                        <Play size={16} />
                        <span>{lang === "en" ? "Run Tests" : "Lancer les Tests"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Rich Test Explanation Box */}
              <div
                style={{
                  background: "rgba(15, 23, 42, 0.45)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "18px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px" }}>
                  <h4 style={{ margin: 0, fontFamily: "var(--font-outfit)", color: "var(--secondary)", fontSize: "1.05rem", fontWeight: 600 }}>
                    📌 {currentTestInfo.title}
                  </h4>
                  <span style={{ fontSize: "0.75rem", background: "rgba(139, 92, 246, 0.15)", color: "var(--secondary)", padding: "3px 8px", borderRadius: "4px", fontWeight: 600, border: "1px solid rgba(139, 92, 246, 0.2)" }}>
                    {currentTestInfo.concept}
                  </span>
                </div>
                <p style={{ fontSize: "0.92rem", color: "#f8fafc", margin: 0, lineHeight: 1.55 }}>
                  <strong>Description &amp; Scénario :</strong> {currentTestInfo.objective}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "4px" }}>
                  <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", padding: "12px" }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: "bold", color: "#cbd5e1", marginBottom: "4px" }}>
                      📥 Entrée attendue (INPUT) :
                    </div>
                    <div style={{ fontSize: "0.88rem", fontFamily: "var(--font-fira)", color: "#a5f3fc" }}>
                      {currentTestInfo.input}
                    </div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", padding: "12px" }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: "bold", color: "#cbd5e1", marginBottom: "4px" }}>
                      📤 Sortie attendue (OUTPUT) :
                    </div>
                    <div style={{ fontSize: "0.88rem", fontFamily: "var(--font-fira)", color: "#86efac" }}>
                      {currentTestInfo.output}
                    </div>
                  </div>
                </div>
              </div>

              {/* Terminal Window */}
              <div className="terminal">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <div className="terminal-dot" style={{ background: "var(--danger)" }} />
                    <div className="terminal-dot" style={{ background: "var(--warning)" }} />
                    <div className="terminal-dot" style={{ background: "var(--success)" }} />
                  </div>
                  <div className="terminal-title">bash - pytest qa_runner</div>
                </div>
                <div className="terminal-body">
                  {testResult ? (
                    <div>
                      <div style={{ color: testResult.status === "success" ? "#34d399" : "#f87171", fontWeight: "bold", marginBottom: "8px" }}>
                        {testResult.status === "success"
                          ? `[PASS] ${testResult.message}`
                          : `[FAIL] ${testResult.message}`}
                      </div>
                      <div>{testResult.stdout || testResult.stderr}</div>
                    </div>
                  ) : (
                    <div>user@wrapper-cli:~$ pytest {selectedTestId}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* DOCS API TAB */}
          {activeTab === "docs_api" && (
            <div className="api-docs-panel">
              <div style={{ background: "rgba(139, 92, 246, 0.1)", padding: "24px", borderRadius: "50%", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
                <TerminalIcon size={48} style={{ color: "var(--secondary)" }} />
              </div>
              <div>
                <h2 style={{ fontFamily: "var(--font-outfit)", fontSize: "1.75rem", fontWeight: 700 }}>
                  {lang === "en"
                    ? "Wrapper_CLI Architecture & Execution Interface"
                    : "Interface d'exécution & Architecture Wrapper_CLI"}
                </h2>
                <p style={{ maxWidth: "600px", margin: "12px auto", color: "var(--text-muted)", fontSize: "1rem" }}>
                  {lang === "en"
                    ? "Wrapper_CLI (AI_Watcher) is a Typer command-line tool for automated content analysis and source detection."
                    : "Wrapper_CLI (AI_Watcher) est un outil en ligne de commande basé sur Typer pour la détection automatique de sources et l'analyse IA."}
                </p>
              </div>
              <a
                href="https://github.com/mdaadoun/AIPE_Framework"
                target="_blank"
                rel="noreferrer"
                className="btn btn-reveal"
              >
                <ExternalLink size={18} />
                <span>{lang === "en" ? "View Blueprint Repository" : "Voir le Dépôt du Blueprint"}</span>
              </a>
            </div>
          )}

          {/* CODE BROWSER TAB */}
          {activeTab === "code" && (
            <div className="interview-grid">
              <div className="question-list-panel">
                <h4 style={{ fontFamily: "var(--font-outfit)", fontSize: "1rem", fontWeight: "bold", color: "#ffffff", marginBottom: "8px", borderBottom: "1px solid var(--border)", paddingBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Folder size={16} /> Fichiers sources
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {treeNodes.map((node) => renderTreeNode(node, 0))}
                </div>
              </div>

              <div className="workspace-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "12px", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                      onClick={() =>
                        setSelectedFilePath(lang === "fr" ? "docs/code_fr.md" : "docs/code_en.md")
                      }
                      style={{
                        background: isIntroSelected
                          ? "rgba(139, 92, 246, 0.25)"
                          : "rgba(255, 255, 255, 0.04)",
                        border: isIntroSelected
                          ? "1px solid rgba(139, 92, 246, 0.5)"
                          : "1px solid rgba(255, 255, 255, 0.1)",
                        color: isIntroSelected ? "#ffffff" : "var(--text-muted)",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "var(--transition)",
                      }}
                    >
                      📖 Intro (code.md)
                    </button>
                    <span style={{ fontFamily: "var(--font-fira)", color: "var(--secondary)", fontSize: "0.95rem", fontWeight: 600 }}>
                      {selectedFilePath}
                    </span>
                  </div>

                  <span style={{ fontSize: "0.75rem", background: "rgba(139, 92, 246, 0.15)", color: "var(--secondary)", padding: "3px 10px", borderRadius: "4px", fontFamily: "var(--font-fira)", fontWeight: "bold" }}>
                    {codeLang.toUpperCase()}
                  </span>
                </div>

                {/* View Panel */}
                {selectedFilePath.endsWith(".md") ? (
                  <div
                    className="markdown-body"
                    style={{
                      background: "rgba(10, 15, 30, 0.75)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "24px",
                      minHeight: "450px",
                    }}
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(codeContent) }}
                  />
                ) : (
                  <div
                    className="terminal"
                    style={{ minHeight: "450px", background: "#1d1f21", padding: "16px" }}
                  >
                    <pre style={{ margin: 0, overflowX: "auto" }}>
                      <code className={`language-${codeLang}`}>{codeContent}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer>
        © 2026 Wrapper_CLI (AI_Watcher) — Conçu avec le standard AIPE_Framework
      </footer>
    </div>
  );
}
