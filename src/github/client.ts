import fs from "fs";
import path from "path";
import { Octokit } from "@octokit/rest";
import { MageRepository, PatternManifest, PatternMeta } from "../config/schema";
import { getCache, setCache, isCacheValid } from "./cache";
import { fileExists } from "../utils/fs";
import * as logger from "../utils/logger";

function createOctokit(token?: string): Octokit {
  return new Octokit(token ? { auth: token } : {});
}

async function getFileContent(
  repo: MageRepository,
  filePath: string
): Promise<string> {
  // Option 1: Local Filesystem (Priority)
  if (repo.localPath && fileExists(repo.localPath)) {
    const fullPath = path.join(repo.localPath, filePath);
    if (fileExists(fullPath)) {
      return fs.readFileSync(fullPath, "utf-8");
    }
    // If not found locally, we might still want to try remote, but usually this is an error
  }

  // Option 2: GitHub API
  try {
    const octokit = createOctokit(repo.token);
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
  } catch (err: any) {
    if (err.status === 404) {
      throw new Error(
        `File not found: ${filePath} (404). If the repo is private, please set a token: mage config set repo-token <token>`
      );
    }
    throw err;
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
    const content = await getFileContent(repo, "manifest.json");
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

  const content = await getFileContent(
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

  const content = await getFileContent(repo, filePath);
  setCache(cacheKey, content);
  return content;
}

export async function listBranches(repo: MageRepository): Promise<string[]> {
  const octokit = createOctokit(repo.token);
  const response = await octokit.rest.repos.listBranches({
    owner: repo.owner,
    repo: repo.name,
  });
  return response.data.map((b) => b.name);
}

export async function createBranch(
  repo: MageRepository,
  name: string,
  from: string
): Promise<void> {
  const octokit = createOctokit(repo.token);

  // Get the SHA of the base branch
  const { data: ref } = await octokit.rest.git.getRef({
    owner: repo.owner,
    repo: repo.name,
    ref: `heads/${from}`,
  });

  await octokit.rest.git.createRef({
    owner: repo.owner,
    repo: repo.name,
    ref: `refs/heads/${name}`,
    sha: ref.object.sha,
  });
}

export async function deleteBranch(
  repo: MageRepository,
  name: string
): Promise<void> {
  const octokit = createOctokit(repo.token);
  await octokit.rest.git.deleteRef({
    owner: repo.owner,
    repo: repo.name,
    ref: `heads/${name}`,
  });
}
