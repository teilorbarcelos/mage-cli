import path from "path";
import { GeneratedFile } from "../config/schema";
import { writeFileSafe, fileExists, resolveFromCwd } from "../utils/fs";
import * as logger from "../utils/logger";

export function writeGeneratedFiles(
  files: GeneratedFile[],
  baseDir: string
): void {
  for (const file of files) {
    const fullPath = resolveFromCwd(baseDir, file.relativePath);

    if (fileExists(fullPath)) {
      logger.warn(`Skipped (already exists): ${path.join(baseDir, file.relativePath)}`);
      continue;
    }

    writeFileSafe(fullPath, file.content);
    logger.success(`Created: ${path.join(baseDir, file.relativePath)}`);
  }
}
