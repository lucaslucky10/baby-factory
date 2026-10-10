/* 베이비 팩토리 — 휴대폰 결과 페이지 (QR 주소의 # 뒤 코드만으로 결과 전체를 다시 만들어 보여 줌, 서버 불필요) */
'use strict';
var BF = window.BF || (window.BF = {});

(function (BF) {
  var U = BF.util, sim = BF.sim;
  function $(id) { return document.getElementById(id); }
  var player = null;

  function boot() {
    var h = location.hash.replace(/^#/, '');
    if (!h || h.charAt(0) !== 'b') return false;
    document.documentElement.classList.add('is-viewer');
    var vp = $('viewport'); if (vp) vp.parentNode.removeChild(vp);
    var root = $('viewer'); root.hidden = false;
    window.addEventListener('hashchange', function () { location.reload(); });
    var rec = sim.decodeResult(h);
    if (!rec) {
      root.innerHTML = '<main class="v-wrap"><header class="v-top"><span class="v-logo">베이비 팩토리</span></header>' +
        '<section class="v-card v-error"><h1>결과를 읽을 수 없어요</h1><p>QR 코드가 잘렸거나 주소가 바뀐 것 같아요. 라벨의 QR을 다시 찍어 주세요.</p></section></main>';
      return true;
    }
    render(sim.build(rec));
    return true;
  }

  function render(b) {
    var o = b.o, rec = b.rec;
    document.title = rec.name + '의 일생 · 베이비 팩토리';
    var no = 'No.' + String(rec.order).padStart(4, '0');
    var srcName = { bought: '주문한 유전자', natural: '자연', edit: '유전자 편집', miss: '빗나간 주문' };
    var h = '';
    h += '<main class="v-wrap">';
    h += '<header class="v-top"><span class="v-logo">베이비 팩토리</span><span class="v-no">' + no + ' · ' + U.fmtDate(U.dayToDate(rec.day)) + '</span></header>';

    // 첫 화면: 이름 + 성장 무대
    h += '<section class="v-hero">';
    h += '<p class="v-eyebrow">' + U.esc(BF.EVENT.club) + ' 북콘서트에서 설계한 맞춤아기</p>';
    h += '<h1>' + U.esc(rec.name) + '의 일생</h1>';
    h += '<p class="v-sub">' + U.esc(BF.CAREERS[o.career].name) + ' · 최종 키 ' + Math.round(o.height) + 'cm · 기대 수명 ' + o.lifespan + '세</p>';
    h += '<div class="v-stage"><svg id="v-svg" aria-label="' + U.esc(rec.name) + '의 성장 모습"></svg>' +
      '<div class="v-age"><span id="v-age">0</span><small>세</small></div></div>';
    h += '<div class="v-ctrl"><button class="v-btn" id="v-play" type="button">처음부터 재생</button>' +
      '<input id="v-range" type="range" min="0" max="' + o.endAge + '" step="0.5" value="0" aria-label="나이"></div>';
    h += '<div class="v-caption" id="v-caption"></div>';
    h += '</section>';

    // 결과 카드 이미지
    h += '<section class="v-card" id="v-img-sec"><h2>결과 카드</h2><p class="v-muted">이미지를 길게 누르면 사진첩에 저장할 수 있어요.</p>' +
      '<div class="v-img" id="v-img"><span class="v-loading">카드를 만드는 중…</span></div>' +
      '<div class="v-row"><button class="v-btn v-yellow" id="v-save" type="button">이미지 저장</button><button class="v-btn" id="v-share" type="button" hidden>공유하기</button></div></section>';

    // 주문서
    h += '<section class="v-card v-receipt"><h2>주문서</h2>';
    if (!b.items.length) h += '<p class="v-line"><span>주문한 항목 없음 · 모두 자연에 맡김</span><b>0원</b></p>';
    b.items.forEach(function (it) {
      h += '<p class="v-line"><span>' + U.esc(it.name) + '<small>' + U.esc(it.opt) + '</small></span><b>' + U.moneyShort(it.price) + '</b></p>';
    });
    h += '<p class="v-line v-total"><span>합계</span><b>' + U.money(b.spent) + '</b></p>';
    h += '<p class="v-line"><span>보유 자산 (룰렛)</span><b>' + U.money(rec.budget) + '</b></p>';
    h += '<p class="v-line"><span>남은 돈</span><b>' + U.money(rec.budget - b.spent) + '</b></p>';
    h += '<p class="v-muted">※ 가상 금액이며 실제 결제가 아니에요.</p></section>';

    // 기대 vs 실제
    var rows = [];
    rows.push(['성별', o.sex === 'F' ? '여자아이' : '남자아이', '자연']);
    rows.push(['최종 키', Math.round(o.height) + 'cm', o.heightExp ? '기대치 ' + o.heightExp + 'cm' : '자연']);
    rows.push(['지능 검사', 'IQ ' + o.iq, o.iqExp ? '기대치 ' + o.iqExp : '자연']);
    rows.push(['쌍꺼풀', { mono: '무쌍', inner: '속쌍꺼풀', double: '또렷한 쌍꺼풀' }[o.eyelid], o.bought.eyelid ? '주문' : '자연']);
    rows.push(['머리 모양', { straight: '직모', wavy: '웨이브', curly: '곱슬' }[o.hair], o.bought.hair ? '주문' : '자연']);
    o.disorders.forEach(function (x) {
      var d = sim.disorderById(x.id);
      rows.push([d.name, x.status === 'removed' ? '편집 성공' : x.status === 'failed' ? '편집 실패' : '편집하지 않음', d.gene]);
    });
    h += '<section class="v-card"><h2>주문 vs 실제</h2><div class="v-table">' + rows.map(function (r) {
      return '<div><span>' + U.esc(r[0]) + '</span><b>' + U.esc(r[1]) + '</b><small>' + U.esc(r[2]) + '</small></div>';
    }).join('') + '</div></section>';

    // 인생 기록
    h += '<section class="v-card"><h2>인생 기록</h2><ol class="v-life">';
    b.scenes.forEach(function (sc) {
      var srcs = [];
      sc.items.forEach(function (it) { if (srcName[it.src] && srcs.indexOf(it.src) < 0) srcs.push(it.src); });
      h += '<li><span class="v-dot">' + Math.floor(sc.age) + '세</span><div>' + srcs.map(function (s) { return '<span class="src ' + s + '">' + srcName[s] + '</span>'; }).join(' ') +
        sc.items.map(function (it) { return '<p>' + U.esc(it.text) + '</p>'; }).join('') + '</div></li>';
    });
    h += '</ol></section>';

    // 질문
    h += '<section class="v-card v-q"><h2>생각해 볼 질문</h2><p class="v-big">' + U.esc(BF.EVENT.question) + '</p>' +
      '<p>"' + U.esc(BF.EVENT.vote) + '" 여러분은 찬성인가요, 반대인가요?</p></section>';

    h += '<footer class="v-foot"><p><b>' + U.esc(BF.EVENT.club) + '</b> · ' + U.esc(BF.EVENT.event) + '</p>' +
      '<p>주제 도서 『' + U.esc(BF.EVENT.book) + '』 ' + U.esc(BF.EVENT.author) + '</p>' +
      '<p class="v-muted">※ ' + U.esc(BF.EVENT.disclaimer) + '</p></footer>';
    h += '</main>';
    $('viewer').innerHTML = h;

    // 성장 무대
    player = new BF.Stage.Player($('v-svg'), {
      W: 1000, H: 1150, groundY: 1050, figureX: 520, rulerX: 90, topMargin: 200,
      onScene: function (sc) { caption(sc); },
      onTick: function (age) { $('v-age').textContent = Math.floor(age + 0.001); $('v-range').value = age; },
      onEnd: function () { $('v-play').textContent = '다시 재생'; }
    });
    player.load(b, rec.name);
    player.speed = 1.6;
    caption(b.scenes[0]);
    function caption(sc) {
      $('v-caption').innerHTML = '<b>' + Math.floor(sc.age) + '세</b> ' + sc.items.map(function (it) { return U.esc(it.text); }).join(' ');
    }
    $('v-play').addEventListener('click', function () {
      player.load(b, rec.name); player.speed = 1.6; player.play();
      this.textContent = '재생 중…';
    });
    $('v-range').addEventListener('input', function () {
      var a = +this.value;
      player.stop();
      player.show(a, performance.now());
      $('v-age').textContent = Math.floor(a);
      var last = b.scenes[0];
      b.scenes.forEach(function (sc) { if (sc.age <= a + 0.25) last = sc; });
      caption(last);
      $('v-play').textContent = '처음부터 재생';
    });
    // 자동 재생은 화면에 보일 때 한 번
    setTimeout(function () { player.play(); $('v-play').textContent = '재생 중…'; }, 600);

    // 결과 카드 이미지
    var url = location.href;
    BF.Card.resultCard(b, url).then(function (c) {
      var data;
      try { data = c.toDataURL('image/png'); } catch (e) { throw e; }
      var img = new Image();
      img.alt = rec.name + '의 일생 결과 카드';
      img.src = data;
      var box = $('v-img'); box.innerHTML = ''; box.appendChild(img);
      var fname = 'baby-factory-' + String(rec.order).padStart(4, '0') + '.png';
      $('v-save').addEventListener('click', function () { BF.Card.download(c, fname); });
      if (c.toBlob && navigator.share && window.File) {
        c.toBlob(function (blob) {
          if (!blob) return;
          var file = new File([blob], fname, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            var sb = $('v-share'); sb.hidden = false;
            sb.addEventListener('click', function () {
              navigator.share({ files: [file], title: rec.name + '의 일생', text: '베이비 팩토리에서 설계한 맞춤아기' }).catch(function () { });
            });
          }
        }, 'image/png');
      }
    }).catch(function () {
      $('v-img-sec').hidden = true;
    });
  }

  BF.Viewer = { boot: boot };
})(BF);
