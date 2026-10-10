/* 베이비 팩토리 — 시뮬레이션: 유전자 검사, 출생 결과, 성장 곡선, 인생 이야기, QR 코드용 압축
   모든 무작위 결과는 시드에서 결정되므로, QR 결과 페이지에서도 똑같이 재현됩니다. */
'use strict';
var BF = window.BF || (window.BF = {});

(function (BF) {
  var U = BF.util;
  var DATA_VERSION = 2;

  function traitIndex(id) { for (var i = 0; i < BF.TRAITS.length; i++) if (BF.TRAITS[i].id === id) return i; return -1; }
  function disorderById(id) { for (var i = 0; i < BF.DISORDERS.length; i++) if (BF.DISORDERS[i].id === id) return BF.DISORDERS[i]; return null; }

  function emptySel() { return BF.TRAITS.map(function () { return 0; }); }
  function emptyEdits() { return BF.DISORDERS.map(function () { return false; }); }

  // ---------------- 비용 ----------------
  function cost(sel, edits, found) {
    var total = 0;
    BF.TRAITS.forEach(function (t, i) { total += t.opts[sel[i] || 0].price; });
    BF.DISORDERS.forEach(function (d, i) { if (edits[i] && found.indexOf(d.id) >= 0) total += d.price; });
    return total;
  }
  function receiptItems(sel, edits, found) {
    var items = [];
    BF.DISORDERS.forEach(function (d, i) {
      if (edits[i] && found.indexOf(d.id) >= 0) items.push({ kind: 'edit', id: d.id, name: d.name + ' 편집', opt: d.gene + ' · 성공률 ' + Math.round(d.success * 100) + '%', price: d.price });
    });
    BF.TRAITS.forEach(function (t, i) {
      var s = sel[i] || 0;
      if (s > 0) items.push({ kind: 'trait', id: t.id, cat: t.cat, name: t.name, opt: t.opts[s].label, price: t.opts[s].price });
    });
    return items;
  }

  // ---------------- 유전자 검사 ----------------
  function screen(seed, guarantee, version) {
    // 기존 QR(v1)은 당시 결과를 재현하고, 새 체험(v2)만 낮은 확률을 적용합니다.
    var legacy = version === 1;
    var r = U.rng(seed, 1);
    var rolls = BF.DISORDERS.map(function () { return r(); });
    var found = [];
    BF.DISORDERS.forEach(function (d, i) { if (rolls[i] < d.p * (legacy ? 1 : 0.5)) found.push(d.id); });
    if (!found.length && guarantee) {
      var rr = U.rng(seed, 9);
      found.push(U.weighted(rr, BF.DISORDERS, function (d) { return d.p; }).id);
    }
    var pickR = U.rng(seed, 10);
    while (found.length > (legacy ? 3 : 2)) found.splice(Math.floor(pickR() * found.length), 1);
    return found;
  }

  // ---------------- 성장 곡선 (한국 평균을 단순화) ----------------
  var STD = {
    M: [[0, 50], [0.5, 67], [1, 76], [2, 88], [3, 96], [4, 103], [5, 110], [6, 116], [7, 122], [8, 128], [9, 133], [10, 139], [11, 145], [12, 151], [13, 158], [14, 165], [15, 169], [16, 171.5], [17, 172.8], [18, 173.5], [25, 174], [55, 173.6], [65, 172.6], [75, 171], [85, 169], [100, 167]],
    F: [[0, 49.5], [0.5, 66], [1, 75], [2, 87], [3, 95], [4, 102], [5, 109], [6, 115], [7, 121], [8, 127], [9, 133], [10, 139], [11, 146], [12, 151.5], [13, 155.5], [14, 158], [15, 159.5], [16, 160.3], [17, 160.8], [18, 161], [25, 161], [55, 160.5], [65, 159.5], [75, 158], [85, 156], [100, 154]]
  };
  var MEAN = { M: 174, F: 161, N: 167.5 };
  function stdHeight(sex, age) {
    if (sex === 'N') return (U.interp(STD.M, age) + U.interp(STD.F, age)) / 2;
    return U.interp(STD[sex], age);
  }
  function heightAt(o, age) {
    var adult = stdHeight(o.sex, 25);
    var f = 1 + (o.height / adult - 1) * Math.pow(U.clamp(age / 17, 0, 1), 0.9);
    return stdHeight(o.sex, age) * f;
  }

  // ---------------- 출생 결과 결정 ----------------
  function resolve(input) {
    var seed = input.seed, sel = input.sel, edits = input.edits;
    var r = U.rng(seed, 2);
    var keys = ['sex', 'skin', 'hairColor', 'eyelid', 'hair', 'dimple', 'freckle', 'teeth', 'acne', 'hairloss', 'aging',
      'build', 'sport', 'sportType', 'eyes', 'sleep', 'music', 'persona', 'personaType', 'alz', 'heart',
      'weight', 'gray', 'career', 'partner', 'kids', 'grandkids', 'flavor', 'pet'];
    var u = {};
    keys.forEach(function (k) { u[k] = r(); });
    var z = { height: U.normal(r), iq: U.normal(r), life: U.normal(r) };
    var editRoll = BF.DISORDERS.map(function () { return r(); });

    function S(id) { return sel[traitIndex(id)] || 0; }
    var o = { seed: seed, bought: {} };
    BF.TRAITS.forEach(function (t, i) { if (sel[i] > 0) o.bought[t.id] = true; });

    o.sex = input.sex || (u.sex < 0.5 ? 'F' : 'M');
    o.skin = Math.floor(u.skin * 3);
    o.hairColor = u.hairColor < 0.78 ? '#2B2421' : '#4B3528';

    o.eyelid = ['', 'mono', 'inner', 'double'][S('eyelid')] || (u.eyelid < 0.45 ? 'mono' : u.eyelid < 0.70 ? 'inner' : 'double');
    o.hair = ['', 'straight', 'wavy', 'curly'][S('hair')] || (u.hair < 0.55 ? 'straight' : u.hair < 0.85 ? 'wavy' : 'curly');
    o.dimple = S('dimple') === 1 ? true : u.dimple < 0.22;
    o.freckle = S('freckle') === 1 ? true : S('freckle') === 2 ? false : u.freckle < 0.12;
    o.braces = S('teeth') === 1 ? false : u.teeth < 0.5;
    o.acne = S('skin') === 1 ? false : u.acne < 0.6;
    o.hairloss = S('hairloss') === 1 ? false : u.hairloss < (o.sex === 'M' ? 0.45 : 0.12);
    o.slowAging = S('aging') === 1 ? true : u.aging < 0.08;

    var ht = S('height');
    var hMean = MEAN[o.sex] + [0, 3, 8, 14][ht];
    var hSd = ht ? 3.6 : 5.8;
    o.height = Math.round(U.clamp(hMean + z.height * hSd, 140, 205) * 10) / 10;
    o.heightExp = ht ? hMean : null;
    o.heightZ = (o.height - MEAN[o.sex]) / 5.8;

    o.belly = S('build') === 1 ? false : u.build < 0.5;
    var sp = S('sport');
    if (sp) o.sport = u.sport < 0.8 ? (sp === 1 ? 'endurance' : 'sprint') : null;
    else o.sport = u.sport < 0.1 ? (u.sportType < 0.5 ? 'endurance' : 'sprint') : null;
    o.sportMiss = !!sp && !o.sport;

    o.myopia = S('eyes') === 1 ? false : u.eyes < 0.72;
    o.shortSleep = S('sleep') === 1 ? true : u.sleep < 0.02;

    var it = S('iq');
    var iqMean = 100 + [0, 10, 20, 30][it];
    o.iq = Math.round(U.clamp(iqMean + z.iq * (it ? 9 : 14), 70, 165));
    o.iqExp = it ? iqMean : null;

    o.pitch = S('music') === 1 ? u.music < 0.85 : u.music < 0.04;
    o.pitchMiss = S('music') === 1 && !o.pitch;
    var natPersona = [null, null, 'social', 'calm', 'resilient'][Math.floor(u.personaType * 5)];
    var pp = S('persona');
    o.persona = pp ? (u.persona < 0.7 ? ['', 'social', 'calm', 'resilient'][pp] : natPersona) : natPersona;
    o.personaMiss = !!pp && o.persona !== ['', 'social', 'calm', 'resilient'][pp];

    o.alzEvent = S('alz') === 1 ? u.alz < 0.03 : u.alz < 0.18;
    o.hiv = S('hiv') === 1;
    o.longevity = S('longevity') === 1;

    // 유전질환
    var found = screen(seed, input.guarantee, input.version);
    o.disorders = found.map(function (id) {
      var idx = -1;
      BF.DISORDERS.forEach(function (d, i) { if (d.id === id) idx = i; });
      var d = BF.DISORDERS[idx];
      var status = edits[idx] ? (editRoll[idx] < d.success ? 'removed' : 'failed') : 'kept';
      return { id: id, status: status };
    });
    o.has = {};
    o.disorders.forEach(function (x) { if (x.status !== 'removed') o.has[x.id] = true; });

    o.heartEvent = o.has.ldlr ? true : (S('heart') === 1 ? u.heart < 0.02 : u.heart < 0.2);

    o.weight = Math.round((2.8 + u.weight * 1.1) * 10) / 10;
    o.grayShift = (u.gray - 0.5) * 8;
    o.partner = u.partner < 0.62;
    o.kids = o.partner ? u.kids < 0.72 : u.kids < 0.12;
    o.grandkids = o.kids && u.grandkids < 0.8;
    o.flavor = u.flavor;
    o.pet = ['콩이', '보리', '두부', '호두'][Math.floor(u.pet * 4)];

    var life = (o.sex === 'F' ? 86 : 80) + (o.longevity ? 5 : 0) + (o.slowAging ? 3 : 0) + z.life * 4;
    o.disorders.forEach(function (x) { if (x.status !== 'removed') life -= disorderById(x.id).life; });
    if (o.heartEvent) life -= 3;
    if (o.alzEvent) life -= 2;
    o.lifespan = Math.round(U.clamp(life, 72, 101));
    o.endAge = Math.min(o.lifespan, 90);

    o.career = chooseCareer(o, U.rng(seed, 5));
    return o;
  }

  function chooseCareer(o, r) {
    var w = {};
    function add(k, n) { w[k] = (w[k] || 0) + n; }
    ['designer', 'chef', 'nurse', 'photographer', 'webtoon', 'carpenter', 'farmer', 'teacher', 'firefighter', 'developer'].forEach(function (k) { add(k, 1); });
    if (o.pitch) add('musician', 6);
    if (o.sport === 'sprint') add('sprinter', 6);
    if (o.sport === 'endurance') add('marathoner', 6);
    if (o.iq >= 125) { add('researcher', 5); add('doctor', 4); }
    if (o.iq >= 112) { add('developer', 2); add('lawyer', o.persona === 'social' ? 3 : 1); }
    if (o.persona === 'social') add('teacher', 3);
    if (o.persona === 'calm') { add('carpenter', 2); add('researcher', 1); }
    if (o.persona === 'resilient') { add('firefighter', 2); add('nurse', 2); }
    if (o.has.gjb2) { add('designer', 2); add('photographer', 2); add('webtoon', 2); delete w.musician; }
    if (o.has.rpe65) { add('musician', 2); add('lawyer', 1); delete w.photographer; delete w.firefighter; delete w.webtoon; }
    if (o.has.smn1) { add('developer', 2); add('designer', 2); add('webtoon', 2); delete w.firefighter; delete w.sprinter; delete w.marathoner; delete w.carpenter; }
    if (o.has.f8) delete w.firefighter;
    if (o.iq < 100) { delete w.doctor; delete w.researcher; delete w.lawyer; }
    var ks = Object.keys(w).sort();
    return U.weighted(r, ks, function (k) { return w[k]; });
  }

  // ---------------- 인생 이야기 ----------------
  // src: bought(주문한 유전자) · natural(자연) · edit(편집) · miss(주문했지만 다르게) · life(삶)
  function lifeEvents(o, name) {
    var ev = [];
    var N = U.callName(name);
    var Nn = U.josa(N, '은', '는'), Ng = U.josa(N, '이', '가');
    var r = U.rng(o.seed, 7);
    var career = BF.CAREERS[o.career];
    function add(age, text, opt) {
      opt = opt || {};
      if (!opt.final && age >= o.endAge - 0.5) age = o.endAge - 1; // 노년 사건은 마지막 장면보다 앞에
      ev.push({ age: age, final: !!opt.final, text: text, src: opt.src || 'life', prop: opt.prop || null, mood: opt.mood || 'happy', prio: opt.prio || 2 });
    }
    function srcOf(id) { return o.bought[id] ? 'bought' : 'natural'; }
    var h0 = Math.round(heightAt(o, 0) * 10) / 10;

    // 0세: 탄생
    add(0, name + ' 탄생! ' + o.weight + 'kg, ' + h0 + 'cm.', { prio: 9, prop: null });
    var removed = [], failed = [];
    o.disorders.forEach(function (x) {
      var d = disorderById(x.id);
      if (x.status === 'removed') removed.push(d.name);
      if (x.status === 'failed') failed.push(d.name);
    });
    if (removed.length) add(0, '검사에서 발견된 ' + removed.join(', ') + ' 유전자는 편집으로 사라졌어요.', { src: 'edit', prio: 8 });
    if (failed.length) add(0.3, failed.join(', ') + ' 편집은 실패했어요. 일부 세포에만 편집이 된 "모자이크"였어요.', { src: 'miss', prio: 8, mood: 'soft' });
    if (o.has.pah) add(0.3, '신생아 검사에서 페닐케톤뇨증 확인. 특수 분유를 먹기 시작했어요.', { src: 'natural', prio: 6, mood: 'soft' });

    // 1세: 돌잡이
    var item = { researcher: '연필', doctor: '청진기', developer: '마우스', lawyer: '판사봉', teacher: '책', sprinter: '공', marathoner: '공', musician: '마이크', firefighter: '공', nurse: '청진기' }[o.career];
    if (o.longevity) item = '실';
    if (!item) item = U.pick(r, ['실', '돈', '연필', '마이크', '공', '청진기', '마우스']);
    var itemProp = { '연필': 'pencil', '청진기': 'stetho', '마우스': 'mouse', '판사봉': 'gavel', '책': 'book', '공': 'ball', '마이크': 'mic', '실': 'thread', '돈': 'money' }[item];
    add(1, '첫돌. 돌잡이에서 ' + U.josa(item, '을', '를') + ' 잡았어요.' + (item === '실' ? ' 오래오래 살라는 뜻이래요.' : ''), { prio: 7, prop: itemProp });
    if (o.has.gjb2) add(1.4, '청각장애 진단. 가족이 다 함께 수어를 배우기 시작했어요.', { src: 'natural', prio: 7, mood: 'soft' });
    if (o.has.rpe65) add(2, '시각장애 진단. 손끝과 소리로 세상을 익혀 갔어요.', { src: 'natural', prio: 7, mood: 'soft' });
    if (o.has.smn1) add(2.2, '척수성 근위축증 진단. 다리에 힘이 잘 들어가지 않았어요.', { src: 'natural', prio: 7, mood: 'soft' });
    if (o.has.cftr) add(3, '매일 아침 호흡 치료로 하루를 시작했어요.', { src: 'natural', prio: 6, mood: 'soft' });

    // 유아기
    if (o.dimple) add(3, '웃을 때마다 쏙 들어가는 보조개 덕분에 어른들의 사랑을 독차지했어요.', { src: srcOf('dimple'), prio: 5 });
    if (o.iq >= 125) add(4, '네 살에 혼자 한글을 뗐어요.', { src: srcOf('iq'), prio: 4, prop: 'book' });
    else if (o.iq < 88) add(4, '글자보다 흙놀이와 블록 쌓기가 더 좋았어요.', { src: srcOf('iq'), prio: 3 });
    else add(4, '공룡 이름 쉰 개를 줄줄 외웠어요.', { src: 'life', prio: 2 });
    if (o.persona === 'social') add(5, '처음 보는 아이에게도 먼저 말을 거는 아이였어요.', { src: srcOf('persona'), prio: 4 });
    if (o.pitch) add(5.5, '냉장고 소리를 듣고 "이건 시 플랫이야"라고 말해 가족을 놀라게 했어요.', { src: srcOf('music'), prio: 6, prop: 'note' });

    // 초등
    var tall = o.heightZ > 0.9, short = o.heightZ < -0.9;
    add(7, '초등학교 입학! ' + (tall ? '반에서 키가 제일 커서 맨 뒷자리에 앉았어요.' : short ? '반에서 키가 제일 작아 늘 맨 앞줄이었어요.' : '키 번호는 딱 중간이었어요.'),
      { src: o.bought.height ? 'bought' : 'life', prio: 8, prop: 'backpack' });
    if (o.has.opn1) add(7.6, '미술 시간에 나무를 빨갛게 칠해 짝꿍이 깜짝 놀랐어요. 적록 색각이상이었어요.', { src: 'natural', prio: 6 });
    if (o.has.f8) add(6, '넘어지면 멍이 오래가서 무릎 보호대를 늘 하고 다녔어요.', { src: 'natural', prio: 6, mood: 'soft' });
    if (o.has.smn1) add(6.5, '휠체어를 타고 학교에 다녔어요. 경사로와 엘리베이터가 있는 학교라 다행이었어요.', { src: 'natural', prio: 7 });
    if (o.has.rpe65) add(8, '점자로 동화책을 읽었어요. 책장 넘기는 소리를 제일 좋아했어요.', { src: 'natural', prio: 7, prop: 'book' });
    if (o.has.gjb2) add(8, '수어로 친구들과 수다 떠는 시간이 제일 즐거웠어요.', { src: 'natural', prio: 6 });
    if (o.freckle) add(9, '햇볕을 받으면 콧등에 주근깨가 별자리처럼 피어났어요.', { src: srcOf('freckle'), prio: 5 });
    if (o.has.hbb) add(9, '겨울이면 찾아오는 심한 통증 때문에 병원에 자주 입원했어요.', { src: 'natural', prio: 7, mood: 'soft' });
    if (o.myopia) add(10, '칠판 글씨가 흐려져서 첫 안경을 맞췄어요.', { src: 'natural', prio: 5 });
    else if (o.bought.eyes) add(10, '시력검사 결과 양쪽 모두 1.5! 맨 뒷자리에서도 칠판이 또렷했어요.', { src: 'bought', prio: 5 });
    if (o.iq >= 128) add(10.5, '교내 수학 경시대회 금상. 선생님이 영재교육원을 추천했어요.', { src: srcOf('iq'), prio: 5, prop: 'trophy' });
    else if (o.iq >= 110) add(10.5, '받아쓰기는 늘 100점이었어요.', { src: srcOf('iq'), prio: 3 });
    else if (o.iq >= 92) add(10.5, '구구단 7단에서 한참 막혔지만 결국 다 외웠어요.', { src: 'life', prio: 2 });
    else add(10.5, '공부는 어려웠지만 쉬는 시간엔 인기 최고였어요.', { src: srcOf('iq'), prio: 3 });
    if (o.sport === 'sprint') add(11, (o.has.smn1 ? '운동회 휠체어 릴레이에서 친구들과 힘을 합쳤어요.' : '운동회 이어달리기의 마지막 주자로 뛰었어요.'), { src: srcOf('sport'), prio: 6, prop: 'medal' });
    if (o.sport === 'endurance') add(11, (o.has.smn1 ? '휠체어 경주에서 꾸준히 연습한 실력을 보여 줬어요.' : '오래달리기에서 학년 1등을 했어요.'), { src: srcOf('sport'), prio: 6, prop: 'medal' });
    if (o.sportMiss) add(11.5, '부모님은 운동 유전자를 샀지만, ' + Nn + (o.has.smn1 ? ' 운동보다 책 읽기를 더 좋아했어요.' : ' 달리기보다 책 읽기를 더 좋아했어요.'), { src: 'miss', prio: 7, prop: 'book' });
    if (o.pitchMiss) add(9.5, '절대음감을 주문했지만 음악 학원은 금방 그만뒀어요. 음감은 훈련이 있어야 생기거든요.', { src: 'miss', prio: 6 });

    // 중학생
    if (o.braces) add(12, '치아 교정 시작. 2년 동안 떡볶이 먹기가 힘들었어요.', { src: 'natural', prio: 5 });
    else if (o.bought.teeth) add(12, '치과에서 "교정할 게 하나도 없네요"라는 말을 들었어요.', { src: 'bought', prio: 5 });
    if (o.has.pah) add(12.5, '친구들이 아스파탐 든 음료를 마실 때, ' + Nn + ' 성분표부터 확인했어요.', { src: 'natural', prio: 5 });
    var gain = Math.round(heightAt(o, 14) - heightAt(o, 13));
    add(13, '중학교 입학. ' + (gain >= 7 ? '1년 만에 키가 ' + gain + 'cm나 자랐어요.' : '또래보다 천천히, 꾸준히 자랐어요.'), { src: 'life', prio: 6 });
    if (o.persona === 'social') add(13.5, '반장 선거에서 압도적인 표 차이로 당선됐어요.', { src: srcOf('persona'), prio: 4 });
    if (o.persona === 'calm') add(13.5, '좋아하는 일에 빠지면 밥 먹는 것도 잊었어요.', { src: srcOf('persona'), prio: 4 });
    if (o.persona === 'resilient') add(14.5, '대회에서 크게 졌지만, 다음 날 아침 가장 먼저 연습하러 나왔어요.', { src: srcOf('persona'), prio: 4 });
    if (o.personaMiss) add(14, '부모님이 주문한 성격과는 조금 다르게 자랐어요. 성격의 절반은 경험이 만드니까요.', { src: 'miss', prio: 6 });
    if (o.has.ldlr) add(14, '또래보다 콜레스테롤 수치가 훨씬 높아 약을 먹기 시작했어요.', { src: 'natural', prio: 5, mood: 'soft' });

    // 고등학생
    if (o.acne) add(15, '사춘기 여드름이 이마를 점령했어요.', { src: 'natural', prio: 4 });
    else if (o.bought.skin) add(15, '사춘기에도 피부가 매끈했어요.', { src: 'bought', prio: 4 });
    if (o.has.f8) add(15.5, '일주일에 두세 번 응고인자 주사를 맞으며 좋아하는 수영을 계속했어요.', { src: 'natural', prio: 5 });
    add(16, '고등학교 입학. ' + ({
      curly: '비 오는 날이면 곱슬머리가 두 배로 부풀었어요.',
      straight: '찰랑이는 생머리는 바람이 불어도 금방 제자리로 돌아왔어요.',
      wavy: '미용실에서 "파마하셨어요?"라는 질문을 백 번은 들었어요.'
    })[o.hair], { src: srcOf('hair'), prio: 5 });
    var hf = Math.round(o.height);
    var hline = '키 성장이 거의 멈췄어요. 최종 키 ' + hf + 'cm.';
    var hsrc = 'life';
    if (o.heightExp) {
      var diff = Math.round(o.height - o.heightExp);
      if (diff >= 2) { hline += ' 기대치(' + o.heightExp + 'cm)보다 ' + diff + 'cm 더 컸어요.'; hsrc = 'bought'; }
      else if (diff <= -2) { hline += ' 기대치(' + o.heightExp + 'cm)보다 ' + (-diff) + 'cm 작아요. 키는 유전자만으로 정해지지 않아요.'; hsrc = 'miss'; }
      else { hline += ' 거의 기대치(' + o.heightExp + 'cm)대로 자랐어요.'; hsrc = 'bought'; }
    }
    add(17, hline, { src: hsrc, prio: 8 });

    // 수능
    var sat = o.iq >= 130 ? '수능 전 과목 1등급! 어느 대학이든 갈 수 있었어요.'
      : o.iq >= 117 ? '수능을 잘 봐서 원하는 학과에 합격했어요.'
        : o.iq >= 100 ? '수능이 끝나고 조금 울었지만, 길은 여러 개였어요.'
          : o.iq >= 88 ? '수능 대신 일찍 하고 싶은 일을 배우기로 했어요.'
            : '책상보다 손으로 만드는 일에서 재능을 찾았어요.';
    add(18, sat, { src: srcOf('iq'), prio: 7 });
    if (o.iqExp && o.iq <= o.iqExp - 6) add(18.4, '부모님이 주문한 건 IQ ' + o.iqExp + '였지만 실제 검사 결과는 ' + o.iq + '. 지능은 주문한 대로 나오지 않았어요.', { src: 'miss', prio: 8 });
    else if (o.iqExp && o.iq >= o.iqExp + 6) add(18.4, 'IQ 검사 결과 ' + o.iq + '. 기대치보다 높았지만, 그게 유전자 덕분인지는 아무도 몰라요.', { src: 'bought', prio: 6 });
    else if (o.iqExp) add(18.4, 'IQ 검사 결과 ' + o.iq + '. 거의 주문한 기대치대로였어요.', { src: 'bought', prio: 5 });
    if (o.shortSleep) add(18.8, '하루 네 시간만 자도 개운했어요. 남는 시간에 기타를 배웠어요.', { src: srcOf('sleep'), prio: 5 });

    // 청년
    var lid = { double: '졸업사진 속 또렷한 쌍꺼풀이 눈에 띄었어요.', mono: '졸업사진 속 무쌍 눈매가 시원해 보인다는 말을 들었어요.', inner: '졸업사진을 찍는 날, 속쌍꺼풀이 유난히 잘 보였어요.' }[o.eyelid];
    add(19, lid, { src: srcOf('eyelid'), prio: 6 });
    if (o.bought.eyelid || o.bought.dimple || o.bought.hair) add(20, '스무 살 생일, 자기 얼굴의 일부를 부모님이 돈을 주고 골랐다는 걸 알게 됐어요.', { src: 'bought', prio: 7, mood: 'soft' });
    if (o.has.rpe65) add(20.5, (o.has.smn1 ? '휠체어와 음성 길안내를 이용해 대학에 다녔어요.' : '흰 지팡이를 짚고 혼자 지하철을 타고 대학에 다녔어요.'), { src: 'natural', prio: 6 });
    if (o.has.gjb2) add(20.5, '수어 통역과 문자 통역을 받으며 대학 수업을 들었어요.', { src: 'natural', prio: 5 });
    if (o.has.smn1) add(21, '휠체어 농구팀에 들어가 전국 대회에 나갔어요.', { src: 'natural', prio: 6, prop: 'ball' });
    if (o.sport === 'endurance') add(21.5, (o.has.smn1 ? '휠체어를 타고 지역 스포츠 축제의 도전 코스를 완주했어요.' : '첫 풀코스 마라톤을 3시간 안에 완주했어요.'), { src: srcOf('sport'), prio: 6, prop: 'medal' });
    if (o.sport === 'sprint') add(21.5, (o.has.smn1 ? '휠체어 경주 대회에서 결승에 올랐어요.' : '전국체전 100m 결승에 올랐어요.'), { src: srcOf('sport'), prio: 6, prop: 'medal' });
    if (o.pitch) add(22, '직접 만든 곡으로 작은 공연장 무대에 처음 섰어요.', { src: srcOf('music'), prio: 5, prop: 'mic' });
    if (o.iq >= 100) add(23, '대학 졸업! 학사모를 하늘 높이 던졌어요.', { src: 'life', prio: 6, prop: 'gradcap' });
    else add(23, '첫 월급으로 부모님께 따뜻한 겨울 외투를 선물했어요.', { src: 'life', prio: 6 });
    if (o.has.cftr) add(24.5, '새로 나온 표적 치료제 덕분에 숨쉬기가 훨씬 편해졌어요.', { src: 'natural', prio: 6 });

    add(26, U.josa(career.name, '이', '가') + ' 되었어요. ' + ({
      researcher: '실험실 불은 늘 마지막에 꺼졌어요.', doctor: '첫 당직 날 밤을 꼬박 새웠어요.', developer: '첫 게임 출시 날 서버가 터졌어요.',
      lawyer: '첫 재판에서 목소리가 떨렸지만 끝까지 해냈어요.', teacher: '첫 담임 반 아이들 이름을 하루 만에 다 외웠어요.',
      sprinter: '국가대표 상비군에 뽑혔어요.', marathoner: '실업팀에 입단했어요.', musician: '첫 앨범을 냈어요.',
      designer: '첫 작품이 공모전에 당선됐어요.', chef: '새벽 시장에서 하루를 시작했어요.', nurse: '첫 출근 날 환자에게 고맙다는 말을 들었어요.',
      firefighter: '첫 출동 사이렌에 심장이 쿵쾅거렸어요.', photographer: '첫 의뢰로 시골 마을의 사계절을 찍었어요.',
      webtoon: '첫 연재가 시작됐어요. 마감은 늘 아슬아슬했어요.', carpenter: '처음 만든 의자는 조금 삐걱거렸어요.',
      farmer: '고향에 돌아가 스마트팜을 시작했어요.', translator: '첫 통역 현장에서 손이 바쁘게 움직였어요.'
    })[o.career], { src: 'life', prio: 8, prop: 'briefcase' });
    if (o.has.hbb) add(28, '새로 나온 유전자 치료를 받고 통증이 크게 줄었어요.', { src: 'natural', prio: 6 });
    if (o.persona === 'resilient') add(28.5, '다니던 회사가 문을 닫았지만, 석 달 만에 새 일을 찾았어요.', { src: srcOf('persona'), prio: 4 });
    if (o.hiv) add(30, 'HIV 걱정은 없었지만, 편집된 유전자가 몸의 다른 곳에 어떤 영향을 줄지는 아무도 확신하지 못했어요.', { src: 'bought', prio: 6, mood: 'soft' });
    if (o.has.brca1) add(30.5, '암 위험 때문에 해마다 빠짐없이 정밀 검진을 받았어요.', { src: 'natural', prio: 5, mood: 'soft' });
    if (o.shortSleep) add(31, '남들보다 하루가 4시간 더 길었어요. 그 시간에 책을 두 권 썼어요.', { src: srcOf('sleep'), prio: 4, prop: 'book' });
    add(32, o.partner ? '사랑하는 사람을 만나 함께 살기로 했어요.' : '반려견 ' + o.pet + '와 함께 혼자만의 삶을 자유롭게 꾸려 갔어요.', { src: 'life', prio: 5 });
    if (o.kids) add(34, '첫 아이가 태어났어요. 아이의 유전자를 고를지 오래 고민했어요.', { src: 'life', prio: 6, prop: 'baby' });
    if (o.persona === 'social') add(36, '친구 결혼식 사회만 열한 번 봤어요.', { src: srcOf('persona'), prio: 3, prop: 'mic' });

    // 중년
    if (o.hairloss) {
      add(o.sex === 'M' ? 40 : 50, '정수리가 조금씩 훤해지기 시작했어요.', { src: 'natural', prio: 6 });
      if (o.sex === 'M') add(55, '모자가 가장 친한 친구가 되었어요.', { src: 'natural', prio: 4 });
    } else if (o.bought.hairloss) add(46, '친구들이 탈모 샴푸를 고를 때, 머리숱은 그대로였어요.', { src: 'bought', prio: 6 });
    if (o.has.brca1) add(44, '검진에서 암을 일찍 발견해 무사히 치료를 마쳤어요.', { src: 'natural', prio: 6, mood: 'soft' });
    if (o.has.ldlr) add(45, '가슴 통증으로 심장 혈관을 넓히는 시술을 받았어요.', { src: 'natural', prio: 6, mood: 'soft' });
    if (o.belly) add(45.5, '회식이 잦아지면서 배가 나오기 시작했어요.', { src: 'natural', prio: 4 });
    else if (o.bought.build) add(45.5, '야식을 먹어도 체중이 그대로라 친구들이 부러워했어요.', { src: 'bought', prio: 5 });
    add(47, ({
      researcher: '연구팀이 희귀질환 치료법을 발표했어요.', doctor: '환자들이 일부러 찾아오는 의사가 되었어요.', developer: '만든 게임이 백만 다운로드를 넘었어요.',
      lawyer: '장애인 이동권 소송에서 이겼어요.', teacher: '가르친 제자가 선생님이 되어 찾아왔어요.', sprinter: '은퇴 후 유소년 육상 코치가 되었어요.',
      marathoner: '은퇴 후 동네 러닝 모임을 만들었어요.', musician: '만든 노래가 드라마 주제곡이 되었어요.', designer: '디자인한 의자가 미술관에 전시됐어요.',
      chef: '자기 이름을 건 작은 식당을 열었어요.', nurse: '수간호사가 되었어요.', firefighter: '화재 현장에서 아이 둘을 구해 표창을 받았어요.',
      photographer: '첫 개인 사진전을 열었어요.', webtoon: '연재한 웹툰이 드라마로 만들어졌어요.', carpenter: '나무 냄새 가득한 공방을 열었어요.',
      farmer: '스마트팜에서 키운 딸기가 대박이 났어요.', translator: '뉴스 수어 통역을 맡게 됐어요.'
    })[o.career], { src: 'life', prio: 6, prop: 'trophy' });
    add(49, o.myopia ? '다초점 안경으로 바꿨어요.' : o.bought.eyes ? '평생 좋은 시력도 노안은 피할 수 없었어요. 첫 돋보기를 샀어요.' : '휴대폰을 멀리 들고 보기 시작했어요. 노안이 온 거예요.',
      { src: o.bought.eyes ? 'miss' : 'life', prio: 4 });
    add(51, o.slowAging ? '쉰 살인데 다들 30대로 봤어요.' : '눈가에 웃음 주름이 자리를 잡았어요.', { src: srcOf('aging'), prio: 5 });
    if (o.heartEvent && !o.has.ldlr) add(56, '가벼운 심장 시술을 받은 뒤 매일 아침 산책을 시작했어요.', { src: 'natural', prio: 5, mood: 'soft' });
    else if (o.bought.heart) add(56, '건강검진의 콜레스테롤 수치는 늘 "정상"이었어요.', { src: 'bought', prio: 5 });
    if (!o.slowAging) add(58, '거울 속 흰머리가 부쩍 늘었어요.', { src: 'natural', prio: 3 });

    // 노년
    add(65, '은퇴. 동료들이 꽃다발을 안겨 줬어요.', { src: 'life', prio: 7, prop: 'bouquet' });
    if (o.slowAging) add(68, (o.has.smn1 ? '칠순을 앞두고도 친구들과 무장애 숲길을 즐겨 찾았어요.' : '칠순을 앞두고도 등산 동호회에서 제일 빨랐어요.'), { src: srcOf('aging'), prio: 5 });
    else add(68, (o.has.smn1 ? '휠체어 방석과 등받이를 몸에 맞게 조절하니 한결 편해졌어요.' : '무릎이 예전 같지 않아 계단보다 엘리베이터를 찾게 됐어요.'), { src: 'natural', prio: 3 });
    if (o.grandkids) add(70, '손주가 태어났어요. 작은 손이 손가락을 꼭 쥐었어요.', { src: 'life', prio: 6, prop: 'baby' });
    if (o.has.smn1) add(71, (o.grandkids ? '휠체어를 타고 손주와 공원을 누볐어요.' : '휠체어를 타고 친구들과 공원을 누볐어요.'), { src: 'natural', prio: 5 });
    if (o.has.rpe65) add(71, '안내견 ' + o.pet + '와 함께 매일 산책을 했어요.', { src: 'natural', prio: 5 });
    if (o.has.gjb2) add(72, '수어 모임 친구들과 50년째 우정을 이어 갔어요.', { src: 'natural', prio: 5 });
    if (o.alzEvent) add(78, '기억이 자주 흐려졌어요. 가족들이 곁에서 기억을 붙잡아 주었어요.', { src: o.bought.alz ? 'miss' : 'natural', prio: 6, mood: 'soft' });
    else if (o.bought.alz) add(78, '여든을 앞두고도 손주들 생일을 하나도 잊지 않았어요.', { src: 'bought', prio: 5 });
    if (o.longevity && o.endAge >= 86) add(84, (o.has.smn1 ? '여든넷에도 휠체어를 타고 매일 아침 동네 공원에 나갔어요.' : '여든넷에도 매일 아침 동네 뒷산을 올랐어요.'), { src: 'bought', prio: 5 });

    // 마지막
    var nBought = Object.keys(o.bought).length + o.disorders.filter(function (x) { return x.status !== 'kept'; }).length;
    var grand = o.sex === 'F' ? '할머니' : '할아버지';
    var ending;
    if (o.grandkids) {
      ending = '손주가 물었어요. "' + grand + '는 태어날 때 뭘 골랐어요?" ' +
        (nBought >= 3 ? '"내가 고른 건 하나도 없단다. 전부 누군가 골라 준 거지."'
          : nBought > 0 ? '"나는 아무것도 고르지 않았단다. 몇 가지는 부모님이 골라 주셨지. 그게 나다운 건지는 아직도 모르겠구나."'
            : '"아무것도 고르지 않았단다. 전부 자연이 준 거지. 그래서 다 내 것 같았어."');
    } else {
      ending = '창가에 앉아 지나온 시간을 떠올렸어요. 이 삶에서 유전자가 정한 건 얼마나 될까요?';
    }
    add(o.endAge, ending, { src: 'life', prio: 9, mood: 'soft', final: true });

    // 같은 시기 사건 합치기: 0.9년 안의 사건은 한 장면, 장면당 최대 2줄
    ev.sort(function (a, b) { return a.age - b.age || b.prio - a.prio; });
    var scenes = [];
    ev.forEach(function (e) {
      if (e.age > o.endAge) return;
      var last = scenes[scenes.length - 1];
      var near = last && !e.final && !last.final && e.age - last.age < 0.9;
      if (near && last.items.length < 2) last.items.push(e);
      else if (near) {
        // 우선순위가 낮은 줄을 밀어냄
        var low = last.items[0].prio <= last.items[1].prio ? 0 : 1;
        if (e.prio > last.items[low].prio) last.items[low] = e;
      } else scenes.push({ age: e.age, final: e.final, items: [e] });
    });
    scenes.forEach(function (s) {
      s.prop = null; s.mood = 'happy';
      s.items.forEach(function (it) { if (it.prop && !s.prop) s.prop = it.prop; if (it.mood === 'soft') s.mood = 'soft'; });
    });
    return scenes;
  }

  function stageName(age) {
    return age < 1 ? '신생아' : age < 6 ? '영유아기' : age < 13 ? '어린이' : age < 19 ? '청소년기' : age < 30 ? '청년기' : age < 50 ? '장년기' : age < 65 ? '중년기' : '노년기';
  }

  // ---------------- QR 결과 코드 (비트 압축 → base64url) ----------------
  function BitW() { this.bits = []; }
  BitW.prototype.put = function (v, n) { for (var i = n - 1; i >= 0; i--) this.bits.push((v >>> i) & 1); };
  BitW.prototype.bytes = function () {
    var out = [];
    for (var i = 0; i < this.bits.length; i += 8) {
      var v = 0;
      for (var j = 0; j < 8; j++) v = (v << 1) | (this.bits[i + j] || 0);
      out.push(v);
    }
    return out;
  };
  function BitR(bytes) { this.b = bytes; this.p = 0; }
  BitR.prototype.get = function (n) {
    var v = 0;
    for (var i = 0; i < n; i++) {
      var byte = this.b[this.p >> 3];
      if (byte === undefined) throw new Error('short');
      v = (v << 1) | ((byte >> (7 - (this.p & 7))) & 1);
      this.p++;
    }
    return v >>> 0;
  };
  function checksum(bytes) {
    var h = 0x5A;
    bytes.forEach(function (b) { h = ((h * 31) ^ b) & 0xFF; });
    return h;
  }

  function encodeResult(rec) {
    var w = new BitW();
    w.put(rec.version || DATA_VERSION, 4);
    w.put(rec.guarantee ? 1 : 0, 1);
    w.put(rec.seed & 0xFFFFFF, 24);
    BF.TRAITS.forEach(function (t, i) { w.put(rec.sel[i] || 0, 2); });
    BF.DISORDERS.forEach(function (d, i) { w.put(rec.edits[i] ? 1 : 0, 1); });
    w.put(U.clamp(Math.round(rec.budget), 0, 1048575), 20);
    w.put(U.clamp(rec.order || 0, 0, 16383), 14);
    w.put(U.clamp(rec.day || 0, 0, 4095), 12);
    var nb = U.utf8Encode(rec.name || '').slice(0, 24);
    w.put(nb.length, 5);
    nb.forEach(function (b) { w.put(b, 8); });
    var bytes = w.bytes();
    bytes.push(checksum(bytes));
    return 'b' + U.b64url(bytes);
  }

  function decodeResult(token) {
    try {
      token = String(token || '').replace(/^#/, '');
      if (token.charAt(0) !== 'b') return null;
      var bytes = U.unb64url(token.slice(1));
      if (bytes.length < 4) return null;
      var sum = bytes.pop();
      if (checksum(bytes) !== sum) return null;
      var rd = new BitR(bytes);
      var ver = rd.get(4);
      if (ver !== 1 && ver !== DATA_VERSION) return null;
      var rec = { version: ver, guarantee: rd.get(1) === 1, seed: rd.get(24), sel: [], edits: [] };
      BF.TRAITS.forEach(function (t) { var v = rd.get(2); rec.sel.push(v < t.opts.length ? v : 0); });
      BF.DISORDERS.forEach(function () { rec.edits.push(rd.get(1) === 1); });
      rec.budget = rd.get(20);
      rec.order = rd.get(14);
      rec.day = rd.get(12);
      var n = rd.get(5), nb = [];
      for (var i = 0; i < n; i++) nb.push(rd.get(8));
      rec.name = U.utf8Decode(nb) || '아기';
      return rec;
    } catch (e) { return null; }
  }

  // 기록(rec) → 화면에 필요한 모든 것
  function build(rec) {
    var found = screen(rec.seed, rec.guarantee, rec.version);
    var o = resolve({ seed: rec.seed, sel: rec.sel, edits: rec.edits, guarantee: rec.guarantee, version: rec.version });
    var spent = cost(rec.sel, rec.edits, found);
    return { rec: rec, found: found, o: o, spent: spent, items: receiptItems(rec.sel, rec.edits, found), scenes: lifeEvents(o, rec.name) };
  }

  BF.sim = {
    traitIndex: traitIndex, disorderById: disorderById, emptySel: emptySel, emptyEdits: emptyEdits,
    cost: cost, receiptItems: receiptItems, screen: screen, resolve: resolve, heightAt: heightAt, stdHeight: stdHeight,
    lifeEvents: lifeEvents, stageName: stageName, encodeResult: encodeResult, decodeResult: decodeResult, build: build,
    MEAN: MEAN
  };
})(BF);
