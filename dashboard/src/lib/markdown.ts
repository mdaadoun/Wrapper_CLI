/**
 * Markdown to HTML converter with custom styling matching AIPE glassmorphism design.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function markdownToHtml(mdText: string): string {
  if (!mdText) return "";

  const lines = mdText.split("\n");
  const htmlLines: string[] = [];
  let inList = false;
  let inQuote = false;
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLang = "";

  for (const line of lines) {
    const lineRaw = line;
    const lineStr = line.trim();

    if (lineStr.startsWith("```")) {
      if (inCodeBlock) {
        const codeText = escapeHtml(codeLines.join("\n"));
        const langBadge = codeLang
          ? `<div style='font-size: 0.68rem; font-family: var(--font-fira), monospace; color: var(--secondary); background: rgba(139, 92, 246, 0.15); padding: 2px 10px; border-radius: 4px 4px 0 0; display: inline-block; font-weight: bold; border: 1px solid rgba(139, 92, 246, 0.2); border-bottom: none;'>${codeLang}</div>`
          : "";
        const borderRadius = codeLang ? "0 6px 6px 6px" : "6px";

        htmlLines.push(
          `<div style='margin: 14px 0;'>${langBadge}<pre style='background: rgba(10, 15, 30, 0.75); border: 1px solid rgba(255,255,255,0.1); padding: 12px 14px; border-radius: ${borderRadius}; overflow-x: auto; color: #d8b4fe; font-family: var(--font-fira), monospace; font-size: 0.8rem; margin: 0; line-height: 1.45;'><code>${codeText}</code></pre></div>`
        );
        inCodeBlock = false;
        codeLines = [];
        codeLang = "";
      } else {
        if (inList) {
          htmlLines.push("</ul>");
          inList = false;
        }
        if (inQuote) {
          htmlLines.push("</blockquote>");
          inQuote = false;
        }
        inCodeBlock = true;
        codeLang = lineStr.slice(3).trim();
        codeLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(lineRaw);
      continue;
    }

    if (["---", "***", "___"].includes(lineStr)) {
      if (inList) {
        htmlLines.push("</ul>");
        inList = false;
      }
      if (inQuote) {
        htmlLines.push("</blockquote>");
        inQuote = false;
      }
      htmlLines.push(
        "<hr style='border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 18px 0;'>"
      );
      continue;
    }

    if (lineStr.startsWith("#### ")) {
      if (inList) {
        htmlLines.push("</ul>");
        inList = false;
      }
      if (inQuote) {
        htmlLines.push("</blockquote>");
        inQuote = false;
      }
      htmlLines.push(
        `<h4 style='color: var(--secondary); margin-top: 14px; margin-bottom: 6px; font-family: var(--font-outfit); font-size: 0.95rem; font-weight: 600;'>${escapeHtml(lineStr.slice(5))}</h4>`
      );
      continue;
    } else if (lineStr.startsWith("### ")) {
      if (inList) {
        htmlLines.push("</ul>");
        inList = false;
      }
      if (inQuote) {
        htmlLines.push("</blockquote>");
        inQuote = false;
      }
      htmlLines.push(
        `<h3 style='color: #ffffff; margin-top: 20px; margin-bottom: 10px; font-family: var(--font-outfit); font-size: 1.15rem; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 4px;'>${escapeHtml(lineStr.slice(4))}</h3>`
      );
      continue;
    } else if (lineStr.startsWith("## ")) {
      if (inList) {
        htmlLines.push("</ul>");
        inList = false;
      }
      if (inQuote) {
        htmlLines.push("</blockquote>");
        inQuote = false;
      }
      htmlLines.push(
        `<h2 style='color: var(--secondary); margin-top: 24px; margin-bottom: 12px; font-family: var(--font-outfit); font-size: 1.35rem; font-weight: 700; border-bottom: 1px solid rgba(139, 92, 246, 0.2); padding-bottom: 6px;'>${escapeHtml(lineStr.slice(3))}</h2>`
      );
      continue;
    } else if (lineStr.startsWith("# ")) {
      if (inList) {
        htmlLines.push("</ul>");
        inList = false;
      }
      if (inQuote) {
        htmlLines.push("</blockquote>");
        inQuote = false;
      }
      htmlLines.push(
        `<h1 style='color: #ffffff; margin-top: 10px; margin-bottom: 16px; font-family: var(--font-outfit); font-size: 1.65rem; font-weight: 800;'>${escapeHtml(lineStr.slice(2))}</h1>`
      );
      continue;
    }

    if (lineStr.startsWith("> ")) {
      if (inList) {
        htmlLines.push("</ul>");
        inList = false;
      }
      if (!inQuote) {
        htmlLines.push(
          "<blockquote style='border-left: 3px solid var(--secondary); margin: 12px 0; padding: 10px 14px; background: rgba(139, 92, 246, 0.08); border-radius: 0 6px 6px 0; font-style: italic; color: #e2e8f0;'>"
        );
        inQuote = true;
      }
      htmlLines.push(
        `<p style='margin: 4px 0; color: #e2e8f0;'>${escapeHtml(lineStr.slice(2))}</p>`
      );
      continue;
    } else if (inQuote) {
      htmlLines.push("</blockquote>");
      inQuote = false;
    }

    if (lineStr.startsWith("- ") || lineStr.startsWith("* ")) {
      if (!inList) {
        htmlLines.push(
          "<ul style='padding-left: 20px; margin: 10px 0; line-height: 1.6;'>"
        );
        inList = true;
      }
      htmlLines.push(
        `<li style='margin-bottom: 6px; color: #cbd5e1;'>${escapeHtml(lineStr.slice(2))}</li>`
      );
      continue;
    } else if (inList) {
      htmlLines.push("</ul>");
      inList = false;
    }

    if (lineStr) {
      htmlLines.push(
        `<p style='margin: 8px 0; line-height: 1.5; color: #f8fafc;'>${escapeHtml(lineStr)}</p>`
      );
    } else {
      if (!inList && !inQuote) {
        htmlLines.push("<div style='height: 8px;'></div>");
      }
    }
  }

  if (inList) htmlLines.push("</ul>");
  if (inQuote) htmlLines.push("</blockquote>");
  if (inCodeBlock) {
    const codeText = escapeHtml(codeLines.join("\n"));
    htmlLines.push(
      `<pre style='background: rgba(10, 15, 30, 0.75); padding: 12px; border-radius: 6px; color: #d8b4fe; font-family: monospace;'><code>${codeText}</code></pre>`
    );
  }

  let htmlContent = htmlLines.join("\n");

  htmlContent = htmlContent.replace(
    /\*\*(.*?)\*\*/g,
    '<strong style="color: #ffffff;">$1</strong>'
  );
  htmlContent = htmlContent.replace(
    /`(.*?)`/g,
    '<code style="background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px; color: #d8b4fe; font-family: monospace;">$1</code>'
  );
  htmlContent = htmlContent.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" style="color: var(--secondary); text-decoration: none; border-bottom: 1px dashed var(--secondary);" target="_blank">$1</a>'
  );

  return htmlContent;
}
