/* ===========================================================
   Section Introducing: patung dada "Anda" berbahan krom kaca hitam,
   dengan bubble yang muncul satu per satu saat digulir.

   - sosok: model manusia laki-laki Universal Base Characters (Quaternius, CC0),
     assets/model/sosok.glb, dibingkai dari kepala sampai pinggang dan memudar
     di bawah. Krom hitam di tema terang, krom perak di tema gelap.
   - gerak halus: napas, ayunan badan pelan, kepala menoleh ke bubble terbaru
     atau ke kursor; saat digulir badan berputar dari tiga perempat ke depan
   - bubble: delapan pil berekor menunjuk ke sosok, muncul dengan pegas,
     lalu melayang pelan. Klik bubble: kartu penjelasan lengkap.
   Model dan GLTFLoader baru dimuat saat section mendekati layar.
   =========================================================== */
(function () {
  var root = document.getElementById('eco4');
  if (!root) return;
  var host = document.getElementById('e5Fig');
  var label = document.getElementById('e5Anda');
  var det = document.getElementById('ecoDetail');
  var bubbles = Array.prototype.slice.call(root.querySelectorAll('.e6-b'));
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
  function pegas(x) { var c = 1.55; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }

  /* ---------- bubble mengikuti gulir ---------- */
  var AWAL = 0.12, JEDA = 0.09, DURASI = 0.11, terakhir = -1;
  function terapkanBubble(p) {
    terakhir = -1;
    bubbles.forEach(function (b, i) {
      var u = jepit((p - (AWAL + i * JEDA)) / DURASI);
      b.style.setProperty('--t', halus(u).toFixed(3));
      b.style.setProperty('--e', (u < 1 ? pegas(u) : 1).toFixed(3));
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
  /* studio untuk pantulan krom: latar gelap, beberapa kotak cahaya dan garis tipis */
  function lukisStudio(renderer, gelap) {
    var c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    var g = c.getContext('2d');
    var lat = g.createLinearGradient(0, 0, 0, 512);
    if (gelap) { lat.addColorStop(0, '#16171b'); lat.addColorStop(.55, '#060607'); lat.addColorStop(1, '#2a2b30'); }
    else { lat.addColorStop(0, '#3a3c42'); lat.addColorStop(.55, '#121215'); lat.addColorStop(1, '#6b6e75'); }
    g.fillStyle = lat; g.fillRect(0, 0, 1024, 512);
    function kotak(x, y, w, h, a) {
      var gr = g.createLinearGradient(x, y, x + w, y);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.2, 'rgba(255,255,255,' + a + ')');
      gr.addColorStop(.8, 'rgba(255,255,255,' + a + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(x, y, w, h);
    }
    kotak(90, 40, 300, 110, 1);       /* kotak utama di atas kiri */
    kotak(560, 60, 240, 80, 0.85);    /* kotak kedua di atas kanan */
    kotak(230, 150, 26, 230, 0.95);   /* garis tegak kiri */
    kotak(760, 160, 22, 210, 0.9);    /* garis tegak kanan */
    kotak(480, 190, 14, 160, 0.55);   /* garis tengah tipis */
    kotak(0, 300, 1024, 10, 0.35);    /* cakrawala */
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
      gl.siap = true;
      ukur(); minta();
      root.classList.add('ada3d');
    });

    /* ---------- kamera: dari kepala sampai pinggang ---------- */
    var lebar = 1, tinggi = 1, jarak0 = 4;
    function ukur() {
      lebar = Math.max(1, host.clientWidth); tinggi = Math.max(1, host.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(lebar, tinggi, false);
      cam.aspect = lebar / tinggi;
      var tampakTinggi = lebar < 700 ? Math.max(1.12, 1.3 / cam.aspect) : 1.12;     /* meter yang terlihat setinggi panggung */
      jarak0 = tampakTinggi / (2 * Math.tan(cam.fov * Math.PI / 360));
      cam.updateProjectionMatrix();
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
    var tampil = true, jalan = false, lalu = 0, waktu = 0, toleh = 0, angguk = 0, hadap = 0.42;
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
        else if (terakhir >= 0) {
          var b = bubbles[terakhir], kanan = b.classList.contains('r');
          tT = (kanan ? 1 : -1) * 0.42 - hadap * 0.6;
          tA = ((parseFloat(getComputedStyle(b).top) / (host.clientHeight || 1)) * 2 - 1) * 0.18;
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
    det.querySelector('.ed-no').textContent = '0' + (i + 1) + ' / 0' + N;
    det.querySelector('.ed-judul').textContent = bubbles[i].textContent.trim();
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
    setTimeout(function () { if (!buka) det.hidden = true; }, 450);
    if (pemicu && pemicu.focus) { try { pemicu.focus({ preventScroll: true }); } catch (e) {} }
  }
  bubbles.forEach(function (b) { b.addEventListener('click', function () { if (b.classList.contains('on')) bukaDetail(b.dataset.n, b); }); });
  if (det) det.querySelector('.ed-tutup').addEventListener('click', tutupDetail);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') tutupDetail(); });
})();
