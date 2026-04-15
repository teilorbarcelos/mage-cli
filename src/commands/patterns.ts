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
    .action(async (options: { framework?: string }) => {
      const config = await loadConfig();

      if (!config.repository) {
        logger.error(
          'No repository configured. Run: mage config set repo owner/name'
        );
        process.exit(1);
      }

      const manifest = await fetchManifest(config.repository);
      let filtered = manifest.patterns;

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

      const grouped = new Map<string, typeof filtered>();
      for (const pattern of filtered) {
        const key = pattern.framework;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(pattern);
      }

      for (const [framework, pats] of grouped) {
        console.log();
        logger.info(`${framework}`);
        for (const p of pats) {
          logger.keyValue(`  ${p.category}/${p.name}`, p.description);
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
