import fs from "fs";
import path from "path";
import { DirectoryType, FileType } from "./generate-docs";
import { getFunctions } from "./get-functions";

export function getFiles(dir: string, extension: string): DirectoryType {
  return readDirectoryRecursive(dir, extension, dir);
}

export function readDirectoryRecursive(dir: string, extension: string, baseDir: string): DirectoryType {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const ext = extension.startsWith(".") ? extension : `.${extension}`;

  const files: FileType[] = [];
  const children: DirectoryType[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      children.push(readDirectoryRecursive(fullPath, ext, baseDir));
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