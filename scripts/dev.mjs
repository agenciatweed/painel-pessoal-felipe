import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
process.env.PANEL_LOCAL='1';
const {default:handler}=await import('../api/panel.mjs');
const root=resolve('public');
http.createServer(async(req,res)=>{
 res.status=n=>(res.statusCode=n,res);res.json=d=>{res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(d));};
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.startsWith('/api/'))return await handler(req,res);
  const path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!path.startsWith(root+sep)){res.writeHead(403);return res.end();}
  const ext=path.split('.').at(-1);res.setHeader('Content-Type',({html:'text/html; charset=utf-8',css:'text/css',js:'text/javascript',svg:'image/svg+xml',ttf:'font/ttf'})[ext]||'application/octet-stream');res.end(await readFile(path));
 }catch{res.statusCode=404;res.end('Não encontrado.');}
}).listen(8793,'127.0.0.1',()=>console.log('Painel em http://127.0.0.1:8793'));
