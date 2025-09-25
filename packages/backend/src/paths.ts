import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const workspaceRoot = path.resolve(__dirname, "../../crawler")

export function resolveCrawlerPath(...segments: string[]) {
  return path.join(workspaceRoot, ...segments);
}
