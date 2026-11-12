const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');const edition=process.argv[2]||'personal';assert.ok(['personal','classroom'].includes(edition));
const directory=edition==='personal'?'CALIBRA':'CALIBRA-Classroom';
const local=path.join(root,'dist/package-qa',edition,'local'),app=path.join(local,'Programs',directory,'app'),data=path.join(local,directory);
let child;
const base=`http://127.0.0.1:${edition==='personal'?3106:4106}`;
async function call(route,options={}){return fetch(base+route,{...options,redirect:'manual',signal:AbortSignal.timeout(60000)})}
async function main(){
 const release=JSON.parse((await fs.readFile(path.join(data,'active-release.json'),'utf8')).replace(/^\uFEFF/,''));
 child=spawn(path.join(local,'Programs',directory,'node.exe'),[path.join(app,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',base.split(':').pop()],{cwd:app,env:{...process.env,AUTH_SECRET:(await fs.readFile(path.join(data,'auth-secret.txt'),'utf8')).trim(),CALIBRA_DATA_DIR:path.join(data,'files'),DATABASE_URL:'file:./dev.db',CALIBRA_BUILD_DIR:release.buildDir,CALIBRA_PREVIEW_MODE:'false',NODE_ENV:'production'},windowsHide:true,stdio:'ignore'});
 let ready=false;for(let i=0;i<100;i++){try{const health=await (await call('/api/health')).json();assert.equal(health.edition,edition);assert.equal(health.version,release.version);assert.equal(health.buildId,release.buildId);ready=true;break}catch{await new Promise(r=>setTimeout(r,500))}}assert.ok(ready,'Packaged app readiness');
 const token=(await fs.readFile(path.join(data,'files/setup/first-admin-token.txt'),'utf8')).trim();
 const form=new URLSearchParams({setupToken:token,displayName:'설치 검증',email:edition+'-package@example.invalid',password:'Package-QA-only-2026',confirmation:'Package-QA-only-2026'});
 const registered=await call('/api/setup',{method:'POST',headers:{Origin:base},body:form});assert.equal(registered.status,303,await registered.clone().text());const cookie=registered.headers.get('set-cookie').split(';')[0];
 const home=await call('/',{headers:{Cookie:cookie}});assert.equal(home.status,200);assert.ok((await home.text()).includes(release.version));
 const download=await call('/api/download/windows',{headers:{Cookie:cookie}});assert.equal(download.status,307);assert.ok(download.headers.get('location').includes(`CALIBRA-${edition==='personal'?'Personal':'Classroom'}-Setup-v${release.version}-20261112.zip`));
 const saved=await call('/api/education-data',{method:'POST',headers:{Cookie:cookie,Origin:base,'Content-Type':'application/json'},body:JSON.stringify({chart:'histogram',columns:['측정값'],rows:[['1'],['2']],title:'설치 검증용 합성 자료'})});assert.equal(saved.status,201,await saved.clone().text());
 for(const format of ['xlsx','pdf']){const response=await call('/api/board-export/shared-data',{method:'POST',headers:{Cookie:cookie,Origin:base,'Content-Type':'application/json'},body:JSON.stringify({all:true,format})});assert.equal(response.status,200,await response.clone().text());assert.ok((await response.arrayBuffer()).byteLength>500)}
 console.log(`PASS ${edition}: installed ZIP runtime/dependencies, first admin setup, home version, own download link, dataset save, Excel/PDF exports`);
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>child?.kill());
