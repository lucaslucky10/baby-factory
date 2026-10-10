/* 베이비 팩토리 — 효과음 (파일 없이 Web Audio로 합성) */
'use strict';
var BF = window.BF || (window.BF = {});

(function (BF) {
  var ctx = null, master = null;
  var on = true;
  function ac() {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, vol, when, slideTo) {
    var c = ac(); if (!c || !on) return;
    var t = c.currentTime + (when || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, when, hp) {
    var c = ac(); if (!c || !on) return;
    var t = c.currentTime + (when || 0);
    var len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = c.createBufferSource(); src.buffer = buf;
    var flt = c.createBiquadFilter(); flt.type = 'highpass'; flt.frequency.value = hp || 2000;
    var g = c.createGain(); g.gain.value = vol || 0.2;
    src.connect(flt); flt.connect(g); g.connect(master);
    src.start(t);
  }
  var S = {
    setOn: function (v) { on = !!v; },
    isOn: function () { return on; },
    unlock: function () { ac(); },
    click: function () { tone(660, 0.05, 'square', 0.12); },
    tab: function () { tone(520, 0.06, 'triangle', 0.2); tone(780, 0.06, 'triangle', 0.15, 0.05); },
    buy: function () { tone(1318, 0.08, 'square', 0.15); tone(1760, 0.18, 'square', 0.15, 0.07); noise(0.12, 0.12, 0.02, 5000); },
    refund: function () { tone(880, 0.08, 'triangle', 0.18); tone(587, 0.12, 'triangle', 0.15, 0.07); },
    deny: function () { tone(140, 0.22, 'sawtooth', 0.22); tone(110, 0.22, 'sawtooth', 0.18, 0.12); },
    tick: function (hi) { tone(hi ? 1200 : 900, 0.04, 'square', 0.14); },
    warn: function () { tone(880, 0.12, 'square', 0.2); tone(880, 0.12, 'square', 0.2, 0.18); },
    alarm: function () { for (var i = 0; i < 4; i++) { tone(988, 0.12, 'square', 0.22, i * 0.22); tone(740, 0.12, 'square', 0.22, i * 0.22 + 0.11); } },
    scan: function () { tone(300, 0.08, 'sine', 0.12, 0, 900); },
    found: function () { tone(220, 0.18, 'square', 0.2); tone(196, 0.25, 'square', 0.2, 0.12); },
    clear: function () { tone(1046, 0.06, 'triangle', 0.15); },
    pop: function () { tone(420, 0.1, 'sine', 0.3, 0, 900); },
    soft: function () { tone(523, 0.25, 'sine', 0.18); tone(659, 0.35, 'sine', 0.14, 0.12); },
    success: function () { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.16, 'triangle', 0.22, i * 0.09); }); },
    fail: function () { [392, 330, 262].forEach(function (f, i) { tone(f, 0.2, 'triangle', 0.22, i * 0.13); }); },
    fanfare: function () { [392, 523, 659, 784, 659, 784, 1046].forEach(function (f, i) { tone(f, i === 6 ? 0.5 : 0.14, 'square', 0.16, i * 0.12); }); },
    print: function () { for (var i = 0; i < 10; i++) noise(0.05, 0.08, i * 0.07, 3000); },
    spinTick: function () { tone(1500, 0.02, 'square', 0.1); }
  };
  BF.Sound = S;
})(BF);
