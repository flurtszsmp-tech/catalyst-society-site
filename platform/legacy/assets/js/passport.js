/* ===========================================================
   Catalyst Passport. Penampil dasbor.

   Melayani dua tampilan dari satu berkas:
     body[data-view="owner"]  passport.html, dasbor milik sendiri
     body[data-view="public"] p.html, profil yang dibagikan

   Sumber data: window.CATALYST_DEMO (assets/js/demo.js). Nama dan logo
   komunitas diambil dari window.CATALYST_COMMUNITIES kalau tersedia,
   supaya direktori komunitas dan passport tidak pernah berbeda.

   Autentikasi belum dipasang. Semua yang tampil di sini adalah data
   contoh di perangkat masing masing; tidak ada yang dikirim ke mana pun.
   =========================================================== */
(function () {
  'use strict';

  var DEMO = window.CATALYST_DEMO;
  if (!DEMO) return;
  var D = DEMO.data;
  var P = D.profil || {};
  var KOM = window.CATALYST_COMMUNITIES;

  var publik = document.body.dataset.view === 'public';

  /* ---------- bantu ---------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function ik(name, cls) {
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true"><use href="#ps-' + name + '"/></svg>';
  }
  function angka(n) {
    return new Intl.NumberFormat('id-ID').format(n || 0);
  }
  function el(id) { return document.getElementById(id); }
  function isi(id, html) { var n = el(id); if (n) n.innerHTML = html; }

  function inisial(nama) {
    return (nama || '?').trim().split(/\s+/).slice(0, 2)
      .map(function (w) { return w[0]; }).join('').toUpperCase();
  }

  /* Bulan dalam bahasa Indonesia untuk rentang "Jan 2026 - Sekarang". */
  var BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  function bulanTahun(ym) {
    if (!ym) return '';
    var b = String(ym).split('-');
    var i = parseInt(b[1], 10) - 1;
    return (BULAN[i] || '') + ' ' + b[0];
  }

  /* Avatar: foto kalau ada, kalau tidak inisial di atas bidang gelap.
     Tidak pernah merender <img> dengan src kosong; itu tampil sebagai
     ikon gambar rusak, bukan sebagai "belum ada foto". */
  function avatar(kelas) {
    if (P.avatar_url) {
      return '<img class="' + kelas + '" src="' + esc(P.avatar_url) + '" alt="' + esc(P.full_name) + '">';
    }
    return '<span class="' + kelas + ' pass-ini">' + esc(inisial(P.full_name)) + '</span>';
  }

  /* ---------- alamat berbagi ---------- */

  function alamatBagi() {
    var dasar = location.href.replace(/[^/]*$/, '');
    return dasar + 'p.html?id=' + encodeURIComponent(P.slug || '');
  }

  /* ---------- pesan singkat ---------- */

  var toast;
  function kabar(teks) {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'pass-toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = teks;
    toast.classList.add('on');
    clearTimeout(kabar._t);
    kabar._t = setTimeout(function () { toast.classList.remove('on'); }, 2000);
  }

  /* Menyalin punya tiga lapis, karena tidak satu pun berlaku di semua
     keadaan:
       1. Clipboard API. Butuh konteks aman dan dokumen yang sedang fokus.
          Kalau jendela tidak fokus ia menolak dengan NotAllowedError.
       2. execCommand('copy') lewat textarea sementara. Usang tetapi masih
          jalan di konteks tidak aman; tetap butuh fokus.
       3. Kalau keduanya gagal, teksnya disorot di kolom yang terlihat
          supaya pengguna bisa menekan Ctrl+C sendiri. Memberi jalan keluar
          lebih berguna daripada sekadar mengabarkan kegagalan.
     Argumen "sorot" adalah <input> yang memuat teks yang sama, kalau ada. */
  function salin(teks, pesan, sorot) {
    function berhasil() { kabar(pesan || 'Tersalin'); }

    function lapisTiga() {
      if (sorot && sorot.select) {
        sorot.focus();
        sorot.select();
        kabar('Tekan Ctrl+C untuk menyalin');
      } else {
        kabar('Tidak bisa menyalin otomatis. Salin manual dari kolom tautan.');
      }
    }

    function lapisDua() {
      var t = document.createElement('textarea');
      t.value = teks;
      t.setAttribute('readonly', '');
      t.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(t);
      t.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      t.remove();
      if (ok) berhasil(); else lapisTiga();
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(teks).then(berhasil, lapisDua);
    } else {
      lapisDua();
    }
  }

  /* =========================================================
     Kartu Passport
     ========================================================= */
  function kartuPassport() {
    var tahap = (D.journey || []).map(function (j) { return j.stage; });
    var kini = tahap.indexOf(P.journey_stage);
    if (kini < 0) kini = 0;
    /* Bilah kemajuan mengukur posisi tahap sekarang di antara seluruh
       tahap, bukan jumlah poin. Tahap terakhir berarti penuh. */
    var maju = tahap.length > 1 ? (kini / (tahap.length - 1)) * 100 : 0;
    var namaTahap = function (s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; };

    var aksi = publik ? '' :
      '<div class="pass-hero-act">' +
        '<a class="pass-edit" href="app.html#passport">' + ik('pencil') + 'Edit Profile</a>' +
        '<button class="pass-share" id="ppShare" aria-label="Bagikan profil">' + ik('share') + '</button>' +
      '</div>';

    var kotakId =
      '<div class="pass-idbox">' +
        '<div><span class="cap">Catalyst ID</span><b>' + esc(P.catalyst_id || '') + '</b></div>' +
        '<button id="ppCopyId" aria-label="Salin Catalyst ID">' + ik('copy') + '</button>' +
      '</div>';

    isi('ppHero',
      '<div class="pass-hero-cap">Catalyst Passport</div>' +
      aksi + kotakId +
      ik('spark4', 'mark pass-hero-mark') +
      '<div class="pass-hero-top">' +
        avatar('pass-photo') +
        '<div class="pass-hero-body">' +
          '<h1>' + esc(P.full_name || '') +
            (P.is_verified ? ik('verified', 'pass-verified') : '') + '</h1>' +
          (P.headline ? '<div class="pass-role">' + esc(P.headline) + '</div>' : '') +
          (P.location ? '<div class="pass-loc">' + ik('pin') + esc(P.location) + '</div>' : '') +
          ((P.skills || []).length
            ? '<div class="pass-skills">' + P.skills.map(function (s) {
                return '<span class="pass-skill">' + esc(s) + '</span>'; }).join('') + '</div>'
            : '') +
        '</div>' +
      '</div>' +

      '<div class="pass-stats">' +
        '<div class="pass-stat"><b>' + ik('bolt') + angka(P.cata_points) + '</b><span>CATA Points</span></div>' +
        '<div class="pass-stat"><b>' + (D.komunitas || []).length + '</b><span>Communities</span></div>' +
        '<div class="pass-stat"><b>' + (D.badge || []).length + '</b><span>Badges</span></div>' +
        '<div class="pass-stat"><b>' + esc(namaTahap(P.journey_stage)) + '</b><span>Journey Stage</span></div>' +
      '</div>' +

      '<div class="pass-prog">' +
        '<div class="pass-prog-lbl"><span>' + esc(namaTahap(P.journey_stage)) + '</span>' +
          '<span>' + esc(namaTahap(tahap[tahap.length - 1])) + '</span></div>' +
        '<div class="pass-prog-bar"><i style="width:0"></i></div>' +
      '</div>');

    /* Lebar dipasang di bingkai berikutnya supaya transisinya terlihat. */
    requestAnimationFrame(function () {
      var bar = document.querySelector('.pass-prog-bar i');
      if (bar) bar.style.width = maju.toFixed(1) + '%';
    });

    var cid = el('ppCopyId');
    if (cid) cid.addEventListener('click', function () {
      salin(P.catalyst_id || '', 'Catalyst ID tersalin');
    });
    var sh = el('ppShare');
    if (sh) sh.addEventListener('click', function () {
      var kartu = el('ppShareCard');
      if (kartu) kartu.scrollIntoView({ behavior: 'smooth', block: 'center' });
      salin(alamatBagi(), 'Tautan profil tersalin', el('ppUrl'));
    });
  }

  /* =========================================================
     Tentang
     ========================================================= */
  var SOSIAL = [
    { key: 'linkedin',  label: 'LinkedIn',  ikon: 'linkedin' },
    { key: 'instagram', label: 'Instagram', ikon: 'instagram' },
    { key: 'twitter',   label: 'Twitter / X', ikon: 'x' },
    { key: 'youtube',   label: 'YouTube',   ikon: 'youtube' },
    { key: 'portfolio', label: 'Portfolio', ikon: 'globe' },
    { key: 'cv',        label: 'CV / Resume', ikon: 'doc' }
  ];

  function kartuTentang() {
    var s = P.socials || {};
    /* Keenam kanal selalu tampil supaya barisnya utuh, tetapi yang belum
       diisi dirender sebagai label mati: tidak bisa diklik, tidak bisa
       difokus, dan ditandai "belum diisi". Menyembunyikannya membuat
       pemilik profil tidak tahu apa lagi yang bisa ditambahkan; membuatnya
       tetap sebagai tautan akan mengantar orang ke halaman kosong. */
    var tautan = SOSIAL.map(function (x) {
      if (s[x.key]) {
        return '<a class="pass-link" href="' + esc(s[x.key]) + '" target="_blank" rel="noopener noreferrer">' +
          ik(x.ikon) + esc(x.label) + '</a>';
      }
      if (publik) return '';
      return '<span class="pass-link kosong" aria-disabled="true" title="Belum diisi">' +
        ik(x.ikon) + esc(x.label) + '</span>';
    }).join('');

    if (!P.about && !tautan) { var n = el('ppAboutCard'); if (n) n.remove(); return; }

    isi('ppAbout',
      '<h2>About Me</h2>' +
      (P.about ? '<p>' + esc(P.about) + '</p>' : '') +
      (tautan ? '<div class="pass-links">' + tautan + '</div>' : ''));
  }

  /* =========================================================
     Perjalanan
     ========================================================= */
  function kartuJourney() {
    var list = D.journey || [];
    if (!list.length) { var n = el('ppJourneyCard'); if (n) n.remove(); return; }

    var tahap = list.map(function (j) { return j.stage; });
    var kini = tahap.indexOf(P.journey_stage);
    if (kini < 0) kini = 0;

    var bagian = [];
    list.forEach(function (j, i) {
      /* Satu tahap sesudah yang sekarang ditandai sebagai tujuan.
         Sisanya di belakang dianggap sudah dilalui. */
      var tujuan = i === list.length - 1;
      var lewat = i <= kini;
      if (i) {
        bagian.push('<div class="pass-join' + (lewat ? '' : ' off') + '">' + ik('check') + '</div>');
      }
      bagian.push(
        '<div class="pass-step' + (tujuan ? ' next' : '') + '">' +
          ik('j-' + j.stage, 'ico') +
          '<b>' + esc(j.title) + '</b>' +
          '<span>' + esc(j.detail || '') + '</span>' +
          (tujuan
            ? '<span class="goal">Next Goal</span>'
            : '<em>' + esc(j.occurred_at ? bulanTahun(j.occurred_at.slice(0, 7)) : '') + '</em>') +
        '</div>');
    });

    isi('ppJourney', '<h2>Journey</h2><div class="pass-journey">' + bagian.join('') + '</div>');
  }

  /* =========================================================
     Komunitas
     ========================================================= */
  function cariKom(slug) {
    if (!KOM || !slug) return null;
    var semua = KOM.items || [];
    for (var i = 0; i < semua.length; i++) if (semua[i].slug === slug) return semua[i];
    return null;
  }

  function kartuKomunitas() {
    var list = D.komunitas || [];
    if (!list.length) { var n = el('ppComsCard'); if (n) n.remove(); return; }

    var sel = list.map(function (k) {
      var ref = cariKom(k.slug);
      var nama = (ref && ref.name) || k.name || '';
      var logo = ref && ref.logo;
      var tuju = ref ? 'community.html?c=' + encodeURIComponent(ref.slug) : null;
      var isiSel =
        (logo ? '<img src="' + esc(logo) + '" alt="" loading="lazy">'
              : '<span class="pass-ini" style="width:26px;height:26px;font-size:9px">' +
                 esc(inisial(nama)) + '</span>') +
        '<span>' + esc(nama) + '</span>';
      return tuju
        ? '<a class="pass-com" href="' + esc(tuju) + '">' + isiSel + '</a>'
        : '<span class="pass-com">' + isiSel + '</span>';
    });

    if (!publik) {
      sel.push('<a class="pass-com add" href="communities.html">' + ik('plus') + 'Join More Communities</a>');
    }

    isi('ppComs',
      '<div class="pass-head"><h2>Communities</h2>' +
        '<a class="pass-all" href="communities.html">View all (' + list.length + ')</a></div>' +
      '<div class="pass-coms">' + sel.join('') + '</div>');
  }

  /* =========================================================
     Projek
     ========================================================= */
  function kartuProjek() {
    var list = D.projek || [];
    if (!list.length) { var n = el('ppProjCard'); if (n) n.remove(); return; }

    var baris = list.map(function (p) {
      var rentang = bulanTahun(p.started_at) +
        (p.ended_at ? ' – ' + bulanTahun(p.ended_at) : ' – Sekarang');
      /* Wajah kolaborator belum punya foto; yang ditampilkan hanya
         jumlahnya, bukan lingkaran kosong yang menyamar jadi orang. */
      var wajah = p.collaborators
        ? '<span class="pass-faces"><span class="more">+' + p.collaborators + '</span></span>'
        : '';
      var tombol = p.url
        ? '<a class="pass-outline" href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer">View Project</a>'
        : '<span class="pass-outline" aria-disabled="true">View Project</span>';
      return '<div class="pass-proj">' +
        '<div class="pass-proj-lbl">Projects</div>' +
        '<div class="pass-proj-body">' +
          '<h3>' + esc(p.title) + '</h3>' +
          (p.description ? '<p>' + esc(p.description) + '</p>' : '') +
          '<div class="pass-proj-meta">' +
            (p.role ? '<span class="pass-tag">' + esc(p.role) + '</span>' : '') +
            '<time>' + esc(rentang) + '</time>' +
          '</div>' +
        '</div>' +
        '<div class="pass-proj-side">' + wajah + tombol + '</div>' +
      '</div>';
    }).join('');

    isi('ppProj', baris);
  }

  /* =========================================================
     Bagikan profil
     ========================================================= */
  function kartuBagikan() {
    var url = alamatBagi();
    var judul = (P.full_name || 'Catalyst Passport') + ' — Catalyst Society';

    isi('ppShareBox',
      '<h2>Share Your Profile</h2>' +
      '<p class="pass-share-sub">Satu profil untuk semuanya. Bagikan sekali, terhubung di mana saja.</p>' +
      '<div class="pass-url">' +
        '<input id="ppUrl" value="' + esc(url) + '" readonly aria-label="Tautan profil">' +
        '<button id="ppCopyUrl" aria-label="Salin tautan">' + ik('copy') + '</button>' +
      '</div>' +
      '<div class="pass-share-row">' +
        '<a href="https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url) + '"' +
          ' target="_blank" rel="noopener noreferrer" aria-label="Bagikan ke LinkedIn">' + ik('linkedin') + '</a>' +
        '<a href="https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) +
          '&text=' + encodeURIComponent(judul) + '"' +
          ' target="_blank" rel="noopener noreferrer" aria-label="Bagikan ke X">' + ik('x') + '</a>' +
        '<button id="ppCopyUrl2" aria-label="Salin tautan">' + ik('globe') + '</button>' +
        '<button id="ppQr" aria-label="Tampilkan kode QR" aria-expanded="false">' + ik('qr') + '</button>' +
      '</div>' +
      '<div class="pass-qr" id="ppQrBox" hidden></div>');

    var pesan = 'Tautan profil tersalin';
    [el('ppCopyUrl'), el('ppCopyUrl2')].forEach(function (b) {
      if (b) b.addEventListener('click', function () { salin(url, pesan, el('ppUrl')); });
    });
    var inp = el('ppUrl');
    if (inp) inp.addEventListener('focus', function () { inp.select(); });

    var tombolQr = el('ppQr');
    if (tombolQr) tombolQr.addEventListener('click', function () {
      var kotak = el('ppQrBox');
      var buka = kotak.hasAttribute('hidden');
      if (buka) { kotak.removeAttribute('hidden'); gambarQr(kotak, url); }
      else { kotak.setAttribute('hidden', ''); }
      tombolQr.setAttribute('aria-expanded', String(buka));
    });
  }

  /* qrcode-generator dimuat dari CDN. Kalau gagal dimuat, kotaknya
     mengatakan begitu, bukan diam kosong. Tiap gambar memakai instans
     baru: satu instans hanya bisa dipakai sekali. */
  function gambarQr(kotak, teks) {
    kotak.innerHTML = '';
    if (typeof window.qrcode !== 'function') {
      kotak.innerHTML = '<p class="pass-qr-note">Kode QR tidak dapat dimuat. Salin tautannya saja.</p>';
      return;
    }
    var tingkat = ['M', 'L'];
    for (var i = 0; i < tingkat.length; i++) {
      try {
        var q = window.qrcode(0, tingkat[i]);
        q.addData(teks);
        q.make();
        kotak.innerHTML = '<div class="pass-qr-box">' +
          q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }) + '</div>' +
          '<p class="pass-qr-note">Pindai untuk membuka profil ini.</p>';
        return;
      } catch (e) {
        /* Pustaka ini melempar string biasa, bukan Error, jadi e.message
           akan undefined. Dicatat sebagai String supaya terbaca. */
        if (i === tingkat.length - 1) {
          kotak.innerHTML = '<p class="pass-qr-note">Kode QR gagal dibuat: ' + esc(String(e)) + '</p>';
        }
      }
    }
  }

  /* =========================================================
     Poin CATA
     ========================================================= */
  function kartuPoin() {
    var poin = D.poin || { seri: [], delta: 0 };
    var seri = poin.seri || [];
    if (!seri.length) { var n = el('ppPointsCard'); if (n) n.remove(); return; }

    var nilai = seri.map(function (x) { return x.nilai; });
    var min = Math.min.apply(null, nilai);
    var max = Math.max.apply(null, nilai);
    var rentang = max - min || 1;
    var W = 300, H = 66, pad = 4;

    var titik = nilai.map(function (v, i) {
      var x = seri.length > 1 ? (i / (seri.length - 1)) * W : W / 2;
      var y = H - pad - ((v - min) / rentang) * (H - pad * 2);
      return [x, y];
    });

    /* Kurva halus lewat titik tengah, supaya garisnya tidak patah patah. */
    var d = 'M' + titik[0][0].toFixed(1) + ' ' + titik[0][1].toFixed(1);
    for (var i = 1; i < titik.length; i++) {
      var a = titik[i - 1], b = titik[i];
      var cx = (a[0] + b[0]) / 2;
      d += ' C' + cx.toFixed(1) + ' ' + a[1].toFixed(1) +
           ' ' + cx.toFixed(1) + ' ' + b[1].toFixed(1) +
           ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
    }

    var bulat = titik.map(function (t) {
      return '<circle class="node" cx="' + t[0].toFixed(1) + '" cy="' + t[1].toFixed(1) + '" r="2.6"/>';
    }).join('');

    isi('ppPoints',
      '<h2>CATA Points</h2>' +
      '<div class="pass-pts">' +
        '<div><div class="pass-pts-num">' + ik('bolt') + angka(P.cata_points) + '</div>' +
          '<div class="pass-pts-cap">Total Points</div></div>' +
        (poin.delta
          ? '<span class="pass-delta">' + ik('up') + angka(poin.delta) + ' bulan ini</span>'
          : '') +
      '</div>' +
      '<div class="pass-spark">' +
        '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
          '<path class="line" vector-effect="non-scaling-stroke" d="' + d + '"/>' + bulat +
        '</svg>' +
        '<div class="pass-months">' + seri.map(function (x) {
          return '<span>' + esc(x.bulan) + '</span>'; }).join('') + '</div>' +
      '</div>' +
      (publik ? '' : '<a class="pass-analytics" href="app.html#passport">View Analytics' + ik('arrow') + '</a>'));
  }

  /* =========================================================
     Lencana
     ========================================================= */
  function kartuBadge() {
    var list = D.badge || [];
    if (!list.length) { var n = el('ppBadgesCard'); if (n) n.remove(); return; }

    var sel = list.map(function (b, i) {
      return '<div class="pass-badge' + (i === 0 ? ' solid' : '') + '">' +
        '<span class="pass-hex">' +
          '<svg class="frame" viewBox="0 0 46 48" aria-hidden="true"><use href="#ps-hex"/></svg>' +
          ik('b-' + b.icon, 'ico') +
        '</span>' +
        '<span>' + esc(b.name) + '</span>' +
      '</div>';
    }).join('');

    isi('ppBadges',
      '<div class="pass-head"><h2>Badges</h2>' +
        '<span class="pass-all">View all (' + list.length + ')</span></div>' +
      '<div class="pass-badges">' + sel + '</div>');
  }

  /* =========================================================
     Sertifikat
     ========================================================= */
  function kartuSertifikat() {
    var list = D.sertifikat || [];
    if (!list.length) { var n = el('ppCertsCard'); if (n) n.remove(); return; }

    /* Berkas gambar sertifikat belum ada. Daripada merender <img> rusak,
       digambar bidang kertas dengan lambang penghargaan dan judulnya. */
    var sel = list.slice(0, 2).map(function (c) {
      return '<div class="pass-cert">' +
        '<div class="thumb">' + ik('award', 'pass-cert-ico') + '</div>' +
        '<div class="meta"><b>' + esc(c.title) + '</b>' +
          (c.issuer ? '<span>' + esc(c.issuer) + '</span>' : '') + '</div>' +
      '</div>';
    }).join('');

    isi('ppCerts',
      '<div class="pass-head"><h2>Certificates</h2>' +
        '<span class="pass-all">View all (' + list.length + ')</span></div>' +
      '<div class="pass-certs">' + sel + '</div>');
  }

  /* =========================================================
     Bilah atas dan sisi kiri
     ========================================================= */
  function rangka() {
    if (publik) return;

    isi('ppMe',
      avatar('') +
      '<div><b>' + esc(P.full_name || '') + '</b>' +
        '<span>' + esc(P.catalyst_id || '') + '</span></div>' +
      ik('chevron', 'chev'));

    var lonceng = el('ppBell');
    if (lonceng && P.notifications) {
      lonceng.insertAdjacentHTML('beforeend', '<span class="pass-dot">' + P.notifications + '</span>');
    }

    var burger = el('ppBurger');
    var sisi = el('ppSide');
    var scrim = el('ppScrim');
    if (burger && sisi && scrim) {
      var buka = function (on) {
        sisi.classList.toggle('open', on);
        scrim.classList.toggle('on', on);
        document.body.classList.toggle('locked', on);
      };
      burger.addEventListener('click', function () { buka(!sisi.classList.contains('open')); });
      scrim.addEventListener('click', function () { buka(false); });
      sisi.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { buka(false); });
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') buka(false);
      });
    }
  }

  /* =========================================================
     Tampilan publik
     ========================================================= */
  function publikSiap() {
    if (!publik) return true;
    var minta = new URLSearchParams(location.search).get('id') || '';
    /* Demo hanya berisi satu profil. Alamat yang menunjuk ke orang lain
       dijawab terus terang, bukan dengan menampilkan profil yang salah. */
    if (minta && P.slug && minta.toLowerCase() !== String(P.slug).toLowerCase()) {
      var akar = el('ppPublicRoot');
      if (akar) {
        akar.innerHTML = '<div class="pass-card" style="text-align:center;padding:60px 24px">' +
          '<h2>Profil tidak ditemukan</h2>' +
          '<p class="pass-share-sub" style="margin:10px 0 20px">' +
            'Tautan ini menunjuk ke profil yang tidak ada di demo ini.</p>' +
          '<a class="pass-outline" href="index.html">Kembali ke beranda</a></div>';
      }
      return false;
    }
    document.title = (P.full_name || 'Catalyst Passport') + ' — Catalyst Passport';
    return true;
  }

  /* ---------- mulai ---------- */
  function mulai() {
    if (!publikSiap()) return;
    rangka();
    kartuPassport();
    kartuTentang();
    kartuJourney();
    kartuKomunitas();
    kartuProjek();
    kartuBagikan();
    kartuPoin();
    kartuBadge();
    kartuSertifikat();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mulai);
  } else {
    mulai();
  }
})();
