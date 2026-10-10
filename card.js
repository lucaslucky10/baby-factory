/* 베이비 팩토리 — 결과 카드(PNG), 라벨 이미지(PNG), 라벨 인쇄(HTML) */
'use strict';
var BF = window.BF || (window.BF = {});

(function (BF) {
  var U = BF.util, INK = '#1E2A47';
  var FD = "'Bagel Fat One', 'Malgun Gothic', sans-serif", FU = "'IBM Plex Sans KR', 'Malgun Gothic', sans-serif", FM = "'Nanum Gothic Coding', Consolas, monospace";

  function loadFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var list = ['40px "Bagel Fat One"', '700 30px "IBM Plex Sans KR"', '500 30px "IBM Plex Sans KR"', '700 30px "Nanum Gothic Coding"'];
    return Promise.all(list.map(function (f) { return document.fonts.load(f, '베이비팩토리0123').catch(function () { }); })).then(function () { });
  }
  function svgImage(svg) {
    return new Promise(function (res, rej) {
      var img = new Image();
      img.onload = function () { res(img); };
      img.onerror = rej;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  function wrap(ctx, text, maxW) {
    var lines = [], cur = '';
    // 한국어는 글자 단위로, 공백이 있으면 공백에서 우선 끊기
    var tokens = String(text).split(/(\s+)/);
    tokens.forEach(function (tk) {
      if (ctx.measureText(cur + tk).width <= maxW) { cur += tk; return; }
      if (cur.trim()) { lines.push(cur.trim()); cur = ''; }
      if (ctx.measureText(tk).width <= maxW) { cur = tk.trim() ? tk : ''; return; }
      for (var i = 0; i < tk.length; i++) {
        if (ctx.measureText(cur + tk[i]).width > maxW) { lines.push(cur); cur = ''; }
        cur += tk[i];
      }
    });
    if (cur.trim()) lines.push(cur.trim());
    return lines;
  }

  var FILM_AGES = function (o) { return [0, 6, 15, 27, 50, o.endAge]; };
  function filmCaption(o, age) {
    if (age === 0) return '탄생';
    if (age === 27) return BF.CAREERS[o.career].name;
    return BF.sim.stageName(age);
  }

  // ---------- 결과 카드 1080×1600 ----------
  function resultCard(b, url) {
    var o = b.o, rec = b.rec, W = 1080, H = 1600;
    var ages = FILM_AGES(o);
    return loadFonts().then(function () {
      return Promise.all(ages.map(function (a) {
        return svgImage(BF.Person.standalone(o, a, { w: 300, h: 260, minCm: 120, bg: '#D9EEFB', px: 2.4, mood: 'happy' }));
      }));
    }).then(function (imgs) {
      var c = document.createElement('canvas'); c.width = W; c.height = H;
      var ctx = c.getContext('2d');
      ctx.fillStyle = '#CDEBDD'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(30,42,71,0.07)'; ctx.lineWidth = 2;
      for (var x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (var y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      // 머리띠
      ctx.fillStyle = INK; ctx.fillRect(0, 0, W, 110);
      ctx.fillStyle = '#FFD23F'; ctx.font = '44px ' + FD; ctx.textBaseline = 'middle';
      ctx.fillText('베이비 팩토리', 50, 58);
      ctx.font = '700 24px ' + FM; ctx.textAlign = 'right'; ctx.fillStyle = '#FFFDF5';
      ctx.fillText('No.' + String(rec.order).padStart(4, '0') + '  ' + U.fmtDate(U.dayToDate(rec.day)), W - 50, 58);
      ctx.textAlign = 'left';
      // 제목
      ctx.fillStyle = INK; ctx.font = '96px ' + FD; ctx.textBaseline = 'alphabetic';
      ctx.fillText(rec.name + '의 일생', 50, 232);
      ctx.font = '700 32px ' + FU;
      ctx.fillText(BF.CAREERS[o.career].name + ' · 키 ' + Math.round(o.height) + 'cm · 기대 수명 ' + o.lifespan + '세', 54, 290);
      // 필름
      ctx.fillStyle = INK; rr(ctx, 40, 330, W - 80, 720, 28); ctx.fill();
      ctx.fillStyle = '#FFFDF5';
      for (var hx = 70; hx < W - 50; hx += 40) { ctx.beginPath(); ctx.arc(hx, 352, 7, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(hx, 1028, 7, 0, 7); ctx.fill(); }
      imgs.forEach(function (img, i) {
        var col = i % 3, row = Math.floor(i / 3);
        var fx = 74 + col * 316, fy = 380 + row * 330;
        ctx.fillStyle = '#FFFDF5'; rr(ctx, fx, fy, 300, 312, 14); ctx.fill();
        ctx.drawImage(img, fx + 10, fy + 10, 280, 243);
        ctx.fillStyle = INK; ctx.font = '34px ' + FD; ctx.fillText(ages[i] + '세', fx + 16, fy + 296);
        ctx.font = '500 22px ' + FU; ctx.textAlign = 'right';
        ctx.fillText(filmCaption(o, ages[i]), fx + 286, fy + 294); ctx.textAlign = 'left';
      });
      // 주문서
      ctx.fillStyle = '#FFFDF5'; ctx.strokeStyle = INK; ctx.lineWidth = 5; rr(ctx, 40, 1080, W - 80, 330, 24); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.font = '700 30px ' + FU; ctx.fillText('주문서', 74, 1130);
      ctx.font = '700 26px ' + FM; ctx.textAlign = 'right';
      ctx.fillText('예산 ' + U.money(rec.budget) + ' · 사용 ' + U.money(b.spent), W - 74, 1130); ctx.textAlign = 'left';
      var items = b.items.slice(0, 10);
      ctx.font = '500 24px ' + FU;
      if (!items.length) ctx.fillText('아무것도 사지 않았어요. 전부 자연에 맡겼어요.', 74, 1186);
      items.forEach(function (it, i) {
        var col = i % 2, row = Math.floor(i / 2), ix = 74 + col * 480, iy = 1186 + row * 44;
        var t = it.kind === 'edit' ? it.name : it.name + ' · ' + it.opt;
        ctx.fillStyle = INK; ctx.font = '500 24px ' + FU;
        var lab = t; while (ctx.measureText(lab).width > 300 && lab.length > 2) lab = lab.slice(0, -2) + '…';
        ctx.fillText(lab, ix, iy);
        ctx.font = '700 23px ' + FM; ctx.textAlign = 'right'; ctx.fillStyle = '#E8456B';
        ctx.fillText(U.moneyShort(it.price), ix + 440, iy); ctx.textAlign = 'left';
      });
      if (b.items.length > 10) { ctx.fillStyle = INK; ctx.font = '500 22px ' + FU; ctx.fillText('외 ' + (b.items.length - 10) + '개', 74, 1400); }
      // 질문
      ctx.fillStyle = INK; ctx.font = '700 30px ' + FU;
      var lines = wrap(ctx, BF.EVENT.question, W - 120);
      lines.slice(0, 3).forEach(function (ln, i) { ctx.fillText(ln, 60, 1468 + i * 42); });
      ctx.font = '500 20px ' + FU; ctx.fillStyle = '#47557A';
      ctx.fillText(BF.EVENT.club + ' · ' + BF.EVENT.event + ' · 『' + BF.EVENT.bookShort + '』 ' + BF.EVENT.author, 60, H - 24);
      return c;
    });
  }

  // ---------- 라벨 ----------
  function labelSize(key) { var p = String(key || '50x30').split('x'); return { w: +p[0] || 50, h: +p[1] || 30 }; }
  function labelCanvas(b, url, key) {
    var sz = labelSize(key), PX = 16; // 16px/mm ≈ 406dpi
    var W = sz.w * PX, H = sz.h * PX, m = 1.6 * PX;
    var qr = BF.QR.encode(url, 'M');
    return loadFonts().then(function () {
      var c = document.createElement('canvas'); c.width = W; c.height = H;
      var ctx = c.getContext('2d');
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = false;
      var quiet = 2, square = sz.w >= sz.h * 1.4;
      var avail = square ? H - m * 2 : Math.min(W - m * 2, H * 0.7);
      var ms = Math.floor(avail / (qr.size + quiet * 2));
      var qpx = ms * (qr.size + quiet * 2);
      var qx = square ? m : (W - qpx) / 2, qy = square ? (H - qpx) / 2 : m * 0.6;
      BF.QR.drawToCanvas(ctx, qr, Math.round(qx + quiet * ms), Math.round(qy + quiet * ms), ms, '#000');
      ctx.fillStyle = '#000'; ctx.textBaseline = 'alphabetic';
      var no = 'No.' + String(b.rec.order).padStart(4, '0');
      if (square) {
        var tx = qx + qpx + PX * 0.8, tw = W - tx - m * 0.6;
        var lines = [
          { t: '베이비 팩토리', f: FD, s: H * 0.13 },
          { t: b.rec.name + '의 일생', s: H * 0.12, ui: true },
          { t: no, f: FM, s: H * 0.1, w: 700 },
          { t: 'QR을 찍어 보세요', f: FU, s: H * 0.085, w: 500 }
        ];
        if (sz.w < 40) lines = [lines[0], lines[2]];
        var total = lines.reduce(function (s, l) { return s + l.s * 1.35; }, 0);
        var y = (H - total) / 2 + lines[0].s;
        lines.forEach(function (l) {
          var size = l.s;
          var font = function () { return l.ui ? '700 ' + size + 'px ' + FU : (l.w ? l.w + ' ' : '') + size + 'px ' + l.f; };
          ctx.font = font();
          while (ctx.measureText(l.t).width > tw && size > 8) { size -= 1; ctx.font = font(); }
          ctx.fillText(l.t, tx, y);
          y += l.s * 1.35;
        });
      } else {
        ctx.textAlign = 'center';
        var y2 = qy + qpx + H * 0.1;
        ctx.font = (H * 0.075) + 'px ' + FD; ctx.fillText('베이비 팩토리', W / 2, y2);
        ctx.font = '700 ' + (H * 0.065) + 'px ' + FU; ctx.fillText(b.rec.name + '의 일생 · ' + no, W / 2, y2 + H * 0.09);
      }
      return c;
    });
  }
  // 브라우저 인쇄용 라벨 HTML (mm 단위, QR은 벡터)
  function labelHTML(b, url, key) {
    var sz = labelSize(key), qr = BF.QR.encode(url, 'M');
    var square = sz.w >= sz.h * 1.4;
    var q = square ? sz.h - 2.4 : Math.min(sz.w - 3, sz.h * 0.68);
    var svg = BF.QR.toSVG(qr, { border: 2 }).replace('<svg ', '<svg style="width:' + q + 'mm;height:' + q + 'mm" ');
    var no = 'No.' + String(b.rec.order).padStart(4, '0');
    var page = '@page { size: ' + sz.w + 'mm ' + sz.h + 'mm; margin: 0; } .label { width: ' + sz.w + 'mm; height: ' + sz.h + 'mm; padding: 1.2mm; ' + (square ? '' : 'flex-direction: column; justify-content: center; text-align: center;') + ' }';
    var fs = sz.h * 0.11;
    var text = square
      ? '<div class="l-text"><div style="font-family:' + FD + ';font-size:' + (fs * 1.15).toFixed(2) + 'mm">베이비 팩토리</div>' +
        (sz.w >= 40 ? '<div class="l-title" style="font-size:' + fs.toFixed(2) + 'mm">' + U.esc(b.rec.name) + '의 일생</div>' : '') +
        '<div style="font-family:' + FM + ';font-weight:700;font-size:' + (fs * 0.85).toFixed(2) + 'mm">' + no + '</div>' +
        (sz.w >= 40 ? '<div style="font-size:' + (fs * 0.72).toFixed(2) + 'mm">QR을 찍어 보세요</div>' : '') + '</div>'
      : '<div class="l-text"><div style="font-family:' + FD + ';font-size:' + (sz.h * 0.07).toFixed(2) + 'mm">베이비 팩토리</div><div class="l-title" style="font-size:' + (sz.h * 0.06).toFixed(2) + 'mm">' + U.esc(b.rec.name) + '의 일생 · ' + no + '</div></div>';
    return { css: page, html: '<div class="label">' + svg + text + '</div>' };
  }

  function download(canvas, filename) {
    return new Promise(function (res) {
      function go(href, revoke) {
        var a = document.createElement('a');
        a.href = href; a.download = filename;
        document.body.appendChild(a); a.click(); a.remove();
        if (revoke) setTimeout(function () { URL.revokeObjectURL(href); }, 4000);
        res();
      }
      if (canvas.toBlob) canvas.toBlob(function (blob) { if (blob) go(URL.createObjectURL(blob), true); else go(canvas.toDataURL('image/png')); }, 'image/png');
      else go(canvas.toDataURL('image/png'));
    });
  }

  BF.Card = { resultCard: resultCard, labelCanvas: labelCanvas, labelHTML: labelHTML, download: download, svgImage: svgImage, FILM_AGES: FILM_AGES, filmCaption: filmCaption, loadFonts: loadFonts };
})(BF);
