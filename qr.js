/* 베이비 팩토리 — QR 코드 생성기 (외부 라이브러리 없이 동작, ISO/IEC 18004 바이트 모드)
   인터넷이 없는 행사장에서도 QR을 만들 수 있도록 직접 구현했습니다. */
'use strict';
var BF = window.BF || (window.BF = {});

(function (BF) {
  var ECL = { L: { ord: 0, bits: 1 }, M: { ord: 1, bits: 0 }, Q: { ord: 2, bits: 3 }, H: { ord: 3, bits: 2 } };
  var ECC_PER_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  ];
  var NUM_BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  ];

  function rawModules(ver) {
    var r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      var na = Math.floor(ver / 7) + 2;
      r -= (25 * na - 10) * na - 55;
      if (ver >= 7) r -= 36;
    }
    return r;
  }
  function dataCodewords(ver, e) {
    return Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[e.ord][ver] * NUM_BLOCKS[e.ord][ver];
  }

  // ---- 리드-솔로몬 (GF(2^8), 원시다항식 0x11D) ----
  function gfMul(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }
  function rsDivisor(degree) {
    var res = [], i, j;
    for (i = 0; i < degree - 1; i++) res.push(0);
    res.push(1);
    var root = 1;
    for (i = 0; i < degree; i++) {
      for (j = 0; j < res.length; j++) {
        res[j] = gfMul(res[j], root);
        if (j + 1 < res.length) res[j] ^= res[j + 1];
      }
      root = gfMul(root, 0x02);
    }
    return res;
  }
  function rsRemainder(data, div) {
    var res = div.map(function () { return 0; });
    data.forEach(function (b) {
      var f = b ^ res.shift();
      res.push(0);
      div.forEach(function (c, i) { res[i] ^= gfMul(c, f); });
    });
    return res;
  }

  function getBit(x, i) { return ((x >>> i) & 1) !== 0; }

  function alignPositions(ver, size) {
    if (ver === 1) return [];
    var na = Math.floor(ver / 7) + 2;
    var step = Math.floor((ver * 8 + na * 3 + 5) / (na * 4 - 4)) * 2;
    var res = [6];
    for (var pos = size - 7; res.length < na; pos -= step) res.splice(1, 0, pos);
    return res;
  }

  function encode(text, eclName, minVersion) {
    var bytes = BF.util.utf8Encode(text);
    var e = ECL[eclName || 'M'];
    var ver, cap, used;
    for (ver = Math.max(1, minVersion || 1); ver <= 40; ver++) {
      cap = dataCodewords(ver, e) * 8;
      used = 4 + (ver <= 9 ? 8 : 16) + bytes.length * 8;
      if (used <= cap) break;
    }
    if (ver > 40) throw new Error('QR에 담기에는 데이터가 너무 깁니다');
    // 같은 버전(같은 크기)에서 더 높은 오류 정정 수준이 들어가면 올린다 → 작은 라벨에서도 잘 읽힘
    ['M', 'Q', 'H'].forEach(function (n) {
      if (ECL[n].ord > e.ord && used <= dataCodewords(ver, ECL[n]) * 8) e = ECL[n];
    });
    cap = dataCodewords(ver, e) * 8;

    // ---- 비트 스트림 ----
    var bb = [];
    function put(val, len) { for (var i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1); }
    put(4, 4);
    put(bytes.length, ver <= 9 ? 8 : 16);
    bytes.forEach(function (b) { put(b, 8); });
    put(0, Math.min(4, cap - bb.length));
    put(0, (8 - bb.length % 8) % 8);
    for (var pad = 0xEC; bb.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);
    var data = [];
    for (var i = 0; i < bb.length; i += 8) {
      var v = 0;
      for (var j = 0; j < 8; j++) v = (v << 1) | bb[i + j];
      data.push(v);
    }

    // ---- 오류 정정 + 인터리브 ----
    var nb = NUM_BLOCKS[e.ord][ver], eccLen = ECC_PER_BLOCK[e.ord][ver];
    var raw = Math.floor(rawModules(ver) / 8);
    var nShort = nb - raw % nb, shortLen = Math.floor(raw / nb);
    var div = rsDivisor(eccLen), blocks = [], k = 0;
    for (i = 0; i < nb; i++) {
      var dat = data.slice(k, k + shortLen - eccLen + (i < nShort ? 0 : 1));
      k += dat.length;
      var ecc = rsRemainder(dat, div);
      if (i < nShort) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    var allCw = [];
    for (i = 0; i < blocks[0].length; i++) {
      for (j = 0; j < blocks.length; j++) {
        if (i !== shortLen - eccLen || j >= nShort) allCw.push(blocks[j][i]);
      }
    }

    // ---- 모듈 배치 ----
    var size = ver * 4 + 17;
    var mod = [], fn = [];
    for (i = 0; i < size; i++) { mod.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    function setF(x, y, d) { mod[y][x] = d; fn[y][x] = true; }

    for (i = 0; i < size; i++) { setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }
    function finder(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var dist = Math.max(Math.abs(dx), Math.abs(dy)), xx = cx + dx, yy = cy + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) setF(xx, yy, dist !== 2 && dist !== 4);
      }
    }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    var ap = alignPositions(ver, size), na = ap.length;
    for (i = 0; i < na; i++) for (j = 0; j < na; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) continue;
      for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++)
        setF(ap[i] + dx, ap[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    function drawFormat(mask) {
      var d = (e.bits << 3) | mask, rem = d;
      for (var q = 0; q < 10; q++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var bits = ((d << 10) | rem) ^ 0x5412;
      for (q = 0; q <= 5; q++) setF(8, q, getBit(bits, q));
      setF(8, 7, getBit(bits, 6));
      setF(8, 8, getBit(bits, 7));
      setF(7, 8, getBit(bits, 8));
      for (q = 9; q < 15; q++) setF(14 - q, 8, getBit(bits, q));
      for (q = 0; q < 8; q++) setF(size - 1 - q, 8, getBit(bits, q));
      for (q = 8; q < 15; q++) setF(8, size - 15 + q, getBit(bits, q));
      setF(8, size - 8, true);
    }
    drawFormat(0);
    if (ver >= 7) {
      var rem = ver;
      for (i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      var vbits = (ver << 12) | rem;
      for (i = 0; i < 18; i++) {
        var c = getBit(vbits, i), a = size - 11 + i % 3, b = Math.floor(i / 3);
        setF(a, b, c); setF(b, a, c);
      }
    }
    // 데이터 지그재그 배치
    var bi = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        for (j = 0; j < 2; j++) {
          var x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
          if (!fn[y][x] && bi < allCw.length * 8) {
            mod[y][x] = getBit(allCw[bi >>> 3], 7 - (bi & 7));
            bi++;
          }
        }
      }
    }

    function applyMask(m) {
      for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
        var inv;
        switch (m) {
          case 0: inv = (x + y) % 2 === 0; break;
          case 1: inv = y % 2 === 0; break;
          case 2: inv = x % 3 === 0; break;
          case 3: inv = (x + y) % 3 === 0; break;
          case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: inv = (x * y) % 2 + (x * y) % 3 === 0; break;
          case 6: inv = ((x * y) % 2 + (x * y) % 3) % 2 === 0; break;
          default: inv = ((x + y) % 2 + (x * y) % 3) % 2 === 0;
        }
        if (!fn[y][x] && inv) mod[y][x] = !mod[y][x];
      }
    }
    function penalty() {
      var p = 0, x, y, dark = 0;
      function lineScore(get) {
        var s = 0, r = 1, pv = get(0);
        for (var q = 1; q < size; q++) {
          var cur = get(q);
          if (cur === pv) { r++; if (r === 5) s += 3; else if (r > 5) s++; }
          else { r = 1; pv = cur; }
        }
        // 파인더 유사 패턴 1:1:3:1:1 + 밝은 4칸
        var seq = [];
        for (q = 0; q < size; q++) seq.push(get(q) ? 1 : 0);
        var pat1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], pat2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
        for (q = 0; q + 11 <= size; q++) {
          var m1 = true, m2 = true;
          for (var t = 0; t < 11; t++) { if (seq[q + t] !== pat1[t]) m1 = false; if (seq[q + t] !== pat2[t]) m2 = false; }
          if (m1) s += 40; if (m2) s += 40;
        }
        return s;
      }
      for (y = 0; y < size; y++) p += lineScore(function (q) { return mod[y][q]; });
      for (x = 0; x < size; x++) p += lineScore(function (q) { return mod[q][x]; });
      for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) {
        var cc = mod[y][x];
        if (cc === mod[y][x + 1] && cc === mod[y + 1][x] && cc === mod[y + 1][x + 1]) p += 3;
      }
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (mod[y][x]) dark++;
      var total = size * size;
      var kk = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
      p += Math.max(0, kk) * 10;
      return p;
    }
    var best = 0, bestP = Infinity;
    for (var m = 0; m < 8; m++) {
      applyMask(m); drawFormat(m);
      var pp = penalty();
      if (pp < bestP) { bestP = pp; best = m; }
      applyMask(m); // 되돌리기 (XOR)
    }
    applyMask(best); drawFormat(best);
    return { size: size, version: ver, ecl: Object.keys(ECL).filter(function (n) { return ECL[n] === e; })[0], modules: mod };
  }

  // SVG 문자열 (인쇄용으로 선명하게, 모듈을 행 단위 path로 합침)
  function toSVG(qr, opt) {
    opt = opt || {};
    var border = opt.border == null ? 4 : opt.border, n = qr.size + border * 2;
    var d = '';
    for (var y = 0; y < qr.size; y++) {
      var x = 0;
      while (x < qr.size) {
        if (qr.modules[y][x]) {
          var s = x;
          while (x < qr.size && qr.modules[y][x]) x++;
          d += 'M' + (s + border) + ' ' + (y + border) + 'h' + (x - s) + 'v1h-' + (x - s) + 'z';
        } else x++;
      }
    }
    var fg = opt.fg || '#000', bg = opt.bg || '#fff';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges"' +
      (opt.cls ? ' class="' + opt.cls + '"' : '') + '>' +
      '<rect width="' + n + '" height="' + n + '" fill="' + bg + '"/><path d="' + d + '" fill="' + fg + '"/></svg>';
  }

  // 캔버스에 정수 픽셀 단위로 그리기 (라벨 프린터용 PNG)
  function drawToCanvas(ctx, qr, x0, y0, moduleSize, fg) {
    ctx.fillStyle = fg || '#000';
    for (var y = 0; y < qr.size; y++) for (var x = 0; x < qr.size; x++) {
      if (qr.modules[y][x]) ctx.fillRect(x0 + x * moduleSize, y0 + y * moduleSize, moduleSize, moduleSize);
    }
  }

  BF.QR = { encode: encode, toSVG: toSVG, drawToCanvas: drawToCanvas };
})(BF);
