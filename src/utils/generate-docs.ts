import { createFile } from "./create-file";
import { getFiles } from "./get-files";
import { Language } from "./get-project-info";
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

export async function generateDocs(cwd: string, language: Language) {
  const files: DirectoryType = getFiles(cwd, language);
  const markdown = generateMarkdown(files);

  for (const { filePath, content, filename } of markdown) {
    await createFile(filename, content, path.join(cwd, "docs", filePath));
  }

  return markdown;
}
