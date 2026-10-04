/* ===========================================================
   Section Introducing: sosok "Anda" 3D di taman, dikelilingi simpul kaca.

   - sosok: model manusia Universal Base Characters (Quaternius, CC0),
     dipadatkan ke assets/model/sosok.glb (291 KB), bahan kaca hitam mengilap
     (putih di tema gelap), pose berdiri, bernapas, kepala menoleh ke simpul
     yang baru tersambung atau ke kursor
   - taman: piringan tanah, ribuan helai rumput bergoyang (shader), bunga
     berwarna yang mekar mengikuti gulir, semak dan batu
   - gulir (panggung menempel): simpul tersambung satu per satu lewat garis
     cahaya yang ditarik dari dada sosok; kamera mundur perlahan
   - klik simpul: kartu penjelasan lengkap
   Model dan GLTFLoader baru dimuat saat section mendekati layar.
   =========================================================== */
(function () {
  var root = document.getElementById('eco4');
  if (!root) return;
  var scene = root.querySelector('.eco4-scene');
  var host = document.getElementById('e5Fig');
  var label = document.getElementById('e5Anda');
  var svg = document.getElementById('e5Beams');
  var det = document.getElementById('ecoDetail');
  var nodes = Array.prototype.slice.call(root.querySelectorAll('.e5-n'));
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var N = nodes.length;
  var SUDUT = [-50, -130, -12, -168, 14, 166, 38, 142];

  function bahasa() { var l = (document.documentElement.lang || 'id').slice(0, 2); return l === 'zh' ? 'zh' : l === 'en' ? 'en' : 'id'; }
  function t(k) {
    var K = window.CATALYST_I18N; if (!K) return '';
    var v = K[bahasa()] && K[bahasa()][k];
    return v != null ? v : (K.id && K.id[k]) || '';
  }
  function jepit(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function halus(x) { return x * x * (3 - 2 * x); }

  /* ---------- garis dan titik cahaya ---------- */
  var beams = [], pulses = [], panjang = [];
  nodes.forEach(function (n, i) {
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('class', 'e5-beam'); p.setAttribute('id', 'e5p' + i);
    svg.appendChild(p); beams.push(p);
    var c = document.createElementNS(NS, 'circle');
    c.setAttribute('class', 'e5-pulse'); c.setAttribute('r', '2.6');
    var am = document.createElementNS(NS, 'animateMotion');
    am.setAttribute('dur', (2.4 + (i % 3) * 0.35) + 's'); am.setAttribute('repeatCount', 'indefinite');
    am.setAttribute('begin', (-i * 0.37) + 's'); am.setAttribute('keyPoints', '1;0'); am.setAttribute('keyTimes', '0;1'); am.setAttribute('calcMode', 'linear');
    var mp = document.createElementNS(NS, 'mpath'); mp.setAttribute('href', '#e5p' + i);
    am.appendChild(mp); c.appendChild(am);
    if (!reduce) svg.appendChild(c);
    pulses.push(c);
  });

  /* titik asal garis: dada sosok di layar. Diisi dari 3D bila siap. */
  var dada = { x: 0, y: 0, hw: 60, ok: false };
  var W = 1, H = 1, sempit = false;

  function letakSimpul() {
    W = scene.clientWidth; H = scene.clientHeight; sempit = W < 700;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var cx = W / 2, cy = H * 0.5;
    var rx = Math.min(W * 0.36, 520), ry = Math.min(H * 0.38, 270);
    scene.style.setProperty('--r1w', (sempit ? W * 0.8 : rx * 1.72) + 'px');
    scene.style.setProperty('--r1h', (sempit ? H * 0.62 : ry * 1.8) + 'px');
    scene.style.setProperty('--r2w', (sempit ? W * 1.05 : rx * 2.32) + 'px');
    scene.style.setProperty('--r2h', (sempit ? H * 0.86 : ry * 2.44) + 'px');
    nodes.forEach(function (n, i) {
      var a = SUDUT[i] * Math.PI / 180, kanan = Math.cos(a) > 0, x, y;
      if (!sempit) {
        x = cx + rx * Math.cos(a); y = cy + ry * Math.sin(a);
      } else {
        var baris = [1, 1, 2, 0, 2, 3, 3, 0][i];
        var urut = kanan ? [0, -1, 1, -1, 2, -1, 3, -1][i] : [-1, 0, -1, 1, -1, 2, -1, 3][i];
        x = cx + (kanan ? 1 : -1) * Math.max(52, W * 0.15);
        y = H * (0.19 + urut * 0.145);
      }
      n.dataset.kanan = kanan ? '1' : '0';
      n.style.setProperty('--x', x + 'px'); n.style.setProperty('--y', y + 'px');
      n.style.setProperty('--ax', kanan ? '0px' : '-100%');
      n.style.setProperty('--dx', (kanan ? -24 : 24) + 'px');
      n._x = x; n._y = y;
    });
    letakGaris();
  }
  function letakGaris() {
    var ox = dada.ok ? dada.x : W / 2, oy = dada.ok ? dada.y : H * 0.45, hw = dada.ok ? dada.hw : 60;
    nodes.forEach(function (n, i) {
      var ex = n._x, ey = n._y, kanan = n.dataset.kanan === '1';
      var sx = ox + (kanan ? hw : -hw), sy = oy + (ey - oy) * 0.12;
      var mx = sx + (ex - sx) * 0.55;
      beams[i].setAttribute('d', 'M' + sx.toFixed(1) + ' ' + sy.toFixed(1) + ' C' + mx.toFixed(1) + ' ' + sy.toFixed(1) + ' ' + mx.toFixed(1) + ' ' + ey.toFixed(1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1));
      panjang[i] = beams[i].getTotalLength();
      beams[i].style.strokeDasharray = panjang[i] + ' ' + panjang[i];
    });
    terapkanGaris(kini);
  }

  /* ---------- kemajuan gulir ---------- */
  var AWAL = 0.1, JEDA = 0.095, DURASI = 0.1;
  var terakhir = -1;
  function terapkanGaris(p) {
    nodes.forEach(function (n, i) {
      var u = jepit((p - (AWAL + i * JEDA)) / DURASI);
      var gambar = halus(jepit(u / 0.6)), muncul = halus(jepit((u - 0.45) / 0.55));
      beams[i].style.strokeDashoffset = ((panjang[i] || 0) * (1 - gambar)).toFixed(1);
      n.style.setProperty('--t', muncul.toFixed(3));
      var on = u >= 1;
      n.classList.toggle('on', muncul > 0.9);
      beams[i].classList.toggle('on', on);
      pulses[i].classList.toggle('on', on);
      if (u > 0.5) terakhir = i;
    });
    if (p < AWAL) terakhir = -1;
  }
  var tujuan = 0, kini = 0, gerakGulir = false;
  function hitungTujuan() {
    var r = root.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    tujuan = total > 0 ? jepit(-r.top / total) : 1;
  }
  function langkahGulir() {
    kini += (tujuan - kini) * 0.13;
    if (Math.abs(tujuan - kini) < 0.0004) kini = tujuan;
    root.style.setProperty('--p', kini.toFixed(4));
    terapkanGaris(kini);
    if (!gl.siap) { if (kini !== tujuan) requestAnimationFrame(langkahGulir); else gerakGulir = false; }
  }
  function picu() {
    hitungTujuan();
    if (!gl.mulai) { var rr = root.getBoundingClientRect(); if (rr.top < window.innerHeight + 800 && rr.bottom > -800) mulai3D(); }
    if (gl.siap) { mintaGambar(); return; }
    if (!gerakGulir) { gerakGulir = true; requestAnimationFrame(langkahGulir); }
  }

  /* ---------- 3D ---------- */
  var gl = { siap: false };
  var THREE = window.THREE;
  function muatSkrip(src) {
    return new Promise(function (ok, gagal) {
      var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = gagal; document.head.appendChild(s);
    });
  }
  function lukisEnv(renderer, gelap) {
    var c = document.createElement('canvas'); c.width = 512; c.height = 256;
    var g = c.getContext('2d');
    var lat = g.createLinearGradient(0, 0, 0, 256);
    if (gelap) { lat.addColorStop(0, '#1d1e23'); lat.addColorStop(.45, '#08080a'); lat.addColorStop(1, '#020203'); }
    else { lat.addColorStop(0, '#9da2ab'); lat.addColorStop(.5, '#5d616a'); lat.addColorStop(1, '#3a3d44'); }
    g.fillStyle = lat; g.fillRect(0, 0, 512, 256);
    g.fillStyle = 'rgba(255,255,255,1)';
    g.fillRect(40, 18, 170, 46); g.fillRect(300, 26, 120, 34);
    g.fillStyle = 'rgba(255,255,255,.85)';
    g.fillRect(118, 96, 10, 100); g.fillRect(372, 96, 10, 100);
    var tx = new THREE.CanvasTexture(c);
    tx.mapping = THREE.EquirectangularReflectionMapping; tx.encoding = THREE.sRGBEncoding;
    var pm = new THREE.PMREMGenerator(renderer); var env = pm.fromEquirectangular(tx).texture;
    tx.dispose(); pm.dispose();
    return env;
  }
  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function lin(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }
  function mulai3D() {
    if (gl.mulai || !THREE || !host) return;
    gl.mulai = true;
    var loader = THREE.GLTFLoader ? Promise.resolve() : muatSkrip('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js');
    loader.then(bangun3D).catch(function () {});
  }

  function bangun3D() {
    var renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch (e) { return; }
    renderer.setClearColor(0, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);

    var sc = new THREE.Scene();
    var cam = new THREE.PerspectiveCamera(24, 1, 0.1, 60);
    var ENV = { terang: lukisEnv(renderer, false), gelap: lukisEnv(renderer, true) };

    var hemi = new THREE.HemisphereLight(0xffffff, 0x5d6b58, 0.6); sc.add(hemi);
    var kunci = new THREE.DirectionalLight(0xfff6ea, 1.35);
    kunci.position.set(-2.2, 4.2, 3.2); kunci.castShadow = true;
    kunci.shadow.mapSize.set(1024, 1024); kunci.shadow.bias = -0.0004; kunci.shadow.normalBias = 0.02;
    var sk = kunci.shadow.camera; sk.left = -1.6; sk.right = 1.6; sk.top = 2.2; sk.bottom = -0.6; sk.near = 1; sk.far = 10;
    sc.add(kunci);
    var tepi = new THREE.DirectionalLight(0xffffff, 1.2); tepi.position.set(2.5, 2.6, -3); sc.add(tepi);
    var isi = new THREE.DirectionalLight(0xffffff, 0.35); isi.position.set(3, 1.2, 2.5); sc.add(isi);

    /* ---------- taman ---------- */
    var R = 1.15, rand = rng(21);
    var taman = new THREE.Group(); sc.add(taman);
    var tanah = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.93, 0.18, 96, 1, true),
      new THREE.MeshStandardMaterial({ color: lin(0x5a3f2c), roughness: 1 }));
    tanah.position.y = -0.09; tanah.receiveShadow = true; taman.add(tanah);
    var bawah = new THREE.Mesh(new THREE.CircleGeometry(R * 0.93, 96), new THREE.MeshStandardMaterial({ color: lin(0x3e2b1e), roughness: 1 }));
    bawah.rotation.x = Math.PI / 2; bawah.position.y = -0.18; taman.add(bawah);
    var atasGeo = new THREE.CircleGeometry(R, 96);
    var warnaAtas = [], posA = atasGeo.attributes.position;
    for (var ia = 0; ia < posA.count; ia++) {
      var rr = Math.hypot(posA.getX(ia), posA.getY(ia)) / R;
      var cA = lin(0x5aa64c).lerp(lin(0x2c6b30), Math.pow(rr, 1.4));
      warnaAtas.push(cA.r, cA.g, cA.b);
    }
    atasGeo.setAttribute('color', new THREE.Float32BufferAttribute(warnaAtas, 3));
    var atas = new THREE.Mesh(atasGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
    atas.rotation.x = -Math.PI / 2; atas.receiveShadow = true; taman.add(atas);

    /* rumput: satu InstancedMesh, goyang dan tumbuh di shader */
    var helai = new THREE.BufferGeometry();
    var hw = 0.007, hh = 1;
    helai.setAttribute('position', new THREE.Float32BufferAttribute([-hw, 0, 0, hw, 0, 0, -hw * 0.6, hh * 0.5, 0, hw * 0.6, hh * 0.5, 0, 0, hh, 0], 3));
    var cb = lin(0x24572a), cm = lin(0x4f9a44), ct = lin(0x9fd27a);
    helai.setAttribute('color', new THREE.Float32BufferAttribute([cb.r, cb.g, cb.b, cb.r, cb.g, cb.b, cm.r, cm.g, cm.b, cm.r, cm.g, cm.b, ct.r, ct.g, ct.b], 3));
    helai.setIndex([0, 1, 2, 2, 1, 3, 2, 3, 4]);
    helai.computeVertexNormals();
    var seragam = { uWaktu: { value: 0 }, uTumbuh: { value: 0.5 } };
    var bahanRumput = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide });
    bahanRumput.onBeforeCompile = function (s) {
      s.uniforms.uWaktu = seragam.uWaktu; s.uniforms.uTumbuh = seragam.uTumbuh;
      s.vertexShader = 'uniform float uWaktu;\nuniform float uTumbuh;\n' + s.vertexShader.replace('#include <begin_vertex>',
        'vec3 transformed = vec3(position);\n' +
        'float ujung = position.y;\n' +
        'transformed.y *= uTumbuh;\n' +
        'vec3 ip = vec3(instanceMatrix[3]);\n' +
        'transformed.x += sin(uWaktu * 1.6 + ip.x * 5.0 + ip.z * 3.0) * 0.18 * ujung * ujung;\n' +
        'transformed.z += cos(uWaktu * 1.3 + ip.z * 4.0) * 0.08 * ujung * ujung;');
    };
    var JR = 4200;
    var rumput = new THREE.InstancedMesh(helai, bahanRumput, JR);
    rumput.receiveShadow = true;
    var m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), v4 = new THREE.Vector3(), s4 = new THREE.Vector3(), warnaR = new THREE.Color();
    for (var ir = 0; ir < JR; ir++) {
      var ar = rand() * Math.PI * 2, rr2 = Math.sqrt(rand()) * R * 0.98;
      v4.set(Math.cos(ar) * rr2, 0, Math.sin(ar) * rr2);
      e4.set((rand() - .5) * 0.28, rand() * Math.PI, (rand() - .5) * 0.28); q4.setFromEuler(e4);
      var tg = (0.035 + rand() * 0.055) * (1.15 - rr2 / R * 0.35); s4.set(0.9 + rand() * .5, tg, 1);
      m4.compose(v4, q4, s4); rumput.setMatrixAt(ir, m4);
      warnaR.setHSL(0.27 + rand() * 0.05, 0.45 + rand() * 0.2, 0.62 + rand() * 0.22); warnaR.convertSRGBToLinear(); rumput.setColorAt(ir, warnaR);
    }
    taman.add(rumput);

    /* bunga: tangkai dan kelopak, mekar mengikuti gulir */
    var WARNA = [0xffffff, 0xffd23f, 0xff7aa8, 0xb9a2ff, 0xff8c69, 0xfff3c4];
    var JB = 64;
    var tangkai = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0035, 0.0045, 1, 5, 1), new THREE.MeshStandardMaterial({ color: lin(0x3f7f3a), roughness: 0.9 }), JB);
    var kelopakGeo = new THREE.IcosahedronGeometry(0.024, 1); kelopakGeo.scale(1, 0.55, 1);
    var kelopak = new THREE.InstancedMesh(kelopakGeo, new THREE.MeshStandardMaterial({ roughness: 0.55 }), JB);
    var putik = new THREE.InstancedMesh(new THREE.SphereGeometry(0.009, 8, 6), new THREE.MeshStandardMaterial({ color: lin(0xf2a516), roughness: 0.6 }), JB);
    kelopak.castShadow = true;
    var bunga = [];
    for (var ib = 0; ib < JB; ib++) {
      var ab, rb;
      do { ab = rand() * Math.PI * 2; rb = (0.25 + Math.sqrt(rand()) * 0.7) * R; } while (false);
      bunga.push({ x: Math.cos(ab) * rb, z: Math.sin(ab) * rb, h: 0.1 + rand() * 0.14, mulai: 0.04 + rand() * 0.82, rot: rand() * 6.28 });
      kelopak.setColorAt(ib, lin(WARNA[ib % WARNA.length]));
    }
    taman.add(tangkai, kelopak, putik);
    function aturBunga(p) {
      bunga.forEach(function (b, i) {
        var u = jepit((p - b.mulai) / 0.1), e = u < 1 ? 1 - Math.pow(1 - u, 3) : 1, h = Math.max(0.0001, b.h * e);
        v4.set(b.x, h / 2, b.z); q4.identity(); s4.set(1, h, 1); m4.compose(v4, q4, s4); tangkai.setMatrixAt(i, m4);
        var k = Math.max(0.0001, e * (u < 1 ? 1 + Math.sin(u * Math.PI) * 0.25 : 1));
        e4.set(0, b.rot, 0); q4.setFromEuler(e4);
        v4.set(b.x, h, b.z); s4.set(k, k, k); m4.compose(v4, q4, s4); kelopak.setMatrixAt(i, m4);
        v4.y = h + 0.008 * k; m4.compose(v4, q4, s4); putik.setMatrixAt(i, m4);
      });
      tangkai.instanceMatrix.needsUpdate = kelopak.instanceMatrix.needsUpdate = putik.instanceMatrix.needsUpdate = true;
    }

    /* semak dan batu di tepi belakang */
    var bahanSemak = new THREE.MeshStandardMaterial({ color: lin(0x2d6e33), roughness: 0.85 });
    [[-0.78, -0.52, 0.13], [-0.62, -0.7, 0.09], [0.72, -0.6, 0.12], [0.86, -0.3, 0.08], [-0.92, 0.1, 0.07]].forEach(function (b) {
      var m = new THREE.Mesh(new THREE.IcosahedronGeometry(b[2], 3), bahanSemak);
      m.position.set(b[0], b[2] * 0.7, b[1]); m.scale.y = 0.85; m.castShadow = true; taman.add(m);
    });
    var bahanBatu = new THREE.MeshStandardMaterial({ color: lin(0xaeb2ba), roughness: 0.75, flatShading: true });
    [[0.45, 0.62, 0.05], [-0.4, 0.75, 0.04], [0.95, 0.25, 0.035]].forEach(function (b) {
      var m = new THREE.Mesh(new THREE.DodecahedronGeometry(b[2], 0), bahanBatu);
      m.position.set(b[0], b[2] * 0.4, b[1]); m.scale.y = 0.6; m.castShadow = true; taman.add(m);
    });

    /* ---------- sosok ---------- */
    var bahanSosok = new THREE.MeshPhysicalMaterial({ color: 0x050506, roughness: 0.26, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.06, skinning: true });
    var tulang = {}, dasar = {}, sosok = null;
    var tgt = new THREE.Vector3(), wq = new THREE.Quaternion(), pq = new THREE.Quaternion(), dq = new THREE.Quaternion(), a3 = new THREE.Vector3(), b3 = new THREE.Vector3();

    /* putar tulang supaya arah ke anaknya menghadap arah dunia tertentu */
    function arahkan(b, anak, arah) {
      b.updateMatrixWorld(true);
      b.getWorldPosition(a3); anak.getWorldPosition(b3);
      var kini3 = b3.sub(a3).normalize();
      dq.setFromUnitVectors(kini3, arah.clone().normalize());
      b.getWorldQuaternion(wq); b.parent.getWorldQuaternion(pq);
      b.quaternion.copy(pq.invert().multiply(dq.multiply(wq)));
      b.updateMatrixWorld(true);
    }
    /* putaran kecil dalam ruang dunia di atas pose dasar */
    function putarDunia(b, sumbu, sudut) {
      b.quaternion.copy(dasar[b.name]);
      b.updateMatrixWorld(true);
      b.getWorldQuaternion(wq); b.parent.getWorldQuaternion(pq);
      dq.setFromAxisAngle(sumbu, sudut);
      b.quaternion.copy(pq.invert().multiply(dq.multiply(wq)));
    }

    new THREE.GLTFLoader().load('assets/model/sosok.glb', function (gltf) {
      sosok = gltf.scene;
      sosok.traverse(function (o) {
        if (o.isBone) tulang[o.name] = o;
        if (o.isMesh) { o.material = bahanSosok; o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false; }
      });
      sc.add(sosok);
      sosok.updateMatrixWorld(true);
      /* ukuran dan pijakan dari tulang: kotak batas model berangka tidak bisa dipercaya */
      var pos = function (n) { var v = new THREE.Vector3(); sosok.updateMatrixWorld(true); tulang[n].getWorldPosition(v); return v; };
      var tKepala = pos('Head').y, tKaki = Math.min(pos('foot_l').y, pos('foot_r').y);
      sosok.scale.setScalar(1.52 / Math.max(0.001, tKepala - tKaki));
      var pv = pos('pelvis'), kk = Math.min(pos('foot_l').y, pos('foot_r').y);
      sosok.position.x -= pv.x; sosok.position.z -= pv.z; sosok.position.y += 0.085 - kk;
      sosok.updateMatrixWorld(true);
      /* hadap ke kamera: wajah (arah dari kepala ke depan) dibandingkan arah +z */
      var k1 = tulang.Head, k2 = tulang.neck_01;
      /* pose berdiri: lengan turun santai */
      [['l', 1], ['r', -1]].forEach(function (s) {
        var ua = tulang['upperarm_' + s[0]], la = tulang['lowerarm_' + s[0]], hd = tulang['hand_' + s[0]];
        if (!ua || !la || !hd) return;
        sosok.updateMatrixWorld(true);
        ua.getWorldPosition(a3);
        var sisi = a3.x > 0 ? 1 : -1;
        arahkan(ua, la, new THREE.Vector3(sisi * 0.16, -1, 0.02));
        arahkan(la, hd, new THREE.Vector3(sisi * 0.08, -1, 0.14));
      });
      ['spine_03', 'neck_01', 'Head', 'pelvis'].forEach(function (n) { if (tulang[n]) dasar[n] = tulang[n].quaternion.clone(); });
      gl.siap = true;
      ukur(); mintaGambar();
      root.classList.add('ada3d');
    });

    /* ---------- tata letak, kamera, proyeksi ---------- */
    var lebar = 1, tinggiK = 1, jarak0 = 6;
    function ukur() {
      lebar = Math.max(1, host.clientWidth); tinggiK = Math.max(1, host.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(lebar, tinggiK, false);
      cam.aspect = lebar / tinggiK;
      var tingginya = Math.max(2.9, 2.95 / cam.aspect);
      if (lebar < 700) tingginya = Math.max(2.9, 2.5 / cam.aspect);
      jarak0 = tingginya / (2 * Math.tan(cam.fov * Math.PI / 360));
      cam.updateProjectionMatrix();
      letakSimpul();
    }
    var tmpV = new THREE.Vector3();
    function keLayar(obj, dy) {
      obj.getWorldPosition(tmpV); tmpV.y += dy || 0; tmpV.project(cam);
      return { x: (tmpV.x * 0.5 + 0.5) * lebar, y: (-tmpV.y * 0.5 + 0.5) * tinggiK };
    }

    /* ---------- tema ---------- */
    function terapkanTema() {
      var g = document.documentElement.classList.contains('dark-theme');
      sc.environment = g ? ENV.gelap : ENV.terang;
      bahanSosok.color.set(g ? 0xe9e9ec : 0x050506);
      bahanSosok.roughness = g ? 0.32 : 0.26;
      bahanSosok.metalness = g ? 0 : 0.1;
      bahanSosok.envMapIntensity = g ? 0.9 : 1.6;
      hemi.intensity = g ? 0.35 : 0.55;
      tepi.intensity = g ? 1.6 : 1.2;
      mintaGambar();
    }
    new MutationObserver(terapkanTema).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    terapkanTema();

    /* ---------- kursor ---------- */
    var kursor = { x: 0, y: 0, ada: false };
    window.addEventListener('pointermove', function (e) {
      var r = host.getBoundingClientRect();
      kursor.ada = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
      if (kursor.ada) { kursor.x = (e.clientX - r.left) / r.width * 2 - 1; kursor.y = (e.clientY - r.top) / r.height * 2 - 1; mintaGambar(); }
    }, { passive: true });

    /* ---------- gambar ---------- */
    var tampil = true, jalan = false, lalu = 0, waktu = 0, toleh = 0, angguk = 0, bungaLalu = -1;
    var sumbuY = new THREE.Vector3(0, 1, 0), sumbuX = new THREE.Vector3(1, 0, 0);
    function mintaGambar() { if (!jalan && tampil) { jalan = true; lalu = 0; requestAnimationFrame(bingkai); } }
    function bingkaiSekali(tm) { var j = jalan; jalan = true; tampilUji = true; bingkai(tm, true); jalan = j; }
    var tampilUji = false;
    function bingkai(tm, sekali) {
      if (!tampil && !sekali) { jalan = false; return; }
      var dt = lalu ? Math.min((tm - lalu) / 1000, 0.05) : 0.016; lalu = tm; waktu += dt;
      /* gulir dihaluskan di loop yang sama */
      kini += (tujuan - kini) * Math.min(1, dt * 7.5);
      if (Math.abs(tujuan - kini) < 0.0004) kini = tujuan;
      root.style.setProperty('--p', kini.toFixed(4));

      /* kamera: mulai dekat ke sosok, mundur membuka jaringan */
      var mundur = halus(jepit(kini / 0.6));
      var jarak = jarak0 * (0.86 + 0.14 * mundur);
      var putar = (1 - mundur) * 0.22 + (kursor.ada ? kursor.x * 0.06 : 0);
      cam.position.set(Math.sin(putar) * jarak, 1.25 + (1 - mundur) * 0.1, Math.cos(putar) * jarak);
      cam.lookAt(0, 0.78, 0);

      /* taman tumbuh */
      seragam.uWaktu.value = reduce ? 0 : waktu;
      seragam.uTumbuh.value = 0.45 + 0.55 * halus(jepit(kini / 0.7));
      if (Math.abs(kini - bungaLalu) > 0.0005) { aturBunga(kini); bungaLalu = kini; }

      /* sosok: napas dan toleh */
      if (sosok) {
        var napas = reduce ? 0 : Math.sin(waktu * 1.5) * 0.012;
        if (tulang.spine_03) putarDunia(tulang.spine_03, sumbuX, -napas);
        var targetToleh = 0, targetAngguk = 0;
        if (kursor.ada) { targetToleh = kursor.x * 0.45; targetAngguk = kursor.y * 0.18; }
        else if (terakhir >= 0) {
          var n = nodes[terakhir];
          targetToleh = ((n._x / W) * 2 - 1) * 0.55;
          targetAngguk = ((n._y / H) * 2 - 1) * 0.22;
        }
        toleh += (targetToleh - toleh) * Math.min(1, dt * 3);
        angguk += (targetAngguk - angguk) * Math.min(1, dt * 3);
        if (tulang.neck_01) putarDunia(tulang.neck_01, sumbuY, toleh * 0.45);
        if (tulang.Head) { putarDunia(tulang.Head, sumbuY, toleh * 0.55); tulang.Head.updateMatrixWorld(true); }
        sosok.updateMatrixWorld(true);

        /* proyeksi untuk garis dan label */
        if (tulang.spine_03 && tulang.upperarm_l && tulang.upperarm_r) {
          var d = keLayar(tulang.spine_03, 0.05), l = keLayar(tulang.upperarm_l), r = keLayar(tulang.upperarm_r);
          dada.x = d.x; dada.y = d.y; dada.hw = Math.abs(l.x - r.x) / 2 + 10; dada.ok = true;
        }
        if (tulang.Head && label) {
          var h = keLayar(tulang.Head, 0.34);
          label.style.transform = 'translate(' + h.x.toFixed(1) + 'px,' + h.y.toFixed(1) + 'px) translate(-50%,-100%)';
        }
        letakGaris();
      }
      renderer.render(sc, cam);
      var masihGerak = kini !== tujuan || Math.abs(toleh - (kursor.ada ? kursor.x * 0.45 : toleh)) > 0.001;
      if (sekali) return;
      if (!reduce || masihGerak) requestAnimationFrame(bingkai); else jalan = false;
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { tampil = e[0].isIntersecting; if (tampil) mintaGambar(); }, { threshold: 0 }).observe(root);
    }
    if ('ResizeObserver' in window) new ResizeObserver(function () { ukur(); mintaGambar(); }).observe(host);
    ukur();
    gl.ukur = ukur;
    window.__eco3d = {
      status: function () { return { siap: gl.siap, kini: kini, tulang: Object.keys(tulang).length }; },
      gambar: function (detik) { var n = Math.max(1, Math.round((detik || 0.5) / 0.016)), w = performance.now(); for (var i = 0; i < n; i++) { lalu = w; w += 16; bingkaiSekali(w); } },
      bones: function () { return Object.keys(tulang); }
    };
  }

  /* ---------- pemasangan ---------- */
  if (reduce) { root.classList.add('diam'); tujuan = kini = 1; }
  else {
    window.addEventListener('scroll', picu, { passive: true });
    hitungTujuan(); kini = tujuan;
  }
  root.style.setProperty('--p', kini.toFixed(4));
  letakSimpul();
  if ('ResizeObserver' in window) new ResizeObserver(function () { if (!gl.siap) letakSimpul(); }).observe(scene);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { if (e[0].isIntersecting) mulai3D(); }, { rootMargin: '800px 0px' }).observe(root);
  } else mulai3D();
  document.addEventListener('bahasa-berubah', function () { if (buka) isi(buka); });

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
  nodes.forEach(function (b) { b.addEventListener('click', function () { if (b.classList.contains('on')) bukaDetail(b.dataset.n, b); }); });
  if (det) det.querySelector('.ed-tutup').addEventListener('click', tutupDetail);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') tutupDetail(); });
})();
