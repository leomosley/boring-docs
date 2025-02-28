// This code is originally from:
// https://github.com/shadcn-ui/ui/blob/1081536246b44b6664f4c99bc3f1b3614e632841/packages/shadcn/src/utils/get-package-info.ts
// Licensed under the MIT License (Copyright (c) 2023 shadcn).
import path from "path";
import fs from "fs-extra";
import { type PackageJson } from "type-fest";
import toml from "toml";

export type PyProject = {
  name?: string;
  version?: string;
  description?: string;
  license?: string;
  authors?: string[];
};

export function getPackageJson(
  cwd: string = "",
  shouldThrow: boolean = true,
): PackageJson | null {
  const packageJsonPath = path.join(cwd, "package.json");

  return fs.readJSONSync(packageJsonPath, {
    throws: shouldThrow,
  }) as PackageJson;
}

export function getPyProjectToml(cwd: string = ""): PyProject | null {
  const pyprojectTomlPath = path.join(cwd, "pyproject.toml");

  const pyprojectContent = fs.readFileSync(pyprojectTomlPath, "utf-8");
  const pyproject = toml.parse(pyprojectContent);

  if (!pyproject.tool?.poetry) return null;

  return {
    name: pyproject.tool.poetry.name,
    version: pyproject.tool.poetry.version,
    description: pyproject.tool.poetry.description,
    license: pyproject.tool.poetry.license,
    authors: pyproject.tool.poetry.authors,
  };
}
