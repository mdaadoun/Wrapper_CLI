import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PROJECT_DIR } from "@/lib/docs";

export async function GET() {
  const testsDir = path.join(PROJECT_DIR, "tests");
  if (!fs.existsSync(testsDir) || !fs.statSync(testsDir).isDirectory()) {
    return NextResponse.json({ status: "success", tests: [] });
  }

  try {
    const testList: any[] = [
      {
        id: "all",
        name: "🧪 Full Test Suite (pytest)",
        file: "all",
        docstring: "Executes full unit and integration test suite across all test modules.",
        type: "suite",
      },
    ];

    const files = fs.readdirSync(testsDir);
    const testFiles = files.filter((f) => f.startsWith("test_") && f.endsWith(".py")).sort();

    for (const fileName of testFiles) {
      const relPath = `tests/${fileName}`;
      const fullPath = path.join(testsDir, fileName);
      const fileContent = fs.readFileSync(fullPath, "utf-8");

      let fileDoc = "";
      const docMatch = fileContent.match(/^(?:'''|""")([\s\S]*?)(?:'''|""")/);
      if (docMatch) {
        fileDoc = docMatch[1].trim();
      }

      testList.push({
        id: relPath,
        name: `📁 ${fileName} (Full File)`,
        file: relPath,
        docstring: fileDoc || `Executes all tests in ${fileName}.`,
        type: "file",
      });

      const lines = fileContent.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const funcMatch = line.match(/^def\s+(test_[a-zA-Z0-9_]+)\s*\(/);
        if (funcMatch) {
          const funcName = funcMatch[1];
          const testId = `${relPath}::${funcName}`;

          // Extract docstring from subsequent lines
          let funcDoc = "";
          for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
            const nextLine = lines[j].trim();
            if (nextLine.startsWith('"""') || nextLine.startsWith("'''")) {
              const quote = nextLine.substring(0, 3);
              const rest = nextLine.substring(3);
              if (rest.endsWith(quote) && rest.length > 3) {
                funcDoc = rest.substring(0, rest.length - 3).trim();
              } else {
                let docAcc = [rest];
                for (let k = j + 1; k < Math.min(j + 10, lines.length); k++) {
                  const endLine = lines[k].trim();
                  if (endLine.endsWith(quote) || endLine.includes(quote)) {
                    docAcc.push(endLine.replace(quote, "").trim());
                    break;
                  }
                  docAcc.push(endLine);
                }
                funcDoc = docAcc.join(" ").trim();
              }
              break;
            }
          }

          testList.push({
            id: testId,
            name: `   └─ ${funcName}`,
            file: relPath,
            docstring: funcDoc || `Executes targeted unit test function ${funcName}().`,
            type: "function",
          });
        }
      }
    }

    return NextResponse.json({ status: "success", tests: testList });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
