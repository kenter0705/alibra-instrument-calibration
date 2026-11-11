const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const qa = path.join(root, 'dist', 'classroom-qa');
const { PrismaClient } = require(path.join(root, 'src/generated/prisma'));
const base = 'http://127.0.0.1:3104';
const password = 'classroom-QA-only-2026';

async function initialize() {
  await fs.mkdir(qa, { recursive: true });
  const { DatabaseSync } = require('node:sqlite');
  const sqlite = new DatabaseSync(path.join(qa, 'test.db'));
  sqlite.exec(`CREATE TABLE IF NOT EXISTS "UserAccount" (
    "id" TEXT NOT NULL PRIMARY KEY, "username" TEXT NOT NULL UNIQUE,
    "email" TEXT UNIQUE, "googleSubject" TEXT UNIQUE, "profileComplete" BOOLEAN NOT NULL DEFAULT true,
    "displayName" TEXT NOT NULL, "companyName" TEXT NOT NULL DEFAULT '', "department" TEXT NOT NULL DEFAULT '',
    "employeeNo" TEXT UNIQUE, "phone" TEXT NOT NULL DEFAULT '', "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT '교육생', "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  sqlite.close();
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
  const db = new PrismaClient();
  try {
    for (let i = 0; i < 25; i++) await db.userAccount.upsert({ where: { username: `classroom-qa-${i}` }, create: { username: `classroom-qa-${i}`, email: `classroom-qa-${i}@example.invalid`, displayName: `교육생 ${i}`, role: i === 0 ? '관리자' : '교육생', passwordHash: hash, active: true, profileComplete: true }, update: { passwordHash: hash, active: true } });
  } finally { await db.$disconnect(); }
  console.log('Initialized 25 synthetic accounts in test-only DB');
}
async function request(route, cookie, options = {}) {
  const response = await fetch(base + route, { ...options, redirect: 'manual', signal: AbortSignal.timeout(60000), headers: { ...(cookie ? { Cookie: cookie } : {}), ...(options.headers || {}) } });
  return response;
}
async function run() {
  const started = performance.now();
  const cookies = await Promise.all(Array.from({ length: 25 }, async (_, i) => {
    const response = await request('/api/auth/password', null, { method: 'POST', body: new URLSearchParams({ email: `classroom-qa-${i}@example.invalid`, password }) });
    assert.equal(response.status, 303);
    const cookie = response.headers.get('set-cookie')?.match(/calibra_session=[^;]+/)?.[0];
    assert.ok(cookie, `login ${i}`); return cookie;
  }));
  const loginMs = Math.round(performance.now() - started);
  const originalBytes = Buffer.from('측정값\n10.1\n10.2\n10.3', 'utf8');
  const form = new FormData(); form.set('chart', 'histogram'); form.set('title', '교육용 보존 원본'); form.set('file', new File([originalBytes], 'protected.csv', { type: 'text/csv' }));
  const imported = await request('/api/education-data/import', cookies[0], { method: 'POST', headers: { Origin: base }, body: form });
  assert.equal(imported.status, 201, await imported.clone().text());
  const original = await imported.json();
  const originalPath = path.join(qa, 'files/education-datasets', original.id + '.json');
  const before = await fs.readFile(originalPath);
  const pageRequests = await Promise.all(cookies.map(cookie => request('/shared-data', cookie)));
  pageRequests.forEach(response => assert.equal(response.status, 200));
  const reads = await Promise.all(cookies.map(cookie => request(`/api/education-data?id=${original.id}`, cookie)));
  for (const response of reads) { assert.equal(response.status, 200); assert.equal((await response.json()).id, original.id); }
  const timings = [];
  const copies = await Promise.all(cookies.map(async (cookie, i) => {
    const start = performance.now();
    const response = await request('/api/education-data', cookie, { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify({ chart: 'histogram', columns: ['측정값'], rows: [[String(i)], [String(i + 1)]], title: `동시 수정본 ${i}`, parentId: original.id }) });
    assert.equal(response.status, 201, await response.clone().text()); timings.push(performance.now() - start); return response.json();
  }));
  assert.equal(new Set(copies.map(copy => copy.id)).size, 25);
  assert.equal(new Set(copies.map(copy => copy.authorId)).size, 25);
  const list = await (await request('/api/education-data', cookies[1])).json();
  assert.equal(list.filter(item => item.parentId === original.id).length, 25);
  assert.deepEqual(await fs.readFile(originalPath), before);
  assert.deepEqual(await fs.readFile(path.join(qa, 'files/education-datasets/original-files', original.originalFile)), originalBytes);
  assert.equal((await request('/api/education-data')).status, 401);
  assert.equal((await request('/api/network-settings', cookies[1])).status, 403);
  const network = await request('/api/network-settings', cookies[0]); assert.equal(network.status, 200);
  assert.equal((await request('/api/network-settings', cookies[1], { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: '{"enabled":true}' })).status, 403);
  assert.equal((await request('/api/education-data', cookies[0], { method: 'POST', headers: { Origin: 'http://wrong.invalid', 'Content-Type': 'application/json' }, body: '{}' })).status, 403);
  assert.equal((await request('/api/education-data', cookies[0], { method: 'DELETE' })).status, 405);
  const invalid = { chart: 'p', columns: ['검사수량', '불량품수'], rows: [['1', '2'], ['1', '0']], title: '잘못된 입력' };
  assert.equal((await request('/api/education-data', cookies[0], { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify(invalid) })).status, 400);
  assert.equal((await request('/api/network-settings', cookies[0], { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: '{"enabled":true}' })).status, 200);
  assert.equal(JSON.parse(await fs.readFile(path.join(qa, 'network-settings.json'), 'utf8')).enabled, true);
  timings.sort((a, b) => a - b);
  const report = { users: 25, loginMs, saveP95Ms: Math.round(timings[23]), saveMaxMs: Math.round(timings[24]), totalMs: Math.round(performance.now() - started), checks: ['25 distinct account logins', '25 shared-page requests', '25 original-data loads', '25 concurrent Save As writes with distinct authors', 'original dataset and original upload bytes unchanged', 'unauthenticated, non-admin, cross-origin, delete and invalid-data requests rejected', 'admin sharing setting persisted only in test directory'] };
  await fs.writeFile(path.join(root, '.calibra-classroom-qa-report.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
}
(process.argv.includes('--initialize') ? initialize() : run()).catch(error => { console.error(error); process.exitCode = 1; });
