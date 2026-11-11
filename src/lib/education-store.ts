import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { getDataPath } from "@/lib/data-directory";
import { validateData, type DataContent, type SharedDataset, type DatasetSummary } from "@/lib/education-data";

const root = () => getDataPath("education-datasets");
const validId = (id: string) => /^[0-9a-f-]{36}$/.test(id);
export async function readDataset(id: string): Promise<SharedDataset> {
  if (!validId(id)) throw new Error("자료 번호가 올바르지 않습니다.");
  return JSON.parse(await readFile(path.join(root(), id + ".json"), "utf8"));
}
export async function listDatasets(): Promise<DatasetSummary[]> {
  const files = await readdir(root()).catch(() => []);
  const results = await Promise.all(files.filter(file => /^[0-9a-f-]{36}\.json$/.test(file)).map(async file => {
    const { rows, ...record } = await readDataset(file.slice(0, -5)); return { ...record, rowCount: rows.length };
  }));
  return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function saveDataset(input: DataContent & { title: string; parentId?: string }, actor: { id: string; displayName: string }, original?: { bytes: Buffer; name: string }): Promise<SharedDataset> {
  validateData(input);
  const title = input.title?.trim();
  if (!title || title.length > 150) throw new Error("자료 이름은 1~150자로 입력하세요.");
  if (input.parentId) { const parent = await readDataset(input.parentId); if (parent.title === title) throw new Error("원본·이전 수정본과 다른 이름으로 저장하세요."); }
  const id = randomUUID();
  const data: SharedDataset = { id, title, chart: input.chart, columns: input.columns, rows: input.rows, unit: input.unit?.slice(0, 30), lowerSpec: input.lowerSpec, upperSpec: input.upperSpec, parentId: input.parentId, kind: input.parentId ? "copy" : "original", createdAt: new Date().toISOString(), author: actor.displayName, authorId: actor.id };
  await mkdir(root(), { recursive: true });
  if (original) {
    const originalRoot = path.join(root(), "original-files");
    await mkdir(originalRoot, { recursive: true });
    data.originalFile = id + path.extname(original.name).toLowerCase();
    await writeFile(path.join(originalRoot, data.originalFile), original.bytes, { flag: "wx" });
  }
  const temporary = path.join(root(), id + ".tmp");
  await writeFile(temporary, JSON.stringify(data), { encoding: "utf8", flag: "wx" });
  await rename(temporary, path.join(root(), id + ".json"));
  return data;
}
