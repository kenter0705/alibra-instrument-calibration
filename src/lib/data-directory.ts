import { join } from "node:path";

/** Persistent user-file root; defaults to ./data for local development. */
export function getDataPath(...segments: string[]) {
  const configuredRoot = process.env.CALIBRA_DATA_DIR?.trim();
  const root = configuredRoot || join(process.cwd(), "data");
  return join(root, ...segments);
}
