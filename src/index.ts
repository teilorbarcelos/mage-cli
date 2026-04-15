#!/usr/bin/env node

import { Command } from "commander";
import { registerConfigCommand } from "./commands/config";
import { registerGenerateCommand } from "./commands/generate";
import { registerPatternsCommand } from "./commands/patterns";

const program = new Command();

program
  .name("mage")
  .description("AI-powered CLI for web development with pluggable pattern repositories")
  .version("2.0.0");

registerConfigCommand(program);
registerGenerateCommand(program);
registerPatternsCommand(program);

program.parse(process.argv);
