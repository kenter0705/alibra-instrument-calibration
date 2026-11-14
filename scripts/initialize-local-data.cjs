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
const sampleRoot=path.join(root,'public','example-data');
const mastersFile=path.join(sampleRoot,'master-records.json');
let sampleCount=0;
function immutableFile(destination,bytes,atomic=true){
 if(fs.existsSync(destination))return false;
 fs.mkdirSync(path.dirname(destination),{recursive:true});
 if(!atomic){try{fs.writeFileSync(destination,bytes,{flag:'wx'});fs.chmodSync(destination,0o444);return true}catch(error){if(error.code==='EEXIST')return false;throw error}}
 const temporary=destination+'.'+crypto.randomUUID()+'.tmp';
 fs.writeFileSync(temporary,bytes,{flag:'wx'});
 let added=false;
 try{fs.linkSync(temporary,destination);added=true}catch(error){if(error.code!=='EEXIST')throw error}finally{fs.unlinkSync(temporary)}
 if(added)fs.chmodSync(destination,0o444);
 return added;
}
if(fs.existsSync(mastersFile)){
 const masters=JSON.parse(fs.readFileSync(mastersFile,'utf8'));
 const manifest=JSON.parse(fs.readFileSync(path.join(sampleRoot,'manifest.json'),'utf8'));
 for(const record of masters){
  if(!/^f0000000-0000-4000-8000-\d{12}$/.test(record.id)||record.authorId!=='calibra-sample-master')throw new Error('Invalid builtin sample identity');
  const sample=manifest.samples.find(item=>item.id===record.id);
  const jsonName=sample.files.find(name=>name.endsWith('.json'));
  if(path.basename(jsonName)!==jsonName)throw new Error('Invalid builtin sample path');
  const original=fs.readFileSync(path.join(sampleRoot,'files',jsonName));
  immutableFile(path.join(files,'education-datasets','original-files',record.originalFile),original);
  immutableFile(path.join(files,'education-datasets',record.id+'.json'),JSON.stringify(record));
  sampleCount++;
 }
 const examples=process.env.CALIBRA_EXAMPLE_DIR;
 if(examples){
  if(!path.isAbsolute(examples))throw new Error('An absolute sample folder is required');
  fs.mkdirSync(path.join(examples,'내 저장 데이터'),{recursive:true});
  for(const sample of manifest.samples)for(const name of sample.files){if(path.basename(name)!==name)throw new Error('Invalid example filename');immutableFile(path.join(examples,'원본 샘플',name),fs.readFileSync(path.join(sampleRoot,'files',name)),false)}
  immutableFile(path.join(examples,'사용 안내.txt'),fs.readFileSync(path.join(sampleRoot,'예시 데이터 안내.txt')),false);
 }
}
console.log(JSON.stringify({ edition, version: pkg.version, created, needsSetup, readonlySamples:sampleCount }));
