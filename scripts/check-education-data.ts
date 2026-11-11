import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chartTypes, exampleData, validateData } from "../src/lib/education-data";
import { serverAddress } from "../src/lib/server-address";
import { saveDataset, readDataset, listDatasets } from "../src/lib/education-store";

async function main() {
  for (const chart of Object.keys(chartTypes) as (keyof typeof chartTypes)[]) validateData(exampleData(chart));
  assert.throws(() => validateData({ ...exampleData("p"), rows: [["10", "11"], ["10", "0"]] }));
  assert.throws(() => validateData({ ...exampleData("np"), rows: [["10", "1"], ["20", "1"]] }));
  assert.throws(() => validateData({ ...exampleData("u"), rows: [["0", "1"], ["2", "1"]] }));
  assert.throws(() => validateData({ ...exampleData("histogram"), rows: [[""], ["NaN"]] }));
  assert.throws(() => validateData({ ...exampleData("capability"), lowerSpec: 10, upperSpec: 9 }));
  assert.throws(() => validateData({ ...exampleData("imr"), rows: [["2", "10"], ["1", "11"]] }));
  assert.equal(exampleData("p").unit, "건");
  const grr = exampleData("grr"); assert.throws(() => validateData({ ...grr, rows: grr.rows.slice(1) }));
  assert.equal(serverAddress("192.168.0.10"), "http://192.168.0.10:3000/");
  assert.equal(serverAddress("localhost:3100"), "http://localhost:3100/");
  assert.equal(serverAddress("https://192.168.0.10:443"), "https://192.168.0.10/");
  for (const bad of ["127.1", "123", "0x7f000001", "192.168.001.1", "192.168.0.256", "0.0.0.0", "255.255.255.255", "localhost:0", "localhost:65536", "javascript:alert(1)", "http://user:pass@192.168.0.10", "http://192.168.0.10/path", "http://192.168.0.10?x=1"]) assert.throws(() => serverAddress(bad), bad);
  const temporary = await mkdtemp(path.join(os.tmpdir(), "calibra-education-"));
  const originalEnvironment = process.env.CALIBRA_DATA_DIR;
  process.env.CALIBRA_DATA_DIR = temporary;
  try {
    const bytes = Buffer.from("측정값\n10.1\n10.2", "utf8");
    const original = await saveDataset({ ...exampleData("histogram"), title: "보존할 원본" }, { id: "teacher", displayName: "교사" }, { bytes, name: "원본.csv" });
    const originalPath = path.join(temporary, "education-datasets", original.id + ".json");
    const before = await readFile(originalPath);
    const versions = await Promise.all(Array.from({ length: 25 }, (_, i) => saveDataset({ ...exampleData("histogram"), title: `공동 실습 수정본 ${i + 1}`, parentId: original.id, rows: [[String(i)], [String(i + 1)]] }, { id: `student-${i}`, displayName: `교육생 ${i + 1}` })));
    assert.equal(new Set(versions.map(version => version.id)).size, 25);
    assert.equal((await listDatasets()).length, 26);
    assert.deepEqual(await readFile(originalPath), before);
    assert.deepEqual(await readFile(path.join(temporary, "education-datasets/original-files", original.originalFile!)), bytes);
    await assert.rejects(() => saveDataset({ ...exampleData("histogram"), title: original.title, parentId: original.id }, { id: "student", displayName: "학생" }));
    await assert.rejects(() => readDataset("../../outside"));
    console.log("PASS: all 14 chart templates and invalid input rules; strict IP parsing; 25 concurrent Save As writes; unique versions; original JSON and uploaded bytes unchanged; traversal rejected.");
  } finally {
    if (originalEnvironment === undefined) delete process.env.CALIBRA_DATA_DIR; else process.env.CALIBRA_DATA_DIR = originalEnvironment;
    const safe = path.resolve(temporary);
    if (!safe.startsWith(path.resolve(os.tmpdir()) + path.sep + "calibra-education-")) throw new Error("Invalid test cleanup path");
    await rm(safe, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
