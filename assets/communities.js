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

  /* Halaman detail tiap komunitas = halaman dari repo Bagas di /bp/communities/<slug>/
     (Gabung Komunitas, Simpan ke Passport, daftar platform, komunitas terkait). */
  var SLUG = {
    'Blockplay':'blockplay', 'Investor Saham Pemula':'isp', 'Web3 Enthusiast':'web3-enthusiast', 'Kompaschain':'kompaschain',
    'Crypto Legal Community':'crypto-legal', 'Tradix Community':'tradix', 'AI Community (AICO)':'aico', 'Bisa.AI':'bisa-ai',
    'Indonesia AI':'indonesia-ai', 'Dicoding':'dicoding', 'Belajar Bareng Ko Andrew':'bbka', 'Mekari Community':'mekari',
    'Bisnis Muda':'bisnis-muda', 'Build Club':'build-club', 'Python Indonesia':'python', 'GenSmart':'gensmart',
    'AIESEC':'aiesec', 'Young On Top':'yot', 'Young Leaders Indonesia':'yli'
  };

  /* Bentuk kartu meniru CommunityCard.tsx di repo Bagas: logo dan panah, nama, satu baris
     bidang (topik), lalu garis meta berisi kanal. Klik membuka halaman detail komunitas. */
  function kartu(k) {
    var slug = SLUG[k.nama];
    var url = slug ? '?k=' + slug : tautanGabung(k);
    var luar = !slug && url;
    var buka = url
      ? '<a class="com-card glass" href="' + aman(url) + '"' + (luar ? ' target="_blank" rel="noopener"' : '') + ' data-kanal="' + k.kanal + '">'
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

  /* ===================== halaman detail komunitas (/?k=<slug>) =====================
     Tampil di dalam landing: header dan footer tetap milik landing, isi landing lain
     disembunyikan selama halaman detail terbuka. Teks panjang dan kategori dari data
     komunitas di repo Bagas. */
  var DETAIL = {"blockplay": {"kat": "Trading", "full": {"id": "Blockplay adalah komunitas yang bergerak di ranah crypto, forex, dan trading. Keanggotaannya gratis, tanpa biaya untuk bergabung.", "en": "Blockplay is a community built around crypto, forex, and trading. Membership is free, with no cost to join.", "zh": "Blockplay 是一个围绕加密货币、外汇与交易的社区。会员免费，加入无需付费。"}}, "isp": {"kat": "Investment", "full": {"id": "Investor Saham Pemula (ISP) adalah komunitas seputar saham dan berita yang menyertainya. Keanggotaannya gratis.", "en": "Investor Saham Pemula (ISP) is a community about stocks and the news that follows them. Membership is free.", "zh": "Investor Saham Pemula（ISP）是一个关注股票及相关资讯的社区。会员免费。"}}, "web3-enthusiast": {"kat": "Crypto", "full": {"id": "Web3 Enthusiast adalah komunitas seputar crypto dan saham. Event crypto menjadi bagian dari kegiatannya. Keanggotaannya gratis.", "en": "Web3 Enthusiast is a community around crypto and stocks. Crypto events are part of what it runs. Membership is free.", "zh": "Web3 Enthusiast 是一个围绕加密货币与股票的社区，加密货币活动是其中的一部分。会员免费。"}}, "kompaschain": {"kat": "Crypto", "full": {"id": "Kompaschain adalah komunitas crypto yang perhatiannya tertuju pada trading. Keanggotaannya gratis.", "en": "Kompaschain is a crypto community whose attention sits on trading. Membership is free.", "zh": "Kompaschain 是一个以交易为关注点的加密货币社区。会员免费。"}}, "crypto-legal": {"kat": "Crypto", "full": {"id": "Crypto Legal Community adalah komunitas yang membahas crypto dari sisi hukum. Berita menjadi bagian dari perbincangannya. Keanggotaannya gratis.", "en": "Crypto Legal Community is a community that looks at crypto from the legal side. News is part of the conversation. Membership is free.", "zh": "Crypto Legal Community 是一个从法律角度讨论加密货币的社区，资讯也是其中的一部分。会员免费。"}}, "tradix": {"kat": "Trading", "full": {"id": "Tradix Community adalah komunitas yang berkutat di crypto dan trading. Keanggotaannya gratis.", "en": "Tradix Community is a community centred on crypto and trading. Membership is free.", "zh": "Tradix Community 是一个围绕加密货币与交易的社区。会员免费。"}}, "aico": {"kat": "Artificial Intelligence", "full": {"id": "AICO adalah komunitas yang berfokus pada AI generatif. Di dalamnya ada kabar terbaru seputar AI dan acara komunitas. Keanggotaan bersifat gratis.", "en": "AICO is a community focused on generative AI. It covers AI news and holds community events. Membership is free.", "zh": "AICO 是一个专注于生成式 AI 的社区。社区分享 AI 相关资讯，并举办活动。会员免费。"}}, "bisa-ai": {"kat": "Artificial Intelligence", "full": {"id": "Bisa.AI adalah komunitas AI dengan format akademi dan bootcamp. Keanggotaan bersifat gratis.", "en": "Bisa.AI is an AI community built around an academy and bootcamp format. Membership is free.", "zh": "Bisa.AI 是一个以学院与训练营形式运作的 AI 社区。会员免费。"}}, "indonesia-ai": {"kat": "Artificial Intelligence", "full": {"id": "Indonesia AI adalah komunitas yang bergerak di AI generatif dan prompting. Kegiatannya mencakup bootcamp dan kabar terbaru seputar AI. Keanggotaan bersifat gratis.", "en": "Indonesia AI is a community working on generative AI and prompting. It runs bootcamps and shares AI news. Membership is free.", "zh": "Indonesia AI 是一个围绕生成式 AI 与提示词的社区。社区举办训练营，并分享 AI 相关资讯。会员免费。"}}, "dicoding": {"kat": "Artificial Intelligence", "full": {"id": "Dicoding menyediakan akademi AI, workshop, dan bootcamp. Keanggotaannya tersedia dalam dua jenis, gratis dan premium.", "en": "Dicoding offers an AI academy, workshops, and bootcamps. Two membership types are available, free and premium.", "zh": "Dicoding 提供 AI 学院、工作坊与训练营。会员分为免费和高级两种类型。"}}, "bbka": {"kat": "Business", "full": {"id": "BBKA adalah komunitas belajar yang berjalan lewat edukasi dan sesi berbagi. Keanggotaannya selektif.", "en": "BBKA is a learning community that runs on education and sharing sessions. Membership is selective.", "zh": "BBKA 是一个以教育和分享会为形式的学习社区。会员采取选择性加入。"}}, "mekari": {"kat": "Business", "full": {"id": "Mekari Community berjalan lewat tiga hal: academy, konsultan, dan event. Keanggotaannya premium, jadi aksesnya lewat membership berbayar.", "en": "Mekari Community runs on three things: an academy, consultants, and events. It is a premium membership, so access comes through a paid membership.", "zh": "Mekari Community 围绕 academy、顾问与活动展开。它采用 premium 会员制，通过付费会员获得访问权限。"}}, "bisnis-muda": {"kat": "Business", "full": {"id": "Bisnis Muda menjalankan sesi berbagi dan meet up sebagai kegiatan utamanya. Keanggotaannya gratis.", "en": "Bisnis Muda runs sharing sessions and meet ups as its main activities. Membership is free.", "zh": "Bisnis Muda 以分享会和线下聚会为主要活动。会员免费。"}}, "build-club": {"kat": "Programming", "full": {"id": "Build Club adalah komunitas untuk developer. Kegiatannya berupa sharing session, meet up, dan event. Keanggotaannya gratis.", "en": "Build Club is a community for developers. Its activities are sharing sessions, meet ups, and events. Membership is free.", "zh": "Build Club 是一个面向开发者的社区。社区会举办分享会、聚会和活动。会员免费。"}}, "python": {"kat": "Programming", "full": {"id": "Python Indonesia adalah komunitas developer yang berfokus pada Python. Kegiatannya berupa sharing session Python, meet up, dan event. Keanggotaannya gratis.", "en": "Python Indonesia is a developer community centred on Python. Its activities are Python sharing sessions, meet ups, and events. Membership is free.", "zh": "Python Indonesia 是一个围绕 Python 的开发者社区。社区会举办 Python 分享会、聚会和活动。会员免费。"}}, "gensmart": {"kat": "Others", "full": {"id": "GenSmart adalah komunitas yang bergerak lewat event dan kegiatan volunteer. Sebagian keanggotaannya gratis, sebagian lain melalui seleksi.", "en": "GenSmart is a community built around events and volunteer work. Part of its membership is free, part of it is selective.", "zh": "GenSmart 是一个围绕活动和志愿服务运作的社区。其会员资格一部分免费，一部分需要经过筛选。"}}, "aiesec": {"kat": "Others", "full": {"id": "AIESEC menjalankan kegiatannya lewat event, program, dan kerja volunteer. Keanggotaannya selektif, jadi ada proses seleksi sebelum seseorang bergabung.", "en": "AIESEC runs through events, programs, and volunteer work. Membership is selective, so joining means going through a selection process.", "zh": "AIESEC 以活动、项目和志愿服务展开。会员资格为筛选制，加入前需要经过选拔。"}}, "yot": {"kat": "Others", "full": {"id": "Young On Top (YOT) bergerak lewat edukasi, event, dan program. Keanggotaannya gratis, jadi tidak ada biaya untuk ikut. Mulai saja dari event atau program yang sedang dibuka.", "en": "Young On Top (YOT) works through education, events, and programs. Membership is free, so there is no cost to take part. Start from whichever event or program is currently open.", "zh": "Young On Top（YOT）以教育、活动和项目展开。会员免费，参与不需要费用。可以从当前开放的活动或项目开始。"}}, "yli": {"kat": "Others", "full": {"id": "Young Leaders Indonesia (YLI) menjalankan kegiatan edukasi, event, dan program. Keanggotaannya gratis dan terbuka untuk diikuti. Bentuk keterlibatannya mengikuti agenda yang sedang berjalan.", "en": "Young Leaders Indonesia (YLI) runs education, events, and programs. Membership is free and open to join. How you take part follows whatever is currently running.", "zh": "Young Leaders Indonesia（YLI）开展教育、活动和项目。会员免费且开放加入。参与方式取决于当前正在进行的安排。"}}};
  var BY_SLUG = {};
  DATA.forEach(function (k) { if (SLUG[k.nama]) BY_SLUG[SLUG[k.nama]] = k; });
  var PLATFORM = [
    { kunci:'web', ikon:'i-globe', nama:'Website' }, { kunci:'wa', ikon:'i-wa', nama:'WhatsApp', isi:true },
    { kunci:'discord', ikon:'i-discord', nama:'Discord', isi:true }, { kunci:'ig', ikon:'i-ig', nama:'Instagram' },
    { kunci:'tiktok', ikon:'i-tiktok', nama:'TikTok', isi:true }
  ];
  var ANGGOTA = { free:'kd.free', premium:'kd.premium', selective:'kd.selective' };
  var ANGGOTA_ASLI = { free:'Free Membership', premium:'Premium Membership', selective:'Selective Membership' };
  var panel = document.getElementById('komunitasDetail'), slugAktif = '';
  function bahasaKini() { var l = (document.documentElement.lang || 'id').slice(0, 2); return l === 'zh' ? 'zh' : l === 'en' ? 'en' : 'id'; }
  function tx(kode, asli) { return teks(kode) || asli; }

  function isiDetail(slug) {
    var k = BY_SLUG[slug]; if (!k || !panel) return false;
    var d = DETAIL[slug] || {}, l = bahasaKini();
    var full = d.full ? (d.full[l] || d.full.en || d.full.id || '') : '';
    var gabung = tautanGabung(k);
    var plat = PLATFORM.filter(function (p) { return k[p.kunci]; }).map(function (p) {
      return '<li><a href="' + aman(k[p.kunci]) + '" target="_blank" rel="noopener">' +
        '<svg class="kd-ik' + (p.isi ? ' isi' : '') + '" viewBox="0 0 24 24" aria-hidden="true"><use href="#' + p.ikon + '"/></svg>' +
        '<span>' + p.nama + '</span><svg class="kd-out" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-arrow"/></svg></a></li>';
    }).join('');
    var terkait = DATA.filter(function (x) { return x !== k && x.kanal === k.kanal; }).slice(0, 3);
    if (terkait.length < 3) terkait = terkait.concat(DATA.filter(function (x) { return x !== k && terkait.indexOf(x) < 0; }).slice(0, 3 - terkait.length));
    panel.innerHTML =
      '<div class="wrap">' +
        '<a class="kd-back" href="#community"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-arrow"/></svg><span>' + tx('kd.semua', 'Semua Komunitas') + '</span></a>' +
        '<div class="kd-grid">' +
          '<div class="kd-utama">' +
            '<div class="kd-id"><span class="com-logo kd-logo"><img src="assets/communities/' + k.logo + '" alt="' + aman(k.nama) + '" width="76" height="76"></span>' +
              '<div><h1 class="kd-nama" translate="no">' + aman(k.nama) + '<svg class="com-verified" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-spark4"/></svg></h1>' +
              '<div class="kd-meta" translate="no">' + [KANAL[k.kanal], d.kat, 'Community'].filter(Boolean).map(aman).join('<i></i>') + '</div></div></div>' +
            (full ? '<p class="kd-desk">' + aman(full) + '</p>' : '') +
            '<div class="kd-tags" translate="no">' + k.topik.map(function (t) { return '<span class="com-tag">' + aman(t) + '</span>'; }).join('') + '</div>' +
            '<div class="kd-anggota">' + k.anggota.map(function (a) { return '<span>' + aman(tx(ANGGOTA[a], ANGGOTA_ASLI[a] || a)) + '</span>'; }).join('') + '</div>' +
          '</div>' +
          '<aside class="kd-sisi">' +
            (gabung ? '<a class="kd-gabung" href="' + aman(gabung) + '" target="_blank" rel="noopener"><span>' + tx('kd.gabung', 'Gabung Komunitas') + '</span><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-arrow"/></svg></a>' +
              '<p class="kd-catat">' + tx('kd.catat', 'Tombol ini membuka kanal resmi komunitas.') + '</p>'
              : '<span class="kd-gabung mati">' + tx('com.segera', 'Segera') + '</span>') +
            (plat ? '<div class="kd-plat-l">' + tx('kd.platform', 'Platform') + '</div><ul class="kd-plat">' + plat + '</ul>' : '') +
          '</aside>' +
        '</div>' +
        '<h2 class="kd-rel-j">' + tx('kd.terkait', 'Komunitas terkait') + '</h2>' +
        '<div class="com-grid kd-rel">' + terkait.map(kartu).join('') + '</div>' +
      '</div>';
    document.title = k.nama + ' · Catalyst Society';
    return true;
  }
  /* tinggi halaman berubah saat detail dibuka/ditutup: ukur ulang Lenis dulu, lalu loncat */
  function keY(y) {
    if (window.lenis) { lenis.resize(); lenis.scrollTo(y, { immediate: true, force: true }); }
    else window.scrollTo(0, y);
  }
  function tampil(slug, gulir) {
    if (!isiDetail(slug)) return;
    slugAktif = slug;
    panel.hidden = false;
    document.documentElement.classList.add('mode-kd');
    if (gulir !== false) keY(0);
  }
  function tutup(keKomunitas) {
    if (!slugAktif) return;
    slugAktif = ''; panel.hidden = true; panel.innerHTML = '';
    document.documentElement.classList.remove('mode-kd');
    document.title = 'Catalyst Society. Accelerating Future Builders.';
    if (keKomunitas) { var c = document.getElementById('community'); if (c) keY(c.getBoundingClientRect().top + window.scrollY - 90); }
  }
  function dariAlamat() {
    var s = new URLSearchParams(location.search).get('k');
    if (s && BY_SLUG[s]) tampil(s); else tutup(location.hash === '#community');
  }
  /* klik kartu (grid landing maupun komunitas terkait): buka detail tanpa memuat ulang */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.com-card[href^="?k="]');
    if (a && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
      e.preventDefault();
      var s = a.getAttribute('href').slice(3);
      history.pushState({ k: s }, '', '?k=' + s);
      tampil(s);
      return;
    }
    /* tautan jangkar (menu, tombol kembali) saat detail terbuka: kembali ke landing dulu */
    var j = e.target.closest && e.target.closest('a[href^="#"]');
    if (j && slugAktif) {
      history.pushState(null, '', location.pathname + j.getAttribute('href'));
      tutup(false);
    }
  }, true);
  window.addEventListener('popstate', dariAlamat);
  document.addEventListener('bahasa-berubah', function () { if (slugAktif) isiDetail(slugAktif); });
  dariAlamat();
})();
