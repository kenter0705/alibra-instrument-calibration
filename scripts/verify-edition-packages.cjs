const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const python='C:/Users/k_ent/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const code=String.raw`
import zipfile,json,hashlib,sys,pathlib
root=pathlib.Path(sys.argv[1])
editions=json.loads((root/'installer/editions.json').read_text(encoding='utf-8-sig'))
for edition,settings in editions.items():
 version=settings['version'];label='Classroom' if edition=='classroom' else 'Personal'
 filename=root/'public/downloads'/(settings['assetPrefix']+'-Setup-v'+version+'-20261112.zip')
 digest=hashlib.sha256(filename.read_bytes()).hexdigest()
 assert filename.with_suffix('.zip.sha256').read_text().split()[0]==digest
 with zipfile.ZipFile(filename) as z:
  names=z.namelist();assert len(names)==len(set(names)),'Duplicate ZIP entries'
  assert not any(n.lower().endswith(('.db','.sqlite','.db-wal','.db-shm','.db-journal')) or 'auth-secret' in n or 'first-admin-token' in n or '/.env' in n for n in names),'User material in public ZIP'
  training={'exterior-inspection-guide.html','moisture-meter-guide.html','spc-training-2026.pdf','visual-inspection-guide.html'}
  for n in names:
   if n.startswith('app/public/training/'):
    name=n.removeprefix('app/public/training/');assert name in training
    assert z.read(n)==(root/'public/training'/name).read_bytes(),'Public teaching original changed'
  pkg=json.loads(z.read('app/package.json').decode('utf-8-sig'));manifest=json.loads(z.read('active-release.json').decode('utf-8-sig'))
  assert pkg['version']==version and pkg['calibraEdition']==edition and manifest['edition']==edition
  build='app/'+manifest['buildDir'].replace('\\','/')+'/'
  assert z.read(build+'BUILD_ID').decode().strip()==manifest['buildId']
  assert z.read('Start-CALIBRA.ps1')==(root/'installer'/('Start-CALIBRA-'+label+'.ps1')).read_bytes()
  assert 'SETUP.exe' in names and 'junctions.json' in names and 'runtime/node.exe' in names
  assert 'app/scripts/initialize-local-data.cjs' in names and 'app/prisma/init.sql' in names
  samples=json.loads(z.read('app/public/example-data/manifest.json'))['samples']
  assert len(samples)==14
  for sample in samples:
   for name in sample['files']:
    assert hashlib.sha256(z.read('app/public/example-data/files/'+name)).hexdigest()==sample['sha256'][name.rsplit('.',1)[1]]
  import io
  with zipfile.ZipFile(io.BytesIO(z.read('app/public/example-data/CALIBRA-Sample-Data.zip'))) as examples:
   originals=[n for n in examples.namelist() if '/원본 샘플/' in n]
   assert len(originals)==42
   assert all(examples.getinfo(n).external_attr & 1 for n in originals),'Sample ZIP originals must be read-only'
  stage=root/'dist'/(edition+'-v'+version+'-source')
  for p in (stage/'src').rglob('*'):
   if p.is_file() and 'generated' not in p.parts:
    assert z.read('app/'+p.relative_to(stage).as_posix())==p.read_bytes(),'Source mismatch: '+str(p)
 print('PASS',edition,version,'identity, build, source, checksum, no user DB/keys/uploaded originals')
`;
execFileSync(python,['-c',code,root],{stdio:'inherit'});
