import { NextResponse } from "next/server";
import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { PROJECT_DIR } from "@/lib/docs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const testName = body.test_name || "all";

    const venvPython = path.join(PROJECT_DIR, ".venv", "bin", "python");
    const pythonExec = fs.existsSync(venvPython) ? venvPython : "python3";

    let args: string[];

    if (testName === "all") {
      args = ["-m", "pytest", "tests/"];
    } else {
      const cleanName = testName.replace(/[^a-zA-Z0-9_.-/:]/g, "");
      if (!cleanName.startsWith("tests/test_") || !cleanName.includes(".py")) {
        return NextResponse.json(
          { status: "error", message: "Invalid test file or function name." },
          { status: 400 }
        );
      }

      const filePart = cleanName.split("::")[0];
      const filePath = path.join(PROJECT_DIR, filePart);
      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          { status: "error", message: `Test file '${filePart}' not found.` },
          { status: 404 }
        );
      }

      args = ["-m", "pytest", "--no-cov", cleanName];
    }

    const testsDir = path.join(PROJECT_DIR, "tests");
    if (!fs.existsSync(testsDir)) {
      return NextResponse.json({
        status: "failed",
        message: "Directory 'tests/' does not exist.",
        stdout: "",
        stderr: "Error: No tests defined.",
      });
    }

    return new Promise<NextResponse>((resolve) => {
      execFile(
        pythonExec,
        args,
        { cwd: PROJECT_DIR, timeout: 30000 },
        (error, stdout, stderr) => {
          if (error && error.killed) {
            resolve(
              NextResponse.json(
                { status: "error", message: "Test execution timed out after 30 seconds." },
                { status: 504 }
              )
            );
            return;
          }

          const code = error ? error.code || 1 : 0;
          const status = code === 0 ? "success" : "failed";
          const message =
            code === 0
              ? `Execution successful: ${testName}`
              : `Tests failed (exit code: ${code}).`;

          resolve(
            NextResponse.json({
              status,
              message,
              stdout: stdout || "",
              stderr: stderr || "",
              exit_code: code,
            })
          );
        }
      );
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: `Error running test suite: ${error.message}` },
      { status: 500 }
    );
  }
}
