export function formatPace(seconds){
 if(!Number.isFinite(seconds)||seconds<=0)return '—';
 const n=Math.round(seconds);return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;
}
export function applyTask(tasks,command,now=Date.now()){
 const next=structuredClone(tasks);
 if(!command||!['create','complete','delete'].includes(command.action))throw new Error('Ação inválida.');
 if(typeof command.id!=='string'||!/^[-\w]{1,80}$/.test(command.id))throw new Error('Identificador inválido.');
 if(command.action==='complete'&&typeof command.completed!=='boolean')throw new Error('Estado inválido.');
 const index=next.findIndex(t=>t.id===command.id);
 if(command.action==='create'){
  if(index>=0)return next;
  const text=typeof command.text==='string'?command.text.trim():'';
  if(!text||text.length>300)throw new Error('Escreva uma tarefa com até 300 caracteres.');
  if(next.length>=1000)throw new Error('Limite de 1.000 tarefas atingido. Exclua tarefas antigas.');
  next.push({id:command.id,text,createdAt:now,completedAt:null});
 }else if(index>=0){
  if(command.action==='delete')next.splice(index,1);
  else next[index].completedAt=command.completed?(next[index].completedAt||now):null;
 }
 return next;
}
export async function mutateTask(store,command){
 for(let n=0;n<5;n++){
  try{const current=await store.read('tasks');const tasks=applyTask(current?.data||[],command);await store.write('tasks',tasks,{etag:current?.etag,createOnly:!current});return tasks;}
  catch(e){if(!e.conflict||n===4)throw e;}
 }
}
