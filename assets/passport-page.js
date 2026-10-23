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

  /* ---------- Journey: pilih tahap lewat tombol, panah, atau keyboard ---------- */
  var JY = [
    ['Penjelajah', 'Anda baru bergabung dan mulai memetakan minat di lima industri.', 'Buat Catalyst Passport. Catalyst ID Anda langsung terbit.', ['Catalyst ID dan profil profesional', 'Akses ke direktori komunitas mitra', 'Kartu Journey yang bisa dibagikan'], 'Catalyst Passport', '+20 poin CATA saat profil lengkap'],
    ['Penghubung', 'Anda aktif di komunitas dan mulai membangun jaringan.', 'Ikuti lima komunitas mitra dan terhubung dengan lima anggota.', ['Jaringan lintas industri', 'Info event dan peluang lebih awal', 'Profil lebih mudah ditemukan di Connections'], 'Community dan Connections', '+25 poin CATA'],
    ['Pembelajar', 'Anda menantang diri lewat kelas dan bootcamp.', 'Unggah sertifikat dan selesaikan satu sesi bootcamp Catalyst.', ['Kelas dari praktisi industri', 'Sertifikat terverifikasi di profil', 'Akses langsung ke mentor'], 'Catalyst Academy', '+50 poin CATA'],
    ['Pembuat karya', 'Anda punya karya nyata: projek, produk, atau komunitas.', 'Tambahkan projek atau komunitas yang pernah Anda bangun.', ['Portofolio di profil publik', 'Kredibilitas di mata mitra dan perekrut', 'Kesempatan tampil di showcase Catalyst'], 'Projects di Catalyst Passport', '+75 poin CATA'],
    ['Kolaborator', 'Anda membantu projek orang lain berhasil.', 'Berkontribusi di projek lewat Catalyst Finder, lalu diverifikasi tim.', ['Pengalaman kerja tim yang nyata', 'Rekomendasi dari pemilik projek', 'Akses ke projek dan peluang kerja baru'], 'Catalyst Finder', '+100 poin CATA'],
    ['Pembangun', 'Anda memimpin projek sendiri bersama Catalyst Labs.', 'Bangun projek di Catalyst Labs, lalu ajukan verifikasi.', ['Pendampingan mentor yang intensif', 'Kerangka dari ide sampai peluncuran', 'Jalur menuju pendanaan'], 'Catalyst Labs', '+150 poin CATA'],
    ['Pemimpin bisnis', 'Anda memimpin bisnis bervaluasi di atas Rp100 juta.', 'Ajukan verifikasi bisnis, diperiksa langsung oleh tim Catalyst.', ['Jaringan Founder eksklusif', 'Akses investor lewat Ventures dan Summit', 'Merchandise eksklusif Catalyst'], 'Catalyst Ventures dan Summit', '+300 poin CATA']
  ];
  var JY_NAMA = ['Explorer', 'Connector', 'Challenger', 'Innovator', 'Contributor', 'Builder', 'Founder'];
  var jv = document.getElementById('ppJourney');
  if (jv) {
    var seg = [].slice.call(jv.querySelectorAll('.jv-seg button'));
    var isi = jv.querySelector('.jv-isi'), prev = jv.querySelector('.jv-prev'), next = jv.querySelector('.jv-next');
    var jyKe = 0;
    var teks = function (sel, v) { jv.querySelector(sel).textContent = v; };
    var tampilJy = function (i, animasi) {
      jyKe = Math.max(0, Math.min(6, i));
      var d = JY[jyKe];
      jv.style.setProperty('--p', jyKe);
      jv.classList.toggle('founder', jyKe === 6);
      seg.forEach(function (b, n) {
        b.setAttribute('aria-selected', String(n === jyKe));
        b.tabIndex = n === jyKe ? 0 : -1;
        b.classList.toggle('lewat', n < jyKe);
      });
      teks('.jv-ke', jyKe + 1);
      teks('.jv-peran', 'Anda sebagai ' + d[0]);
      teks('.jv-nama', JY_NAMA[jyKe]);
      teks('.jv-ringkas', d[1]);
      teks('.jv-syarat', d[2]);
      teks('.jv-poin', d[5]);
      teks('.jv-program', d[4]);
      jv.querySelector('.jv-manfaat').innerHTML = d[3].map(function (x) { return '<li>' + x.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }) + '</li>'; }).join('');
      prev.disabled = jyKe === 0; next.disabled = jyKe === 6;
      if (animasi) { isi.classList.remove('ganti'); void isi.offsetWidth; isi.classList.add('ganti'); }
    };
    seg.forEach(function (b, n) {
      b.addEventListener('click', function () { tampilJy(n, true); });
      b.addEventListener('keydown', function (e) {
        var k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (!k) return;
        e.preventDefault(); tampilJy(jyKe + k, true); seg[jyKe].focus();
      });
    });
    prev.addEventListener('click', function () { tampilJy(jyKe - 1, true); });
    next.addEventListener('click', function () { tampilJy(jyKe + 1, true); });
    /* Geser kiri atau kanan di ponsel untuk berpindah tahap. */
    var awalX = null;
    isi.addEventListener('touchstart', function (e) { awalX = e.touches[0].clientX; }, { passive: true });
    isi.addEventListener('touchend', function (e) {
      if (awalX == null) return;
      var dx = e.changedTouches[0].clientX - awalX; awalX = null;
      if (Math.abs(dx) > 50) tampilJy(jyKe + (dx < 0 ? 1 : -1), true);
    });
    tampilJy(0, false);
  }

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
