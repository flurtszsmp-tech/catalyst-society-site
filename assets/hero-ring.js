/* ===========================================================
   Hero: roda program Catalyst (3D, kaca cair).

   - roda diam di tepi kanan hero, terpotong layar, tiap segmen memuat
     ikon program; nama program terpilih di lubang tengah dengan garis
     penunjuk ke segmennya; deskripsi di pita kiri roda
   - berputar sendiri ke program berikutnya, satu program tiap 2 detik
   - kursor MENYENGGOL roda: roda goyang seperti agar-agar (pegas), lalu
     tenang lagi. Kursor yang jauh tidak berpengaruh apa pun
   - tarik roda: berputar mengikuti tangan, lalu mengunci ke program terdekat
   - klik segmen atau tombol next: putar ke program itu
   - otomatis berhenti selama kursor ada di roda atau deskripsinya

   Bergantung pada three.js r128 (global THREE). Tanpa THREE atau WebGL,
   hero tetap utuh tanpa roda.
   =========================================================== */
(function () {
  var wadah = document.getElementById('heroRing');
  if (!wadah || !window.THREE) return;
  var THREE = window.THREE;
  var hero = document.getElementById('hero');
  var info = document.getElementById('ringInfo');
  var pusatEl = document.getElementById('ringCenter');
  var tip = document.getElementById('ringTip');
  var a11y = document.getElementById('ringA11y');
  var tombolNext = document.getElementById('ringNext');

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  var DERAJAT = Math.PI / 180;
  /* varian moodboard permintaan client: ?roda=a|b|c. Tanpa parameter, situs seperti biasa. */
  var VAR_RODA = (function () { try { var v = new URLSearchParams(location.search).get('roda'); return /^[abc]$/.test(v) ? v : null; } catch (e) { return null; } })();
  if (VAR_RODA && document.getElementById('hero')) document.getElementById('hero').classList.add('roda-var', 'roda-' + VAR_RODA);
  var JEDA_OTOMATIS = 4.3;      /* detik diam; ditambah ~0,72 detik berputar = satu program tiap ~5 detik */

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { return; }
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.NoToneMapping;
  var kanvas = renderer.domElement;
  kanvas.setAttribute('aria-hidden', 'true');
  wadah.appendChild(kanvas);

  var scene = new THREE.Scene();
  var kamera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  kamera.position.set(0, 0, 10);

  /* ---------- peta pantulan ----------
     Muka depan segmen memantulkan arah +z, yaitu titik u=.75 v=.5 pada peta.
     Wilayah itu HARUS gelap untuk kaca hitam (terang untuk kaca putih),
     kalau tidak permukaannya jadi abu. Cahaya terang hanya ditaruh di atas
     dan sebagai garis tipis di sisi, supaya hanya tepi bulat (bevel) yang
     menangkap kilau, seperti kaca sungguhan. */
  function lukisEnv(mode) {
    var c = document.createElement('canvas');
    c.width = 1024; c.height = 512;
    var g = c.getContext('2d');
    var lat = g.createLinearGradient(0, 0, 0, 512);
    if (mode === 'hitam') {
      lat.addColorStop(0, '#1b1c21'); lat.addColorStop(0.32, '#050506'); lat.addColorStop(1, '#000000');
    } else {
      lat.addColorStop(0, '#ffffff'); lat.addColorStop(0.4, '#f7f8fa'); lat.addColorStop(1, '#dfe1e7');
    }
    g.fillStyle = lat; g.fillRect(0, 0, 1024, 512);
    if (mode === 'hitam') {
      g.fillStyle = 'rgba(255,255,255,.98)'; g.fillRect(60, 28, 380, 96);
      g.fillStyle = 'rgba(255,255,255,.9)';  g.fillRect(560, 40, 260, 70);
      g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(498, 170, 26, 220);
      g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(1000, 170, 24, 220);
      g.fillStyle = 'rgba(255,255,255,.6)';  g.fillRect(0, 170, 14, 220);
      g.fillStyle = 'rgba(255,255,255,.5)';  g.fillRect(180, 440, 300, 16);
    } else {
      g.fillStyle = 'rgba(70,74,86,.85)';    g.fillRect(498, 160, 34, 240);
      g.fillStyle = 'rgba(70,74,86,.85)';    g.fillRect(990, 160, 34, 240);
      g.fillStyle = 'rgba(96,100,112,.6)';   g.fillRect(0, 160, 16, 240);
      g.fillStyle = 'rgba(120,124,136,.6)';  g.fillRect(150, 430, 340, 24);
    }
    var t = new THREE.CanvasTexture(c);
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.encoding = THREE.sRGBEncoding;
    var pm = new THREE.PMREMGenerator(renderer);
    var env = pm.fromEquirectangular(t).texture;
    t.dispose(); pm.dispose();
    return env;
  }
  var ENV = { hitam: lukisEnv('hitam'), putih: lukisEnv('putih') };

  var cahaya = new THREE.DirectionalLight(0xffffff, 0.5);
  cahaya.position.set(-3, 4, 6);
  scene.add(cahaya);
  var ambien = new THREE.AmbientLight(0xffffff, 0.02);
  scene.add(ambien);

  /* ---------- data program ---------- */
  var PROGRAM = [
    { nama: 'passport', judul: 'Catalyst Passport', akses: 'free', foto: '',
      ikon: 'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM15 10a3 3 0 1 1-6 0a3 3 0 0 1 6 0zM9 16h6' },
    { nama: 'finder', judul: 'Catalyst Finder', akses: 'free', foto: '',
      ikon: 'M17 11a6 6 0 1 1-12 0a6 6 0 0 1 12 0zM20 20l-4.5-4.5' },
    { nama: 'academy', judul: 'Catalyst Academy', akses: 'premium', foto: '',
      ikon: 'M12 4 2 9l10 5 10-5-10-5zM6 11.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5M22 9v5' },
    { nama: 'labs', judul: 'Catalyst Labs', akses: 'premium', foto: 'assets/img/program/labs.webp', fokus: '42% 50%',
      ikon: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3M7 15h10' },
    { nama: 'ventures', judul: 'Catalyst Ventures', akses: 'premium', foto: 'assets/img/program/ventures.webp', fokus: '50% 50%',
      ikon: 'M12 3c3.5 2 5 5.5 5 9l-3 3H10l-3-3c0-3.5 1.5-7 5-9zM10 18c-1 1-1.5 3-1.5 3s2-.5 3-1.5M14 18c1 1 1.5 3 1.5 3s-2-.5-3-1.5M13.6 10a1.6 1.6 0 1 1-3.2 0a1.6 1.6 0 0 1 3.2 0z' },
    { nama: 'summit', judul: 'Catalyst Summit', akses: 'premium', foto: 'assets/img/program/summit.webp', fokus: '50% 40%',
      ikon: 'M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z' }
  ];
  var N = PROGRAM.length;
  var SUDUT = (Math.PI * 2) / N;
  function theta(k) { return Math.PI / 2 - (k + 0.5) * SUDUT; }
  var DASAR = Math.PI - theta(0);          /* rot yang membawa segmen 0 ke jam 9 */
  function rotStop(k) { return DASAR + SUDUT * k; }
  function modN(k) { return ((k % N) + N) % N; }
  function indeksDari(rot) { return Math.round((rot - DASAR) / SUDUT); }

  /* ---------- geometri: segmen kaca tebal berujung bulat ----------
     Sisi segmen dibuat sejajar (celah selebar sama dari dalam ke luar),
     dan bevel dimulai dari garis luar bentuk (bevelOffset negatif), jadi
     siluet akhirnya persis bentuk yang digambar dan celahnya tidak tertutup. */
  var R_LUAR = 1, R_DALAM = 0.74, CELAH = 0.056;     /* cincin tipis: lubang lebar untuk foto dan deskripsi */
  var DEPTH = 0.05, BEVEL_T = 0.085, BEVEL_S = 0.07;
  var MUKA_Z = DEPTH / 2 + BEVEL_T;

  function segmen(k) {
    var b0 = theta(k) - SUDUT / 2, b1 = theta(k) + SUDUT / 2, g = CELAH / 2;
    var a0o = b0 + Math.asin(g / R_LUAR), a1o = b1 - Math.asin(g / R_LUAR);
    var a0i = b0 + Math.asin(g / R_DALAM), a1i = b1 - Math.asin(g / R_DALAM);
    var s = new THREE.Shape();
    s.moveTo(R_LUAR * Math.cos(a0o), R_LUAR * Math.sin(a0o));
    s.absarc(0, 0, R_LUAR, a0o, a1o, false);
    s.lineTo(R_DALAM * Math.cos(a1i), R_DALAM * Math.sin(a1i));
    s.absarc(0, 0, R_DALAM, a1i, a0i, true);
    s.closePath();
    var geo = new THREE.ExtrudeGeometry(s, {
      depth: DEPTH, bevelEnabled: true, bevelThickness: BEVEL_T, bevelSize: BEVEL_S,
      bevelOffset: -BEVEL_S, bevelSegments: 14, curveSegments: 72
    });
    geo.translate(0, 0, -DEPTH / 2);
    return geo;
  }

  var cincin = new THREE.Group();
  var meshes = [], bahan = [], ikon = [];

  PROGRAM.forEach(function (p, k) {
    var m = new THREE.MeshPhysicalMaterial({ metalness: 0, clearcoat: 1 });
    var mesh = new THREE.Mesh(segmen(k), m);
    mesh.userData.indeks = k;
    cincin.add(mesh);
    meshes.push(mesh); bahan.push(m);

    /* ikon: tegak lurus layar saat segmen ada di jam 9, ikut berputar bersama roda */
    var c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    var tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 8;
    var bidang = new THREE.Mesh(
      new THREE.PlaneGeometry(0.17, 0.17),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false })
    );
    var rm = (R_LUAR + R_DALAM) / 2;
    bidang.position.set(rm * Math.cos(theta(k)), rm * Math.sin(theta(k)), MUKA_Z + 0.006);
    bidang.rotation.z = theta(k) - Math.PI;
    cincin.add(bidang);
    ikon.push({ kanvas: c, tekstur: tex, path: new Path2D(p.ikon), bidang: bidang });
  });
  scene.add(cincin);

  /* ---------- tema: hitam pekat di terang, putih di gelap ---------- */
  function gelap() { return document.documentElement.classList.contains('dark-theme'); }

  function terapkanTema() {
    var g = gelap();
    scene.environment = g ? ENV.putih : ENV.hitam;
    ambien.intensity = g ? 0.35 : 0.0;
    cahaya.intensity = g ? 0.35 : 0.5;
    bahan.forEach(function (m) {
      if (g) {
        m.color.set(0xffffff); m.roughness = 0.12; m.clearcoatRoughness = 0.05; m.envMapIntensity = 0.85;
      } else {
        m.color.set(0x000000); m.roughness = 0.08; m.clearcoatRoughness = 0.03; m.envMapIntensity = 1.5;
      }
      m.emissive.set(0x000000);
      m.needsUpdate = true;
    });
    ikon.forEach(function (t) {
      var x = t.kanvas.getContext('2d');
      x.clearRect(0, 0, 256, 256);
      x.save();
      x.translate(128, 128); x.scale(7.4, 7.4); x.translate(-12, -12);
      x.strokeStyle = g ? '#0a0a0d' : '#ffffff';
      x.lineWidth = 1.5; x.lineCap = 'round'; x.lineJoin = 'round';
      x.stroke(t.path);
      x.restore();
      t.tekstur.needsUpdate = true;
    });
  }

  /* ---------- tata letak ---------- */
  var lebar = 0, tinggi = 0, lebarLayar = true;
  var pusat = { x: 0, y: 0 }, jari = 100, jariHalo = 0, pusatLubang = 0;

  function kananTeks() {
    var kanan = 0, rg = document.createRange();
    document.querySelectorAll('.hero-top h1 .ln > span').forEach(function (el) {
      rg.selectNodeContents(el);
      var b = rg.getBoundingClientRect();
      if (b.width) kanan = Math.max(kanan, b.right);
    });
    return kanan || 0;
  }

  /* lebar nama terpanjang dalam satuan em (Inter 500, jarak huruf -.045em),
     dipakai supaya nama + garis penunjuk selalu muat di bagian lubang yang terlihat */
  var ctxUkur = document.createElement('canvas').getContext('2d');
  function emTerlebar() {
    ctxUkur.font = '500 100px Inter, "Helvetica Neue", Arial, sans-serif';
    var m = 0;
    PROGRAM.forEach(function (p) {
      var nama = p.nama.charAt(0).toUpperCase() + p.nama.slice(1);
      m = Math.max(m, ctxUkur.measureText(nama).width / 100 - 0.045 * nama.length);
    });
    return m;
  }
  var RGL_EM = 2;                        /* panjang garis penunjuk, em */

  function ukur() {
    var r = wadah.getBoundingClientRect();
    lebar = Math.max(1, Math.round(r.width));
    tinggi = Math.max(1, Math.round(r.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(lebar, tinggi, false);
    kamera.aspect = lebar / tinggi;

    var tinggiDunia = 2 * Math.tan((kamera.fov * Math.PI) / 360) * kamera.position.z;
    var ppu = tinggi / tinggiDunia;

    lebarLayar = lebar >= 1000;
    var pusatLubangX, lebarLubang;
    if (lebarLayar) {
      /* roda lebih dari separuh terlihat: pusatnya sedikit di dalam tepi kanan layar.
         Tepi kiri roda tidak boleh menabrak judul hero */
      pusat.y = tinggi * 0.55;
      var ruang = (lebar - (kananTeks() - r.left) - 44) / 1.3;
      jari = Math.max(320, Math.min(tinggi * 0.82, lebar * 0.46, ruang));
      jari *= 0.86;                     /* permintaan client: roda sedikit lebih kecil */
      pusat.x = lebar - jari * 0.3;
      jariHalo = jari * 1.1;
      var kiriL = pusat.x - jari * R_DALAM, kananL = Math.min(pusat.x + jari * R_DALAM, lebar - 16);
      pusatLubangX = (kiriL + kananL) / 2;
      lebarLubang = kananL - kiriL;
    } else {
      pusat.x = lebar * 0.5; pusat.y = tinggi * 0.5;
      jari = Math.min(lebar, tinggi) * 0.42;
      jariHalo = 0;
      pusatLubangX = pusat.x;
      lebarLubang = 2 * jari * R_DALAM;
    }
    cincin.scale.setScalar(jari / ppu);
    cincin.position.set((pusat.x - lebar / 2) / ppu, (tinggi / 2 - pusat.y) / ppu, 0);
    kamera.updateProjectionMatrix();

    var st = hero.style;
    st.setProperty('--rcx', pusat.x + 'px');
    st.setProperty('--rcy', pusat.y + 'px');
    st.setProperty('--rr', jari + 'px');
    st.setProperty('--rh', jariHalo + 'px');
    st.setProperty('--rhx', pusatLubangX + 'px');
    st.setProperty('--rl', (jari * R_DALAM) + 'px');
    if (typeof tataFoto === 'function' && foto) tataFoto();
    if (typeof tataInfo === 'function' && lekuk) tataInfo();
    pusatLubang = pusatLubangX;
    st.setProperty('--riw', Math.min(lebarLubang * 0.78, 400) + 'px');
    var fs = Math.max(18, Math.min(54, jari * 0.17, (lebarLubang - 26) / (RGL_EM + 0.35 + emTerlebar())));
    st.setProperty('--rfs', fs + 'px');
    st.setProperty('--rgl', RGL_EM + 'em');
  }

  /* ---------- deteksi segmen ---------- */
  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function segmenDi(clientX, clientY) {
    var r = wadah.getBoundingClientRect();
    if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return -1;
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    cincin.updateMatrixWorld(true);
    ray.setFromCamera(ndc, kamera);
    var hit = ray.intersectObjects(meshes, false)[0];
    return hit ? hit.object.userData.indeks : -1;
  }

  /* ---------- teks ---------- */
  function bahasa() {
    var l = (document.documentElement.lang || 'id').slice(0, 2);
    return l === 'zh' ? 'zh' : l === 'en' ? 'en' : 'id';
  }
  function t(kunci) {
    var K = window.CATALYST_I18N;
    if (!K) return '';
    var v = K[bahasa()] && K[bahasa()][kunci];
    return v != null ? v : (K.id && K.id[kunci]) || '';
  }
  var LABEL_AKSES = { free: 'Free', premium: 'Premium' };
  var aktif = 0, sudahTampil = false;

  function isi(k) {
    var p = PROGRAM[k], n = k + 1;
    if (pusatEl) {
      pusatEl.querySelector('.rc-nama').textContent = p.nama;
      pusatEl.querySelector('.rc-no').textContent = '0' + n + ' / 0' + N;
    }
    if (!info) return;
    info.querySelector('.ri-no').textContent = '0' + n;
    var a = info.querySelector('.ri-akses');
    a.textContent = LABEL_AKSES[p.akses];
    a.className = 'ri-akses ' + p.akses;
    info.querySelector('.ri-judul').textContent = p.judul;
    info.querySelector('.ri-desc').innerHTML = t('p' + n + '.d');
    info.querySelector('.ri-isi').innerHTML = '<span>' + t('p' + n + '.b') + '</span>';
    info.querySelector('.ri-buka span').innerHTML = t('show.buka') || 'Buka Platform';
    bukaLengkap(false);
    if (tombolNext) {
      var lb = t('ring.next') || 'Next';
      tombolNext.setAttribute('aria-label', lb); tombolNext.setAttribute('title', lb);
    }
  }

  /* program aktif untuk navigasi; isi deskripsi diatur sinkron() mengikuti sudut roda */
  function setAktif(k) {
    aktif = modN(k);
    if (!sudahTampil) { sudahTampil = true; isi(aktif); }
  }
  document.addEventListener('bahasa-berubah', function () { isi(aktif); ukur(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ukur(); });

  if (a11y) {
    a11y.innerHTML = PROGRAM.map(function (p, k) {
      return '<button type="button" data-k="' + k + '">' + p.judul + '</button>';
    }).join('');
    a11y.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-k]');
      if (b) menujuKe(+b.dataset.k, true);
    });
  }

  /* ---------- gerak: putar berpegas, goyang berpegas ---------- */
  var rot = rotStop(0), vRot = 0, sasaran = null;
  var wx = 0, wy = 0, vwx = 0, vwy = 0;        /* goyang (radian) */
  var BASE_X = 0.05, BASE_Y = -0.14;           /* miring diam supaya tebal kaca terbaca */
  var dorong = 0, seret = null, pLalu = null;
  var tunggu = 0, jedaSampai = 0, dalam = false;

  function menujuKe(k, jeda) {
    var kc = indeksDari(rot);
    var beda = modN(k - kc + 3) - 3;           /* jalur terpendek, -3 .. 2 */
    sasaran = rotStop(kc + beda);
    if (jeda) jedaSampai = performance.now() + 6000;
    tunggu = 0;
    setAktif(k);
  }
  if (tombolNext) tombolNext.addEventListener('click', function () { menujuKe(aktif + 1, true); });

  function sudutKursor(x, y) {
    var r = wadah.getBoundingClientRect();
    return Math.atan2(-(y - (r.top + pusat.y)), x - (r.left + pusat.x));
  }

  window.addEventListener('pointermove', function (e) {
    var r = wadah.getBoundingClientRect();
    var dx = e.clientX - (r.left + pusat.x), dy = e.clientY - (r.top + pusat.y);
    var jarak = Math.sqrt(dx * dx + dy * dy);
    dalam = lebarLayar && jarak < jari && e.clientY >= r.top && e.clientY <= r.bottom;

    if (seret) {
      var s = sudutKursor(e.clientX, e.clientY);
      var d = s - seret.sudut;
      if (d > Math.PI) d -= Math.PI * 2; else if (d < -Math.PI) d += Math.PI * 2;
      rot += d; vRot = 0;
      var dt = Math.max((e.timeStamp - seret.t) / 1000, 0.008);
      dorong = Math.max(-6, Math.min(6, dorong * 0.5 + (d / dt) * 0.5));
      seret.sudut = s; seret.t = e.timeStamp;
      seret.gerak += Math.abs(e.clientX - seret.x) + Math.abs(e.clientY - seret.y);
      seret.x = e.clientX; seret.y = e.clientY;
      sasaran = null;
      setAktif(indeksDari(rot));
      return;
    }

    var h = segmenDi(e.clientX, e.clientY);
    wadah.style.cursor = h >= 0 ? 'grab' : '';

    /* senggolan: dorongan goyang hanya kalau kursor benar-benar di atas roda */
    if (h >= 0 && !reduce) {
      if (pLalu) {
        var dtp = Math.max((e.timeStamp - pLalu.t) / 1000, 0.008);
        var kecepatan = Math.sqrt(Math.pow(e.clientX - pLalu.x, 2) + Math.pow(e.clientY - pLalu.y, 2)) / dtp;
        var kuat = Math.min(kecepatan / 1300, 1);
        var ux = dx / jari, uy = -dy / jari;         /* -1..1, titik yang tersenggol */
        /* dorongan kecil per peristiwa, dijumlah selama kursor menggesek roda */
        vwx = Math.max(-2.4, Math.min(2.4, vwx + (-uy) * kuat * 0.58));
        vwy = Math.max(-2.4, Math.min(2.4, vwy + ux * kuat * 0.58));
      }
      pLalu = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    } else pLalu = null;

    if (tip) {
      if (h >= 0) {
        tip.textContent = PROGRAM[h].judul;
        tip.style.left = (e.clientX - r.left) + 'px';
        tip.style.top = (e.clientY - r.top) + 'px';
        tip.classList.add('tampil');
      } else tip.classList.remove('tampil');
    }
  }, { passive: true });

  wadah.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (segmenDi(e.clientX, e.clientY) < 0) return;
    seret = { sudut: sudutKursor(e.clientX, e.clientY), x: e.clientX, y: e.clientY, t: e.timeStamp, awal: e.timeStamp, gerak: 0 };
    dorong = 0; sasaran = null; vRot = 0;
    try { wadah.setPointerCapture(e.pointerId); } catch (x) {}
    wadah.style.cursor = 'grabbing';
    if (tip) tip.classList.remove('tampil');
  });

  function lepas(e) {
    if (!seret) return;
    var klik = seret.gerak < 6 && (e.timeStamp - seret.awal) < 450;
    seret = null;
    jedaSampai = performance.now() + 6000;
    if (klik) {
      var h = segmenDi(e.clientX, e.clientY);
      if (h >= 0) { menujuKe(h, true); dorong = 0; return; }
    }
    var kc = indeksDari(rot + dorong * 0.2);
    sasaran = rotStop(kc);
    setAktif(kc);
    dorong = 0;
    wadah.style.cursor = '';
  }
  wadah.addEventListener('pointerup', lepas);
  wadah.addEventListener('pointercancel', lepas);
  window.addEventListener('pointerleave', function () { dalam = false; pLalu = null; if (tip) tip.classList.remove('tampil'); });
  if (info) {
    info.addEventListener('pointerenter', function () { dalam = true; });
    info.addEventListener('pointerleave', function () { dalam = false; });
  }

  /* ---------- gambar ---------- */
  var tampil = true, lalu = 0;

  /* satu langkah fisika: goyang berpegas, putar berpegas, putaran otomatis */
  function langkah(dt) {
    /* goyang: pegas teredam, beberapa ayunan lalu diam */
    vwx += (-70 * wx - 5.6 * vwx) * dt; wx += vwx * dt;
    vwy += (-70 * wy - 5.6 * vwy) * dt; wy += vwy * dt;
    wx = Math.max(-0.32, Math.min(0.32, wx)); wy = Math.max(-0.32, Math.min(0.32, wy));

    if (!seret) {
      if (sasaran !== null) {
        /* putar berpegas: sedikit melampaui lalu mengendap, kesan cairan */
        var galat = sasaran - rot;
        var K = reduce ? 400 : 110, C = reduce ? 40 : 15;
        vRot += (galat * K - vRot * C) * dt;
        rot += vRot * dt;
        if (Math.abs(sasaran - rot) < 0.0015 && Math.abs(vRot) < 0.04) { rot = sasaran; vRot = 0; sasaran = null; }
      } else if (!reduce && !dalam && !lengkap && performance.now() > jedaSampai) {
        tunggu += dt;
        if (tunggu > JEDA_OTOMATIS) { tunggu = 0; menujuKe(aktif + 1, false); }
      }
    }
    cincin.rotation.set(BASE_X + wx, BASE_Y + wy, rot);
    sinkron(dt);
  }

  /* ---------- deskripsi sinkron dengan roda ----------
     fase = selisih sudut roda dari posisi berhenti program terdekat (-SUDUT/2 .. SUDUT/2).
     Isi berganti tepat saat fase melewati tengah, saat teks paling tidak terlihat.
     Segmen aktif (jam 9) maju dan berkilau; bulatan kecil di samping nomor
     menunjukkan sisa waktu ke program berikutnya. */
  var tampilK = -1, angkat = PROGRAM.map(function () { return 0; }), muat = null, KEL_MUAT = 2 * Math.PI * 5.5;

  /* foto program di lubang roda: berganti mengikuti program aktif. Program tanpa foto
     memakai bidang gelap supaya teks putih tetap terbaca. */
  var foto = document.createElement('div'), bingkaiFoto = [];
  foto.className = 'ring-foto'; foto.setAttribute('aria-hidden', 'true');
  PROGRAM.forEach(function (p) {
    var f = document.createElement('div'); f.className = 'rf-isi' + (p.foto ? '' : ' kosong');
    if (p.foto) {
      var im = new Image(); im.alt = ''; im.decoding = 'async'; im.src = p.foto;
      if (p.fokus) im.style.objectPosition = p.fokus;
      f.appendChild(im);
    }
    foto.appendChild(f); bingkaiFoto.push(f);
  });
  wadah.insertBefore(foto, kanvas);
  function tataFoto() {
    var r = jari * R_DALAM + 2;
    /* lingkaran penuh seukuran lubang; bagian yang lewat tepi layar terpotong sendiri */
    foto.style.cssText = 'left:' + (pusat.x - r) + 'px;top:' + (pusat.y - r) + 'px;width:' + (r * 2) + 'px;height:' + (r * 2) + 'px;border-radius:50%';
  }

  /* deskripsi rata kiri di bagian bawah lubang; tepi kiri tiap baris mengikuti lengkung
     lingkaran lewat float ber-shape-outside yang titik-titiknya dihitung dari busur lubang */
  var lekuk = null;
  if (info) { lekuk = document.createElement('div'); lekuk.className = 'ri-lekuk'; lekuk.setAttribute('aria-hidden', 'true'); info.insertBefore(lekuk, info.firstChild); }
  function tataInfo() {
    if (!info || !lekuk) return;
    if (!lebarLayar) { info.style.left = info.style.top = info.style.width = ''; lekuk.style.cssText = 'display:none'; return; }
    var rl = jari * R_DALAM, kiri = pusat.x - rl + 26, kanan = Math.min(pusat.x + rl, lebar) - 30;
    if (VAR_RODA) {
      /* teks tepat di tengah bagian lubang yang terlihat, rata tengah, tidak mengikuti lengkung */
      lekuk.style.cssText = 'display:none';
      var kiriL = pusat.x - rl, kananL = Math.min(pusat.x + rl, lebar), lebarT = Math.min((kananL - kiriL) * 0.72, 400);
      info.style.width = lebarT + 'px';
      info.style.left = ((kiriL + kananL) / 2 - lebarT / 2) + 'px';
      info.style.top = (pusat.y - info.offsetHeight / 2) + 'px';
      return;
    }
    info.style.left = kiri + 'px'; info.style.width = Math.max(200, kanan - kiri) + 'px';
    for (var ulang = 0; ulang < 3; ulang++) {
      var h = info.offsetHeight, bawah = Math.min(pusat.y + rl * 0.9, tinggi - 22);
      var atas = Math.max(pusat.y - rl * 0.8, Math.min(pusat.y + rl * 0.04, bawah - h));
      info.style.top = atas + 'px';
      var titik = [], lebarMaks = 0;
      for (var i = 0; i <= 18; i++) {
        var y = i / 18 * h, dy = atas + y - pusat.y, dalam2 = rl * rl - dy * dy;
        var xBusur = dalam2 > 0 ? pusat.x - Math.sqrt(dalam2) : pusat.x;
        var masuk = Math.max(0, xBusur - kiri + 30);
        lebarMaks = Math.max(lebarMaks, masuk);
        titik.push(masuk.toFixed(1) + 'px ' + y.toFixed(1) + 'px');
      }
      lekuk.style.cssText = 'width:' + lebarMaks.toFixed(1) + 'px;height:' + h + 'px;shape-outside:polygon(0 0,' + titik.join(',') + ',0 ' + h + 'px)';
    }
  }

  /* baca selengkapnya: paragraf panjang disembunyikan, muncul saat tombol ditekan */
  var tombolLengkap = document.getElementById('ringLengkap'), lengkap = false;
  function bukaLengkap(v) {
    lengkap = !!v;
    if (!info || !tombolLengkap) return;
    info.classList.toggle('lengkap', lengkap);
    tombolLengkap.setAttribute('aria-expanded', lengkap ? 'true' : 'false');
    tombolLengkap.querySelector('span').textContent = lengkap ? (t('ring.tutup') || 'Tutup') : (t('ring.lengkap') || 'Selengkapnya');
    clearTimeout(bukaLengkap.tm);
    bukaLengkap.tm = setTimeout(function () { if (typeof tataInfo === 'function') tataInfo(); }, 30);
  }
  if (tombolLengkap) tombolLengkap.addEventListener('click', function () { bukaLengkap(!lengkap); });
  /* bulatan loading kecil di samping nomor program: penanda kapan roda pindah */
  if (info) {
    var atas = info.querySelector('.ri-atas');
    if (atas) {
      var sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      sv.setAttribute('class', 'ri-muat'); sv.setAttribute('viewBox', '0 0 14 14'); sv.setAttribute('aria-hidden', 'true');
      sv.innerHTML = '<circle class="j" cx="7" cy="7" r="5.5"/><circle class="i" cx="7" cy="7" r="5.5" stroke-dasharray="' + KEL_MUAT.toFixed(2) + '"/>';
      atas.insertBefore(sv, atas.firstChild);
      muat = sv.lastChild;
    }
  }
  function sinkron(dt) {
    var kDekat = indeksDari(rot), k = modN(kDekat);
    var fase = rot - rotStop(kDekat), f = Math.min(1, Math.abs(fase) / (SUDUT / 2));
    if (k !== tampilK) {
      tampilK = k; aktif = k; isi(k);
      bingkaiFoto.forEach(function (f, i) { f.classList.toggle('aktif', i === k); });
      tataInfo();
    }
    var op = 1 - Math.pow(f, 1.6);

    /* segmen aktif maju keluar, sedikit membesar, dan lebih berkilau */
    meshes.forEach(function (m, i) {
      var target = i === k ? 1 - f : 0;
      angkat[i] += (target - angkat[i]) * Math.min(1, dt * 10);
      var a = theta(i), sk = 1 + 0.022 * angkat[i];
      m.scale.set(sk, sk, 1);
      m.position.set(Math.cos(a) * 0.03 * angkat[i], Math.sin(a) * 0.03 * angkat[i], 0.09 * angkat[i]);
      bahan[i].envMapIntensity = (gelap() ? 0.85 : 1.5) + angkat[i] * (gelap() ? 0.6 : 2.4);
      var rm2 = (R_LUAR + R_DALAM) / 2 * sk + 0.03 * angkat[i];
      ikon[i].bidang.position.set(rm2 * Math.cos(a), rm2 * Math.sin(a), MUKA_Z + 0.006 + 0.09 * angkat[i]);
    });

    if (muat) {
      var maju = sasaran !== null ? 1 : (reduce ? 0 : Math.min(1, tunggu / JEDA_OTOMATIS));
      muat.setAttribute('stroke-dashoffset', (KEL_MUAT * (1 - maju)).toFixed(2));
    }

    if (!info) return;
    if (!lebarLayar) {
      info.style.transform = ''; info.style.opacity = '';
      return;
    }
    /* teks bergulir searah putaran dan memudar */
    info.style.transform = 'translateY(' + (fase / (SUDUT / 2) * 40).toFixed(1) + 'px)';
    info.style.opacity = op.toFixed(3);
  }

  function bingkai(tm) {
    requestAnimationFrame(bingkai);
    if (!tampil) { lalu = tm; return; }
    var dt = lalu ? Math.min((tm - lalu) / 1000, 0.033) : 0.016;
    lalu = tm;
    langkah(dt);
    renderer.render(scene, kamera);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { tampil = e[0].isIntersecting; }, { threshold: 0 }).observe(hero);
  }
  if ('ResizeObserver' in window) new ResizeObserver(ukur).observe(wadah);
  else window.addEventListener('resize', ukur);
  new MutationObserver(terapkanTema).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  ukur();
  terapkanTema();
  /* ?mulai=N (dipakai moodboard): roda langsung berhenti di program N */
  var MULAI = (function () { try { var v = parseInt(new URLSearchParams(location.search).get('mulai'), 10); return v >= 0 && v < N ? v : 0; } catch (e) { return 0; } })();
  rot = rotStop(MULAI);
  if (MULAI) jedaSampai = Infinity;     /* moodboard: diam di program awal sampai diklik */
  setAktif(MULAI);
  requestAnimationFrame(bingkai);
  wadah.classList.add('siap');
  if (hero) hero.classList.add('ada-roda');

  /* untuk pengujian dari konsol */
  window.__heroRing = {
    render: function () { cincin.rotation.set(BASE_X + wx, BASE_Y + wy, rot); renderer.render(scene, kamera); },
    pilih: function (k) { menujuKe(k, true); },
    langkah: function (detik) { var n = Math.round(detik / 0.016), hasil = []; for (var i = 0; i < n; i++) { langkah(0.016); hasil.push([+wx.toFixed(4), +wy.toFixed(4)]); } this.render(); return hasil; },
    lompat: function () { if (sasaran !== null) { rot = sasaran; vRot = 0; sasaran = null; } this.render(); },
    goyang: function (a, b) { vwx = a; vwy = b; },
    segmenDi: segmenDi,
    status: function () { return { aktif: aktif, rot: rot / DERAJAT, sasaran: sasaran === null ? null : sasaran / DERAJAT, wx: wx, wy: wy, R: jari, cx: pusat.x, cy: pusat.y }; }
  };
})();

/* ---------- dua tombol utama: blok hitam bergeser ke tombol yang didekati ---------- */
(function () {
  var duo = document.querySelector('.hero-duo');
  if (!duo) return;
  var tombol = [duo.querySelector('.hd-a'), duo.querySelector('.hd-b')];
  if (!tombol[0] || !tombol[1]) return;
  var ind = document.createElement('span');
  ind.className = 'hd-ind'; ind.setAttribute('aria-hidden', 'true');
  duo.insertBefore(ind, duo.firstChild);
  var aktif = 0;
  function tata() {
    var sl = parseFloat(getComputedStyle(duo).getPropertyValue('--sl')) || 13;
    var t = tombol[aktif], kiri = t.offsetLeft, lebar = t.offsetWidth;
    if (aktif === 0) {
      ind.style.transform = 'translateX(' + kiri + 'px)';
      ind.style.width = (lebar + sl) + 'px';
      ind.style.clipPath = 'polygon(0 0,100% 0,calc(100% - ' + (sl * 2) + 'px) 100%,0 100%)';
    } else {
      ind.style.transform = 'translateX(' + (kiri - sl) + 'px)';
      ind.style.width = (lebar + sl) + 'px';
      ind.style.clipPath = 'polygon(' + (sl * 2) + 'px 0,100% 0,100% 100%,0 100%)';
    }
    tombol.forEach(function (b, i) { b.classList.toggle('aktif', i === aktif); });
  }
  tombol.forEach(function (b, i) {
    function pilih() { if (aktif !== i) { aktif = i; tata(); } }
    b.addEventListener('pointerenter', pilih);
    b.addEventListener('focus', pilih);
  });
  window.addEventListener('resize', tata);
  document.addEventListener('bahasa-berubah', function () { requestAnimationFrame(tata); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(tata);
  tata();
})();
