/* ===========================================================
   Catalyst Society. Penampil direktori komunitas.

   Satu berkas melayani dua halaman:
   - communities.html  (body[data-page="directory"])  daftar + saring + cari
   - community.html    (body[data-page="detail"])     satu komunitas

   Datanya datang dari assets/js/communities-data.js. Aturan tampilnya
   mengikuti "Communities Configuration" milik Catalyst: bidang yang kosong
   tidak dirender, bukan dirender kosong.
   =========================================================== */
(function () {
  'use strict';

  var DATA = window.CATALYST_COMMUNITIES;
  if (!DATA) return;

  /* ---------- kamus halaman ----------
     Teks milik halaman komunitas saja. Bilah navigasi dan kaki halaman
     tetap diterjemahkan oleh i18n.js lewat data-i18n seperti biasa. */
  var TEKS = {
    id: {
      semua: 'Semua',
      cari: 'Cari komunitas',
      kosong: 'Tidak ada komunitas yang cocok.',
      reset: 'Tampilkan semua',
      hitung: function (n) { return n + (n === 1 ? ' komunitas' : ' komunitas'); },
      komunitas: 'Komunitas',
      anggota: 'anggota',
      gabung: 'Gabung Komunitas',
      gabungSoon: 'Segera',
      catatan: 'Tombol ini membuka kanal resmi komunitas.',
      catatanKosong: 'Kanal pendaftaran komunitas ini belum tersedia.',
      platform: 'Platform',
      terkait: 'Komunitas terkait',
      kembali: 'Semua komunitas',
      takAda: 'Komunitas tidak ditemukan',
      takAdaSub: 'Tautan yang Anda buka tidak cocok dengan komunitas mana pun di direktori.',
      free: 'Free Membership',
      premium: 'Premium Membership',
      selective: 'Selective Membership'
    },
    en: {
      semua: 'All',
      cari: 'Search communities',
      kosong: 'No community matches that.',
      reset: 'Show all',
      hitung: function (n) { return n + (n === 1 ? ' community' : ' communities'); },
      komunitas: 'Community',
      anggota: 'members',
      gabung: 'Join Community',
      gabungSoon: 'Soon',
      catatan: "This opens the community's official channel.",
      catatanKosong: 'This community has no open sign-up channel yet.',
      platform: 'Platforms',
      terkait: 'Related communities',
      kembali: 'All communities',
      takAda: 'Community not found',
      takAdaSub: 'The link you opened does not match any community in the directory.',
      free: 'Free Membership',
      premium: 'Premium Membership',
      selective: 'Selective Membership'
    },
    zh: {
      semua: '全部',
      cari: '搜索社区',
      kosong: '没有匹配的社区。',
      reset: '显示全部',
      hitung: function (n) { return n + ' 个社区'; },
      komunitas: '社区',
      anggota: '名成员',
      gabung: '加入社区',
      gabungSoon: '即将',
      catatan: '此按钮将打开该社区的官方渠道。',
      catatanKosong: '该社区暂未开放报名渠道。',
      platform: '平台',
      terkait: '相关社区',
      kembali: '全部社区',
      takAda: '未找到该社区',
      takAdaSub: '您打开的链接与目录中的任何社区都不匹配。',
      free: 'Free Membership',
      premium: 'Premium Membership',
      selective: 'Selective Membership'
    }
  };

  /* Nama platform tidak diterjemahkan: itu nama merek. */
  var PLATFORM = [
    { key: 'website',   label: 'Website',   ikon: 'p-globe' },
    { key: 'whatsapp',  label: 'WhatsApp',  ikon: 'p-wa' },
    { key: 'instagram', label: 'Instagram', ikon: 'p-ig' },
    { key: 'discord',   label: 'Discord',   ikon: 'p-discord' },
    { key: 'telegram',  label: 'Telegram',  ikon: 'p-tg' },
    { key: 'tiktok',    label: 'TikTok',    ikon: 'p-tiktok' },
    { key: 'youtube',   label: 'YouTube',   ikon: 'p-yt' },
    { key: 'linkedin',  label: 'LinkedIn',  ikon: 'p-in' },
    { key: 'facebook',  label: 'Facebook',  ikon: 'p-fb' },
    { key: 'twitter',   label: 'X',         ikon: 'p-x' },
    { key: 'github',    label: 'GitHub',    ikon: 'p-gh' },
    { key: 'email',     label: 'Email',     ikon: 'p-mail' }
  ];

  var LOGO_DEFAULT = 'assets/community/default-logo.svg';

  /* ---------- bantu ---------- */

  function bahasa() {
    var l = (document.documentElement.lang || 'id').slice(0, 2).toLowerCase();
    return TEKS[l] ? l : 'id';
  }
  function t() { return TEKS[bahasa()]; }

  /* Memilih varian bahasa dari bidang {id,en,zh}. Kalau bahasa aktif kosong,
     jatuh ke Indonesia, lalu ke Inggris. Bidang yang benar benar kosong
     mengembalikan string kosong supaya pemanggilnya bisa menyembunyikannya. */
  function pilih(bidang) {
    if (!bidang) return '';
    if (typeof bidang === 'string') return bidang;
    return bidang[bahasa()] || bidang.id || bidang.en || '';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Aturan 5: yang berstatus hidden tidak muncul di mana pun.
     Aturan 9: urutan tampil mengikuti order menaik. */
  function tampil() {
    return (DATA.items || [])
      .filter(function (c) { return c.status !== 'hidden'; })
      .slice()
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }

  function cariSlug(slug) {
    var semua = DATA.items || [];
    for (var i = 0; i < semua.length; i++) {
      if (semua[i].slug === slug && semua[i].status !== 'hidden') return semua[i];
    }
    return null;
  }

  function labelKanal(key) {
    var k = (DATA.channels || []).filter(function (c) { return c.key === key; })[0];
    return k ? pilih(k.label) : key;
  }

  function labelKeanggotaan(m) {
    var k = t();
    return m === 'premium' ? k.premium : m === 'selective' ? k.selective : k.free;
  }

  /* Aturan 4: tanpa jumlah anggota, kartu menulis "Komunitas", bukan angka. */
  function labelAnggota(c) {
    var k = t();
    if (!c.members) return k.komunitas;
    var n = c.members >= 1000 ? (c.members / 1000).toFixed(1).replace('.0', '') + 'k' : String(c.members);
    return n + ' ' + k.anggota;
  }

  function ikon(id, kelas) {
    return '<svg class="' + kelas + '" viewBox="0 0 24 24" aria-hidden="true"><use href="#' + id + '"/></svg>';
  }

  /* Aturan 2: tanpa berkas logo, pakai logo bawaan. */
  function logoHtml(c) {
    var src = c.logo || LOGO_DEFAULT;
    return '<span class="com-logo"><img src="' + esc(src) + '" alt="" loading="lazy" decoding="async"></span>';
  }

  function kartu(c) {
    var d = pilih(c.short);
    return '' +
      '<a class="com-card glass" href="community.html?c=' + encodeURIComponent(c.slug) + '">' +
        '<span class="com-card-top">' +
          logoHtml(c) +
          ikon('i-out', 'com-out') +
        '</span>' +
        '<span class="com-title">' + esc(c.name) + ikon('i-spark4', 'com-verified') + '</span>' +
        /* Aturan 3: deskripsi kosong berarti bagiannya tidak dirender. */
        (d ? '<span class="com-desc">' + esc(d) + '</span>' : '<span class="com-desc"></span>') +
        '<span class="com-meta">' +
          '<span class="com-tag">' + esc(c.category) + '</span>' +
          '<span class="com-join-type">' + esc(labelAnggota(c)) + '</span>' +
        '</span>' +
      '</a>';
  }

  /* =========================================================
     Direktori
     ========================================================= */
  function direktori() {
    var petak   = document.getElementById('comGrid');
    var rail    = document.getElementById('comFilter');
    var kotak   = document.getElementById('comSearch');
    var hitung  = document.getElementById('comCount');
    if (!petak) return;

    /* Kanal awal boleh ditentukan dari tautan, misalnya
       communities.html?ch=investments. Nilai yang tidak dikenal diabaikan. */
    var minta = new URLSearchParams(location.search).get('ch');
    var sah = (DATA.channels || []).some(function (c) { return c.key === minta; });
    var kanalAktif = sah ? minta : 'all';
    var kataCari = '';

    function cocok(c) {
      if (kanalAktif !== 'all' && c.channel !== kanalAktif) return false;
      if (!kataCari) return true;
      var q = kataCari.toLowerCase();
      var ladang = [c.name, c.category, pilih(c.short), (c.tags || []).join(' ')].join(' ').toLowerCase();
      return ladang.indexOf(q) !== -1;
    }

    /* Rail dibangun sekali. Saat kanal berganti, yang berubah hanya kelas
       .on; tombolnya tidak diganti. Kalau rail dirender ulang tiap klik,
       tombol yang baru saja ditekan ikut hilang dan fokus keyboard jatuh
       ke <body>, jadi penelusur papan ketik kehilangan tempatnya. */
    function gambarRail() {
      var k = t();
      var kanal = [{ key: 'all', label: { id: k.semua, en: k.semua, zh: k.semua } }]
        .concat(DATA.channels || []);
      rail.innerHTML = kanal.map(function (c) {
        return '<button type="button" data-kanal="' + esc(c.key) + '" aria-pressed="' +
          (c.key === kanalAktif) + '">' + esc(pilih(c.label)) + '</button>';
      }).join('');
      tandaiRail();
    }

    function tandaiRail() {
      rail.querySelectorAll('button[data-kanal]').forEach(function (b) {
        var aktif = b.dataset.kanal === kanalAktif;
        b.classList.toggle('on', aktif);
        b.setAttribute('aria-pressed', aktif);
      });
    }

    function gambarPetak() {
      var k = t();
      var daftar = tampil().filter(cocok);
      if (hitung) hitung.textContent = k.hitung(daftar.length);
      if (!daftar.length) {
        petak.innerHTML = '<div class="com-empty"><p>' + esc(k.kosong) + '</p>' +
          '<button type="button" class="btn ghost" id="comReset">' + esc(k.reset) + '</button></div>';
        var r = document.getElementById('comReset');
        if (r) r.addEventListener('click', function () {
          kanalAktif = 'all'; kataCari = '';
          if (kotak) kotak.value = '';
          tandaiRail(); gambarPetak();
        });
        return;
      }
      petak.innerHTML = daftar.map(kartu).join('');
    }

    function gambar() { gambarRail(); gambarPetak(); }

    rail.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-kanal]');
      if (!b) return;
      kanalAktif = b.dataset.kanal;
      tandaiRail();
      gambarPetak();
    });

    if (kotak) {
      kotak.placeholder = t().cari;
      kotak.addEventListener('input', function () {
        kataCari = kotak.value.trim();
        gambarPetak();
      });
    }

    document.addEventListener('bahasa-berubah', function () {
      if (kotak) kotak.placeholder = t().cari;
      gambar();
    });

    gambar();
  }

  /* =========================================================
     Detail
     ========================================================= */
  function detail() {
    var akar = document.getElementById('comDetail');
    if (!akar) return;

    var slug = new URLSearchParams(location.search).get('c') || '';

    function gambar() {
      var k = t();
      var c = cariSlug(slug);

      if (!c) {
        akar.innerHTML = '<div class="com-404">' +
          '<h1 class="h-lg">' + esc(k.takAda) + '</h1>' +
          '<p class="lead">' + esc(k.takAdaSub) + '</p>' +
          '<a class="btn" href="communities.html">' + esc(k.kembali) + '</a>' +
        '</div>';
        document.title = k.takAda + ' — Catalyst Society';
        return;
      }

      document.title = c.name + ' — Catalyst Society';
      var meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', pilih(c.short) || c.name);

      var penuh = pilih(c.full);
      var tags = c.tags || [];

      /* Aturan 6: tautan sosial kosong berarti ikonnya tidak dirender.
         Aturan 1 yang sama berlaku untuk seluruh daftar platform. */
      var platform = PLATFORM
        .filter(function (p) { return c.links && c.links[p.key]; })
        .map(function (p) {
          return '<a class="com-plat" href="' + esc(c.links[p.key]) + '" target="_blank" rel="noopener noreferrer">' +
            ikon(p.ikon, 'ico') + '<span>' + esc(p.label) + '</span>' + ikon('i-out', 'out') + '</a>';
        }).join('');

      /* Aturan 7: tanpa Join URL, tombolnya mati, bukan mengarah ke mana mana. */
      var joinUrl = c.join && c.join.url;
      var joinLabel = (c.join && pilih(c.join.label)) || k.gabung;
      var tombol = joinUrl
        ? '<a class="btn" href="' + esc(joinUrl) + '" target="_blank" rel="noopener noreferrer">' +
            esc(joinLabel) + ikon('i-out', 'com-out') + '</a>'
        : '<span class="btn btn-soon" aria-disabled="true">' + esc(k.gabung) +
            ' <i>' + esc(k.gabungSoon) + '</i></span>';

      var terkait = tampil().filter(function (o) {
        return o.channel === c.channel && o.slug !== c.slug;
      }).slice(0, 3);

      akar.innerHTML = '' +
        '<a class="com-back" href="communities.html">' + ikon('i-back', '') + esc(k.kembali) + '</a>' +
        '<div class="com-detail">' +
          '<div>' +
            '<div class="com-id">' +
              logoHtml(c) +
              '<div>' +
                '<h1>' + esc(c.name) + ikon('i-spark4', 'com-verified') + '</h1>' +
                '<div class="com-sub">' +
                  '<span>' + esc(labelKanal(c.channel)) + '</span>' +
                  '<span class="dot"></span>' +
                  '<span>' + esc(c.category) + '</span>' +
                  '<span class="dot"></span>' +
                  '<span>' + esc(labelAnggota(c)) + '</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
            (penuh ? '<p class="com-body">' + esc(penuh) + '</p>' : '') +
            /* Aturan 8: tanpa topik belajar, bagiannya tidak dirender. */
            (tags.length ? '<div class="com-tags">' + tags.map(function (x) {
              return '<span class="com-tag">' + esc(x) + '</span>';
            }).join('') + '</div>' : '') +
            ((c.membership || []).length ? '<div class="com-memberships">' + c.membership.map(function (m) {
              return '<span class="com-member">' + esc(labelKeanggotaan(m)) + '</span>';
            }).join('') + '</div>' : '') +
          '</div>' +

          '<aside class="com-aside glass">' +
            tombol +
            '<p class="com-note">' + esc(joinUrl ? k.catatan : k.catatanKosong) + '</p>' +
            (platform ? '<div class="com-platforms">' +
              '<div class="kicker">' + esc(k.platform) + '</div>' + platform + '</div>' : '') +
          '</aside>' +
        '</div>' +

        (terkait.length ? '<section class="com-related">' +
          '<h2>' + esc(k.terkait) + '</h2>' +
          '<div class="com-grid">' + terkait.map(kartu).join('') + '</div>' +
        '</section>' : '');
    }

    document.addEventListener('bahasa-berubah', gambar);
    gambar();
  }

  /* ---------- kilau kaca mengikuti kursor ----------
     Kartu dirender ulang tiap kali bahasa berganti, jadi penanganannya
     dipasang di dokumen, bukan di tiap kartu. */
  function kilau() {
    document.addEventListener('pointermove', function (e) {
      var g = e.target.closest ? e.target.closest('.glass') : null;
      if (!g) return;
      var r = g.getBoundingClientRect();
      g.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100) + '%');
      g.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100) + '%');
    }, { passive: true });
  }

  function mulai() {
    var halaman = document.body.dataset.page;
    if (halaman === 'directory') direktori();
    if (halaman === 'detail') detail();
    kilau();
  }

  /* i18n.js menetapkan document.documentElement.lang di DOMContentLoaded.
     Skrip ini dimuat sesudahnya, jadi penanganannya berjalan belakangan dan
     bahasa sudah terbaca saat render pertama. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mulai);
  } else {
    mulai();
  }
})();
