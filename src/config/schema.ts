export interface MageConfig {
  menuUrl?: string;
}

export interface ScriptOption {
  name: string;
  command: string;
}

export interface ReplacementRule {
  path: string;
  pattern: string;
}

export interface MageProjectConfig {
  scripts?: ScriptOption[];
  replacements?: ReplacementRule[];
}
