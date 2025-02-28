import path from "path";

export const IGNORE = [
  "node_modules",
  "dist",
  "build",
  "out",
  "coverage",
  ".git",
  ".next",
  ".vscode",
  ".idea",
  ".DS_Store",
  ".log",
  ".env",
  "__pycache__",
  ".pyc",
  "venv",
  ".mypy_cache",
  ".pytest_cache",
  "tsconfig.tsbuildinfo",
  ".gitlab-ci.yml",
  ".github",
];

export function isIgnorePath(filePath: string): boolean {
  return IGNORE.some((ignorePath) => {
    const normalizedIgnorePath = path.sep + ignorePath;
    return (
      filePath.includes(normalizedIgnorePath) || filePath.endsWith(ignorePath)
    );
  });
}
