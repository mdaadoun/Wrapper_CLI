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

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("presentation");
  const [lang, setLang] = useState<"en" | "fr">("en");

  // HTML content states
  const [presentationHtml, setPresentationHtml] = useState("");
  const [roadmapHtml, setRoadmapHtml] = useState("");

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
            <div
              className="markdown-body"
              dangerouslySetInnerHTML={{ __html: roadmapHtml }}
            />
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
