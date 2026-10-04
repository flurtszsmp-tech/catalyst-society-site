/* ===========================================================
   Section Introducing: animasi gulir.
   - panggung menempel; kemajuan gulir (0 sampai 1) memuncul bubble satu per satu,
     menumbuhkan rumput, dan mengembangkan bunga di taman
   - kemajuan dihaluskan (mengejar target dengan peredaman), jadi gulir kasar
     tetap terasa mulus
   - klik bubble: kartu penjelasan lengkap, panggung bergeser ke kiri
   - tanpa gerak: keadaan akhir langsung tampil, tanpa menempel
   Tidak memakai WebGL; hanya SVG dan variabel CSS.
   =========================================================== */
(function () {
  var root = document.getElementById('eco4');
  if (!root) return;
  var taman = document.getElementById('e4Taman');
  var det = document.getElementById('ecoDetail');
  var bubbles = Array.prototype.slice.call(root.querySelectorAll('.e4-b'));
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- taman kecil berwarna ---------- */
  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  var flowers = [], trees = [];
  (function bangunTaman() {
    if (!taman) return;
    var R = rng(7);
    var defs = el('defs', {}, taman);
    var g1 = el('radialGradient', { id: 'e4g', cx: '.5', cy: '.42', r: '.65' }, defs);
    [['0', '#b4e692'], ['.55', '#6cc067'], ['1', '#3f9b45']].forEach(function (s) { el('stop', { offset: s[0], 'stop-color': s[1] }, g1); });
    var g2 = el('linearGradient', { id: 'e4t', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    [['0', '#8a6644'], ['1', '#5f4228']].forEach(function (s) { el('stop', { offset: s[0], 'stop-color': s[1] }, g2); });

    /* bayangan tanah, tepi tanah, permukaan rumput */
    el('ellipse', { cx: 320, cy: 150, rx: 300, ry: 38, fill: 'rgba(0,0,0,.14)' }, taman);
    el('path', { d: 'M20 118 L20 136 A300 62 0 0 0 620 136 L620 118 Z', fill: 'url(#e4t)' }, taman);
    el('ellipse', { cx: 320, cy: 118, rx: 300, ry: 62, fill: 'url(#e4g)' }, taman);
    [[250, 51], [175, 36]].forEach(function (c) {
      el('ellipse', { cx: 320, cy: 118, rx: c[0], ry: c[1], fill: 'none', stroke: 'rgba(255,255,255,.14)', 'stroke-width': 1.2 }, taman);
    });

    /* pohon kecil dan semak di belakang */
    function pohon(x, y, s) {
      var g = el('g', { class: 'tm' }, taman);
      el('rect', { x: x - 4 * s, y: y - 30 * s, width: 8 * s, height: 30 * s, rx: 3 * s, fill: '#7a5636' }, g);
      el('circle', { cx: x, cy: y - 46 * s, r: 24 * s, fill: '#3f9b45' }, g);
      el('circle', { cx: x - 16 * s, cy: y - 36 * s, r: 16 * s, fill: '#4fb056' }, g);
      el('circle', { cx: x + 17 * s, cy: y - 38 * s, r: 15 * s, fill: '#34873b' }, g);
      el('circle', { cx: x - 5 * s, cy: y - 55 * s, r: 9 * s, fill: '#6bc468', opacity: .75 }, g);
      trees.push(g);
    }
    function semak(x, y, s) {
      var g = el('g', { class: 'tm' }, taman);
      el('circle', { cx: x, cy: y - 8 * s, r: 12 * s, fill: '#3f9b45' }, g);
      el('circle', { cx: x + 12 * s, cy: y - 5 * s, r: 9 * s, fill: '#4fb056' }, g);
      el('circle', { cx: x - 12 * s, cy: y - 4 * s, r: 9 * s, fill: '#34873b' }, g);
      trees.push(g);
    }
    pohon(118, 108, 1); semak(520, 104, 1); semak(165, 96, .8); pohon(498, 96, .7);

    /* batu */
    [[212, 142, 11, 5], [440, 146, 9, 4], [88, 128, 8, 3.5]].forEach(function (b) {
      el('ellipse', { cx: b[0], cy: b[1], rx: b[2], ry: b[3], fill: '#c4c7cf' }, taman);
      el('ellipse', { cx: b[0] - b[2] * .25, cy: b[1] - b[3] * .3, rx: b[2] * .5, ry: b[3] * .4, fill: 'rgba(255,255,255,.5)' }, taman);
    });

    /* rumput: ratusan helai, tumbuh dari bawah */
    var tinggal = [], i, a, r, x, y;
    for (i = 0; i < 260; i++) {
      a = R() * 6.2832; r = Math.sqrt(R());
      x = 320 + Math.cos(a) * 285 * r; y = 118 + Math.sin(a) * 56 * r;
      tinggal.push({ t: 'g', x: x, y: y });
    }
    var COLORS = ['#ff6b9a', '#ffd23f', '#ffffff', '#ff8a3d', '#b57bff', '#ff5a5a', '#7cc7ff'];
    for (i = 0; i < 20; i++) {
      do { a = R() * 6.2832; r = Math.sqrt(R()); x = 320 + Math.cos(a) * 270 * r; y = 118 + Math.sin(a) * 50 * r; }
      while (Math.abs(x - 320) < 52 && y < 134);
      tinggal.push({ t: 'f', x: x, y: y, c: COLORS[i % COLORS.length] });
    }
    tinggal.sort(function (p, q) { return p.y - q.y; });
    tinggal.forEach(function (o) {
      if (o.t === 'g') {
        var h = 9 + R() * 12, dx = (R() - .5) * 9;
        el('path', { class: 'bl', d: 'M' + o.x + ' ' + o.y + ' Q' + (o.x + dx * .4) + ' ' + (o.y - h * .6) + ' ' + (o.x + dx) + ' ' + (o.y - h),
          fill: 'none', stroke: ['#3d8f44', '#58b85d', '#2f7a3a', '#6cc96a'][(R() * 4) | 0], 'stroke-width': 1.7, 'stroke-linecap': 'round' }, taman);
      } else {
        var s = .85 + R() * .5, sh = 22 + R() * 14, sw = (R() - .5) * 6;
        var g = el('g', { class: 'fl' }, taman);
        el('path', { d: 'M' + o.x + ' ' + o.y + ' Q' + (o.x + sw * .3) + ' ' + (o.y - sh * .5) + ' ' + (o.x + sw) + ' ' + (o.y - sh), fill: 'none', stroke: '#3d8f44', 'stroke-width': 1.7, 'stroke-linecap': 'round' }, g);
        el('ellipse', { cx: o.x + sw * .5 - 4, cy: o.y - sh * .45, rx: 4.5, ry: 2, fill: '#4fb056', transform: 'rotate(-30 ' + (o.x + sw * .5 - 4) + ' ' + (o.y - sh * .45) + ')' }, g);
        var hx = o.x + sw, hy = o.y - sh;
        for (var p = 0; p < 5; p++) {
          var pa = p / 5 * 6.2832 - 1.57;
          el('circle', { cx: hx + Math.cos(pa) * 5.4 * s, cy: hy + Math.sin(pa) * 5.4 * s, r: 4.6 * s, fill: o.c, stroke: 'rgba(0,0,0,.08)', 'stroke-width': .6 }, g);
        }
        el('circle', { cx: hx, cy: hy, r: 3.3 * s, fill: o.c === '#ffd23f' ? '#f08c1d' : '#ffd23f' }, g);
        flowers.push(g);
      }
    });
  })();

  /* ---------- kemajuan gulir ---------- */
  var BUBBLE_AWAL = .12, BUBBLE_JEDA = .085, BUBBLE_DURASI = .09;
  function jepit(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function melambung(t) { var c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

  function terapkan(p) {
    root.style.setProperty('--p', p.toFixed(4));
    bubbles.forEach(function (b, i) {
      var t = jepit((p - (BUBBLE_AWAL + i * BUBBLE_JEDA)) / BUBBLE_DURASI);
      var e = t < 1 ? melambung(t) : 1;
      b.style.setProperty('--t', Math.max(0, Math.min(1, t)).toFixed(3));
      b.style.setProperty('--e', e.toFixed(3));
      b.classList.toggle('on', t > .85);
    });
    flowers.forEach(function (f, i) {
      var a = .06 + i * (.78 / flowers.length);
      f.style.setProperty('--f', (function (t) { return t < 1 ? melambung(t) : 1; })(jepit((p - a) / .12)).toFixed(3));
    });
    var tm = jepit(p / .3);
    trees.forEach(function (g) { g.style.setProperty('--tm', tm.toFixed(3)); });
  }

  var tujuan = 0, kini = 0, jalan = false;
  function hitungTujuan() {
    var r = root.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    tujuan = total > 0 ? jepit(-r.top / total) : 1;
  }
  function putar() {
    kini += (tujuan - kini) * 0.14;
    if (Math.abs(tujuan - kini) < 0.0004) kini = tujuan;
    terapkan(kini);
    if (kini !== tujuan) requestAnimationFrame(putar); else jalan = false;
  }
  function picu() {
    hitungTujuan();
    if (!jalan) { jalan = true; requestAnimationFrame(putar); }
  }

  if (reduce) {
    root.classList.add('diam');
    terapkan(1);
  } else {
    var dekat = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { dekat = e[0].isIntersecting; if (dekat) picu(); }, { rootMargin: '200px 0px' }).observe(root);
    }
    window.addEventListener('scroll', function () { if (dekat) picu(); }, { passive: true });
    window.addEventListener('resize', picu);
    hitungTujuan(); kini = tujuan; terapkan(kini);
  }

  /* ---------- kartu detail ---------- */
  var ITEM = {
    mentors: 'eco.mentor', career: 'eco.career', community: 'eco.comm', business: 'eco.biz',
    capital: 'eco.cap', networks: 'eco.net', partners: 'eco.par', opportunity: 'eco.opp'
  };
  var JUDUL = { mentors: 'Mentors', career: 'Career', community: 'Community', business: 'Business', capital: 'Capital', networks: 'Networks', partners: 'Partners', opportunity: 'Opportunity' };
  function bahasa() { var l = (document.documentElement.lang || 'id').slice(0, 2); return l === 'zh' ? 'zh' : l === 'en' ? 'en' : 'id'; }
  function t(k) {
    var K = window.CATALYST_I18N; if (!K) return '';
    var v = K[bahasa()] && K[bahasa()][k];
    return v != null ? v : (K.id && K.id[k]) || '';
  }
  var buka = null, pemicu = null;
  function isi(nama) {
    var u = ITEM[nama], i = bubbles.findIndex(function (b) { return b.dataset.n === nama; });
    det.querySelector('.ed-no').textContent = '0' + (i + 1) + ' / 0' + bubbles.length;
    det.querySelector('.ed-judul').textContent = JUDUL[nama];
    det.querySelector('.ed-lead').innerHTML = t(u + '.p');
    det.querySelector('.ed-list').innerHTML = [1, 2, 3].map(function (n) { return '<li>' + t(u + '.' + n) + '</li>'; }).join('');
  }
  function bukaDetail(nama, tombol) {
    if (!det) return;
    var baru = !buka;
    buka = nama; isi(nama);
    if (baru) {
      pemicu = tombol;
      det.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { det.classList.add('on'); }); });
      root.classList.add('buka');
      setTimeout(function () { var c = det.querySelector('.ed-tutup'); if (c) c.focus({ preventScroll: true }); }, 60);
    }
  }
  function tutupDetail() {
    if (!buka) return;
    buka = null;
    det.classList.remove('on'); root.classList.remove('buka');
    setTimeout(function () { if (!buka) det.hidden = true; }, 450);
    if (pemicu && pemicu.focus) { try { pemicu.focus({ preventScroll: true }); } catch (e) {} }
  }
  bubbles.forEach(function (b) {
    b.addEventListener('click', function () { if (b.classList.contains('on')) bukaDetail(b.dataset.n, b); });
  });
  if (det) det.querySelector('.ed-tutup').addEventListener('click', tutupDetail);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') tutupDetail(); });
  document.addEventListener('bahasa-berubah', function () { if (buka) isi(buka); });
})();
