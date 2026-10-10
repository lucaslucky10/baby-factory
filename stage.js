/* 베이비 팩토리 — 성장 무대: 시기별 배경, 키재기 자, 카메라, 인생 재생 타이머 */
'use strict';
var BF = window.BF || (window.BF = {});

(function (BF) {
  var U = BF.util, INK = '#1E2A47';
  function f(n) { return Math.round(n * 100) / 100; }

  // 시기별 배경 (화면 좌표). 벽·바닥은 전체 폭(W), 소품은 사람(fx) 기준으로 배치해 겹치지 않게.
  function backdrops(W, H, gy, name, fx) {
    var s = '', i;
    var nm = U.esc(name || '');
    function rect(x, y, w, h, fill, extra) { return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '" fill="' + fill + '"' + (extra || '') + '/>'; }
    function ln(x1, y1, x2, y2, w) { return '<line x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2) + '" y2="' + f(y2) + '" stroke="' + INK + '" stroke-width="' + (w || 3) + '"/>'; }
    var st = ' stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"';
    var mono = 'font-family="Nanum Gothic Coding, monospace"';

    // 0 아기방 (0~5세)
    s += '<g data-scene="0">' + rect(0, 0, W, gy, '#FCE6EE');
    for (i = 0; i < 44; i++) s += '<circle cx="' + ((i * 137) % W) + '" cy="' + (30 + ((i * 89) % (gy - 60))) + '" r="7" fill="#F9CFDC"/>';
    var wx0 = fx + 190, wy0 = gy * 0.16;
    s += rect(wx0, wy0, 200, 230, '#2D3A66', st + ' rx="96"');
    s += '<circle cx="' + f(wx0 + 70) + '" cy="' + f(wy0 + 80) + '" r="24" fill="#FFE9A8"/><circle cx="' + f(wx0 + 82) + '" cy="' + f(wy0 + 72) + '" r="21" fill="#2D3A66"/>';
    s += '<path d="M' + f(wx0 + 140) + ' ' + f(wy0 + 140) + 'l4 10 10 2-8 7 2 10-8-5-8 5 2-10-8-7 10-2z" fill="#FFE9A8"/>';
    var my = gy * 0.12;
    s += ln(fx, 0, fx, my) + ln(fx - 90, my, fx + 90, my);
    [[-90, '#FFD23F'], [0, '#8EC9F0'], [90, '#FF6F91']].forEach(function (m) { s += ln(fx + m[0], my, fx + m[0], my + 50, 2) + '<circle cx="' + f(fx + m[0]) + '" cy="' + f(my + 66) + '" r="16" fill="' + m[1] + '"' + st + '/>'; });
    var cx0 = fx + 160, cw = 300, ch = 160;
    s += rect(cx0, gy - ch, cw, ch * 0.75, 'none', st);
    for (i = 1; i < 8; i++) s += ln(cx0 + cw * i / 8, gy - ch, cx0 + cw * i / 8, gy - ch * 0.25);
    s += rect(cx0 - 8, gy - ch - 10, 16, ch + 10, '#FFFFFF', st + ' rx="6"') + rect(cx0 + cw - 8, gy - ch - 10, 16, ch + 10, '#FFFFFF', st + ' rx="6"');
    s += rect(0, gy, W, H - gy, '#F2D7AE') + '<g stroke="#E2C090" stroke-width="3">';
    for (i = 0; i < 14; i++) s += '<line x1="' + (i * 160) + '" y1="' + gy + '" x2="' + (i * 160 - 60) + '" y2="' + H + '"/>';
    s += '</g></g>';

    // 1 학교 (6~18세)
    s += '<g data-scene="1" opacity="0">' + rect(0, 0, W, gy, '#E7F1E2') + rect(0, gy - 70, W, 70, '#CFE2C6');
    var bx = fx - 130, bw = 470, bt = gy * 0.13, bh = gy * 0.33;
    s += rect(bx - 14, bt - 14, bw + 28, bh + 28, '#B98B5E', st + ' rx="10"') + rect(bx, bt, bw, bh, '#2F5D50', st);
    s += '<text x="' + f(bx + 30) + '" y="' + f(bt + 62) + '" ' + mono + ' font-size="34" fill="#F4F1DE" opacity="0.9">' + (nm ? nm + ' 화이팅!' : '오늘도 화이팅!') + '</text>';
    s += '<text x="' + f(bx + 30) + '" y="' + f(bt + 118) + '" ' + mono + ' font-size="26" fill="#F4F1DE" opacity="0.75">급식: 짜장면</text>';
    s += '<text x="' + f(bx + 30) + '" y="' + f(bt + 168) + '" ' + mono + ' font-size="26" fill="#F4F1DE" opacity="0.6">1 + 1 = 2</text>';
    var ckx = fx - 270, cky = gy * 0.17;
    s += '<circle cx="' + f(ckx) + '" cy="' + f(cky) + '" r="46" fill="#FFFFFF"' + st + '/>' + ln(ckx, cky, ckx, cky - 30, 4) + ln(ckx, cky, ckx + 22, cky + 8, 4);
    var dx = fx + 175;
    s += rect(dx, gy - 120, 170, 22, '#D8B07A', st + ' rx="4"') + rect(dx + 14, gy - 98, 14, 98, '#9AA5B8', st) + rect(dx + 142, gy - 98, 14, 98, '#9AA5B8', st);
    s += rect(0, gy, W, H - gy, '#C7D5DE') + '<g stroke="#B3C3CE" stroke-width="3">';
    for (i = 0; i < 24; i++) s += '<line x1="' + (i * 90) + '" y1="' + gy + '" x2="' + (i * 90) + '" y2="' + H + '"/>';
    s += '</g></g>';

    // 2 청년: 도시가 보이는 창 (19~29세)
    s += '<g data-scene="2" opacity="0">' + rect(0, 0, W, gy, '#FFF1D0');
    var cwx = fx - 120, cww = 520, cwt = gy * 0.1, cwh = gy * 0.48;
    s += rect(cwx, cwt, cww, cwh, '#9FD3F5', st + ' rx="8"');
    [[0, 0.55], [0.12, 0.35], [0.26, 0.62], [0.4, 0.28], [0.55, 0.5], [0.7, 0.38], [0.84, 0.58]].forEach(function (b) {
      var x = cwx + cww * b[0], w = cww * 0.13, top = cwt + cwh * b[1];
      s += rect(x, top, w, cwt + cwh - top, '#34466F');
      for (var yy = top + 14; yy < cwt + cwh - 14; yy += 26) for (var xx = x + 10; xx < x + w - 10; xx += 22) if (((xx * 7 + yy * 3) | 0) % 3) s += rect(xx, yy, 9, 12, '#FFD23F', ' opacity="0.85"');
    });
    s += rect(cwx, cwt, cww, cwh, 'none', st + ' rx="8"') + ln(cwx + cww / 2, cwt, cwx + cww / 2, cwt + cwh, 5);
    var pox = fx - 330, poy = gy * 0.18, rot = ' transform="rotate(-4 ' + f(pox + 55) + ' ' + f(poy + 75) + ')"';
    s += rect(pox, poy, 110, 150, '#FF6F91', st + rot) + '<text x="' + f(pox + 55) + '" y="' + f(poy + 88) + '" text-anchor="middle" font-family="Bagel Fat One, sans-serif" font-size="30" fill="#FFFDF5"' + rot + '>LIVE</text>';
    s += rect(0, gy, W, H - gy, '#D9D3C7') + '</g>';

    // 3 장년: 거실 (30~61세)
    s += '<g data-scene="3" opacity="0">' + rect(0, 0, W, gy, '#E4EBF6');
    [[-180, 0.14, 120, 90, '#FFD23F'], [-40, 0.1, 90, 120, '#8EC9F0'], [90, 0.16, 110, 80, '#FF6F91']].forEach(function (p) {
      s += rect(fx + p[0], gy * p[1], p[2], p[3], '#FFFDF5', st + ' rx="4"') + rect(fx + p[0] + 12, gy * p[1] + 12, p[2] - 24, p[3] - 24, p[4], ' opacity="0.8"');
    });
    var sx = fx + 150;
    s += rect(sx, gy - 150, 300, 110, '#7FB7A4', st + ' rx="34"') + rect(sx - 20, gy - 110, 340, 70, '#6AA592', st + ' rx="24"');
    var px = fx - 260;
    s += '<path d="M' + f(px - 34) + ' ' + f(gy) + 'l8-70h52l8 70z" fill="#D9825B"' + st + '/>';
    [[-40, -150, -20], [0, -190, 0], [40, -150, 20], [-20, -120, -30], [24, -125, 30]].forEach(function (l) {
      s += '<ellipse cx="' + f(px + l[0]) + '" cy="' + f(gy + l[1]) + '" rx="22" ry="48" fill="#5DBB63" transform="rotate(' + l[2] + ' ' + f(px + l[0]) + ' ' + f(gy + l[1]) + ')"' + st + '/>';
    });
    s += rect(0, gy, W, H - gy, '#D6B48A') + '<g stroke="#C49D70" stroke-width="3">';
    for (i = 0; i < 12; i++) s += '<line x1="0" y1="' + (gy + 22 + i * 26) + '" x2="' + W + '" y2="' + (gy + 22 + i * 26) + '"/>';
    s += '</g></g>';

    // 4 노년: 노을 공원 (62세~)
    s += '<g data-scene="4" opacity="0"><defs><linearGradient id="bf-sunset" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC9A3"/><stop offset="1" stop-color="#FFE6C2"/></linearGradient></defs>' + rect(0, 0, W, gy, 'url(#bf-sunset)');
    s += '<circle cx="' + f(fx + 120) + '" cy="' + f(gy - 40) + '" r="120" fill="#FF9F68" opacity="0.8"/>';
    [[-280, 1.0], [330, 1.25], [480, 0.9]].forEach(function (t) {
      var tx = fx + t[0], sc = t[1];
      s += '<rect x="' + f(tx - 12 * sc) + '" y="' + f(gy - 170 * sc) + '" width="' + f(24 * sc) + '" height="' + f(170 * sc) + '" fill="#9C6B43"' + st + '/>';
      s += '<circle cx="' + f(tx) + '" cy="' + f(gy - 200 * sc) + '" r="' + f(80 * sc) + '" fill="#7CC47F"' + st + '/>';
    });
    var bnx = fx + 130;
    s += rect(bnx, gy - 90, 240, 20, '#B5835A', st + ' rx="6"') + rect(bnx, gy - 130, 240, 18, '#B5835A', st + ' rx="6"') + rect(bnx + 20, gy - 70, 14, 70, '#59647A', st) + rect(bnx + 206, gy - 70, 14, 70, '#59647A', st);
    s += '<path d="M' + f(fx - 230) + ' 140q14-12 28 0q14-12 28 0" fill="none" stroke="' + INK + '" stroke-width="3"/><path d="M' + f(fx - 160) + ' 100q10-9 20 0q10-9 20 0" fill="none" stroke="' + INK + '" stroke-width="3"/>';
    s += rect(0, gy, W, H - gy, '#A9D49F') + '</g>';

    s += '<line x1="0" y1="' + gy + '" x2="' + W + '" y2="' + gy + '" stroke="' + INK + '" stroke-width="4"/>';
    return s;
  }
  var SCENE_AGES = [[0, 5.5], [5.5, 18.5], [18.5, 29.5], [29.5, 61.5], [61.5, 200]];
  function sceneOpacity(i, age) {
    var r = SCENE_AGES[i], fade = 1.2;
    var inA = i === 0 ? 1 : U.smooth(r[0] - fade, r[0] + fade * 0.2, age);
    var outA = i === SCENE_AGES.length - 1 ? 1 : 1 - U.smooth(r[1] - fade, r[1] + fade * 0.2, age);
    return Math.max(0, Math.min(inA, outA));
  }

  // ---------------- 인생 재생기 ----------------
  // 이야기 데이터/QR은 그대로 두고, 실제 장면의 내용으로 연기를 고릅니다.
  function performanceFor(scene) {
    if (!scene) return { action: 'idle', expression: 'smile', prop: null, mood: 'happy' };
    var text = scene.items.map(function (it) { return it.text; }).join(' ');
    var prop = scene.prop, action = 'idle', expression = 'smile';
    if (scene.final) { action = 'welcome'; expression = 'gentle'; }
    else if (/무사히 치료|완주|금상|1등|수상/.test(text) && scene.mood !== 'soft') { action = prop === 'medal' ? 'run' : 'celebrate'; expression = 'delighted'; }
    else if (scene.mood === 'soft') {
      action = /알게 됐|확신|고민|기억/.test(text) ? 'think' : 'idle';
      expression = /무사히|가족|곁에서/.test(text) ? 'gentle' : action === 'think' ? 'thoughtful' : 'concerned';
      prop = null;
    }
    else if (prop === 'baby') { action = 'cradle'; expression = 'gentle'; }
    else if (prop === 'book' || prop === 'pencil') { action = 'read'; expression = 'focused'; }
    else if (prop === 'mic' || prop === 'note') { action = 'perform'; expression = 'singing'; }
    else if (prop === 'medal') { action = 'run'; expression = 'focused'; }
    else if (prop === 'trophy' || prop === 'gradcap') { action = 'celebrate'; expression = 'delighted'; }
    else if (prop === 'bouquet') { action = 'welcome'; expression = 'shy'; }
    else if (prop === 'backpack' || prop === 'briefcase') { action = 'wave'; expression = 'smile'; }
    else if (prop === 'ball') { action = 'cheer'; expression = 'delighted'; }
    else if (/사랑하는|결혼|함께 살/.test(text)) { action = 'welcome'; expression = 'shy'; }
    else if (/어려|막혔|실패|다쳤|통증|여드름|흐려/.test(text)) { action = 'think'; expression = 'thoughtful'; }
    else if (/친구|수다|선물|생일|입학/.test(text)) { action = 'wave'; expression = 'smile'; }
    else if (/산책|운동|달리기/.test(text)) { action = 'run'; expression = 'smile'; }
    return { action: action, expression: expression, prop: prop, mood: scene.mood };
  }
  function Player(svg, opt) {
    this.svg = svg;
    this.W = opt.W; this.H = opt.H; this.gy = opt.groundY; this.fx = opt.figureX; this.rx = opt.rulerX; this.top = opt.topMargin || 60;
    this.onScene = opt.onScene || function () { }; this.onTick = opt.onTick || function () { }; this.onEnd = opt.onEnd || function () { };
    this.speed = 1; this.paused = false; this.raf = 0;
  }
  Player.prototype.load = function (built, name) {
    this.b = built; this.o = built.o; this.scenes = built.scenes; this.name = name;
    var W = this.W, H = this.H;
    this.svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    this.svg.innerHTML = '<g class="bd">' + backdrops(W, H, this.gy, name, this.fx) + '</g><g class="ruler"></g><g class="fig"></g><g class="fx"></g>';
    this.bdEls = Array.prototype.slice.call(this.svg.querySelectorAll('[data-scene]'));
    this.rulerEl = this.svg.querySelector('.ruler'); this.figEl = this.svg.querySelector('.fig'); this.fxEl = this.svg.querySelector('.fx');
    // 타임라인: 이동 → 머무름
    var segs = [], t = 0, cur = 0;
    var self = this;
    this.scenes.forEach(function (sc, i) {
      var gap = sc.age - cur;
      if (gap > 0) { var d = Math.max(0.35, gap * 0.12); segs.push({ type: 'move', t0: t, t1: t + d, a0: cur, a1: sc.age }); t += d; }
      var chars = sc.items.reduce(function (n, it) { return n + it.text.length; }, 0);
      var hold = sc.final ? 4.8 : 1.6 + (sc.items.length - 1) * 0.5 + Math.min(1.4, chars / 55);
      segs.push({ type: 'hold', t0: t, t1: t + hold, a0: sc.age, a1: sc.age, scene: sc, idx: i });
      t += hold; cur = sc.age;
    });
    this.segs = segs; this.total = t; this.t = 0; this.lastScene = -1; this.cam = null;
    this.age = 0; this.motionTime = 0; this.drawLast = null;
    this.draw(0, 0);
  };
  Player.prototype.ageAt = function (t) {
    for (var i = 0; i < this.segs.length; i++) {
      var s = this.segs[i];
      if (t <= s.t1) {
        if (s.type === 'hold') return { age: s.a0, seg: s };
        var u = U.clamp((t - s.t0) / (s.t1 - s.t0), 0, 1);
        u = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        return { age: U.lerp(s.a0, s.a1, u), seg: s };
      }
    }
    var last = this.segs[this.segs.length - 1];
    return { age: last.a1, seg: last };
  };
  Player.prototype.draw = function (age, now, seg) {
    var o = this.o;
    // 카메라: 작을 때는 가까이, 클수록 멀리
    var topCm = BF.Person.topOf(o, age);
    var visCm = Math.max(96, topCm * 1.32);
    if (this.cam == null || BF.motion.reduced()) this.cam = visCm;
    else this.cam += (visCm - this.cam) * (1 - Math.exp(-Math.min(100, this.frameDt || 33) / 180));
    var s = (this.gy - this.top) / this.cam;
    this.lastTop = topCm; this.lastScale = s;
    var holding = seg && seg.type === 'hold' && seg.scene;
    var acting = performanceFor(holding ? seg.scene : null);
    var still = BF.motion.reduced();
    var tt = still ? 0 : now / 1000;
    var blink = !still && (tt % 4.7) > 4.55;
    var yaw = Math.sin(tt * 0.85) * 0.25;
    var breathe = still ? 0 : Math.sin(tt * 1.8);
    var bounce = !still && holding && seg.scene.mood === 'happy' ? Math.sin(U.clamp((this.t - seg.t0) / 0.8, 0, 1) * Math.PI) * 3 : 0;
    var inner = BF.Person.render(o, age, {
      sw: 3 / s, blink: blink, yaw: yaw, breathe: breathe, phase: still ? undefined : tt,
      mood: acting.mood, expression: acting.expression, action: acting.action, prop: acting.prop,
      poseMix: !holding || still ? 1 : U.smooth(0, 0.5, this.t - seg.t0) * (seg.t1 == null ? 1 : 1 - U.smooth(seg.t1 - 0.35, seg.t1, this.t))
    });
    this.figEl.innerHTML = '<g transform="translate(' + f(this.fx) + ' ' + f(this.gy - bounce) + ') scale(' + f(s) + ')">' + inner + '</g>';
    for (var i = 0; i < this.bdEls.length; i++) this.bdEls[i].setAttribute('opacity', f(sceneOpacity(i, age)));
    // 키재기 자
    var H = BF.sim.heightAt(o, age);
    var r = '', x = this.rx, gy = this.gy;
    var maxCm = this.cam * 1.05;
    r += '<rect x="' + f(x - 34) + '" y="' + f(this.top - 30) + '" width="68" height="' + f(gy - this.top + 30) + '" rx="10" fill="#FFF6DA" stroke="' + INK + '" stroke-width="4"/>';
    var step = maxCm > 150 ? 10 : 5, lab = maxCm > 150 ? 20 : 10;
    for (var cm = 0; cm <= maxCm; cm += step) {
      var y = gy - cm * s;
      if (y < this.top - 20) break;
      var major = cm % lab === 0;
      r += '<line x1="' + f(x - 34) + '" y1="' + f(y) + '" x2="' + f(x - 34 + (major ? 26 : 14)) + '" y2="' + f(y) + '" stroke="' + INK + '" stroke-width="' + (major ? 3 : 2) + '"/>';
      if (major && cm > 0) r += '<text x="' + f(x + 22) + '" y="' + f(y + 7) + '" text-anchor="end" font-family="Nanum Gothic Coding, monospace" font-weight="700" font-size="20" fill="' + INK + '">' + cm + '</text>';
    }
    var hy = gy - H * s;
    var seated = BF.Person.look(o, age, {}).wheelchair;
    r += '<line x1="' + f(x + 34) + '" y1="' + f(hy) + '" x2="' + f(this.fx - 20) + '" y2="' + f(hy) + '" stroke="#EF4B3C" stroke-width="3" stroke-dasharray="10 8"' + (seated ? ' opacity="0.55"' : '') + '/>';
    r += '<g transform="translate(' + f(x + 40) + ' ' + f(hy - 44) + ')"><rect width="150" height="40" rx="10" fill="#EF4B3C" stroke="' + INK + '" stroke-width="3"/><text x="75" y="28" text-anchor="middle" font-family="Nanum Gothic Coding, monospace" font-weight="700" font-size="22" fill="#FFFDF5">' + H.toFixed(1) + 'cm</text></g>';
    this.rulerEl.innerHTML = r;
    this.age = age;
    this.onTick(age, H);
  };
  Player.prototype.burst = function (mood) {
    if (BF.motion.reduced()) { this.fxEl.innerHTML = ''; return; }
    var cols = mood === 'soft' ? ['#B8D8F0', '#E6D6F5', '#FFFFFF'] : ['#FFD23F', '#FF6F91', '#8EC9F0', '#7FDCA6'];
    var headY = this.gy - (this.lastTop || 100) * (this.lastScale || 3);
    var g = '', cx = this.fx, cy = headY + 10, r0 = 70;
    for (var i = 0; i < 10; i++) {
      var ang = Math.PI + (i / 9) * Math.PI, d = 100 + (i % 3) * 24;
      var x0 = cx + Math.cos(ang) * r0, y0 = cy + Math.sin(ang) * r0, x1 = cx + Math.cos(ang) * d, y1 = cy + Math.sin(ang) * d;
      g += '<circle cx="' + f(x0) + '" cy="' + f(y0) + '" r="' + (6 + (i % 4) * 2) + '" fill="' + cols[i % cols.length] + '" stroke="' + INK + '" stroke-width="2"><animate attributeName="cx" from="' + f(x0) + '" to="' + f(x1) + '" dur="1.4s" calcMode="spline" keyTimes="0;1" keySplines="0.2 0.65 0.3 1" fill="freeze"/><animate attributeName="cy" from="' + f(y0) + '" to="' + f(y1) + '" dur="1.4s" calcMode="spline" keyTimes="0;1" keySplines="0.2 0.65 0.3 1" fill="freeze"/><animate attributeName="opacity" from="1" to="0" dur="1.4s" calcMode="spline" keyTimes="0;1" keySplines="0.2 0.65 0.3 1" fill="freeze"/></circle>';
    }
    this.fxEl.innerHTML = g;
  };
  Player.prototype.loop = function (now) {
    var self = this;
    if (this.last == null) this.last = now;
    var dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    // 일시정지하면 눈 깜박임과 호흡도 함께 멈춥니다.
    if (this.paused) {
      this.svg.pauseAnimations && this.svg.pauseAnimations();
      this.raf = requestAnimationFrame(function (n) { self.loop(n); });
      return;
    }
    this.svg.unpauseAnimations && this.svg.unpauseAnimations();
    this.t += dt * this.speed;
    this.motionTime += dt * 1000;
    // SVG 갱신은 최대 30fps. 재생 시간은 실제 경과 시간으로 계산합니다.
    if (this.drawLast != null && now - this.drawLast < 1000 / 30 && this.t < this.total) {
      this.raf = requestAnimationFrame(function (n) { self.loop(n); });
      return;
    }
    this.frameDt = this.drawLast == null ? 33 : now - this.drawLast;
    this.drawLast = now;
    var st = this.ageAt(this.t);
    if (st.seg && st.seg.type === 'hold' && st.seg.idx !== this.lastScene) {
      this.lastScene = st.seg.idx;
      this.onScene(st.seg.scene, st.seg.idx);
      this.burst(st.seg.scene.mood);
    }
    this.draw(st.age, this.motionTime, st.seg);
    if (this.t >= this.total) { this.stop(); this.onEnd(); return; }
    this.raf = requestAnimationFrame(function (n) { self.loop(n); });
  };
  Player.prototype.play = function () {
    var self = this;
    this.stop(); this.last = null; this.drawLast = null; this.paused = false;
    this.raf = requestAnimationFrame(function (n) { self.loop(n); });
  };
  Player.prototype.stop = function () { if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; this.svg.pauseAnimations && this.svg.pauseAnimations(); };
  Player.prototype.skip = function () {
    this.stop();
    this.fxEl.innerHTML = '';
    var last = this.scenes[this.scenes.length - 1];
    for (var i = this.lastScene + 1; i < this.scenes.length; i++) this.onScene(this.scenes[i], i, true);
    this.lastScene = this.scenes.length - 1;
    this.t = this.total;
    this.draw(last.age, performance.now(), this.segs[this.segs.length - 1]);
    this.onEnd();
  };
  // 특정 나이로 이동 (모바일 결과 페이지의 슬라이더용)
  Player.prototype.show = function (age, now) {
    var sc = null;
    this.fxEl.innerHTML = '';
    this.cam = null;
    for (var i = 0; i < this.scenes.length; i++) if (Math.abs(this.scenes[i].age - age) < 0.01) sc = this.scenes[i];
    this.draw(age, now || 0, sc ? { type: 'hold', scene: sc, t0: -10, idx: 1 } : null);
  };

  BF.Stage = { Player: Player, backdrops: backdrops, performanceFor: performanceFor };
})(BF);
