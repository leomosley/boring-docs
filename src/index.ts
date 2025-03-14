#!/usr/bin/env node
import { Command } from "commander";

import { build } from "@/src/commands/build";

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

async function main() {
  const program = new Command()
    .name("boring-docs")
    .description("seamlessly add simple docs to your project.")
    .version("1.0.0", "-v, --version", "display the version number");

  program.addCommand(build);

  program.parse();
}

main();
