#!/usr/bin/env node

import { Command } from "commander";
import { registerConfigCommand } from "./commands/config";
import { registerDoCommand } from "./commands/do";

const program = new Command();

program
  .name("mage")
  .description("Full-stack boilerplate manager and CLI")
  .version("3.0.0");

registerConfigCommand(program);
registerDoCommand(program);

program.parse(process.argv);
