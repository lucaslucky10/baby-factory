/* 베이비 팩토리 — 체험 부스 진행 (타이틀 → 예산 → 검사 → 5분 설계 → 결제 → 탄생 → 인생 재생 → 결과·QR) */
'use strict';
(function () {
  var U = BF.util, sim = BF.sim, Snd = BF.Sound;
  function $(id) { return document.getElementById(id); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  // QR 결과 페이지로 열린 경우: 휴대폰 화면만 보여 주고 끝
  if (BF.Viewer && BF.Viewer.boot()) return;

  // ================= 설정 =================
  var settings = loadSettings();
  function loadSettings() {
    var saved = U.store.get('settings', {}) || {}, out = {};
    Object.keys(BF.DEFAULTS).forEach(function (k) { out[k] = saved[k] !== undefined ? saved[k] : BF.DEFAULTS[k]; });
    if (saved.screeningVersion !== BF.DEFAULTS.screeningVersion) {
      out.guarantee = false;
      out.screeningVersion = BF.DEFAULTS.screeningVersion;
    }
    if (!Array.isArray(out.presets) || !out.presets.length) out.presets = BF.DEFAULTS.presets.slice();
    return out;
  }
  function saveSettings() { U.store.set('settings', settings); }
  Snd.setOn(settings.sound);

  // ================= 화면 크기 맞춤 =================
  function fit() {
    var s = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
    $('stage').style.transform = 'translate(-50%, -50%) scale(' + s + ')';
  }
  window.addEventListener('resize', fit);
  fit();

  var S = null; // 현재 참가자
  var screenId = 's-title';
  function show(id) {
    qsa('.screen').forEach(function (el) { el.classList.toggle('is-on', el.id === id); });
    screenId = id;
    document.body.classList.toggle('is-busy', id !== 's-title');
    if (id === 's-design') startPreviewLoop(); else stopPreviewLoop();
  }
  function toast(msg, ms) {
    var t = $('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.tm);
    toast.tm = setTimeout(function () { t.hidden = true; }, ms || 2200);
  }
  function openModal(id) { $(id).hidden = false; }
  function closeModal(id) { $(id).hidden = true; }

  // ================= 0. 타이틀 =================
  function buildBelt() {
    var recent = U.store.get('recent', []) || [];
    var items = [];
    recent.slice(-10).reverse().forEach(function (tk) {
      var rec = sim.decodeResult(tk);
      if (rec) items.push(sim.build(rec));
    });
    var r = U.rng(U.newSeed(), 3);
    // 샘플 아기 이름은 겹치지 않게 (오늘 만든 아기 이름도 피함)
    var used = items.map(function (b) { return b.rec.name; });
    var names = BF.BABY_NAMES.filter(function (n) { return used.indexOf(n) < 0; });
    while (items.length < 9) {
      var sel = sim.emptySel();
      BF.TRAITS.forEach(function (t, i) { if (r() < 0.35) sel[i] = 1 + Math.floor(r() * (t.opts.length - 1)); });
      var name = names.length ? names.splice(Math.floor(r() * names.length), 1)[0] : U.pick(r, BF.BABY_NAMES);
      var rec2 = { seed: Math.floor(r() * 0xFFFFFF), sel: sel, edits: sim.emptyEdits(), guarantee: false, budget: 10000, order: 0, day: 0, name: name };
      items.push(sim.build(rec2));
    }
    var html = '';
    items.forEach(function (b) {
      var age = [0.9, 1.6, 2.4][b.rec.seed % 3];
      html += '<div class="box">' + BF.Person.standalone(b.o, age, { w: 98, h: 108, px: 1.5, mood: 'happy' }) +
        '<span class="tag">' + U.moneyShort(b.spent) + '</span>' +
        '<span class="box-label">' + (b.rec.order ? 'No.' + String(b.rec.order).padStart(4, '0') + ' ' : '') + U.esc(b.rec.name) + '</span></div>';
    });
    $('belt').innerHTML = html + html; // 끊김 없이 반복
  }

  // ================= 1. 예산 =================
  var budgetVal = 0;
  function renderPresets() {
    // 금액 순위에 따라 지폐 색 등급(1~4)을 붙임
    var sorted = settings.presets.slice().sort(function (a, b) { return a - b; }), n = sorted.length;
    $('presets').innerHTML = settings.presets.map(function (p) {
      var tier = Math.min(4, Math.floor(sorted.indexOf(p) * 4 / n) + 1);
      return '<button class="preset" type="button" data-v="' + p + '" data-tier="' + tier + '">' + U.moneyShort(p) + '</button>';
    }).join('');
  }
  function setBudget(v, fromInput) {
    budgetVal = U.clamp(Math.floor(v) || 0, 0, 1000000);
    $('budget-out').textContent = U.money(budgetVal);
    if (!fromInput) $('budget-in').value = budgetVal ? String(budgetVal) : '';
    qsa('.preset').forEach(function (b) { b.classList.toggle('is-on', +b.dataset.v === budgetVal); });
    $('btn-budget-ok').disabled = budgetVal < 100;
  }
  function gotoBudget() {
    renderPresets();
    setBudget(0);
    $('disclaimer-budget').textContent = '※ ' + BF.EVENT.disclaimer;
    show('s-budget');
    setTimeout(function () { $('budget-in').focus(); }, 380);
  }

  // ---- 화면 룰렛 (예비용) ----
  var wheelAngle = 0, spinning = false;
  var WHEEL_COLORS = ['#FFD23F', '#8EC9F0', '#FF6F91', '#9FD8BE', '#FFF1A8', '#D9EEFB', '#FFD3DE', '#CDEBDD'];
  function drawWheel() {
    var c = $('wheel'), ctx = c.getContext('2d'), n = settings.presets.length, R = 270, cx = 280, cy = 280;
    ctx.clearRect(0, 0, 560, 560);
    for (var i = 0; i < n; i++) {
      var a0 = wheelAngle + (i / n) * Math.PI * 2 - Math.PI / 2, a1 = a0 + Math.PI * 2 / n;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath();
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length]; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = '#1E2A47'; ctx.stroke();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate((a0 + a1) / 2);
      ctx.fillStyle = '#1E2A47'; ctx.font = "34px 'Bagel Fat One', sans-serif"; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(U.moneyShort(settings.presets[i]), R - 22, 0);
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(cx, cy, 34, 0, 7); ctx.fillStyle = '#FFFDF5'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
  }
  function spin() {
    if (spinning) return;
    spinning = true;
    var n = settings.presets.length, target = Math.floor(Math.random() * n);
    var seg = Math.PI * 2 / n;
    // 포인터(위쪽)가 target 칸 중앙을 가리키도록
    var endAngle = -(target + 0.5) * seg + (Math.random() - 0.5) * seg * 0.6;
    var start = wheelAngle % (Math.PI * 2), turns = 6 + Math.floor(Math.random() * 3);
    var delta = turns * Math.PI * 2 + ((endAngle - start) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    var t0 = performance.now(), dur = 4800, lastSeg = -1;
    $('wheel-result').textContent = '돌아가는 중…';
    function step(now) {
      var u = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - u, 3.4);
      wheelAngle = start + delta * e;
      var cur = Math.floor(((-wheelAngle % (Math.PI * 2)) + Math.PI * 4) % (Math.PI * 2) / seg);
      if (cur !== lastSeg) { lastSeg = cur; Snd.spinTick(); }
      drawWheel();
      if (u < 1) requestAnimationFrame(step);
      else {
        spinning = false;
        var v = settings.presets[target];
        $('wheel-result').textContent = U.money(v) + '!';
        Snd.success();
        setBudget(v);
      }
    }
    requestAnimationFrame(step);
  }

  // ================= 새 참가자 시작 =================
  function newSession() {
    var seed = U.newSeed();
    S = {
      budget: budgetVal, seed: seed, guarantee: !!settings.guarantee,
      sel: sim.emptySel(), edits: sim.emptyEdits(),
      found: [], tab: 'looks', healthSeen: false,
      previewAge: 7, zoom: false, notesShown: {}, noteQueue: [],
      timer: { total: settings.timer * 1000, left: settings.timer * 1000, end: 0, running: false, warned: {} },
      timeUp: false, name: '', order: (U.store.get('order', 0) || 0) + 1
    };
    S.found = sim.screen(seed, S.guarantee);
  }

  // ================= 2. 유전자 검사 =================
  function drawDNA() {
    var s = '', H = 1040;
    for (var y = 0; y < H; y += 26) {
      var p = y / 70, x1 = 130 + Math.sin(p) * 80, x2 = 130 - Math.sin(p) * 80, front = Math.cos(p) > 0;
      s += '<line x1="' + x1.toFixed(1) + '" y1="' + y + '" x2="' + x2.toFixed(1) + '" y2="' + y + '" stroke="' + (front ? '#FFD23F' : '#4A5A86') + '" stroke-width="5" stroke-linecap="round"/>';
      s += '<circle cx="' + x1.toFixed(1) + '" cy="' + y + '" r="9" fill="#FF6F91" stroke="#1E2A47" stroke-width="3"/><circle cx="' + x2.toFixed(1) + '" cy="' + y + '" r="9" fill="#8EC9F0" stroke="#1E2A47" stroke-width="3"/>';
    }
    $('dna').innerHTML = '<g><animateTransform attributeName="transform" type="translate" from="0 0" to="0 -440" dur="5s" repeatCount="indefinite"/>' + s + '</g>';
  }
  var scanTimers = [];
  function gotoScan() {
    newSession();
    drawDNA();
    $('scan-list').innerHTML = BF.DISORDERS.map(function (d) {
      return '<li class="scan-row" data-id="' + d.id + '"><div><b>' + d.name + '</b><small>' + d.gene + ' · ' + d.kind + '</small></div><span class="scan-badge">검사 대기</span></li>';
    }).join('');
    $('scan-sum').textContent = '';
    $('btn-scan-ok').hidden = true;
    show('s-scan');
    var rows = qsa('.scan-row');
    scanTimers.forEach(clearTimeout); scanTimers = [];
    rows.forEach(function (row, i) {
      scanTimers.push(setTimeout(function () {
        rows.forEach(function (r) { r.classList.remove('is-active'); });
        row.classList.add('is-active');
        Snd.scan();
      }, 300 + i * 420));
      scanTimers.push(setTimeout(function () {
        var found = S.found.indexOf(row.dataset.id) >= 0;
        row.classList.remove('is-active');
        row.classList.add('is-done', found ? 'is-found' : 'is-ok');
        row.querySelector('.scan-badge').textContent = found ? '발견' : '정상';
        if (found) Snd.found(); else Snd.clear();
      }, 300 + i * 420 + 330));
    });
    scanTimers.push(setTimeout(finishScan, 300 + rows.length * 420 + 300));
  }
  function finishScan() {
    var names = S.found.map(function (id) { return sim.disorderById(id).name; });
    $('scan-sum').innerHTML = names.length
      ? '발견된 유전질환·장애 <em>' + names.length + '개</em>: ' + names.map(U.esc).join(', ') + '<br>편집할지는 설계 화면의 [건강] 탭에서 정해요.'
      : '발견된 유전질환이 없어요. 이제 무엇을 고를지만 정하면 돼요.';
    var m = Math.floor(settings.timer / 60), sec = settings.timer % 60;
    $('btn-scan-ok').textContent = '설계 시작 · 타이머 ' + m + ':' + String(sec).padStart(2, '0');
    $('btn-scan-ok').hidden = false;
    $('btn-scan-ok').focus();
  }

  // ================= 3. 설계 =================
  var CAT_ICON = {
    looks: '<svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="10"/><circle cx="10.5" cy="13" r="1.3" fill="#1E2A47"/><circle cx="17.5" cy="13" r="1.3" fill="#1E2A47"/><path d="M10 18q4 3 8 0"/></svg>',
    body: '<svg viewBox="0 0 28 28"><rect x="9" y="2" width="10" height="24" rx="2"/><path d="M9 7h4M9 11h6M9 15h4M9 19h6M9 23h4"/></svg>',
    mind: '<svg viewBox="0 0 28 28"><path d="M14 4l2.8 6 6.5.7-4.9 4.4 1.4 6.4L14 18.3l-5.8 3.2 1.4-6.4-4.9-4.4 6.5-.7z"/></svg>',
    health: '<svg viewBox="0 0 28 28"><path d="M9 3c0 7 10 8 10 15M19 3c0 7-10 8-10 15M9 25c0-3 1.5-5 5-7M19 25c0-3-1.5-5-5-7M10 7h8M10 21h8"/></svg>'
  };
  function cost() { return sim.cost(S.sel, S.edits, S.found); }
  function left() { return S.budget - cost(); }

  function gotoDesign() {
    S.tab = 'looks';
    $('d-order').textContent = '주문 No.' + String(S.order).padStart(4, '0');
    renderTabs(); renderTraits(); renderOrder(); updateWallet(true);
    S.previewAge = 7; S.zoom = false; $('btn-zoom').classList.remove('is-on');
    renderAgeTabs();
    $('ethic-note').hidden = true;
    show('s-design');
    startTimer();
    drawPreview(true);
  }

  function renderTabs() {
    $('tabs').innerHTML = BF.CATS.map(function (c) {
      var n = 0;
      BF.TRAITS.forEach(function (t, i) { if (t.cat === c.id && S.sel[i] > 0) n++; });
      if (c.id === 'health') BF.DISORDERS.forEach(function (d, i) { if (S.edits[i]) n++; });
      var alert = c.id === 'health' && S.found.length && !S.healthSeen ? '<span class="alert">' + S.found.length + '</span>' : '';
      return '<button class="tab' + (S.tab === c.id ? ' is-on' : '') + '" role="tab" data-cat="' + c.id + '">' + CAT_ICON[c.id] + c.name + (n ? '<span class="cnt">' + n + '</span>' : '') + alert + '</button>';
    }).join('');
  }
  function optHTML(t, ti, oi) {
    var o = t.opts[oi];
    return '<button class="opt' + (oi === 0 ? ' is-nat' : '') + '" type="button" data-t="' + ti + '" data-o="' + oi + '">' +
      '<b>' + o.label + '</b><span class="price">' + (o.price ? U.moneyShort(o.price) + '원' : '무료') + '</span>' + (o.sub ? '<span class="sub">' + o.sub + '</span>' : '') + '</button>';
  }
  function traitHTML(t, ti) {
    var f = BF.FEAS[t.feas];
    return '<article class="trait" data-ti="' + ti + '">' +
      '<span class="stamp ' + t.feas + '">' + f.label + '<small>' + f.sub + '</small></span>' +
      '<div class="trait-top"><h5>' + t.name + '</h5><span class="gene">' + t.gene + '</span></div>' +
      '<p class="trait-note">' + t.note + '</p>' +
      '<div class="opts">' + t.opts.map(function (o, oi) { return optHTML(t, ti, oi); }).join('') + '</div></article>';
  }
  function renderTraits() {
    var html = '';
    if (S.tab === 'health') {
      if (S.found.length) {
        html += '<div class="sec-title"><h4>유전자 검사 결과</h4><small>발견된 ' + S.found.length + '개 · 편집하지 않으면 그대로 태어나요</small></div>';
        S.found.forEach(function (id) {
          var di = -1; BF.DISORDERS.forEach(function (d, i) { if (d.id === id) di = i; });
          var d = BF.DISORDERS[di];
          html += '<article class="disorder" data-di="' + di + '"><div><h5>' + d.name + '<span class="kind">' + d.kind + '</span></h5>' +
            '<span class="real">' + d.gene + ' · 실제로는 ' + d.real + '</span><p>' + d.desc + '</p></div>' +
            '<button class="edit-btn" type="button" data-di="' + di + '"><b>유전자 편집하기</b><span class="price">' + U.moneyShort(d.price) + '원</span><small>성공률 ' + Math.round(d.success * 100) + '%</small></button></article>';
        });
        var clean = BF.DISORDERS.filter(function (d) { return S.found.indexOf(d.id) < 0; }).map(function (d) { return d.name; });
        html += '<p class="clean-list">그 밖의 ' + clean.length + '개는 정상: ' + clean.join(', ') + '<br>※ 게임에서는 체험을 위해 실제보다 훨씬 높은 확률로 발견돼요.</p>';
      } else {
        html += '<p class="clean-list">유전자 검사에서 발견된 유전질환이 없어요.</p>';
      }
      html += '<div class="sec-title"><h4>질병 위험 낮추기</h4><small>지금 아픈 곳은 없지만, 미래의 위험을 줄이는 편집</small></div>';
    }
    BF.TRAITS.forEach(function (t, i) { if (t.cat === S.tab) html += traitHTML(t, i); });
    $('trait-list').innerHTML = html;
    $('trait-list').setAttribute('data-cat', S.tab);
    $('trait-list').scrollTop = 0;
    refreshStates();
  }
  function refreshStates() {
    var spent = cost(), L = S.budget - spent;
    qsa('.opt', $('trait-list')).forEach(function (b) {
      var ti = +b.dataset.t, oi = +b.dataset.o, t = BF.TRAITS[ti];
      var cur = S.sel[ti] || 0, diff = t.opts[oi].price - t.opts[cur].price;
      b.classList.toggle('is-on', cur === oi);
      b.classList.toggle('is-poor', cur !== oi && diff > L);
      var pr = b.querySelector('.price');
      pr.textContent = (cur !== oi && diff > L) ? '잔액 부족' : (t.opts[oi].price ? U.moneyShort(t.opts[oi].price) + '원' : '무료');
      var card = b.closest('.trait'); if (card) card.classList.toggle('is-bought', cur > 0);
    });
    qsa('.edit-btn', $('trait-list')).forEach(function (b) {
      var di = +b.dataset.di, d = BF.DISORDERS[di], on = !!S.edits[di];
      b.classList.toggle('is-on', on);
      b.classList.toggle('is-poor', !on && d.price > L);
      b.querySelector('b').textContent = on ? '편집 예약됨' : '유전자 편집하기';
      b.querySelector('.price').textContent = (!on && d.price > L) ? '잔액 부족' : U.moneyShort(d.price) + '원';
      b.closest('.disorder').classList.toggle('is-edit', on);
    });
  }
  function pickOption(btn) {
    if (S.timeUp) return;
    var ti = +btn.dataset.t, oi = +btn.dataset.o, t = BF.TRAITS[ti];
    var cur = S.sel[ti] || 0;
    if (cur === oi) return;
    var diff = t.opts[oi].price - t.opts[cur].price;
    if (diff > left()) { deny(btn, diff - left()); return; }
    S.sel[ti] = oi;
    if (diff > 0) Snd.buy(); else Snd.refund();
    afterChange();
    focusPreview(t);
    if (oi > 0) ethic(t.ethic);
  }
  function toggleEdit(btn) {
    if (S.timeUp) return;
    var di = +btn.dataset.di, d = BF.DISORDERS[di];
    if (!S.edits[di] && d.price > left()) { deny(btn, d.price - left()); return; }
    S.edits[di] = !S.edits[di];
    if (S.edits[di]) { Snd.buy(); ethic(d.ethic); } else Snd.refund();
    afterChange();
  }
  function deny(btn, short) {
    Snd.deny();
    btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake');
    toast('돈이 ' + U.money(short) + ' 부족해요');
  }
  function afterChange() {
    refreshStates(); renderTabs(); renderOrder(); updateWallet(); drawPreview();
    var minP = Math.min.apply(null, settings.presets), spent = cost();
    if (spent > minP && minP < S.budget) ethic('gap', { spent: U.money(spent), min: U.money(minP) });
  }
  function renderOrder() {
    var items = sim.receiptItems(S.sel, S.edits, S.found);
    $('order-list').innerHTML = items.length ? items.map(function (it) {
      return '<li class="r-' + it.kind + '"><span>' + U.esc(it.kind === 'edit' ? it.name.replace(' 편집', '') : it.name + ' · ' + it.opt) + '</span><span>' + U.moneyShort(it.price) + '</span></li>';
    }).join('') : '<li class="empty">아직 고른 게 없어요. 모두 자연에 맡기는 중이에요.</li>';
    $('order-count').textContent = items.length + '개';
    $('order-total').textContent = U.money(cost());
  }
  var walletShown = 0, walletAnim = 0;
  function updateWallet(instant) {
    var target = left(), from = walletShown, el = $('wallet-left');
    $('wallet-sub').textContent = '예산 ' + U.money(S.budget) + ' 중 ' + U.money(cost()) + ' 사용';
    el.classList.toggle('is-low', target < S.budget * 0.1);
    cancelAnimationFrame(walletAnim);
    if (instant) { walletShown = target; el.textContent = U.money(target); return; }
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    var t0 = performance.now();
    (function step(now) {
      var u = Math.min(1, (now - t0) / 420);
      walletShown = Math.round(from + (target - from) * (1 - Math.pow(1 - u, 3)));
      el.textContent = U.money(walletShown);
      if (u < 1) walletAnim = requestAnimationFrame(step);
    })(t0);
  }

  // ---- 윤리 메모 ----
  function ethic(key, vars) {
    if (!key || !BF.ETHICS[key] || S.notesShown[key]) return;
    S.notesShown[key] = true;
    var e = BF.ETHICS[key], txt = e.text;
    if (vars) Object.keys(vars).forEach(function (k) { txt = txt.replace('{' + k + '}', vars[k]); });
    S.noteQueue.push({ tag: e.tag, text: txt });
    if (!showNote.busy) showNote();
  }
  function showNote() {
    var n = S && S.noteQueue.shift();
    var el = $('ethic-note');
    if (!n) { showNote.busy = false; el.hidden = true; return; }
    showNote.busy = true;
    $('ethic-tag').textContent = n.tag; $('ethic-text').textContent = n.text;
    el.hidden = false;
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    clearTimeout(showNote.tm);
    showNote.tm = setTimeout(showNote, 7500);
  }

  // ---- 미리보기 ----
  var PREVIEW_AGES = [0, 7, 13, 20, 50, 80];
  var FACE_TRAITS = ['eyelid', 'dimple', 'freckle', 'teeth', 'skin', 'hair'];
  function renderAgeTabs() {
    $('age-tabs').innerHTML = PREVIEW_AGES.map(function (a) {
      return '<button class="age-tab' + (S.previewAge === a ? ' is-on' : '') + '" type="button" data-age="' + a + '">' + (a === 0 ? '신생아' : a + '세') + '</button>';
    }).join('');
  }
  function focusPreview(t) {
    var best = PREVIEW_AGES[0];
    PREVIEW_AGES.forEach(function (a) { if (Math.abs(a - t.age) < Math.abs(best - t.age)) best = a; });
    S.previewAge = best;
    S.zoom = FACE_TRAITS.indexOf(t.id) >= 0;
    $('btn-zoom').classList.toggle('is-on', S.zoom);
    renderAgeTabs();
    drawPreview();
  }
  function previewOutcome() {
    var o = sim.resolve({ seed: S.seed, sel: S.sel, edits: S.edits, guarantee: S.guarantee, sex: 'N' });
    function v(id) { return S.sel[sim.traitIndex(id)] || 0; }
    // "자연에 맡기기"는 흔한 결과·위험한 쪽으로 보여 줌
    if (!v('eyelid')) o.eyelid = 'mono';
    if (!v('hair')) o.hair = 'straight';
    if (!v('dimple')) o.dimple = false;
    if (!v('freckle')) o.freckle = false;
    o.braces = !v('teeth');
    o.acne = !v('skin');
    o.hairloss = !v('hairloss');
    o.slowAging = !!v('aging');
    o.belly = !v('build');
    o.myopia = !v('eyes') && !S.zoom; // 얼굴 확대 중에는 안경이 눈매를 가리지 않게
    o.sport = v('sport') === 1 ? 'endurance' : v('sport') === 2 ? 'sprint' : null;
    o.height = sim.MEAN.N + [0, 3, 8, 14][v('height')];
    o.grayShift = 0; o.hairColor = '#2B2421'; o.career = 'teacher';
    o.has = {};
    S.found.forEach(function (id) {
      var di = -1; BF.DISORDERS.forEach(function (d, i) { if (d.id === id) di = i; });
      if (!S.edits[di]) o.has[id] = true;
    });
    return o;
  }
  var pv = { o: null, vb: null, target: null, raf: 0, last: 0 };
  function previewBox(o, age, zoom) {
    var svg = $('preview'), w = svg.clientWidth || 560, h = svg.clientHeight || 340, asp = w / h;
    var top = BF.Person.topOf(o, age);
    if (zoom && age > 0.7) {
      var L = BF.Person.look(o, age, {});
      var hh = L.hh, vh = hh * 1.55, vw = vh * asp;
      var headTop = L.wheelchair ? top : BF.sim.heightAt(o, age) + (L.tex === 'curly' ? hh * 0.1 : 0);
      return [-vw / 2, -headTop - hh * 0.18, vw, vh];
    }
    var vh2 = Math.max(top, 60) * 1.06, vw2 = vh2 * asp;
    return [-vw2 / 2, -vh2 * 0.975, vw2, vh2];
  }
  function drawPreview(instant) {
    if (!S) return;
    pv.o = previewOutcome();
    pv.target = previewBox(pv.o, S.previewAge, S.zoom);
    if (instant || !pv.vb) pv.vb = pv.target.slice();
  }
  function previewFrame(now) {
    pv.raf = requestAnimationFrame(previewFrame);
    if (now - pv.last < 33 || !pv.o) return;
    pv.last = now;
    for (var i = 0; i < 4; i++) pv.vb[i] += (pv.target[i] - pv.vb[i]) * (BF.motion.reduced() ? 1 : 0.18);
    var still = BF.motion.reduced();
    var t = still ? 0 : now / 1000, scale = $('preview').clientHeight / pv.vb[3];
    var inner = BF.Person.render(pv.o, S.previewAge, {
      sw: 2.6 / scale, blink: !still && (t % 4.7) > 4.55, yaw: Math.sin(t * 0.8) * 0.25,
      breathe: still ? 0 : Math.sin(t * 1.8), phase: still ? undefined : t, mood: 'happy'
    });
    var svg = $('preview');
    svg.setAttribute('viewBox', pv.vb.map(function (n) { return n.toFixed(2); }).join(' '));
    svg.innerHTML = inner;
  }
  function startPreviewLoop() { if (!pv.raf) pv.raf = requestAnimationFrame(previewFrame); }
  function stopPreviewLoop() { cancelAnimationFrame(pv.raf); pv.raf = 0; }

  // ---- 타이머 (조합 시간만) ----
  var timerIv = 0;
  function fmtTime(ms) { var s = Math.ceil(ms / 1000), m = Math.floor(s / 60); return m + ':' + String(s % 60).padStart(2, '0'); }
  function startTimer() {
    var T = S.timer;
    T.end = performance.now() + T.left; T.running = true;
    clearInterval(timerIv);
    timerIv = setInterval(tickTimer, 100);
    tickTimer();
  }
  function pauseTimer() {
    var T = S && S.timer; if (!T || !T.running) return;
    T.left = Math.max(0, T.end - performance.now()); T.running = false;
    clearInterval(timerIv);
    renderTimer();
  }
  function resumeTimer() { if (S && !S.timeUp && !S.timer.running) startTimer(); }
  function renderTimer() {
    var T = S.timer, el = $('timer');
    $('timer-digits').textContent = fmtTime(T.left);
    $('timer-fill').style.transform = 'scaleX(' + (T.left / T.total).toFixed(4) + ')';
    el.classList.toggle('is-warn', T.left <= 60000);
    el.classList.toggle('is-danger', T.left <= 10000 && T.left > 0);
    el.classList.toggle('is-paused', !T.running && T.left > 0 && screenId === 's-design' && $('m-checkout').hidden);
  }
  function tickTimer() {
    var T = S.timer;
    if (!T.running) return;
    T.left = Math.max(0, T.end - performance.now());
    renderTimer();
    var sec = Math.ceil(T.left / 1000), elapsed = (T.total - T.left) / 1000;
    if (sec === 60 && !T.warned[60] && T.total > 60000) { T.warned[60] = 1; Snd.warn(); toast('1분 남았어요!'); }
    if (sec === 30 && !T.warned[30] && T.total > 30000) { T.warned[30] = 1; Snd.warn(); toast('30초 남았어요!'); }
    if (sec <= 10 && sec > 0 && !T.warned['s' + sec]) { T.warned['s' + sec] = 1; Snd.tick(sec <= 3); }
    if (elapsed > 95 && !T.warned.n1) { T.warned.n1 = 1; ethic('natural'); }
    if (elapsed > 190 && !T.warned.n2) { T.warned.n2 = 1; ethic(S.edits.some(Boolean) ? 'offtarget' : 'law'); }
    if (T.left <= 0) timeUp();
  }
  function timeUp() {
    clearInterval(timerIv);
    S.timer.running = false; S.timeUp = true;
    renderTimer();
    Snd.alarm();
    $('o-timeup').hidden = false;
    setTimeout(function () { $('o-timeup').hidden = true; openCheckout(true); }, 2200);
  }
  function stopTimer() { clearInterval(timerIv); if (S) S.timer.running = false; }

  // ================= 결제 =================
  function receiptHTML() {
    var items = sim.receiptItems(S.sel, S.edits, S.found), spent = cost();
    var d = new Date();
    var h = '<h4>베이비 팩토리</h4><p class="r-sub">주문 No.' + String(S.order).padStart(4, '0') + ' · ' + U.fmtDate(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + '</p><hr>';
    if (!items.length) h += '<div class="r-line"><span>주문한 항목 없음<span class="r-opt">모두 자연에 맡김</span></span><span>0원</span></div>';
    items.forEach(function (it) {
      h += '<div class="r-line"><span>' + U.esc(it.name) + '<span class="r-opt">' + U.esc(it.opt) + '</span></span><span>' + U.moneyShort(it.price) + '</span></div>';
    });
    h += '<hr><div class="r-line r-total"><span>합계</span><span>' + U.money(spent) + '</span></div>';
    h += '<div class="r-line"><span>보유 자산</span><span>' + U.money(S.budget) + '</span></div>';
    h += '<div class="r-line"><span>남은 돈</span><span>' + U.money(S.budget - spent) + '</span></div>';
    h += '<div class="r-bar"></div><p class="r-foot">※ 가상 금액 · 실제 결제가 아닙니다<br>환불 불가 · 결과는 태어나야 알 수 있어요</p>';
    return h;
  }
  function openCheckout(locked) {
    pauseTimer();
    $('receipt').innerHTML = receiptHTML();
    var r = $('receipt'); r.style.animation = 'none'; void r.offsetWidth; r.style.animation = '';
    Snd.print();
    if (!S.name) S.name = U.pick(U.rng(S.seed, 77), BF.BABY_NAMES);
    $('baby-name').value = S.name;
    var uncertain = [];
    if (S.sel[sim.traitIndex('height')] || S.sel[sim.traitIndex('iq')]) uncertain.push('키·지능은 "기대치"라서 실제 결과는 다를 수 있어요.');
    if (S.edits.some(Boolean)) uncertain.push('유전자 편집 성공률은 100%가 아니에요.');
    $('checkout-note').innerHTML = (locked ? '<b>설계 시간이 끝났어요.</b> ' : '') + '결제하면 되돌릴 수 없어요. ' + uncertain.join(' ');
    $('btn-back').hidden = !!locked;
    openModal('m-checkout');
    setTimeout(function () { $('baby-name').focus(); $('baby-name').select(); }, 120);
  }
  function cleanName(v) {
    v = String(v || '').replace(/[<>&"'`\\/{}[\]#]/g, '').replace(/\s+/g, ' ').trim().slice(0, 6);
    return v || '아기';
  }
  var current = null; // 확정된 결과
  function pay() {
    S.name = cleanName($('baby-name').value);
    stopTimer();
    closeModal('m-checkout');
    var order = (U.store.get('order', 0) || 0) + 1;
    U.store.set('order', order);
    S.order = order;
    var rec = { seed: S.seed, sel: S.sel.slice(), edits: S.edits.slice(), guarantee: S.guarantee, budget: S.budget, order: order, day: U.todayIndex(), name: S.name };
    var built = sim.build(rec);
    built.token = sim.encodeResult(rec);
    current = built;
    var recent = U.store.get('recent', []) || [];
    recent.push(built.token);
    U.store.set('recent', recent.slice(-20));
    gotoBirth();
  }

  // ================= 4. 탄생 =================
  var birthTimers = [];
  function later(fn, ms) { birthTimers.push(setTimeout(fn, ms)); }
  function gotoBirth() {
    var b = current, o = b.o;
    birthTimers.forEach(clearTimeout); birthTimers = [];
    var pod = $('pod');
    pod.className = 'pod is-busy';
    $('s-birth').classList.remove('is-revealed');
    $('reveal').hidden = true;
    $('pod-label').textContent = 'EDITING';
    $('pod-status').textContent = '결제 완료';
    $('pod-steps').innerHTML = '';
    $('pod-baby').innerHTML = BF.Person.render(o, 0, { sw: 1.2, mood: 'happy' });
    show('s-birth');
    Snd.print();
    var steps = [];
    o.disorders.forEach(function (x) {
      var d = sim.disorderById(x.id);
      if (x.status === 'removed') steps.push({ t: d.gene + ' 편집 … 성공', c: 'ok', s: 'success' });
      else if (x.status === 'failed') steps.push({ t: d.gene + ' 편집 … 실패', c: 'bad', s: 'fail' });
    });
    b.items.filter(function (it) { return it.kind === 'trait'; }).slice(0, 3).forEach(function (it) { steps.push({ t: it.name + ' 적용 중…', c: '', s: 'scan' }); });
    if (!steps.length) steps.push({ t: '아무것도 고치지 않음 · 자연 그대로', c: 'ok', s: 'clear' });
    later(function () { $('pod-status').textContent = '유전자 편집 중'; }, 900);
    steps.forEach(function (st, i) {
      later(function () {
        var p = document.createElement('div'); p.className = st.c; p.textContent = st.t;
        var box = $('pod-steps'); box.appendChild(p);
        while (box.children.length > 4) box.removeChild(box.firstChild);
        Snd[st.s]();
      }, 1300 + i * 650);
    });
    var tOpen = 1500 + steps.length * 650 + 300;
    later(function () {
      pod.className = 'pod is-open';
      $('pod-label').textContent = 'HELLO';
      $('pod-status').textContent = U.josa(b.rec.name, '이', '가') + ' 태어났어요!';
      Snd.fanfare();
    }, tOpen);
    later(showReveal, tOpen + 1700);
  }
  function revealRows() {
    var b = current, o = b.o, rows = [];
    function src(id) { return o.bought[id] ? '<span class="src">주문</span>' : '<span class="src">자연</span>'; }
    rows.push({ k: '성별', v: (o.sex === 'F' ? '여자아이' : '남자아이') + '<span class="src">자연</span>', c: 'nat' });
    o.disorders.forEach(function (x) {
      var d = sim.disorderById(x.id);
      if (x.status === 'removed') rows.push({ k: d.gene, v: d.name + ' 유전자 편집 성공', c: 'good' });
      else if (x.status === 'failed') rows.push({ k: d.gene, v: d.name + ' 편집 실패 (성공률 ' + Math.round(d.success * 100) + '%였지만…)', c: 'bad' });
      else rows.push({ k: d.gene, v: d.name + ' · 편집하지 않음', c: 'nat' });
    });
    rows.push({ k: '쌍꺼풀', v: { mono: '무쌍', inner: '속쌍꺼풀', double: '또렷한 쌍꺼풀' }[o.eyelid] + src('eyelid'), c: o.bought.eyelid ? '' : 'nat' });
    rows.push({ k: '머리 모양', v: { straight: '직모', wavy: '웨이브', curly: '곱슬' }[o.hair] + src('hair'), c: o.bought.hair ? '' : 'nat' });
    if (o.heightExp) rows.push({ k: '키 기대치', v: o.heightExp + 'cm · 실제 키는 자라 봐야 알아요' });
    if (o.iqExp) rows.push({ k: '지능 기대치', v: 'IQ ' + o.iqExp + ' · 실제는 자라 봐야 알아요' });
    var nb = Object.keys(o.bought).length;
    rows.push({ k: '주문한 형질', v: nb ? nb + '개 · 나머지는 자연이 골랐어요' : '없음 · 전부 자연이 골랐어요', c: 'nat' });
    return rows;
  }
  var lifeCountdown = 0;
  function showReveal() {
    var b = current;
    $('s-birth').classList.add('is-revealed');
    $('reveal-title').textContent = b.rec.name + ' · No.' + String(b.rec.order).padStart(4, '0');
    $('reveal-list').innerHTML = revealRows().map(function (r, i) {
      return '<li class="' + (r.c || '') + '" style="animation-delay:' + (i * 0.08) + 's"><b>' + r.k + '</b><span>' + r.v + '</span></li>';
    }).join('');
    $('reveal').hidden = false;
    var n = 12;
    clearInterval(lifeCountdown);
    $('btn-life').textContent = '인생 재생 ▶ ' + n;
    lifeCountdown = setInterval(function () {
      if (!$('m-confirm').hidden || !$('m-settings').hidden) return; // 창이 떠 있는 동안은 멈춤
      n--;
      $('btn-life').textContent = '인생 재생 ▶ ' + n;
      if (n <= 0) { clearInterval(lifeCountdown); gotoLife(); }
    }, 1000);
    $('btn-life').focus();
  }

  // ================= 5. 인생 재생 =================
  var player = null;
  function gotoLife() {
    clearInterval(lifeCountdown);
    if (screenId === 's-life') return;
    var b = current;
    $('life-log').innerHTML = '';
    $('life-name').textContent = b.rec.name + '의 일생';
    var track = $('life-track');
    qsa('.tick', track).forEach(function (t) { t.remove(); });
    b.scenes.forEach(function (sc) {
      var tk = document.createElement('span'); tk.className = 'tick';
      tk.style.left = (sc.age / b.o.endAge * 100) + '%';
      track.appendChild(tk);
    });
    player = new BF.Stage.Player($('life-svg'), {
      W: 1600, H: 900, groundY: 800, figureX: 560, rulerX: 120, topMargin: 280,
      onScene: function (sc, idx, silent) { addCard(sc); if (!silent) { (sc.mood === 'soft' ? Snd.soft : Snd.pop)(); offerStoryChoice(sc); } },
      onTick: function (age) {
        $('life-age').textContent = Math.floor(age + 0.001);
        $('life-stage').textContent = sim.stageName(age);
        $('life-year').textContent = (2026 + Math.floor(age + 0.001)) + '년';
        var p = U.clamp(age / b.o.endAge, 0, 1) * 100;
        $('life-fill').style.width = p + '%'; $('life-dot').style.left = p + '%';
      },
      onEnd: function () { setTimeout(function () { if (screenId === 's-life') gotoResult(); }, 1400); }
    });
    player.speed = settings.speed || 1;
    player.load(b, b.rec.name);
    $('btn-pause').disabled=false;
    $('btn-pause').textContent = '일시정지'; $('btn-pause').classList.remove('is-on');
    $('btn-speed').textContent = player.speed > 1 ? '보통 속도' : '2배속'; $('btn-speed').classList.toggle('is-on', player.speed > 1);
    show('s-life');
    player.play();
  }
  function offerStoryChoice(sc) {
    var choice = BF.Story.choiceOf(sc);
    if (!choice || choice.selected) return;
    player.paused = true;
    $('btn-pause').disabled = true;
    $('btn-pause').textContent = '선택을 기다리는 중';
    var card = $('life-log').firstElementChild;
    card.insertAdjacentHTML('beforeend', BF.Story.markup(choice));
    card.querySelectorAll('[data-story-option]').forEach(function(button){
      button.addEventListener('click', function(){
        var oldToken = current.token;
        current.rec.choices = BF.Story.choices(current.rec);
        current.rec.choices[choice.id] = +button.dataset.storyOption;
        var updated = sim.build(current.rec);
        updated.token = sim.encodeResult(updated.rec);
        current = updated;
        var recent=U.store.get('recent',[])||[];
        U.store.set('recent',recent.map(function(t){return t===oldToken?updated.token:t;}));
        var speed=player.speed;
        player.load(updated,updated.rec.name);player.speed=speed;
        var segment=player.segs.filter(function(s){return s.type==='hold' && s.scene.items.some(function(e){return e.choice && e.choice.id===choice.id;});})[0];
        player.t=segment.t0;player.lastScene=segment.idx-1;player.cam=null;
        $('life-log').innerHTML='';
        $('btn-pause').disabled=false;$('btn-pause').textContent='일시정지';$('btn-pause').classList.remove('is-on');
        player.play();
      });
    });
    card.querySelector('button').focus({preventScroll:true});
  }
  function addCard(sc) {
    var log = $('life-log');
    var srcName = { bought: '주문한 유전자', natural: '자연', edit: '유전자 편집', miss: '빗나간 주문' };
    var srcs = [];
    sc.items.forEach(function (it) { if (srcName[it.src] && srcs.indexOf(it.src) < 0) srcs.push(it.src); });
    var el = document.createElement('div');
    el.className = 'card' + (sc.final ? ' final' : '');
    var chapter=sc.items.map(function(it){return it.chapter;}).filter(Boolean)[0];
    var choice=BF.Story.choiceOf(sc);
    el.innerHTML = (chapter ? '<div class="story-chapter">'+U.esc(chapter)+'</div>' : '') + '<div class="card-head"><span class="card-age">' + Math.floor(sc.age) + '세</span>' +
      srcs.map(function (s) { return '<span class="src ' + s + '">' + srcName[s] + '</span>'; }).join('') + '</div>' +
      sc.items.map(function (it) { return '<p>' + U.esc(it.text) + '</p>'; }).join('');
    if(choice && choice.selected) el.insertAdjacentHTML('beforeend','<p class="story-selected">나의 선택 · '+U.esc(choice.options[choice.selected-1])+'</p>');
    log.insertBefore(el, log.firstChild);
    while (log.children.length > 5) log.removeChild(log.lastChild);
  }

  // ================= 6. 결과 =================
  function resultBase() {
    var s = String(settings.baseUrl || '').trim();
    if (s) return { url: s.replace(/#.*$/, ''), ok: /^https:\/\//i.test(s), set: true };
    var here = location.href.replace(/#.*$/, '');
    var local = /^file:/i.test(location.protocol) || /^(localhost|127\.|\[::1\]|192\.168\.|10\.)/.test(location.hostname);
    return { url: here, ok: !local && /^https:/i.test(location.protocol), set: false };
  }
  function resultURL(b) { return resultBase().url + '#' + b.token; }
  function gotoResult() {
    if (player) player.stop();
    var b = current, o = b.o;
    $('res-title').textContent = b.rec.name + '의 일생';
    var ages = BF.Card.FILM_AGES(o);
    $('film').innerHTML = ages.map(function (a) {
      return '<div class="frame">' + BF.Person.standalone(o, a, { w: 130, h: 190, minCm: 120, px: 1.8, mood: 'happy' }) +
        '<b>' + a + '세</b><small>' + U.esc(BF.Card.filmCaption(o, a)) + '</small></div>';
    }).join('');
    var stats = [];
    stats.push({ k: '최종 키', v: Math.round(o.height) + 'cm', s: o.heightExp ? '기대치 ' + o.heightExp + 'cm · ' + (Math.round(o.height - o.heightExp) >= 0 ? '+' : '') + Math.round(o.height - o.heightExp) + 'cm' : '자연에 맡김' });
    stats.push({ k: '지능 검사', v: 'IQ ' + o.iq, s: o.iqExp ? '기대치 ' + o.iqExp + ' · ' + (o.iq - o.iqExp >= 0 ? '+' : '') + (o.iq - o.iqExp) : '자연에 맡김' });
    stats.push({ k: '직업', v: BF.CAREERS[o.career].name, s: '유전자가 정한 걸까요?' });
    stats.push({ k: '기대 수명', v: o.lifespan + '세', s: o.longevity ? '장수 유전자 주문' : '자연에 맡김' });
    $('res-stats').innerHTML = stats.map(function (s) { return '<div class="stat"><span>' + s.k + '</span><strong' + (s.v.length > 6 ? ' class="long"' : '') + '>' + U.esc(s.v) + '</strong><small>' + s.s + '</small></div>'; }).join('');
    var presets = settings.presets.slice().sort(function (a, c) { return a - c; });
    var can = presets.filter(function (p) { return p >= b.spent; }).length;
    var editN = o.disorders.filter(function (x) { return x.status !== 'kept'; }).length;
    $('res-money').innerHTML = '<h4>영수증 요약</h4>' +
      '<div class="money-row"><span>보유 자산</span><b>' + U.money(b.rec.budget) + '</b></div>' +
      '<div class="money-row"><span>주문한 형질</span><b>' + Object.keys(o.bought).length + '개</b></div>' +
      '<div class="money-row"><span>사용한 돈</span><b>' + U.money(b.spent) + '</b></div>' +
      '<div class="money-row"><span>유전자 편집</span><b>' + editN + '건</b></div>' +
      '<div class="money-row"><span>남은 돈</span><b>' + U.money(b.rec.budget - b.spent) + '</b></div>' +
      '<div class="money-row"><span>자연에 맡긴 형질</span><b>' + (BF.TRAITS.length - Object.keys(o.bought).length) + '개</b></div>' +
      '<div class="reach"><div class="reach-dots">' + presets.map(function (p) { return '<i class="' + (p >= b.spent ? 'ok' : '') + '" title="' + U.money(p) + '"></i>'; }).join('') + '</div>' +
      '<p>이 아기를 똑같이 주문할 수 있는 예산은 룰렛 <b>' + presets.length + '칸 중 ' + can + '칸</b>이에요.' + (can < presets.length ? ' 나머지 칸을 뽑은 사람은 같은 선택을 할 수 없어요.' : ' 이번 주문은 누구나 할 수 있었어요.') + '</p></div>';
    renderQR(b);
    $('res-vote').textContent = '"' + BF.EVENT.vote + '" 찬성? 반대?';
    show('s-result');
    Snd.success();
  }
  function renderQR(b) {
    var url = resultURL(b), base = resultBase();
    var qr = BF.QR.encode(url, 'M');
    $('qr-box').innerHTML = BF.QR.toSVG(qr, { border: 2 });
    $('qr-url').textContent = url;
    var warn = $('qr-warn');
    if (!base.ok) {
      warn.hidden = false;
      warn.textContent = base.set ? '결과 페이지 주소가 https로 시작하지 않아요. 휴대폰에서 열리지 않을 수 있어요.'
        : '지금 주소(' + (location.protocol === 'file:' ? '내 컴퓨터 파일' : location.host) + ')는 다른 휴대폰에서 열 수 없어요. 운영자 설정에서 "결과 페이지 주소"를 입력하세요.';
    } else warn.hidden = true;
  }
  function copyURL() {
    var url = $('qr-url').textContent;
    function fallback() {
      var r = document.createRange(); r.selectNodeContents($('qr-url'));
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      try { document.execCommand('copy'); toast('주소를 복사했어요'); } catch (e) { toast('주소를 선택했어요. Ctrl+C로 복사하세요'); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { toast('주소를 복사했어요'); }, fallback);
    else fallback();
  }
  function printLabel() {
    var lab = BF.Card.labelHTML(current, resultURL(current), settings.label);
    $('page-style').textContent = lab.css;
    $('print-area').innerHTML = lab.html;
    setTimeout(function () { window.print(); }, 60);
  }
  function fileName(kind) { return 'baby-factory-' + String(current.rec.order).padStart(4, '0') + '-' + kind + '.png'; }
  function saveLabelPNG() {
    BF.Card.labelCanvas(current, resultURL(current), settings.label).then(function (c) { return BF.Card.download(c, fileName('label-' + settings.label)); })
      .then(function () { toast('라벨 이미지를 저장했어요'); }, function () { toast('이미지를 만들지 못했어요'); });
  }
  function saveCardPNG() {
    toast('결과 카드를 만드는 중…', 1500);
    BF.Card.resultCard(current, resultURL(current)).then(function (c) { return BF.Card.download(c, fileName('card')); })
      .then(function () { toast('결과 카드를 저장했어요'); }, function () { toast('이미지를 만들지 못했어요'); });
  }

  // ================= 처음으로 / 다음 참가자 =================
  function resetAll() {
    stopTimer();
    scanTimers.forEach(clearTimeout); birthTimers.forEach(clearTimeout);
    clearInterval(lifeCountdown);
    if (player) { player.stop(); player = null; }
    qsa('.modal').forEach(function (m) { m.hidden = true; });
    settingsResume = null;
    $('o-timeup').hidden = true;
    S = null; current = null;
    if (showNote.tm) clearTimeout(showNote.tm); showNote.busy = false;
    buildBelt();
    show('s-title');
  }
  function askHome() {
    if (screenId === 's-title') return;
    $('confirm-title').textContent = '처음으로 돌아갈까요?';
    $('confirm-text').textContent = screenId === 's-result' ? '다음 참가자를 맞이할 준비를 해요.' : '지금까지 진행한 내용은 사라져요.';
    var wasRunning = S && S.timer && S.timer.running;
    if (wasRunning) pauseTimer();
    var playerWasPaused = player && player.paused;
    if (player) player.paused = true;
    askHome.resume = function () { if (wasRunning) resumeTimer(); if (player) player.paused = playerWasPaused; };
    openModal('m-confirm');
  }

  // ================= 설정 =================
  // 설정 창이 떠 있는 동안 설계 타이머와 인생 재생을 멈췄다가, 닫으면 다시 이어 감
  var settingsResume = null;
  function closeSettings() {
    closeModal('m-settings');
    if (settingsResume) { settingsResume(); settingsResume = null; }
  }
  function openSettings() {
    if (!settingsResume) {
      var timerWas = !!(S && S.timer && S.timer.running), playerWas = !!(player && !player.paused);
      if (timerWas) pauseTimer();
      if (playerWas) player.paused = true;
      settingsResume = function () { if (timerWas) resumeTimer(); if (playerWas && player) player.paused = false; };
    }
    $('set-presets').value = settings.presets.join(', ');
    $('set-timer').value = settings.timer;
    $('set-base').value = settings.baseUrl || '';
    $('set-label').value = settings.label;
    $('set-guarantee').checked = !!settings.guarantee;
    $('set-sound').checked = !!settings.sound;
    $('set-count').textContent = '지금까지 ' + (U.store.get('order', 0) || 0) + '명 체험';
    baseHint();
    openModal('m-settings');
  }
  function baseHint() {
    var v = $('set-base').value.trim(), el = $('set-base-hint');
    if (!v) {
      var b = resultBase();
      el.className = 'set-hint' + (b.ok && !b.set ? '' : ' bad');
      el.textContent = '비워 두면 지금 주소를 사용: ' + location.href.replace(/#.*$/, '') + (b.ok && !b.set ? '' : ' → 휴대폰에서 열리지 않아요');
    } else {
      var ok = /^https:\/\/[^\s]+$/i.test(v);
      el.className = 'set-hint' + (ok ? '' : ' bad');
      el.textContent = ok ? 'QR 예시: ' + v.replace(/#.*$/, '') + '#b…' : 'https:// 로 시작하는 주소를 입력하세요';
    }
  }
  function saveSettingsFromForm() {
    var ps = $('set-presets').value.split(/[,\s]+/).map(function (x) { return Math.floor(+x.replace(/[^\d]/g, '')); }).filter(function (x) { return x >= 100 && x <= 1000000; });
    if (ps.length < 2) { toast('룰렛 금액을 2개 이상 입력하세요 (만원 단위)'); return; }
    settings.presets = ps.slice(0, 12);
    settings.timer = U.clamp(Math.round(+$('set-timer').value || 300), 30, 1800);
    settings.baseUrl = $('set-base').value.trim();
    settings.label = $('set-label').value;
    settings.guarantee = $('set-guarantee').checked;
    settings.sound = $('set-sound').checked;
    Snd.setOn(settings.sound);
    $('btn-sound').classList.toggle('is-off', !settings.sound);
    saveSettings();
    closeSettings();
    if (screenId === 's-budget') renderPresets();
    if (screenId === 's-result' && current) renderQR(current);
    toast('설정을 저장했어요');
  }

  // ================= 설명 슬라이드 =================
  var exIdx = 0;
  function exGo(i) {
    var slides = qsa('.ex-slide');
    exIdx = U.clamp(i, 0, slides.length - 1);
    slides.forEach(function (s, k) { s.classList.toggle('is-on', k === exIdx); });
    $('ex-prev').disabled = exIdx === 0;
    $('ex-next').textContent = exIdx === slides.length - 1 ? '닫기' : '다음';
  }

  // ================= 이벤트 연결 =================
  document.addEventListener('pointerdown', function () { Snd.unlock(); }, { once: true });
  $('btn-start').addEventListener('click', function () { Snd.click(); gotoBudget(); });
  $('btn-explain').addEventListener('click', function () { Snd.click(); $('ex-q').textContent = BF.EVENT.question; exGo(0); openModal('m-explain'); });
  $('ex-prev').addEventListener('click', function () { exGo(exIdx - 1); });
  $('ex-next').addEventListener('click', function () { if (exIdx >= qsa('.ex-slide').length - 1) closeModal('m-explain'); else exGo(exIdx + 1); });

  $('budget-in').addEventListener('input', function () {
    var digits = this.value.replace(/[^\d]/g, '');
    if (digits !== this.value) this.value = digits;
    setBudget(+digits, true);
  });
  $('budget-in').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !$('btn-budget-ok').disabled) $('btn-budget-ok').click(); });
  $('presets').addEventListener('click', function (e) { var b = e.target.closest('.preset'); if (b) { Snd.click(); setBudget(+b.dataset.v); } });
  $('btn-roulette').addEventListener('click', function () { $('wheel-result').textContent = '버튼을 눌러 돌려 주세요'; drawWheel(); openModal('m-roulette'); });
  $('btn-spin').addEventListener('click', spin);
  $('btn-wheel-close').addEventListener('click', function () { if (!spinning) closeModal('m-roulette'); });
  $('btn-budget-ok').addEventListener('click', function () { if (budgetVal >= 100) { Snd.click(); gotoScan(); } });
  $('btn-scan-ok').addEventListener('click', function () { Snd.tab(); gotoDesign(); });

  $('tabs').addEventListener('click', function (e) {
    var b = e.target.closest('.tab'); if (!b) return;
    S.tab = b.dataset.cat;
    if (S.tab === 'health') S.healthSeen = true;
    Snd.tab(); renderTabs(); renderTraits();
  });
  $('trait-list').addEventListener('click', function (e) {
    var o = e.target.closest('.opt'); if (o) { pickOption(o); return; }
    var ed = e.target.closest('.edit-btn'); if (ed) toggleEdit(ed);
  });
  $('age-tabs').addEventListener('click', function (e) {
    var b = e.target.closest('.age-tab'); if (!b) return;
    S.previewAge = +b.dataset.age; Snd.click(); renderAgeTabs(); drawPreview();
  });
  $('btn-zoom').addEventListener('click', function () { S.zoom = !S.zoom; this.classList.toggle('is-on', S.zoom); Snd.click(); drawPreview(); });
  $('ethic-note').addEventListener('click', function () { clearTimeout(showNote.tm); showNote(); });
  $('btn-checkout').addEventListener('click', function () { Snd.click(); openCheckout(false); });
  $('btn-back').addEventListener('click', function () { closeModal('m-checkout'); resumeTimer(); });
  $('btn-rename').addEventListener('click', function () {
    var cur = $('baby-name').value, n = cur, r = U.rng(U.newSeed(), 1);
    while (n === cur) n = U.pick(r, BF.BABY_NAMES);
    $('baby-name').value = n; Snd.click();
  });
  $('baby-name').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.isComposing) $('btn-pay').click(); });
  $('btn-pay').addEventListener('click', pay);
  $('btn-life').addEventListener('click', gotoLife);

  $('btn-pause').addEventListener('click', function () {
    if (!player) return;
    player.paused = !player.paused;
    this.textContent = player.paused ? '계속 재생' : '일시정지';
    this.classList.toggle('is-on', player.paused);
  });
  $('btn-speed').addEventListener('click', function () {
    if (!player) return;
    player.speed = player.speed > 1 ? 1 : 2;
    this.textContent = player.speed > 1 ? '보통 속도' : '2배속';
    this.classList.toggle('is-on', player.speed > 1);
  });
  $('btn-skip').addEventListener('click', function () { if (player) { $('btn-pause').disabled=false;player.skip(); } });

  $('btn-copy').addEventListener('click', copyURL);
  $('btn-print').addEventListener('click', printLabel);
  $('btn-qr-png').addEventListener('click', saveLabelPNG);
  $('btn-card-png').addEventListener('click', saveCardPNG);
  $('btn-next').addEventListener('click', function () { Snd.click(); resetAll(); });

  qsa('[data-home]').forEach(function (b) { b.addEventListener('click', askHome); });
  $('btn-confirm-no').addEventListener('click', function () { closeModal('m-confirm'); if (askHome.resume) askHome.resume(); });
  $('btn-confirm-yes').addEventListener('click', function () { closeModal('m-confirm'); resetAll(); });

  $('btn-settings').addEventListener('click', openSettings);
  $('set-base').addEventListener('input', baseHint);
  $('btn-set-cancel').addEventListener('click', closeSettings);
  $('btn-set-save').addEventListener('click', saveSettingsFromForm);
  $('btn-reset-count').addEventListener('click', function () { U.store.set('order', 0); U.store.set('recent', []); $('set-count').textContent = '지금까지 0명 체험 · 다음 주문은 No.0001'; });
  $('btn-sound').addEventListener('click', function () {
    settings.sound = !settings.sound; Snd.setOn(settings.sound); saveSettings();
    this.classList.toggle('is-off', !settings.sound);
    if (settings.sound) Snd.click();
  });
  $('btn-sound').classList.toggle('is-off', !settings.sound);
  $('btn-full').addEventListener('click', function () {
    var d = document;
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else { var el = d.documentElement, rq = el.requestFullscreen || el.webkitRequestFullscreen; if (rq) { var p = rq.call(el); if (p && p.catch) p.catch(function () { }); } }
  });

  document.addEventListener('keydown', function (e) {
    var typing = /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '');
    if (e.key === 'Escape') {
      if (!$('m-explain').hidden) closeModal('m-explain');
      else if (!$('m-settings').hidden) closeSettings();
      else if (!$('m-roulette').hidden && !spinning) closeModal('m-roulette');
      else if (!$('m-confirm').hidden) { closeModal('m-confirm'); if (askHome.resume) askHome.resume(); }
      return;
    }
    if (typing) return;
    var anyModal = qsa('.modal').some(function (m) { return !m.hidden; });
    if (anyModal) return;
    if (e.key === 'Enter') {
      if (screenId === 's-title') { e.preventDefault(); $('btn-start').click(); }
      else if (screenId === 's-scan' && !$('btn-scan-ok').hidden) { e.preventDefault(); $('btn-scan-ok').click(); }
      else if (screenId === 's-birth' && !$('reveal').hidden) { e.preventDefault(); gotoLife(); }
    }
    if (screenId === 's-life' && e.key === ' ') { e.preventDefault(); $('btn-pause').click(); }
    // 운영자: Shift+P 로 설계 타이머 일시정지/재개
    if (screenId === 's-design' && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
      if (S.timer.running) { pauseTimer(); toast('타이머 일시정지 (Shift+P로 재개)'); } else if (!S.timeUp) { resumeTimer(); toast('타이머 재개'); }
    }
  });

  buildBelt();
  show('s-title');
})();
