import {timingSafeEqual} from 'node:crypto';
import {storage} from '../lib/storage.mjs';
import {mutateTask,applyTask} from '../lib/domain.mjs';
const same=(a,b)=>{const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length>0&&x.length===y.length&&timingSafeEqual(x,y);};
async function body(req){
 if(req.body!==undefined){const value=Buffer.isBuffer(req.body)?req.body.toString():req.body;return typeof value==='string'?JSON.parse(value):value;}
 const chunks=[];let length=0;for await(const c of req){length+=c.length;if(length>4_000_000)throw new Error('Conteúdo muito grande.');chunks.push(c);}return JSON.parse(Buffer.concat(chunks).toString());
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 const url=new URL(req.url,'https://panel.invalid');
 const route=req.query?.route||url.searchParams.get('route')||url.pathname.replace(/^\/api\//,'');
 const send=(status,data)=>res.status(status).json(data);
 try{
  if(route==='config'&&req.method==='GET')return send(200,{mapsKey:process.env.GOOGLE_MAPS_API_KEY||''});
  if(route==='dashboard'&&req.method==='GET'){
   const data=await storage.read('dashboard');return send(data?200:409,data?.data||{error:'Os primeiros dados ainda não foram sincronizados.'});
  }
  if(route==='tasks'&&req.method==='GET')return send(200,{tasks:(await storage.read('tasks'))?.data||[]});
  if(route==='tasks'&&req.method==='POST'){
   const origin=req.headers.origin;
   const forwarded=req.headers['x-forwarded-host']||req.headers.host;
   if(origin&&new URL(origin).host!==forwarded)return send(403,{error:'Atualize as tarefas pelo próprio painel.'});
   let command;try{command=await body(req);if(JSON.stringify(command).length>2000)throw new Error();applyTask([],command);}catch(e){return send(400,{error:e.message||'Tarefa inválida.'});}
   return send(200,{tasks:await mutateTask(storage,command)});
  }
  if(route==='ingest'&&req.method==='POST'){
   if(!process.env.PANEL_SYNC_SECRET||!same(req.headers.authorization,'Bearer '+process.env.PANEL_SYNC_SECRET))return send(401,{error:'Sincronização não autorizada.'});
   const data=await body(req);
   if(data?.version!==1||!Array.isArray(data.runs)||!Array.isArray(data.monthly)||!data.music?.windows||!data.coverage)return send(400,{error:'Exportação inválida.'});
   // Seed once. Later syncs can never overwrite tasks edited online.
   if(Array.isArray(data.initialTasks)&&!(await storage.read('tasks'))){
    let tasks=[];for(const t of data.initialTasks){tasks=applyTask(tasks,{action:'create',id:t.id,text:t.text},t.createdAt);if(t.completedAt)tasks.find(x=>x.id===t.id).completedAt=t.completedAt;}
    try{await storage.write('tasks',tasks,{createOnly:true});}catch(e){if(!e.conflict)throw e;}
   }
   delete data.initialTasks;await storage.write('dashboard',data);return send(200,{ok:true,runs:data.runs.length,updatedAt:data.generatedAt});
  }
  return send(404,{error:'Recurso não encontrado.'});
 }catch(e){return send(e.conflict?409:503,{error:e.conflict?'Outra edição ocorreu ao mesmo tempo. Tente novamente.':'Não foi possível acessar os dados. Tente atualizar em instantes.'});}
}
