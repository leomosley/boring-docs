import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";
import { z } from "zod";
import prompts from "prompts";
import { getProjectInfo } from "@/src/utils/get-project-info";
import { handleError } from "@/src/utils/handle-error";
import { logger } from "@/src/utils/logger";
import { generateDocs } from "@/src/utils/generate-docs";

const buildOptionsSchema = z.object({
  cwd: z.string(),
  yes: z.boolean(),
  example: z.boolean(),
});

export const build = new Command()
  .name("build")
  .description("builds the documentation for your project.")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd(),
  )
  .option("-y, --yes", "skip confirmation prompt.", false)
  .option("-e, --example", "add example uploader", false)
  .action(async (opts) => {
    try {
      const options = buildOptionsSchema.parse(opts);
      const cwd = path.resolve(options.cwd);

      if (!fs.existsSync(cwd)) {
        logger.error(`The path ${cwd} does not exist. Please try again.`);
        process.exit(1);
      }

      await runInit(options, cwd);

      logger.info(
        `${chalk.green("Success!")} Project initialization completed.`,
      );
      logger.info("");
    } catch (error) {
      handleError(error);
    }
  });

export async function runInit(
  options: z.infer<typeof buildOptionsSchema> & {
    skipPreflight?: boolean;
  },
  cwd: string,
) {
  // Get project info
  const infoSpinner = ora(`Getting project information`)?.start();
  const info = getProjectInfo(cwd);

  if (!info) throw new Error("Couldn't get project info.");

  infoSpinner?.succeed();
  logger.info("");

  // Generate docs object
  const generateSpinner = ora(`Generating docs`)?.start();
  const docs = generateDocs(cwd, info.language);

  if (!docs) throw new Error("Couldn't generate docs");

  generateSpinner?.succeed();
  logger.info("");
}
