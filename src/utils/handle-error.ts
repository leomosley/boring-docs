// This code is originally from:
// https://github.com/shadcn-ui/ui/blob/1081536246b44b6664f4c99bc3f1b3614e632841/packages/cli/src/utils/handle-error.ts
// Licensed under the MIT License (Copyright (c) 2023 shadcn).
import { logger } from "@/src/utils/logger";
import chalk from "chalk";
import { z } from "zod";

export function handleError(error: unknown) {
  logger.error(
    `Something went wrong. Please check the error below for more details.`,
  );
  logger.error(`If the problem persists, please open an issue on GitHub.`);
  logger.error("");
  if (typeof error === "string") {
    logger.error(error);
    logger.break();
    process.exit(1);
  }

  if (error instanceof z.ZodError) {
    logger.error("Validation failed:");
    for (const [key, value] of Object.entries(error.flatten().fieldErrors)) {
      logger.error(`- ${chalk.blue(key)}: ${value}`);
    }
    logger.break();
    process.exit(1);
  }

  if (error instanceof Error) {
    logger.error(error.message);
    logger.break();
    process.exit(1);
  }

  logger.break();
  process.exit(1);
}
