/* ===========================================================
   Data contoh untuk Catalyst Passport, Finder, dan Academy.

   Dipakai saat kredensial Supabase belum diisi, sehingga aplikasi
   tetap bisa dibuka dan dinilai tanpa menunggu backend siap.
   Perubahan disimpan di perangkat masing masing lewat localStorage,
   jadi mendaftar, melamar, dan mengikuti kelas tetap terasa nyata.

   Begitu SUPABASE_URL dan SUPABASE_ANON_KEY diisi di catalyst.js,
   seluruh berkas ini berhenti dipakai dan data pindah ke Supabase.
   =========================================================== */
window.CATALYST_DEMO = (function () {
  var KUNCI = 'catalyst-demo-v1';

  var awal = {
    profil: {
      catalyst_id: 'CAT-27DA21',
      full_name: 'Bagas Dwi Putra',
      headline: 'Founder of Catalyst Society',
      location: 'Jakarta Selatan, Indonesia',
      about: 'Founder Catalyst Society, ekosistem yang menghubungkan, menginspirasi, dan mempercepat pertumbuhan builders, innovators, investors, dan changemakers untuk menciptakan dampak positif bagi Indonesia dan dunia.',
      channel: 'business',
      journey_stage: 'builder',
      cata_points: 1270,
      is_verified: true,
      skills: ['Leadership', 'Public Speaking', 'Content Creator']
    },

    journey: [
      { stage: 'explorer',    title: 'Explorer',    detail: 'Bergabung dengan Catalyst',   occurred_at: '2026-01-14' },
      { stage: 'connector',   title: 'Connector',   detail: 'Bergabung ke tiga komunitas', occurred_at: '2026-02-08' },
      { stage: 'builder',     title: 'Builder',     detail: 'Membuat project pertama',     occurred_at: '2026-03-21' },
      { stage: 'challenger',  title: 'Challenger',  detail: 'Menuntaskan bootcamp',        occurred_at: '' },
      { stage: 'contributor', title: 'Contributor', detail: 'Membantu lima project',       occurred_at: '' },
      { stage: 'innovator',   title: 'Innovator',   detail: 'Dampak dan skala',            occurred_at: '' }
    ],

    komunitas: [
      { name: 'AIESEC',                    channel: 'social_impact' },
      { name: 'Belajar Bareng Ko Andrew',  channel: 'business' },
      { name: 'Bisnis Muda',               channel: 'business' },
      { name: 'Blockplay',                 channel: 'ai_technology' },
      { name: 'Crypto Legal Community',    channel: 'investments' },
      { name: 'GenSmart',                  channel: 'ai_technology' },
      { name: 'Investor Saham Pemula',     channel: 'investments' },
      { name: 'Kompaschain',               channel: 'ai_technology' },
      { name: 'Mekari Community',          channel: 'business' },
      { name: 'Young Leaders Indonesia',   channel: 'social_impact' },
      { name: 'Young On Top',              channel: 'business' }
    ],

    badge: [
      { name: 'First Step',         icon: 'spark'  },
      { name: 'First Community',    icon: 'users'  },
      { name: 'Community Explorer', icon: 'search' },
      { name: 'Ecosystem Native',   icon: 'globe'  },
      { name: 'First Project',      icon: 'rocket' },
      { name: 'Certified',          icon: 'badge'  },
      { name: 'Builder',            icon: 'cube'   }
    ],

    sertifikat: [
      { title: '1st Winner US Stock Competition', issuer: 'Seeds Finance & Webull Sekuritas', cert_code: 'CSA-INV-2026-00123', issued_at: '2026-06-10' },
      { title: 'Best of Badan Ekraf Digital Talent 2026', issuer: 'Kementerian Ekonomi Kreatif', cert_code: 'BEK-DT-2026-0417', issued_at: '2026-04-02' },
      { title: 'Investasi Untuk Pemula', issuer: 'Catalyst Academy', cert_code: 'CSA-INV-2026-00088', issued_at: '2026-03-18' }
    ],

    peluang: [
      { id:'o1', kind:'hiring', title:'Full Stack Developer', org_name:'Catalyst Tech', category:'Software House',
        location:'Remote, Full time', description:'Membangun produk internal Catalyst dari Passport sampai Ventures.',
        tags:['React','Node.js','TypeScript'], created_at:'2026-08-30' },
      { id:'o2', kind:'partner', title:'AI Education Platform', org_name:'Education Technology', category:'Marketing Partner',
        description:'Mencari partner pertumbuhan untuk platform belajar berbasis AI.',
        tags:['Growth Marketing','EdTech'], created_at:'2026-08-29' },
      { id:'o3', kind:'fundraising', title:'EcoMicrogrid Initiative', org_name:'Clean Energy', category:'Energi Terbarukan',
        description:'Jaringan listrik mikro untuk desa terpencil di Indonesia timur.',
        tags:['Climate','Hardware'], funding_goal:250000000, funding_raised:155000000, created_at:'2026-08-27' },
      { id:'o4', kind:'support', title:'Code for Impact', org_name:'Non profit Organization', category:'Volunteer Developer',
        description:'Membangun perangkat lunak gratis untuk organisasi sosial.',
        tags:['Web Development','Pro bono'], created_at:'2026-08-31' },
      { id:'o5', kind:'hiring', title:'Product Designer', org_name:'Bisnis Muda', category:'Startup',
        location:'Jakarta, Hybrid', description:'Merancang pengalaman produk untuk komunitas pebisnis muda.',
        tags:['Figma','Design System'], created_at:'2026-08-25' },
      { id:'o6', kind:'partner', title:'Catalyst Summit 2027', org_name:'Catalyst Society', category:'Event Partner',
        description:'Mencari mitra penyelenggara dan sponsor untuk panggung tahunan.',
        tags:['Event','Sponsorship'], created_at:'2026-08-22' }
    ],

    kursus: [
      { id:'c1', title:'Investasi Untuk Pemula', category:'Investasi', lesson_count:12, hours:8.5, rating:4.9, xp_reward:400,
        description:'Strategi investasi cerdas untuk masa depan finansial yang bebas.' },
      { id:'c2', title:'AI for Everyone', category:'AI', lesson_count:15, hours:11, rating:4.8, xp_reward:500,
        description:'Machine Learning Fundamentals untuk semua latar belakang.' },
      { id:'c3', title:'Membangun Mindset Pebisnis', category:'Business', lesson_count:18, hours:12.5, rating:4.9, xp_reward:550,
        description:'Bangun mindset pebisnis dan kembangkan bisnis yang berdampak.' },
      { id:'c4', title:'Coding Dari Dasar', category:'Coding', lesson_count:20, hours:16, rating:4.8, xp_reward:600,
        description:'Belajar coding dari dasar hingga mahir bangun aplikasi.' },
      { id:'c5', title:'Analisis Teknikal Lanjutan', category:'Investasi', lesson_count:10, hours:7, rating:4.7, xp_reward:380,
        description:'Membaca struktur pasar dan mengelola risiko secara disiplin.' },
      { id:'c6', title:'Product Design Fundamental', category:'Coding', lesson_count:14, hours:9.5, rating:4.8, xp_reward:450,
        description:'Merancang produk digital dari riset hingga prototipe.' }
    ],

    /* progres kelas milik pengguna */
    kelas: { c2: 70, c1: 100, c3: 35 },

    /* lamaran dan pendaftaran event yang sudah dikirim */
    lamaran: [],
    eventDiikuti: [],

    event: [
      { id:'e1', title:'Webinar: Future of AI in Business', speaker:'Andi Wijaya',      starts_at:'2026-09-20', location:'Online' },
      { id:'e2', title:'Live Class: Investing for Beginners', speaker:'Rivan Kurniawan', starts_at:'2026-09-25', location:'Online' },
      { id:'e3', title:'Catalyst Summit 2027',                speaker:'Catalyst Society', starts_at:'2027-04-18', location:'Jakarta' }
    ]
  };

  function muat() {
    try {
      var t = localStorage.getItem(KUNCI);
      if (t) return Object.assign({}, awal, JSON.parse(t));
    } catch (e) {}
    return JSON.parse(JSON.stringify(awal));
  }

  var data = muat();

  function simpan() {
    try {
      localStorage.setItem(KUNCI, JSON.stringify({
        profil: data.profil, kelas: data.kelas,
        lamaran: data.lamaran, eventDiikuti: data.eventDiikuti,
        komunitas: data.komunitas
      }));
    } catch (e) {}
  }

  return {
    data: data,
    simpan: simpan,
    setel: function (bagian, nilai) { data[bagian] = nilai; simpan(); },
    ulang: function () { try { localStorage.removeItem(KUNCI); } catch (e) {} location.reload(); }
  };
})();
