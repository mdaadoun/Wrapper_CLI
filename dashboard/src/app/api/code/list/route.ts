import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PROJECT_DIR } from "@/lib/docs";

export async function GET() {
  const allowedRoots = ["src", "tests", "scripts"];
  const allowedFiles = [
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
  ];

  const files: { name: string; path: string }[] = [];

  try {
    for (const fname of allowedFiles) {
      const fpath = path.join(PROJECT_DIR, fname);
      if (fs.existsSync(fpath) && fs.statSync(fpath).isFile()) {
        files.push({ name: fname, path: fname });
      }
    }

    for (const rdir of allowedRoots) {
      const targetDir = path.join(PROJECT_DIR, rdir);
      if (fs.existsSync(targetDir) && fs.statSync(targetDir).isDirectory()) {
        const walk = (dir: string) => {
          const list = fs.readdirSync(dir);
          for (const item of list) {
            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);
            if (stat.isDirectory()) {
              if (item !== "__pycache__" && item !== ".pytest_cache" && item !== "node_modules") {
                walk(itemPath);
              }
            } else if (stat.isFile()) {
              const relPath = path.relative(PROJECT_DIR, itemPath);
              files.push({ name: item, path: relPath });
            }
          }
        };
        walk(targetDir);
      }
    }

    files.sort((a, b) => a.path.localeCompare(b.path));
    return NextResponse.json({ status: "success", files });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
