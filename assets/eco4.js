/* ===========================================================
   Section Introducing: showroom manekin.

   - manekin: assets/model/manekin.glb (Universal Base Characters, Quaternius, CC0),
     sudah dibagi halus. Saat dimuat, lengan diturunkan lalu permukaan dihaluskan
     dalam pose itu (Taubin) dan pose itu dijadikan pose ikat baru, supaya bahu
     dan ketiak tidak terlihat patah. Krom padat memudar jadi hologram di paha.
   - mata menyala menempel di tulang kepala; kepala selalu mengikuti kursor.
   - kapsul kaca cair masuk satu per satu mengikuti gulir; kata raksasa di
     belakang mengikuti kapsul terakhir. Klik kapsul: papan penjelasan.
   - latar: lubang hitam dari fragment shader GLSL (dihitung GPU, bukan video).
   Model dan GLTFLoader baru dimuat saat section mendekati layar, dan gambar
   berhenti saat section di luar layar.
   =========================================================== */
(function () {
  var root = document.getElementById('eco4');
  if (!root) return;
  var pin = document.getElementById('e8Pin');
  var host = document.getElementById('e5Fig');
  var anda = document.getElementById('e5Anda');
  var papan = document.getElementById('ecoDetail');
  var kataEl = document.getElementById('e8Kata');
  var hint = root.querySelector('.e4-hint');
  var el = Array.prototype.slice.call(root.querySelectorAll('.e8-el')).sort(function (a, b) { return a.dataset.i - b.dataset.i; });
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  var N = el.length;
  var ITEM = { mentors: 'eco.mentor', opportunity: 'eco.opp', networks: 'eco.net', partners: 'eco.par',
    community: 'eco.comm', career: 'eco.career', business: 'eco.biz', capital: 'eco.cap' };

  function bahasa() { var l = (document.documentElement.lang || 'id').slice(0, 2); return l === 'zh' ? 'zh' : l === 'en' ? 'en' : 'id'; }
  function t(k) {
    var K = window.CATALYST_I18N; if (!K) return '';
    var v = K[bahasa()] && K[bahasa()][k];
    return v != null ? v : (K.id && K.id[k]) || '';
  }
  function jepit(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function keluar(x) { return 1 - Math.pow(1 - x, 4); }
  function gelap() { return document.documentElement.classList.contains('dark-theme'); }
  function nama(i) { return el[i].querySelector('b').textContent; }

  /* ---------- kata raksasa ---------- */
  var kataKini = -1;
  function tampilKata(i) {
    if (i === kataKini || !kataEl) return;
    kataKini = i;
    var lama = kataEl.querySelector('span:not(.keluar)');
    if (lama) { lama.classList.add('keluar'); setTimeout(function () { if (lama.parentNode) lama.parentNode.removeChild(lama); }, 1000); }
    if (i < 0) return;
    var s = document.createElement('span'); s.className = 'masuk'; s.textContent = nama(i); kataEl.appendChild(s);
    requestAnimationFrame(function () { requestAnimationFrame(function () { s.classList.remove('masuk'); }); });
  }

  /* ---------- kapsul masuk satu per satu mengikuti gulir ---------- */
  var tujuan = 0, kini = 0, terakhir = -1;
  function hitung() {
    var r = root.getBoundingClientRect(), tot = r.height - window.innerHeight;
    tujuan = tot > 0 ? jepit(-r.top / tot) : 1;
  }
  function terapkan(p) {
    terakhir = -1;
    el.forEach(function (e, i) {
      var u = keluar(jepit((p - (0.08 + i * 0.07)) / 0.16)), sisi = +e.dataset.sisi;
      e.style.setProperty('--o', u.toFixed(3));
      e.style.setProperty('--bl', ((1 - u) * 10).toFixed(2) + 'px');
      e.style.setProperty('--ty', ((1 - u) * 18).toFixed(1) + 'px');
      e.style.setProperty('--tx', ((1 - u) * -sisi * 24).toFixed(1) + 'px');
      e.style.pointerEvents = u > 0.8 ? 'auto' : 'none';
      e.tabIndex = u > 0.8 ? 0 : -1;
      if (u > 0.5) terakhir = i;
    });
    if (!buka) tampilKata(terakhir);
    if (hint) hint.style.opacity = p > 0.04 ? 0 : 1;
  }

  /* ---------- papan penjelasan ---------- */
  var buka = false, aktif = 0, pemicu = null, isi = papan && papan.querySelector('.e8-isi');
  function isiPapan() {
    var u = ITEM[el[aktif].dataset.n];
    papan.querySelector('.ed-judul').textContent = nama(aktif);
    papan.querySelector('.ed-lead').innerHTML = t(u + '.p');
    papan.querySelector('.ed-list').innerHTML = [1, 2, 3].map(function (n) { return '<li><span>' + t(u + '.' + n) + '</span></li>'; }).join('');
    var x = papan.querySelector('.ed-tutup'); if (x) x.setAttribute('aria-label', t('eco.tutup') || 'Tutup');
  }
  function bukaPapan(i, tombol) {
    if (!papan) return;
    aktif = (i + N) % N;
    el.forEach(function (e, k) { e.classList.toggle('on', k === aktif); });
    tampilKata(aktif);
    if (buka) {
      isi.classList.add('ganti');
      setTimeout(function () { isiPapan(); isi.classList.remove('ganti'); }, 320);
      return;
    }
    buka = true; pemicu = tombol || null;
    isiPapan();
    root.classList.add('buka'); papan.setAttribute('aria-hidden', 'false');
    setTimeout(function () { var c = papan.querySelector('.ed-tutup'); if (c && buka) c.focus({ preventScroll: true }); }, 80);
    pasangBiasPapan();
  }
  function tutup() {
    if (!buka) return;
    buka = false;
    root.classList.remove('buka'); papan.setAttribute('aria-hidden', 'true');
    el.forEach(function (e) { e.classList.remove('on'); });
    tampilKata(terakhir);
    if (pemicu && pemicu.focus) { try { pemicu.focus({ preventScroll: true }); } catch (e) {} }
  }
  el.forEach(function (e) { e.addEventListener('click', function () { bukaPapan(+e.dataset.i, e); }); });
  if (papan) {
    papan.querySelector('.ed-tutup').addEventListener('click', tutup);
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') tutup(); });
  document.addEventListener('bahasa-berubah', function () { if (buka) isiPapan(); });

  /* ---------- bias lensa di tepi kaca (hanya Chromium) ---------- */
  var chromium = !!navigator.userAgentData, nf = 0, defs = null;
  function petaBias(W, H, r, pita) {
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = c.getContext('2d'), im = g.createImageData(W, H), d = im.data;
    var cx = W / 2, cy = H / 2, hx = W / 2 - r, hy = H / 2 - r;
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var px = x + 0.5 - cx, py = y + 0.5 - cy, qx = Math.abs(px) - hx, qy = Math.abs(py) - hy;
      var mx = Math.max(qx, 0), my = Math.max(qy, 0), dd = -(Math.hypot(mx, my) + Math.min(Math.max(qx, qy), 0) - r);
      var nx = 0, ny = 0;
      if (qx > 0 && qy > 0) { var l = Math.hypot(mx, my) || 1; nx = mx / l * Math.sign(px); ny = my / l * Math.sign(py); }
      else if (qx > qy) nx = Math.sign(px); else ny = Math.sign(py);
      var tt = dd < pita && dd > 0 ? Math.pow(1 - dd / pita, 2) : 0, o = (y * W + x) * 4;
      d[o] = 128 - nx * tt * 127; d[o + 1] = 128 - ny * tt * 127; d[o + 2] = 128; d[o + 3] = 255;
    }
    g.putImageData(im, 0, 0); return c.toDataURL();
  }
  function pasangBias(e, r, pita, skala, blur) {
    if (!chromium) return;
    var W = Math.round(e.offsetWidth), H = Math.round(e.offsetHeight);
    if (!W || !H || W * H > 400000) return;
    if (!defs) {
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', 0); svg.setAttribute('height', 0); svg.setAttribute('aria-hidden', 'true');
      svg.style.position = 'absolute';
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs'); svg.appendChild(defs); document.body.appendChild(svg);
    }
    var id = 'e8kaca' + (nf++), f = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    f.setAttribute('id', id); f.setAttribute('x', 0); f.setAttribute('y', 0); f.setAttribute('width', W); f.setAttribute('height', H);
    f.setAttribute('filterUnits', 'userSpaceOnUse'); f.setAttribute('primitiveUnits', 'userSpaceOnUse'); f.setAttribute('color-interpolation-filters', 'sRGB');
    f.innerHTML = '<feImage href="' + petaBias(W, H, Math.min(r, H / 2, W / 2), pita) + '" x="0" y="0" width="' + W + '" height="' + H + '" result="peta"/>' +
      '<feGaussianBlur in="SourceGraphic" stdDeviation="' + blur + '" result="b"/>' +
      '<feDisplacementMap in="b" in2="peta" scale="' + skala + '" xChannelSelector="R" yChannelSelector="G" result="g"/>' +
      '<feColorMatrix in="g" type="saturate" values="1.6"/>';
    defs.appendChild(f);
    e.style.backdropFilter = e.style.webkitBackdropFilter = 'url(#' + id + ')';
  }
  var biasKapsul = false, biasPapan = false;
  function pasangBiasKapsul() {
    if (biasKapsul || !el[0].offsetWidth) return;
    biasKapsul = true;
    el.forEach(function (e) { var w = e.querySelector('.e8-pn'); if (w) w.style.width = '30px'; pasangBias(e, 100, 14, 34, 6); if (w) w.style.width = ''; });
  }
  function pasangBiasPapan() {
    if (biasPapan) return;
    var inti = papan.querySelector('.e8-inti');
    setTimeout(function () { if (inti.offsetWidth) { biasPapan = true; pasangBias(inti, 28, 26, 40, 8); } }, 80);
  }

  /* ---------- latar: lubang hitam, dihitung GPU lewat fragment shader ----------
     Tiap piksel dihitung dari rumus: cakram akresi miring yang berputar (lebih cepat di
     dalam), bayangan cakram belakang yang dibelokkan gravitasi melingkari horizon,
     cincin foton tipis, dan horizon hitam. Tema gelap: cahaya putih di ruang gelap.
     Tema terang: dibalik jadi tinta di atas putih. Resolusi 0,6 dari layar supaya ringan. */
  var lubangEl = document.getElementById('e8Lubang'), lubang = null;
  (function () {
    if (!lubangEl) return;
    var g = lubangEl.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
    if (!g) return;
    var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var FS = [
      '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
      'uniform vec2 uRes,uPusat;uniform float uT,uRh,uGelap;',
      'float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
      'float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
      ' return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+1.),f.x),f.y);}',
      'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*ns(p);p=p*2.03+17.1;a*=.5;}return v;}',
      'mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}',
      /* cakram akresi di bidangnya sendiri: pita, putaran diferensial, serat gas */
      'float cakram(vec2 q,float rin,float rout){',
      ' float d=length(q);',
      ' float pita=smoothstep(rin*.9,rin*1.1,d)*(1.-smoothstep(rin*1.45,rout,d));',
      ' vec2 qr=rot(uT*.55*pow(rin/max(d,rin*.5),1.5))*q;',
      ' float n=fbm(qr/rin*2.4);',
      ' float serat=.78+.22*sin(d/rin*20.+n*9.);',
      ' return pita*(.1+n*n*1.7)*serat*pow(rin/max(d,1e-3),1.7);}',
      'void main(){',
      ' vec2 p=(gl_FragCoord.xy-uPusat*uRes)/uRes.y;',
      ' float rh=uRh,r=length(p),rin=rh*1.6,rout=rh*4.8;',
      ' vec2 q=vec2(p.x,p.y/.17);',
      /* sisi cakram yang mendekat lebih terang */
      ' float c=cakram(q,rin,rout)*(1.-.5*q.x/(length(q)+1e-3));',
      ' float depan=smoothstep(0.,-rh*.08,p.y);',
      ' float hor=1.-smoothstep(rh*.96,rh,r);',
      ' float a=atan(p.y,p.x);',
      ' float lensa=cakram(vec2(cos(a),sin(a))*(rin+(r-rh*1.06)*3.4),rin,rout)',
      '  *smoothstep(rh*1.02,rh*1.1,r)*(1.-smoothstep(rh*1.28,rh*1.9,r))*(.45+.55*abs(sin(a)));',
      ' float cincin=exp(-pow((r-rh*1.035)/(rh*.016),2.))*.8;',
      ' float L=c*mix(1.-hor,1.,depan)+(lensa+cincin)*(1.-hor)+exp(-r/(rh*1.5))*.06*(1.-hor);',
      ' float v=1.-exp(-L*1.7);',
      ' vec4 o;',
      ' if(uGelap>.5){',
      /* bintang ikut dibelokkan gravitasi */
      '  vec2 ps=p-p/max(r,1e-3)*rh*rh*1.4/max(r,rh);',
      '  vec2 id=floor(ps*95.);float s=h21(id);',
      '  float b=step(.986,s)*smoothstep(.45,0.,length(fract(ps*95.)-.5))*(.55+.45*sin(uT*1.7+s*60.))*(1.-hor)*.7;',
      '  o=vec4(vec3(1.,.97,.92)*v+b,clamp(max(max(v,b),hor),0.,1.));',
      ' }else{',
      /* tinta di atas putih, horizon hitam, cakram depan terang di atas horizon */
      '  o=vec4(vec3(hor*v*.9),mix(v*.92,1.,hor));',
      ' }',
      ' gl_FragColor=o;}'
    ].join('\n');
    function sh(t, src) { var s = g.createShader(t); g.shaderSource(s, src); g.compileShader(s); return g.getShaderParameter(s, g.COMPILE_STATUS) ? s : null; }
    var vs = sh(g.VERTEX_SHADER, VS), fs = sh(g.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;
    var pr = g.createProgram(); g.attachShader(pr, vs); g.attachShader(pr, fs); g.linkProgram(pr);
    if (!g.getProgramParameter(pr, g.LINK_STATUS)) return;
    g.useProgram(pr);
    g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    var lp = g.getAttribLocation(pr, 'p'); g.enableVertexAttribArray(lp); g.vertexAttribPointer(lp, 2, g.FLOAT, false, 0, 0);
    var U = {}; ['uRes', 'uPusat', 'uT', 'uRh', 'uGelap'].forEach(function (k) { U[k] = g.getUniformLocation(pr, k); });
    var tampilL = false, jalanL = false, lalu = 0, waktu = 0, cx = 0.5, cy = 0.5, rhL = 0.13;
    function ukurL() {
      /* ukuran dari induk, bukan dari canvas sendiri, supaya tidak saling mengecil */
      var w = lubangEl.parentNode.clientWidth, h = lubangEl.parentNode.clientHeight; if (!w || !h) return;
      var sk = Math.min(0.6, 1100 / w);
      lubangEl.width = Math.round(w * sk); lubangEl.height = Math.round(h * sk);
      g.viewport(0, 0, lubangEl.width, lubangEl.height);
      /* pusat lubang di belakang dada manekin */
      var rc = lubangEl.getBoundingClientRect(), rp = host.getBoundingClientRect();
      cx = (rp.left + rp.width / 2 - rc.left) / rc.width;
      cy = 1 - (rp.top + rp.height * (w < 820 ? 0.3 : 0.27) - rc.top) / rc.height;
      rhL = w < 820 ? Math.min(0.12, w / h * 0.09) : 0.17;
      gambarL();
    }
    function gambarL() {
      g.uniform2f(U.uRes, lubangEl.width, lubangEl.height); g.uniform2f(U.uPusat, cx, cy);
      g.uniform1f(U.uT, waktu); g.uniform1f(U.uRh, rhL); g.uniform1f(U.uGelap, gelap() ? 1 : 0);
      g.drawArrays(g.TRIANGLES, 0, 3);
    }
    function bingkaiL(tm) {
      if (!tampilL || document.hidden) { jalanL = false; return; }
      var dt = lalu ? Math.min((tm - lalu) / 1000, 0.05) : 0.016; lalu = tm;
      waktu += dt * (reduce ? 0.25 : 1);   /* kurangi gerak: tetap hidup, hanya pelan */
      gambarL();
      requestAnimationFrame(bingkaiL);
    }
    function mintaL() { if (!jalanL && tampilL && !document.hidden) { jalanL = true; lalu = 0; requestAnimationFrame(bingkaiL); } }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { tampilL = e[0].isIntersecting; mintaL(); }, { threshold: 0 }).observe(root);
    else { tampilL = true; mintaL(); }
    document.addEventListener('visibilitychange', mintaL);
    if ('ResizeObserver' in window) new ResizeObserver(ukurL).observe(lubangEl.parentNode); else window.addEventListener('resize', ukurL);
    ukurL();
    lubang = window.__lubang = { ukur: ukurL, gambar: gambarL, langkah: function (d) { waktu += d; gambarL(); } };
  })();

  /* ---------- 3D ---------- */
  var THREE = window.THREE, gl = { mulai: false, siap: false };
  function muatSkrip(src) {
    return new Promise(function (ok, gagal) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = gagal; document.head.appendChild(s); });
  }
  function mulai3D() {
    if (gl.mulai || !THREE || !host) return;
    gl.mulai = true;
    var siapLoader = THREE.GLTFLoader ? Promise.resolve() : muatSkrip('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js');
    siapLoader.then(bangun3D).catch(function () {});
  }

  /* studio pantulan krom: latar bergradasi dengan kotak cahaya bertepi lembut */
  function lukisStudio(renderer, gl2) {
    var c = document.createElement('canvas'); c.width = 2048; c.height = 1024;
    var g = c.getContext('2d'), lat = g.createLinearGradient(0, 0, 0, 1024);
    if (gl2) { lat.addColorStop(0, '#1c1d22'); lat.addColorStop(0.5, '#050506'); lat.addColorStop(0.62, '#0b0b0d'); lat.addColorStop(1, '#34363c'); }
    else { lat.addColorStop(0, '#4a4d54'); lat.addColorStop(0.5, '#101013'); lat.addColorStop(0.62, '#1a1b1f'); lat.addColorStop(1, '#8a8e96'); }
    g.fillStyle = lat; g.fillRect(0, 0, 2048, 1024);
    function l(x, y, w, h, a, r) {
      g.save(); g.filter = 'blur(' + r + 'px)';
      var gr = g.createLinearGradient(x, y, x + w, y);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.15, 'rgba(255,255,255,' + a + ')');
      gr.addColorStop(0.85, 'rgba(255,255,255,' + a + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(x, y, w, h); g.restore();
    }
    l(160, 70, 620, 230, 1, 10); l(1120, 110, 480, 170, 0.9, 10); l(470, 300, 44, 460, 0.95, 4); l(1520, 320, 40, 420, 0.9, 4);
    l(960, 380, 22, 300, 0.6, 3); l(1840, 260, 120, 360, 0.55, 8); l(0, 610, 2048, 14, 0.4, 3);
    var tx = new THREE.CanvasTexture(c); tx.mapping = THREE.EquirectangularReflectionMapping; tx.encoding = THREE.sRGBEncoding;
    var pm = new THREE.PMREMGenerator(renderer), env = pm.fromEquirectangular(tx).texture;
    tx.dispose(); pm.dispose(); return env;
  }

  function bangun3D() {
    var R;
    try { R = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch (e) { return; }
    R.setClearColor(0, 0); R.outputEncoding = THREE.sRGBEncoding; R.toneMapping = THREE.ACESFilmicToneMapping; R.autoClear = false;
    R.domElement.setAttribute('aria-hidden', 'true');
    host.insertBefore(R.domElement, host.firstChild);

    var ENV = { terang: lukisStudio(R, false), gelap: lukisStudio(R, true) };
    /* batas hologram dalam meter dunia: padat di atas 1.17, hologram 1.0 sampai 1.17 */
    var PRE = 'uniform float uAtas;uniform float uBawah;varying float vYw;\n';
    var uAtas = { value: 1.17 }, uBawah = { value: 1.0 }, uWarna = { value: new THREE.Color() }, uWaktu = { value: 0 };
    function sisipVertex(sh) {
      sh.vertexShader = 'varying float vYw;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvYw=(modelMatrix*vec4(transformed,1.0)).y;');
    }
    var bahan = new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05, skinning: true, transparent: true, premultipliedAlpha: true });
    bahan.onBeforeCompile = function (sh) {
      sh.uniforms.uAtas = uAtas; sh.uniforms.uBawah = uBawah; sisipVertex(sh);
      sh.fragmentShader = PRE + sh.fragmentShader.replace('#include <premultiplied_alpha_fragment>', 'gl_FragColor.a*=smoothstep(uBawah,uAtas,vYw);\n#include <premultiplied_alpha_fragment>');
    };
    var holo = new THREE.MeshPhongMaterial({ skinning: true, transparent: true, depthWrite: false, premultipliedAlpha: true });
    holo.onBeforeCompile = function (sh) {
      sh.uniforms.uAtas = uAtas; sh.uniforms.uBawah = uBawah; sh.uniforms.uWarna = uWarna; sh.uniforms.uWaktu = uWaktu; sisipVertex(sh);
      sh.fragmentShader = PRE + 'uniform vec3 uWarna;uniform float uWaktu;\n' + sh.fragmentShader.replace('#include <dithering_fragment>',
        'vec3 nn=normalize(vNormal);vec3 vv=normalize(vViewPosition);\n' +
        'float f=pow(1.0-abs(dot(nn,vv)),1.5);\n' +
        'float sc=0.55+0.45*step(0.5,fract(gl_FragCoord.y/4.0+uWaktu*0.5));\n' +
        'float sapu=smoothstep(0.04,0.0,abs(fract(uWaktu*0.22)-fract((uAtas-vYw)*2.0)));\n' +
        'float m=(1.0-smoothstep(uBawah,uAtas,vYw))*smoothstep(uBawah-0.2,uBawah+0.02,vYw);\n' +
        'float a=clamp(f*1.1+0.07+sapu*0.4,0.0,1.0)*sc*m;\n' +
        'gl_FragColor=vec4(uWarna*a,a);');
    };

    var sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(22, 1, 0.1, 50);
    [[-2, 3, 3, 1.1], [-3, 1.5, -2.5, 1.4], [3, 1.8, -2.5, 1.4]].forEach(function (d) { var l = new THREE.DirectionalLight(0xffffff, d[3]); l.position.set(d[0], d[1], d[2]); sc.add(l); });
    var sapu = new THREE.PointLight(0xffffff, 1.3, 5, 2); sc.add(sapu);
    var T = {}, dasar = {}, mesh = [], fig = null, mata = [];
    var a3 = new THREE.Vector3(), b3 = new THREE.Vector3(), wq = new THREE.Quaternion(), pq = new THREE.Quaternion(), dq = new THREE.Quaternion();
    function arahkan(b, anak, arah) {
      b.updateMatrixWorld(true); b.getWorldPosition(a3); anak.getWorldPosition(b3);
      dq.setFromUnitVectors(b3.sub(a3).normalize(), arah.normalize());
      b.getWorldQuaternion(wq); b.parent.getWorldQuaternion(pq);
      b.quaternion.copy(pq.invert().multiply(dq.multiply(wq))); b.updateMatrixWorld(true);
    }
    function putarDunia(b, sumbu, sudut) {
      b.quaternion.copy(dasar[b.name]); b.updateMatrixWorld(true);
      b.getWorldQuaternion(wq); b.parent.getWorldQuaternion(pq);
      dq.setFromAxisAngle(sumbu, sudut); b.quaternion.copy(pq.invert().multiply(dq.multiply(wq)));
    }

    /* haluskan dalam pose: hitung posisi titik di pose lengan turun, haluskan, jadikan pose ikat baru */
    function haluskanDalamPose(M, iter) {
      var geo = M.geometry, pa = geo.attributes.position, n = pa.count, v = new THREE.Vector3(), i;
      sc.updateMatrixWorld(true); M.skeleton.update();
      var P = new Float64Array(n * 3), tmp = new Float64Array(n * 3);
      for (i = 0; i < n; i++) { M.boneTransform(i, v); P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z; }
      var idx = geo.index.array, tet = [];
      for (i = 0; i < n; i++) tet.push([]);
      function tambah(a, b) { if (tet[a].indexOf(b) < 0) tet[a].push(b); }
      for (i = 0; i < idx.length; i += 3) { var a = idx[i], b = idx[i + 1], c = idx[i + 2]; tambah(a, b); tambah(a, c); tambah(b, a); tambah(b, c); tambah(c, a); tambah(c, b); }
      function langkah(f) {
        for (var i = 0; i < n; i++) {
          var tt = tet[i], k = tt.length, x = 0, y = 0, z = 0;
          if (!k) { tmp[i * 3] = P[i * 3]; tmp[i * 3 + 1] = P[i * 3 + 1]; tmp[i * 3 + 2] = P[i * 3 + 2]; continue; }
          for (var j = 0; j < k; j++) { x += P[tt[j] * 3]; y += P[tt[j] * 3 + 1]; z += P[tt[j] * 3 + 2]; }
          tmp[i * 3] = P[i * 3] + f * (x / k - P[i * 3]); tmp[i * 3 + 1] = P[i * 3 + 1] + f * (y / k - P[i * 3 + 1]); tmp[i * 3 + 2] = P[i * 3 + 2] + f * (z / k - P[i * 3 + 2]);
        }
        P.set(tmp);
      }
      for (var it = 0; it < iter; it++) { langkah(0.55); langkah(-0.58); }
      for (i = 0; i < n; i++) pa.setXYZ(i, P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
      pa.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
      M.skeleton.calculateInverses();
    }

    /* mata: dua celah cahaya + pendar, diletakkan di rongga mata hasil pindai wajah */
    function teksturPendar() {
      var c = document.createElement('canvas'); c.width = c.height = 128;
      var g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.18, 'rgba(190,230,255,.85)'); r.addColorStop(0.45, 'rgba(120,190,255,.25)'); r.addColorStop(1, 'rgba(120,190,255,0)');
      g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
    }
    var bahanMata = new THREE.MeshBasicMaterial({ color: 0xe6f6ff, toneMapped: false });
    var bahanPendar = new THREE.SpriteMaterial({ map: teksturPendar(), color: 0x9fd6ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    function pasangMata(M) {
      sc.updateMatrixWorld(true);
      var h = new THREE.Vector3(); T.Head.getWorldPosition(h);
      var ox = 0.031, oy = 0.09, zMuka = -9, v = new THREE.Vector3(), mw = M.matrixWorld, pa = M.geometry.attributes.position;
      for (var i = 0; i < pa.count; i++) {
        M.boneTransform(i, v); v.applyMatrix4(mw);
        if (Math.abs(Math.abs(v.x - h.x) - ox) < 0.006 && Math.abs(v.y - (h.y + oy)) < 0.006) zMuka = Math.max(zMuka, v.z);
      }
      var oz = zMuka > -9 ? zMuka - h.z + 0.001 : 0.1;
      var sk = new THREE.Vector3(); T.Head.getWorldScale(sk);
      [-1, 1].forEach(function (s) {
        var w = new THREE.Vector3(h.x + s * ox, h.y + oy, h.z + oz);
        var bola = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), bahanMata), spr = new THREE.Sprite(bahanPendar), g = new THREE.Group();
        g.add(bola, spr); T.Head.add(g); g.position.copy(T.Head.worldToLocal(w));
        bola.scale.set(0.0105 / sk.x, 0.0042 / sk.y, 0.004 / sk.z); bola.rotation.z = s * -0.12;
        spr.scale.set(0.075 / sk.x, 0.05 / sk.y, 1);
        mata.push(g);
      });
    }

    function terapkanTema() {
      var g = gelap();
      sc.environment = g ? ENV.gelap : ENV.terang;
      bahan.color.set(g ? 0xd5d8de : 0x111114); bahan.roughness = g ? 0.12 : 0.16; bahan.envMapIntensity = g ? 1.15 : 1.5;
      uWarna.value.set(g ? 0xa9dcff : 0x2e4a7a).convertSRGBToLinear();
      minta();
    }
    new MutationObserver(terapkanTema).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    new THREE.GLTFLoader().load('assets/model/manekin.glb', function (gltf) {
      fig = gltf.scene;
      fig.traverse(function (o) {
        if (o.isBone) T[o.name] = o;
        if (o.isMesh) {
          mesh.push(o); o.frustumCulled = false;
          /* bobot tulang 8 bit di berkas: r128 tidak menormalkan saat dibaca di JS, jadi ubah ke float */
          var w = o.geometry.attributes.skinWeight;
          if (w && w.normalized && !(w.array instanceof Float32Array)) {
            var f = new Float32Array(w.array.length), skala = w.array instanceof Uint8Array ? 255 : 65535;
            for (var i = 0; i < f.length; i++) f[i] = w.array[i] / skala;
            o.geometry.setAttribute('skinWeight', new THREE.BufferAttribute(f, 4));
          }
        }
      });
      if (!T.Head || !T.neck_01 || !T.spine_03 || !mesh.length) return;
      sc.add(fig);
      function pos(n) { var p = new THREE.Vector3(); sc.updateMatrixWorld(true); T[n].getWorldPosition(p); return p; }
      fig.scale.setScalar(1.52 / Math.max(0.001, pos('Head').y - Math.min(pos('foot_l').y, pos('foot_r').y)));
      var pv = pos('pelvis'), kk = Math.min(pos('foot_l').y, pos('foot_r').y);
      fig.position.x -= pv.x; fig.position.z -= pv.z; fig.position.y += 0.085 - kk;
      ['l', 'r'].forEach(function (x) {
        var ua = T['upperarm_' + x], la = T['lowerarm_' + x], hd = T['hand_' + x]; if (!ua || !la || !hd) return;
        sc.updateMatrixWorld(true); ua.getWorldPosition(a3); var s = a3.x > 0 ? 1 : -1;
        arahkan(ua, la, new THREE.Vector3(s * 0.1, -1, 0.04)); arahkan(la, hd, new THREE.Vector3(s * 0.04, -1, 0.1));
      });
      ['spine_03', 'neck_01', 'Head'].forEach(function (n) { dasar[n] = T[n].quaternion.clone(); });
      haluskanDalamPose(mesh[0], 40);
      pasangMata(mesh[0]);
      terapkanTema();
      gl.siap = true; ukur(); minta();
      root.classList.add('ada3d');
    });

    /* kamera: kepala sampai paha; layar sempit memberi ruang lebih */
    var lebar = 1, tinggi = 1;
    function ukur() {
      lebar = Math.max(1, host.clientWidth); tinggi = Math.max(1, host.clientHeight);
      R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); R.setSize(lebar, tinggi, false);
      cam.aspect = lebar / tinggi;
      var tampak = lebar < 820 ? Math.max(1.3, 1.25 / cam.aspect) : 1.12;
      var jarak = tampak / (2 * Math.tan(cam.fov * Math.PI / 360));
      var naik = lebar < 820 ? 0.12 : 0;
      cam.position.set(0, 1.42 - naik, jarak); cam.lookAt(0, 1.4 - naik, 0); cam.updateProjectionMatrix();
      if (lubang) lubang.ukur(); minta();
    }

    /* kursor di mana saja: kepala menoleh */
    var kx = 0, ky = 0;
    window.addEventListener('pointermove', function (e) {
      var r = R.domElement.getBoundingClientRect(); if (!r.width) return;
      kx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth * 0.45)));
      ky = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.22)) / (window.innerHeight * 0.5)));
    }, { passive: true });

    var tampil = true, jalan = false, lalu = 0, waktu = 0, toleh = 0, angguk = 0;
    var sumbuY = new THREE.Vector3(0, 1, 0), sumbuX = new THREE.Vector3(1, 0, 0), tmp = new THREE.Vector3();
    function minta() { if (!jalan && tampil) { jalan = true; lalu = 0; requestAnimationFrame(bingkai); } }
    gl.minta = minta;
    function bingkai(tm, sekali) {
      if (!tampil && !sekali) { jalan = false; return; }
      var dt = lalu ? Math.min((tm - lalu) / 1000, 0.05) : 0.016; lalu = tm; waktu += dt;
      kini += (tujuan - kini) * Math.min(1, dt * 6); if (Math.abs(tujuan - kini) < 0.0004) kini = tujuan;
      terapkan(kini);
      if (gl.siap) {
        uWaktu.value = waktu;
        bahanPendar.opacity = 0.8 + 0.2 * Math.sin(waktu * 2.2);
        sapu.position.set(Math.sin(waktu * 0.42) * 1.3, 1.62 + Math.sin(waktu * 0.3) * 0.15, 1.1);
        toleh += (kx * 0.75 - toleh) * Math.min(1, dt * 4); angguk += (ky * 0.32 - angguk) * Math.min(1, dt * 4);
        putarDunia(T.spine_03, sumbuX, reduce ? 0 : -Math.sin(waktu * 1.4) * 0.014);
        putarDunia(T.neck_01, sumbuY, toleh * 0.4);
        putarDunia(T.Head, sumbuY, toleh * 0.6); T.Head.updateMatrixWorld(true);
        T.Head.getWorldQuaternion(wq); T.Head.parent.getWorldQuaternion(pq);
        dq.setFromAxisAngle(sumbuX, angguk); T.Head.quaternion.copy(pq.invert().multiply(dq.multiply(wq)));
        fig.rotation.y = toleh * 0.08; fig.updateMatrixWorld(true);
        if (anda) {
          T.Head.getWorldPosition(tmp); tmp.y += 0.2; tmp.project(cam);
          anda.style.transform = 'translate(' + ((tmp.x * 0.5 + 0.5) * lebar).toFixed(1) + 'px,' + ((-tmp.y * 0.5 + 0.5) * tinggi).toFixed(1) + 'px) translate(-50%,-100%)';
        }
        R.clear();
        mesh.forEach(function (m) { m.material = bahan; }); R.render(sc, cam);
        R.clearDepth();
        mata.forEach(function (g) { g.visible = false; });
        mesh.forEach(function (m) { m.material = holo; }); R.render(sc, cam);
        mata.forEach(function (g) { g.visible = true; });
      }
      if (sekali) return;
      requestAnimationFrame(bingkai);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { tampil = e[0].isIntersecting; if (tampil) minta(); }, { threshold: 0 }).observe(root);
    }
    if ('ResizeObserver' in window) new ResizeObserver(ukur).observe(host);
    else window.addEventListener('resize', ukur);
    ukur();
    window.__eco3d = {
      status: function () { return { siap: gl.siap, kini: kini, tulang: Object.keys(T).length }; },
      gambar: function (detik) { var n = Math.max(1, Math.round((detik || 0.5) / 0.016)), w = performance.now(); for (var i = 0; i < n; i++) { lalu = w; w += 16; bingkai(w, true); } }
    };
  }

  /* ---------- pemasangan ---------- */
  function picu() {
    hitung();
    if (!gl.mulai) { var r = root.getBoundingClientRect(); if (r.top < window.innerHeight + 800 && r.bottom > -800) mulai3D(); }
    if (gl.minta) gl.minta();
    else { kini = tujuan; terapkan(kini); }
    pasangBiasKapsul();
  }
  if (reduce) { root.classList.add('diam'); tujuan = kini = 1; }
  else { window.addEventListener('scroll', picu, { passive: true }); hitung(); kini = tujuan; }
  terapkan(kini);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { if (e[0].isIntersecting) { mulai3D(); pasangBiasKapsul(); } }, { rootMargin: '800px 0px' }).observe(root);
  } else mulai3D();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { biasKapsul = false; biasPapan = false; if (defs) defs.innerHTML = ''; el.forEach(function (e) { e.style.backdropFilter = e.style.webkitBackdropFilter = ''; }); if (papan) { var ii = papan.querySelector('.e8-inti'); ii.style.backdropFilter = ii.style.webkitBackdropFilter = ''; } pasangBiasKapsul(); if (buka) pasangBiasPapan(); });
  picu();
})();
