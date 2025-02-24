import { getFiles } from "./get-files";
import { Language } from "./get-project-info";
import { z } from "zod";

export const FunctionSchema = z.object({
  name: z.string(),
  params: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      description: z.string().optional(),
    })
  ),
  returns: z
    .object({
      type: z.string(),
      description: z.string().optional(),
    })
    .optional(),
  throws: z
    .array(
      z.object({
        type: z.string(),
        description: z.string().optional(),
      })
    )
    .optional(),
  docstring: z.string().optional(),
});

export const FileSchema = z.object({
  path: z.string(),
  functions: z.array(FunctionSchema),
  content: z.string(),
});

export const DirectorySchema: z.ZodType<{ path: string; files: FileType[]; children: DirectoryType[] }> = z.lazy(() =>
  z.object({
    path: z.string(),
    files: z.array(FileSchema),
    children: z.array(DirectorySchema),
  })
);

export type FunctionType = z.infer<typeof FunctionSchema>;
export type FileType = z.infer<typeof FileSchema>;
export type DirectoryType = z.infer<typeof DirectorySchema>;

export function generateDocs(cwd: string, language: Language) {
  if (language === "py")
    return generatePyDocs(cwd);
  else {
    return generateJsDocs(cwd, language);
  }
}

export function generatePyDocs(cwd: string) {
  return getFiles(cwd, ".py");
}

export function generateJsDocs(cwd: string, language: Language) {
  if (language === "ts") {
    return getFiles(cwd, ".ts");
  } else {
    return getFiles(cwd, ".js");
  }
}