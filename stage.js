/* 베이비 팩토리 — 성장 무대: 시기별 배경, 키재기 자, 카메라, 인생 재생 타이머 */
'use strict';
var BF = window.BF || (window.BF = {});

(function (BF) {
  var U = BF.util, INK = '#1E2A47';
  function f(n) { return Math.round(n * 100) / 100; }

  // 시기별 배경 (화면 좌표). 벽·바닥은 전체 폭(W), 소품은 사람(fx) 기준으로 배치해 겹치지 않게.
  function backdrops(W,H,gy,name,fx) { return BF.World.backdrops(W,H,gy,name,fx); }
  var SCENE_AGES = [[0, 5.5], [5.5, 18.5], [18.5, 29.5], [29.5, 61.5], [61.5, 200]];
  function sceneOpacity(i, age) {
    // 나이가 머무는 동안 반투명 배경 두 장이 고정되는 일이 없도록
    // 경계 전후에도 정확히 한 장만 완전히 표시합니다.
    var r = SCENE_AGES[i];
    return (i === 0 || age >= r[0]) && (i === SCENE_AGES.length - 1 || age < r[1]) ? 1 : 0;
  }

  // ---------------- 인생 재생기 ----------------
  // 이야기 데이터/QR은 그대로 두고, 실제 장면의 내용으로 연기를 고릅니다.
  function performanceFor(scene) {
    if (!scene) return { action: 'idle', expression: 'smile', prop: null, mood: 'happy' };
    var choice = BF.Story && BF.Story.choiceOf(scene);
    if (choice && !choice.selected) return { action:'think',expression:'thoughtful',prop:null,mood:'soft' };
    var text = scene.items.map(function (it) { return it.text; }).join(' ');
    var prop = scene.prop, action = 'idle', expression = 'smile';
    var propItem = scene.items.filter(function (it) { return it.prop === prop; })[0];
    var propText = propItem ? propItem.text : text;
    var wedding = prop === 'mic' && /결혼식.*사회/.test(propText);
    if (scene.final) { action = 'welcome'; expression = 'gentle'; }
    else if (scene.mood === 'soft') {
      action = /알게 됐|확신|고민|기억/.test(text) ? 'think' : 'idle';
      expression = /무사히|가족|곁에서/.test(text) ? 'gentle' : action === 'think' ? 'thoughtful' : 'concerned';
      prop = null;
    }
    else if (/첫돌/.test(propText)) { action = 'idle'; expression = 'delighted'; }
    else if (prop === 'baby') { action = 'cradle'; expression = 'gentle'; }
    else if (prop === 'letter') { action = 'read'; expression = 'gentle'; }
    else if (prop === 'plant') { action = 'idle'; expression = 'gentle'; }
    else if (prop === 'camera') { action = 'welcome'; expression = 'focused'; }
    else if (prop === 'book' || prop === 'pencil') { action = 'read'; expression = 'focused'; }
    else if (wedding) { action = 'speak'; expression = 'smile'; }
    else if (prop === 'mic' || prop === 'note') { action = 'perform'; expression = 'singing'; }
    else if ((!prop || prop === 'medal') && /휠체어.*(공원|코스|경주|릴레이)|무장애 숲길/.test(text)) { action = 'roll'; expression = /경주|릴레이|코스/.test(text) ? 'focused' : 'smile'; }
    else if (prop === 'medal') { action = 'run'; expression = 'focused'; }
    else if (prop === 'trophy' || prop === 'gradcap') { action = 'celebrate'; expression = 'delighted'; }
    else if (prop === 'bouquet') { action = 'welcome'; expression = 'shy'; }
    else if (prop === 'backpack' || prop === 'briefcase') { action = 'wave'; expression = 'smile'; }
    else if (prop === 'ball') { action = 'cheer'; expression = 'delighted'; }
    else if (/무사히 치료|완주|금상|1등|수상/.test(text)) { action = 'celebrate'; expression = 'delighted'; }
    else if (/사랑하는|결혼했|함께 살/.test(text)) { action = 'welcome'; expression = 'shy'; }
    else if (/어려|막혔|실패|다쳤|통증|여드름|흐려/.test(text)) { action = 'think'; expression = 'thoughtful'; }
    else if (/친구|수다|선물|생일|입학/.test(text)) { action = 'wave'; expression = 'smile'; }
    else if (/산책|운동|달리기/.test(text)) { action = 'run'; expression = 'smile'; }
    return { action: action, expression: expression, prop: prop, mood: scene.mood, outfit: wedding && scene.mood !== 'soft' ? 'suit' : undefined };
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
      var hold = sc.final ? 6.2 : Math.max(2.8, Math.min(6.5, 1.4 + chars / 19));
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
    var decision = holding && BF.Story && BF.Story.choiceOf(seg.scene);
    var acting = performanceFor(holding ? seg.scene : null);
    var still = BF.motion.reduced();
    var tt = still ? 0 : now / 1000;
    var blinkClock = (tt + (o.seed % 19) * .17) % 5.3;
    var blink = !still && (blinkClock > 5.14 || blinkClock > 4.82 && blinkClock < 4.89);
    var yaw = Math.sin(tt * 0.65) * 0.22;
    var breathe = still ? 0 : Math.sin(tt * 1.8);
    var support = BF.Person.look(o, age, {});
    var bounce = !still && !support.wheelchair && !support.cane && holding && acting.action === 'celebrate' ? Math.sin(U.clamp((this.t - seg.t0) / 0.8, 0, 1) * Math.PI) * 3 : 0;
    var inner = BF.Person.render(o, age, {
      sw: 3 / s, blink: blink, yaw: yaw, breathe: breathe, phase: still ? undefined : tt,
      mood: acting.mood, expression: acting.expression, action: acting.action, prop: acting.prop, outfit: acting.outfit,
      poseMix: !holding || still || decision && !decision.selected ? 1 : U.smooth(0, 0.5, this.t - seg.t0) * (seg.t1 == null ? 1 : 1 - U.smooth(seg.t1 - 0.35, seg.t1, this.t))
    });
    this.figEl.innerHTML = '<g transform="translate(' + f(this.fx) + ' ' + f(this.gy - bounce) + ') scale(' + f(s) + ')">' + inner + '</g>';
    for (var i = 0; i < this.bdEls.length; i++) {
      var visible = sceneOpacity(i, age);
      this.bdEls[i].setAttribute('opacity', visible);
      this.bdEls[i].setAttribute('display', visible ? 'inline' : 'none');
    }
    // 키재기 자
    var H = BF.sim.heightAt(o, age);
    var r = '', x = this.rx, gy = this.gy;
    var maxCm = this.cam * 1.05;
    r += '<rect x="' + f(x - 34) + '" y="' + f(this.top - 30) + '" width="68" height="' + f(gy - this.top + 30) + '" rx="10" fill="#FFF9EC" stroke="#BBA88D" stroke-width="2"/>';
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
    if (!seated) r += '<line x1="' + f(x + 34) + '" y1="' + f(hy) + '" x2="' + f(this.fx - 20) + '" y2="' + f(hy) + '" stroke="#BA8E74" stroke-width="3" stroke-dasharray="10 8"/>';
    r += '<g transform="translate(' + f(x + 40) + ' ' + f(seated ? this.top + 12 : hy - 44) + ')"><rect width="' + (seated ? 190 : 150) + '" height="40" rx="10" fill="#9B6C5C" stroke="' + INK + '" stroke-width="3"/><text x="' + (seated ? 95 : 75) + '" y="28" text-anchor="middle" font-family="Nanum Gothic Coding, monospace" font-weight="700" font-size="22" fill="#FFFDF5">' + (seated ? '신장 ' : '') + H.toFixed(1) + 'cm</text>' + (seated ? '<text x="95" y="64" text-anchor="middle" font-family="sans-serif" font-size="20" fill="' + INK + '">현재 앉은 모습</text>' : '') + '</g>';
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
    for (var i = 0; i < this.scenes.length; i++) if (this.scenes[i].age <= age) sc = this.scenes[i];
    this.draw(age, now || 0, sc ? { type: 'hold', scene: sc, t0: -10, idx: 1 } : null);
    return sc;
  };

  BF.Stage = { Player: Player, backdrops: backdrops, performanceFor: performanceFor };
})(BF);
