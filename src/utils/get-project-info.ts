// Portions of this code are adapted from:
// https://github.com/shadcn-ui/ui/blob/1081536246b44b6664f4c99bc3f1b3614e632841/packages/shadcn/src/utils/get-project-info.ts
// Licensed under the MIT License (Copyright (c) 2023 shadcn).
import path from "path";
import fs from "fs-extra";
import { getPackageJson, getPyProjectToml } from "./get-package-info";

export const LANGUAGES = [
  "ts",
  "js",
  "py",
] as const;

export type Language = (typeof LANGUAGES)[number];

export const LICENSES = [
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "GPL-2.0",
  "GPL-3.0",
  "AGPL-3.0",
  "LGPL-2.1",
  "LGPL-3.0",
  "MPL-2.0",
  "Proprietary",
  "Unlicense",
  "CC0",
  "Elastic-License",
  "SSPL",
] as const;

export type License = (typeof LICENSES)[number];

export type ProjectInfo = {
  language: Language;
  name?: string;
  description?: string;
  license?: License;
};

export const PROJECT_SHARED_IGNORE = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/out/**",
  "**/coverage/**",
  "**/.git/**",
  "**/.next/**",
  "**/.vscode/**",
  "**/.idea/**",
  "**/.DS_Store/**",
  "**/.env*",
  "**/*.log",
  "**/__pycache__/**",
  "**/*.pyc",
  "**/venv/**",
  "**/.mypy_cache/**",
  "**/.pytest_cache/**",
  "**/tsconfig.tsbuildinfo",
  "**/.gitlab-ci.yml",
  "**/.github/**"
];

export function getProjectInfo(cwd: string): ProjectInfo | null {
  const { js, ts, py } = {
    js: isJavaScriptProject(cwd),
    ts: isTypeScriptProject(cwd),
    py: isPythonPoetryProject(cwd),
  };

  if (py) {
    const pyProjectToml = getPyProjectToml(cwd);

    return {
      language: "py",
      name: pyProjectToml?.name,
      description: pyProjectToml?.description,
      license: pyProjectToml?.license as License
    }
  }

  if (js || ts) {
    const packageJson = getPackageJson(cwd);

    return {
      language: ts ? "ts" : "js",
      name: packageJson?.name,
      description: packageJson?.description,
      license: packageJson?.license as License
    }
  }


  return null;
}

export function isJavaScriptProject(cwd: string) {
  // Check if cwd has a package.json file.
  return fs.pathExistsSync(path.resolve(cwd, "package.json"));
}

export function isPythonPoetryProject(cwd: string) {
  // Check if cwd has a pyproject.toml file.
  return fs.pathExistsSync(path.resolve(cwd, "pyproject.toml"));
}

export function isTypeScriptProject(cwd: string) {
  // Check if cwd has a tsconfig.json file.
  return fs.pathExistsSync(path.resolve(cwd, "tsconfig.json"));
}