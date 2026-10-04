/* ===========================================================
   Section Introducing: peta ekosistem bergulir.
   - kemajuan gulir 0 sampai 1 (dihaluskan) menyambungkan simpul satu per satu:
     garis tergambar dari kartu Anda, lalu simpulnya muncul
   - tiap koneksi mengisi meteran dan menaikkan tahap: Idea, Learn, Connect,
     Build, Fund (jalur dari Pitch Deck)
   - garis yang sudah tersambung dialiri titik cahaya menuju kartu Anda
   - klik simpul: kartu penjelasan lengkap
   Tidak memakai WebGL; hanya SVG, CSS, dan sedikit JS.
   =========================================================== */
(function () {
  var root = document.getElementById('eco4');
  if (!root) return;
  var scene = root.querySelector('.eco4-scene');
  var you = document.getElementById('e5You');
  var svg = document.getElementById('e5Beams');
  var det = document.getElementById('ecoDetail');
  var nodes = Array.prototype.slice.call(root.querySelectorAll('.e5-n'));
  var meter = Array.prototype.slice.call(root.querySelectorAll('.e5-meter i'));
  var pathSpans = Array.prototype.slice.call(root.querySelectorAll('.e5-path span'));
  var elStage = document.getElementById('e5Stage');
  var elCount = document.getElementById('e5Count');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var N = nodes.length;

  /* sudut tiap simpul (derajat, 0 = kanan, positif ke bawah), urutan muncul selang-seling */
  var SUDUT = [-58, -122, -19, -161, 19, 161, 58, 122];

  function bahasa() { var l = (document.documentElement.lang || 'id').slice(0, 2); return l === 'zh' ? 'zh' : l === 'en' ? 'en' : 'id'; }
  function t(k) {
    var K = window.CATALYST_I18N; if (!K) return '';
    var v = K[bahasa()] && K[bahasa()][k];
    return v != null ? v : (K.id && K.id[k]) || '';
  }

  /* ---------- garis ---------- */
  var beams = [], pulses = [];
  nodes.forEach(function (n, i) {
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('class', 'e5-beam');
    p.setAttribute('id', 'e5p' + i);
    svg.appendChild(p);
    beams.push(p);
    var c = document.createElementNS(NS, 'circle');
    c.setAttribute('class', 'e5-pulse');
    c.setAttribute('r', '2.6');
    var am = document.createElementNS(NS, 'animateMotion');
    am.setAttribute('dur', (2.4 + (i % 3) * 0.35) + 's');
    am.setAttribute('repeatCount', 'indefinite');
    am.setAttribute('begin', (-i * 0.37) + 's');
    am.setAttribute('keyPoints', '1;0');
    am.setAttribute('keyTimes', '0;1');
    am.setAttribute('calcMode', 'linear');
    var mp = document.createElementNS(NS, 'mpath');
    mp.setAttribute('href', '#e5p' + i);
    am.appendChild(mp); c.appendChild(am);
    if (!reduce) svg.appendChild(c);
    pulses.push(c);
  });

  var panjang = [];
  function tataLetak() {
    var W = scene.clientWidth, H = scene.clientHeight;
    var cx = W / 2, cy = H / 2;
    var cw = you.offsetWidth, ch = you.offsetHeight;
    var sempit = W < 700;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var rx = sempit ? 0 : Math.min(W * 0.36, cw / 2 + 300);
    var ry = sempit ? 0 : Math.min(H * 0.4, 280);
    scene.style.setProperty('--r1w', (rx * 2 * 0.86) + 'px');
    scene.style.setProperty('--r1h', (ry * 2 * 0.9) + 'px');
    scene.style.setProperty('--r2w', (rx * 2 * 1.16) + 'px');
    scene.style.setProperty('--r2h', (ry * 2 * 1.22) + 'px');
    if (sempit) {
      scene.style.setProperty('--r1w', (W * 0.8) + 'px'); scene.style.setProperty('--r1h', (H * 0.62) + 'px');
      scene.style.setProperty('--r2w', (W * 1.05) + 'px'); scene.style.setProperty('--r2h', (H * 0.86) + 'px');
    }

    nodes.forEach(function (n, i) {
      var x, y, ax, ex, ey;
      if (!sempit) {
        var a = SUDUT[i] * Math.PI / 180, kanan = Math.cos(a) > 0;
        x = cx + rx * Math.cos(a); y = cy + ry * Math.sin(a);
        ax = kanan ? '0px' : '-100%';
        ex = x; ey = y;
        n.style.setProperty('--dx', (kanan ? -24 : 24) + 'px');
      } else {
        /* layar sempit: dua baris di atas kartu, dua di bawah, kiri dan kanan */
        var kiri = Math.cos(SUDUT[i] * Math.PI / 180) < 0;
        var atas = SUDUT[i] < 0;
        var baris = Math.abs(SUDUT[i]) > 90 ? (Math.abs(SUDUT[i]) > 140 ? 0 : 1) : (Math.abs(SUDUT[i]) < 40 ? 0 : 1);
        var jarak = ch / 2 + 46 + baris * 50;
        x = cx + (kiri ? -1 : 1) * W * 0.235;
        y = cy + (atas ? -1 : 1) * jarak;
        ax = '-50%';
        ex = x; ey = y + (atas ? 14 : -14);
        n.style.setProperty('--dx', '0px');
      }
      n.style.setProperty('--x', x + 'px');
      n.style.setProperty('--y', y + 'px');
      n.style.setProperty('--ax', ax);

      /* titik awal: tepi kartu ke arah simpul */
      var dx = ex - cx, dy = ey - cy;
      var k = Math.min((cw / 2 + 4) / Math.max(Math.abs(dx), 1e-3), (ch / 2 + 4) / Math.max(Math.abs(dy), 1e-3));
      var sx = cx + dx * k, sy = cy + dy * k;
      var d;
      if (!sempit) {
        var mx = sx + (ex - sx) * 0.55;
        d = 'M' + sx.toFixed(1) + ' ' + sy.toFixed(1) + ' C' + mx.toFixed(1) + ' ' + sy.toFixed(1) + ' ' + mx.toFixed(1) + ' ' + ey.toFixed(1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1);
      } else {
        var my = sy + (ey - sy) * 0.5;
        d = 'M' + sx.toFixed(1) + ' ' + sy.toFixed(1) + ' C' + sx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + ex.toFixed(1) + ' ' + my.toFixed(1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1);
      }
      beams[i].setAttribute('d', d);
      panjang[i] = beams[i].getTotalLength();
      beams[i].style.strokeDasharray = panjang[i] + ' ' + panjang[i];
    });
    terapkan(kini);
  }

  /* ---------- kemajuan ---------- */
  var AWAL = 0.08, JEDA = 0.098, DURASI = 0.1;
  var TAHAP = ['e5.s0', 'e5.s1', 'e5.s2', 'e5.s3', 'e5.s4'];
  var tahapLalu = -1;
  function jepit(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function halus(x) { return x * x * (3 - 2 * x); }

  function terapkan(p) {
    root.style.setProperty('--p', p.toFixed(4));
    var tersambung = 0;
    nodes.forEach(function (n, i) {
      var u = jepit((p - (AWAL + i * JEDA)) / DURASI);
      var gambar = halus(jepit(u / 0.6));
      var muncul = halus(jepit((u - 0.45) / 0.55));
      var L = panjang[i] || 0;
      beams[i].style.strokeDashoffset = (L * (1 - gambar)).toFixed(1);
      n.style.setProperty('--t', muncul.toFixed(3));
      var on = u >= 1;
      n.classList.toggle('on', muncul > 0.9);
      beams[i].classList.toggle('on', on);
      pulses[i].classList.toggle('on', on);
      if (on) tersambung++;
    });
    meter.forEach(function (m, i) { m.classList.toggle('on', i < tersambung); });
    var tahap = tersambung === 0 ? 0 : Math.min(4, Math.ceil(tersambung / 2));
    pathSpans.forEach(function (s, i) { s.classList.toggle('on', i < tahap); });
    if (elCount) elCount.textContent = tersambung + ' / ' + N;
    if (tahap !== tahapLalu && elStage) {
      var pertama = tahapLalu < 0;
      tahapLalu = tahap;
      if (pertama || reduce) { elStage.innerHTML = t(TAHAP[tahap]); }
      else {
        elStage.classList.add('ganti');
        clearTimeout(terapkan.tm);
        terapkan.tm = setTimeout(function () { elStage.innerHTML = t(TAHAP[tahapLalu]); elStage.classList.remove('ganti'); }, 180);
      }
    }
  }

  var tujuan = 0, kini = 0, jalan = false;
  function hitungTujuan() {
    var r = root.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    tujuan = total > 0 ? jepit(-r.top / total) : 1;
  }
  function putar() {
    kini += (tujuan - kini) * 0.13;
    if (Math.abs(tujuan - kini) < 0.0004) kini = tujuan;
    terapkan(kini);
    if (kini !== tujuan) requestAnimationFrame(putar); else jalan = false;
  }
  function picu() { hitungTujuan(); if (!jalan) { jalan = true; requestAnimationFrame(putar); } }

  if (reduce) { root.classList.add('diam'); kini = 1; }
  else {
    var dekat = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { dekat = e[0].isIntersecting; if (dekat) picu(); }, { rootMargin: '200px 0px' }).observe(root);
    }
    window.addEventListener('scroll', function () { if (dekat) picu(); }, { passive: true });
    hitungTujuan(); kini = tujuan;
  }
  tataLetak();
  if ('ResizeObserver' in window) new ResizeObserver(tataLetak).observe(scene);
  else window.addEventListener('resize', tataLetak);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(tataLetak);
  document.addEventListener('bahasa-berubah', function () { tahapLalu = -1; terapkan(kini); tataLetak(); if (buka) isi(buka); });

  /* ---------- kartu detail ---------- */
  var ITEM = { mentors: 'eco.mentor', career: 'eco.career', community: 'eco.comm', business: 'eco.biz',
    capital: 'eco.cap', networks: 'eco.net', partners: 'eco.par', opportunity: 'eco.opp' };
  var buka = null, pemicu = null;
  function isi(nama) {
    var u = ITEM[nama], i = nodes.findIndex(function (b) { return b.dataset.n === nama; });
    det.querySelector('.ed-no').textContent = '0' + (i + 1) + ' / 0' + N;
    det.querySelector('.ed-judul').textContent = nodes[i].querySelector('.e5-l').textContent;
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
  nodes.forEach(function (b) {
    b.addEventListener('click', function () { if (b.classList.contains('on')) bukaDetail(b.dataset.n, b); });
  });
  if (det) det.querySelector('.ed-tutup').addEventListener('click', tutupDetail);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') tutupDetail(); });
})();
