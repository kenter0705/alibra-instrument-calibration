const fs=require('node:fs/promises'),sync=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite'),{spawn,execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),edition=process.argv[2];assert.ok(['personal','classroom'].includes(edition));
const version=edition==='personal'?'0.1.5':'0.2.1',stage=path.join(root,'dist',`${edition}-v${version}-source`),qa=path.join(root,'dist','sample-qa',edition,crypto.randomUUID()),port=edition==='personal'?3117:4117,base=`http://127.0.0.1:${port}`;let child;
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
async function main(){
 await fs.mkdir(path.join(qa,'scripts'),{recursive:true});await fs.mkdir(path.join(qa,'prisma'));await fs.mkdir(path.join(qa,'public'));
 for(const name of ['package.json','scripts/initialize-local-data.cjs','prisma/init.sql'])await fs.copyFile(path.join(stage,name),path.join(qa,name));
 await fs.cp(path.join(stage,'public/example-data'),path.join(qa,'public/example-data'),{recursive:true});
 const secret=crypto.randomBytes(48).toString('hex'),env={...process.env,AUTH_SECRET:secret,DATABASE_URL:'file:'+path.join(qa,'prisma/dev.db').replaceAll('\\','/'),CALIBRA_DATA_DIR:path.join(qa,'files'),CALIBRA_EXAMPLE_DIR:path.join(qa,'documents'),CALIBRA_BUILD_DIR:'.calibra-build',CALIBRA_PREVIEW_MODE:'false',NODE_ENV:'production'};
 const initialize=()=>JSON.parse(execFileSync(process.execPath,[path.join(qa,'scripts/initialize-local-data.cjs')],{env,encoding:'utf8',windowsHide:true}));
 assert.equal(initialize().readonlySamples,14);
 const id=crypto.randomUUID(),now=Date.now(),db=new DatabaseSync(path.join(qa,'prisma/dev.db'));
 try{db.prepare('INSERT INTO UserAccount(id,username,email,displayName,passwordHash,role,active,profileComplete,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,'sample-qa@example.invalid','sample-qa@example.invalid','원본 보호 검증','synthetic-unused-password-hash','관리자',1,1,now,now)}finally{db.close()}
 const payload=id+'.'+(now+3600000),cookie=(edition==='personal'?'calibra_session':'calibra_classroom_session')+'='+payload+'.'+crypto.createHmac('sha256',secret).update(payload).digest('base64url');
 const call=(route,options={})=>fetch(base+route,{...options,redirect:'manual',headers:{Cookie:cookie,Origin:base,...options.headers},signal:AbortSignal.timeout(60000)});
 child=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:stage,env,windowsHide:true,stdio:['ignore','ignore',sync.openSync(path.join(qa,'server.log'),'a')]});
 let ready=false;for(let i=0;i<100;i++){try{const h=await(await call('/api/health')).json();assert.equal(h.edition,edition);ready=true;break}catch{await new Promise(r=>setTimeout(r,400))}}assert.ok(ready);
 const manifest=JSON.parse(await fs.readFile(path.join(stage,'public/example-data/manifest.json'),'utf8')),hashes=new Map();
 for(const sample of manifest.samples){
  const masterFile=path.join(qa,'files/education-datasets',sample.id+'.json'),before=await fs.readFile(masterFile),master=JSON.parse(before);hashes.set(masterFile,digest(before));
  await assert.rejects(()=>fs.writeFile(masterFile,'overwrite'));
  for(const name of sample.files){
   const source=path.join(qa,'documents/원본 샘플',name),bytes=await fs.readFile(source);hashes.set(source,digest(bytes));await assert.rejects(()=>fs.writeFile(source,'overwrite'));
   const form=new FormData();form.set('file',new File([bytes],name));form.set('chart','fishbone');form.set('title',path.parse(name).name);
   const response=await call('/api/education-data/import',{method:'POST',body:form});assert.equal(response.status,201,await response.clone().text());const imported=await response.json();
   assert.equal(imported.chart,master.chart);assert.deepEqual(imported.columns,master.columns);assert.equal(imported.unit,master.unit);assert.equal(imported.lowerSpec,master.lowerSpec);assert.equal(imported.upperSpec,master.upperSpec);
   assert.equal(imported.rows.length,master.rows.length);for(let r=0;r<master.rows.length;r++)for(let c=0;c<master.columns.length;c++){const a=imported.rows[r][c],b=master.rows[r][c];assert.ok(a===b||(a.trim()&&b.trim()&&Number.isFinite(Number(a))&&Number(a)===Number(b)),name)}
   assert.deepEqual(await fs.readFile(path.join(qa,'files/education-datasets/original-files',imported.originalFile)),bytes);
  }
  for(const title of [master.title,master.title+'.JSON','  '+master.title+'  ']){const response=await call('/api/education-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...master,parentId:master.id,title})});assert.equal(response.status,400)}
  const response=await call('/api/education-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...master,parentId:master.id,title:master.title+'_검증수정본'})});assert.equal(response.status,201);const copy=await response.json();assert.notEqual(copy.id,master.id);assert.equal(copy.parentId,master.id);assert.equal(copy.kind,'copy');
 }
 assert.equal((await call('/api/education-data',{method:'PUT',headers:{'Content-Type':'application/json'},body:'{}'})).status,405);
 assert.equal(initialize().created,false);for(const [file,hash] of hashes)assert.equal(digest(await fs.readFile(file)),hash);
 const html=await(await call('/shared-data')).text();for(const text of ['원본 샘플 불러오기','예시 데이터 폴더 내려받기','사본으로 수정'])assert.ok(html.includes(text),text);
 const result={edition,version,templates:14,imports:42,checks:['read-only physical originals reject writes','JSON/CSV/XLSX auto-detect correct graph, rows, limits and units','same-name Save As rejected','14 new copies with separate IDs','PUT overwrite unavailable','reinitialization preserves all original hashes','common data-load UI visible']};console.log(JSON.stringify(result));await fs.writeFile(path.join(root,`.calibra-sample-${edition}-qa.json`),JSON.stringify(result,null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>child?.kill());
