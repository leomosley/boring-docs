import { createFile } from "./create-file";
import { getFiles } from "./get-files";
import { ProjectInfo } from "./get-project-info";
import { z } from "zod";
import path from "path";

export const FunctionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  params: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      description: z.string().optional(),
    }),
  ),
  returns: z
    .array(
      z.object({
        type: z.string(),
        description: z.string().optional(),
      }),
    )
    .optional(),
  throws: z
    .array(
      z.object({
        type: z.string(),
        description: z.string().optional(),
      }),
    )
    .optional(),
  docstring: z.string().optional(),
});

export const FileSchema = z.object({
  path: z.string(),
  functions: z.array(FunctionSchema),
  content: z.string(),
});

export const DirectorySchema: z.ZodType<{
  path: string;
  files: FileType[];
  children: DirectoryType[];
}> = z.lazy(() =>
  z.object({
    path: z.string(),
    files: z.array(FileSchema),
    children: z.array(DirectorySchema),
  }),
);

export type FunctionType = z.infer<typeof FunctionSchema>;
export type ParamType = z.infer<typeof FunctionSchema>["params"];
export type ReturnType = z.infer<typeof FunctionSchema>["returns"];
export type ThrowsType = z.infer<typeof FunctionSchema>["throws"];
export type FileType = z.infer<typeof FileSchema>;
export type DirectoryType = z.infer<typeof DirectorySchema>;
export type Markdown = {
  filename: string;
  filePath: string;
  content: string;
};

function generateFunctionMarkdown(func: FunctionType): string {
  let markdownContent = `\n\n## <code>${func.name}</code>\n\n`;

  if (func.description && func.description.length > 0) {
    markdownContent += `${func.description}\n\n`;
  }

  // Add parameters documentation
  if (func.params.length > 0) {
    markdownContent += "### Parameters:\n";
    markdownContent += "| Name | Type | Description |\n";
    markdownContent += "| ---- | ---- | ----------- |\n";
    for (const param of func.params) {
      markdownContent += `| ${param.name} | ${param.type} | ${param.description ?? ""} |\n`;
    }
    markdownContent += "\n";
  }

  // // Add returns documentation
  // if (func.returns) {
  //   markdownContent += "### Returns:\n";
  //   markdownContent += `- **Type**: ${func.returns.type}\n`;
  //   markdownContent += `- **Description**: ${func.returns.description ?? ""}\n\n`;
  // }

  // Add throws documentation
  if (func.throws && func.throws.length > 0) {
    markdownContent += "### Throws:\n";
    markdownContent += "| Type | Description |\n";
    markdownContent += "| ---- | ----------- |\n";
    for (const error of func.throws) {
      markdownContent += `| ${error.type} | ${error.description ?? ""} |\n`;
    }
    markdownContent += "\n";
  }

  markdownContent += "---\n\n";

  return markdownContent;
}

function generateMarkdown(directory: DirectoryType): Markdown[] {
  const markdown: Markdown[] = [];

  // Process all files in the current directory
  for (const file of directory.files) {
    let filePath = file.path.split("\\");
    let filename = filePath.pop()?.replace(/\.[^/.]+$/, "") + ".md";

    let content = `# ${filename.replace(".md", "")}`;
    for (const func of file.functions) {
      content += generateFunctionMarkdown(func);
    }

    markdown.push({
      filePath: filePath.join("/"),
      filename,
      content,
    });
  }

  // Recursively process child directories
  for (const child of directory.children) {
    markdown.push(...generateMarkdown(child));
  }

  return markdown;
}

function getTitle(info: ProjectInfo): string {
  let projectName;

  if (info.name) {
    projectName = info.name;
  } else {
    switch (info.language) {
      case "js":
        projectName = "JavaScript Project";
        break;
      case "py":
        projectName = "Python Project";
        break;
      case "ts":
        projectName = "TypeScript Project";
        break;
      default:
        break;
    }
  }

  return `# ${projectName}`;
}

function getDescription(info: ProjectInfo): string {
  // TODO: Add some kind of generated description if one is not provided. (Gen AI)
  return info.description ?? "Description";
}

function getTree(files: DirectoryType, indent: string = "", isLast: boolean = true): string {
  let tree = "";
  const basename = path.basename(files.path);
  const prefix = indent.length === 0 ? "" : indent + (isLast ? "└── " : "├── ");
  tree += `${prefix}${basename}\n`;

  const children = files.children;
  const count = children.length;
  for (let i = 0; i < count; i++) {
    const child = children[i];
    const isLastChild = i === count - 1;
    const newIndent = indent + (isLast ? "    " : "│   ");
    tree += getTree(child, newIndent, isLastChild);
  }

  return tree;
}

function generateHome(files: DirectoryType, info: ProjectInfo): Markdown {
  const title = getTitle(info);

  const description = getDescription(info);

  const tree = getTree(files);

  const content =
    title
    + "\n\n"
    + description
    + "\n\nProject Strucutre\n\n"
    + "```\n"
    + tree
    + "\n```";

  console.log(content);

  return {
    filename: "home.md",
    filePath: "",
    content
  }
}

export async function generateDocs(cwd: string, info: ProjectInfo) {
  const files: DirectoryType = getFiles(cwd, info.language);

  // Generate docs "home" page
  const home = generateHome(files, info);

  // Generate markdown for projects files
  const markdown: Markdown[] = [...generateMarkdown(files), home];

  for (const { filePath, content, filename } of markdown) {
    await createFile(filename, content, path.join(cwd, "docs", filePath));
  }

  return markdown;
}
