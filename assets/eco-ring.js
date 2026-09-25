/* ===========================================================
   Section 02: sosok "Anda" dari kaca di taman hologram, dikelilingi
   cincin kaca tipis berisi lima elemen ekosistem.

   - cincin berputar pelan; tarik ke samping untuk memutar, tarik ke atas
     atau bawah untuk mengangkat cincin (ia kembali berpegas saat dilepas)
   - klik panel: cincin berhenti, kartu penjelasan lengkap muncul, dan
     tanaman hologram milik elemen itu mekar di taman
   - tombol slide di sisi panggung, titik navigasi, papan ketik, dan
     daftar tombol untuk pembaca layar

   Pencahayaan (pendekatan ray tracing untuk WebGL waktu nyata): pantulan
   dinamis (CubeCamera), lampu berkeliling dan lampu pengikut kursor, bayangan
   asli ke lantai, dan tepi kaca menyala (fresnel).

   Anggaran performa: satu CubeCamera 128 px yang diperbarui tiap empat
   bingkai, seluruh taman hanya tujuh objek garis, tidak dirender saat di luar
   layar, dan bila laju bingkai jatuh pantulan serta bayangan dimatikan sendiri.

   Bergantung pada three.js r128 (global THREE).
   =========================================================== */
(function () {
  var stage = document.getElementById('ecoStage');
  if (!stage || !window.THREE) return;
  var THREE = window.THREE;
  var akar = document.getElementById('eco3');
  var info = document.getElementById('ecoInfo');
  var a11y = document.getElementById('ecoA11y');
  var det = document.getElementById('ecoDetail');
  var tPrev = stage.querySelector('.eco3-prev'), tNext = stage.querySelector('.eco3-next');
  var elTitik = info && info.querySelector('.ei-titik');

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  var D = Math.PI / 180;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { return; }
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  var kanvas = renderer.domElement;
  kanvas.setAttribute('aria-hidden', 'true');
  stage.appendChild(kanvas);

  var scene = new THREE.Scene();
  /* lensa sempit dan jauh: cincin lebar tanpa distorsi sudut lebar */
  var JARAK = 26, FOV = 11;
  var kamera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  var ELEV = 14 * D;
  kamera.position.set(0, JARAK * Math.sin(ELEV), JARAK * Math.cos(ELEV));
  kamera.lookAt(0, 0, 0);

  /* ---------- peta pantulan studio ---------- */
  function lukisEnv(mode) {
    var c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    var g = c.getContext('2d');
    var lat = g.createLinearGradient(0, 0, 0, 256);
    if (mode === 'gelap') {
      lat.addColorStop(0, '#26272d'); lat.addColorStop(0.4, '#0b0b0d'); lat.addColorStop(1, '#020203');
    } else {
      lat.addColorStop(0, '#ffffff'); lat.addColorStop(0.45, '#eef0f4'); lat.addColorStop(1, '#cfd2da');
    }
    g.fillStyle = lat; g.fillRect(0, 0, 512, 256);
    if (mode === 'gelap') {
      g.fillStyle = 'rgba(255,255,255,.95)'; g.fillRect(40, 15, 180, 45);
      g.fillStyle = 'rgba(255,255,255,.8)';  g.fillRect(290, 22, 120, 32);
      g.fillStyle = 'rgba(255,255,255,.8)';  g.fillRect(125, 95, 11, 100);
      g.fillStyle = 'rgba(255,255,255,.8)';  g.fillRect(380, 95, 11, 100);
      g.fillStyle = 'rgba(255,255,255,.5)';  g.fillRect(250, 100, 8, 90);
    } else {
      g.fillStyle = 'rgba(60,64,78,.8)';     g.fillRect(125, 85, 17, 115);
      g.fillStyle = 'rgba(60,64,78,.8)';     g.fillRect(380, 85, 17, 115);
      g.fillStyle = 'rgba(90,94,106,.6)';    g.fillRect(245, 90, 10, 105);
    }
    var t = new THREE.CanvasTexture(c);
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.encoding = THREE.sRGBEncoding;
    var pm = new THREE.PMREMGenerator(renderer);
    var env = pm.fromEquirectangular(t).texture;
    t.dispose(); pm.dispose();
    return env;
  }
  var ENV = { gelap: lukisEnv('gelap'), terang: lukisEnv('terang') };

  /* ---------- lampu: utama (bayangan), berkeliling, pengikut kursor ---------- */
  var lampuUtama = new THREE.DirectionalLight(0xffffff, 0.55);
  lampuUtama.castShadow = true;
  lampuUtama.shadow.mapSize.set(512, 512);
  lampuUtama.shadow.bias = -0.0008;
  lampuUtama.shadow.radius = 4;
  scene.add(lampuUtama); scene.add(lampuUtama.target);
  var lampuKeliling = new THREE.PointLight(0xffffff, 1.0, 0, 1);
  scene.add(lampuKeliling);
  var lampuKursor = new THREE.PointLight(0xffffff, 0, 0, 1.5);
  scene.add(lampuKursor);
  scene.add(new THREE.AmbientLight(0xffffff, 0.05));

  /* ---------- data ---------- */
  var PANEL = [
    { nama: 'Mentor', judul: 'Mentor', d: 'node.mentor.d', kunci: 'eco.mentor',
      ikon: 'M12 8a3 3 0 1 1-6 0a3 3 0 0 1 6 0zM3 20a6 6 0 0 1 12 0M17 6a3 3 0 0 1 0 6M15 20a6 6 0 0 0-1-3.3' },
    { nama: 'Career', judul: 'Career & Opportunity', d: 'node.career.d', kunci: 'eco.career',
      ikon: 'M3 9h18v11H3zM9 9V5h6v4M3 14h18' },
    { nama: 'Community', judul: 'Community', d: 'node.comm.d', kunci: 'eco.comm',
      ikon: 'M14.4 5a2.4 2.4 0 1 1-4.8 0a2.4 2.4 0 0 1 4.8 0zM7.4 18a2.4 2.4 0 1 1-4.8 0a2.4 2.4 0 0 1 4.8 0zM21.4 18a2.4 2.4 0 1 1-4.8 0a2.4 2.4 0 0 1 4.8 0zM10.6 6.9L6.4 15.8M13.4 6.9l4.2 8.9M7.4 18h9.2' },
    { nama: 'Business', judul: 'Business', d: 'node.biz.d', kunci: 'eco.biz',
      ikon: 'M4 20h16M7 20V11M12 20V6M17 20v-6' },
    { nama: 'Capital', judul: 'Capital', d: 'node.cap.d', kunci: 'eco.cap',
      ikon: 'M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0zM12 7v10M14.5 9.2c-.6-.9-1.6-1.2-2.7-1.2-1.5 0-2.6.8-2.6 2s1 1.8 2.6 2.1c1.7.3 2.8.9 2.8 2.2s-1.2 2.1-2.8 2.1c-1.3 0-2.4-.5-3-1.5' }
  ];
  var N = PANEL.length;
  var SUD = (Math.PI * 2) / N;
  function modN(k) { return ((k % N) + N) % N; }
  function rotStop(k) { return -k * SUD; }
  function indeksDari(rot) { return Math.round(-rot / SUD); }

  /* semua objek dunia berada di grup ini (satuan: jari-jari cincin = 1) */
  var dunia = new THREE.Group();
  scene.add(dunia);

  /* ---------- cincin tipis: panel kaca berujung bulat ---------- */
  var R_LUAR = 1, R_DALAM = 0.93, TINGGI = 0.3, CELAH = 0.045;
  var BEVEL_T = 0.03, BEVEL_S = 0.02;

  function panelGeo(k) {
    var th = k * SUD, b0 = th - SUD / 2 - 90 * D, b1 = th + SUD / 2 - 90 * D, g = CELAH / 2;
    var a0o = b0 + Math.asin(g / R_LUAR), a1o = b1 - Math.asin(g / R_LUAR);
    var a0i = b0 + Math.asin(g / R_DALAM), a1i = b1 - Math.asin(g / R_DALAM);
    var s = new THREE.Shape();
    s.moveTo(R_LUAR * Math.cos(a0o), R_LUAR * Math.sin(a0o));
    s.absarc(0, 0, R_LUAR, a0o, a1o, false);
    s.lineTo(R_DALAM * Math.cos(a1i), R_DALAM * Math.sin(a1i));
    s.absarc(0, 0, R_DALAM, a1i, a0i, true);
    s.closePath();
    var geo = new THREE.ExtrudeGeometry(s, {
      depth: TINGGI - 2 * BEVEL_T, bevelEnabled: true, bevelThickness: BEVEL_T, bevelSize: BEVEL_S,
      bevelOffset: -BEVEL_S, bevelSegments: 4, curveSegments: 36
    });
    geo.translate(0, 0, -(TINGGI - 2 * BEVEL_T) / 2);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }

  var tilt = new THREE.Group();
  var cincin = new THREE.Group();
  tilt.add(cincin);
  dunia.add(tilt);

  var meshes = [], bahan = [], label = [];

  /* label di permukaan luar panel; kanvas sama rasio dengan permukaannya agar huruf tidak melebar */
  var LEBAR_LABEL = SUD - 0.13;
  var TINGGI_LABEL = TINGGI * 0.84;
  var LC_W = 1400, LC_H = Math.round(LC_W / (R_LUAR * LEBAR_LABEL / TINGGI_LABEL));
  function labelMesh(k) {
    var c = document.createElement('canvas');
    c.width = LC_W; c.height = LC_H;
    var tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;
    var geo = new THREE.CylinderGeometry(R_LUAR + 0.004, R_LUAR + 0.004, TINGGI_LABEL, 48, 1, true,
      k * SUD - LEBAR_LABEL / 2, LEBAR_LABEL);
    var m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      map: tex, transparent: true, depthWrite: false, toneMapped: false, side: THREE.FrontSide
    }));
    cincin.add(m);
    label.push({ mesh: m, kanvas: c, tekstur: tex, path: new Path2D(PANEL[k].ikon), k: k });
  }

  /* tepi kaca menyala (fresnel) */
  var rimUniform = { value: new THREE.Color(0xffffff) };
  var rimKuat = { value: 0.5 };
  function pasangFresnel(m) {
    m.onBeforeCompile = function (sh) {
      sh.uniforms.uRim = rimUniform;
      sh.uniforms.uRimKuat = rimKuat;
      sh.fragmentShader = sh.fragmentShader
        .replace('void main() {', 'uniform vec3 uRim;\nuniform float uRimKuat;\nvoid main() {')
        .replace('#include <tonemapping_fragment>',
          'float fres = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), 2.4);\n' +
          'gl_FragColor.rgb += uRim * fres * uRimKuat;\n' +
          'gl_FragColor.a = clamp(gl_FragColor.a + fres * 0.45, 0.0, 1.0);\n' +
          '#include <tonemapping_fragment>');
    };
  }

  PANEL.forEach(function (p, k) {
    var mat = new THREE.MeshPhysicalMaterial({
      metalness: 0, clearcoat: 1, transparent: true, depthWrite: false, side: THREE.DoubleSide
    });
    pasangFresnel(mat);
    var mesh = new THREE.Mesh(panelGeo(k), mat);
    mesh.userData.indeks = k;
    mesh.castShadow = true;
    cincin.add(mesh);
    meshes.push(mesh); bahan.push(mat);
    labelMesh(k);
  });

  /* ---------- sosok manusia dari kaca ---------- */
  function kapsul(r, L) {
    var pts = [], n = 5, i, a;
    for (i = 0; i <= n; i++) { a = -Math.PI / 2 + i * (Math.PI / 2) / n; pts.push(new THREE.Vector2(Math.max(r * Math.cos(a), 0.0001), -L / 2 + r * Math.sin(a))); }
    for (i = 0; i <= n; i++) { a = i * (Math.PI / 2) / n; pts.push(new THREE.Vector2(Math.max(r * Math.cos(a), 0.0001), L / 2 + r * Math.sin(a))); }
    return new THREE.LatheGeometry(pts, 18);
  }
  var sosokMat = new THREE.MeshPhysicalMaterial({ metalness: 0, clearcoat: 1, roughness: 0.08, clearcoatRoughness: 0.03 });
  pasangFresnel(sosokMat);
  var sosok = new THREE.Group();
  function bagian(geo, x, y, z, rz, sx, sy, sz) {
    var m = new THREE.Mesh(geo, sosokMat);
    m.position.set(x, y, z); m.rotation.z = rz || 0; m.scale.set(sx || 1, sy || 1, sz || 1);
    m.castShadow = true;
    sosok.add(m);
  }
  var bola = function (r) { return new THREE.SphereGeometry(r, 20, 14); };
  bagian(bola(0.09), 0, 0, 0, 0, 1.15, 0.8, 0.75);                 /* panggul */
  bagian(kapsul(0.095, 0.17), 0, 0.15, 0, 0, 1.1, 1, 0.68);        /* badan */
  bagian(bola(0.05), 0.125, 0.245, 0); bagian(bola(0.05), -0.125, 0.245, 0);   /* bahu */
  bagian(kapsul(0.028, 0.03), 0, 0.335, 0);                        /* leher */
  bagian(bola(0.066), 0, 0.435, 0.004);                            /* kepala */
  [1, -1].forEach(function (s) {
    bagian(kapsul(0.03, 0.15), s * 0.16, 0.14, 0, -s * 0.12);      /* lengan atas */
    bagian(kapsul(0.026, 0.14), s * 0.185, -0.03, 0, -s * 0.06);   /* lengan bawah */
    bagian(bola(0.03), s * 0.195, -0.14, 0);                       /* tangan */
    bagian(kapsul(0.045, 0.16), s * 0.055, -0.13, 0);              /* paha */
    bagian(kapsul(0.036, 0.16), s * 0.055, -0.36, 0);              /* betis */
    bagian(bola(0.035), s * 0.055, -0.47, 0.03, 0, 1, 0.6, 1.6);   /* kaki */
  });
  var FIG = 0.8, LANTAI_Y = -0.395, KEPALA_Y = 0.5 * FIG;
  sosok.scale.setScalar(FIG);
  dunia.add(sosok);

  /* penanda ANDA di atas kepala: teks, garis tipis, dan berlian kecil */
  var kAnda = document.createElement('canvas');
  kAnda.width = 256; kAnda.height = 160;
  var tAnda = new THREE.CanvasTexture(kAnda);
  tAnda.encoding = THREE.sRGBEncoding;
  var sprAnda = new THREE.Sprite(new THREE.SpriteMaterial({ map: tAnda, transparent: true, depthWrite: false, toneMapped: false }));
  sprAnda.scale.set(0.3, 0.1875, 1);
  sprAnda.renderOrder = 2;
  dunia.add(sprAnda);

  /* ---------- taman hologram: hanya garis ---------- */
  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var R = rng(11);
  function seg(a, x1, y1, z1, x2, y2, z2) { a.push(x1, y1, z1, x2, y2, z2); }
  function lingkarH(a, cx, y, cz, r, n) {                         /* lingkaran mendatar */
    for (var i = 0; i < n; i++) {
      var p = i / n * 6.2832, q = (i + 1) / n * 6.2832;
      seg(a, cx + Math.cos(p) * r, y, cz + Math.sin(p) * r, cx + Math.cos(q) * r, y, cz + Math.sin(q) * r);
    }
  }
  function lingkarV(a, cx, cy, cz, r, n, sudut) {                 /* lingkaran tegak menghadap arah sudut */
    var dx = Math.cos(sudut), dz = Math.sin(sudut);
    for (var i = 0; i < n; i++) {
      var p = i / n * 6.2832, q = (i + 1) / n * 6.2832;
      seg(a, cx + dx * Math.cos(p) * r, cy + Math.sin(p) * r, cz + dz * Math.cos(p) * r,
             cx + dx * Math.cos(q) * r, cy + Math.sin(q) * r, cz + dz * Math.cos(q) * r);
    }
  }

  var LANTAI = [], RUMPUT = [];
  [0.3, 0.6, 0.9].forEach(function (r) { lingkarH(LANTAI, 0, 0, 0, r, 72); });
  for (var sp = 0; sp < 18; sp++) {
    var as = sp / 18 * 6.2832;
    seg(LANTAI, Math.cos(as) * 0.12, 0, Math.sin(as) * 0.12, Math.cos(as) * 0.9, 0, Math.sin(as) * 0.9);
  }
  for (var rb = 0; rb < 240; rb++) {
    var ar = R() * 6.2832, rr = 0.16 + Math.sqrt(R()) * 0.72, hh = 0.02 + R() * 0.05;
    var bx = Math.cos(ar) * rr, bz = Math.sin(ar) * rr;
    seg(RUMPUT, bx, 0, bz, bx + (R() - 0.5) * 0.02, hh, bz + (R() - 0.5) * 0.02);
  }

  function pohon() {                                              /* Mentor */
    var a = [];
    (function cab(x, y, z, dx, dy, dz, len, dep) {
      var nx = x + dx * len, ny = y + dy * len, nz = z + dz * len;
      seg(a, x, y, z, nx, ny, nz);
      if (dep > 0) {
        for (var c = 0; c < 2; c++) {
          var ang = (c ? 1 : -1) * (0.45 + R() * 0.3), az = R() * 6.2832;
          var ex = Math.cos(az), ez = Math.sin(az), ca = Math.cos(ang), sa = Math.sin(ang);
          var ax = dx * ca + ex * sa, ay = dy * ca + 0.28 * sa + 0.05, aa = dz * ca + ez * sa;
          var m = Math.sqrt(ax * ax + ay * ay + aa * aa);
          cab(nx, ny, nz, ax / m, ay / m, aa / m, len * 0.72, dep - 1);
        }
      } else {
        seg(a, nx, ny + 0.02, nz, nx + 0.014, ny, nz); seg(a, nx + 0.014, ny, nz, nx, ny - 0.012, nz);
        seg(a, nx, ny - 0.012, nz, nx - 0.014, ny, nz); seg(a, nx - 0.014, ny, nz, nx, ny + 0.02, nz);
      }
    })(0, 0, 0, 0, 1, 0, 0.09, 4);
    lingkarH(a, 0, 0, 0, 0.05, 16);
    return a;
  }
  function tanamanKarier() {                                      /* Career: pagar rambat */
    var a = [], i;
    for (i = 0; i < 6; i++) { seg(a, -0.05, i * 0.05, 0, -0.05, i * 0.05 + 0.05, 0); seg(a, 0.05, i * 0.05, 0, 0.05, i * 0.05 + 0.05, 0); seg(a, -0.05, i * 0.05 + 0.05, 0, 0.05, i * 0.05 + 0.05, 0); }
    for (i = 0; i < 40; i++) {
      var p = i * 0.55, q = (i + 1) * 0.55;
      seg(a, Math.cos(p) * 0.06, i * 0.0072, Math.sin(p) * 0.06, Math.cos(q) * 0.06, (i + 1) * 0.0072, Math.sin(q) * 0.06);
      if (i % 5 === 3) seg(a, Math.cos(p) * 0.06, i * 0.0072, Math.sin(p) * 0.06, Math.cos(p) * 0.09, i * 0.0072 + 0.02, Math.sin(p) * 0.09);
    }
    lingkarH(a, 0, 0, 0, 0.07, 16);
    return a;
  }
  function bunga() {                                              /* Community */
    var a = [], f;
    for (f = 0; f < 5; f++) {
      var fx = (R() - 0.5) * 0.2, fz = (R() - 0.5) * 0.2, h = 0.12 + R() * 0.14, sy = R() * 6.2832;
      var px = fx, py = 0, pz = fz;
      for (var s = 1; s <= 4; s++) {
        var ny = h * s / 4, nx = fx + Math.sin(s * 0.9) * 0.012, nz = fz;
        seg(a, px, py, pz, nx, ny, nz); px = nx; py = ny; pz = nz;
      }
      lingkarV(a, px, py + 0.03, pz, 0.028, 10, sy);
      for (var pt = 0; pt < 6; pt++) {
        var pa = pt / 6 * 6.2832;
        seg(a, px, py + 0.03, pz, px + Math.cos(sy) * Math.cos(pa) * 0.055, py + 0.03 + Math.sin(pa) * 0.055, pz + Math.sin(sy) * Math.cos(pa) * 0.055);
      }
    }
    lingkarH(a, 0, 0, 0, 0.1, 20);
    return a;
  }
  function batang() {                                             /* Business: batang tumbuh */
    var a = [], i, prev = null;
    for (i = 0; i < 6; i++) {
      var x = -0.1 + i * 0.04, h = 0.07 + i * 0.035;
      seg(a, x, 0, 0, x, h, 0);
      seg(a, x - 0.012, h, 0, x + 0.012, h, 0);
      seg(a, x, h * 0.6, 0, x + 0.018, h * 0.6 + 0.02, 0);
      if (prev) seg(a, prev[0], prev[1], 0, x, h, 0);
      prev = [x, h];
    }
    lingkarH(a, 0, 0, 0, 0.06, 16);
    return a;
  }
  function pohonKoin() {                                          /* Capital */
    var a = [], i;
    var ys = [0.1, 0.16, 0.21, 0.25], rs = [0.05, 0.045, 0.04, 0.03];
    for (i = 0; i < 4; i++) {
      seg(a, 0, i ? ys[i - 1] : 0, 0, 0, ys[i], 0);
      lingkarH(a, 0, ys[i], 0, rs[i], 18);
    }
    seg(a, 0, 0.25, 0, 0, 0.3, 0);
    seg(a, 0, 0.3, 0, 0.02, 0.32, 0); seg(a, 0, 0.3, 0, -0.02, 0.32, 0);
    lingkarH(a, 0, 0, 0, 0.06, 16);
    return a;
  }

  var holoMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.5, depthWrite: false });
  var holoTipis = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.25, depthWrite: false });
  function garis(arr, mat, order) {
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    var l = new THREE.LineSegments(geo, mat);
    l.renderOrder = order; l.frustumCulled = false;
    dunia.add(l);
    return { obj: l, jumlah: arr.length / 6 };
  }
  var taman = garis(LANTAI, holoTipis, 1); taman.obj.position.y = LANTAI_Y;
  var rumput = garis(RUMPUT, holoTipis, 1); rumput.obj.position.y = LANTAI_Y;
  var tanaman = [pohon(), tanamanKarier(), bunga(), batang(), pohonKoin()].map(function (arr, k) {
    var g = garis(arr, holoMat, 3);
    var ang = (k * 72 + 36 + 90) * D;
    g.obj.position.set(Math.cos(ang) * 0.62, LANTAI_Y, Math.sin(ang) * 0.62);
    g.obj.scale.setScalar(1.35); g.tumbuh = 0.2; g.tujuan = 0.2;
    return g;
  });
  function aturTumbuh(g) { g.obj.geometry.setDrawRange(0, Math.max(2, Math.floor(g.jumlah * g.tumbuh)) * 2); }
  tanaman.forEach(aturTumbuh);
  var dikunjungi = [false, false, false, false, false];

  /* kunang-kunang hologram naik pelan */
  var NK = 34, kkPos = new Float32Array(NK * 3), kkFase = [], kkSudut = [], kkJari = [];
  for (var kk = 0; kk < NK; kk++) { kkFase.push(R()); kkSudut.push(R() * 6.2832); kkJari.push(0.15 + R() * 0.7); }
  var kkGeo = new THREE.BufferGeometry();
  kkGeo.setAttribute('position', new THREE.BufferAttribute(kkPos, 3));
  var kkMat = new THREE.PointsMaterial({ size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0.7, depthWrite: false });
  var kunang = new THREE.Points(kkGeo, kkMat);
  kunang.frustumCulled = false; kunang.renderOrder = 4;
  dunia.add(kunang);

  /* lantai penerima bayangan */
  var lantaiMat = new THREE.ShadowMaterial({ opacity: 0.22 });
  var lantai = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), lantaiMat);
  lantai.rotation.x = -Math.PI / 2; lantai.position.y = LANTAI_Y;
  lantai.receiveShadow = true;
  dunia.add(lantai);

  /* ---------- pantulan dinamis: satu CubeCamera kecil ---------- */
  var rtCincin = new THREE.WebGLCubeRenderTarget(128, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
  var camCincin = new THREE.CubeCamera(0.1, 200, rtCincin);
  scene.add(camCincin);
  var pantulanHidup = true, nomorBingkai = 0;
  function perbaruiPantulan() {
    if (!pantulanHidup) return;
    scene.background = gelap() ? ENV.terang : ENV.gelap;
    cincin.visible = false;
    camCincin.position.set(dunia.position.x, dunia.position.y + 0.1 * ukuran, 0);
    camCincin.update(renderer, scene);
    cincin.visible = true;
    scene.background = null;
  }

  /* ---------- tema ---------- */
  function gelap() { return document.documentElement.classList.contains('dark-theme'); }

  function bungkus(x, teks, maks) {
    var kata = String(teks).split(/(\s+)/), baris = [], b = '';
    if (kata.length < 2 && teks.length > 12) kata = teks.split('');
    kata.forEach(function (w) {
      var coba = b + w;
      if (x.measureText(coba).width > maks && b) { baris.push(b.trim()); b = w.trim() ? w : ''; }
      else b = coba;
    });
    if (b.trim()) baris.push(b.trim());
    return baris.slice(0, 2);
  }

  var FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
  function lukisLabel(g) {
    var ink = g ? '#0a0a0d' : '#ffffff';
    var u = LC_H / 100;
    label.forEach(function (l) {
      var x = l.kanvas.getContext('2d');
      x.clearRect(0, 0, LC_W, LC_H);
      x.fillStyle = ink; x.strokeStyle = ink;
      x.textBaseline = 'alphabetic';
      var ls = 'letterSpacing' in x;
      x.font = '500 ' + (u * 26) + 'px ' + FONT;
      if (ls) x.letterSpacing = (-u * 1.6) + 'px';
      var wNama = x.measureText(PANEL[l.k].nama).width;
      x.font = '400 ' + (u * 12.5) + 'px ' + FONT;
      if (ls) x.letterSpacing = '0px';
      var baris = bungkus(x, t(PANEL[l.k].d), 720);
      var wDesc = 0;
      baris.forEach(function (b) { wDesc = Math.max(wDesc, x.measureText(b).width); });
      var wTeks = Math.max(wNama, wDesc, u * 30);
      var dLingkar = LC_H * 0.6, jarak = LC_H * 0.13;
      var awal = (LC_W - (dLingkar + jarak + wTeks)) / 2;
      var cx = awal + dLingkar / 2, cy = LC_H * 0.5;

      x.save();
      x.globalAlpha = 0.55; x.lineWidth = u * 1.1;
      x.beginPath(); x.arc(cx, cy, dLingkar / 2, 0, Math.PI * 2); x.stroke();
      x.restore();
      x.save();
      x.translate(cx, cy); x.scale(u * 1.25, u * 1.25); x.translate(-12, -12);
      x.lineWidth = 1.6; x.lineCap = 'round'; x.lineJoin = 'round';
      x.stroke(l.path);
      x.restore();

      var tx = awal + dLingkar + jarak;
      x.globalAlpha = 0.6;
      x.font = '500 ' + (u * 9.5) + 'px ' + FONT;
      if (ls) x.letterSpacing = (u * 2) + 'px';
      x.fillText('0' + (l.k + 1) + ' / 0' + N, tx, u * 24);
      x.globalAlpha = 1;
      x.font = '500 ' + (u * 26) + 'px ' + FONT;
      if (ls) x.letterSpacing = (-u * 1.6) + 'px';
      x.fillText(PANEL[l.k].nama, tx, u * 52);
      x.globalAlpha = 0.8;
      x.font = '400 ' + (u * 12.5) + 'px ' + FONT;
      if (ls) x.letterSpacing = '0px';
      baris.forEach(function (b, i) { x.fillText(b, tx, u * (69 + i * 15)); });
      x.globalAlpha = 1;
      l.tekstur.needsUpdate = true;
    });

    /* penanda ANDA */
    var xa = kAnda.getContext('2d');
    xa.clearRect(0, 0, 256, 160);
    xa.fillStyle = xa.strokeStyle = g ? '#ffffff' : '#0a0a0d';
    xa.textAlign = 'center'; xa.textBaseline = 'alphabetic';
    xa.font = '600 40px ' + FONT;
    if ('letterSpacing' in xa) xa.letterSpacing = '10px';
    xa.fillText((t('node.anda') || 'Anda').toUpperCase(), 133, 52);
    xa.lineWidth = 2;
    xa.beginPath(); xa.moveTo(128, 70); xa.lineTo(128, 128); xa.stroke();
    xa.beginPath(); xa.moveTo(128, 154); xa.lineTo(140, 141); xa.lineTo(128, 128); xa.lineTo(116, 141); xa.closePath(); xa.fill();
    tAnda.needsUpdate = true;
  }

  function terapkanTema() {
    var g = gelap();
    scene.environment = g ? ENV.terang : ENV.gelap;
    lampuUtama.intensity = g ? 0.3 : 0.55;
    lampuKeliling.intensity = g ? 0.9 : 1.1;
    lantaiMat.opacity = g ? 0 : 0.22;
    rimUniform.value.set(g ? 0xffffff : 0xdfe3ec);
    rimKuat.value = g ? 0.34 : 0.55;
    bahan.forEach(function (m) {
      if (g) {
        m.color.set(0xffffff); m.opacity = 0.34; m.roughness = 0.05; m.clearcoatRoughness = 0.03; m.envMapIntensity = 1.0;
      } else {
        m.color.set(0x0c0d11); m.opacity = 0.6; m.roughness = 0.04; m.clearcoatRoughness = 0.02; m.envMapIntensity = 1.1;
      }
      m.envMap = pantulanHidup ? rtCincin.texture : null;
      m.needsUpdate = true;
    });
    sosokMat.color.set(g ? 0xffffff : 0x000000);
    sosokMat.envMapIntensity = g ? 0.9 : 1.5;
    sosokMat.needsUpdate = true;
    var warna = g ? 0xffffff : 0x2b2e38;
    holoMat.color.set(warna); holoTipis.color.set(warna); kkMat.color.set(warna);
    holoMat.userData.dasar = g ? 0.75 : 0.75;
    holoTipis.userData.dasar = g ? 0.36 : 0.38;
    lukisLabel(g);
  }

  /* ---------- tata letak ---------- */
  var lebar = 0, tinggi = 0, jari = 100, ppu = 1, ukuran = 1;
  var skala = 1, skalaTuju = 1, geser = 0, geserTuju = 0, yOff = 0;
  function ukur() {
    var r = stage.getBoundingClientRect();
    lebar = Math.max(1, Math.round(r.width));
    tinggi = Math.max(1, Math.round(r.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(lebar, tinggi, false);
    kamera.aspect = lebar / tinggi;
    var tinggiDunia = 2 * Math.tan((kamera.fov * Math.PI) / 360) * JARAK;
    ppu = tinggi / tinggiDunia;
    jari = Math.min(lebar * (lebar < 700 ? 0.44 : 0.4), tinggi * 0.74);
    ukuran = jari / ppu;
    yOff = (0.5 - 0.53) * tinggi / ppu;
    terapDunia();
    var s = ukuran;
    lampuUtama.position.set(0.9 * s, 3.4 * s, 1.5 * s);
    lampuUtama.target.position.set(0, 0, 0);
    var sc = lampuUtama.shadow.camera;
    sc.left = -1.6 * s; sc.right = 1.6 * s; sc.top = 1.6 * s; sc.bottom = -1.6 * s;
    sc.near = 0.5 * s; sc.far = 8 * s; sc.updateProjectionMatrix();
    lampuKursor.distance = 2.6 * s;
    kamera.updateProjectionMatrix();
    geserTuju = detIdx >= 0 && lebar >= 900 ? -0.16 * lebar / ppu : 0;
    stage.style.setProperty('--cy', (tinggi * 0.54) + 'px');
  }
  function terapDunia() {
    dunia.scale.setScalar(ukuran * skala);
    dunia.position.set(geser, yOff, 0);
  }

  /* ---------- deteksi panel ---------- */
  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function panelDi(x, y) {
    var r = stage.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return -1;
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    scene.updateMatrixWorld(true);
    ray.setFromCamera(ndc, kamera);
    var hit = ray.intersectObjects(meshes, false)[0];
    return hit ? hit.object.userData.indeks : -1;
  }

  /* ---------- teks dan kartu detail ---------- */
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
  var aktif = 0, sudahTampil = false, detIdx = -1, fokusSebelum = null;
  var dEl = det && {
    no: det.querySelector('.ed-no'), judul: det.querySelector('.ed-judul'),
    lead: det.querySelector('.ed-lead'), list: det.querySelector('.ed-list'),
    tutup: det.querySelector('.ed-tutup')
  };
  function isiDetail(k) {
    if (!dEl) return;
    var P = PANEL[k];
    dEl.no.textContent = '0' + (k + 1) + ' / 0' + N;
    dEl.judul.textContent = P.judul;
    dEl.lead.innerHTML = t(P.kunci + '.p');
    dEl.list.innerHTML = [1, 2, 3].map(function (i) { return '<li>' + t(P.kunci + '.' + i) + '</li>'; }).join('');
  }
  function bukaDetail(k) {
    if (!det) return;
    var barisBaru = detIdx < 0;
    detIdx = k;
    isiDetail(k);
    if (barisBaru) {
      fokusSebelum = document.activeElement;
      det.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { det.classList.add('on'); }); });
      if (akar) akar.classList.add('buka');
      if (dEl.tutup) setTimeout(function () { dEl.tutup.focus({ preventScroll: true }); }, 60);
    }
    skalaTuju = lebar >= 900 ? 0.82 : 1;
    geserTuju = lebar >= 900 ? -0.16 * lebar / ppu : 0;
  }
  function tutupDetail() {
    if (detIdx < 0) return;
    detIdx = -1;
    det.classList.remove('on');
    if (akar) akar.classList.remove('buka');
    setTimeout(function () { if (detIdx < 0) det.hidden = true; }, 450);
    skalaTuju = 1; geserTuju = 0;
    jedaSampai = performance.now() + 2500;
    if (fokusSebelum && fokusSebelum.focus) { try { fokusSebelum.focus({ preventScroll: true }); } catch (e) {} }
  }
  if (dEl && dEl.tutup) dEl.tutup.addEventListener('click', tutupDetail);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') tutupDetail(); });

  function targetTumbuh() {
    tanaman.forEach(function (g, k) { g.tujuan = k === aktif ? 1 : dikunjungi[k] ? 0.6 : 0.2; });
  }
  function setAktif(k) {
    k = modN(k);
    if (sudahTampil && k === aktif) return;
    aktif = k; dikunjungi[k] = true;
    targetTumbuh();
    if (elTitik) Array.prototype.forEach.call(elTitik.children, function (b, i) { b.classList.toggle('on', i === k); b.setAttribute('aria-current', i === k ? 'true' : 'false'); });
    if (detIdx >= 0) { detIdx = k; isiDetail(k); }
    sudahTampil = true;
  }
  document.addEventListener('bahasa-berubah', function () { if (detIdx >= 0) isiDetail(detIdx); lukisLabel(gelap()); });

  if (elTitik) {
    elTitik.innerHTML = PANEL.map(function (p, k) {
      return '<button type="button" data-k="' + k + '" aria-label="' + p.judul + '"></button>';
    }).join('');
    elTitik.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-k]');
      if (b) menujuKe(+b.dataset.k, true);
    });
  }
  if (a11y) {
    a11y.innerHTML = PANEL.map(function (p, k) {
      return '<button type="button" data-k="' + k + '">' + p.judul + '</button>';
    }).join('');
    a11y.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-k]');
      if (b) { menujuKe(+b.dataset.k, true); bukaDetail(+b.dataset.k); }
    });
  }

  /* ---------- gerak ---------- */
  var KECEPATAN_AUTO = 0.2;
  var rot = 0, vRot = 0, sasaran = null;
  var wx = 0, wz = 0, vwx = 0, vwz = 0;            /* goyang berpegas */
  var angkat = 0, vAngkat = 0, angkatTuju = 0;     /* cincin diangkat/diturunkan */
  var seret = null, pLalu = null, jedaSampai = 0, dalam = false, dorong = 0;
  var kursorX = 0, kursorY = 0, kursorAda = false, kuatKursor = 0;

  function menujuKe(k, jeda) {
    var kc = indeksDari(rot);
    var beda = modN(k - kc + 2) - 2;
    sasaran = rotStop(kc + beda);
    if (jeda) jedaSampai = performance.now() + 6000;
    setAktif(k);
  }
  if (tPrev) tPrev.addEventListener('click', function () { menujuKe(aktif - 1, true); });
  if (tNext) tNext.addEventListener('click', function () { menujuKe(aktif + 1, true); });

  window.addEventListener('pointermove', function (e) {
    var r = stage.getBoundingClientRect();
    kursorAda = e.clientX >= r.left - 40 && e.clientX <= r.right + 40 && e.clientY >= r.top - 40 && e.clientY <= r.bottom + 40;
    if (kursorAda) {
      kursorX = ((e.clientX - r.left) / r.width) * 2 - 1;
      kursorY = -((e.clientY - r.top) / r.height) * 2 + 1;
    }
    if (seret) {
      var dx = e.clientX - seret.x;
      var d = dx / (jari * skala);
      rot += d; vRot = 0;
      var dt = Math.max((e.timeStamp - seret.t) / 1000, 0.008);
      dorong = Math.max(-8, Math.min(8, dorong * 0.5 + (d / dt) * 0.5));
      seret.gerak += Math.abs(dx) + Math.abs(e.clientY - seret.y);
      seret.x = e.clientX; seret.y = e.clientY; seret.t = e.timeStamp;
      /* geser vertikal: cincin naik turun mengikuti kursor */
      angkatTuju = Math.max(-0.5, Math.min(0.5, -(e.clientY - seret.y0) / (jari * skala)));
      sasaran = null;
      setAktif(indeksDari(rot));
      return;
    }
    var h = panelDi(e.clientX, e.clientY);
    dalam = h >= 0;
    stage.style.cursor = h >= 0 ? 'grab' : '';
    if (h >= 0 && !reduce) {
      if (pLalu) {
        var dtp = Math.max((e.timeStamp - pLalu.t) / 1000, 0.008);
        var vx = (e.clientX - pLalu.x) / dtp, vy = (e.clientY - pLalu.y) / dtp;
        var kx = Math.max(-1, Math.min(1, vx / 1300)), ky = Math.max(-1, Math.min(1, vy / 1300));
        vwz = Math.max(-2.2, Math.min(2.2, vwz - kx * 0.5));
        vwx = Math.max(-2.2, Math.min(2.2, vwx + ky * 0.5));
      }
      pLalu = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    } else pLalu = null;
  }, { passive: true });

  stage.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (panelDi(e.clientX, e.clientY) < 0) return;
    seret = { x: e.clientX, y: e.clientY, y0: e.clientY, t: e.timeStamp, awal: e.timeStamp, gerak: 0 };
    dorong = 0; sasaran = null; vRot = 0; angkatTuju = 0;
    try { stage.setPointerCapture(e.pointerId); } catch (x) {}
    stage.style.cursor = 'grabbing';
  });
  function lepas(e) {
    if (!seret) return;
    var klik = seret.gerak < 6 && (e.timeStamp - seret.awal) < 450;
    seret = null;
    angkatTuju = 0;
    jedaSampai = performance.now() + 5000;
    if (klik) {
      var h = panelDi(e.clientX, e.clientY);
      if (h >= 0) { menujuKe(h, true); bukaDetail(h); dorong = 0; return; }
    }
    var kc = indeksDari(rot + dorong * 0.22);
    sasaran = rotStop(kc);
    setAktif(kc);
    dorong = 0;
    stage.style.cursor = '';
  }
  stage.addEventListener('pointerup', lepas);
  stage.addEventListener('pointercancel', lepas);
  window.addEventListener('pointerleave', function () { dalam = false; pLalu = null; kursorAda = false; });

  /* ---------- gambar ---------- */
  var tampil = true, lalu = 0, waktu = 0, emaDt = 0.016, hitungBingkai = 0;
  var tujuan = new THREE.Vector3();

  function urutanKedalaman() {
    var daftar = meshes.map(function (m, k) { return { k: k, z: Math.cos(k * SUD + rot) }; })
      .sort(function (a, b) { return a.z - b.z; });
    daftar.forEach(function (o, i) {
      meshes[o.k].renderOrder = 10 + i * 2;
      label[o.k].mesh.renderOrder = 11 + i * 2;
    });
  }

  function langkah(dt) {
    vwx += (-70 * wx - 5.6 * vwx) * dt; wx += vwx * dt;
    vwz += (-70 * wz - 5.6 * vwz) * dt; wz += vwz * dt;
    wx = Math.max(-0.3, Math.min(0.3, wx)); wz = Math.max(-0.3, Math.min(0.3, wz));

    /* ketinggian cincin: mengikuti kursor saat ditarik, kembali berpegas saat dilepas */
    if (seret) { angkat += (angkatTuju - angkat) * Math.min(1, dt * 14); vAngkat = 0; }
    else { vAngkat += (-90 * angkat - 12 * vAngkat) * dt; angkat += vAngkat * dt; }

    if (!seret) {
      if (sasaran !== null) {
        var galat = sasaran - rot;
        var K = reduce ? 400 : 90, C = reduce ? 40 : 14;
        vRot += (galat * K - vRot * C) * dt;
        rot += vRot * dt;
        if (Math.abs(sasaran - rot) < 0.0015 && Math.abs(vRot) < 0.03) { rot = sasaran; vRot = 0; sasaran = null; }
        setAktif(indeksDari(sasaran !== null ? sasaran : rot));
      } else if (!reduce && detIdx < 0 && performance.now() > jedaSampai) {
        rot -= KECEPATAN_AUTO * (dalam ? 0.25 : 1) * dt;
        setAktif(indeksDari(rot));
      }
    }
    cincin.rotation.y = rot;
    tilt.rotation.set(wx + angkatTuju * 0.2 * (seret ? 1 : 0), 0, wz);
    tilt.position.y = angkat;
    waktu += dt;

    /* dunia bergeser dan mengecil saat kartu detail terbuka */
    var lerp = Math.min(1, dt * 6);
    skala += (skalaTuju - skala) * lerp;
    geser += (geserTuju - geser) * lerp;
    terapDunia();

    /* sosok bernapas pelan, penanda ANDA melayang */
    sosok.rotation.y = Math.sin(waktu * 0.5) * 0.28;
    sprAnda.position.set(0, KEPALA_Y + 0.14 + Math.sin(waktu * 1.6) * 0.012, 0);

    /* taman tumbuh menuju targetnya */
    tanaman.forEach(function (g) {
      if (Math.abs(g.tujuan - g.tumbuh) > 0.002) { g.tumbuh += (g.tujuan - g.tumbuh) * Math.min(1, dt * 2.2); aturTumbuh(g); }
    });
    var kedip = 0.9 + 0.1 * Math.sin(waktu * 3.1);
    holoMat.opacity = (holoMat.userData.dasar || 0.6) * kedip;
    holoTipis.opacity = (holoTipis.userData.dasar || 0.3) * (0.85 + 0.15 * Math.sin(waktu * 2.3 + 1));
    for (var i = 0; i < NK; i++) {
      var f = (kkFase[i] + waktu * 0.05 * (0.6 + i % 5 * 0.15)) % 1, a = kkSudut[i] + waktu * 0.2;
      kkPos[i * 3] = Math.cos(a) * kkJari[i];
      kkPos[i * 3 + 1] = LANTAI_Y + f * 0.85;
      kkPos[i * 3 + 2] = Math.sin(a) * kkJari[i];
    }
    kkGeo.attributes.position.needsUpdate = true;

    /* lampu berkeliling */
    var s = ukuran;
    lampuKeliling.position.set(Math.cos(waktu * 0.5) * 1.8 * s + geser, 1.0 * s, Math.sin(waktu * 0.5) * 1.8 * s + 0.6 * s);
    var ingin = kursorAda && !reduce ? 1 : 0;
    kuatKursor += (ingin - kuatKursor) * Math.min(1, dt * 6);
    lampuKursor.intensity = 2.4 * kuatKursor;
    if (kuatKursor > 0.01) {
      ndc.set(kursorX, kursorY);
      ray.setFromCamera(ndc, kamera);
      tujuan.copy(ray.ray.origin).addScaledVector(ray.ray.direction, JARAK - 1.0 * s);
      lampuKursor.position.lerp(tujuan, Math.min(1, dt * 10));
    }
    urutanKedalaman();
  }

  function matikanPantulan() {
    pantulanHidup = false; lampuUtama.castShadow = false; scene.background = null;
    bahan.forEach(function (m) { m.envMap = null; m.needsUpdate = true; });
  }
  function bingkai(tm) {
    requestAnimationFrame(bingkai);
    if (!tampil) { lalu = tm; return; }
    var dt = lalu ? Math.min((tm - lalu) / 1000, 0.033) : 0.016;
    lalu = tm;
    /* perangkat lambat: pantulan dan bayangan dimatikan, semuanya tetap berjalan */
    emaDt += (dt - emaDt) * 0.05;
    if (++hitungBingkai === 120 && emaDt > 0.032 && pantulanHidup) matikanPantulan();
    langkah(dt);
    if (++nomorBingkai % 4 === 0) perbaruiPantulan();
    renderer.render(scene, kamera);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { tampil = e[0].isIntersecting; }, { threshold: 0 }).observe(stage);
  }
  if ('ResizeObserver' in window) new ResizeObserver(ukur).observe(stage);
  else window.addEventListener('resize', ukur);
  new MutationObserver(terapkanTema).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { lukisLabel(gelap()); });

  ukur();
  terapkanTema();
  setAktif(0);
  requestAnimationFrame(bingkai);
  stage.classList.add('siap');

  window.__ecoRing = {
    render: function () { langkah(0); perbaruiPantulan(); renderer.render(scene, kamera); },
    langkah: function (detik) { var n = Math.round(detik / 0.016); for (var i = 0; i < n; i++) langkah(0.016); perbaruiPantulan(); renderer.render(scene, kamera); },
    pilih: function (k) { menujuKe(k, true); },
    buka: function (k) { menujuKe(k, true); bukaDetail(k); },
    tutup: tutupDetail,
    lompat: function () { if (sasaran !== null) { rot = sasaran; vRot = 0; sasaran = null; } this.render(); },
    panelDi: panelDi,
    pantulan: function (hidup) { if (!hidup) matikanPantulan(); else pantulanHidup = true; },
    status: function () { return { aktif: aktif, rot: rot / D, jari: jari, lebar: lebar, tinggi: tinggi, detail: detIdx, angkat: angkat, skala: skala }; }
  };
})();
