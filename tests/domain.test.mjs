import test from 'node:test';
import assert from 'node:assert/strict';
import {applyTask,mutateTask,formatPace} from '../lib/domain.mjs';
test('pace rounds seconds across minute boundaries',()=>{
 assert.equal(formatPace(450),'7:30');assert.equal(formatPace(479.7),'8:00');assert.equal(formatPace(null),'—');
});
test('task lifecycle and request retries preserve idempotency',()=>{
 let tasks=applyTask([],{action:'create',id:'a',text:'  Projeto  '},100);
 tasks=applyTask(tasks,{action:'create',id:'a',text:'duplicate'},200);
 assert.equal(tasks.length,1);assert.equal(tasks[0].text,'Projeto');
 tasks=applyTask(tasks,{action:'complete',id:'a',completed:true},300);assert.equal(tasks[0].completedAt,300);
 tasks=applyTask(tasks,{action:'complete',id:'a',completed:false});assert.equal(tasks[0].completedAt,null);
 assert.deepEqual(applyTask(tasks,{action:'delete',id:'a'}),[]);
 assert.throws(()=>applyTask([],{action:'complete',id:'a',completed:'yes'}));
});
test('a conditional-write conflict retries against latest tasks without losing another device edit',async()=>{
 let data=[{id:'a',text:'Original',createdAt:1,completedAt:null}],version=1,writes=0;
 const store={read:async()=>({data:structuredClone(data),etag:String(version)}),write:async(key,next,opts)=>{
  writes++;
  if(writes===1){data.push({id:'b',text:'Outro dispositivo',createdAt:2,completedAt:null});version++;const e=new Error('conflict');e.conflict=true;throw e;}
  assert.equal(opts.etag,String(version));data=next;version++;
 }};
 const result=await mutateTask(store,{action:'complete',id:'a',completed:true});
 assert.equal(result.length,2);assert.ok(result[0].completedAt);assert.equal(result[1].text,'Outro dispositivo');assert.equal(writes,2);
});
