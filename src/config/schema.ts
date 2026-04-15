export interface MageRepository {
  owner: string;
  name: string;
  branch: string;
  token?: string;
  localPath?: string;
}

export interface MageAI {
  provider: "openai" | "gemini";
  apiKey: string;
  model: string;
}

export interface MagePaths {
  components: string;
  pages: string;
  hooks: string;
  services: string;
  lib: string;
  [key: string]: string;
}

export interface MageConfig {
  repository?: MageRepository;
  ai?: MageAI;
  paths?: MagePaths;
  treeDepth?: number;
}

export interface PatternManifestEntry {
  name: string;
  description: string;
  scope: "frontend" | "backend";
  framework: string;
  category: string;
  path: string;
  files: string[];
}

export interface PatternManifest {
  version: string;
  patterns: PatternManifestEntry[];
}

export interface PatternMeta {
  name: string;
  description: string;
  scope: "frontend" | "backend";
  framework: string;
  category: string;
  variables: PatternVariable[];
}

export interface PatternVariable {
  name: string;
  description: string;
  default?: string;
  required: boolean;
}

export interface GeneratedFile {
  relativePath: string;
  content: string;
}

export interface AIDecision {
  decision: "use_pattern" | "create_new" | "run_commands" | "read_files" | "modify_files" | "delete_files";
  reasoning: string;
  patternIndex?: number;
  variables?: Record<string, string>;
  files?: GeneratedFile[];
  commands?: string[];
  requestedFiles?: string[];
}
