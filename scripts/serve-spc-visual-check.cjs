const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const file=path.resolve(__dirname,'../tmp/spc-visual/index.html');
http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');fs.createReadStream(file).pipe(res)}).listen(3119,'127.0.0.1',()=>console.log('Private static SVG verification server PID '+process.pid));
