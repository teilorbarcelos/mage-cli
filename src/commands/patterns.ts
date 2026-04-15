import { Command } from "commander";
import { loadConfig } from "../config/loader";
import { fetchManifest } from "../github/client";
import { clearCache } from "../github/cache";
import { registerInitRepoCommand } from "./init-repo";
import * as logger from "../utils/logger";

export function registerPatternsCommand(program: Command): void {
  const patterns = program
    .command("patterns")
    .description("Manage and browse the patterns repository");

  patterns
    .command("list")
    .description("List all available patterns")
    .option("-f, --framework <framework>", "Filter by framework")
    .option("-s, --scope <scope>", "Filter by scope (frontend or backend)")
    .action(async (options: { framework?: string; scope?: string }) => {
      const config = await loadConfig();

      if (!config.repository) {
        logger.error(
          'No repository configured. Run: mage config set repo owner/name'
        );
        process.exit(1);
      }

      const manifest = await fetchManifest(config.repository);
      let filtered = manifest.patterns;

      if (options.scope) {
        filtered = filtered.filter(
          (p) => p.scope.toLowerCase() === options.scope!.toLowerCase()
        );
      }

      if (options.framework) {
        filtered = filtered.filter(
          (p) => p.framework.toLowerCase() === options.framework!.toLowerCase()
        );
      }

      if (filtered.length === 0) {
        logger.warn("No patterns found");
        return;
      }

      logger.header(`Available Patterns (${filtered.length})`);

      const byScope = new Map<string, Map<string, typeof filtered>>();
      for (const pattern of filtered) {
        if (!byScope.has(pattern.scope)) byScope.set(pattern.scope, new Map());
        const scopeMap = byScope.get(pattern.scope)!;
        if (!scopeMap.has(pattern.framework)) scopeMap.set(pattern.framework, []);
        scopeMap.get(pattern.framework)!.push(pattern);
      }

      for (const [scope, frameworks] of byScope) {
        console.log();
        logger.info(scope.toUpperCase());
        for (const [framework, pats] of frameworks) {
          logger.dim(`  ${framework}`);
          for (const p of pats) {
            logger.keyValue(`    ${p.category}/${p.name}`, p.description);
          }
        }
      }
    });

  patterns
    .command("sync")
    .description("Force refresh the local patterns cache")
    .action(async () => {
      clearCache();
      logger.success("Cache cleared");

      const config = await loadConfig();
      if (config.repository) {
        await fetchManifest(config.repository);
        logger.success("Patterns re-synced from repository");
      }
    });

  registerInitRepoCommand(patterns);
}
