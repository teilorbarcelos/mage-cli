import fs from "fs";
import path from "path";
import { PatternManifest, PatternManifestEntry } from "../config/schema";

export function readManifest(repoPath: string): PatternManifest {
  const manifestPath = path.join(repoPath, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return { version: "1.0.0", patterns: [] };
  }
  const content = fs.readFileSync(manifestPath, "utf-8");
  return JSON.parse(content) as PatternManifest;
}

export function writeManifest(repoPath: string, manifest: PatternManifest): void {
  const manifestPath = path.join(repoPath, "manifest.json");
  
  // Sort patterns by scope -> framework -> category -> name for clean diffs
  manifest.patterns.sort((a, b) => {
    const keyA = `${a.scope}|${a.framework}|${a.category}|${a.name}`;
    const keyB = `${b.scope}|${b.framework}|${b.category}|${b.name}`;
    return keyA.localeCompare(keyB);
  });

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

export function addOrUpdatePatternInManifest(
  repoPath: string,
  entry: PatternManifestEntry
): void {
  const manifest = readManifest(repoPath);
  const index = manifest.patterns.findIndex(
    (p) => p.scope === entry.scope && 
           p.framework === entry.framework && 
           p.category === entry.category && 
           p.name === entry.name
  );

  if (index !== -1) {
    manifest.patterns[index] = entry;
  } else {
    manifest.patterns.push(entry);
  }

  writeManifest(repoPath, manifest);
}

export function removePatternFromManifest(
  repoPath: string,
  scope: string,
  framework: string,
  category: string,
  name: string
): void {
  const manifest = readManifest(repoPath);
  manifest.patterns = manifest.patterns.filter(
    (p) => !(p.scope === scope && 
             p.framework === framework && 
             p.category === category && 
             p.name === name)
  );
  writeManifest(repoPath, manifest);
}
