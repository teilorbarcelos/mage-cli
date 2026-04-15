import { Octokit } from "@octokit/rest";
import { MageRepository, PatternManifest, PatternMeta } from "../config/schema";
import { getCache, setCache, isCacheValid } from "./cache";
import * as logger from "../utils/logger";

function createOctokit(token?: string): Octokit {
  return new Octokit(token ? { auth: token } : {});
}

async function fetchFileContent(
  octokit: Octokit,
  repo: MageRepository,
  filePath: string
): Promise<string> {
  const response = await octokit.rest.repos.getContent({
    owner: repo.owner,
    repo: repo.name,
    path: filePath,
    ref: repo.branch,
  });

  const data = response.data;
  if ("content" in data && data.encoding === "base64") {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }
  throw new Error(`Could not read file: ${filePath}`);
}

export async function fetchManifest(
  repo: MageRepository
): Promise<PatternManifest> {
  const cacheKey = `manifest_${repo.owner}_${repo.name}_${repo.branch}`;

  if (isCacheValid(cacheKey)) {
    const cached = getCache<PatternManifest>(cacheKey);
    if (cached) return cached;
  }

  const spin = logger.spinner("Fetching patterns manifest...");
  try {
    const octokit = createOctokit(repo.token);
    const content = await fetchFileContent(octokit, repo, "manifest.json");
    const manifest = JSON.parse(content) as PatternManifest;
    setCache(cacheKey, manifest);
    spin.succeed("Patterns manifest loaded");
    return manifest;
  } catch (err) {
    spin.fail("Failed to fetch manifest");

    const cached = getCache<PatternManifest>(cacheKey);
    if (cached) {
      logger.warn("Using cached manifest (offline fallback)");
      return cached;
    }
    throw err;
  }
}

export async function fetchPatternMeta(
  repo: MageRepository,
  patternPath: string
): Promise<PatternMeta> {
  const cacheKey = `pattern_meta_${patternPath}`;

  if (isCacheValid(cacheKey)) {
    const cached = getCache<PatternMeta>(cacheKey);
    if (cached) return cached;
  }

  const octokit = createOctokit(repo.token);
  const content = await fetchFileContent(
    octokit,
    repo,
    `${patternPath}/pattern.json`
  );
  const meta = JSON.parse(content) as PatternMeta;
  setCache(cacheKey, meta);
  return meta;
}

export async function fetchTemplateFile(
  repo: MageRepository,
  filePath: string
): Promise<string> {
  const cacheKey = `template_${filePath}`;

  if (isCacheValid(cacheKey)) {
    const cached = getCache<string>(cacheKey);
    if (cached) return cached;
  }

  const octokit = createOctokit(repo.token);
  const content = await fetchFileContent(octokit, repo, filePath);
  setCache(cacheKey, content);
  return content;
}
