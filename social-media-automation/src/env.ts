import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Tokens live in the gitignored .env at the repo root (see env.sample).
const ENV_PATH = resolve(import.meta.dirname, "..", "..", ".env");

function parseEnvFile(content: string): Map<string, string> {
  const entries = new Map<string, string>();
  for (const line of content.split("\n")) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (match) entries.set(match[1]!, match[2]!);
  }
  return entries;
}

/** Read a key from the process environment, falling back to the root .env file. */
export function getEnv(key: string): string {
  const fromProcess = process.env[key];
  if (fromProcess) return fromProcess;
  if (existsSync(ENV_PATH)) {
    const fromFile = parseEnvFile(readFileSync(ENV_PATH, "utf8")).get(key);
    if (fromFile) return fromFile;
  }
  throw new Error(`${key} not set (checked process env and ${ENV_PATH})`);
}

/** Persist a key to the root .env file, replacing the existing line or appending. */
export function setEnv(key: string, value: string): void {
  if (!existsSync(ENV_PATH)) {
    throw new Error(`${ENV_PATH} not found — set ${key} there manually`);
  }
  const content = readFileSync(ENV_PATH, "utf8");
  const line = `${key}=${value}`;
  const keyPattern = new RegExp(`^${key}=.*$`, "m");
  const updated = keyPattern.test(content)
    ? content.replace(keyPattern, line)
    : `${content.replace(/\n*$/, "\n")}${line}\n`;
  writeFileSync(ENV_PATH, updated);
}
