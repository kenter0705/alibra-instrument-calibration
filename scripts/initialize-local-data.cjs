// Creates an EMPTY database only. Existing databases are never migrated or seeded.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const edition = pkg.calibraEdition === 'classroom' ? 'classroom' : 'personal';
const dbPath = path.join(root, 'prisma', 'dev.db');
const files = process.env.CALIBRA_DATA_DIR;
if (!files || !path.isAbsolute(files)) throw new Error('An absolute CALIBRA_DATA_DIR is required');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
fs.mkdirSync(files, { recursive: true });
let created = false;
if (!fs.existsSync(dbPath)) {
  const temporary = dbPath + '.' + crypto.randomUUID() + '.tmp';
  const fresh = new DatabaseSync(temporary);
  try { fresh.exec(fs.readFileSync(path.join(root, 'prisma', 'init.sql'), 'utf8')); }
  finally { fresh.close(); }
  // An exclusive copy prevents a racing initializer from replacing an existing DB.
  try { fs.copyFileSync(temporary, dbPath, fs.constants.COPYFILE_EXCL); created = true; }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  finally { fs.unlinkSync(temporary); }
}
const db = new DatabaseSync(dbPath, { readOnly: true });
let needsSetup;
try { needsSetup = db.prepare('SELECT COUNT(*) AS count FROM UserAccount').get().count === 0; }
finally { db.close(); }
// Token is never returned in stdout. Only the local desktop launcher reads it.
if (needsSetup) {
  const setup = path.join(files, 'setup'); fs.mkdirSync(setup, { recursive: true });
  const token = path.join(setup, 'first-admin-token.txt');
  try { fs.writeFileSync(token, crypto.randomBytes(32).toString('hex'), { flag: 'wx', mode: 0o600 }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
}
console.log(JSON.stringify({ edition, version: pkg.version, created, needsSetup }));
