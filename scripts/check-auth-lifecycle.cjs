const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {spawn,execFileSync}=require('node:child_process');const {DatabaseSync}=require('node:sqlite');
const syncFs=require('node:fs');
const root=path.resolve(__dirname,'..'),edition=process.argv[2]||'classroom';
assert.ok(['personal','classroom'].includes(edition));
const version=edition==='personal'?'0.1.5':'0.2.1',port=edition==='personal'?3115:4115;
const stage=path.join(root,'dist',`${edition}-v${version}-source`),qa=path.join(root,'dist','auth-qa',edition),base=`http://127.0.0.1:${port}`;
const cookieName=edition==='personal'?'calibra_session':'calibra_classroom_session',ticketName=edition==='personal'?'calibra_approval_ticket':'calibra_classroom_approval_ticket';
const password='Isolated-auth-QA-only-2026',email=`${edition}-signup@example.invalid`;let child,env;
const account=()=>{const db=new DatabaseSync(path.join(stage,'prisma/dev.db'),{readOnly:true});try{return db.prepare('SELECT * FROM UserAccount WHERE email=?').get(email)}finally{db.close()}};
async function call(route,options={}){return fetch(base+route,{...options,redirect:'manual',signal:AbortSignal.timeout(60000)})}
const cookie=(response,name)=>response.headers.getSetCookie().find(item=>item.startsWith(name+'='))?.split(';')[0];
async function start(){child=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:stage,env,windowsHide:true,stdio:['ignore','ignore',syncFs.openSync(path.join(qa,'server-error.log'),'a')]});for(let i=0;i<100;i++){try{const response=await call('/api/health');const health=await response.json();assert.equal(health.edition,edition);assert.equal(health.version,version);return}catch{await new Promise(r=>setTimeout(r,400))}}throw new Error('Auth candidate did not start')}
async function stop(){if(child){const old=child;child=null;await new Promise(resolve=>{old.once('exit',resolve);old.kill();setTimeout(resolve,1500)})}}
async function action(route,session,predicate){
 const page=await call(route,{headers:{Cookie:session}});assert.equal(page.status,200,`Action page ${route}`);const html=await page.text();
 const form=[...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/gi)].map(match=>match[0]).find(predicate);assert.ok(form,`Form on ${route}`);
 const data=new FormData();for(const input of form.matchAll(/<input\b[^>]*>/gi)){const name=input[0].match(/\bname="([^"]+)"/i)?.[1],value=input[0].match(/\bvalue="([^"]*)"/i)?.[1]||'';if(name)data.set(name.replaceAll('&amp;','&'),value.replaceAll('&amp;','&').replaceAll('&quot;','"'))}
 assert.ok([...data.keys()].some(key=>key.startsWith('$ACTION_')),'Real rendered server action identifier');
 const response=await call(route,{method:'POST',headers:{Cookie:session,Origin:base},body:data});assert.ok([303,307].includes(response.status),`Action status ${response.status}: ${await response.clone().text()}`);return response;
}
async function login(address=email,pass=password){return call('/api/auth/password',{method:'POST',body:new URLSearchParams({email:address,password:pass})})}
async function main(){
 await fs.mkdir(qa,{recursive:true});
 const testDb=path.join(stage,'prisma/dev.db');
 if(syncFs.existsSync(testDb)){
  assert.ok(testDb.startsWith(path.join(root,'dist')+path.sep));const previous=new DatabaseSync(testDb,{readOnly:true});
  try{assert.ok(previous.prepare('SELECT email FROM UserAccount').all().every(row=>row.email?.endsWith('@example.invalid')),'Only synthetic accounts may be reset');for(const table of ['Instrument','CalibrationRecord','ProcessQualification'])assert.equal(previous.prepare('SELECT COUNT(*) AS count FROM '+table).get().count,0,'No business data may be reset')}finally{previous.close()}
  const archived=path.join(qa,'previous-test-'+crypto.randomUUID()+'.db');await fs.rename(testDb,archived);
  for(const suffix of ['-wal','-shm'])if(syncFs.existsSync(testDb+suffix))await fs.rename(testDb+suffix,archived+suffix);
 }
 const secret=crypto.randomBytes(48).toString('hex');await fs.writeFile(path.join(qa,'auth-secret.txt'),secret);
 env={...process.env,AUTH_SECRET:secret,CALIBRA_DATA_DIR:path.join(qa,'files'),DATABASE_URL:'file:'+path.join(stage,'prisma/dev.db').replaceAll('\\','/'),CALIBRA_BUILD_DIR:'.calibra-build',CALIBRA_PREVIEW_MODE:'false',NODE_ENV:'production'};
 const initialized=JSON.parse(execFileSync(process.execPath,[path.join(stage,'scripts/initialize-local-data.cjs')],{env,encoding:'utf8'}));assert.equal(initialized.needsSetup,true,'Use only an isolated empty candidate database');await start();
 const fields={email:email.toUpperCase(),password,passwordConfirm:password,companyName:'합성 시험 회사',department:'가입 검증 부서',displayName:'가입 검증 사용자',employeeNo:`QA-${edition}-001`,phone:'QA-PHONE-0001'};
 const signup=body=>call('/api/auth/signup',{method:'POST',body:new URLSearchParams(body)});
 const beforeAdmin=await signup(fields);assert.equal(beforeAdmin.status,303,await beforeAdmin.clone().text());assert.ok(new URL(beforeAdmin.headers.get('location')).searchParams.has('error'));assert.equal(account(),undefined);
 const setupToken=(await fs.readFile(path.join(qa,'files/setup/first-admin-token.txt'),'utf8')).trim();
 const first=await call('/api/setup',{method:'POST',headers:{Origin:base},body:new URLSearchParams({setupToken,email:`${edition}-admin@example.invalid`,displayName:'시험 관리자',password,confirmation:password})});assert.equal(first.status,303);const admin=cookie(first,cookieName);assert.ok(admin);
 const lastAdmin=await action('/account',admin,form=>form.includes('탈퇴 및 계정정보 삭제'));assert.ok((lastAdmin.headers.get('location')||'').includes('error='),'Last admin remains registered');
 for(const route of ['/account','/settings/accounts'])assert.equal((await call(route,{headers:{Cookie:admin}})).status,200,`${edition} admin ${route}`);
 const invalid=await signup({...fields,passwordConfirm:'different'});assert.ok(new URL(invalid.headers.get('location')).searchParams.has('error'));assert.equal(account(),undefined);
 const registered=await signup(fields);assert.equal(registered.status,303);assert.equal(new URL(registered.headers.get('location')).searchParams.get('submitted'),'1');const ticket=cookie(registered,ticketName);assert.ok(ticket);assert.ok(registered.headers.getSetCookie().some(value=>value.startsWith(ticketName+'=')&&/httponly/i.test(value)&&/samesite=lax/i.test(value)));
 const pending=account();assert.equal(pending.email,email);assert.equal(pending.active,0);assert.equal(pending.role,'가입 대기');
 for(const key of ['companyName','department','displayName','employeeNo','phone'])assert.equal(pending[key],fields[key]);
 assert.notEqual(pending.passwordHash,password);const[salt,hash]=pending.passwordHash.split(':');assert.equal(crypto.scryptSync(password,salt,64).toString('hex'),hash);
 for(const response of await Promise.all([signup(fields),signup(fields)])){assert.equal(response.status,303);assert.ok(new URL(response.headers.get('location')).searchParams.has('error'))}
 assert.equal(cookie(await login(),cookieName),undefined);assert.equal((await call('/api/auth/approval-status')).status,401);
 assert.equal((await(await call('/api/auth/approval-status',{headers:{Cookie:ticket}})).json()).state,'pending');
 await action('/settings/accounts',admin,form=>form.includes(pending.id)&&form.includes('value="approve"'));
 const approved=await call('/api/auth/approval-status',{headers:{Cookie:ticket}});assert.equal((await approved.clone().json()).state,'approved');let session=cookie(approved,cookieName);assert.ok(session);assert.ok(approved.headers.getSetCookie().some(value=>value.startsWith(cookieName+'=')&&/httponly/i.test(value)&&/max-age=31536000/i.test(value)));
 const deniedBackup=await call('/api/backup',{headers:{Cookie:session}});assert.equal(deniedBackup.status,403,'Only administrator may download membership data');
 const backupResponse=await call('/api/backup',{headers:{Cookie:admin}});assert.equal(backupResponse.status,200,await backupResponse.clone().text());const backupFile=path.join(qa,'verified-backup.db');await fs.writeFile(backupFile,Buffer.from(await backupResponse.arrayBuffer()));const savedDb=new DatabaseSync(backupFile,{readOnly:true});try{assert.equal(savedDb.prepare('PRAGMA integrity_check').get().integrity_check,'ok');const saved=savedDb.prepare('SELECT * FROM UserAccount WHERE email=?').get(email);for(const key of ['companyName','department','displayName','employeeNo','phone','passwordHash'])assert.equal(saved[key],pending[key])}finally{savedDb.close()}
 const profile=await call('/account' ,{headers:{Cookie:session}});assert.equal(profile.status,200);const profileText=await profile.text();for(const key of ['companyName','department','displayName','employeeNo','phone'])assert.ok(profileText.includes(fields[key]),`Stored profile field ${key}`);
 assert.equal(cookie(await login(email,'wrong-password'),cookieName),undefined);const correct=await login();assert.equal(correct.status,303);assert.equal(new URL(correct.headers.get('location')).origin,base);assert.ok(cookie(correct,cookieName));
 const denied=await call('/settings/accounts',{headers:{Cookie:session}});if(![303,307].includes(denied.status)){const deniedHtml=await denied.text();assert.equal(denied.status,200);assert.ok(/NEXT_REDIRECT|http-equiv="refresh"/i.test(deniedHtml),'Streamed redirect must be present');assert.ok(deniedHtml.includes('/account'));assert.ok(!deniedHtml.includes('가입·탈퇴 및 사용자 관리'),'Admin records must not render for a user')}
 const logout=await action('/',session,form=>form.includes('로그아웃'));assert.ok(logout.headers.getSetCookie().some(value=>value.startsWith(cookieName+'=')&&(/max-age=0/i.test(value)||/1970/.test(value))));
 assert.ok([303,307].includes((await call('/account')).status));session=cookie(await login(),cookieName);
 await stop();env.AUTH_SECRET=(await fs.readFile(path.join(qa,'auth-secret.txt'),'utf8')).trim();await start();
 assert.equal((await call('/account',{headers:{Cookie:session}})).status,200,'Session and account survive server restart');
 const stored=account();for(const key of ['companyName','department','displayName','employeeNo','phone','passwordHash'])assert.equal(stored[key],pending[key]);
 await action('/settings/accounts',admin,form=>form.includes(pending.id)&&form.includes('value="suspend"'));
 assert.ok([303,307].includes((await call('/',{headers:{Cookie:session}})).status),'Suspended session must lose page access');
 for(const route of ['/api/instruments','/api/manual-images/qa-image.png'])assert.equal((await call(route,{headers:{Cookie:session}})).status,401,`Suspended ${route}`);
 assert.equal(cookie(await login(),cookieName),undefined);
 await action('/settings/accounts',admin,form=>form.includes(pending.id)&&form.includes('value="restore"'));assert.ok(cookie(await login(),cookieName));
 assert.equal((await call('/api/education-data',{headers:{Cookie:session+'tampered'}})).status,401);
 assert.equal((await call('/api/education-data',{headers:{Cookie:session.replace(cookieName,cookieName==='calibra_session'?'calibra_classroom_session':'calibra_session')}})).status,401);
 const result={edition,version,checks:['signup fields persisted; password salted+scrypt hashed','duplicate signup rejected without overwriting','real admin approval and user account pages','pending/approved ticket polling and sign-in','incorrect password and non-admin approval access rejected','logout clears browser session','profile and signed session survive restart with persistent secret','suspension blocks old cookies and dotted-file API paths','restore retains signup details','admin-only consistent backup retains all signup details','tampered and other-app cookies rejected']};
 await fs.writeFile(path.join(root,`.calibra-auth-${edition}-qa.json`),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(stop);
