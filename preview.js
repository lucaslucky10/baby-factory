'use strict';
(function(){
  var $=function(id){return document.getElementById(id);},U=BF.util;
  var rec,b,index=0,edition=0;
  var names=['하루','여울','도담','이든'];
  // One deterministic life for each arc. Real outcomes stay exactly as resolved.
  var seeds=BF.Story.arcs.map(function(arc){for(var seed=1;seed<10000;seed++){var o=BF.sim.resolve({seed:seed,sel:BF.sim.emptySel(),edits:BF.sim.emptyEdits(),guarantee:false,version:3});if(BF.Story.arcFor(o)===arc&&Object.keys(o.has).length===0)return seed;}});
  var player=new BF.Stage.Player($('scene'),{W:1000,H:950,groundY:850,figureX:520,rulerX:90,topMargin:110,onScene:function(sc,i){index=i;caption(sc);},onTick:function(age){$('age').textContent=Math.floor(age);$('age-range').value=age;$('location').textContent=['포근한 첫 방','작은 교실','처음 꾸민 공간','기억이 쌓이는 집','느긋한 오후의 공원'][age<5.5?0:age<18.5?1:age<29.5?2:age<61.5?3:4];},onEnd:function(){$('play').textContent='처음부터';}});
  function syncLink(){$('replay-link').href='index.html#'+BF.sim.encodeResult(rec);}
  function caption(sc){
    var choice=BF.Story.choiceOf(sc);
    $('caption').innerHTML=sc.items.map(function(e){return '<p>'+U.esc(e.text)+'</p>';}).join('');
    $('choice').innerHTML='';$('prev').disabled=index===0;$('next').disabled=sc.final;$('play').disabled=false;
    if(choice && !choice.selected){
      player.paused=true;$('play').disabled=true;$('next').disabled=true;$('play').textContent='선택을 기다리는 중';
      $('choice').innerHTML=BF.Story.markup(choice);
      $('choice').querySelectorAll('button').forEach(function(button){button.addEventListener('click',function(){
        rec.choices[choice.id]=+button.dataset.storyOption;
        player.stop();b=BF.sim.build(rec);player.load(b,rec.name);syncLink();
        jump(sc.age);$('play').focus({preventScroll:true});
      });});
    }else if(choice){$('choice').innerHTML='<p class="story-selected">나의 선택 · '+U.esc(choice.options[choice.selected-1])+'</p>';}
  }
  function jump(age){
    player.stop();player.paused=false;
    index=0;b.scenes.forEach(function(sc,i){if(sc.age<=age+.001)index=i;});
    var sc=b.scenes[index],seg=player.segs.filter(function(s){return s.type==='hold'&&s.idx===index;})[0];
    player.t=seg.t0+.6;player.lastScene=index;player.cam=null;
    player.draw(age,0,{type:'hold',scene:sc,t0:-10,idx:index});
    $('play').textContent='이어서 재생';caption(sc);
  }
  function fresh(){
    player.stop();rec={version:3,seed:seeds[edition],name:names[edition],sel:BF.sim.emptySel(),edits:BF.sim.emptyEdits(),guarantee:false,budget:0,order:edition+1,day:U.todayIndex(),choices:[0,0,0]};
    b=BF.sim.build(rec);player.load(b,rec.name);var arc=BF.Story.arcFor(b.o);
    $('arc-title').textContent=arc.title;$('keepsake').textContent=arc.keepsake;$('chapter-count').textContent='0'+(edition+1)+' / 04';
    document.querySelector('.p-age span').textContent='살의 '+rec.name;$('age-range').max=b.o.endAge;syncLink();jump(9);
  }
  $('prev').onclick=function(){jump(b.scenes[Math.max(0,index-1)].age);};
  $('next').onclick=function(){jump(b.scenes[Math.min(b.scenes.length-1,index+1)].age);};
  $('play').onclick=function(){
    if(player.raf&&!player.paused){player.paused=true;this.textContent='계속 재생';return;}
    if(player.t>=player.total){jump(0);}
    player.paused=false;player.play();this.textContent='잠깐 멈추기';
  };
  $('age-range').oninput=function(){jump(+this.value);};
  document.querySelectorAll('[data-age]').forEach(function(button){button.onclick=function(){jump(button.dataset.age==='end'?b.o.endAge:+button.dataset.age);};});
  $('new-life').onclick=function(){edition=(edition+1)%4;fresh();};
  fresh();
})();
