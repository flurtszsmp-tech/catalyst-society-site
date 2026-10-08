/* ===========================================================
   Section Introducing: patung dada "Anda" berbahan krom kaca hitam
   di dalam lab teknologi yang diburamkan, dengan label garis penunjuk
   yang muncul satu per satu saat digulir.

   - sosok: model manusia laki-laki Universal Base Characters (Quaternius, CC0),
     assets/model/sosok.glb, dibingkai dari kepala sampai pinggang dan memudar
     di bawah. Krom hitam di tema terang, krom perak di tema gelap.
   - gerak halus: napas, ayunan badan pelan, kepala menoleh ke bubble terbaru
     atau ke kursor; saat digulir badan berputar dari tiga perempat ke depan
   - ruang: lab gelap (terang di tema terang) dengan lampu garis di dinding
     dan langit, lantai mengkilap berkisi. Digambar sekali ke kanvas kecil
     lalu diburamkan CSS, jadi tidak membebani tiap bingkai.
   - label: titik menyala di tubuh, garis tertarik ke samping, lalu nama
     tersingkap. Titik ikut tulang, jadi ikut napas dan putaran badan.
     Klik label: kartu penjelasan lengkap.
   Model dan GLTFLoader baru dimuat saat section mendekati layar.
   =========================================================== */
(function () {
  var root = document.getElementById('eco4');
  if (!root) return;
  var host = document.getElementById('e5Fig');
  var label = document.getElementById('e5Anda');
  var det = document.getElementById('ecoDetail');
  var bubbles = Array.prototype.slice.call(root.querySelectorAll('.e7-l'));
  var svgGaris = document.getElementById('e7Garis');
  var kanvasRuang = document.getElementById('e7Ruang');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  var N = bubbles.length;

  function bahasa() { var l = (document.documentElement.lang || 'id').slice(0, 2); return l === 'zh' ? 'zh' : l === 'en' ? 'en' : 'id'; }
  function t(k) {
    var K = window.CATALYST_I18N; if (!K) return '';
    var v = K[bahasa()] && K[bahasa()][k];
    return v != null ? v : (K.id && K.id[k]) || '';
  }
  function jepit(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function halus(x) { return x * x * (3 - 2 * x); }

  /* ---------- label mengikuti gulir ----------
     u per label: titik muncul (0 sampai .3), garis tertarik (.15 sampai .65),
     nama tersingkap (.55 sampai 1) */
  var AWAL = 0.12, JEDA = 0.085, DURASI = 0.14, terakhir = -1, maju = [];
  function terapkanBubble(p) {
    terakhir = -1;
    bubbles.forEach(function (b, i) {
      var u = jepit((p - (AWAL + i * JEDA)) / DURASI);
      maju[i] = u;
      b.style.setProperty('--r', halus(jepit((u - 0.55) / 0.45)).toFixed(3));
      b.classList.toggle('on', u > 0.85);
      if (u > 0.3) terakhir = i;
    });
  }

  var tujuan = 0, kini = 0, jalanGulir = false;
  function hitungTujuan() {
    var r = root.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    tujuan = total > 0 ? jepit(-r.top / total) : 1;
  }
  function langkahGulir() {
    kini += (tujuan - kini) * 0.12;
    if (Math.abs(tujuan - kini) < 0.0004) kini = tujuan;
    root.style.setProperty('--p', kini.toFixed(4));
    terapkanBubble(kini);
    if (gl.siap) return;
    if (kini !== tujuan) requestAnimationFrame(langkahGulir); else jalanGulir = false;
  }
  function picu() {
    hitungTujuan();
    if (!gl.mulai) { var rr = root.getBoundingClientRect(); if (rr.top < window.innerHeight + 800 && rr.bottom > -800) mulai3D(); }
    if (gl.siap) { gl.minta(); return; }
    if (!jalanGulir) { jalanGulir = true; requestAnimationFrame(langkahGulir); }
  }

  /* ---------- 3D ---------- */
  var gl = { siap: false, mulai: false, minta: function () {} };
  var THREE = window.THREE;
  function muatSkrip(src) {
    return new Promise(function (ok, gagal) {
      var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = gagal; document.head.appendChild(s);
    });
  }
  /* studio untuk pantulan krom: latar gelap bergradasi, kotak cahaya bertepi lembut,
     garis tegak tipis, dan cakrawala. Pantulan inilah yang membuat krom terlihat nyata. */
  function lukisStudio(renderer, gelap) {
    var Wc = 2048, Hc = 1024;
    var c = document.createElement('canvas'); c.width = Wc; c.height = Hc;
    var g = c.getContext('2d');
    var lat = g.createLinearGradient(0, 0, 0, Hc);
    if (gelap) { lat.addColorStop(0, '#1c1d22'); lat.addColorStop(.5, '#050506'); lat.addColorStop(.62, '#0b0b0d'); lat.addColorStop(1, '#34363c'); }
    else { lat.addColorStop(0, '#4a4d54'); lat.addColorStop(.5, '#101013'); lat.addColorStop(.62, '#1a1b1f'); lat.addColorStop(1, '#8a8e96'); }
    g.fillStyle = lat; g.fillRect(0, 0, Wc, Hc);
    function lampu(x, y, w, h, a, r) {
      g.save(); g.filter = 'blur(' + (r || 6) + 'px)';
      var gr = g.createLinearGradient(x, y, x + w, y);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.15, 'rgba(255,255,255,' + a + ')');
      gr.addColorStop(.85, 'rgba(255,255,255,' + a + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(x, y, w, h); g.restore();
    }
    lampu(160, 70, 620, 230, 1, 10);      /* kotak utama, atas kiri */
    lampu(1120, 110, 480, 170, .9, 10);   /* kotak kedua, atas kanan */
    lampu(470, 300, 44, 460, .95, 4);     /* garis tegak kiri */
    lampu(1520, 320, 40, 420, .9, 4);     /* garis tegak kanan */
    lampu(960, 380, 22, 300, .6, 3);      /* garis tengah tipis */
    lampu(1840, 260, 120, 360, .55, 8);   /* pantulan belakang */
    lampu(0, 610, 2048, 14, .4, 3);       /* cakrawala */
    var tx = new THREE.CanvasTexture(c);
    tx.mapping = THREE.EquirectangularReflectionMapping; tx.encoding = THREE.sRGBEncoding;
    var pm = new THREE.PMREMGenerator(renderer); var env = pm.fromEquirectangular(tx).texture;
    tx.dispose(); pm.dispose();
    return env;
  }

  function mulai3D() {
    if (gl.mulai || !THREE || !host) return;
    gl.mulai = true;
    var siapLoader = THREE.GLTFLoader ? Promise.resolve() : muatSkrip('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js');
    siapLoader.then(bangun3D).catch(function () {});
  }

  function bangun3D() {
    var renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch (e) { return; }
    renderer.setClearColor(0, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);

    var sc = new THREE.Scene();
    var cam = new THREE.PerspectiveCamera(22, 1, 0.1, 50);
    var STUDIO = { terang: lukisStudio(renderer, false), gelap: lukisStudio(renderer, true) };
    var kunci = new THREE.DirectionalLight(0xffffff, 1.1); kunci.position.set(-2, 3, 3); sc.add(kunci);
    var tepiL = new THREE.DirectionalLight(0xffffff, 1.4); tepiL.position.set(-3, 1.5, -2.5); sc.add(tepiL);
    var tepiR = new THREE.DirectionalLight(0xffffff, 1.4); tepiR.position.set(3, 1.8, -2.5); sc.add(tepiR);
    /* cahaya yang menyapu permukaan krom pelan dari kiri ke kanan */
    var sapu = new THREE.PointLight(0xffffff, 1.3, 5, 2); sc.add(sapu);

    /* ---------- ruang lab: lampu garis, lantai mengkilap berkisi ----------
       Pantulan lantai dipalsukan: ruangan dicerminkan ke bawah lantai yang tembus pandang. */
    var ruang = new THREE.Scene(), camR = new THREE.PerspectiveCamera(48, 1, 0.1, 60);
    var kamar = new THREE.Group();
    var dinding = new THREE.MeshStandardMaterial({ roughness: 0.65, metalness: 0.25, side: THREE.DoubleSide });
    var lampu = new THREE.MeshBasicMaterial({ toneMapped: false });
    function kotak(w, h, d, x, y, z, m) { var o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); kamar.add(o); }
    var bel = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), dinding); bel.position.set(0, 3, -3.6); kamar.add(bel);
    var atap = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), dinding); atap.rotation.x = Math.PI / 2; atap.position.set(0, 4.2, 0); kamar.add(atap);
    [-5, 5].forEach(function (x) { var w = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), dinding); w.position.set(x, 3, 0); w.rotation.y = -Math.sign(x) * Math.PI / 2; kamar.add(w); });
    for (var li = -3; li <= 3; li++) kotak(0.04, 3.6, 0.04, li * 1.1, 2.1, -3.55, lampu);
    for (var lk = 0; lk < 5; lk++) kotak(8, 0.04, 0.06, 0, 4.18, -3 + lk * 1.4, lampu);
    [-4.95, 4.95].forEach(function (x) { for (var k = 0; k < 3; k++) kotak(0.04, 0.04, 12, x, 0.9 + k * 1.2, 0, lampu); });
    var cermin = kamar.clone(); cermin.scale.y = -1;
    var lantai = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshBasicMaterial({ transparent: true }));
    lantai.rotation.x = -Math.PI / 2;
    var kisiGelap = new THREE.GridHelper(20, 40, 0x3a3e48, 0x22252c), kisiTerang = new THREE.GridHelper(20, 40, 0xa9aeb8, 0xc4c8cf);
    [kisiGelap, kisiTerang].forEach(function (k) { k.position.y = 0.004; k.material.transparent = true; k.material.opacity = 0.6; });
    var cahayaR = new THREE.AmbientLight(0xffffff, 0.1), atasR = new THREE.DirectionalLight(0xdfe8ff, 1.2); atasR.position.set(0, 5, 2);
    var titikR = [-2.5, 2.5].map(function (x) { var p = new THREE.PointLight(0xcfdcff, 1.2, 7, 2); p.position.set(x, 2.2, -2.2); return p; });
    ruang.add(kamar, cermin, lantai, kisiGelap, kisiTerang, cahayaR, atasR, titikR[0], titikR[1]);
    camR.position.set(0, 1.45, 3.4);
    function warnaiRuang(g) {
      var lin = function (h) { return new THREE.Color(h).convertSRGBToLinear(); };
      var latar = g ? 0x050608 : 0xe4e6ea;
      ruang.background = lin(latar); ruang.fog = new THREE.FogExp2(lin(latar), g ? 0.05 : 0.045);
      dinding.color.copy(lin(g ? 0x121317 : 0xd5d8de));
      lampu.color.copy(lin(g ? 0xe8eeff : 0xffffff));
      lantai.material.color.copy(lin(g ? 0x08090c : 0xe2e4e8)); lantai.material.opacity = g ? 0.8 : 0.72;
      kisiGelap.visible = g; kisiTerang.visible = !g;
      cahayaR.intensity = g ? 0.08 : 0.55; atasR.intensity = g ? 1.2 : 0.9;
      titikR.forEach(function (p) { p.intensity = g ? 1.2 : 0.7; });
    }
    var ctxRuang = kanvasRuang && kanvasRuang.getContext('2d');
    /* digambar setengah resolusi lalu diburamkan CSS: murah dan terlihat seperti lensa tidak fokus */
    function lukisRuang() {
      if (!ctxRuang) return;
      var w = Math.max(2, Math.round(lebar / 2)), h = Math.max(2, Math.round(tinggi / 2));
      camR.aspect = lebar / tinggi; camR.updateProjectionMatrix(); camR.lookAt(0, 1.55, -3.6);
      renderer.setPixelRatio(1); renderer.setSize(w, h, false);
      renderer.render(ruang, camR);
      kanvasRuang.width = w; kanvasRuang.height = h; ctxRuang.drawImage(renderer.domElement, 0, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(lebar, tinggi, false);
      renderer.render(sc, cam);
      root.classList.add('ada-ruang');
    }

    var bahan = new THREE.MeshPhysicalMaterial({ color: 0x111114, metalness: 1, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05, skinning: true });
    var tulang = {}, dasar = {}, sosok = null, poros = new THREE.Group();
    sc.add(poros);
    var a3 = new THREE.Vector3(), b3 = new THREE.Vector3(), wq = new THREE.Quaternion(), pq = new THREE.Quaternion(), dq = new THREE.Quaternion();
    function arahkan(b, anak, arah) {
      b.updateMatrixWorld(true); b.getWorldPosition(a3); anak.getWorldPosition(b3);
      dq.setFromUnitVectors(b3.sub(a3).normalize(), arah.clone().normalize());
      b.getWorldQuaternion(wq); b.parent.getWorldQuaternion(pq);
      b.quaternion.copy(pq.invert().multiply(dq.multiply(wq))); b.updateMatrixWorld(true);
    }
    function putarDunia(b, sumbu, sudut) {
      b.quaternion.copy(dasar[b.name]); b.updateMatrixWorld(true);
      b.getWorldQuaternion(wq); b.parent.getWorldQuaternion(pq);
      dq.setFromAxisAngle(sumbu, sudut);
      b.quaternion.copy(pq.invert().multiply(dq.multiply(wq)));
    }

    new THREE.GLTFLoader().load('assets/model/sosok.glb', function (gltf) {
      sosok = gltf.scene;
      sosok.traverse(function (o) {
        if (o.isBone) tulang[o.name] = o;
        if (o.isMesh) { o.material = bahan; o.frustumCulled = false; }
      });
      poros.add(sosok);
      var pos = function (n) { var v = new THREE.Vector3(); sosok.updateMatrixWorld(true); tulang[n].getWorldPosition(v); return v; };
      var tKepala = pos('Head').y, tKaki = Math.min(pos('foot_l').y, pos('foot_r').y);
      sosok.scale.setScalar(1.52 / Math.max(0.001, tKepala - tKaki));
      var pv = pos('pelvis'), kk = Math.min(pos('foot_l').y, pos('foot_r').y);
      sosok.position.x -= pv.x; sosok.position.z -= pv.z; sosok.position.y += 0.085 - kk;
      sosok.updateMatrixWorld(true);
      /* lengan turun rapat ke badan, seperti patung dada */
      ['l', 'r'].forEach(function (s) {
        var ua = tulang['upperarm_' + s], la = tulang['lowerarm_' + s], hd = tulang['hand_' + s];
        if (!ua || !la || !hd) return;
        sosok.updateMatrixWorld(true); ua.getWorldPosition(a3);
        var sisi = a3.x > 0 ? 1 : -1;
        arahkan(ua, la, new THREE.Vector3(sisi * 0.1, -1, 0.04));
        arahkan(la, hd, new THREE.Vector3(sisi * 0.04, -1, 0.1));
      });
      ['spine_03', 'neck_01', 'Head'].forEach(function (n) { if (tulang[n]) dasar[n] = tulang[n].quaternion.clone(); });
      siapkanJangkar();
      gl.siap = true;
      ukur(); minta();
      root.classList.add('ada3d');
    });

    /* ---------- kamera: dari kepala sampai pinggang ---------- */
    var lebar = 1, tinggi = 1, jarak0 = 4;
    function ukur() {
      lebar = Math.max(1, host.clientWidth); tinggi = Math.max(1, host.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(lebar, tinggi, false);
      cam.aspect = lebar / tinggi;
      var tampakTinggi = lebar < 700 ? Math.max(1.12, 1.3 / cam.aspect) : 1.12;     /* meter yang terlihat setinggi panggung */
      jarak0 = tampakTinggi / (2 * Math.tan(cam.fov * Math.PI / 360));
      cam.updateProjectionMatrix();
      if (svgGaris) svgGaris.setAttribute('viewBox', '0 0 ' + lebar + ' ' + tinggi);
      tataLabel();
      lukisRuang();
    }

    /* ---------- jangkar label di tubuh ----------
       Sisi A memuat label bernomor ganjil, sisi B genap, supaya muncul selang seling.
       Geseran dicatat dalam ruang lokal tulang, jadi titik ikut napas dan putaran. */
    var JANGKAR = {
      mentors: ['Head', 1, 0.02, 0.11, 0], opportunity: ['Head', -1, 0.035, 0.03, 0.09],
      networks: ['upperarm_r', 0, 0, 0.02, 0.02], partners: ['upperarm_l', 0, 0, 0.02, 0.02],
      community: ['spine_03', 1, 0.07, 0.03, 0.11], career: ['spine_03', -1, 0.07, 0.03, 0.11],
      business: ['upperarm_r', 0, 0, -0.16, 0.03], capital: ['upperarm_l', 0, 0, -0.16, 0.03]
    };
    var jangkar = [], gGaris = [];
    function siapkanJangkar() {
      sosok.updateMatrixWorld(true);
      var sA = tulang.upperarm_r.getWorldPosition(new THREE.Vector3()).x > 0 ? 1 : -1;
      var w = new THREE.Vector3();
      jangkar = bubbles.map(function (b) {
        var j = JANGKAR[b.dataset.n], bone = tulang[j[0]];
        bone.getWorldPosition(w);
        w.x += j[1] * sA * j[2]; w.y += j[3]; w.z += j[4];
        var sisi = (j[1] ? j[1] * sA : (j[0].slice(-1) === 'r' ? sA : -sA));
        return { bone: bone, lokal: bone.worldToLocal(w.clone()), kanan: sisi > 0, tinggi: w.y };
      });
      /* urutan baris tiap sisi dari atas ke bawah */
      [true, false].forEach(function (k) {
        jangkar.filter(function (j) { return j.kanan === k; })
          .sort(function (a, b) { return b.tinggi - a.tinggi; })
          .forEach(function (j, i) { j.baris = i; });
      });
      if (svgGaris) {
        var ns = 'http://www.w3.org/2000/svg';
        svgGaris.innerHTML = '';
        gGaris = jangkar.map(function () {
          var g = document.createElementNS(ns, 'g');
          ['circle', 'circle', 'polyline'].forEach(function (t, i) {
            var e = document.createElementNS(ns, t); e.setAttribute('class', ['e7-c', 'e7-t', ''][i]);
            if (t === 'circle') e.setAttribute('r', i ? 2.5 : 7);
            g.appendChild(e);
          });
          svgGaris.appendChild(g); return g;
        });
      }
      bubbles.forEach(function (b, i) {
        b.classList.toggle('kanan', jangkar[i].kanan); b.classList.toggle('kiri', !jangkar[i].kanan);
        b.addEventListener('pointerenter', function () { gGaris[i].classList.add('hov'); });
        b.addEventListener('pointerleave', function () { gGaris[i].classList.remove('hov'); });
      });
    }
    /* label di kolom kiri dan kanan; sisi B digeser setengah baris */
    function tataLabel() {
      if (!jangkar.length) return;
      var hp = lebar < 700, o = hp ? lebar * 0.24 : Math.min(Math.max(lebar * 0.2, 175), 250);
      jangkar.forEach(function (j, i) {
        var y0 = hp ? 0.2 : 0.18, langkah = hp ? 0.15 : 0.17;
        j.ly = tinggi * (y0 + j.baris * langkah + (j.kanan ? langkah / 2 : 0));
        /* jangan sampai label keluar panel di layar sempit */
        var w = bubbles[i].offsetWidth + 22;
        j.lx = j.kanan ? Math.min(lebar / 2 + o, lebar - w) : Math.max(lebar / 2 - o, w);
        bubbles[i].style.transform = 'translate(' + (j.lx + (j.kanan ? 10 : -10)).toFixed(1) + 'px,' + j.ly.toFixed(1) + 'px) translate(' + (j.kanan ? '0' : '-100%') + ',-50%)';
      });
    }
    var tw = new THREE.Vector3();
    function gambarGaris() {
      jangkar.forEach(function (j, i) {
        var g = gGaris[i]; if (!g) return;
        var u = maju[i] || 0;
        tw.copy(j.lokal); j.bone.localToWorld(tw); tw.project(cam);
        var x0 = (tw.x * 0.5 + 0.5) * lebar, y0 = (-tw.y * 0.5 + 0.5) * tinggi;
        var x1 = j.lx + (j.kanan ? -40 : 40), y1 = j.ly, x2 = j.lx, y2 = j.ly;
        var l1 = Math.hypot(x1 - x0, y1 - y0), l2 = Math.abs(x2 - x1), d = halus(jepit((u - 0.15) / 0.5)) * (l1 + l2);
        var pts = x0.toFixed(1) + ',' + y0.toFixed(1) + ' ';
        if (d <= l1) { var f = l1 ? d / l1 : 0; pts += (x0 + (x1 - x0) * f).toFixed(1) + ',' + (y0 + (y1 - y0) * f).toFixed(1); }
        else pts += x1.toFixed(1) + ',' + y1.toFixed(1) + ' ' + (x1 + (x2 - x1) * (d - l1) / (l2 || 1)).toFixed(1) + ',' + y2.toFixed(1);
        var c = g.childNodes, s = halus(jepit(u / 0.3));
        c[0].setAttribute('cx', x0.toFixed(1)); c[0].setAttribute('cy', y0.toFixed(1)); c[0].setAttribute('r', (7 * s).toFixed(2));
        c[1].setAttribute('cx', x0.toFixed(1)); c[1].setAttribute('cy', y0.toFixed(1)); c[1].setAttribute('r', (2.5 * s).toFixed(2));
        c[2].setAttribute('points', pts);
        g.style.opacity = u > 0 ? 1 : 0;
      });
    }
    var tmp = new THREE.Vector3();
    function keLayar(obj, dy) {
      obj.getWorldPosition(tmp); tmp.y += dy || 0; tmp.project(cam);
      return { x: (tmp.x * 0.5 + 0.5) * lebar, y: (-tmp.y * 0.5 + 0.5) * tinggi };
    }

    /* ---------- tema ---------- */
    function terapkanTema() {
      var g = document.documentElement.classList.contains('dark-theme');
      sc.environment = g ? STUDIO.gelap : STUDIO.terang;
      warnaiRuang(g);
      if (lebar > 1) lukisRuang();
      bahan.color.set(g ? 0xd5d8de : 0x111114);
      bahan.roughness = g ? 0.12 : 0.16;
      bahan.envMapIntensity = g ? 1.15 : 1.5;
      minta();
    }
    new MutationObserver(terapkanTema).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    terapkanTema();

    /* ---------- kursor ---------- */
    var kursor = { x: 0, y: 0, ada: false };
    window.addEventListener('pointermove', function (e) {
      var r = host.getBoundingClientRect();
      var ada = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
      kursor.ada = ada;
      if (ada) { kursor.x = (e.clientX - r.left) / r.width * 2 - 1; kursor.y = (e.clientY - r.top) / r.height * 2 - 1; minta(); }
    }, { passive: true });

    /* ---------- gambar ---------- */
    var tampil = true, jalan = false, lalu = 0, waktu = 0, toleh = 0, angguk = 0, hadap = 0.42, mx = 0, my = 0;
    var sumbuY = new THREE.Vector3(0, 1, 0), sumbuX = new THREE.Vector3(1, 0, 0);
    function minta() { if (!jalan && tampil) { jalan = true; lalu = 0; requestAnimationFrame(bingkai); } }
    gl.minta = minta;
    function bingkai(tm, sekali) {
      if (!tampil && !sekali) { jalan = false; return; }
      var dt = lalu ? Math.min((tm - lalu) / 1000, 0.05) : 0.016; lalu = tm; waktu += dt;
      kini += (tujuan - kini) * Math.min(1, dt * 7);
      if (Math.abs(tujuan - kini) < 0.0004) kini = tujuan;
      root.style.setProperty('--p', kini.toFixed(4));
      terapkanBubble(kini);

      /* ruang bergeser pelan ikut kursor: kesan kedalaman */
      mx += ((kursor.ada ? kursor.x : 0) - mx) * Math.min(1, dt * 4);
      my += ((kursor.ada ? kursor.y : 0) - my) * Math.min(1, dt * 4);
      root.style.setProperty('--mx', mx.toFixed(3)); root.style.setProperty('--my', my.toFixed(3));
      sapu.position.set(Math.sin(waktu * 0.42) * 1.3, 1.62 + Math.sin(waktu * 0.3) * 0.15, 1.1);

      /* badan: dari tiga perempat ke depan saat digulir, lalu berayun pelan */
      var targetHadap = (1 - halus(jepit(kini / 0.35))) * 0.42 + (reduce ? 0 : Math.sin(waktu * 0.45) * 0.035);
      hadap += (targetHadap - hadap) * Math.min(1, dt * 4);
      poros.rotation.y = hadap;

      var dekat = halus(jepit(kini / 0.4));
      var jarak = jarak0 * (0.94 + 0.06 * dekat);
      cam.position.set(0, 1.42, jarak);
      cam.lookAt(0, 1.4, 0);

      if (sosok) {
        var napas = reduce ? 0 : Math.sin(waktu * 1.4) * 0.014;
        if (tulang.spine_03) putarDunia(tulang.spine_03, sumbuX, -napas);
        var tT = 0, tA = 0;
        if (kursor.ada) { tT = kursor.x * 0.5; tA = kursor.y * 0.16; }
        else if (terakhir >= 0 && jangkar[terakhir]) {
          var jt = jangkar[terakhir];
          tT = (jt.kanan ? 1 : -1) * 0.42 - hadap * 0.6;
          tA = (jt.ly / tinggi * 2 - 1) * 0.18;
        }
        toleh += (tT - toleh) * Math.min(1, dt * 3.2);
        angguk += (tA - angguk) * Math.min(1, dt * 3.2);
        if (tulang.neck_01) putarDunia(tulang.neck_01, sumbuY, toleh * 0.4);
        if (tulang.Head) {
          putarDunia(tulang.Head, sumbuY, toleh * 0.6);
          tulang.Head.updateMatrixWorld(true);
          tulang.Head.getWorldQuaternion(wq); tulang.Head.parent.getWorldQuaternion(pq);
          dq.setFromAxisAngle(sumbuX, angguk);
          tulang.Head.quaternion.copy(pq.invert().multiply(dq.multiply(wq)));
        }
        sosok.updateMatrixWorld(true);
        if (tulang.Head && label) {
          var h = keLayar(tulang.Head, 0.2);
          label.style.transform = 'translate(' + h.x.toFixed(1) + 'px,' + h.y.toFixed(1) + 'px) translate(-50%,-100%)';
        }
        gambarGaris();
      }
      renderer.render(sc, cam);
      if (sekali) return;
      requestAnimationFrame(bingkai);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { tampil = e[0].isIntersecting; if (tampil) minta(); }, { threshold: 0 }).observe(root);
    }
    if ('ResizeObserver' in window) new ResizeObserver(function () { ukur(); minta(); }).observe(host);
    ukur();
    window.__eco3d = {
      status: function () { return { siap: gl.siap, kini: kini, tulang: Object.keys(tulang).length }; },
      gambar: function (detik) { var n = Math.max(1, Math.round((detik || 0.5) / 0.016)), w = performance.now(); for (var i = 0; i < n; i++) { lalu = w; w += 16; bingkai(w, true); } }
    };
  }

  /* ---------- pemasangan ---------- */
  if (reduce) { root.classList.add('diam'); tujuan = kini = 1; }
  else { window.addEventListener('scroll', picu, { passive: true }); hitungTujuan(); kini = tujuan; }
  root.style.setProperty('--p', kini.toFixed(4));
  terapkanBubble(kini);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { if (e[0].isIntersecting) mulai3D(); }, { rootMargin: '800px 0px' }).observe(root);
  } else mulai3D();
  picu();
  document.addEventListener('bahasa-berubah', function () { if (buka) isi(buka); });

  /* ---------- kartu detail ---------- */
  var ITEM = { mentors: 'eco.mentor', career: 'eco.career', community: 'eco.comm', business: 'eco.biz',
    capital: 'eco.cap', networks: 'eco.net', partners: 'eco.par', opportunity: 'eco.opp' };
  var buka = null, pemicu = null;
  function isi(nama) {
    var u = ITEM[nama], i = bubbles.findIndex(function (b) { return b.dataset.n === nama; });
    bubbles.forEach(function (b, k) { b.classList.toggle('aktif', k === i); });
    det.querySelector('.ed-no').textContent = '0' + (i + 1) + ' / 0' + N;
    det.querySelector('.ed-judul').textContent = bubbles[i].querySelector('.e7-nm').textContent.trim();
    det.querySelector('.ed-lead').innerHTML = t(u + '.p');
    det.querySelector('.ed-list').innerHTML = [1, 2, 3].map(function (n) { return '<li>' + t(u + '.' + n) + '</li>'; }).join('');
  }
  function bukaDetail(nama, tombol) {
    if (!det) return;
    var baru = !buka;
    buka = nama; isi(nama);
    if (baru) {
      pemicu = tombol; det.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { det.classList.add('on'); }); });
      root.classList.add('buka');
      setTimeout(function () { var c = det.querySelector('.ed-tutup'); if (c) c.focus({ preventScroll: true }); }, 60);
    }
  }
  function tutupDetail() {
    if (!buka) return;
    buka = null; det.classList.remove('on'); root.classList.remove('buka');
    bubbles.forEach(function (b) { b.classList.remove('aktif'); });
    setTimeout(function () { if (!buka) det.hidden = true; }, 450);
    if (pemicu && pemicu.focus) { try { pemicu.focus({ preventScroll: true }); } catch (e) {} }
  }
  bubbles.forEach(function (b) { b.addEventListener('click', function () { if (b.classList.contains('on')) bukaDetail(b.dataset.n, b); }); });
  if (det) det.querySelector('.ed-tutup').addEventListener('click', tutupDetail);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') tutupDetail(); });
})();
