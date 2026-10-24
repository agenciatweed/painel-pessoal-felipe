const sceneElement=document.querySelector('#unicorn-background');
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const scriptUrl='https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js';
let scenes=[],initialization;

async function initializeBackground(){
 if(initialization)return initialization;
 initialization=(async()=>{
  if(!window.UnicornStudio?.init){
   await new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=scriptUrl;script.async=true;
    script.onload=resolve;script.onerror=()=>reject(new Error('Unicorn Studio indisponível.'));
    document.head.append(script);
   });
  }
  scenes=await window.UnicornStudio.init();
  sceneElement.dataset.ready='true';
  if(motionPreference.matches)scenes.forEach(scene=>{scene.paused=true;});
 })().catch(()=>{sceneElement.dataset.ready='unavailable';});
 return initialization;
}

// Reduced-motion users keep the static brand-colored ground without loading WebGL.
if(!motionPreference.matches)initializeBackground();
motionPreference.addEventListener('change',()=>{
 if(!motionPreference.matches&&!initialization)initializeBackground();
 scenes.forEach(scene=>{scene.paused=motionPreference.matches;});
});
