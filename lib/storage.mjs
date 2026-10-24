import {get,put,head,BlobPreconditionFailedError} from '@vercel/blob';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const local=process.env.PANEL_LOCAL==='1';
const root=new URL('../.local/data/',import.meta.url);
export const storage={
 async read(key){
  if(local){try{const raw=await readFile(new URL(key+'.json',root));return {data:JSON.parse(raw),etag:createHash('sha256').update(raw).digest('hex')};}catch(e){if(e.code==='ENOENT')return null;throw e;}}
  const pathname=`panel/${key}.json`;
  const result=await get(pathname,{access:'private',useCache:false,headers:{'Accept-Encoding':'identity'}});
  if(!result)return null;
  if(result.statusCode!==200)throw new Error('Leitura privada indisponível.');
  const data=await new Response(result.stream).json();
  // Content delivery may return a weak/compressed HTTP ETag. Use the storage
  // control-plane ETag, paired with a second read to detect intervening writes.
  if(key==='tasks'){
   const metadata=await head(pathname);
   const check=await get(pathname,{access:'private',useCache:false,headers:{'Accept-Encoding':'identity'}});
   if(!check||check.statusCode!==200)throw new Error('Leitura privada indisponível.');
   const confirmed=await new Response(check.stream).json();
   if(JSON.stringify(data)!==JSON.stringify(confirmed)){const e=new Error('Conflito na leitura');e.conflict=true;throw e;}
   return {data,etag:metadata.etag};
  }
  return {data,etag:result.blob.etag};
 },
 async write(key,data,{etag,createOnly=false}={}){
  const raw=JSON.stringify(data);
  if(local){
   const previous=await this.read(key);
   if((createOnly&&previous)||(etag&&previous?.etag!==etag)){const e=new Error('Conflito');e.conflict=true;throw e;}
   await mkdir(root,{recursive:true});await writeFile(new URL(key+'.json',root),raw);return;
  }
  try{await put(`panel/${key}.json`,raw,{access:'private',addRandomSuffix:false,allowOverwrite:!createOnly,contentType:'application/json',cacheControlMaxAge:0,...(etag?{ifMatch:etag}:{})});}
  catch(e){e.conflict=e instanceof BlobPreconditionFailedError||/already exists/i.test(e.message||'');console.error('private-storage-write',JSON.stringify({name:e.name,message:e.message}));throw e;}
 }
};
