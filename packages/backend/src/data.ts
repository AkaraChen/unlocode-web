import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";
import { resolveBackendData, resolveCrawlerData, resolveWorkspaceData } from "./paths";

async function fileStat(filePath: string) {
  try {
    return await fsp.stat(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function ensureBackendDataFile(fileName: string) {
  const sources = [resolveWorkspaceData(fileName), resolveCrawlerData(fileName)];
  let selectedSource: string | null = null;
  let selectedStat: fs.Stats | null = null;

  for (const candidate of sources) {
    const stat = await fileStat(candidate);
    if (!stat) continue;
    if (!selectedStat || stat.mtimeMs > selectedStat.mtimeMs) {
      selectedSource = candidate;
      selectedStat = stat;
    }
  }

  const target = resolveBackendData(fileName);
  const targetStat = await fileStat(target);

  if (selectedSource) {
    const needsCopy = !targetStat || targetStat.mtimeMs < (selectedStat?.mtimeMs ?? 0);
    if (needsCopy) {
      await fsp.mkdir(path.dirname(target), { recursive: true });
      await fsp.copyFile(selectedSource, target);
    }
  }

  const afterStat = await fileStat(target);
  if (!afterStat) {
    const rel = path.relative(process.cwd(), target);
    throw new Error(`Data file not found: ${rel}. Run \`pnpm crawl\` first.`);
  }

  return target;
}

export async function ensureBackendData() {
  const files = ["unlocode.json", "country.json"];
  const resolved = [] as string[];
  for (const name of files) {
    const filePath = await ensureBackendDataFile(name);
    resolved.push(filePath);
  }
  return resolved;
}

export function backendDataExists(fileName: string) {
  const target = resolveBackendData(fileName);
  return fs.existsSync(target);
}
