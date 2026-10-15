/* Original connected stories. Version 3 only; versions 1 and 2 keep their text. */
'use strict';
var BF = window.BF || (window.BF = {});
(function (BF) {
  var U = BF.util;
  // Interests are independent of purchases, sex, disability and IQ.
  var arcs = [
    {title:'지도에 없는 가게', keepsake:'삐뚤빼뚤한 지도', prop:'book',
      start:'동네 지도를 만들었어요. 빵집은 크게, 무서운 개가 있는 집은 아주 작게 그렸어요.',
      friend:'지도에 없는 문방구를 발견했어요. 주인 할머니는 비밀 장소를 표시할 별 스티커를 줬어요.',
      problem:'동네가 바뀌면서 지도 속 가게 세 곳이 사라졌어요. 빈자리에 무엇을 남길까요?',
      options:['사람들의 이야기를 모으기','새로 생긴 장소를 찾아보기'],
      first:['가게 주인들의 기억을 작은 책으로 엮었어요. 첫 독자는 세 명. 셋 다 다음 편을 기다렸어요.','새 지도를 펼쳤더니 모르는 골목이 더 많았어요. 지우개보다 새 종이를 많이 쓰게 됐어요.'],
      setback:'동네 전시를 열었는데 첫날 손님은 한 명이었어요. 그 한 명이 자기 동네 이야기를 한 시간이나 들려줬어요.',
      return:['오래전 문방구 자리에 작은 서가가 생겼어요. 첫 책은 그때 만든 동네 이야기였어요.','아이들이 새 지도에 자기만 아는 장소를 그렸어요. 공백이 가장 인기 있는 페이지가 됐어요.'],
      ending:'지도 뒷면에 적었어요. “좋은 곳은 찾기도 하지만, 함께 만들기도 한다.”'},
    {title:'고장 나도 괜찮은 것들', keepsake:'나사 하나 남은 상자', prop:'mouse',
      start:'장난감을 뜯었다가 나사 하나가 남았어요. 상자에는 “아직 고치는 중”이라고 썼어요.',
      friend:'친구의 필통 지퍼를 고쳐 줬어요. 답례는 젤리 두 개와 “또 부탁해도 돼?”라는 말이었어요.',
      problem:'수리 모임에서 처음으로 못 고치는 물건을 만났어요. 주인은 돌아가신 아버지의 것이라고 했어요.',
      options:['모르는 것을 인정하고 함께 배우기','작동 대신 추억을 보관할 방법 찾기'],
      first:['동네 수리점에 배우러 갔어요. 첫 수업은 “잘 열었으면, 잘 닫는 것부터”였어요.','작동하지 않는 물건을 작은 기억 상자로 바꿨어요. 주인은 뚜껑을 한참 쓰다듬었어요.'],
      setback:'무료 수리 날, 고친 것보다 못 고친 것이 더 많았어요. 그래도 다음 주 예약장은 가득 찼어요.',
      return:['처음 배우러 갔던 수리점에서 이제는 다른 사람에게 공구 쓰는 법을 알려 줘요.','동네 사람들이 각자의 기억 상자를 가져왔어요. 고칠 수 없는 것에도 자리가 생겼어요.'],
      ending:'아직도 나사 하나가 남아요. 이제는 상자에 “누군가와 함께 고치는 중”이라고 써요.'},
    {title:'토마토 한 알의 모험', keepsake:'첫 씨앗 봉투', prop:'plant',
      start:'방울토마토 씨앗을 심었어요. 하루에 다섯 번 확인했지만, 싹은 제 속도로 올라왔어요.',
      friend:'처음 열린 토마토를 친구와 반으로 나눴어요. 한입도 안 됐지만 둘 다 농부가 된 기분이었어요.',
      problem:'정성껏 키운 화분이 시들었어요. 빈 화분 앞에서 다음 계절을 생각했어요.',
      options:['다른 사람과 함께 다시 심기','무엇이 달랐는지 기록해 보기'],
      first:['이웃과 씨앗을 바꿨어요. 각자 다른 화분을 돌보는데, 물 주는 날은 자꾸 서로 물어봤어요.','날씨와 흙을 기록하기 시작했어요. 잘 자란 날보다 실패한 날에 메모가 길었어요.'],
      setback:'나눔 장터에 내놓은 수확은 고작 일곱 알이었어요. 옆자리 이웃이 자기 바질을 보태 줬어요.',
      return:['이웃의 작은 정원들이 하나의 지도가 됐어요. 잘 익은 것이 있으면 서로 문을 두드려요.','오래된 재배 노트를 빌려 간 아이가 자기 메모를 덧붙여 돌려줬어요. 책이 조금 두꺼워졌어요.'],
      ending:'첫 씨앗 봉투는 아직 서랍에 있어요. 가장 오래 자란 건 토마토보다 기다리는 마음이었어요.'},
    {title:'세 명뿐인 관객', keepsake:'접힌 공연 초대장', prop:'letter',
      start:'인형 세 개를 앉혀 놓고 이야기를 들려줬어요. 박수는 직접 쳤지만 앙코르도 했어요.',
      friend:'친구와 작은 공연을 만들었어요. 대사는 잊어버렸지만, 즉석에서 바꾼 결말이 더 웃겼어요.',
      problem:'첫 동네 공연 신청자는 세 명이었어요. 장소 대여료도 모자랐어요. 어떻게 이어 갈까요?',
      options:['세 명을 위한 작은 무대 열기','친구와 새로운 형식 만들기'],
      first:['객석과 무대의 구분을 없앴어요. 세 명의 관객이 세 명의 이야기꾼이 되었어요.','친구와 그림과 몸짓을 더했어요. 틀려도 서로 이어 주는 게 이 공연의 규칙이 됐어요.'],
      setback:'공연 당일 갑자기 장소를 쓸 수 없게 됐어요. 관객 한 명이 자기 가게 문을 열어 줬어요.',
      return:['그때 관객이었던 사람이 자기 이야기를 들려주러 왔어요. 이번에는 맨 앞자리에 앉았어요.','오래 함께한 친구와 새 작품을 만들었어요. 초대장에는 여전히 “처음 오시는 분 환영”이라고 써요.'],
      ending:'접힌 초대장 뒤에 관객 이름 세 개가 남아 있어요. 시작하기에 충분했던 숫자였어요.'}
  ];
  function arcFor(o) { return arcs[Math.floor(U.rng(o.seed, 101)()*arcs.length)]; }
  function choices(rec) { return [0,1,2].map(function(i){ var n=rec&&rec.choices&&rec.choices[i]; return n===1||n===2?n:0; }); }
  function apply(ev,o,rec) {
    var arc=arcFor(o), selected=choices(rec), r=U.rng(o.seed,102);
    var defaults=[r(),r(),r()].map(function(v){return 1+Math.floor(v*2);});
    var resolved=selected.map(function(v,i){return v||defaults[i];});
    // Retain genetics/health outcomes. Rewrite only everyday milestones that
    // otherwise equated a number with worth, admission, or inevitable success.
    var edits={
      4:[arc.start,arc.prop],
      7:['입학 첫날, 이름표를 세 번 확인했어요. 먼저 말을 건 친구도 똑같이 긴장하고 있었어요.','backpack'],
      10.5:[o.iq>=110?'어려운 문제는 금방 풀었지만, 친구에게 설명하는 데는 더 오래 걸렸어요.':'모르던 문제를 친구와 풀었어요. 서로 막히는 부분이 달라서 둘이 하니 조금 쉬웠어요.','book'],
      18:['진로 희망 칸을 세 번 고쳤어요. 마지막에는 직업 이름 옆에 “아직 알아가는 중”이라고 썼어요.','pencil'],
      19:['졸업사진을 찍다가 다 같이 웃음이 터졌어요. 가장 반듯한 사진보다 그 사진을 오래 간직했어요.',null],
      23:[o.iq>=100?'졸업식 날, 계획대로 된 것과 계획에 없던 것들을 적어 봤어요. 두 번째 목록이 더 길었어요.':'처음 번 돈으로 소박한 저녁을 샀어요. 다음에는 내가 살게, 라는 말을 처음 해 봤어요.',o.iq>=100?'gradcap':null],
      47:['일터에서 실수를 숨기지 않고 이야기했어요. 후배가 나중에 “그날부터 질문할 수 있었어요”라고 말했어요.','letter'],
      65:['일의 속도를 조금 늦췄어요. 빈 달력 한 칸에 오래 미뤄 둔 약속부터 적었어요.','bouquet']
    };
    ev.forEach(function(e){
      if(e.age===26) e.prop=({photographer:'camera',farmer:'plant',teacher:'book',researcher:'book',webtoon:'pencil',designer:'pencil',musician:'mic',doctor:'stetho',nurse:'stetho',translator:'letter'})[o.career]||e.prop;
      var change=edits[e.age];
      if(change && (e.src==='life'||[4,7,10.5,18,19].indexOf(e.age)>=0)) {e.text=change[0];e.prop=change[1];e.src='life';}
      if(e.age===9.5 && e.src==='miss') e.text='절대음감을 주문했지만 기대한 결과와는 달랐어요. 그래도 좋아하는 음악을 찾아가는 일은 계속됐어요.';
      if(e.age===14 && e.src==='miss') e.text='부모님이 기대한 성격과는 조금 다르게 자랐어요. 함께 겪은 일들도 성격에 흔적을 남겼어요.';
      if(e.final) { e.text=arc.ending+' '+(selected.some(Boolean)?'태어나기 전 주문서에는 없던, 살아가며 만든 이야기예요.':'주문서에 없던 순간들이 모여 이 삶의 이야기가 되었어요.'); e.chapter=arc.title;e.keepsake=arc.keepsake; }
    });
    function add(age,text,extra){ev.push(Object.assign({age:age,text:text,src:'life',prop:arc.prop,mood:'happy',prio:10,chapter:arc.title},extra||{}));}
    add(9,arc.friend);
    add(15.8,arc.problem,{choice:{id:0,title:'이야기의 첫 갈림길',options:arc.options,selected:selected[0]},prop:null});
    add(22.5,arc.first[resolved[0]-1]);
    add(38.5,arc.setback,{choice:{id:1,title:'계획과 달라진 날',options:['도움을 청하고 함께 이어 가기','잠시 쉬며 다른 방법을 생각하기'],selected:selected[1]},prop:null});
    add(42, resolved[1]===1?'혼자서 하던 일에 친구가 합류했어요. 계획은 더 자주 바뀌었지만, 끝나고 나누는 이야기가 좋아졌어요.':'잠시 멈춘 동안 다른 즐거움을 발견했어요. 다시 시작할 때는 남의 속도에 맞추지 않기로 했어요.',{prop:'letter'});
    add(60.2,'서랍에서 '+U.josa(arc.keepsake,'을','를')+' 꺼냈어요. 이제 이 이야기를 어디에 놓아둘까요?',{choice:{id:2,title:'다음 사람에게 남길 것',options:['누군가에게 건네기','나를 위한 기록으로 남기기'],selected:selected[2]},prop:arc.prop});
    add(66,arc.return[resolved[0]-1]);
    add(69, resolved[2]===1?'오래 간직한 물건을 건넸어요. “똑같이 할 필요는 없어. 네 방식으로 이어 줘.”':'아무에게도 보여 주지 않을 마지막 페이지를 썼어요. 남에게 설명하지 않아도 소중한 기억이었어요.',{prop:'book'});
    return ev;
  }
  function choiceOf(scene){return scene&&scene.items.map(function(e){return e.choice;}).filter(Boolean)[0];}
  function markup(choice){
    return '<div class="story-choice" role="group" aria-label="'+U.esc(choice.title)+'"><span class="story-choice-label">잠깐, 어떤 이야기를 만들어 볼까요?</span>'+choice.options.map(function(t,i){return '<button type="button" data-story-option="'+(i+1)+'"><span>0'+(i+1)+'</span>'+U.esc(t)+'<b aria-hidden="true">↗</b></button>';}).join('')+'<small>정답은 없어요. 이 선택은 이후 이야기로 이어져요.</small></div>';
  }
  BF.Story={arcs:arcs,arcFor:arcFor,apply:apply,choices:choices,choiceOf:choiceOf,markup:markup};
})(BF);
