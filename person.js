/* 베이비 팩토리 — 사람 그리기 (SVG)
   render(o, age, opts) → 발끝이 (0,0)이고 1단위 = 1cm 인 <g> 문자열.
   나이에 따라 연속적으로 변하고(머리 비율, 키, 옷, 주름, 흰머리…), 선택한 유전 형질이 모두 반영됩니다. */
'use strict';
var BF = window.BF || (window.BF = {});

(function (BF) {
  var U = BF.util;
  var INK = '#51463F'; // 따뜻한 연필색 윤곽
  var SKIN = ['#F8DDC8', '#F0C9A7', '#E3B38D'];
  var TOPS = ['#F2A6B0', '#89BCD3', '#EAC773', '#9AC8A8', '#B8ACD6', '#EBAA87', '#83BDB2', '#DFA2B6'];
  var BOTTOMS = ['#3D5A80', '#4A4E69', '#5E6472', '#6D597A', '#2E4057', '#55708F'];
  var HAIR_GRAY = '#A3A7AE', HAIR_WHITE = '#ECEDEF';

  function f(n) { return Math.round(n * 100) / 100; }
  function attr(fill, sw, extra) {
    return ' fill="' + fill + '"' + (sw ? ' stroke="' + INK + '" stroke-width="' + f(sw) + '" stroke-linejoin="round" stroke-linecap="round"' : ' stroke="none"') + (extra || '');
  }
  function circle(x, y, r, fill, sw, extra) { return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '"' + attr(fill, sw, extra) + '/>'; }
  function ellipse(x, y, rx, ry, fill, sw, extra) { return '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(rx) + '" ry="' + f(ry) + '"' + attr(fill, sw, extra) + '/>'; }
  function path(d, fill, sw, extra) { return '<path d="' + d + '"' + attr(fill, sw, extra) + '/>'; }
  function line(x1, y1, x2, y2, color, w, extra) {
    return '<line x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2) + '" y2="' + f(y2) + '" stroke="' + color + '" stroke-width="' + f(w) + '" stroke-linecap="round"' + (extra || '') + '/>';
  }
  function stroke(d, color, w, extra) { return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + f(w) + '" stroke-linecap="round" stroke-linejoin="round"' + (extra || '') + '/>'; }
  // 완만하게 휘는 팔다리. 관절마다 딱딱한 원형 마디를 만들지 않습니다.
  function limb(x1, y1, x2, y2, w, color, sw) {
    var d = 'M' + f(x1) + ' ' + f(y1) + 'Q' + f((x1 + x2) / 2 + (x2 - x1) * 0.14) + ' ' + f((y1 + y2) / 2) + ' ' + f(x2) + ' ' + f(y2);
    return stroke(d, U.mix(color, INK, 0.24), w + sw) + stroke(d, color, w);
  }

  function ribbon(p0, p1, p2, w0, w1, w2, color, sw) {
    function normal(a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1; return [-dy / len, dx / len]; }
    var ns = [normal(p0, p1), normal(p0, p2), normal(p1, p2)];
    function point(p, n, w, side) { return f(p[0] + n[0] * w * side / 2) + ' ' + f(p[1] + n[1] * w * side / 2); }
    return path('M' + point(p0, ns[0], w0, 1) + 'Q' + point(p1, ns[1], w1, 1) + ' ' + point(p2, ns[2], w2, 1) + 'L' + point(p2, ns[2], w2, -1) + 'Q' + point(p1, ns[1], w1, -1) + ' ' + point(p0, ns[0], w0, -1) + 'Z', color, sw);
  }
  function hand(x, y, angle, w, skin, sw, open) {
    var d = 'M' + f(-w * .34) + ' 0Q' + f(-w * .46) + ' ' + f(w * .7) + ' ' + f(-w * .22) + ' ' + f(w * 1.02) + 'Q0 ' + f(w * 1.2) + ' ' + f(w * .27) + ' ' + f(w * .93) + 'L' + f(w * .36) + ' ' + f(w * .5) + 'Q' + f(w * .72) + ' ' + f(w * .40) + ' ' + f(w * .55) + ' ' + f(w * .20) + 'L' + f(w * .30) + ' 0Z';
    return '<g transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(angle) + ')">' + path(d, skin, sw * .45) + (open ? stroke('M0 ' + f(w * .75) + 'v' + f(w * .22), U.mix(skin, INK, .25), sw * .4) : '') + '</g>';
  }

  var HH = [[0, 23], [1, 27], [3, 30], [7, 33], [12, 36], [16, 38], [18, 39]];
  var TORSO = [[0, 0.65], [1, 0.85], [3, 1.05], [7, 1.25], [12, 1.40], [18, 1.48]];
  var NECK = [[0, 0.02], [3, 0.055], [10, 0.09], [18, 0.12]];
  var HEADW = [[0, 1.06], [3, 1.00], [7, 0.96], [12, 0.90], [18, 0.86]];
  var SHOULDER = { M: [[0, 0.88], [3, 0.90], [10, 1.02], [18, 1.20]], F: [[0, 0.88], [3, 0.90], [10, 0.96], [18, 1.06]] };
  var HIP = { M: [[0, 0.88], [3, 0.85], [10, 0.86], [18, 0.90]], F: [[0, 0.88], [3, 0.85], [10, 0.86], [18, 0.98]] };
  var ARMW = [[0, 0.24], [3, 0.21], [10, 0.19], [18, 0.19]];
  var LEGW = [[0, 0.30], [3, 0.27], [10, 0.25], [18, 0.25]];

  function byS(tbl, sex, age) {
    if (sex === 'N') return (U.interp(tbl.M, age) + U.interp(tbl.F, age)) / 2;
    return U.interp(tbl[sex], age);
  }

  function palette(o) {
    var r = U.rng(o.seed, 31);
    return { top: U.pick(r, TOPS), top2: U.pick(r, TOPS), bottom: U.pick(r, BOTTOMS), shoe: U.pick(r, ['#F25C54', '#3D5A80', '#FFFFFF', '#2B2D42', '#F7B32B']), blanket: U.pick(r, ['#FFD9E4', '#D7E9FF', '#FFF1C9', '#DDF5E6']) };
  }

  // 나이·형질 → 그릴 모습
  function look(o, age, opts) {
    var sex = o.sex, L = {};
    L.age = age;
    // 인물마다 유지되는 얼굴 개성. 구매 여부나 장애 여부와 독립된 시드입니다.
    var identity = U.rng(o.seed, 43);
    L.faceType = Math.floor(identity() * 4);
    L.hairPart = Math.floor(identity() * 4);
    L.eyeSpace = 0.40 + identity() * 0.045;
    L.eyeLift = (identity() - 0.5) * 0.12;
    L.faceWidth = 0.88 + identity() * 0.16;
    L.eyeWidth = 0.94 + identity() * 0.17;
    L.browArch = identity() * 0.06;
    L.sexF = sex === 'F';
    L.H = BF.sim.heightAt(o, age);
    var avgH = BF.sim.stdHeight(sex, age);
    L.hh = U.interp(HH, age) * Math.pow(L.H / avgH, 0.25);
    L.hw = L.hh * U.interp(HEADW, age) * L.faceWidth;
    L.neck = L.hh * U.interp(NECK, age);
    L.torso = L.hh * U.interp(TORSO, age);
    L.shoulderW = L.hh * byS(SHOULDER, sex, age) * (o.sport === 'sprint' && age > 15 ? 1.06 : 1);
    L.hipW = L.hh * byS(HIP, sex, age);
    L.armW = L.hh * U.interp(ARMW, age);
    L.legW = L.hh * U.interp(LEGW, age);
    L.skin = SKIN[o.skin || 0];

    var agingStart = o.slowAging ? 46 : 36, agingEnd = o.slowAging ? 100 : 86;
    L.wrinkle = U.smooth(agingStart, agingEnd, age);
    var g0 = (o.slowAging ? 56 : 44) + (o.grayShift || 0), g1 = (o.slowAging ? 94 : 80) + (o.grayShift || 0);
    var gray = U.smooth(g0, g1, age);
    L.gray = gray;
    L.hairColor = gray < 0.55 ? U.mix(o.hairColor, HAIR_GRAY, gray / 0.55) : U.mix(HAIR_GRAY, HAIR_WHITE, (gray - 0.55) / 0.45);
    L.recede = o.hairloss ? (sex !== 'F' ? U.smooth(33, 62, age) : U.smooth(46, 80, age) * 0.45) : 0;
    L.hunch = U.smooth(70, 92, age) * (o.slowAging || o.longevity ? 0.45 : 1);
    L.belly = o.belly ? U.smooth(36, 54, age) * 0.85 + U.smooth(60, 80, age) * 0.1 : U.smooth(60, 85, age) * 0.15;

    L.glasses = 'none';
    if (o.myopia && age >= 9.8) L.glasses = 'round';
    else if (!o.myopia && age >= 49) L.glasses = 'reading';
    L.acne = o.acne && age >= 13 && age < 19.5;
    L.braces = o.braces && age >= 12 && age < 14.2;
    L.freckle = o.freckle && age >= 4;
    L.dimple = o.dimple && age >= 1;
    L.hearing = !!(o.has && o.has.gjb2) && age >= 1.4;
    L.wheelchair = !!(o.has && o.has.smn1) && age >= 4;
    L.cane = (o.has && o.has.rpe65 && age >= 7) ? 'white' : (age >= 80 && !o.longevity && !o.slowAging && !L.wheelchair ? 'walk' : null);

    // 옷
    var career = BF.CAREERS[o.career];
    if (age < 0.75) L.outfit = 'swaddle';
    else if (age < 3) L.outfit = 'onesie';
    else if (age < 13) L.outfit = 'kid';
    else if (age < 19) L.outfit = 'school';
    else if (age < 25.5) L.outfit = 'hoodie';
    else if (age < 64) L.outfit = career ? career.outfit : 'smart';
    else L.outfit = 'cardigan';
    if (opts && opts.outfit) L.outfit = opts.outfit;

    // 머리 모양
    if (age < 1) L.style = 'wisp';
    else if (age < 3) L.style = 'tuft';
    else if (sex === 'F') L.style = age < 13 ? 'bob' : age < 66 ? (L.hairPart === 1 ? 'bob' : 'long') : 'perm';
    else if (sex === 'N') L.style = 'mid';
    else L.style = L.hairPart === 2 ? 'mid' : 'short';
    L.tex = o.hair;
    if (age < 1.5 && L.tex === 'curly') L.tex = 'wavy';
    L.eyelid = age < 0.6 && o.eyelid === 'double' ? 'inner' : o.eyelid;
    return L;
  }

  // ---------------- 머리카락 ----------------
  function hairShapes(L, hx, cy, a, b, hc, sw) {
    var back = [], front = [];
    var tex = L.tex, vol = b * (tex === 'curly' ? 0.2 : tex === 'wavy' ? 0.12 : 0.08);
    var style = L.style;
    if (style === 'perm') { tex = 'curly'; vol = b * 0.22; }
    if (style === 'tuft') vol *= 0.6;

    function outerArc(sideDrop) {
      var R = a + vol, Rb = b + vol;
      var delta = Math.asin(U.clamp(sideDrop / Rb, -0.95, 0.95));
      var d = '', n = 30;
      for (var i = 0; i <= n; i++) {
        var t = (Math.PI + delta) - (Math.PI + 2 * delta) * i / n;
        var rr = tex === 'wavy' ? 1 + 0.035 * Math.sin(t * 11) : 1;
        d += (i ? 'L' : 'M') + f(hx + R * rr * Math.cos(t)) + ' ' + f(cy - Rb * rr * Math.sin(t));
      }
      return d;
    }
    function capPath(sideDrop, hairline, kind) {
      var d = outerArc(sideDrop);
      var xr = hx + a * 0.98, xl = hx - a * 0.98, yS = cy + sideDrop * 0.55;
      d += 'L' + f(xr) + ' ' + f(yS);
      if (kind === 'side') {
        // 옆가르마 + 한쪽으로 쓸어내린 앞머리
        var px = hx + a * 0.42;
        d += 'Q' + f(hx + a * 0.9) + ' ' + f(hairline + b * 0.05) + ' ' + f(px) + ' ' + f(hairline - b * 0.06);
        d += 'Q' + f(hx - a * 0.05) + ' ' + f(hairline - b * 0.02) + ' ' + f(hx - a * 0.55) + ' ' + f(hairline + b * 0.26);
        d += 'L' + f(hx - a * 0.5) + ' ' + f(hairline + b * 0.12);
        d += 'Q' + f(hx - a * 0.72) + ' ' + f(hairline + b * 0.22) + ' ' + f(hx - a * 0.86) + ' ' + f(hairline + b * 0.32);
      } else if (kind === 'curtain') {
        // 가운데 가르마 커튼 앞머리
        d += 'Q' + f(hx + a * 0.62) + ' ' + f(hairline + b * 0.32) + ' ' + f(hx + a * 0.08) + ' ' + f(hairline - b * 0.1);
        d += 'L' + f(hx - a * 0.08) + ' ' + f(hairline - b * 0.1);
        d += 'Q' + f(hx - a * 0.62) + ' ' + f(hairline + b * 0.32) + ' ' + f(xl) + ' ' + f(yS);
      } else {
        // 일자 앞머리 / 아기 머리: 작은 물결
        var n = kind === 'tuft' ? 3 : 5, span = xr - xl;
        var lowY = kind === 'blunt' ? hairline + b * 0.24 : hairline;
        for (var k = 0; k < n; k++) {
          var x1 = xr - span * (k + 1) / n, xm = xr - span * (k + 0.5) / n;
          var u1 = (x1 - hx) / a, um = (xm - hx) / a;
          var y1 = lowY + b * 0.22 * u1 * u1, ym = lowY + b * 0.22 * um * um + b * (kind === 'blunt' ? 0.1 : 0.14);
          d += 'Q' + f(xm) + ' ' + f(ym) + ' ' + f(x1) + ' ' + f(y1);
        }
      }
      d += 'L' + f(xl) + ' ' + f(yS) + 'Z';
      return d;
    }
    function curls(sideDrop, count) {
      // 곱슬: 테두리를 따라 동그란 컬
      var R = a + vol * 0.6, Rb = b + vol * 0.6, out = [];
      var delta = Math.asin(U.clamp(sideDrop / Rb, -0.95, 0.95));
      for (var i = 0; i <= count; i++) {
        var t = (Math.PI + delta) - (Math.PI + 2 * delta) * i / count;
        out.push({ c: [hx + R * Math.cos(t), cy - Rb * Math.sin(t)], r: vol * 1.25 });
      }
      return out;
    }

    var capOpacity = 1 - U.smooth(0.5, 0.7, L.recede);
    var hairline = cy - b * (0.40 + L.hairPart * 0.055 + L.recede * 0.5);
    if (style === 'wisp') {
      front.push({ raw: stroke('M' + f(hx - a * 0.08) + ' ' + f(cy - b * 0.98) + 'q' + f(a * 0.12) + ' ' + f(-b * 0.28) + ' ' + f(a * 0.26) + ' ' + f(-b * 0.08) + 'q' + f(a * 0.08) + ' ' + f(b * 0.12) + ' ' + f(-a * 0.06) + ' ' + f(b * 0.12), hc, sw * 1.6) });
      front.push({ raw: stroke('M' + f(hx - a * 0.3) + ' ' + f(cy - b * 0.9) + 'q' + f(a * 0.05) + ' ' + f(-b * 0.12) + ' ' + f(a * 0.14) + ' ' + f(-b * 0.1), hc, sw * 1.2) });
      return { back: back, front: front };
    }
    var sideDrop = { tuft: b * 0.05, short: b * 0.22, mid: b * 0.4, bob: b * 0.55, long: b * 0.55, perm: b * 0.3 }[style];
    var kind = style === 'tuft' ? 'tuft' : (style === 'short' || style === 'mid') ? (L.hairPart % 2 ? 'curtain' : 'side') : style === 'bob' ? (L.hairPart % 2 ? 'side' : 'blunt') : style === 'long' ? (L.hairPart === 3 ? 'side' : 'curtain') : 'tuft';
    if (style === 'perm') kind = 'tuft';

    if (style === 'bob' || style === 'long') {
      var len = style === 'bob' ? b * 1.15 : b * 1.0 + L.torso * 0.55;
      var bw = (a + vol) * (tex === 'curly' ? 1.16 : 1.02);
      var top = cy - b * 0.3, bot = cy + len, flare = style === 'long' ? 1.12 : 1.04;
      var ends;
      if (tex === 'straight') ends = 'Q' + f(hx - bw * 0.35) + ' ' + f(bot + b * 0.06) + ' ' + f(hx) + ' ' + f(bot - b * 0.02) + 'Q' + f(hx + bw * 0.35) + ' ' + f(bot + b * 0.06) + ' ' + f(hx + bw * 0.78) + ' ' + f(bot - b * 0.04);
      else ends = 'Q' + f(hx - bw * 0.55) + ' ' + f(bot + b * 0.2) + ' ' + f(hx - bw * 0.25) + ' ' + f(bot) + 'Q' + f(hx) + ' ' + f(bot + b * 0.18) + ' ' + f(hx + bw * 0.25) + ' ' + f(bot) + 'Q' + f(hx + bw * 0.55) + ' ' + f(bot + b * 0.2) + ' ' + f(hx + bw * 0.78) + ' ' + f(bot - b * 0.04);
      var dB = 'M' + f(hx - bw * 0.96) + ' ' + f(top) +
        'C' + f(hx - bw * 1.08) + ' ' + f(cy + b * 0.7) + ' ' + f(hx - bw * flare) + ' ' + f(bot - b * 0.8) + ' ' + f(hx - bw * (flare - 0.02)) + ' ' + f(bot - b * 0.25) +
        'Q' + f(hx - bw * flare) + ' ' + f(bot) + ' ' + f(hx - bw * 0.78) + ' ' + f(bot - b * 0.04) + ends +
        'Q' + f(hx + bw * flare) + ' ' + f(bot) + ' ' + f(hx + bw * (flare - 0.02)) + ' ' + f(bot - b * 0.25) +
        'C' + f(hx + bw * flare) + ' ' + f(bot - b * 0.8) + ' ' + f(hx + bw * 1.08) + ' ' + f(cy + b * 0.7) + ' ' + f(hx + bw * 0.96) + ' ' + f(top) + 'Z';
      back.push({ d: dB });
      if (tex === 'curly') {
        for (var sd0 = -1; sd0 <= 1; sd0 += 2) for (var q = 0; q < 5; q++) back.push({ c: [hx + sd0 * bw * (1.0 + q * 0.025), top + (bot - top) * (q + 0.5) / 5], r: vol * 1.15 });
        for (q = 0; q < 4; q++) back.push({ c: [hx - bw * 0.62 + bw * 1.24 * q / 3, bot - b * 0.05], r: vol * 1.05 });
      }
    }
    if (capOpacity > 0) {
      var capD = capPath(sideDrop, hairline, kind);
      front.push({ d: capD, op: capOpacity });
      if (tex === 'curly') curls(sideDrop * 0.8, style === 'tuft' ? 7 : 11).forEach(function (c) { c.op = capOpacity; front.push(c); });
    }
    if (L.recede > 0.35) {
      // 옆머리만 남음
      var so = U.smooth(0.35, 0.6, L.recede);
      for (var sd = -1; sd <= 1; sd += 2) {
        var ex = hx + sd * a;
        front.push({ d: 'M' + f(ex - sd * a * 0.05) + ' ' + f(cy - b * 0.35) + 'Q' + f(ex + sd * vol * 1.6) + ' ' + f(cy - b * 0.2) + ' ' + f(ex + sd * vol * 0.8) + ' ' + f(cy + b * 0.25) + 'L' + f(ex - sd * a * 0.12) + ' ' + f(cy + b * 0.1) + 'Z', op: so });
      }
    }
    // 가르마와 결을 살린 얇은 하이라이트. 머리를 한 덩어리로 보이지 않게 합니다.
    if (L.recede < 0.65) {
      for (var strand = 0; strand < 3; strand++) {
        var startX = hx + a * (0.18 + strand * 0.18);
        front.push({ raw: stroke('M' + f(startX) + ' ' + f(cy - b * (0.88 - strand * 0.05)) + 'Q' + f(hx - a * 0.15) + ' ' + f(cy - b * 1.04) + ' ' + f(hx - a * (0.66 - strand * 0.12)) + ' ' + f(cy - b * (0.50 - strand * 0.08)), U.mix(hc, '#E9C9AA', 0.22), sw * 0.65, ' opacity="0.7"') });
      }
    }
    return { back: back, front: front };
  }
  function drawShapes(list, hc, sw) {
    // 테두리를 먼저 모두 그리고 색을 덮어서, 합쳐진 바깥 윤곽만 남게 함
    var outl = '', fill = '';
    list.forEach(function (s) {
      if (s.raw) { fill += s.raw; return; }
      var op = s.op == null ? 1 : s.op;
      var o = op < 1 ? ' opacity="' + f(op) + '"' : '';
      if (s.d) { outl += path(s.d, INK, sw * 2, o); fill += path(s.d, hc, 0, o); }
      else { outl += circle(s.c[0], s.c[1], s.r, INK, sw * 2, o); fill += circle(s.c[0], s.c[1], s.r, hc, 0, o); }
    });
    return outl + fill;
  }

  // ---------------- 얼굴 ----------------
  function face(L, hx, cy, a, b, sw, o, opts) {
    var s = '';
    var yaw = opts.yaw || 0, fx = hx + yaw * a * 0.12;
    var eyeY = cy + b * 2 * U.interp([[0, 0.12], [3, 0.11], [10, 0.10], [18, 0.09]], L.age);
    var ex = a * L.eyeSpace;
    var erx = L.hh * U.interp([[0, 0.061], [6, 0.063], [18, 0.077]], L.age) * L.eyeWidth, ery = erx * (L.age < 10 ? 1.06 : L.sexF ? 0.85 : 0.63);
    var lid = L.eyelid;
    if (lid === 'mono') ery *= 0.82;
    if (lid === 'double') { ery *= 1.06; erx *= 1.04; }
    var mouthY = eyeY + b * 0.48, noseY = eyeY + b * 0.28;
    var fsw = sw * 0.85;
    var expression = opts.expression || (opts.mood === 'soft' ? 'gentle' : 'smile');
    var happy = opts.mood === 'happy' && expression !== 'concerned' && expression !== 'thoughtful' && expression !== 'focused';
    var concerned = expression === 'concerned', thoughtful = expression === 'thoughtful';
    var delighted = expression === 'delighted', focused = expression === 'focused';

    // 볼터치
    var blushOp = (expression === 'shy' ? 1.8 : 1) * U.interp([[0, 0.48], [8, 0.32], [20, L.sexF ? 0.20 : 0.11], [70, 0.16]], L.age);
    s += ellipse(fx - a * 0.6, eyeY + b * 0.3, a * 0.21, b * 0.12, '#FF8E9E', 0, ' opacity="' + f(blushOp) + '"');
    s += ellipse(fx + a * 0.6, eyeY + b * 0.3, a * 0.21, b * 0.12, '#FF8E9E', 0, ' opacity="' + f(blushOp) + '"');

    // 주근깨
    if (L.freckle) {
      [[-0.32, 0.14], [-0.22, 0.2], [-0.4, 0.22], [-0.27, 0.27], [0.32, 0.14], [0.22, 0.2], [0.4, 0.22], [0.27, 0.27]].forEach(function (p) {
        s += circle(fx + a * p[0], eyeY + b * p[1], sw * 0.38, '#B9774F', 0, ' opacity="0.85"');
      });
    }
    // 여드름
    if (L.acne) {
      [[-0.25, 'f', -0.62], [0.18, 'f', -0.7], [0.05, 'f', -0.52], [0.5, 'c', 0.28], [-0.52, 'c', 0.34]].forEach(function (p) {
        s += circle(fx + a * p[0], (p[1] === 'f' ? cy : eyeY) + b * p[2], sw * 0.55, '#E86A6A', 0, ' opacity="0.9"');
      });
    }
    // 주름
    if (L.wrinkle > 0.02) {
      var wo = ' opacity="' + f(Math.min(0.42, L.wrinkle * 0.48)) + '"', ws = fsw * 0.8;
      s += stroke('M' + f(fx - a * 0.32) + ' ' + f(cy - b * 0.5) + 'q' + f(a * 0.32) + ' ' + f(-b * 0.06) + ' ' + f(a * 0.64) + ' 0', INK, ws, wo);
      if (L.wrinkle > 0.35) s += stroke('M' + f(fx - a * 0.24) + ' ' + f(cy - b * 0.4) + 'q' + f(a * 0.24) + ' ' + f(-b * 0.05) + ' ' + f(a * 0.48) + ' 0', INK, ws, wo);
      for (var sd = -1; sd <= 1; sd += 2) {
        var ox = fx + sd * (ex + erx * 1.25);
        s += stroke('M' + f(ox) + ' ' + f(eyeY - ery * 0.3) + 'l' + f(sd * erx * 0.5) + ' ' + f(-ery * 0.25) + 'M' + f(ox) + ' ' + f(eyeY + ery * 0.15) + 'l' + f(sd * erx * 0.55) + ' ' + f(ery * 0.1), INK, ws, wo);
        s += stroke('M' + f(fx + sd * a * 0.2) + ' ' + f(noseY + b * 0.02) + 'q' + f(sd * a * 0.12) + ' ' + f(b * 0.12) + ' ' + f(sd * a * 0.06) + ' ' + f(b * 0.24), INK, ws, wo);
        if (L.wrinkle > 0.5) s += stroke('M' + f(fx + sd * ex - erx * 0.7) + ' ' + f(eyeY + ery * 1.35) + 'q' + f(erx * 0.7) + ' ' + f(ery * 0.4) + ' ' + f(erx * 1.4) + ' 0', INK, ws, wo);
      }
    }
    // 눈썹
    var browC = U.mix(L.hairColor, INK, 0.25);
    var browY = eyeY - ery * 2.3 - (lid === 'double' ? ery * 0.12 : 0);
    var soft = concerned ? -b * 0.11 : thoughtful ? -b * 0.075 : focused ? -b * 0.05 : 0;
    s += stroke('M' + f(fx - ex - erx * 1.1) + ' ' + f(browY + b * 0.02 - soft) + 'q' + f(erx * 1.1) + ' ' + f(-b * (0.04 + L.browArch)) + ' ' + f(erx * 2.2) + ' ' + f(soft * 1.5), browC, fsw * (L.sexF ? 1.0 : 1.6));
    s += stroke('M' + f(fx + ex + erx * 1.1) + ' ' + f(browY + b * 0.02 - soft) + 'q' + f(-erx * 1.1) + ' ' + f(-b * (0.04 + L.browArch)) + ' ' + f(-erx * 2.2) + ' ' + f(soft * 1.5), browC, fsw * (L.sexF ? 1.0 : 1.6));

    // 눈
    [-1, 1].forEach(function (sd) {
      var x = fx + sd * ex, y = eyeY;
      if (opts.blink) {
        s += stroke('M' + f(x - erx) + ' ' + f(y) + 'q' + f(erx) + ' ' + f(ery * 0.7) + ' ' + f(erx * 2) + ' 0', INK, fsw * 1.2);
        return;
      }
      if (happy && (opts.squint || delighted)) {
        s += stroke('M' + f(x - erx) + ' ' + f(y + ery * 0.2) + 'q' + f(erx) + ' ' + f(-ery * 1.2) + ' ' + f(erx * 2) + ' 0', INK, fsw * 1.4);
        return;
      }
      var lift = (L.eyeLift + (L.faceType === 2 ? 0.07 : 0)) * b;
      var outerY = y - lift, innerX = x - sd * erx * 1.22, outerX = x + sd * erx * 1.22;
      var almond = 'M' + f(innerX) + ' ' + f(y) + 'Q' + f(x) + ' ' + f(y - ery * 1.30) + ' ' + f(outerX) + ' ' + f(outerY) + 'Q' + f(x) + ' ' + f(y + ery * 1.08) + ' ' + f(innerX) + ' ' + f(y) + 'Z';
      s += path(almond, '#FFFCF6', 0);
      var gaze = thoughtful ? erx * 0.18 : focused ? -erx * 0.12 : 0;
      s += ellipse(x + gaze, y - ery * 0.03, erx * 0.60, ery * 0.78, U.mix(L.hairColor, '#9E7157', 0.5), 0);
      s += ellipse(x + gaze, y - ery * 0.08, erx * 0.31, ery * 0.53, '#302A30', 0);
      s += circle(x + gaze - erx * 0.20, y - ery * 0.36, erx * 0.21, '#FFFFFF', 0);
      var lidW = fsw * (L.sexF && L.age >= 13 ? 1.45 : 1.05);
      s += stroke('M' + f(innerX) + ' ' + f(y) + 'Q' + f(x) + ' ' + f(y - ery * 1.30) + ' ' + f(outerX) + ' ' + f(outerY), INK, lidW);
      if (L.sexF && L.age >= 13) s += stroke('M' + f(outerX) + ' ' + f(outerY) + 'l' + f(sd * erx * 0.30) + ' ' + f(-ery * 0.38), INK, fsw);
      if (lid === 'double') {
        s += stroke('M' + f(x - sd * erx * 0.85) + ' ' + f(y - ery * 1.05) + 'Q' + f(x + sd * erx * 0.1) + ' ' + f(y - ery * 1.95) + ' ' + f(x + sd * erx * 1.25) + ' ' + f(y - ery * 0.75), INK, fsw * 0.95);
      } else if (lid === 'inner') {
        s += stroke('M' + f(x + sd * erx * 0.05) + ' ' + f(y - ery * 1.28) + 'Q' + f(x + sd * erx * 0.7) + ' ' + f(y - ery * 1.42) + ' ' + f(x + sd * erx * 1.2) + ' ' + f(y - ery * 0.6), INK, fsw * 0.85);
      }
    });

    // 코
    s += stroke('M' + f(fx - a * 0.05) + ' ' + f(noseY) + 'q' + f(a * 0.07) + ' ' + f(b * 0.04) + ' ' + f(a * 0.12) + ' ' + f(-b * 0.01), INK, fsw);

    // 입
    var mw = a * (L.age < 2 ? 0.13 : L.age < 13 ? 0.17 : 0.21);
    var open = happy && !opts.closedMouth && (L.age < 13 || delighted || expression === 'singing');
    if (open) {
      var mh = b * (L.age < 2 ? 0.13 : 0.16);
      var md = 'M' + f(fx - mw) + ' ' + f(mouthY - b * 0.02) + 'Q' + f(fx) + ' ' + f(mouthY + mh * 1.25) + ' ' + f(fx + mw) + ' ' + f(mouthY - b * 0.02) + 'Z';
      s += path(md, '#9E3B4B', fsw);
      if (L.age >= 1) {
        s += path('M' + f(fx - mw * 0.82) + ' ' + f(mouthY) + 'Q' + f(fx) + ' ' + f(mouthY + mh * 0.3) + ' ' + f(fx + mw * 0.82) + ' ' + f(mouthY) + 'Z', '#FFFFFF', 0);
        if (L.braces) {
          s += line(fx - mw * 0.75, mouthY + mh * 0.08, fx + mw * 0.75, mouthY + mh * 0.08, '#8C96A8', fsw * 0.8);
          for (var bi = -2; bi <= 2; bi++) s += circle(fx + bi * mw * 0.3, mouthY + mh * 0.08, fsw * 0.55, '#C6CDD8', 0);
        }
      }
      s += ellipse(fx, mouthY + mh * 0.62, mw * 0.42, mh * 0.2, '#FF7F8F', 0);
    } else if (concerned || thoughtful || focused) {
      s += stroke('M' + f(fx - mw * 0.7) + ' ' + f(mouthY) + 'q' + f(mw * 0.7) + ' ' + f(concerned ? -b * 0.055 : b * 0.012) + ' ' + f(mw * 1.4) + ' 0', '#9D635C', fsw * 1.1);
    } else {
      if (L.sexF && L.age >= 13) s += ellipse(fx, mouthY + b * 0.035, mw * 0.85, b * 0.045, '#C77F7D', 0, ' opacity="0.45"');
      s += stroke('M' + f(fx - mw) + ' ' + f(mouthY) + 'Q' + f(fx) + ' ' + f(mouthY + b * (opts.mood === 'soft' ? 0.06 : 0.11)) + ' ' + f(fx + mw) + ' ' + f(mouthY), INK, fsw * 1.1);
    }
    if (L.dimple && !concerned && !thoughtful && !focused) {
      [-1, 1].forEach(function (sd) {
        s += stroke('M' + f(fx + sd * mw * 1.35) + ' ' + f(mouthY - b * 0.018) + 'q' + f(sd * mw * 0.08) + ' ' + f(b * 0.022) + ' 0 ' + f(b * 0.04), '#BB8872', fsw * 0.7, ' opacity="0.65"');
      });
    }
    // 안경
    if (L.glasses !== 'none') {
      var gr = erx * 1.75, gy = eyeY;
      if (L.glasses === 'reading') {
        gy = eyeY + ery * 0.7;
        s += path('M' + f(fx - ex - gr) + ' ' + f(gy) + 'h' + f(gr * 2) + 'a' + f(gr) + ' ' + f(gr * 0.8) + ' 0 0 1 ' + f(-gr * 2) + ' 0Z', 'rgba(255,255,255,0.25)', fsw);
        s += path('M' + f(fx + ex - gr) + ' ' + f(gy) + 'h' + f(gr * 2) + 'a' + f(gr) + ' ' + f(gr * 0.8) + ' 0 0 1 ' + f(-gr * 2) + ' 0Z', 'rgba(255,255,255,0.25)', fsw);
        s += stroke('M' + f(fx - ex + gr) + ' ' + f(gy) + 'q' + f(ex - gr) + ' ' + f(-gr * 0.4) + ' ' + f((ex - gr) * 2) + ' 0', INK, fsw);
      } else {
        s += circle(fx - ex, gy, gr, 'rgba(255,255,255,0.18)', fsw * 1.1);
        s += circle(fx + ex, gy, gr, 'rgba(255,255,255,0.18)', fsw * 1.1);
        s += stroke('M' + f(fx - ex + gr) + ' ' + f(gy - gr * 0.2) + 'q' + f(ex - gr) + ' ' + f(-gr * 0.35) + ' ' + f((ex - gr) * 2) + ' 0', INK, fsw * 1.1);
        s += line(fx - ex - gr, gy - gr * 0.2, hx - a * 0.98, gy - gr * 0.35, INK, fsw);
        s += line(fx + ex + gr, gy - gr * 0.2, hx + a * 0.98, gy - gr * 0.35, INK, fsw);
      }
    }
    return { svg: s, eyeY: eyeY };
  }

  // ---------------- 옷 색 ----------------
  function outfitColors(L, pal) {
    var adult = L.age >= 19;
    var top = adult ? U.mix(pal.top, '#7D8597', 0.3) : pal.top;
    var c = { top: top, sleeve: top, bottom: pal.bottom, shoe: pal.shoe, skirt: false, shorts: false, coat: null };
    switch (L.outfit) {
      case 'onesie': c.top = pal.blanket; c.sleeve = pal.blanket; c.bottom = pal.blanket; c.shoe = '#FFFFFF'; break;
      case 'kid': c.shorts = L.age < 10; break;
      case 'school': c.top = '#2F3E6B'; c.sleeve = '#2F3E6B'; c.bottom = '#3A4566'; c.shoe = '#2B2D42'; c.skirt = L.sexF; break;
      case 'hoodie': c.top = U.mix(pal.top2, '#6B7280', 0.2); c.sleeve = c.top; c.bottom = '#41618A'; break;
      case 'suit': c.top = '#39435A'; c.sleeve = '#39435A'; c.bottom = '#39435A'; c.shoe = '#2B2D42'; break;
      case 'smart': c.top = U.mix(pal.top, '#A0826D', 0.45); c.sleeve = c.top; c.bottom = '#4A4E69'; break;
      case 'labcoat': c.top = '#F5F7FA'; c.sleeve = '#F5F7FA'; c.bottom = '#4A4E69'; c.coat = true; break;
      case 'track': c.top = pal.top === '#FFCF5C' ? '#E84855' : U.mix(pal.top, '#1E2A47', 0.25); c.sleeve = c.top; c.bottom = c.top; c.shoe = '#FFFFFF'; break;
      case 'turtleneck': c.top = '#2B2D42'; c.sleeve = '#2B2D42'; c.bottom = '#3D3F55'; break;
      case 'apron': c.top = U.mix(pal.top, '#FFFFFF', 0.35); c.sleeve = c.top; c.bottom = '#4A4E69'; break;
      case 'scrubs': c.top = '#5BC0BE'; c.sleeve = '#5BC0BE'; c.bottom = '#5BC0BE'; c.shoe = '#FFFFFF'; break;
      case 'fire': c.top = '#3B3F4A'; c.sleeve = '#3B3F4A'; c.bottom = '#3B3F4A'; c.shoe = '#2B2D42'; break;
      case 'cardigan': c.top = U.mix(pal.top, '#B5A48B', 0.55); c.sleeve = c.top; c.bottom = '#6B6F80'; c.shoe = '#5A4636'; break;
    }
    return c;
  }

  // ---------------- 손에 든 물건 ----------------
  function propSVG(kind, x, y, sc, sw) {
    var s = '';
    switch (kind) {
      case 'backpack': break;
      case 'ball': s += circle(x, y + sc * 0.55, sc * 0.75, '#F25C54', sw) + stroke('M' + f(x - sc * 0.75) + ' ' + f(y + sc * 0.55) + 'q' + f(sc * 0.75) + ' ' + f(sc * 0.5) + ' ' + f(sc * 1.5) + ' 0', '#FFFFFF', sw * 1.2); break;
      case 'book':
        s += path('M' + f(x) + ' ' + f(y) + 'q' + f(-sc * .6) + ' ' + f(-sc * .35) + ' ' + f(-sc * 1.1) + ' ' + f(-sc * .15) + 'v' + f(sc * 1.25) + 'q' + f(sc * .65) + ' ' + f(-sc * .12) + ' ' + f(sc * 1.1) + ' ' + f(sc * .18) + 'q' + f(sc * .45) + ' ' + f(-sc * .30) + ' ' + f(sc * 1.1) + ' ' + f(-sc * .18) + 'v' + f(-sc * 1.25) + 'q' + f(-sc * .5) + ' ' + f(-sc * .2) + ' ' + f(-sc * 1.1) + ' ' + f(sc * .15) + 'Z', '#FAF5E5', sw);
        s += line(x, y, x, y + sc * 1.28, '#4F7CAC', sw);
        for (var page = -1; page <= 1; page += 2) for (var row = 0; row < 3; row++) s += line(x + page * sc * .22, y + sc * (.22 + row * .23), x + page * sc * .88, y + sc * (.12 + row * .23), '#B3BAC0', sw * .55);
        break;
      case 'pencil': s += path('M' + f(x - sc * 0.25) + ' ' + f(y - sc * 1.6) + 'h' + f(sc * 0.5) + 'v' + f(sc * 2.2) + 'l' + f(-sc * 0.25) + ' ' + f(sc * 0.6) + 'l' + f(-sc * 0.25) + ' ' + f(-sc * 0.6) + 'Z', '#FFCF5C', sw); break;
      case 'mic': s += line(x, y + sc * 0.1, x, y - sc * 1.0, INK, sc * 0.4) + circle(x, y - sc * 1.25, sc * 0.45, '#9AA5B8', sw); break;
      case 'stetho': s += stroke('M' + f(x - sc * 0.4) + ' ' + f(y - sc * 0.8) + 'q' + f(-sc * 0.2) + ' ' + f(sc * 1.4) + ' ' + f(sc * 0.4) + ' ' + f(sc * 1.4) + 'q' + f(sc * 0.6) + ' 0 ' + f(sc * 0.4) + ' ' + f(-sc * 1.4), '#5C677D', sw * 1.4) + circle(x, y + sc * 0.9, sc * 0.3, '#C6CDD8', sw); break;
      case 'mouse': s += ellipse(x, y + sc * 0.4, sc * 0.5, sc * 0.7, '#E5E8EE', sw) + line(x, y - sc * 0.25, x, y + sc * 0.1, INK, sw); break;
      case 'gavel': s += line(x, y + sc * 0.6, x + sc * 0.3, y - sc * 0.8, '#8B5E3C', sc * 0.25) + path('M' + f(x - sc * 0.4) + ' ' + f(y - sc * 1.3) + 'h' + f(sc * 1.3) + 'v' + f(sc * 0.6) + 'h' + f(-sc * 1.3) + 'Z', '#A47148', sw); break;
      case 'thread': s += path('M' + f(x - sc * 0.5) + ' ' + f(y - sc * 0.5) + 'h' + f(sc) + 'v' + f(sc * 1.1) + 'h' + f(-sc) + 'Z', '#F2E9E4', sw) + line(x - sc * 0.5, y - sc * 0.1, x + sc * 0.5, y - sc * 0.1, '#E84855', sw * 1.3) + line(x - sc * 0.5, y + sc * 0.25, x + sc * 0.5, y + sc * 0.25, '#E84855', sw * 1.3); break;
      case 'money': s += path('M' + f(x - sc * 0.8) + ' ' + f(y - sc * 0.4) + 'h' + f(sc * 1.6) + 'v' + f(sc * 0.9) + 'h' + f(-sc * 1.6) + 'Z', '#9ED39B', sw) + circle(x, y + sc * 0.05, sc * 0.22, '#5E9C5B', 0); break;
      case 'briefcase': s += path('M' + f(x - sc * 0.9) + ' ' + f(y + sc * 0.2) + 'h' + f(sc * 1.8) + 'v' + f(sc * 1.2) + 'h' + f(-sc * 1.8) + 'Z', '#8B5E3C', sw) + stroke('M' + f(x - sc * 0.35) + ' ' + f(y + sc * 0.2) + 'v' + f(-sc * 0.3) + 'h' + f(sc * 0.7) + 'v' + f(sc * 0.3), INK, sw); break;
      case 'trophy': s += path('M' + f(x - sc * 0.7) + ' ' + f(y - sc * 1.6) + 'h' + f(sc * 1.4) + 'q0 ' + f(sc * 1.1) + ' ' + f(-sc * 0.7) + ' ' + f(sc * 1.1) + 'q' + f(-sc * 0.7) + ' 0 ' + f(-sc * 0.7) + ' ' + f(-sc * 1.1) + 'Z', '#FFC93C', sw) + path('M' + f(x - sc * 0.45) + ' ' + f(y - sc * 0.1) + 'h' + f(sc * 0.9) + 'v' + f(sc * 0.35) + 'h' + f(-sc * 0.9) + 'Z', '#C98B1E', sw); break;
      case 'bouquet': s += path('M' + f(x - sc * 0.35) + ' ' + f(y - sc * 0.2) + 'L' + f(x) + ' ' + f(y + sc * 1.2) + 'L' + f(x + sc * 0.35) + ' ' + f(y - sc * 0.2) + 'Z', '#7FDCA6', sw) +
        circle(x - sc * 0.45, y - sc * 0.55, sc * 0.4, '#FF8FAB', sw) + circle(x + sc * 0.45, y - sc * 0.55, sc * 0.4, '#FFCF5C', sw) + circle(x, y - sc * 0.95, sc * 0.42, '#F25C54', sw); break;
      case 'baby': s += ellipse(x, y + sc * 0.3, sc * 1.1, sc * 0.75, '#FFE3EC', sw) + circle(x - sc * 0.65, y - sc * 0.1, sc * 0.55, '#F8DDC8', sw) + stroke('M' + f(x - sc * 0.85) + ' ' + f(y - sc * 0.1) + 'q' + f(sc * 0.12) + ' ' + f(sc * 0.12) + ' ' + f(sc * 0.24) + ' 0', INK, sw * 0.8); break;
    }
    return s;
  }

  // ================= 메인 =================
  function render(o, age, opts) {
    opts = opts || {};
    var L = look(o, age, opts);
    L.sexF = o.sex === 'F';
    var pal = palette(o);
    var sw = (opts.sw || 0.9) * 0.65;
    var hh = L.hh, a = L.hw / 2, b = hh / 2;
    var seated = L.wheelchair && !opts.standing;
    var hipY, shoulderY, chinY, cy;
    if (seated) {
      hipY = -L.H * 0.27;
      shoulderY = hipY - L.torso;
    } else {
      hipY = -(L.H - hh - L.neck - L.torso);
      shoulderY = hipY - L.torso;
    }
    var hunchDrop = L.hunch * hh * 0.12;
    chinY = shoulderY - L.neck + hunchDrop;
    cy = chinY - b;
    var breathe = opts.breathe || 0;
    var phase = opts.phase || 0;
    var action = opts.action || (opts.wave ? 'wave' : 'idle');
    if ((seated || L.cane) && action === 'run') action = 'cheer';
    var move = opts.phase == null ? 0 : Math.sin(phase * (action === 'run' ? 5 : 2));
    var pose = opts.poseMix == null ? 1 : U.clamp(opts.poseMix, 0, 1);
    var col = outfitColors(L, pal);
    var sw2 = L.shoulderW / 2, hip2 = L.hipW / 2;
    var out = '';

    // 그림자
    out += ellipse(0, 0, Math.max(L.shoulderW, L.hipW) * (seated ? 1.1 : 0.75), hh * 0.12, 'rgba(81,70,63,0.10)', 0);

    // 발은 바닥에 둔 채 아주 작게 호흡합니다. 정지 이미지에는 변형이 없습니다.
    out += '<g class="person-body" transform="scale(1 ' + (1 + breathe * 0.003).toFixed(4) + ')">';

    // 강보에 싸인 신생아
    if (L.outfit === 'swaddle') {
      var top = -L.H + hh * 0.75, wb = hh * 0.62;
      out += path('M' + f(-wb) + ' ' + f(top + hh * 0.2) + 'Q' + f(-wb * 1.15) + ' ' + f(-hh * 0.15) + ' ' + f(-wb * 0.5) + ' ' + f(-hh * 0.02) + 'L' + f(wb * 0.5) + ' ' + f(-hh * 0.02) + 'Q' + f(wb * 1.15) + ' ' + f(-hh * 0.15) + ' ' + f(wb) + ' ' + f(top + hh * 0.2) + 'Q' + f(wb) + ' ' + f(top - hh * 0.25) + ' 0 ' + f(top - hh * 0.28) + 'Q' + f(-wb) + ' ' + f(top - hh * 0.25) + ' ' + f(-wb) + ' ' + f(top + hh * 0.2) + 'Z', pal.blanket, sw);
      out += stroke('M' + f(-wb * 0.9) + ' ' + f(top + hh * 0.15) + 'Q0 ' + f(top + hh * 0.75) + ' ' + f(wb * 0.85) + ' ' + f(top + hh * 0.05), INK, sw * 0.8, ' opacity="0.5"');
      for (var dd = 0; dd < 6; dd++) out += circle(-wb * 0.5 + (dd % 3) * wb * 0.5, top + hh * (0.5 + Math.floor(dd / 3) * 0.35), hh * 0.03, '#FFFFFF', 0, ' opacity="0.9"');
      cy = top - hh * 0.2 - b * 0.55;
    } else {
      // 휠체어 뒤판
      if (seated) {
        out += line(-sw2 * 1.0, hipY + hh * 0.1, -sw2 * 1.0, shoulderY - hh * 0.12, '#59647A', sw * 3);
        out += line(sw2 * 1.0, hipY + hh * 0.1, sw2 * 1.0, shoulderY - hh * 0.12, '#59647A', sw * 3);
        out += line(-sw2 * 1.0, shoulderY - hh * 0.12, -sw2 * 1.2, shoulderY - hh * 0.12, INK, sw * 3.2);
        out += line(sw2 * 1.0, shoulderY - hh * 0.12, sw2 * 1.2, shoulderY - hh * 0.12, INK, sw * 3.2);
      }
      // 긴 뒷머리 (몸 뒤)
      var hairS = hairShapes(L, 0, cy, a, b, L.hairColor, sw);
      out += drawShapes(hairS.back, L.hairColor, sw);
      // 책가방 (뒤)
      if (opts.prop === 'backpack') out += path('M' + f(-sw2 * 1.15) + ' ' + f(shoulderY + L.torso * 0.12) + 'h' + f(sw2 * 2.3) + 'v' + f(L.torso * 0.85) + 'q0 ' + f(hh * 0.1) + ' ' + f(-hh * 0.1) + ' ' + f(hh * 0.1) + 'h' + f(-sw2 * 2.3 + hh * 0.2) + 'q' + f(-hh * 0.1) + ' 0 ' + f(-hh * 0.1) + ' ' + f(-hh * 0.1) + 'Z', '#F25C54', sw);

      // 다리
      var legLen = -hipY, lx = hip2 * 0.48;
      var shoeH = hh * 0.13;
      if (seated) {
        var kneeY = hipY + L.legW * 0.7, footY = -shoeH * 1.6;
        out += limb(-lx, hipY, -lx * 1.1, kneeY, L.legW * 1.15, col.bottom, sw);
        out += limb(lx, hipY, lx * 1.1, kneeY, L.legW * 1.15, col.bottom, sw);
        out += limb(-lx * 1.1, kneeY, -lx * 1.05, footY, L.legW * 0.95, col.bottom, sw);
        out += limb(lx * 1.1, kneeY, lx * 1.05, footY, L.legW * 0.95, col.bottom, sw);
        out += path('M' + f(-hip2 * 1.3) + ' ' + f(footY + shoeH * 0.9) + 'h' + f(hip2 * 2.6) + 'v' + f(shoeH * 0.5) + 'h' + f(-hip2 * 2.6) + 'Z', '#59647A', sw);
        out += ellipse(-lx * 1.05, footY + shoeH * 0.3, L.legW * 0.7, shoeH * 0.6, col.shoe, sw);
        out += ellipse(lx * 1.05, footY + shoeH * 0.3, L.legW * 0.7, shoeH * 0.6, col.shoe, sw);
      } else {
        [-1, 1].forEach(function (sd) {
          var x = sd * lx, lift = action === 'run' ? Math.max(0, move * sd) * hh * .48 * pose : 0;
          var ankle = [x + sd * hh * .035 + (action === 'run' ? move * sd * hh * .12 * pose : 0), -shoeH * 1.3 - lift];
          var knee = [x + sd * hh * .075, hipY * .48 - lift * .6];
          var start = [x, hipY];
          out += ribbon(start, knee, ankle, L.legW * 1.18, L.legW * .85, L.legW * .62, col.shorts || col.skirt ? L.skin : col.bottom, sw * .6);
          if (col.shorts) out += ribbon(start, [x + sd * hh * .02, hipY + legLen * .16], [x + sd * hh * .04, hipY + legLen * .33], L.legW * 1.22, L.legW * 1.14, L.legW, col.bottom, sw * .6);
          if (col.skirt) out += ribbon([ankle[0], -legLen * .26 - lift], [ankle[0], -legLen * .12 - lift], ankle, L.legW * .78, L.legW * .7, L.legW * .65, '#FFF9F2', sw * .4);
          var shoeX = ankle[0] + sd * L.legW * .13;
          out += ellipse(shoeX, -shoeH * .55 - lift, L.legW * .63, shoeH * .55, col.shoe, sw * .7);
          out += line(shoeX - L.legW * .48, -shoeH * .13 - lift, shoeX + L.legW * .48, -shoeH * .13 - lift, '#FFF8EC', shoeH * .22);
          if (L.outfit === 'track') out += stroke('M' + f(x + sd * L.legW * .35) + ' ' + f(hipY + hh * .1) + 'Q' + f(knee[0] + sd * L.legW * .3) + ' ' + f(knee[1]) + ' ' + f(ankle[0] + sd * L.legW * .2) + ' ' + f(ankle[1]), '#E8EFEA', sw * .8);
          if (L.outfit === 'fire') out += line(knee[0] - L.legW * .35, knee[1], knee[0] + L.legW * .35, knee[1], '#F7E15A', sw * 1.6);
        });
        if (L.outfit === 'onesie') out += ellipse(0, hipY + hh * 0.05, hip2 * 1.05, hh * 0.22, col.bottom, sw);
      }

      // 몸통
      var bel = L.belly * hh * 0.13, tTop = shoulderY + breathe * hh * 0.01;
      var coatExt = col.coat ? legLen * 0.4 : (L.outfit === 'apron' ? 0 : 0);
      var rr = Math.min(sw2 * 0.5, L.torso * 0.3);
      var bodyBottom = hipY + hh * 0.04;
      function torsoPath(extBottom) {
        var yb = bodyBottom + extBottom, hem = hip2 + (extBottom ? hh * .07 : 0);
        var waist = sw2 * (L.age < 10 ? .86 : L.sexF ? .70 : .78) + bel;
        var neckW = a * .31, armpit = tTop + L.torso * .28;
        return 'M' + f(-neckW) + ' ' + f(tTop) +
          'Q' + f(-sw2 * .76) + ' ' + f(tTop + hh * .05) + ' ' + f(-sw2) + ' ' + f(tTop + hh * .17) +
          'Q' + f(-sw2 * .97) + ' ' + f(armpit) + ' ' + f(-waist) + ' ' + f(tTop + L.torso * .63) +
          'Q' + f(-hem) + ' ' + f(yb - hh * .08) + ' ' + f(-hem) + ' ' + f(yb - hh * .03) +
          'Q0 ' + f(yb + hh * .07) + ' ' + f(hem) + ' ' + f(yb - hh * .03) +
          'Q' + f(hem) + ' ' + f(yb - hh * .08) + ' ' + f(waist) + ' ' + f(tTop + L.torso * .63) +
          'Q' + f(sw2 * .97) + ' ' + f(armpit) + ' ' + f(sw2) + ' ' + f(tTop + hh * .17) +
          'Q' + f(sw2 * .76) + ' ' + f(tTop + hh * .05) + ' ' + f(neckW) + ' ' + f(tTop) + 'Z';
      }
      // 치마
      if (col.skirt && !seated) {
        out += path('M' + f(-hip2 * 1.05) + ' ' + f(hipY - hh * 0.05) + 'L' + f(-hip2 * 1.35) + ' ' + f(hipY + legLen * 0.42) + 'L' + f(hip2 * 1.35) + ' ' + f(hipY + legLen * 0.42) + 'L' + f(hip2 * 1.05) + ' ' + f(hipY - hh * 0.05) + 'Z', '#5B6B8C', sw);
        for (var pl = -2; pl <= 2; pl++) out += line(pl * hip2 * 0.42, hipY + hh * 0.05, pl * hip2 * 0.55, hipY + legLen * 0.4, INK, sw * 0.5, ' opacity="0.45"');
      }
      // 목
      out += path('M' + f(-a * 0.24) + ' ' + f(chinY - hh * 0.06) + 'h' + f(a * 0.48) + 'V' + f(tTop + hh * 0.06) + 'h' + f(-a * 0.48) + 'Z', U.mix(L.skin, '#C98F6E', 0.18), sw);
      out += path(torsoPath(coatExt), col.top, sw);
      // 옷 디테일
      var nk = tTop, cw = a * 0.42;
      switch (L.outfit) {
        case 'onesie':
          out += path('M' + f(-cw) + ' ' + f(nk) + 'Q0 ' + f(nk + hh * 0.18) + ' ' + f(cw) + ' ' + f(nk) + 'Z', '#FFFFFF', sw * 0.7);
          for (var sn = 0; sn < 3; sn++) out += circle(0, nk + L.torso * (0.4 + sn * 0.2), hh * 0.025, '#FFFFFF', sw * 0.5);
          break;
        case 'kid':
          out += path('M' + f(-sw2 * .88) + ' ' + f(nk + L.torso * 0.45) + 'h' + f(sw2 * 1.76) + 'v' + f(L.torso * 0.12) + 'h' + f(-sw2 * 1.76) + 'Z', U.mix(col.top, '#FFFFFF', 0.55), 0);
          out += stroke('M' + f(-cw) + ' ' + f(nk) + 'Q0 ' + f(nk + hh * 0.16) + ' ' + f(cw) + ' ' + f(nk), INK, sw * 0.8);
          break;
        case 'school':
          out += path('M' + f(-cw * 1.1) + ' ' + f(nk) + 'L0 ' + f(nk + L.torso * 0.5) + 'L' + f(cw * 1.1) + ' ' + f(nk) + 'Z', '#FFFFFF', sw * 0.8);
          out += path('M' + f(-hh * 0.05) + ' ' + f(nk + hh * 0.03) + 'h' + f(hh * 0.1) + 'l' + f(hh * 0.03) + ' ' + f(L.torso * 0.36) + 'l' + f(-hh * 0.08) + ' ' + f(hh * 0.07) + 'l' + f(-hh * 0.08) + ' ' + f(-hh * 0.07) + 'Z', '#C8453C', sw * 0.7);
          out += circle(0, nk + L.torso * 0.62, hh * 0.025, '#E6C26A', sw * 0.4) + circle(0, nk + L.torso * 0.8, hh * 0.025, '#E6C26A', sw * 0.4);
          out += path('M' + f(-sw2 * 0.62) + ' ' + f(nk + L.torso * 0.22) + 'h' + f(hh * 0.12) + 'v' + f(hh * 0.12) + 'q' + f(-hh * 0.06) + ' ' + f(hh * 0.06) + ' ' + f(-hh * 0.12) + ' 0Z', '#E6C26A', sw * 0.5);
          break;
        case 'hoodie':
          out += path('M' + f(-cw * 1.5) + ' ' + f(nk + hh * 0.02) + 'Q0 ' + f(nk + hh * 0.3) + ' ' + f(cw * 1.5) + ' ' + f(nk + hh * 0.02) + 'Q0 ' + f(nk - hh * 0.08) + ' ' + f(-cw * 1.5) + ' ' + f(nk + hh * 0.02) + 'Z', U.mix(col.top, INK, 0.15), sw * 0.8);
          out += line(-cw * 0.4, nk + hh * 0.14, -cw * 0.45, nk + L.torso * 0.4, '#FFFFFF', sw * 0.7) + line(cw * 0.4, nk + hh * 0.14, cw * 0.45, nk + L.torso * 0.4, '#FFFFFF', sw * 0.7);
          out += path('M' + f(-sw2 * 0.55) + ' ' + f(hipY - L.torso * 0.32) + 'h' + f(sw2 * 1.1) + 'l' + f(hh * 0.05) + ' ' + f(L.torso * 0.28) + 'h' + f(-sw2 * 1.1 - hh * 0.1) + 'Z', U.mix(col.top, INK, 0.1), sw * 0.7);
          break;
        case 'suit': case 'smart':
          out += path('M' + f(-cw) + ' ' + f(nk) + 'L0 ' + f(nk + L.torso * 0.48) + 'L' + f(cw) + ' ' + f(nk) + 'Z', L.outfit === 'suit' ? '#FFFFFF' : '#DCE7F5', sw * 0.8);
          if (L.outfit === 'suit' && !L.sexF) out += path('M' + f(-hh * 0.045) + ' ' + f(nk + hh * 0.03) + 'h' + f(hh * 0.09) + 'l' + f(hh * 0.025) + ' ' + f(L.torso * 0.34) + 'l' + f(-hh * 0.07) + ' ' + f(hh * 0.06) + 'l' + f(-hh * 0.07) + ' ' + f(-hh * 0.06) + 'Z', '#B8484E', sw * 0.6);
          out += stroke('M' + f(-cw) + ' ' + f(nk) + 'L' + f(-cw * 0.3) + ' ' + f(nk + L.torso * 0.62) + 'M' + f(cw) + ' ' + f(nk) + 'L' + f(cw * 0.3) + ' ' + f(nk + L.torso * 0.62), INK, sw * 0.7);
          break;
        case 'labcoat':
          out += path('M' + f(-cw) + ' ' + f(nk) + 'L0 ' + f(nk + L.torso * 0.42) + 'L' + f(cw) + ' ' + f(nk) + 'Z', '#BFD7EA', sw * 0.8);
          out += line(0, nk + L.torso * 0.42, 0, bodyBottom + coatExt, INK, sw * 0.7);
          out += path('M' + f(sw2 * 0.25) + ' ' + f(nk + L.torso * 0.3) + 'h' + f(sw2 * 0.45) + 'v' + f(hh * 0.16) + 'h' + f(-sw2 * 0.45) + 'Z', '#F5F7FA', sw * 0.6);
          out += line(sw2 * 0.38, nk + L.torso * 0.24, sw2 * 0.38, nk + L.torso * 0.36, '#4F7CAC', sw * 0.9);
          break;
        case 'track':
          out += line(0, nk + hh * 0.04, 0, bodyBottom, '#FFFFFF', sw * 0.8);
          out += path('M' + f(-cw) + ' ' + f(nk) + 'h' + f(cw * 2) + 'v' + f(hh * 0.06) + 'h' + f(-cw * 2) + 'Z', '#FFFFFF', sw * 0.5);
          break;
        case 'turtleneck':
          out += path('M' + f(-a * 0.32) + ' ' + f(nk - hh * 0.07) + 'h' + f(a * 0.64) + 'v' + f(hh * 0.11) + 'h' + f(-a * 0.64) + 'Z', '#3A3D55', sw * 0.8);
          break;
        case 'apron':
          out += path('M' + f(-sw2 * 0.55) + ' ' + f(nk + L.torso * 0.2) + 'h' + f(sw2 * 1.1) + 'L' + f(hip2 * 1.05) + ' ' + f(hipY + (seated ? 0 : legLen * 0.38)) + 'h' + f(-hip2 * 2.1) + 'Z', '#D9B382', sw * 0.8);
          out += stroke('M' + f(-sw2 * 0.5) + ' ' + f(nk + L.torso * 0.2) + 'L' + f(-a * 0.25) + ' ' + f(nk) + 'M' + f(sw2 * 0.5) + ' ' + f(nk + L.torso * 0.2) + 'L' + f(a * 0.25) + ' ' + f(nk), '#B08A5A', sw * 1.1);
          out += path('M' + f(-sw2 * 0.25) + ' ' + f(hipY - L.torso * 0.08) + 'h' + f(sw2 * 0.5) + 'v' + f(hh * 0.14) + 'h' + f(-sw2 * 0.5) + 'Z', '#C79D6B', sw * 0.6);
          break;
        case 'scrubs':
          out += path('M' + f(-cw) + ' ' + f(nk) + 'L0 ' + f(nk + L.torso * 0.3) + 'L' + f(cw) + ' ' + f(nk) + 'Z', U.mix(L.skin, '#C98F6E', 0.12), sw * 0.8);
          out += path('M' + f(-sw2 * 0.65) + ' ' + f(nk + L.torso * 0.32) + 'h' + f(sw2 * 0.4) + 'v' + f(hh * 0.13) + 'h' + f(-sw2 * 0.4) + 'Z', '#4AA9A7', sw * 0.6);
          break;
        case 'fire':
          out += line(-sw2 * 0.76, nk + L.torso * 0.55, sw2 * 0.76, nk + L.torso * 0.55, '#F7E15A', sw * 2.2);
          out += line(-sw2 * 0.80, nk + L.torso * 0.85, sw2 * 0.80, nk + L.torso * 0.85, '#F7E15A', sw * 2.2);
          break;
        case 'cardigan':
          out += path('M' + f(-cw) + ' ' + f(nk) + 'L0 ' + f(nk + L.torso * 0.45) + 'L' + f(cw) + ' ' + f(nk) + 'Z', '#F2EDE4', sw * 0.8);
          out += line(0, nk + L.torso * 0.45, 0, bodyBottom, INK, sw * 0.6);
          for (var cb = 0; cb < 3; cb++) out += circle(hh * 0.04, nk + L.torso * (0.55 + cb * 0.15), hh * 0.022, '#8B6B4A', 0);
          break;
      }
      // 메달
      if (opts.prop === 'medal') {
        out += stroke('M' + f(-a * 0.32) + ' ' + f(nk) + 'L0 ' + f(nk + L.torso * 0.42) + 'L' + f(a * 0.32) + ' ' + f(nk), '#E84855', sw * 1.8);
        out += circle(0, nk + L.torso * 0.48, hh * 0.09, '#FFC93C', sw);
      }
      // 책가방 끈
      if (opts.prop === 'backpack') {
        out += line(-sw2 * 0.55, nk + sw, -sw2 * 0.6, hipY - L.torso * 0.15, '#D64541', hh * 0.06);
        out += line(sw2 * 0.55, nk + sw, sw2 * 0.6, hipY - L.torso * 0.15, '#D64541', hh * 0.06);
      }

      // 휠체어 바퀴
      if (seated) {
        var wr = L.H * 0.16, wx = hip2 + L.legW * 0.55;
        [-1, 1].forEach(function (sd) {
          var cxw = sd * (wx + wr * 0.2);
          out += ellipse(cxw, -wr, wr * 0.34, wr, '#3A4256', sw * 2.6);
          out += ellipse(cxw, -wr, wr * 0.2, wr * 0.82, 'none', sw * 0.8, ' stroke-dasharray="' + f(wr * 0.2) + ' ' + f(wr * 0.25) + '"');
          out += ellipse(cxw + sd * wr * 0.12, -wr, wr * 0.3, wr * 0.92, 'none', sw * 0.9);
          out += circle(sd * (hip2 + L.legW * 0.1), -hh * 0.12, hh * 0.1, '#3A4256', sw);
        });
        out += path('M' + f(-hip2 * 1.25) + ' ' + f(hipY) + 'h' + f(hip2 * 2.5) + 'v' + f(hh * 0.1) + 'h' + f(-hip2 * 2.5) + 'Z', '#59647A', sw);
      }

      // 어깨 → 팔꿈치 → 손목의 한 실루엣. 손은 손목 방향을 따라갑니다.
      var armLen = L.torso * .94, hands = {};
      var propSide = L.cane ? -1 : 1;
      [-1, 1].forEach(function (sd) {
        var start = [sd * (sw2 - L.armW * .38), tTop + hh * .18];
        var elbow = [sd * (sw2 + hh * .04), tTop + armLen * .55];
        var wrist = [sd * (hip2 + hh * .12), tTop + armLen];
        var targetE = elbow.slice(), targetW = wrist.slice();
        var hold = sd === propSide && opts.prop && ['backpack', 'medal', 'gradcap', 'note'].indexOf(opts.prop) < 0;
        if (hold) { targetE = [sd * (sw2 + hh * .12), tTop + armLen * .58]; targetW = [sd * (sw2 + hh * .14), tTop + armLen * .43]; }
        if (action === 'read' || action === 'cradle') {
          targetE = [sd * (sw2 + hh * .04), tTop + armLen * .68];
          targetW = [sd * hh * .15, tTop + armLen * (action === 'read' ? .47 : .63) + sd * hh * .05];
        } else if (action === 'think' && sd === -1) {
          targetE = [-sw2 - hh * .02, tTop + armLen * .48]; targetW = [-a * .22, chinY + hh * .04];
        } else if (action === 'perform' && sd === propSide) {
          targetE = [sd * (sw2 + hh * .10), tTop + armLen * .48]; targetW = [sd * a * .42, chinY + hh * .20 + move * hh * .025];
        } else if ((action === 'celebrate' || action === 'cheer' || action === 'wave') && (sd === -1 || action !== 'wave')) {
          targetE = [sd * (sw2 + hh * .36), tTop + hh * .12];
          targetW = [sd * (sw2 + hh * (.32 + move * .09)), tTop - hh * .42];
        } else if (action === 'run') {
          targetE = [sd * (sw2 + hh * .18), tTop + armLen * .48];
          targetW = [sd * (sw2 - hh * .09), tTop + armLen * (.28 + sd * move * .17)];
        } else if (action === 'welcome') {
          targetE = [sd * (sw2 + hh * .25), tTop + armLen * .52]; targetW = [sd * (sw2 + hh * .46), tTop + armLen * .35];
        }
        // 보행 보조기기를 든 손은 안전하게 유지합니다.
        if (sd === 1 && L.cane) { targetE = [sw2 + hh * .08, tTop + armLen * .55]; targetW = [sw2 + hh * .24, tTop + armLen * .80]; }
        if (seated && action === 'idle') { targetE = [sd * (sw2 + hh * .12), tTop + armLen * .6]; targetW = [sd * (hip2 + hh * .14), hipY]; }
        elbow = elbow.map(function (v, i) { return U.lerp(v, targetE[i], pose); });
        wrist = wrist.map(function (v, i) { return U.lerp(v, targetW[i], pose); });
        var shortSleeve = L.outfit === 'kid' && L.age >= 3;
        out += ribbon(start, elbow, wrist, L.armW * .95, L.armW * .82, L.armW * .60, shortSleeve ? L.skin : col.sleeve, sw * .35);
        if (shortSleeve) {
          var cuff = [U.lerp(start[0], elbow[0], .65), U.lerp(start[1], elbow[1], .65)];
          out += ribbon(start, [U.lerp(start[0], cuff[0], .5), U.lerp(start[1], cuff[1], .5)], cuff, L.armW * 1.24, L.armW * 1.16, L.armW * 1.06, col.sleeve, sw * .3);
        } else {
          out += stroke('M' + f(wrist[0] - L.armW * .25) + ' ' + f(wrist[1]) + 'l' + f(L.armW * .5) + ' 0', U.mix(col.sleeve, INK, .18), sw * .6);
        }
        var angle = Math.atan2(wrist[1] - elbow[1], wrist[0] - elbow[0]) * 180 / Math.PI - 90;
        out += hand(wrist[0], wrist[1], angle, L.armW * .72, L.skin, sw, action === 'wave' || action === 'welcome');
        hands[sd] = wrist;
      });

      // 지팡이
      if (L.cane === 'white') {
        var hx1 = hands[1][0], hy1 = hands[1][1];
        out += line(hx1, hy1, hx1 + hh * 0.75, -0.5, INK, sw * 2.6) + line(hx1, hy1, hx1 + hh * 0.75, -0.5, '#FFFFFF', sw * 1.3);
        var tR = 0.82;
        out += line(hx1 + hh * 0.75 * tR, hy1 + (-0.5 - hy1) * tR, hx1 + hh * 0.75 * 0.95, hy1 + (-0.5 - hy1) * 0.95, '#E84855', sw * 1.3);
      } else if (L.cane === 'walk') {
        var hx2 = hands[1][0], hy2 = hands[1][1];
        out += line(hx2 + hh * 0.05, hy2, hx2 + hh * 0.08, -0.3, INK, sw * 3) + line(hx2 + hh * 0.05, hy2, hx2 + hh * 0.08, -0.3, '#9C6B43', sw * 1.6);
        out += stroke('M' + f(hx2 + hh * 0.05) + ' ' + f(hy2) + 'q' + f(-hh * 0.02) + ' ' + f(-hh * 0.12) + ' ' + f(-hh * 0.14) + ' ' + f(-hh * 0.06), '#9C6B43', sw * 1.8);
      }
      // 손에 든 물건
      if (opts.prop && hands[propSide]) {
        var held = hands[propSide];
        var propX = action === 'cradle' || action === 'read' ? 0 : held[0];
        var propY = action === 'cradle' ? tTop + armLen * .54 : action === 'read' ? tTop + armLen * .36 : held[1];
        out += propSVG(opts.prop, propX, propY, hh * (action === 'cradle' ? .36 : .23), sw * .8);
      }
    }

    // ---------------- 머리 ----------------
    var tilt = (action === 'read' ? 5 : action === 'think' ? -7 : action === 'cradle' ? -5 : action === 'perform' ? -3 : 0) * pose + (opts.phase == null ? 0 : Math.sin(phase * .85) * 1.1);
    out += '<g class="person-head" transform="rotate(' + f(tilt) + ' 0 ' + f(cy + b) + ')">';
    var yaw = opts.yaw || 0;
    var earX = a * 0.97, earY = cy + b * 0.12;
    out += ellipse(-earX - yaw * a * 0.03, earY, a * 0.15, b * 0.19, L.skin, sw);
    out += ellipse(earX - yaw * a * 0.03, earY, a * 0.15, b * 0.19, L.skin, sw);
    if (L.hearing) {
      // 보청기·인공와우
      out += path('M' + f(earX + a * 0.04) + ' ' + f(earY - b * 0.22) + 'q' + f(a * 0.2) + ' ' + f(b * 0.05) + ' ' + f(a * 0.14) + ' ' + f(b * 0.38) + 'l' + f(-a * 0.08) + ' 0q' + f(a * 0.04) + ' ' + f(-b * 0.25) + ' ' + f(-a * 0.08) + ' ' + f(-b * 0.32) + 'Z', '#4FC4BA', sw * 0.8);
      out += circle(earX + a * 0.02, earY - b * 0.42, a * 0.08, '#4FC4BA', sw * 0.8);
    }
    var jaw = U.interp([[0, 1.02], [3, 0.96], [12, 0.83], [18, L.sexF ? 0.72 : 0.82]], L.age) + (L.faceType - 1.5) * .035;
    var cheek = U.interp([[0, 1], [10, .96], [18, .86 + L.faceType * .025]], L.age);
    var k = 0.56, top0 = cy - b, bot0 = cy + b;
    var faceD = 'M' + f(-a) + ' ' + f(cy) + 'C' + f(-a) + ' ' + f(cy - k * b) + ' ' + f(-k * a) + ' ' + f(top0) + ' 0 ' + f(top0) +
      'C' + f(k * a) + ' ' + f(top0) + ' ' + f(a) + ' ' + f(cy - k * b) + ' ' + f(a) + ' ' + f(cy) +
      'C' + f(a * cheek) + ' ' + f(cy + b * 0.56) + ' ' + f(jaw * a * 0.85) + ' ' + f(bot0 - b * 0.08) + ' 0 ' + f(bot0) +
      'C' + f(-jaw * a * 0.85) + ' ' + f(bot0 - b * 0.08) + ' ' + f(-a * cheek) + ' ' + f(cy + b * 0.56) + ' ' + f(-a) + ' ' + f(cy) + 'Z';
    out += path(faceD, L.skin, sw);
    var fc = face(L, 0, cy, a, b, sw, o, opts);
    out += fc.svg;
    if (L.outfit !== 'swaddle') {
      out += drawShapes(hairS.front, L.hairColor, sw);
    } else {
      var hs = hairShapes(L, 0, cy, a, b, L.hairColor, sw);
      out += drawShapes(hs.front, L.hairColor, sw);
      out += path('M' + f(-a * 0.95) + ' ' + f(cy - b * 0.2) + 'Q' + f(-a) + ' ' + f(cy - b * 1.25) + ' 0 ' + f(cy - b * 1.22) + 'Q' + f(a) + ' ' + f(cy - b * 1.25) + ' ' + f(a * 0.95) + ' ' + f(cy - b * 0.2) + 'Q0 ' + f(cy - b * 0.6) + ' ' + f(-a * 0.95) + ' ' + f(cy - b * 0.2) + 'Z', pal.blanket, sw);
    }
    if (opts.prop === 'gradcap') {
      var gy = cy - b * 0.92;
      out += path('M' + f(-a * 0.62) + ' ' + f(gy) + 'h' + f(a * 1.24) + 'v' + f(b * 0.3) + 'h' + f(-a * 1.24) + 'Z', '#2B2D42', sw);
      out += path('M0 ' + f(gy - b * 0.32) + 'L' + f(a * 1.25) + ' ' + f(gy - b * 0.02) + 'L0 ' + f(gy + b * 0.18) + 'L' + f(-a * 1.25) + ' ' + f(gy - b * 0.02) + 'Z', '#2B2D42', sw);
      out += stroke('M0 ' + f(gy - b * 0.05) + 'L' + f(a * 0.9) + ' ' + f(gy + b * 0.05) + 'v' + f(b * 0.45), '#FFC93C', sw * 1.2);
    }
    if (opts.prop === 'note') {
      var nx = a * 1.5, ny = cy - b * 0.9;
      out += circle(nx, ny + b * 0.4, b * 0.13, INK, 0) + line(nx + b * 0.12, ny + b * 0.4, nx + b * 0.12, ny - b * 0.15, INK, sw * 1.3) + stroke('M' + f(nx + b * 0.12) + ' ' + f(ny - b * 0.15) + 'q' + f(b * 0.2) + ' ' + f(b * 0.08) + ' ' + f(b * 0.24) + ' ' + f(b * 0.3), INK, sw * 1.3);
    }
    return out + '</g></g>';
  }

  // 그림 전체 높이(머리 위까지, cm) — 화면 맞춤용
  function topOf(o, age) {
    var L = look(o, age, {});
    var hair = (L.style === 'perm' || L.tex === 'curly') ? 0.34 : L.tex === 'wavy' ? 0.16 : 0.1;
    if (L.outfit === 'swaddle') hair = 0.38; else if (L.style === 'wisp') hair = 0.12;
    var head = L.wheelchair ? L.H * 0.27 + L.torso + L.neck + L.hh : L.H;
    return head + L.hh * hair;
  }

  // 독립 SVG (결과 카드·라벨용)
  function standalone(o, age, opts) {
    opts = opts || {};
    var w = opts.w || 200, h = opts.h || 260;
    var topCm = Math.max(topOf(o, age), opts.minCm || 0) * 1.08;
    var scale = (h * 0.9) / topCm;
    var sw = (opts.px || 2.2) / scale;
    var inner = render(o, age, { sw: sw, mood: opts.mood || 'happy', closedMouth: opts.closedMouth, prop: opts.prop, action: opts.action, expression: opts.expression, phase: opts.phase, yaw: 0 });
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' +
      (opts.bg ? '<rect width="' + w + '" height="' + h + '" fill="' + opts.bg + '"/>' : '') +
      '<g transform="translate(' + f(w / 2) + ' ' + f(h * 0.95) + ') scale(' + f(scale) + ')">' + inner + '</g></svg>';
  }

  BF.Person = { render: render, look: look, topOf: topOf, standalone: standalone, INK: INK };
})(BF);
