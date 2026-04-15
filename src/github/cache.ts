import fs from "fs";
import path from "path";
import { getGlobalDir } from "../config/loader";

const CACHE_TTL_MS = 30 * 60 * 1000;

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

function getCacheDir(): string {
  return path.join(getGlobalDir(), "cache");
}

function getCacheFilePath(key: string): string {
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(getCacheDir(), `${safeKey}.json`);
}

function ensureCacheDir(): void {
  const dir = getCacheDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getCache<T>(key: string): T | null {
  const filePath = getCacheFilePath(key);
  if (!fs.existsSync(filePath)) return null;

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const entry = JSON.parse(raw) as CacheEntry<T>;
    return entry.data;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T): void {
  ensureCacheDir();
  const filePath = getCacheFilePath(key);
  const entry: CacheEntry<T> = {
    timestamp: Date.now(),
    data,
  };
  fs.writeFileSync(filePath, JSON.stringify(entry, null, 2));
}

export function isCacheValid(key: string): boolean {
  const filePath = getCacheFilePath(key);
  if (!fs.existsSync(filePath)) return false;

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const entry = JSON.parse(raw) as CacheEntry<unknown>;
    return Date.now() - entry.timestamp < CACHE_TTL_MS;
  } catch {
    return false;
  }
}

export function clearCache(): void {
  const dir = getCacheDir();
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
