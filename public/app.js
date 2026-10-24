import {expandRun,collapseRun,chartSnapshot,animateCharts} from './cockpit.js';
const $=s=>document.querySelector(s);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(n,d=1)=>typeof n==='number'&&Number.isFinite(n)?n.toLocaleString('pt-BR',{maximumFractionDigits:d,minimumFractionDigits:d}):'—';
const pace=s=>{if(!Number.isFinite(s)||s<=0)return '—';const n=Math.round(s);return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;};
const duration=s=>{const n=Math.round(s||0);return n>=3600?`${Math.floor(n/3600)}h ${String(Math.floor(n%3600/60)).padStart(2,'0')}min`:`${Math.floor(n/60)}min ${String(n%60).padStart(2,'0')}s`;};
const date=s=>s?new Date(s.slice(0,10)+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}):'—';
const updated=s=>s?new Date(s).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'}):'sem atualização';
const month=s=>new Date(s+'-01T12:00:00').toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}).replace('.','');
let data,tasks=[],shown=10,saving=false,mapsPromise,activeMap,activePolyline,selectedRun;
async function api(path,body){const response=await fetch('/api/'+path,{cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Não foi possível carregar os dados.');return result;}
const trash='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"/></svg>';
const arrow='<svg class="arrow-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>';
function renderTasks(){
 const open=tasks.filter(t=>!t.completedAt),done=tasks.filter(t=>t.completedAt).sort((a,b)=>b.completedAt-a.completedAt);
 const row=t=>`<li class="task-row ${t.completedAt?'done':''} ${t.pending?'pending':''}"><label><input type="checkbox" data-complete="${escape(t.id)}" ${t.completedAt?'checked':''} ${saving?'disabled':''}><span>${escape(t.text)}</span></label><button class="icon-button delete-task" data-delete="${escape(t.id)}" aria-label="Excluir ${escape(t.text)}" ${saving?'disabled':''}>${trash}</button></li>`;
 $('#tasks').innerHTML=open.map(row).join('')||'<li class="empty">Tudo em dia. Espaço para o que vem a seguir.</li>';
 $('#completed-tasks').innerHTML=done.map(row).join('')||'<li class="empty">As tarefas concluídas aparecem aqui.</li>';
 $('#task-count').textContent=open.length;$('#completed-count').textContent=done.length;
 document.querySelectorAll('[data-complete]').forEach(el=>el.addEventListener('change',()=>saveTask({action:'complete',id:el.dataset.complete,completed:el.checked})));
 document.querySelectorAll('[data-delete]').forEach(el=>el.addEventListener('click',()=>saveTask({action:'delete',id:el.dataset.delete})));
}
async function saveTask(command){
 if(saving)return; saving=true;const previous=structuredClone(tasks);
 if(command.action==='create')tasks.push({id:command.id,text:command.text,createdAt:Date.now(),completedAt:null,pending:true});
 else if(command.action==='delete')tasks=tasks.filter(t=>t.id!==command.id);
 else tasks=tasks.map(t=>t.id===command.id?{...t,completedAt:command.completed?Date.now():null,pending:true}:t);
 renderTasks();$('#task-form button').disabled=true;$('#task-status').textContent='Salvando…';
 try{tasks=(await api('tasks',command)).tasks;if(command.action==='create')$('#task-input').value='';$('#task-status').textContent='Salvo online.';}
 catch(e){tasks=previous;$('#task-status').textContent=e.message+' Tente novamente.';}
 finally{saving=false;renderTasks();$('#task-form button').disabled=false;}
}
function renderRuns(){
 const runs=data.runs;$('#run-count').textContent=runs.length;
 $('#run-coverage').textContent=runs.length?`Dados disponíveis: ${date(data.coverage.firstRun)} a ${date(data.coverage.lastRun)}. Histórico em coleta.`:'Histórico ainda não coletado.';
 $('#runs').innerHTML=runs.slice(0,shown).map(r=>`<button class="run" data-run="${escape(r.id)}"><span class="run-top"><span>${escape(date(r.date))}</span><span>${escape(r.date.slice(11,16))}</span></span><div class="run-name">${escape(r.name)}</div><div class="run-metrics"><div><strong>${num(r.km)}</strong><small>quilômetros</small></div><div><strong>${pace(r.pace)}</strong><small>min/km</small></div><div><strong>${num(r.hr,0)}</strong><small>bpm</small></div><span class="run-arrow">${arrow}</span></div></button>`).join('')||'<p class="empty">Nenhuma corrida ao ar livre disponível.</p>';
 $('#more-runs').hidden=runs.length<=shown;
 document.querySelectorAll('[data-run]').forEach(el=>el.addEventListener('click',()=>openRun(el.dataset.run)));
}
function renderMusic(){
 for(const days of [7,30]){
  const tracks=data.music.windows[String(days)]||[];
  $('#music-'+days).innerHTML=tracks.map(t=>`<li class="track"><div class="track-info"><a href="https://www.last.fm/music/${encodeURIComponent(t.artist)}/_/${encodeURIComponent(t.track)}" target="_blank" rel="noopener noreferrer">${escape(t.track)}</a><div class="track-artist">${escape(t.artist)}</div></div><span class="plays" aria-label="${t.plays} reproduções" title="${t.plays} reproduções">${num(t.plays,0)}</span></li>`).join('')||'<li class="empty">Nenhuma reprodução coletada neste período.</li>';
  $(days===7?'#week-count':'#month-count').textContent=`${num(data.music.counts[String(days)],0)} plays`;
 }
 $('#music-updated').textContent=`Janelas calculadas até ${updated(data.music.windowEndsAt)}. Última música registrada: ${updated(data.music.lastScrobbleAt)}.`;
}
function chartMonths(){
 if(!data.monthly.length)return [];
 const source=new Map(data.monthly.map(m=>[m.month,m]));const last=data.monthly.at(-1).month;
 let cursor=data.monthly[0].month,values=[];
 while(cursor<=last){values.push(source.get(cursor)||{month:cursor,missing:true});const d=new Date(cursor+'-01T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+1);cursor=d.toISOString().slice(0,7);}
 const count=Number($('#months').value);return count?values.slice(-count):values;
}
function renderCharts(){
 const previous=chartSnapshot($('#charts'));
 const values=chartMonths();
 if(!values.length){$('#charts').innerHTML='<p class="empty">A evolução aparecerá após a primeira coleta Garmin.</p>';return;}
 $('#chart-coverage').textContent=`${month(values[0].month)} a ${month(values.at(-1).month)} · pontos atenuados indicam mês incompleto. Lacunas indicam ausência de coleta.`;
 $('#charts').innerHTML=[['volume','Distância','km','totalKm',v=>num(v)+' km'],['pace','Pace médio','min/km','pace',v=>pace(v)+'/km'],['hr','FC média','bpm','hr',v=>num(v,0)+' bpm']].map(([id,title,unit,key,fmt])=>{
  const width=Math.max(300,Math.round($('#charts').clientWidth)),height=156,left=34,right=8,top=10,bottom=28,plot=width-left-right,ph=height-top-bottom;
  const actual=values.filter(v=>!v.missing&&Number.isFinite(v[key]));
  if(!actual.length)return `<section class="chart-block"><div class="chart-title"><h3>${title}</h3><span>${unit}</span></div><p class="empty">Sem dados coletados.</p></section>`;
  const max=Math.max(...actual.map(v=>v[key]),id==='volume'?1:0),min=id==='volume'?0:Math.min(...actual.map(v=>v[key]));
  const lo=id==='volume'?0:Math.max(0,min-(max-min||max*.08)*.2),hi=max+(max-min||max*.08)*.18;
  const y=v=>top+ph-(v-lo)/(hi-lo||1)*ph;
  const step=plot/values.length,x=i=>left+step*(i+.5);
  let shapes='',path='';
  values.forEach((v,i)=>{
   if(v.missing||!Number.isFinite(v[key])){path='';return;}
   const tip=`${month(v.month)} · ${fmt(v[key])}${id==='volume'?` · média ${num(v.avgKm)} km/treino`:''}${v.complete?'':' · coleta parcial'}`;
   if(id==='volume'){
    shapes+=`<rect data-motion-key="${id}-${v.month}" data-point="${v.month}" class="bar ${v.complete?'':'partial'}" x="${x(i)-step*.26}" y="${y(v[key])}" width="${step*.52}" height="${top+ph-y(v[key])}" rx="2"><title>${escape(tip)}</title></rect>`;
   }else{
    if(path)shapes+=`<path data-motion-key="${id}-line-${v.month}" class="trend" d="M${path} L${x(i)},${y(v[key])}"/>`;
    path=`${x(i)},${y(v[key])}`;
    shapes+=`<circle data-motion-key="${id}-${v.month}" data-point="${v.month}" class="dot ${v.complete?'':'partial'}" cx="${x(i)}" cy="${y(v[key])}" r="3.5"><title>${escape(tip)}</title></circle>`;
   }
  });
  const hits=values.map((v,i)=>v.missing||!Number.isFinite(v[key])?'':`<rect class="chart-hit" x="${left+i*step}" y="${top}" width="${step}" height="${ph}" tabindex="0" role="img" data-month="${v.month}" aria-label="${escape(month(v.month)+' · '+fmt(v[key])+(id==='volume'?' · média '+num(v.avgKm)+' km/treino':'')+(v.complete?'':' · coleta parcial'))}" data-tip="${escape(month(v.month)+' · '+fmt(v[key])+(id==='volume'?' · média '+num(v.avgKm)+' km/treino':'')+(v.complete?'':' · coleta parcial'))}"></rect>`).join('');
  // Average distance shares the km axis, so both series keep their real units.
  if(id==='volume'){
   let prev;
   values.forEach((v,i)=>{if(v.missing){prev=null;return;}const point=`${x(i)},${y(v.avgKm)}`;if(prev)shapes+=`<path d="M${prev} L${point}" fill="none" stroke="#f6f7fa" stroke-width="1.6"/>`;shapes+=`<circle cx="${x(i)}" cy="${y(v.avgKm)}" r="2.5" fill="#f6f7fa"/>`;prev=point;});
  }
  const grid=[0,.5,1].map(t=>{const v=lo+(hi-lo)*t,yy=y(v);return `<line class="grid" x1="${left}" y1="${yy}" x2="${width-right}" y2="${yy}"/><text x="${left-6}" y="${yy+3}" text-anchor="end">${id==='pace'?pace(v):num(v,0)}</text>`;}).join('');
  const labelIndices=new Set([0,Math.round((values.length-1)/3),Math.round(2*(values.length-1)/3),values.length-1]);
  const labels=values.map((v,i)=>labelIndices.has(i)?`<text x="${x(i)}" y="${height-6}" text-anchor="middle">${escape(month(v.month))}</text>`:'').join('');
  const table=values.map(v=>`<tr><th scope="row">${escape(month(v.month))}${v.missing?'':v.complete?'':' *'}</th><td>${v.missing?'Sem coleta':fmt(v[key])}</td>${id==='volume'?`<td>${v.missing?'—':num(v.avgKm)+' km'}</td>`:''}</tr>`).join('');
  const latest=actual.at(-1);
  return `<section class="chart-block"><div class="chart-title"><h3>${title}</h3><span>${unit}</span></div><svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="group" aria-label="${title} por mês">${grid}${shapes}${labels}${hits}</svg>${id==='volume'?'<div class="legend"><span><i></i>Total mensal</span><span><i class="line"></i>Média por treino</span></div>':''}<p class="chart-tooltip" id="tip-${id}" aria-live="polite">${escape(month(latest.month)+' · '+fmt(latest[key])+(latest.complete?'':' · coleta parcial'))}</p><details class="chart-table"><summary>Ver valores mensais</summary><table><thead><tr><th>Mês</th><th>${title}</th>${id==='volume'?'<th>Média/treino</th>':''}</tr></thead><tbody>${table}</tbody></table></details></section>`;
 }).join('');
 document.querySelectorAll('[data-tip]').forEach(el=>{const show=()=>{const block=el.closest('.chart-block');block.querySelector('.chart-tooltip').textContent=el.dataset.tip;block.querySelectorAll('.data-active').forEach(p=>p.classList.remove('data-active'));block.querySelector(`[data-point="${el.dataset.month}"]`)?.classList.add('data-active');};el.addEventListener('pointerenter',show);el.addEventListener('focus',show);el.addEventListener('click',show);});
 animateCharts($('#charts'),previous);
}
async function loadMaps(){
 if(window.google?.maps?.Map)return window.google.maps;
 if(!mapsPromise)mapsPromise=(async()=>{
  const {mapsKey}=await api('config');if(!mapsKey)throw new Error('Google Maps ainda não foi configurado.');
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(new Error('O Google Maps demorou a responder. Feche e tente novamente.')),15000);
   window.panelMapsReady=()=>{clearTimeout(timer);resolve();};
   window.gm_authFailure=()=>{clearTimeout(timer);reject(new Error('Google Maps recusou a chave. Verifique a API, o faturamento e o domínio autorizado.'));$('#map-status').textContent='Google Maps recusou a chave. Verifique a API, o faturamento e o domínio autorizado.';};
   const script=document.createElement('script');script.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(mapsKey)}&callback=panelMapsReady&loading=async&v=quarterly&language=pt-BR`;script.async=true;script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error('Não foi possível carregar o Google Maps. Verifique a conexão.'));};document.head.append(script);
  });return window.google.maps;
 })().catch(e=>{mapsPromise=null;throw e;});
 return mapsPromise;
}
async function openRun(id){
 const r=data.runs.find(r=>r.id===id);selectedRun=id;
 $('#detail-title').textContent=r.name;$('#detail-date').textContent=`${date(r.date)} · ${r.date.slice(11,16)}`;
 $('#detail-metrics').innerHTML=[['Distância',num(r.km,2)+' km'],['Duração',duration(r.duration)],['Pace médio',pace(r.pace)+'/km'],['FC média',num(r.hr,0)+' bpm'],['FC máxima',num(r.maxHr,0)+' bpm'],['Cadência',num(r.cadence,0)+' ppm'],['Elevação',num(r.elevation,0)+' m'],['Energia',num(r.calories,0)+' kcal']].map(([label,value])=>`<div><dt>${label}</dt><dd>${escape(value)}</dd></div>`).join('');
 if(activePolyline)activePolyline.setMap(null);activeMap=null;$('#map').replaceChildren();$('#map').hidden=false;
 if(!$('#run-dialog').open)await expandRun(id);
 if(!r.route?.length){$('#map-status').textContent='O arquivo coletado desta corrida ainda não contém um trajeto GPS.';$('#map').hidden=true;return;}
 $('#map-status').textContent='Carregando o mapa do percurso…';
 try{
  const maps=await loadMaps();if(selectedRun!==id||!$('#run-dialog').open)return;
  activeMap=new maps.Map($('#map'),{mapTypeId:'roadmap',mapTypeControl:false,streetViewControl:false,fullscreenControl:true,gestureHandling:'cooperative',center:{lat:r.route[0][0],lng:r.route[0][1]},zoom:14});
  const path=r.route.map(([lat,lng])=>({lat,lng}));activePolyline=new maps.Polyline({path,geodesic:true,strokeColor:'#00966a',strokeOpacity:1,strokeWeight:5,map:activeMap});
  const bounds=new maps.LatLngBounds();path.forEach(p=>bounds.extend(p));activeMap.fitBounds(bounds,35);
  $('#map-status').textContent='Trajeto GPS sobre Google Maps. Use dois dedos para mover o mapa no celular.';
 }catch(e){if(selectedRun===id){$('#map-status').textContent=e.message;$('#map').hidden=true;}}
}
async function refresh(){
 $('#refresh').disabled=true;$('#global-error').hidden=true;
 const results=await Promise.allSettled([api('dashboard'),api('tasks')]);
 if(results[0].status==='fulfilled'){
  data=results[0].value;renderRuns();renderMusic();renderCharts();
  $('#sync-status').textContent=`Dados sincronizados em ${updated(data.generatedAt)}`;
 }else{
  $('#global-error').textContent=results[0].reason.message+' Use Atualizar para tentar novamente.';$('#global-error').hidden=false;$('#sync-status').textContent=data?'Exibindo a última leitura disponível.':'Dados indisponíveis no momento.';
  if(!data){$('#runs').innerHTML='<p class="empty">Não foi possível carregar as corridas.</p>';$('#charts').innerHTML='<p class="empty">Não foi possível carregar a evolução.</p>';for(const d of [7,30])$('#music-'+d).innerHTML='<li class="empty">Não foi possível carregar as músicas.</li>';}
 }
 if(results[1].status==='fulfilled'&&!saving){tasks=results[1].value.tasks;renderTasks();}else if(results[1].status==='rejected'){$('#task-status').textContent=results[1].reason.message;if(!tasks.length)$('#tasks').innerHTML='<li class="empty">Tarefas indisponíveis. Tente atualizar.</li>';}
 $('#refresh').disabled=false;
}
const calendarFormat=new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long',timeZone:'America/Sao_Paulo'});
const clockFormat=new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23',timeZone:'America/Sao_Paulo'});
function updateClock(){
 const now=new Date();
 $('#today').textContent=calendarFormat.formatToParts(now).map(p=>p.type==='weekday'||p.type==='month'?p.value[0].toLocaleUpperCase('pt-BR')+p.value.slice(1):p.value).join('');
 $('#clock').textContent=clockFormat.format(now);$('#clock').dateTime=now.toISOString();
}
updateClock();setInterval(updateClock,1000);
$('#task-form').addEventListener('submit',e=>{e.preventDefault();const text=$('#task-input').value.trim();if(text)saveTask({action:'create',id:crypto.randomUUID(),text});});
$('#refresh').addEventListener('click',refresh);$('#months').addEventListener('change',()=>data&&renderCharts());$('#more-runs').addEventListener('click',()=>{shown+=10;renderRuns();});
let chartResizeTimer;
window.addEventListener('resize',()=>{clearTimeout(chartResizeTimer);chartResizeTimer=setTimeout(()=>{if(data)renderCharts();},150);});
$('#close-dialog').addEventListener('click',collapseRun);$('#run-dialog').addEventListener('cancel',e=>{e.preventDefault();collapseRun();});$('#run-dialog').addEventListener('close',()=>{selectedRun=null;});
setInterval(async()=>{if(!saving&&!document.hidden){try{const result=await api('tasks');if(!saving){tasks=result.tasks;renderTasks();}}catch{$('#task-status').textContent='Sem conexão. Suas últimas tarefas continuam visíveis.';}}},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!saving)refresh();});
refresh();
