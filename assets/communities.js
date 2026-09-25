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

  var LABEL_ANGGOTA = { free: 'Free', premium: 'Premium', selective: 'Selective' };
  var JUDUL_ANGGOTA = {
    free: 'Free Membership. Siapa pun boleh bergabung.',
    premium: 'Premium Membership. Keanggotaan berbayar.',
    selective: 'Selective Membership. Lewat seleksi atau undangan.'
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

  /* Tautan sosial digambar hanya kalau isinya ada (Rule 1 dan Rule 6). */
  var SOSIAL = [
    { kunci:'web',     ikon:'i-globe',   nama:'Website'   },
    { kunci:'ig',      ikon:'i-ig',      nama:'Instagram' },
    { kunci:'wa',      ikon:'i-wa',      nama:'WhatsApp',  isi:true },
    { kunci:'discord', ikon:'i-discord', nama:'Discord',   isi:true },
    { kunci:'tiktok',  ikon:'i-tiktok',  nama:'TikTok',    isi:true }
  ];

  /* Tombol Join memakai tautan komunitas yang paling langsung.
     Kalau semua kosong, tombol dimatikan (Rule 7). */
  function tautanGabung(k) {
    return k.wa || k.discord || k.web || k.ig || '';
  }

  function kartu(k) {
    var sosial = SOSIAL.filter(function (s) { return k[s.kunci]; }).map(function (s) {
      return '<a href="' + aman(k[s.kunci]) + '" target="_blank" rel="noopener"' +
             ' aria-label="' + s.nama + ' ' + aman(k.nama) + '" title="' + s.nama + '">' +
             '<svg viewBox="0 0 24 24"' + (s.isi ? ' class="isi"' : '') + '>' +
             '<use href="#' + s.ikon + '"/></svg></a>';
    }).join('');

    var lencana = k.anggota.map(function (a) {
      return '<span class="com-badge" title="' + JUDUL_ANGGOTA[a] + '" translate="no">' +
             LABEL_ANGGOTA[a] + '</span>';
    }).join('');

    var topik = k.topik.map(function (t) {
      return '<span>' + aman(t) + '</span>';
    }).join('');

    var gabung = tautanGabung(k);
    var tombol = gabung
      ? '<a class="com-join" href="' + aman(gabung) + '" target="_blank" rel="noopener">' +
        '<span data-i18n="com.gabung">Gabung</span>' +
        '<svg viewBox="0 0 24 24"><use href="#i-arrow"/></svg></a>'
      : '<span class="com-join mati" data-i18n="com.segera">Segera</span>';

    return '<article class="com-card glass" data-kanal="' + k.kanal + '">' +
      '<div class="com-head">' +
        '<div class="com-logo"><img src="assets/communities/' + k.logo + '" alt="' + aman(k.nama) + '" ' +
          'loading="lazy" decoding="async" width="56" height="56"></div>' +
        '<div class="com-lencana">' + lencana + '</div>' +
      '</div>' +
      '<h3 translate="no">' + aman(k.nama) + '</h3>' +
      '<div class="com-kanal" translate="no">' + KANAL[k.kanal] + '</div>' +
      '<div class="com-topik">' + topik + '</div>' +
      '<div class="com-kaki">' +
        '<div class="com-sosial">' + sosial + '</div>' +
        tombol +
      '</div>' +
    '</article>';
  }

  function gambar(kanal) {
    var daftar = kanal ? DATA.filter(function (k) { return k.kanal === kanal; }) : DATA;
    wadah.innerHTML = daftar.map(kartu).join('');
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

  /* Hitung komunitas per kanal untuk angka di tombol saringan. */
  Array.prototype.forEach.call(document.querySelectorAll('#comFilter button[data-kanal]'), function (b) {
    var kanal = b.dataset.kanal;
    var n = kanal ? DATA.filter(function (k) { return k.kanal === kanal; }).length : DATA.length;
    var tanda = b.querySelector('i');
    if (tanda) tanda.textContent = n;
  });
})();
