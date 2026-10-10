/* 베이비 팩토리 — 공용 유틸리티 (난수, 금액 표기, 조사, 저장소, 인코딩) */
'use strict';
var BF = window.BF || (window.BF = {});

(function (BF) {
  // ---------- 결정적 난수 (같은 시드 → 같은 결과: QR 결과 페이지에서 똑같이 재현하기 위해) ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rng(seed, salt) { return mulberry32((seed ^ Math.imul(salt + 1, 0x9E3779B1)) >>> 0); }
  function normal(r) {
    var u = 1 - r(), v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function pick(r, arr) { return arr[Math.floor(r() * arr.length) % arr.length]; }
  function weighted(r, items, weightOf) {
    var total = 0, i;
    for (i = 0; i < items.length; i++) total += weightOf(items[i]);
    var x = r() * total;
    for (i = 0; i < items.length; i++) { x -= weightOf(items[i]); if (x <= 0) return items[i]; }
    return items[items.length - 1];
  }
  function newSeed() {
    var a = new Uint32Array(1);
    try { (window.crypto || window.msCrypto).getRandomValues(a); } catch (e) { a[0] = Math.floor(Math.random() * 4294967295); }
    return a[0] & 0xFFFFFF; // 24비트
  }

  // ---------- 수학 ----------
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function interp(table, x) {
    if (x <= table[0][0]) return table[0][1];
    for (var i = 1; i < table.length; i++) {
      if (x <= table[i][0]) {
        var a = table[i - 1], b = table[i];
        return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
      }
    }
    return table[table.length - 1][1];
  }
  function hex2rgb(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mix(c1, c2, t) {
    var a = hex2rgb(c1), b = hex2rgb(c2);
    var r = [0, 1, 2].map(function (i) { return Math.round(lerp(a[i], b[i], clamp(t, 0, 1))); });
    return '#' + r.map(function (v) { return (v < 16 ? '0' : '') + v.toString(16); }).join('');
  }

  // ---------- 금액 (단위: 만원) ----------
  function comma(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function money(man) {
    man = Math.round(man);
    if (man === 0) return '0원';
    var neg = man < 0; man = Math.abs(man);
    var eok = Math.floor(man / 10000), rest = man % 10000, s = '';
    if (eok) s += comma(eok) + '억';
    if (rest) s += (s ? ' ' : '') + comma(rest) + '만';
    return (neg ? '-' : '') + s + '원';
  }
  function moneyShort(man) { // 가격표용: 1,500만 / 1억 / 1억 5천
    if (man === 0) return '무료';
    var eok = Math.floor(man / 10000), rest = man % 10000;
    if (!eok) return comma(rest) + '만';
    if (!rest) return eok + '억';
    if (rest % 1000 === 0) return eok + '억 ' + (rest / 1000) + '천';
    return eok + '억 ' + comma(rest) + '만';
  }

  // ---------- 한국어 조사 ----------
  function lastCode(w) { w = String(w); return w.charCodeAt(w.length - 1); }
  function hasBatchim(w) { var c = lastCode(w); if (c < 0xAC00 || c > 0xD7A3) return false; return (c - 0xAC00) % 28 !== 0; }
  function josa(w, withB, withoutB) { return w + (hasBatchim(w) ? withB : withoutB); }
  // 이야기체 이름: 민준 → 민준이, 지우 → 지우
  function callName(w) { return hasBatchim(w) ? w + '이' : w; }

  // ---------- 문자열 ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function utf8Encode(str) {
    if (window.TextEncoder) return Array.prototype.slice.call(new TextEncoder().encode(str));
    var s = unescape(encodeURIComponent(str)), out = [];
    for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
    return out;
  }
  function utf8Decode(bytes) {
    if (window.TextDecoder) return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
    var s = ''; for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    try { return decodeURIComponent(escape(s)); } catch (e) { return ''; }
  }
  function b64url(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function unb64url(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    var bin = atob(str), out = [];
    for (var i = 0; i < bin.length; i++) out.push(bin.charCodeAt(i));
    return out;
  }

  // ---------- 저장소 (실패해도 동작하도록) ----------
  var store = {
    get: function (k, d) {
      try { var v = window.localStorage.getItem('bf.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set: function (k, v) {
      try { window.localStorage.setItem('bf.' + k, JSON.stringify(v)); } catch (e) { /* 저장 불가 환경 */ }
    }
  };

  // ---------- 날짜 ----------
  var EPOCH = Date.UTC(2026, 0, 1);
  function todayIndex() {
    var d = new Date();
    return Math.max(0, Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / 86400000));
  }
  function dayToDate(i) { return new Date(EPOCH + i * 86400000); }
  function fmtDate(d) {
    return d.getUTCFullYear() + '.' + String(d.getUTCMonth() + 1).padStart(2, '0') + '.' + String(d.getUTCDate()).padStart(2, '0');
  }

  BF.util = {
    rng: rng, normal: normal, pick: pick, weighted: weighted, newSeed: newSeed,
    clamp: clamp, lerp: lerp, smooth: smooth, interp: interp, mix: mix,
    comma: comma, money: money, moneyShort: moneyShort,
    hasBatchim: hasBatchim, josa: josa, callName: callName,
    esc: esc, utf8Encode: utf8Encode, utf8Decode: utf8Decode, b64url: b64url, unb64url: unb64url,
    store: store, todayIndex: todayIndex, dayToDate: dayToDate, fmtDate: fmtDate
  };
})(BF);
