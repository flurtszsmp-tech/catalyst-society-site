/* ===========================================================
   Direktori Komunitas Kolaborasi Catalyst Society.

   Sumber data: "Informasi Komunitas Kollaborasi.md" dan
   "List Komunitas Kollaborasi 19+.md" dari Bagas. Aturan tampil
   mengikuti "Communities Configuration.md":
   field kosong tidak digambar, tombol Join mati kalau URL kosong.
   =========================================================== */
(function () {
  var wadah = document.getElementById('comGrid');

  function aman(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  var KANAL = {
    investments:   'Investments',
    ai_technology: 'AI & Technology',
    business:      'Business',
    builders:      'Builder',
    social_impact: 'Social Impact'
  };

  var DATA = [
    /* ---------- Investments ---------- */
    { nama:'Blockplay', kanal:'investments', logo:'blockplay.webp',
      topik:['Crypto','Trading','Community'], anggota:['free'],
      web:'https://blockplay.id',
      wa:'https://chat.whatsapp.com/Ftmc9hqbB3v8GIjmwv5P4V',
      ig:'https://www.instagram.com/blockplay.id' },

    { nama:'Investor Saham Pemula', kanal:'investments', logo:'isp.webp',
      topik:['Saham','News','Community'], anggota:['free'],
      web:'https://investorsahampemula.com/',
      wa:'https://www.whatsapp.com/channel/0029Vb6RaXHGJP8RGpsOSQ36' },

    { nama:'Web3 Enthusiast', kanal:'investments', logo:'web3-entusiast.webp',
      topik:['Event Crypto','Saham','Community'], anggota:['free'],
      wa:'https://chat.whatsapp.com/F5XMp6EtHnnLgp7skf2fQQ',
      ig:'https://www.instagram.com/theweb3enthusiast' },

    { nama:'Kompaschain', kanal:'investments', logo:'kompaschain.webp',
      topik:['Crypto','Trading','Community'], anggota:['free'],
      web:'https://lynk.id/kompaschain',
      wa:'https://chat.whatsapp.com/EgtMhGp5zMb9gfLERrOJDa',
      ig:'https://www.instagram.com/kompaschain.community',
      discord:'https://discord.gg/BqeSY2w5F' },

    { nama:'Crypto Legal Community', kanal:'investments', logo:'crypto-legal.webp',
      topik:['Crypto','Hukum','News','Community'], anggota:['free'],
      web:'https://cryptolegalcommunity1.netlify.app',
      wa:'https://chat.whatsapp.com/BQOBBC4E5z72r7iv0vzYik',
      ig:'https://www.instagram.com/cryptolegalcommunity_',
      tiktok:'https://www.tiktok.com/@cryptolegalcommunity_' },

    { nama:'Tradix Community', kanal:'investments', logo:'tradix.webp',
      topik:['Crypto','Trading','Community'], anggota:['free'],
      wa:'https://chat.whatsapp.com/CGpNtgEn2gi8q2oRtxJFFy',
      ig:'https://www.instagram.com/tradixcommunity',
      discord:'https://discord.gg/g3m9syTHA',
      tiktok:'https://www.tiktok.com/@tradixcommunityid' },

    /* ---------- AI & Technology ---------- */
    { nama:'AI Community (AICO)', kanal:'ai_technology', logo:'aico.webp',
      topik:['AI Generative','News','Event','Community'], anggota:['free'],
      web:'https://aicocommunity.myr.id/',
      ig:'https://www.instagram.com/aicocommunity/',
      discord:'https://discord.gg/aico',
      tiktok:'https://www.tiktok.com/@aicocommunity' },

    { nama:'Bisa.AI', kanal:'ai_technology', logo:'bisa.ai.webp',
      topik:['AI Academy','Bootcamp','Community'], anggota:['free'] },

    { nama:'Indonesia AI', kanal:'ai_technology', logo:'indonesia-ai.webp',
      topik:['AI Generative','Prompting','Bootcamp','News'], anggota:['free'] },

    { nama:'Dicoding', kanal:'ai_technology', logo:'dicoding.webp',
      topik:['AI Academy','Workshop','Bootcamp'], anggota:['free','premium'] },

    /* ---------- Business ---------- */
    { nama:'Belajar Bareng Ko Andrew', kanal:'business', logo:'bbka.webp',
      topik:['Education','Sharing Session','Community'], anggota:['selective'] },

    { nama:'Mekari Community', kanal:'business', logo:'mekari.webp',
      topik:['Academy','Consultant','Event'], anggota:['premium'] },

    { nama:'Bisnis Muda', kanal:'business', logo:'bisnis-muda.webp',
      topik:['Sharing Session','Meet Up','Community'], anggota:['free'] },

    /* ---------- Builder ---------- */
    { nama:'Build Club', kanal:'builders', logo:'build-club.webp',
      topik:['Developer','Sharing Session','Meet Up','Event'], anggota:['free'] },

    { nama:'Python Indonesia', kanal:'builders', logo:'pyhton.webp',
      topik:['Developer','Python','Meet Up','Event'], anggota:['free'] },

    /* ---------- Social Impact ---------- */
    { nama:'GenSmart', kanal:'social_impact', logo:'gensmart.webp',
      topik:['Event','Volunteer','Community'], anggota:['free','selective'] },

    { nama:'AIESEC', kanal:'social_impact', logo:'aiesec.webp',
      topik:['Event','Program','Volunteer','Community'], anggota:['selective'] },

    { nama:'Young On Top', kanal:'social_impact', logo:'yot.webp',
      topik:['Education','Event','Program','Community'], anggota:['free'] },

    { nama:'Young Leaders Indonesia', kanal:'social_impact', logo:'yli.webp',
      topik:['Education','Event','Program','Community'], anggota:['free'] }
  ];

  /* ---------- marquee logo mitra, geser tanpa henti seperti kumpul.id ----------
     Setiap baris memuat daftar dua kali supaya putarannya tanpa sambungan
     (keyframe menggeser tepat -50%). Salinan kedua disembunyikan dari
     pembaca layar. */
  var jalur = document.getElementById('pmMarquee');
  if (jalur) {
    var logoSel = function (k, salinan) {
      return '<li' + (salinan ? ' aria-hidden="true"' : '') + '><span class="pm-logo">' +
             '<img src="assets/communities/' + k.logo + '" alt="' + (salinan ? '' : aman(k.nama)) + '" ' +
             'decoding="async" height="52"></span></li>';
    };
    var baris = function (daftar, kelas) {
      var isi = daftar.map(function (k) { return logoSel(k, false); }).join('') +
                daftar.map(function (k) { return logoSel(k, true); }).join('');
      return '<div class="pm-row ' + kelas + '"><ul>' + isi + '</ul></div>';
    };
    /* dua baris dari daftar yang sama, sebagian berbeda urutan supaya tidak kembar */
    var separuh = Math.ceil(DATA.length / 2);
    jalur.innerHTML = baris(DATA.slice(0, separuh), 'pm-a') +
                      baris(DATA.slice(separuh).concat(DATA.slice(0, 2)), 'pm-b');
  }


  if (!wadah) return;

  /* Seluruh kartu menjadi tautan ke komunitas: tautan paling langsung dulu,
     lalu tautan sosial apa pun. Kalau semua kosong, kartu bukan tautan (Rule 7). */
  function tautanGabung(k) {
    return k.wa || k.discord || k.web || k.ig || k.tiktok || '';
  }

  /* Bentuk kartu meniru CommunityCard.tsx di repo Bagas: logo dan panah keluar,
     nama, satu baris bidang (topik), lalu garis meta berisi kanal. */
  function kartu(k) {
    var url = tautanGabung(k);
    var buka = url
      ? '<a class="com-card glass" href="' + aman(url) + '" target="_blank" rel="noopener" data-kanal="' + k.kanal + '">'
      : '<div class="com-card glass" data-kanal="' + k.kanal + '">';
    return buka +
      '<span class="com-card-top">' +
        '<span class="com-logo"><img src="assets/communities/' + k.logo + '" alt="' + aman(k.nama) + '" ' +
          'loading="lazy" decoding="async" width="52" height="52"></span>' +
        (url ? '<svg class="com-out" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-arrow"/></svg>' : '') +
      '</span>' +
      '<h3 class="com-title" translate="no">' + aman(k.nama) +
        '<svg class="com-verified" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-spark4"/></svg></h3>' +
      '<span class="com-desc" translate="no">' + aman(k.topik.join(' · ')) + '</span>' +
      '<span class="com-meta" translate="no">' +
        '<span class="com-tag">' + KANAL[k.kanal] + '</span>' +
        '<span class="com-join-type">Community</span>' +
      '</span>' +
    (url ? '</a>' : '</div>');
  }

  /* Saringan kanal dan kata kunci bekerja bersama. Kata kunci dicocokkan ke nama,
     kanal, dan topik, tanpa membedakan huruf besar kecil. */
  var kanalAktif = '', kunci = '';
  function teks(kode) {
    var K = window.CATALYST_I18N, l = (document.documentElement.lang || 'id').slice(0, 2);
    return (K && ((K[l] && K[l][kode]) || (K.id && K.id[kode]))) || '';
  }
  function gambar(kanal) {
    if (kanal != null) kanalAktif = kanal;
    var q = kunci.trim().toLowerCase();
    var daftar = DATA.filter(function (k) {
      if (kanalAktif && k.kanal !== kanalAktif) return false;
      if (!q) return true;
      return [k.nama, KANAL[k.kanal] || '', k.topik.join(' ')].join(' ').toLowerCase().indexOf(q) >= 0;
    });
    wadah.innerHTML = daftar.length ? daftar.map(kartu).join('')
      : '<p class="com-kosong" data-i18n="com.kosong">' + (teks('com.kosong') || 'Komunitas tidak ditemukan.') + '</p>';
    Array.prototype.forEach.call(wadah.children, function (c, i) {
      c.style.setProperty('--i', i % 8);
    });
    wadah.classList.add('in');
    /* Kartu baru lahir sesudah kamus dipasang, jadi teksnya diterjemahkan lagi. */
    if (window.terapkanBahasa) {
      var kode = (document.documentElement.lang || 'id').slice(0, 2);
      window.terapkanBahasa(kode === 'zh' ? 'zh' : kode);
    }
  }

  gambar('');

  var saring = document.getElementById('comFilter');
  if (saring) {
    saring.addEventListener('click', function (e) {
      var tombol = e.target.closest('button[data-kanal]');
      if (!tombol) return;
      Array.prototype.forEach.call(saring.querySelectorAll('button'), function (b) {
        b.classList.toggle('on', b === tombol);
      });
      gambar(tombol.dataset.kanal);
    });
  }

  var cari = document.getElementById('comCari');
  if (cari) {
    cari.addEventListener('input', function () { kunci = cari.value; gambar(null); });
    /* placeholder ikut bahasa aktif */
    var pasangPh = function () { var t = teks('com.cari'); if (t) { cari.placeholder = t; cari.setAttribute('aria-label', t); } };
    pasangPh();
    document.addEventListener('bahasa-berubah', pasangPh);
  }

  /* Hitung komunitas per kanal untuk angka di tombol saringan. */
  Array.prototype.forEach.call(document.querySelectorAll('#comFilter button[data-kanal]'), function (b) {
    var kanal = b.dataset.kanal;
    var n = kanal ? DATA.filter(function (k) { return k.kanal === kanal; }).length : DATA.length;
    var tanda = b.querySelector('i');
    if (tanda) tanda.textContent = n;
  });
})();
