#!/usr/bin/env node

import { Command } from "commander";
import * as packageJson from "../package.json";
import { init } from "./fn/init";

const program = new Command();

program.version(packageJson.version);

program
  .command("init")
  .description("Initialize the project with configuration files")
  .action(() => {
    init();
  });

program
  .command("create <framework> <resource> [name]")
  .description("Create a framework resource with a specific name")
  .action((framework: string, resource: string, name?: string) => {
    const Command = require(`./${framework}/${resource}`).default;

    try {
      Command(name);
    } catch (error) {
      console.error(`Command not found for ${framework}/${resource}`);
    }
  });

program.parse(process.argv);
