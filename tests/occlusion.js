const specs={ball:'cheer',book:'read',pencil:'read',mic:'perform',stetho:'idle',mouse:'idle',gavel:'idle',thread:'idle',money:'idle',briefcase:'wave',trophy:'celebrate',bouquet:'welcome',baby:'cradle'};
document.querySelector('#check').onclick=async function(){this.disabled=true;let failures=[],count=0;const box=document.querySelector('#probe'),report=document.querySelector('#report');
const overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>.5 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>.5;
for(const age of [1,7,23,70])for(const support of ['none','wheel','cane'])for(const hair of ['straight','curly'])for(const poseMix of [0,.5,1])for(const phase of [0,.7,2.3])for(const [prop,action] of Object.entries(specs)){
const model={...base,sex:age===7||age===70?'M':'F',hair,has:support==='wheel'?{smn1:true}:support==='cane'?{rpe65:true}:{}};
box.innerHTML=BF.Person.standalone(model,age,{w:180,h:250,prop,action,phase,poseMix});const svg=box.querySelector('svg'),item=box.querySelector('.held-prop'),face=box.querySelector('.person-face'),torso=box.querySelector('.person-torso');const p=item.getBoundingClientRect(),f=face.getBoundingClientRect(),t=torso.getBoundingClientRect(),v=svg.getBoundingClientRect();
let reasons=[];if(overlap(p,f))reasons.push('face');if(!['book','baby'].includes(prop)&&overlap(p,t))reasons.push('torso');if(p.left<v.left-.5||p.right>v.right+.5||p.top<v.top-.5||p.bottom>v.bottom+.5)reasons.push('clipped');if(reasons.length)failures.push({age,support,hair,poseMix,phase,prop,reasons});count++;
if(count%78===0){report.textContent=JSON.stringify({count,failures:failures.length});await new Promise(requestAnimationFrame);}}
report.textContent=JSON.stringify({count,failures},null,2);this.disabled=false;};
