/* Halaman program Catalyst Passport: kartu yang terisi saat mengetik, tur fitur,
   tahap Journey, dan tombol yang berubah bila pengunjung sudah masuk. */
(function () {
  'use strict';
  var hemat = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var INDUSTRI = { business: 'Business', investments: 'Investments', ai: 'AI & Technology', builder: 'Builders', impact: 'Social Impact' };

  /* ---------- kartu Passport yang terisi saat mengetik ---------- */
  var form = document.getElementById('ppCoba');
  var input = document.getElementById('ppNama');
  var kartu = document.getElementById('ppKartu');
  var wrap = document.getElementById('ppKartuWrap');
  var kanal = 'ai';
  function perbarui() {
    var nama = input.value.trim().replace(/\s+/g, ' ');
    var h = 0;
    for (var i = 0; i < nama.length; i++) h = (h * 31 + nama.charCodeAt(i)) % 9000;
    var slug = nama.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24) || 'nama-anda';
    document.getElementById('ppNamaKartu').firstChild.nodeValue = nama || 'Nama Anda';
    document.getElementById('ppAva').textContent = (nama.charAt(0) || 'C').toUpperCase();
    document.getElementById('ppId').textContent = 'CP-' + String(nama ? 1000 + h : 1284).padStart(5, '0');
    document.getElementById('ppIndustri').textContent = INDUSTRI[kanal] + ' · Explorer';
    document.getElementById('ppUrl').textContent = 'catalystsociety.id/pass/' + slug;
  }
  input.addEventListener('input', perbarui);
  [].forEach.call(form.querySelectorAll('.pp-chips button'), function (b, i, semua) {
    b.addEventListener('click', function () {
      kanal = b.dataset.v;
      [].forEach.call(semua, function (x) { x.setAttribute('aria-checked', String(x === b)); });
      kartu.classList.remove('berubah'); void kartu.offsetWidth; kartu.classList.add('berubah');
      perbarui();
    });
  });
  /* Di passport.catalystsociety.id, halaman daftar dan Passport ada di domain utama. */
  var UTAMA = location.hostname === 'passport.catalystsociety.id' ? 'https://catalystsociety.id' : '';
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bawa = { nama: input.value.trim(), ch: kanal };
    if (masuk) { location.href = UTAMA + '/passport/'; return; }
    /* Nama dan industri dibawa ke formulir daftar tanpa masuk ke alamat yang dikirim ke server:
       sessionStorage di domain yang sama, fragmen # bila pindah domain. */
    if (UTAMA) { location.href = UTAMA + '/login?mode=daftar#daftar=' + encodeURIComponent(JSON.stringify(bawa)); return; }
    try { sessionStorage.setItem('catalyst-daftar', JSON.stringify(bawa)); } catch (err) {}
    location.href = '/login?mode=daftar';
  });
  if (!hemat && matchMedia('(pointer: fine)').matches) {
    document.querySelector('.pp-hero').addEventListener('pointermove', function (e) {
      var r = wrap.getBoundingClientRect();
      var x = (e.clientX - (r.left + r.width / 2)) / innerWidth, y = (e.clientY - (r.top + r.height / 2)) / innerHeight;
      kartu.style.transform = 'rotateX(' + (6 - y * 18).toFixed(2) + 'deg) rotateY(' + (-12 + x * 30).toFixed(2) + 'deg)';
      var k = kartu.getBoundingClientRect();
      kartu.style.setProperty('--mx', ((e.clientX - k.left) / k.width * 100).toFixed(1) + '%');
      kartu.style.setProperty('--my', ((e.clientY - k.top) / k.height * 100).toFixed(1) + '%');
    });
    document.querySelector('.pp-hero').addEventListener('pointerleave', function () { kartu.style.transform = ''; });
  }

  /* ---------- tur fitur: tab berganti sendiri sampai pengunjung memilih ---------- */
  var tab = [].slice.call(document.querySelectorAll('.pp-tur-list [role="tab"]'));
  var progres = document.querySelector('.pp-tur-progres i');
  var aktif = 0, otomatis = !hemat, timer = null;
  function pilih(i, dariPengguna) {
    aktif = (i + tab.length) % tab.length;
    tab.forEach(function (t, n) {
      var pane = document.getElementById(t.getAttribute('aria-controls'));
      t.setAttribute('aria-selected', String(n === aktif));
      t.tabIndex = n === aktif ? 0 : -1;
      pane.hidden = n !== aktif;
      pane.classList.toggle('on', n === aktif);
    });
    if (dariPengguna) { otomatis = false; clearTimeout(timer); progres.classList.remove('jalan'); }
    else jadwal();
  }
  function jadwal() {
    if (!otomatis) return;
    clearTimeout(timer);
    progres.classList.remove('jalan'); void progres.offsetWidth; progres.classList.add('jalan');
    timer = setTimeout(function () { pilih(aktif + 1); }, 7000);
  }
  tab.forEach(function (t, i) {
    t.addEventListener('click', function () { pilih(i, true); });
    t.addEventListener('keydown', function (e) {
      var n = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!n) return;
      e.preventDefault(); pilih(aktif + n, true); tab[aktif].focus();
    });
  });
  var tur = document.getElementById('ppTur');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) jadwal(); else { clearTimeout(timer); progres.classList.remove('jalan'); } });
    }, { threshold: .35 }).observe(tur);
  }
  tur.addEventListener('pointerenter', function () { if (otomatis) { clearTimeout(timer); progres.classList.remove('jalan'); } });
  tur.addEventListener('pointerleave', jadwal);
  pilih(0);
  clearTimeout(timer);

  /* ---------- tahap Journey: satu tahap menyala bergantian sampai disentuh ---------- */
  var jy = [].slice.call(document.querySelectorAll('#ppJy li')), jyKe = 0, jyTimer = null;
  function nyala() {
    jy.forEach(function (l, i) { l.classList.toggle('on', i === jyKe); });
    jyKe = (jyKe + 1) % jy.length;
  }
  if (!hemat) jyTimer = setInterval(nyala, 1800);
  jy.forEach(function (l) {
    l.addEventListener('pointerenter', function () { clearInterval(jyTimer); jy.forEach(function (x) { x.classList.remove('on'); }); });
  });

  /* ---------- sudah masuk: tombol membuka Passport ---------- */
  var masuk = false;
  try { masuk = Object.keys(localStorage).some(function (k) { return /^sb-.+-auth-token$/.test(k); }); } catch (e) {}
  if (masuk) {
    [].forEach.call(document.querySelectorAll('.js-klaim'), function (a) {
      a.href = '/passport/';
      a.firstChild.nodeValue = 'Buka Passport saya ';
    });
    [].forEach.call(document.querySelectorAll('.js-tamu'), function (a) { a.hidden = true; });
    var kirim = form.querySelector('button[type="submit"]');
    if (kirim) kirim.firstChild.nodeValue = 'Buka Passport saya ';
  }
  perbarui();
})();
