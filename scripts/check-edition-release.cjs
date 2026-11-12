const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {spawn,execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),node=process.execPath,cli=path.join(root,'node_modules/next/dist/bin/next');
const servers=[];
async function request(base,route,options={}){return fetch(base+route,{...options,redirect:'manual',signal:AbortSignal.timeout(60000)})}
async function setup(edition,version,port){
 const stage=path.join(root,'dist',`${edition}-v${version}-source`),files=path.join(root,'dist','classroom-qa',`fresh-${edition}`);
 const env={...process.env,AUTH_SECRET:crypto.randomBytes(48).toString('hex'),CALIBRA_DATA_DIR:files,DATABASE_URL:'file:'+path.join(stage,'prisma/dev.db').replaceAll('\\','/'),CALIBRA_BUILD_DIR:'.calibra-build',CALIBRA_PREVIEW_MODE:'false',NODE_ENV:'production'};
 const status=JSON.parse(execFileSync(node,[path.join(stage,'scripts/initialize-local-data.cjs')],{env,encoding:'utf8'}));
 assert.equal(status.needsSetup,true,'Only fresh isolated candidates may be used');
 const child=spawn(node,[cli,'start','--hostname','127.0.0.1','--port',String(port)],{cwd:stage,env,stdio:'ignore',windowsHide:true});servers.push(child);
 const base=`http://127.0.0.1:${port}`;
 let ready=false;for(let i=0;i<80;i++){try{const response=await request(base,'/api/health');const health=await response.json();assert.equal(health.edition,edition);assert.equal(health.version,version);ready=true;break}catch{await new Promise(r=>setTimeout(r,500))}}
 assert.ok(ready,'Candidate server must be ready');
 assert.equal((await request(base,'/api/setup',{method:'POST',headers:{Origin:base},body:new URLSearchParams()})).status,403);
 const token=(await fs.readFile(path.join(files,'setup/first-admin-token.txt'),'utf8')).trim();
 const body=new URLSearchParams({setupToken:token,displayName:'배포 검증 관리자',email:`${edition}@example.invalid`,password:'QA-only-'+crypto.randomBytes(10).toString('hex')});body.set('confirmation',body.get('password'));
 const created=await request(base,'/api/setup',{method:'POST',headers:{Origin:base},body});assert.equal(created.status,303,await created.clone().text());assert.equal(new URL(created.headers.get('location')).origin,base);
 const cookie=created.headers.get('set-cookie').split(';')[0];assert.ok(cookie.startsWith(edition==='classroom'?'calibra_classroom_session=':'calibra_session='));
 assert.equal((await request(base,'/api/setup',{method:'POST',headers:{Origin:base},body})).status,409);
 assert.equal((await request(base,'/',{headers:{Cookie:cookie}})).status,200);
 return {base,cookie};
}
async function main(){
 const classroom=await setup('classroom','0.2.0',4105),personal=await setup('personal','0.1.4',3105);
 assert.equal((await request(personal.base,'/api/education-data',{headers:{Cookie:classroom.cookie}})).status,401);
 assert.equal((await request(classroom.base,'/api/education-data',{headers:{Cookie:personal.cookie}})).status,401);
 assert.equal((await request(personal.base,'/api/network-settings',{method:'POST',headers:{Cookie:personal.cookie,Origin:personal.base,'Content-Type':'application/json'},body:'{"enabled":true}'})).status,403);
 const base='http://127.0.0.1:4104';const login=await request(base,'/api/auth/password',{method:'POST',body:new URLSearchParams({email:'classroom-qa-0@example.invalid',password:'classroom-QA-only-2026'})});assert.equal(login.status,303);const cookie=login.headers.get('set-cookie').split(';')[0];
 assert.equal((await request(base,'/api/board-export/posts')).status,401);
 assert.equal((await request(base,'/api/board-export/UserAccount',{headers:{Cookie:cookie}})).status,404);
 const list=await (await request(base,'/api/board-export/posts',{headers:{Cookie:cookie}})).json();assert.ok(list.records.length);
 for(const format of ['xlsx','pdf']){
  for(const selection of [{ids:[list.records[0].id]},{all:true}]){
   const response=await request(base,'/api/board-export/posts',{method:'POST',headers:{Cookie:cookie,Origin:base,'Content-Type':'application/json'},body:JSON.stringify({format,...selection})});assert.equal(response.status,200,await response.clone().text());const bytes=Buffer.from(await response.arrayBuffer());assert.ok(bytes.length>500);assert.ok(bytes.subarray(0,4).toString().startsWith(format==='pdf'?'%PDF':'PK'));
  }
 }
 console.log('PASS: both edition/version identities, fresh admin setup, host-preserving login, cookie isolation, personal sharing blocked, authenticated single/bulk XLSX and Korean PDF HTTP downloads');
}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>{for(const server of servers)server.kill()});
