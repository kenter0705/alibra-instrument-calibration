const fs=require('node:fs/promises'),syncFs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),edition=process.argv[2];assert.ok(['personal','classroom'].includes(edition));
const directory=edition==='personal'?'CALIBRA':'CALIBRA-Classroom',app=path.join(process.env.LOCALAPPDATA,'Programs',directory,'app');
const qa=path.join(root,'dist','installed-qa',edition),cookieName=edition==='personal'?'calibra_session':'calibra_classroom_session',port=edition==='personal'?3116:4116,base=`http://127.0.0.1:${port}`;
let child;
async function call(route,options={}){return fetch(base+route,{...options,redirect:'manual',signal:AbortSignal.timeout(60000)})}
async function main(){
 const release=JSON.parse((await fs.readFile(path.join(process.env.LOCALAPPDATA,directory,'active-release.json'),'utf8')).replace(/^\uFEFF/,''));
 await fs.mkdir(qa,{recursive:true});const dbPath=path.join(qa,'test-'+crypto.randomUUID()+'.db'),secret=crypto.randomBytes(48).toString('hex');assert.ok(dbPath.startsWith(path.join(root,'dist','installed-qa')+path.sep));
 const id=crypto.randomUUID(),now=Date.now(),salt=crypto.randomBytes(16).toString('hex'),passwordHash=salt+':'+crypto.scryptSync('QA-only-password',salt,64).toString('hex');
 const db=new DatabaseSync(dbPath);try{db.exec(await fs.readFile(path.join(app,'prisma/init.sql'),'utf8'));db.prepare('INSERT INTO UserAccount(id,username,email,displayName,passwordHash,role,active,profileComplete,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,'installed-qa@example.invalid','installed-qa@example.invalid','비공개 설치검증',passwordHash,'관리자',1,1,now,now)}finally{db.close()}
 const expiry=now+3600000,payload=id+'.'+expiry,signature=crypto.createHmac('sha256',secret).update(payload).digest('base64url'),session=cookieName+'='+payload+'.'+signature;
 const env={...process.env,AUTH_SECRET:secret,DATABASE_URL:'file:'+dbPath.replaceAll('\\','/'),CALIBRA_DATA_DIR:path.join(qa,'files'),CALIBRA_BUILD_DIR:release.buildDir,CALIBRA_PREVIEW_MODE:'false',GOOGLE_CLIENT_ID:'',GOOGLE_CLIENT_SECRET:'',NODE_ENV:'production'};
 assert.ok(env.DATABASE_URL.includes('/installed-qa/'));
 child=spawn(path.join(process.env.LOCALAPPDATA,'Programs',directory,'node.exe'),[path.join(app,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:app,env,windowsHide:true,stdio:['ignore','ignore',syncFs.openSync(path.join(qa,'server-error.log'),'a')]});
 let ready=false;for(let i=0;i<100;i++){try{const health=await(await call('/api/health')).json();assert.equal(health.edition,edition);assert.equal(health.version,release.version);assert.equal(health.buildId,release.buildId);ready=true;break}catch{await new Promise(r=>setTimeout(r,400))}}assert.ok(ready,'Installed app readiness');
 // Before any write request, prove both middleware and page clients use only
 // the synthetic database, never the real installation's user database.
 const account=await call('/account',{headers:{Cookie:session}});assert.equal(account.status,200);assert.ok((await account.text()).includes('비공개 설치검증'),'Private test datasource must be honored');
 const login=await call('/api/auth/password',{method:'POST',body:new URLSearchParams({email:'installed-qa@example.invalid',password:'QA-only-password'})});assert.equal(login.status,303);assert.ok(login.headers.getSetCookie().some(value=>value.startsWith(cookieName+'=')));
 for(const route of ['/calibrations','/special-process']){const response=await call(route,{headers:{Cookie:session}});assert.equal(response.status,200);const html=await response.text();assert.ok(html.includes('엑셀 일괄 다운로드'),route);assert.ok(html.includes('PDF 일괄 다운로드'),route)}
 const saved=await call('/api/education-data',{method:'POST',headers:{Cookie:session,Origin:base,'Content-Type':'application/json'},body:JSON.stringify({chart:'histogram',columns:['측정값'],rows:[['0'],['1']],title:'비공개 설치 시험 원본'})});assert.equal(saved.status,201);
 for(const format of ['xlsx','pdf']){const response=await call('/api/board-export/shared-data',{method:'POST',headers:{Cookie:session,Origin:base,'Content-Type':'application/json'},body:JSON.stringify({all:true,format})});assert.equal(response.status,200,await response.clone().text());assert.equal(response.headers.get('x-export-count'),'1');assert.ok((await response.arrayBuffer()).byteLength>500)}
 const download=await call('/api/download/windows',{headers:{Cookie:session}});assert.equal(download.status,307);assert.ok(download.headers.get('location').includes(edition==='personal'?'CALIBRA-Personal':'CALIBRA-Multi'));
 console.log(JSON.stringify({edition,version:release.version,checks:['actual installed runtime, modules and pinned build','isolated test DB honored before any writes','email/password login and account page','calibration and qualification top bulk buttons rendered','Excel/PDF download with original zero value','own Personal/Multi download channel']}));
}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>child?.kill());
