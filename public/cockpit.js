const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let activeTransition,epoch=0,trigger;
export async function expandRun(id){
 const dialog=document.querySelector('#run-dialog');
 trigger=document.querySelector(`[data-run="${CSS.escape(id)}"]`);
 if(dialog.open)return;
 if(!document.startViewTransition||reduceMotion()||!trigger){dialog.showModal();return;}
 activeTransition?.skipTransition();const version=++epoch;
 trigger.style.viewTransitionName='run-focus';
 activeTransition=document.startViewTransition(()=>{
  trigger.style.viewTransitionName='none';dialog.style.viewTransitionName='run-focus';dialog.showModal();
 });
 activeTransition.finished.catch(()=>{}).finally(()=>{if(epoch===version){dialog.style.viewTransitionName='';if(trigger?.isConnected)trigger.style.viewTransitionName='';}});
 await activeTransition.updateCallbackDone;
}
export function collapseRun(){
 const dialog=document.querySelector('#run-dialog');
 if(!dialog.open)return;
 if(!document.startViewTransition||reduceMotion()||!trigger?.isConnected){dialog.close();return;}
 activeTransition?.skipTransition();const version=++epoch;
 dialog.style.viewTransitionName='run-focus';trigger.style.viewTransitionName='none';
 activeTransition=document.startViewTransition(()=>{dialog.style.viewTransitionName='none';dialog.close();trigger.style.viewTransitionName='run-focus';});
 activeTransition.finished.catch(()=>{}).finally(()=>{if(epoch===version){dialog.style.viewTransitionName='';if(trigger?.isConnected)trigger.style.viewTransitionName='';}});
}
export function chartSnapshot(root){
 return new Map([...root.querySelectorAll('[data-motion-key]')].map(el=>[el.dataset.motionKey,Object.fromEntries(['x','y','width','height','cx','cy','d'].filter(k=>el.hasAttribute(k)).map(k=>[k,el.getAttribute(k)]))]));
}
export function animateCharts(root,previous){
 if(reduceMotion()||!previous.size)return;
 for(const el of root.querySelectorAll('[data-motion-key]')){
  const old=previous.get(el.dataset.motionKey);if(!old)continue;
  const from={},to={};
  for(const [key,value]of Object.entries(old)){
   const next=el.getAttribute(key);if(next===value||next===null)continue;
   if(key==='d'){if(CSS.supports('d',`path("${next}")`)){from.d=`path("${value}")`;to.d=`path("${next}")`;}}
   else{from[key]=value+'px';to[key]=next+'px';}
  }
  if(Object.keys(from).length)el.animate([from,to],{duration:360,easing:'cubic-bezier(.16,1,.3,1)'});
 }
}
