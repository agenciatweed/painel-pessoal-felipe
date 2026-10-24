import {get,put} from '@vercel/blob';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const local=process.env.PANEL_LOCAL==='1';
const root=new URL('../.local/data/',import.meta.url);
export const storage={
 async read(key){
  if(local){try{const raw=await readFile(new URL(key+'.json',root));return {data:JSON.parse(raw),etag:createHash('sha256').update(raw).digest('hex')};}catch(e){if(e.code==='ENOENT')return null;throw e;}}
  const result=await get(`panel/${key}.json`,{access:'private',useCache:false});
  if(!result)return null;
  if(result.statusCode!==200)throw new Error('Leitura privada indisponível.');
  return {data:await new Response(result.stream).json(),etag:result.blob.etag};
 },
 async write(key,data,{etag,createOnly=false}={}){
  const raw=JSON.stringify(data);
  if(local){
   const previous=await this.read(key);
   if((createOnly&&previous)||(etag&&previous?.etag!==etag)){const e=new Error('Conflito');e.conflict=true;throw e;}
   await mkdir(root,{recursive:true});await writeFile(new URL(key+'.json',root),raw);return;
  }
  try{await put(`panel/${key}.json`,raw,{access:'private',addRandomSuffix:false,allowOverwrite:!createOnly,contentType:'application/json',cacheControlMaxAge:0,...(etag?{ifMatch:etag}:{})});}
  catch(e){e.conflict=/precondition|already exists|etag|condition.*match/i.test(e.message||'');throw e;}
 }
};
