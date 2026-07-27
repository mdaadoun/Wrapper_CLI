import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PROJECT_DIR } from "@/lib/docs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePathParam = searchParams.get("path") || "";

  if (!filePathParam) {
    return NextResponse.json(
      { status: "error", message: "Missing file path" },
      { status: 400 }
    );
  }

  try {
    const resolvedPath = path.resolve(PROJECT_DIR, filePathParam);

    if (!resolvedPath.startsWith(PROJECT_DIR)) {
      return NextResponse.json(
        { status: "error", message: "Access denied" },
        { status: 403 }
      );
    }

    if (resolvedPath.includes(".venv") || resolvedPath.includes(".git")) {
      return NextResponse.json(
        { status: "error", message: "Access to system folders denied" },
        { status: 403 }
      );
    }

    if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
      return NextResponse.json(
        { status: "error", message: "File not found" },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(resolvedPath, "utf-8");
    return NextResponse.json({ status: "success", content });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
