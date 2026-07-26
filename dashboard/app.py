# Interactive Flask Dashboard application for Wrapper_CLI.

import ast
import html
import os
import re
import subprocess
import sys
from pathlib import Path

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Path configuration
DASHBOARD_DIR = Path(__file__).resolve().parent
PROJECT_DIR = DASHBOARD_DIR.parent
DOCS_DIR = PROJECT_DIR / "docs"
FASTAPI_URL = os.getenv("FASTAPI_URL", "http://127.0.0.1:8000")


def markdown_to_html(md_text: str) -> str:
    """Converts Markdown text into styled HTML."""
    if not md_text:
        return ""

    lines = md_text.split("\n")
    html_lines = []
    in_list = False
    in_quote = False
    in_code_block = False
    code_lines = []
    code_lang = ""

    for line in lines:
        line_raw = line
        line_str = line.strip()

        if line_str.startswith("```"):
            if in_code_block:
                code_text = html.escape("\n".join(code_lines))
                lang_badge = (
                    f"<div style='font-size: 0.68rem; font-family: monospace; color: var(--secondary); background: rgba(139, 92, 246, 0.15); padding: 2px 10px; border-radius: 4px 4px 0 0; display: inline-block; font-weight: bold; border: 1px solid rgba(139, 92, 246, 0.2); border-bottom: none;'>{code_lang}</div>"
                    if code_lang
                    else ""
                )
                border_radius = "0 6px 6px 6px" if code_lang else "6px"

                html_lines.append(
                    f"<div style='margin: 14px 0;'>"
                    f"{lang_badge}"
                    f"<pre style='background: rgba(10, 15, 30, 0.75); border: 1px solid rgba(255,255,255,0.1); padding: 12px 14px; border-radius: {border_radius}; overflow-x: auto; color: #d8b4fe; font-family: monospace; font-size: 0.8rem; margin: 0; line-height: 1.45;'><code>{code_text}</code></pre>"
                    f"</div>"
                )
                in_code_block = False
                code_lines = []
                code_lang = ""
            else:
                if in_list:
                    html_lines.append("</ul>")
                    in_list = False
                if in_quote:
                    html_lines.append("</blockquote>")
                    in_quote = False
                in_code_block = True
                code_lang = line_str[3:].strip()
                code_lines = []
            continue

        if in_code_block:
            code_lines.append(line_raw)
            continue

        if line_str in ("---", "***", "___"):
            if in_list:
                html_lines.append("</ul>")
                in_list = False
            if in_quote:
                html_lines.append("</blockquote>")
                in_quote = False
            html_lines.append(
                "<hr style='border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 18px 0;'>"
            )
            continue

        if line_str.startswith("#### "):
            if in_list:
                html_lines.append("</ul>")
                in_list = False
            if in_quote:
                html_lines.append("</blockquote>")
                in_quote = False
            html_lines.append(
                f"<h4 style='color: var(--secondary); margin-top: 14px; margin-bottom: 6px; font-family: var(--font-outfit); font-size: 0.95rem; font-weight: 600;'>{html.escape(line_str[5:])}</h4>"
            )
            continue
        elif line_str.startswith("### "):
            if in_list:
                html_lines.append("</ul>")
                in_list = False
            if in_quote:
                html_lines.append("</blockquote>")
                in_quote = False
            html_lines.append(
                f"<h3 style='color: #ffffff; margin-top: 20px; margin-bottom: 10px; font-family: var(--font-outfit); font-size: 1.15rem; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 4px;'>{html.escape(line_str[4:])}</h3>"
            )
            continue
        elif line_str.startswith("## "):
            if in_list:
                html_lines.append("</ul>")
                in_list = False
            if in_quote:
                html_lines.append("</blockquote>")
                in_quote = False
            html_lines.append(
                f"<h2 style='color: var(--secondary); margin-top: 24px; margin-bottom: 12px; font-family: var(--font-outfit); font-size: 1.35rem; font-weight: 700; border-bottom: 1px solid rgba(139, 92, 246, 0.2); padding-bottom: 6px;'>{html.escape(line_str[3:])}</h2>"
            )
            continue
        elif line_str.startswith("# "):
            if in_list:
                html_lines.append("</ul>")
                in_list = False
            if in_quote:
                html_lines.append("</blockquote>")
                in_quote = False
            html_lines.append(
                f"<h1 style='color: #ffffff; margin-top: 10px; margin-bottom: 16px; font-family: var(--font-outfit); font-size: 1.65rem; font-weight: 800;'>{html.escape(line_str[2:])}</h1>"
            )
            continue

        if line_str.startswith("> "):
            if in_list:
                html_lines.append("</ul>")
                in_list = False
            if not in_quote:
                html_lines.append(
                    "<blockquote style='border-left: 3px solid var(--secondary); margin: 12px 0; padding: 10px 14px; background: rgba(139, 92, 246, 0.08); border-radius: 0 6px 6px 0; font-style: italic; color: #e2e8f0;'>"
                )
                in_quote = True
            quote_text = html.escape(line_str[2:])
            html_lines.append(
                f"<p style='margin: 4px 0; color: #e2e8f0;'>{quote_text}</p>"
            )
            continue
        elif in_quote:
            html_lines.append("</blockquote>")
            in_quote = False

        if line_str.startswith("- ") or line_str.startswith("* "):
            if not in_list:
                html_lines.append(
                    "<ul style='padding-left: 20px; margin: 10px 0; line-height: 1.6;'>"
                )
                in_list = True
            content_start = 2
            html_lines.append(
                f"<li style='margin-bottom: 6px; color: #cbd5e1;'>{html.escape(line_str[content_start:])}</li>"
            )
            continue
        elif in_list:
            html_lines.append("</ul>")
            in_list = False

        if line_str:
            html_lines.append(
                f"<p style='margin: 8px 0; line-height: 1.5; color: #f8fafc;'>{html.escape(line_str)}</p>"
            )
        else:
            if not in_list and not in_quote:
                html_lines.append("<div style='height: 8px;'></div>")

    if in_list:
        html_lines.append("</ul>")
    if in_quote:
        html_lines.append("</blockquote>")
    if in_code_block:
        code_text = html.escape("\n".join(code_lines))
        html_lines.append(
            f"<pre style='background: rgba(10, 15, 30, 0.75); padding: 12px; border-radius: 6px; color: #d8b4fe; font-family: monospace;'><code>{code_text}</code></pre>"
        )

    html_content = "\n".join(html_lines)

    html_content = re.sub(
        r"\*\*(.*?)\*\*", r'<strong style="color: #ffffff;">\1</strong>', html_content
    )
    html_content = re.sub(
        r"`(.*?)`",
        r'<code style="background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px; color: #d8b4fe; font-family: monospace;">\1</code>',
        html_content,
    )
    html_content = re.sub(
        r"\[(.*?)\]\((.*?)\)",
        r'<a href="\2" style="color: var(--secondary); text-decoration: none; border-bottom: 1px dashed var(--secondary);" target="_blank">\1</a>',
        html_content,
    )

    return html_content


ALIASES = {
    "roadmap_details": "roadmap",
    "faq_entretien": "questions",
    "glossaire": "glossary",
    "journal_apprentissage": "journal",
    "cahier_charges": "specifications",
}


def get_doc_file(base_name: str, lang: str = "en") -> Path:
    """Resolves documentation path according to selected language (_en.md or _fr.md)."""
    resolved_name = ALIASES.get(base_name, base_name)
    suffix = "_en" if lang == "en" else "_fr"
    target_path = DOCS_DIR / f"{resolved_name}{suffix}.md"
    if target_path.exists():
        return target_path

    fallback_suffix = "_fr" if lang == "en" else "_en"
    fallback_path = DOCS_DIR / f"{resolved_name}{fallback_suffix}.md"
    if fallback_path.exists():
        return fallback_path

    return DOCS_DIR / f"{resolved_name}.md"


def parse_faq_questions(lang: str = "en"):
    """Parse questions_en.md (or _fr.md) and extract questions & answers list."""
    faq_file = get_doc_file("questions", lang)
    if not faq_file.exists():
        return []

    content = faq_file.read_text(encoding="utf-8")
    questions = []

    parts = re.split(r"### Q\d+\.\s*", content)
    for part in parts[1:]:
        lines = part.strip().split("\n")
        if not lines:
            continue
        title = lines[0].strip()
        body = "\n".join(lines[1:]).strip()
        questions.append(
            {
                "question": title,
                "answer_markdown": body,
                "answer_html": markdown_to_html(body),
            }
        )
    return questions


@app.route("/")
def index():
    """Renders SPA UI."""
    return render_template("index.html")


@app.route("/api/presentation", methods=["GET"])
def get_presentation():
    """Returns presentation HTML content in requested language (lang=en|fr)."""
    lang = request.args.get("lang", "en")
    presentation_file = get_doc_file("presentation", lang)
    if not presentation_file.exists():
        return jsonify(
            {
                "status": "error",
                "message": f"File {presentation_file.name} not found",
            }
        ), 404

    try:
        content = presentation_file.read_text(encoding="utf-8")
        html_content = markdown_to_html(content)
        return jsonify({"status": "success", "html": html_content}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def parse_roadmap_to_html(lang: str = "en") -> str:
    """Parses roadmap_en.md (or _fr.md) and converts to UI grid."""
    roadmap_file = get_doc_file("roadmap", lang)
    if not roadmap_file.exists():
        return "<div style='color: var(--danger); padding: 20px;'>Roadmap file not found.</div>"

    try:
        content = roadmap_file.read_text(encoding="utf-8")
    except Exception as e:
        return f"<div style='color: var(--danger); padding: 20px;'>Read error: {html.escape(str(e))}</div>"

    def clean_text(txt):
        txt = html.escape(txt.strip())
        txt = re.sub(
            r"\*\*(.*?)\*\*", r'<strong style="color: #ffffff;">\1</strong>', txt
        )
        txt = re.sub(
            r"`(.*?)`",
            r'<code style="background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px; color: #d8b4fe; font-family: monospace;">\1</code>',
            txt,
        )
        txt = re.sub(
            r"\[(.*?)\]\((.*?)\)",
            r'<a href="\2" style="color: var(--secondary); text-decoration: none; border-bottom: 1px dashed var(--secondary);" target="_blank">\1</a>',
            txt,
        )
        return txt

    html_out = []
    html_out.append('<div class="roadmap-container">')
    html_out.append('  <div class="roadmap-header-section">')
    html_out.append('    <h2 class="roadmap-main-title">🗺️ Roadmap & Tracking</h2>')
    html_out.append(
        '    <p class="roadmap-main-subtitle">Chronological tracking of AIPE_Framework construction</p>'
    )
    html_out.append("  </div>")

    lines = content.split("\n")

    in_steps_grid = False
    in_phase = False
    in_pre_block = False
    pre_lines = []

    current_step_lines = []

    def flush_step():
        if not current_step_lines:
            return ""

        step_header_line = current_step_lines[0]
        parts = step_header_line.split("—")
        title_part = parts[0].replace("###", "").strip()
        status_part = parts[1].strip() if len(parts) > 1 else "🔲 Pending"

        title_subparts = title_part.split(":")
        step_num = title_subparts[0].strip()
        step_title = (
            ":".join(title_subparts[1:]).strip()
            if len(title_subparts) > 1
            else title_part
        )

        status_class = "pending"
        badge_text = "Pending"
        badge_class = "badge-pending"

        if "✅" in status_part or "Validé" in status_part or "Completed" in status_part:
            status_class = "completed"
            badge_text = "Completed" if lang == "en" else "Validé"
            badge_class = "badge-completed"
        elif (
            "En cours" in status_part
            or "In Progress" in status_part
            or "⏳" in status_part
        ):
            status_class = "active"
            badge_text = "In Progress" if lang == "en" else "En cours"
            badge_class = "badge-active"

        step_html = []
        step_html.append(f'<div class="step-card {status_class}">')
        step_html.append('  <div class="step-header">')
        step_html.append(f'    <span class="step-number">{step_num}</span>')
        step_html.append(
            f'    <span class="step-badge {badge_class}">{badge_text}</span>'
        )
        step_html.append("  </div>")
        step_html.append(f'  <h4 class="step-title">{step_title}</h4>')
        step_html.append('  <div class="step-details">')

        for line in current_step_lines[1:]:
            line_str = line.strip()
            if not line_str:
                continue
            if line_str.startswith("* ") or line_str.startswith("- "):
                line_str = line_str[2:].strip()

            if line_str.startswith("**Description :**") or line_str.startswith(
                "**Description:**"
            ):
                desc_text = (
                    line_str.replace("**Description :**", "")
                    .replace("**Description:**", "")
                    .strip()
                )
                label = "Description:" if lang == "en" else "Description :"
                step_html.append(
                    f'    <div class="detail-item"><strong>{label}</strong> {clean_text(desc_text)}</div>'
                )
            elif (
                line_str.startswith("**Concept clé :**")
                or line_str.startswith("**Concept clé:**")
                or line_str.startswith("**Concept clef :**")
                or line_str.startswith("**Key Concept:**")
                or line_str.startswith("**Key Concept :**")
            ):
                concept_text = (
                    line_str.replace("**Concept clé :**", "")
                    .replace("**Concept clé:**", "")
                    .replace("**Concept clef :**", "")
                    .replace("**Key Concept:**", "")
                    .replace("**Key Concept :**", "")
                    .strip()
                )
                label = "Key Concept:" if lang == "en" else "Concept clé :"
                step_html.append(
                    f'    <div class="detail-item"><strong>{label}</strong> {clean_text(concept_text)}</div>'
                )
            elif (
                line_str.startswith("**Critère de validation :**")
                or line_str.startswith("**Critère de validation:**")
                or line_str.startswith("**Validation Criterion:**")
                or line_str.startswith("**Validation Criterion :**")
            ):
                validation_text = (
                    line_str.replace("**Critère de validation :**", "")
                    .replace("**Critère de validation:**", "")
                    .replace("**Validation Criterion:**", "")
                    .replace("**Validation Criterion :**", "")
                    .strip()
                )
                label = (
                    "Validation Criterion:"
                    if lang == "en"
                    else "Critère de validation :"
                )
                step_html.append(
                    f'    <div class="detail-item validation-item"><strong>{label}</strong> {clean_text(validation_text)}</div>'
                )
            else:
                step_html.append(
                    f'    <div class="detail-item">{clean_text(line_str)}</div>'
                )

        step_html.append("  </div>")
        step_html.append("</div>")
        return "\n".join(step_html)

    for line in lines:
        line_raw = line
        line_str = line.strip()

        if line_str.startswith("```"):
            if in_pre_block:
                in_pre_block = False
                code_text = html.escape("\n".join(pre_lines))
                html_out.append(
                    f"<pre style='background: rgba(10, 15, 30, 0.75); border: 1px solid rgba(255,255,255,0.1); padding: 12px 14px; border-radius: 6px; overflow-x: auto; color: #d8b4fe; font-family: monospace; font-size: 0.8rem; margin: 14px 0; line-height: 1.45;'><code>{code_text}</code></pre>"
                )
                pre_lines = []
            else:
                in_pre_block = True
                pre_lines = []
            continue

        if in_pre_block:
            pre_lines.append(line_raw)
            continue

        if line_str.startswith("## Phase"):
            if current_step_lines:
                html_out.append(flush_step())
                current_step_lines = []
            if in_steps_grid:
                html_out.append("    </div>")
                in_steps_grid = False
            if in_phase:
                html_out.append("  </div>")

            in_phase = True

            parts = line_str.split("—")
            phase_part = parts[0].replace("##", "").strip()
            status_part = parts[1].strip() if len(parts) > 1 else "🔲 Pending"

            phase_subparts = phase_part.split(":")
            phase_idx = phase_subparts[0].strip()
            phase_title = (
                ":".join(phase_subparts[1:]).strip()
                if len(phase_subparts) > 1
                else phase_part
            )

            status_class = "pending"
            status_text = "Pending" if lang == "en" else "À venir"
            if (
                "✅" in status_part
                or "Validé" in status_part
                or "Completed" in status_part
            ):
                status_class = "completed"
                status_text = "Completed" if lang == "en" else "Validé"
            elif (
                "En cours" in status_part
                or "In Progress" in status_part
                or "⏳" in status_part
            ):
                status_class = "active"
                status_text = "In Progress" if lang == "en" else "En cours"

            html_out.append(f'  <div class="phase-section {status_class}">')
            html_out.append(f'    <div class="phase-banner {status_class}">')
            html_out.append('      <div class="phase-banner-info">')
            html_out.append(f'        <span class="phase-index">{phase_idx}</span>')
            html_out.append(f'        <h3 class="phase-title">{phase_title}</h3>')
            html_out.append("      </div>")
            html_out.append(
                f'      <span class="phase-status-badge {status_class}">{status_text}</span>'
            )
            html_out.append("    </div>")

        elif line_str.startswith("*Objectif") or line_str.startswith("*Objective"):
            obj_text = line_str.replace("*", "").strip()
            html_out.append(f'    <p class="phase-objective"><em>{obj_text}</em></p>')
            html_out.append('    <div class="steps-grid">')
            in_steps_grid = True

        elif line_str.startswith("### Étape") or line_str.startswith("### Step"):
            if current_step_lines:
                html_out.append(flush_step())
                current_step_lines = []
            current_step_lines.append(line_str)

        elif current_step_lines:
            current_step_lines.append(line)

        else:
            if not line_str:
                continue
            if line_str.startswith("# "):
                html_out.append(
                    f'<h1 style="color: #ffffff; font-size: 1.6rem; border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-bottom: 16px; font-family: var(--font-outfit);">{clean_text(line_str[2:])}</h1>'
                )
            elif line_str.startswith("## "):
                html_out.append(
                    f'<h2 style="color: var(--secondary); font-size: 1.3rem; margin-top: 24px; border-bottom: 1px solid rgba(139, 92, 246, 0.15); padding-bottom: 6px; font-family: var(--font-outfit);">{clean_text(line_str[3:])}</h2>'
                )
            else:
                html_out.append(
                    f'<p style="margin: 10px 0; color: #e2e8f0; font-size: 0.95rem;">{clean_text(line_str)}</p>'
                )

    if current_step_lines:
        html_out.append(flush_step())
    if in_steps_grid:
        html_out.append("    </div>")
    if in_phase:
        html_out.append("  </div>")

    html_out.append("</div>")
    return "\n".join(html_out)


@app.route("/api/roadmap", methods=["GET"])
def get_roadmap():
    """Returns roadmap HTML."""
    try:
        lang = request.args.get("lang", "en")
        html_content = parse_roadmap_to_html(lang)
        return jsonify({"status": "success", "html": html_content}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def parse_glossary_concepts(lang: str = "en"):
    """Parses glossary_en.md (or _fr.md) and extracts concepts."""
    glossaire_file = get_doc_file("glossary", lang)
    if not glossaire_file.exists():
        return []

    content = glossaire_file.read_text(encoding="utf-8")
    concepts = []

    parts = re.split(r"### ", content)
    for part in parts[1:]:
        lines = part.strip().split("\n")
        if not lines:
            continue
        concept_name = lines[0].strip()
        definition = "\n".join(lines[1:]).strip()
        concepts.append(
            {
                "id": len(concepts),
                "concept": concept_name,
                "definition_markdown": definition,
                "definition_html": markdown_to_html(definition),
            }
        )
    return concepts


@app.route("/api/glossaire", methods=["GET"])
def get_glossaire():
    """Returns glossary concepts list."""
    try:
        lang = request.args.get("lang", "en")
        concepts = parse_glossary_concepts(lang)
        clean_concepts = [{"id": c["id"], "concept": c["concept"]} for c in concepts]
        return jsonify({"status": "success", "concepts": clean_concepts}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/glossaire/<int:concept_id>", methods=["GET"])
def get_glossaire_concept(concept_id: int):
    """Returns definition for a specific concept."""
    try:
        lang = request.args.get("lang", "en")
        concepts = parse_glossary_concepts(lang)
        if concept_id < 0 or concept_id >= len(concepts):
            return jsonify({"status": "error", "message": "Concept not found"}), 404

        return jsonify(
            {
                "status": "success",
                "concept": concepts[concept_id]["concept"],
                "html": concepts[concept_id]["definition_html"],
            }
        ), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def parse_journal_file_info(file_path, file_id):
    """Extracts title and date from journal Markdown entry."""
    try:
        content = file_path.read_text(encoding="utf-8")
        title = None
        date = "Unknown date"

        for line in content.splitlines():
            line_str = line.strip()
            if line_str.startswith("# ") and title is None:
                raw_title = line_str[2:].strip()
                if raw_title.startswith("📌"):
                    title = raw_title[1:].strip()
                else:
                    title = raw_title
            elif "Date" in line_str and (":" in line_str or "**" in line_str):
                date_match = re.search(
                    r"\*\*Date\s*:?\s*\*\*:?\s*(.*)", line_str, re.IGNORECASE
                )
                if date_match and date_match.group(1).strip():
                    date = date_match.group(1).strip()
                else:
                    date = (
                        line_str.replace("Date :", "")
                        .replace("Date:", "")
                        .replace("**", "")
                        .strip()
                    )

        if not title:
            title = file_path.stem.replace("_", " ").capitalize()

        return {"id": file_id, "title": title, "date": date}
    except Exception:
        return {
            "id": file_id,
            "title": file_path.stem.replace("_", " ").capitalize(),
            "date": "Unknown date",
        }


@app.route("/api/journal", methods=["GET"])
def get_journal():
    """Returns journal entries list with metadata."""
    entries = []
    lang = request.args.get("lang", "en")

    journal_file = get_doc_file("journal", lang)
    if journal_file.exists():
        entries.append(parse_journal_file_info(journal_file, "intro"))

    journal_dir = DOCS_DIR / "journal"
    if journal_dir.exists() and journal_dir.is_dir():
        unique_stems = set()
        for f in journal_dir.glob("*.md"):
            if f.name == "journal_template.md":
                continue
            stem = f.stem
            if stem.endswith("_en") or stem.endswith("_fr"):
                stem = stem[:-3]
            unique_stems.add(stem)

        for base_stem in sorted(unique_stems):
            suffix = "_en" if lang == "en" else "_fr"
            target_path = journal_dir / f"{base_stem}{suffix}.md"

            if not target_path.exists():
                fallback_suffix = "_fr" if lang == "en" else "_en"
                target_path = journal_dir / f"{base_stem}{fallback_suffix}.md"

            if not target_path.exists():
                target_path = journal_dir / f"{base_stem}.md"

            if target_path.exists():
                entries.append(parse_journal_file_info(target_path, base_stem))

    return jsonify({"status": "success", "entries": entries}), 200


@app.route("/api/journal/<article_id>", methods=["GET"])
def get_journal_content(article_id: str):
    """Returns rendered HTML content of a journal entry."""
    lang = request.args.get("lang", "en")
    if article_id == "intro":
        file_path = get_doc_file("journal", lang)
    else:
        clean_id = re.sub(r"[^a-zA-Z0-9_.-]", "", article_id)
        if clean_id.endswith("_en") or clean_id.endswith("_fr"):
            clean_id = clean_id[:-3]

        suffix = "_en" if lang == "en" else "_fr"
        file_path = DOCS_DIR / "journal" / f"{clean_id}{suffix}.md"

        if not file_path.exists():
            fallback_suffix = "_fr" if lang == "en" else "_en"
            file_path = DOCS_DIR / "journal" / f"{clean_id}{fallback_suffix}.md"

        if not file_path.exists():
            file_path = DOCS_DIR / "journal" / f"{clean_id}.md"

    if not file_path.exists():
        return jsonify(
            {"status": "error", "message": f"Article '{article_id}' not found"}
        ), 404

    try:
        content = file_path.read_text(encoding="utf-8")
        html_content = markdown_to_html(content)
        return jsonify({"status": "success", "html": html_content}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/entretien", methods=["GET"])
def get_entretien_questions():
    """Returns interview simulation questions list."""
    try:
        lang = request.args.get("lang", "en")
        questions = parse_faq_questions(lang)
        clean_questions = [
            {"id": idx, "question": q["question"]} for idx, q in enumerate(questions)
        ]
        return jsonify({"status": "success", "questions": clean_questions}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/entretien/<int:question_id>", methods=["GET"])
def get_entretien_answer(question_id: int):
    """Returns answer for a specific interview question."""
    try:
        lang = request.args.get("lang", "en")
        questions = parse_faq_questions(lang)
        if question_id < 0 or question_id >= len(questions):
            return jsonify({"status": "error", "message": "Question not found"}), 404
        return jsonify(
            {
                "status": "success",
                "question": questions[question_id]["question"],
                "answer_html": questions[question_id]["answer_html"],
            }
        ), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/tests/list", methods=["GET"])
def list_tests():
    """Returns dynamic test suite hierarchy discovered via AST."""
    tests_dir = PROJECT_DIR / "tests"
    if not tests_dir.exists() or not tests_dir.is_dir():
        return jsonify({"status": "success", "tests": []}), 200

    try:
        test_list = [
            {
                "id": "all",
                "name": "🧪 Full Test Suite (pytest)",
                "file": "all",
                "docstring": "Executes full unit and integration test suite.",
                "type": "suite",
            }
        ]

        for file_path in sorted(tests_dir.glob("test_*.py")):
            rel_path = f"tests/{file_path.name}"

            try:
                tree = ast.parse(
                    file_path.read_text(encoding="utf-8"), filename=str(file_path)
                )
                file_doc = ast.get_docstring(tree) or ""
            except Exception:
                file_doc = ""

            test_list.append(
                {
                    "id": rel_path,
                    "name": f"📁 {file_path.name} (Full File)",
                    "file": rel_path,
                    "docstring": file_doc.strip()
                    or f"Executes all tests in {file_path.name}.",
                    "type": "file",
                }
            )

            try:
                for node in ast.walk(tree):
                    if isinstance(node, ast.FunctionDef) and node.name.startswith(
                        "test_"
                    ):
                        docstring = ast.get_docstring(node) or ""
                        test_id = f"{rel_path}::{node.name}"
                        test_list.append(
                            {
                                "id": test_id,
                                "name": f"   └─ {node.name}",
                                "file": rel_path,
                                "docstring": docstring.strip()
                                or "No description provided.",
                                "type": "function",
                            }
                        )
            except Exception:
                pass

        return jsonify({"status": "success", "tests": test_list}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/run-tests", methods=["POST"])
def run_tests():
    """Executes pytest suite globally or targeted at a specific test function."""
    test_name = "all"
    if request.is_json and request.json.get("test_name"):
        test_name = request.json.get("test_name")

    venv_python = PROJECT_DIR / ".venv" / "bin" / "python"
    python_exec = str(venv_python) if venv_python.exists() else sys.executable

    if test_name == "all":
        cmd = [python_exec, "-m", "pytest", "tests/"]
    else:
        clean_name = re.sub(r"[^a-zA-Z0-9_.-/:]", "", test_name)
        if not (clean_name.startswith("tests/test_") and ".py" in clean_name):
            return jsonify(
                {
                    "status": "error",
                    "message": "Invalid test file or function name.",
                }
            ), 400

        file_part = clean_name.split("::")[0]
        file_path = PROJECT_DIR / file_part
        if not file_path.exists():
            return jsonify(
                {
                    "status": "error",
                    "message": f"Test file '{file_part}' not found.",
                }
            ), 404

        cmd = [python_exec, "-m", "pytest", "--no-cov", clean_name]

    tests_dir = PROJECT_DIR / "tests"
    if not tests_dir.exists():
        return jsonify(
            {
                "status": "failed",
                "message": "Directory 'tests/' does not exist.",
                "stdout": "",
                "stderr": "Error: No tests defined.",
            }
        ), 200

    try:
        process = subprocess.run(
            cmd, cwd=str(PROJECT_DIR), capture_output=True, text=True, timeout=30
        )

        stdout = process.stdout
        stderr = process.stderr

        if process.returncode == 0:
            return jsonify(
                {
                    "status": "success",
                    "message": f"Execution successful: {test_name}",
                    "stdout": stdout,
                    "stderr": stderr,
                    "exit_code": process.returncode,
                }
            ), 200
        else:
            return jsonify(
                {
                    "status": "failed",
                    "message": f"Tests failed (exit code: {process.returncode}).",
                    "stdout": stdout,
                    "stderr": stderr,
                    "exit_code": process.returncode,
                }
            ), 200

    except subprocess.TimeoutExpired:
        return jsonify(
            {
                "status": "error",
                "message": "Test execution timed out after 30 seconds.",
            }
        ), 504
    except Exception as e:
        return jsonify(
            {
                "status": "error",
                "message": f"Error running test suite: {str(e)}",
            }
        ), 500


@app.route("/api/code/list", methods=["GET"])
def list_code_files():
    """Returns list of eligible source files for code browser."""
    allowed_roots = ["src", "tests", "scripts"]
    allowed_files = [
        "docs/code_en.md",
        "docs/code_fr.md",
        "Makefile",
        "pyproject.toml",
        ".pre-commit-config.yaml",
        ".gitignore",
        "Dockerfile",
        ".dockerignore",
        ".vscode/settings.json",
        ".vscode/extensions.json",
    ]

    files = []
    try:
        for fname in allowed_files:
            fpath = PROJECT_DIR / fname
            if fpath.exists() and fpath.is_file():
                files.append({"name": fname, "path": fname})

        for rdir in allowed_roots:
            target_dir = PROJECT_DIR / rdir
            if target_dir.exists() and target_dir.is_dir():
                for path in sorted(target_dir.rglob("*")):
                    if path.is_file():
                        if "__pycache__" in path.parts or ".pytest_cache" in path.parts:
                            continue
                        rel_path = str(path.relative_to(PROJECT_DIR))
                        files.append({"name": path.name, "path": rel_path})

        files.sort(key=lambda x: x["path"])
        return jsonify({"status": "success", "files": files}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/code/file", methods=["GET"])
def get_code_file():
    """Returns raw text content of a requested source file safely."""
    file_path = request.args.get("path", "")
    if not file_path:
        return jsonify({"status": "error", "message": "Missing file path"}), 400

    try:
        resolved_path = (PROJECT_DIR / file_path).resolve()
        project_resolved = PROJECT_DIR.resolve()

        if not str(resolved_path).startswith(str(project_resolved)):
            return jsonify({"status": "error", "message": "Access denied"}), 403

        if ".venv" in resolved_path.parts or ".git" in resolved_path.parts:
            return jsonify(
                {"status": "error", "message": "Access to system folders denied"}
            ), 403

        if not resolved_path.exists() or not resolved_path.is_file():
            return jsonify({"status": "error", "message": "File not found"}), 404

        content = resolved_path.read_text(encoding="utf-8")
        return jsonify({"status": "success", "content": content}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)
