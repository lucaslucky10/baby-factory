'use strict';
const baseline=BF.sim.build(BF.sim.decodeResult('bIAACiAAAAAAAABhqAACI2btlZjro6gBr')).o;
const supports=['none','wheel','cane'];
function model(career,index,support){return {...baseline,seed:37+index,career,sex:['F','M','N'][index%3],hair:['straight','wavy','curly'][Math.floor(index/3)%3],hairloss:false,has:support==='wheel'?{smn1:true}:support==='cane'?{rpe65:true}:{},persona:'social',iq:130,pitch:true,kids:true,grandkids:true,sport:index%2?'sprint':'endurance',endAge:100};}
const config={desktop:{W:1600,H:900,groundY:800,figureX:560,rulerX:120,topMargin:280},mobile:{W:1000,H:1150,groundY:1050,figureX:520,rulerX:90,topMargin:200}};
function gallery(supportOnly=false){
 const target=document.querySelector('#gallery');target.innerHTML='';
 for(let i=0;i<12;i++){
  const support=supportOnly?'wheel':supports[Math.floor(i/4)],o=model(Object.keys(BF.CAREERS)[i],i,support);
  const age=supportOnly?[4,21,34,36,47,65,70,71,11,23,26,100][i]:36;
  const scene=BF.sim.lifeEvents(o,'하루').find(s=>Math.abs(s.age-age)<.9);
  const acting=BF.Stage.performanceFor(scene),poseMix=supportOnly?1:[0,.35,.7,1][i%4];
  target.insertAdjacentHTML('beforeend','<article><h2>'+age+'세 · '+support+' · '+(supportOnly?acting.prop||acting.action:Math.round(poseMix*100)+'%')+'</h2>'+BF.Person.standalone(o,age,{...acting,w:230,h:280,poseMix,phase:i*.7})+'<p>'+(scene?scene.items.map(x=>x.text).join(' '):'')+'</p></article>');
 }
}
document.querySelector('#wedding').onclick=()=>gallery();document.querySelector('#support').onclick=()=>gallery(true);gallery();
document.querySelector('#check').onclick=async function(){
 this.disabled=true;const failures=[],coverage={props:{},actions:{},outfits:{},careers:[],ages:[]};let count=0;
 const report=document.querySelector('#report'),svg=document.querySelector('#probe svg');
 const overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>.55&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>.55;
 const rect=e=>e.getBoundingClientRect();
 const add=(name,key)=>{coverage[name][key]=(coverage[name][key]||0)+1;};
 for(const [ci,career] of Object.keys(BF.CAREERS).entries())for(const [si,support] of supports.entries()){
  const o=model(career,ci*3+si,support),scenes=BF.sim.lifeEvents(o,'하루');coverage.careers.push(career+':'+support);
  for(const [layout,opt] of Object.entries(config)){
   const player=new BF.Stage.Player(svg,opt);player.load({o,scenes},'하루');
   for(const seg of player.segs){
    // Both event holds and the growth journeys between them use the actual timeline.
    for(const fraction of [.02,.5,.98]){
     player.t=BF.util.lerp(seg.t0,seg.t1,fraction);const at=player.ageAt(player.t);player.cam=null;
     player.draw(at.age,player.t*1000,at.seg);count++;
     const acting=BF.Stage.performanceFor(seg.scene),L=BF.Person.look(o,at.age,acting),item=svg.querySelector('.held-prop'),face=svg.querySelector('.person-face'),torso=svg.querySelector('.person-torso');
     add('props',acting.prop||'none');add('actions',acting.action);add('outfits',L.outfit);if(!coverage.ages.includes(Math.floor(at.age)))coverage.ages.push(Math.floor(at.age));
     const reasons=[];if(svg.querySelectorAll('[data-scene][display="inline"]').length!==1)reasons.push('background');
     if(/NaN|Infinity|undefined/.test(svg.innerHTML))reasons.push('invalid');
     const bounds=rect(svg),figure=rect(svg.querySelector('.fig'));
     if(figure.left<bounds.left-.5||figure.right>bounds.right+.5||figure.top<bounds.top-.5||figure.bottom>bounds.bottom+.5)reasons.push('figure-clipped');
     if(item){
      const p=rect(item);if(overlap(p,rect(face)))reasons.push('face');
      if(!['book','baby'].includes(acting.prop)){
       if(torso&&overlap(p,rect(torso)))reasons.push('torso');
       for(const part of svg.querySelectorAll('.person-back-hair,.person-head,.chair-wheels'))if(overlap(p,rect(part)))reasons.push(part.getAttribute('class'));
      }
      const feature=svg.querySelector('.prop-feature');
      if(feature)for(const hand of svg.querySelectorAll('.prop-grip'))if(overlap(rect(feature),rect(hand)))reasons.push('microphone-head-covered');
      for(const hand of svg.querySelectorAll('.prop-grip')){
       const x=+hand.dataset.x,y=+hand.dataset.y;
       if(!Array.from(svg.querySelectorAll('.person-arm')).some(arm=>Math.hypot(+arm.dataset.wristX-x,+arm.dataset.wristY-y)<.03))reasons.push('detached-grip');
      }
     }
     if(L.wheelchair||L.cane){const tr=svg.querySelector('.fig>g').getAttribute('transform');if(!tr.startsWith('translate('+opt.figureX+' '+opt.groundY+')'))reasons.push('support-airborne');}
     if(reasons.length)failures.push({career,support,layout,age:at.age,phase:fraction,prop:acting.prop,action:acting.action,reasons:[...new Set(reasons)]});
     if(count%180===0){report.textContent=JSON.stringify({count,failures:failures.length});await new Promise(requestAnimationFrame);}
    }
   }
  }
 }
 coverage.ages.sort((a,b)=>a-b);report.textContent=JSON.stringify({count,coverage,failures},null,2);this.disabled=false;
};
