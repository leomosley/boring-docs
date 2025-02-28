import path from "path";
import fs from "fs-extra";

export async function createFile(
  filename: string,
  content: string,
  dir?: string,
) {
  const filePath = path.join(dir ?? "", filename);

  try {
    if (dir) {
      await fs.ensureDir(dir);
    }

    if (!fs.existsSync(filePath)) {
      await fs.writeFile(filePath, content, "utf8");
      return filePath;
    }
  } catch (error) {
    console.error(error);
  }

}