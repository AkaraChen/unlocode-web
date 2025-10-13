import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(packageRoot, "../..");
const crawlerDataRoot = path.join(workspaceRoot, "packages", "crawler", "data");
const backendDataRoot = path.join(packageRoot, "data");
const workspaceDataRoot = path.join(workspaceRoot, "data");

export { packageRoot, workspaceRoot, crawlerDataRoot, backendDataRoot, workspaceDataRoot };

export function resolveCrawlerData(...segments: string[]) {
  return path.join(crawlerDataRoot, ...segments);
}

export function resolveBackendData(...segments: string[]) {
  return path.join(backendDataRoot, ...segments);
}

export function resolveWorkspaceData(...segments: string[]) {
  return path.join(workspaceDataRoot, ...segments);
}
