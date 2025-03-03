import fs from "fs";
import path from "path";
import { DirectoryType, FileType } from "./generate-docs";
import { isIgnorePath } from "./is-ignore-path";
import { getFunctions } from "./get-functions";

export function getFiles(dir: string, extension: string): DirectoryType {
  const result = readDirectoryRecursive(dir, extension, dir);

  if (!result) {
    throw new Error("Directory should be ignored");
  }

  return result;
}

export function readDirectoryRecursive(
  dir: string,
  extension: string,
  baseDir: string,
): DirectoryType | null {
  if (isIgnorePath(dir)) return null;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const ext = extension.startsWith(".") ? extension : `.${extension}`;

  const files: FileType[] = [];
  const children: DirectoryType[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      const result = readDirectoryRecursive(fullPath, ext, baseDir);
      if (result) children.push(result);
    } else if (entry.isFile() && fullPath.endsWith(ext)) {
      const content = fs.readFileSync(fullPath, "utf-8");

      const functions = getFunctions(content, ext);

      files.push({
        path: relativePath,
        content,
        functions,
      });
    }
  }

  return { path: path.relative(baseDir, dir), files, children };
}
