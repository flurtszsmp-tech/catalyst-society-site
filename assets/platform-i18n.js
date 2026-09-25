/* ===========================================================
   Catalyst Society, platform: kamus tiga bahasa (id, en, zh).
   Dipakai app.html dan login.html. Memakai kunci penyimpanan yang sama
   dengan landing (catalyst-lang), jadi pilihan bahasa ikut terbawa.

   Nama merek dan program tidak diterjemahkan: Catalyst Passport,
   Finder, Academy, Labs, Ventures, Summit, Communities.

   PI.t(kunci, {var})  teks antarmuka
   PI.x(teks)          isi data contoh (deskripsi kursus, peluang, dsb)
   PI.locale()         id-ID / en-US / zh-CN untuk angka dan tanggal
   =========================================================== */
window.PI18N = (function () {
  var KUNCI = 'catalyst-lang';

  var K = {
    id: {
      'nav.home':'Home', 'nav.program':'Program', 'nav.soon':'Segera hadir', 'nav.keluar':'Keluar',
      'top.cari':'Cari peluang, kursus, komunitas...',
      'lang.judul':'Bahasa',

      'demo.judul':'Mode contoh.',
      'demo.isi':" Seluruh modul di bawah ini berfungsi penuh memakai data contoh yang tersimpan di perangkat Anda. Untuk memakai akun sungguhan, isi <code>SUPABASE_URL</code> dan <code>SUPABASE_ANON_KEY</code> di <code>assets/catalyst.js</code>, lalu jalankan <code>supabase-schema.sql</code> di Supabase SQL Editor. ",
      'demo.ulang':'Kembalikan data contoh ke awal',
      'profil.hilang':'Profil belum terbentuk. Pastikan trigger <code>on_auth_user_created</code> sudah dibuat lewat <code>supabase-schema.sql</code>.',

      'home.selamat':'Selamat datang kembali, {nama}.',
      'home.sub':'Ekosistem Anda hari ini: komunitas, peluang, dan kelas yang sedang berjalan.',
      'home.kom':'Komunitas', 'home.badge':'Badge', 'home.stage':'Journey Stage',
      'home.alur':'Alur ekosistem Anda', 'home.kelas':'Kelas yang sedang berjalan',
      'home.event':'Event mendatang', 'home.dapat':'Apa yang Anda dapatkan',
      'get.1':'Bergabung ke Komunitas',
      'get.2':'Akses ke Event',
      'get.3':'Kolaborasi',
      'get.4':'Mengembangkan Bisnis',
      'get.5':'Penggalangan Dana',
      'get.6':'Peluang Kerja',
      'get.7':'Kontes &amp; Kompetisi',
      'get.8':'Jejaring &amp; Berbagi',
      'get.9':'Membangun Proyek',
      'get.10':'Memamerkan Proyek',
      'home.kelasKosong':'Belum ada kelas berjalan. Buka Academy untuk mulai.',
      'alur.1':'Join komunitas di industri pilihan', 'alur.2':'Belajar via E-Course, Event, Workshop',
      'alur.3':'Bertemu partners, mentors, jobs', 'alur.4':'Bangun project bersama mentor',
      'alur.5':'Cari pendanaan hingga bertemu investor', 'alur.6':'Showcase project di event tahunan',

      'pp.sub':'Bangun identitas profesional dalam satu digital profile.',
      'pp.about':'About Me', 'pp.journey':'Journey', 'pp.communities':'Communities',
      'pp.badges':'Badges', 'pp.certs':'Certificates',
      'pp.aboutKosong':'Belum ada deskripsi. Lengkapi profil Anda untuk tampil lebih menonjol di Finder.',
      'pp.tahap':'Tahap {n}', 'pp.belum':'Belum tercapai',
      'pp.komKosong':'Belum bergabung ke komunitas mana pun.',
      'pp.bdgKosong':'Badge pertama menanti. Mulai dari bergabung ke komunitas.',
      'pp.certKosong':'Belum ada sertifikat. Selesaikan kursus di Academy.',

      'fi.sub':'Temukan peluang dan dukung inovasi yang berdampak.',
      'fi.semua':'Semua', 'fi.hiring':'Hiring', 'fi.partner':'Looking for Partner',
      'fi.fundraising':'Fundraising', 'fi.support':'Seeking Support',
      'fi.kind.hiring':'Hiring', 'fi.kind.partner':'Partner', 'fi.kind.fundraising':'Fundraising', 'fi.kind.support':'Support',
      'fi.ajukan':'Ajukan', 'fi.kirim':'Mengirim', 'fi.terkirim':'Terkirim', 'fi.sudah':'Sudah diajukan', 'fi.gagal':'Gagal',
      'fi.terkumpul':'{pct}% terkumpul', 'fi.kosong':'Belum ada peluang yang cocok.',

      'ac.sub':'Belajar langsung dari praktisi industri. Learn. Earn. Impact.',
      'ac.jalan':'Sedang berjalan', 'ac.selesai':'Selesai', 'ac.cert':'Sertifikat', 'ac.xp':'XP Earned',
      'ac.explore':'Explore Top Categories', 'ac.events':'Upcoming Events',
      'ac.lesson':'{n} lesson', 'ac.jam':'{n} jam', 'ac.progress':'Progress',
      'ac.mulai':'Mulai belajar', 'ac.lanjut':'Lanjutkan', 'ac.selesaiBtn':'Selesai',
      'ev.join':'Join', 'ev.terdaftar':'Terdaftar', 'ev.kosong':'Belum ada event terjadwal.',

      'so.judul':'Segera hadir',
      'so.sub':'Modul ini sedang dibangun mengikuti roadmap Catalyst Society.',
      'so.isi':'Communities, Labs, Ventures, dan Summit akan aktif mengikuti Timeline Planning 2027.',

      'lg.title':'Masuk ke Catalyst Society',
      'lg.h1':'Satu akun.<br>Seluruh<br>ekosistem.',
      'lg.p':'Catalyst Society adalah ekosistem kolaboratif yang menghubungkan investor, profesional, builder, innovator dan learner di Indonesia melalui lima channel industri dan lima program berjenjang.',
      'lg.f1':'Belajar lebih dalam industri melalui E-Course, Event, dan Workshop',
      'lg.f2':'Bertemu partners, mentors, workers, company, dan jobs',
      'lg.f3':'Membangun project bersama mentor',
      'lg.f4':'Mencari pendanaan project hingga bertemu investor',
      'lg.f5':'Showcase project dan sharing di event tahunan Catalyst',
      'lg.masuk.judul':'Masuk ke akun Anda.',
      'lg.masuk.sub':'Lanjutkan perjalanan Anda di Passport, Finder, dan Academy.',
      'lg.daftar.judul':'Buat Catalyst Passport.',
      'lg.daftar.sub':'Satu identitas untuk seluruh komunitas, program, dan peluang.',
      'lg.tabMasuk':'Masuk', 'lg.tabDaftar':'Daftar',
      'lg.nama':'Nama lengkap', 'lg.channel':'Channel industri',
      'lg.opt.business':'Business (Businessman &amp; Entrepreneur)',
      'lg.opt.investments':'Investments (Finance &amp; Investments)',
      'lg.opt.ai_technology':'AI &amp; Technology',
      'lg.opt.builders':'Builders (Developer &amp; Builder)',
      'lg.opt.social_impact':'Social Impact (Sustainability &amp; Social Impact)',
      'lg.email':'Email atau username', 'lg.sandi':'Kata sandi', 'lg.sandiPh':'Minimal 6 karakter',
      'lg.hint':'Gunakan minimal 6 karakter.',
      'lg.kirim.masuk':'Masuk', 'lg.kirim.daftar':'Daftar sekarang', 'lg.proses':'Memproses',
      'lg.kembali':'Kembali ke beranda',
      'lg.demo':'<b>Mode demo.</b> Masuk dengan akun contoh: username <code>{u}</code>, kata sandi <code>{p}</code>.',
      'lg.errIsi':'Email atau username dan kata sandi wajib diisi.',
      'lg.daftarDemo':'Pendaftaran belum aktif di mode demo. Gunakan akun contoh: <code>{u}</code> / <code>{p}</code>.',
      'lg.salahDemo':'Username atau kata sandi salah.',
      'lg.emailValid':'Masukkan alamat email yang valid.',
      'lg.sandiMin':'Kata sandi minimal 6 karakter.',
      'lg.namaWajib':'Nama lengkap wajib diisi.',
      'lg.daftarOk':'Pendaftaran berhasil. Cek email Anda untuk konfirmasi, lalu masuk.',
      'lg.errUmum':'Terjadi kesalahan.',
      'lg.errKredensial':'Email atau kata sandi salah.',
      'lg.errTerdaftar':'Email ini sudah terdaftar. Silakan masuk.',
      'lg.errKonfirmasi':'Email belum dikonfirmasi. Cek kotak masuk Anda.'
    },

    en: {
      'nav.home':'Home', 'nav.program':'Programs', 'nav.soon':'Coming soon', 'nav.keluar':'Sign out',
      'top.cari':'Search opportunities, courses, communities...',
      'lang.judul':'Language',

      'demo.judul':'Demo mode.',
      'demo.isi':" Every module below works fully using sample data stored on your device. To use a real account, fill in <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> in <code>assets/catalyst.js</code>, then run <code>supabase-schema.sql</code> in the Supabase SQL Editor. ",
      'demo.ulang':'Reset sample data',
      'profil.hilang':'Profile not created yet. Make sure the <code>on_auth_user_created</code> trigger was created via <code>supabase-schema.sql</code>.',

      'home.selamat':'Welcome back, {nama}.',
      'home.sub':'Your ecosystem today: communities, opportunities, and classes in progress.',
      'home.kom':'Communities', 'home.badge':'Badges', 'home.stage':'Journey Stage',
      'home.alur':'Your ecosystem flow', 'home.kelas':'Classes in progress',
      'home.event':'Upcoming events', 'home.dapat':'What you get',
      'get.1':'Join the Community',
      'get.2':'Access to the Event',
      'get.3':'Collaboration',
      'get.4':'Growing a Business',
      'get.5':'Fundraising',
      'get.6':'Job Opportunities',
      'get.7':'Contest &amp; Competitions',
      'get.8':'Networking &amp; Sharing',
      'get.9':'Building a Project',
      'get.10':'Showcasing a Project',
      'home.kelasKosong':'No classes in progress. Open Academy to start.',
      'alur.1':'Join a community in your chosen industry', 'alur.2':'Learn via E-Courses, Events, Workshops',
      'alur.3':'Meet partners, mentors, jobs', 'alur.4':'Build projects with mentors',
      'alur.5':'Seek funding and meet investors', 'alur.6':'Showcase projects at the annual event',

      'pp.sub':'Build your professional identity in one digital profile.',
      'pp.about':'About Me', 'pp.journey':'Journey', 'pp.communities':'Communities',
      'pp.badges':'Badges', 'pp.certs':'Certificates',
      'pp.aboutKosong':'No description yet. Complete your profile to stand out in Finder.',
      'pp.tahap':'Stage {n}', 'pp.belum':'Not reached yet',
      'pp.komKosong':'Not a member of any community yet.',
      'pp.bdgKosong':'Your first badge awaits. Start by joining a community.',
      'pp.certKosong':'No certificates yet. Complete a course in Academy.',

      'fi.sub':'Discover opportunities and back innovation that matters.',
      'fi.semua':'All', 'fi.hiring':'Hiring', 'fi.partner':'Looking for Partner',
      'fi.fundraising':'Fundraising', 'fi.support':'Seeking Support',
      'fi.kind.hiring':'Hiring', 'fi.kind.partner':'Partner', 'fi.kind.fundraising':'Fundraising', 'fi.kind.support':'Support',
      'fi.ajukan':'Apply', 'fi.kirim':'Sending', 'fi.terkirim':'Sent', 'fi.sudah':'Already applied', 'fi.gagal':'Failed',
      'fi.terkumpul':'{pct}% raised', 'fi.kosong':'No matching opportunities yet.',

      'ac.sub':'Learn directly from industry practitioners. Learn. Earn. Impact.',
      'ac.jalan':'In progress', 'ac.selesai':'Completed', 'ac.cert':'Certificates', 'ac.xp':'XP Earned',
      'ac.explore':'Explore Top Categories', 'ac.events':'Upcoming Events',
      'ac.lesson':'{n} lessons', 'ac.jam':'{n} hrs', 'ac.progress':'Progress',
      'ac.mulai':'Start learning', 'ac.lanjut':'Continue', 'ac.selesaiBtn':'Completed',
      'ev.join':'Join', 'ev.terdaftar':'Registered', 'ev.kosong':'No events scheduled yet.',

      'so.judul':'Coming soon',
      'so.sub':'This module is being built following the Catalyst Society roadmap.',
      'so.isi':'Communities, Labs, Ventures, and Summit will go live following the 2027 Planning Timeline.',

      'lg.title':'Sign in to Catalyst Society',
      'lg.h1':'One account.<br>The whole<br>ecosystem.',
      'lg.p':'Catalyst Society is a collaborative ecosystem connecting investors, professionals, builders, innovators, and learners in Indonesia through five industry channels and five tiered programs.',
      'lg.f1':'Learn deeper about your industry through E-Courses, Events, and Workshops',
      'lg.f2':'Meet partners, mentors, workers, companies, and jobs',
      'lg.f3':'Build projects together with mentors',
      'lg.f4':'Seek project funding and meet investors',
      'lg.f5':"Showcase projects and share at Catalyst's annual event",
      'lg.masuk.judul':'Sign in to your account.',
      'lg.masuk.sub':'Continue your journey in Passport, Finder, and Academy.',
      'lg.daftar.judul':'Create your Catalyst Passport.',
      'lg.daftar.sub':'One identity for every community, program, and opportunity.',
      'lg.tabMasuk':'Sign in', 'lg.tabDaftar':'Sign up',
      'lg.nama':'Full name', 'lg.channel':'Industry channel',
      'lg.opt.business':'Business (Businessman &amp; Entrepreneur)',
      'lg.opt.investments':'Investments (Finance &amp; Investments)',
      'lg.opt.ai_technology':'AI &amp; Technology',
      'lg.opt.builders':'Builders (Developer &amp; Builder)',
      'lg.opt.social_impact':'Social Impact (Sustainability &amp; Social Impact)',
      'lg.email':'Email or username', 'lg.sandi':'Password', 'lg.sandiPh':'At least 6 characters',
      'lg.hint':'Use at least 6 characters.',
      'lg.kirim.masuk':'Sign in', 'lg.kirim.daftar':'Sign up now', 'lg.proses':'Processing',
      'lg.kembali':'Back to home',
      'lg.demo':'<b>Demo mode.</b> Sign in with the sample account: username <code>{u}</code>, password <code>{p}</code>.',
      'lg.errIsi':'Email or username and password are required.',
      'lg.daftarDemo':'Sign-up is not active in demo mode. Use the sample account: <code>{u}</code> / <code>{p}</code>.',
      'lg.salahDemo':'Wrong username or password.',
      'lg.emailValid':'Enter a valid email address.',
      'lg.sandiMin':'Password must be at least 6 characters.',
      'lg.namaWajib':'Full name is required.',
      'lg.daftarOk':'Sign-up successful. Check your email to confirm, then sign in.',
      'lg.errUmum':'Something went wrong.',
      'lg.errKredensial':'Wrong email or password.',
      'lg.errTerdaftar':'This email is already registered. Please sign in.',
      'lg.errKonfirmasi':'Email not confirmed. Check your inbox.'
    },

    zh: {
      'nav.home':'首页', 'nav.program':'项目', 'nav.soon':'即将推出', 'nav.keluar':'退出',
      'top.cari':'搜索机会、课程、社群...',
      'lang.judul':'语言',

      'demo.judul':'演示模式。',
      'demo.isi':" 以下所有模块均使用保存在您设备上的示例数据完整运行。若要使用真实账户，请在 <code>assets/catalyst.js</code> 中填写 <code>SUPABASE_URL</code> 和 <code>SUPABASE_ANON_KEY</code>，然后在 Supabase SQL Editor 中运行 <code>supabase-schema.sql</code>。 ",
      'demo.ulang':'重置示例数据',
      'profil.hilang':'尚未创建个人资料。请确认已通过 <code>supabase-schema.sql</code> 创建 <code>on_auth_user_created</code> 触发器。',

      'home.selamat':'欢迎回来，{nama}。',
      'home.sub':'您今天的生态：进行中的社群、机会和课程。',
      'home.kom':'社群', 'home.badge':'徽章', 'home.stage':'旅程阶段',
      'home.alur':'您的生态路径', 'home.kelas':'进行中的课程',
      'home.event':'即将举行的活动', 'home.dapat':'您将获得',
      'get.1':'加入社群',
      'get.2':'参与活动',
      'get.3':'协作',
      'get.4':'发展业务',
      'get.5':'融资',
      'get.6':'工作机会',
      'get.7':'竞赛与比赛',
      'get.8':'人脉与分享',
      'get.9':'构建项目',
      'get.10':'展示项目',
      'home.kelasKosong':'暂无进行中的课程。打开 Academy 开始学习。',
      'alur.1':'加入您所选行业的社群', 'alur.2':'通过在线课程、活动和工作坊学习',
      'alur.3':'结识合作伙伴、导师与工作机会', 'alur.4':'与导师一起构建项目',
      'alur.5':'寻求融资并对接投资人', 'alur.6':'在年度活动中展示项目',

      'pp.sub':'用一份数字档案建立您的职业身份。',
      'pp.about':'关于我', 'pp.journey':'旅程', 'pp.communities':'社群',
      'pp.badges':'徽章', 'pp.certs':'证书',
      'pp.aboutKosong':'暂无简介。完善您的资料，在 Finder 中更加醒目。',
      'pp.tahap':'第 {n} 阶段', 'pp.belum':'尚未达成',
      'pp.komKosong':'尚未加入任何社群。',
      'pp.bdgKosong':'第一枚徽章在等您。先从加入社群开始。',
      'pp.certKosong':'暂无证书。请在 Academy 完成课程。',

      'fi.sub':'发现机会，支持有影响力的创新。',
      'fi.semua':'全部', 'fi.hiring':'招聘', 'fi.partner':'寻找合作伙伴',
      'fi.fundraising':'融资', 'fi.support':'寻求支持',
      'fi.kind.hiring':'招聘', 'fi.kind.partner':'合作', 'fi.kind.fundraising':'融资', 'fi.kind.support':'支持',
      'fi.ajukan':'申请', 'fi.kirim':'发送中', 'fi.terkirim':'已发送', 'fi.sudah':'已申请', 'fi.gagal':'失败',
      'fi.terkumpul':'已筹集 {pct}%', 'fi.kosong':'暂无匹配的机会。',

      'ac.sub':'向行业从业者直接学习。Learn. Earn. Impact.',
      'ac.jalan':'进行中', 'ac.selesai':'已完成', 'ac.cert':'证书', 'ac.xp':'已获经验值',
      'ac.explore':'探索热门分类', 'ac.events':'即将举行的活动',
      'ac.lesson':'{n} 节课', 'ac.jam':'{n} 小时', 'ac.progress':'进度',
      'ac.mulai':'开始学习', 'ac.lanjut':'继续', 'ac.selesaiBtn':'已完成',
      'ev.join':'参加', 'ev.terdaftar':'已报名', 'ev.kosong':'暂无已排期的活动。',

      'so.judul':'即将推出',
      'so.sub':'该模块正按照 Catalyst Society 路线图开发中。',
      'so.isi':'Communities、Labs、Ventures 和 Summit 将按 2027 年规划时间表陆续上线。',

      'lg.title':'登录 Catalyst Society',
      'lg.h1':'一个账户。<br>整个<br>生态。',
      'lg.p':'Catalyst Society 是一个协作生态，通过五大行业频道和五个分级项目，连接印尼的投资人、专业人士、建设者、创新者和学习者。',
      'lg.f1':'通过在线课程、活动和工作坊深入了解行业',
      'lg.f2':'结识合作伙伴、导师、人才、公司和工作机会',
      'lg.f3':'与导师一起构建项目',
      'lg.f4':'为项目寻求融资并对接投资人',
      'lg.f5':'在 Catalyst 年度活动中展示项目与分享',
      'lg.masuk.judul':'登录您的账户。',
      'lg.masuk.sub':'在 Passport、Finder 和 Academy 继续您的旅程。',
      'lg.daftar.judul':'创建您的 Catalyst Passport。',
      'lg.daftar.sub':'一个身份，通行所有社群、项目与机会。',
      'lg.tabMasuk':'登录', 'lg.tabDaftar':'注册',
      'lg.nama':'姓名', 'lg.channel':'行业频道',
      'lg.opt.business':'商业（商人与创业者）',
      'lg.opt.investments':'投资（金融与投资）',
      'lg.opt.ai_technology':'AI 与科技',
      'lg.opt.builders':'建设者（开发者与创造者）',
      'lg.opt.social_impact':'社会影响（可持续发展与社会影响）',
      'lg.email':'邮箱或用户名', 'lg.sandi':'密码', 'lg.sandiPh':'至少 6 个字符',
      'lg.hint':'请使用至少 6 个字符。',
      'lg.kirim.masuk':'登录', 'lg.kirim.daftar':'立即注册', 'lg.proses':'处理中',
      'lg.kembali':'返回首页',
      'lg.demo':'<b>演示模式。</b>请使用示例账户登录：用户名 <code>{u}</code>，密码 <code>{p}</code>。',
      'lg.errIsi':'邮箱或用户名和密码为必填项。',
      'lg.daftarDemo':'演示模式下暂未开放注册。请使用示例账户：<code>{u}</code> / <code>{p}</code>。',
      'lg.salahDemo':'用户名或密码错误。',
      'lg.emailValid':'请输入有效的邮箱地址。',
      'lg.sandiMin':'密码至少需要 6 个字符。',
      'lg.namaWajib':'姓名为必填项。',
      'lg.daftarOk':'注册成功。请查收邮件确认后登录。',
      'lg.errUmum':'出现错误。',
      'lg.errKredensial':'邮箱或密码错误。',
      'lg.errTerdaftar':'该邮箱已注册，请直接登录。',
      'lg.errKonfirmasi':'邮箱尚未确认，请查看收件箱。'
    }
  };

  /* Isi data contoh yang aslinya berbahasa Indonesia. Kuncinya teks sumber,
     jadi data Supabase asli (yang tidak cocok kuncinya) tampil apa adanya. */
  var KONTEN = {
    en: {
      'Founder Catalyst Society, ekosistem yang menghubungkan, menginspirasi, dan mempercepat pertumbuhan builders, innovators, investors, dan changemakers untuk menciptakan dampak positif bagi Indonesia dan dunia.':
        'Founder of Catalyst Society, an ecosystem that connects, inspires, and accelerates the growth of builders, innovators, investors, and changemakers to create positive impact for Indonesia and the world.',
      'Jakarta Selatan, Indonesia':'South Jakarta, Indonesia',
      'Bergabung dengan Catalyst':'Joined Catalyst',
      'Bergabung ke tiga komunitas':'Joined three communities',
      'Membuat project pertama':'Created the first project',
      'Menuntaskan bootcamp':'Completed a bootcamp',
      'Membantu lima project':'Helped on five projects',
      'Dampak dan skala':'Impact and scale',
      'Membangun produk internal Catalyst dari Passport sampai Ventures.':"Building Catalyst's internal products, from Passport to Ventures.",
      'Mencari partner pertumbuhan untuk platform belajar berbasis AI.':'Looking for growth partners for an AI-based learning platform.',
      'Jaringan listrik mikro untuk desa terpencil di Indonesia timur.':'Microgrid electricity for remote villages in eastern Indonesia.',
      'Membangun perangkat lunak gratis untuk organisasi sosial.':'Building free software for social organizations.',
      'Merancang pengalaman produk untuk komunitas pebisnis muda.':'Designing product experiences for a young entrepreneurs community.',
      'Mencari mitra penyelenggara dan sponsor untuk panggung tahunan.':'Looking for organizing partners and sponsors for the annual stage.',
      'Energi Terbarukan':'Renewable Energy',
      'Investasi Untuk Pemula':'Investing for Beginners',
      'Membangun Mindset Pebisnis':'Building a Business Mindset',
      'Analisis Teknikal Lanjutan':'Advanced Technical Analysis',
      'Coding Dari Dasar':'Coding from Scratch',
      'Investasi':'Investing',
      'Strategi investasi cerdas untuk masa depan finansial yang bebas.':'Smart investment strategies for a financially free future.',
      'Machine Learning Fundamentals untuk semua latar belakang.':'Machine Learning fundamentals for every background.',
      'Bangun mindset pebisnis dan kembangkan bisnis yang berdampak.':'Build a business mindset and grow a business that makes an impact.',
      'Belajar coding dari dasar hingga mahir bangun aplikasi.':'Learn coding from the basics to building apps confidently.',
      'Membaca struktur pasar dan mengelola risiko secara disiplin.':'Read market structure and manage risk with discipline.',
      'Merancang produk digital dari riset hingga prototipe.':'Design digital products from research to prototype.'
    },
    zh: {
      'Founder Catalyst Society, ekosistem yang menghubungkan, menginspirasi, dan mempercepat pertumbuhan builders, innovators, investors, dan changemakers untuk menciptakan dampak positif bagi Indonesia dan dunia.':
        'Catalyst Society 创始人。该生态连接、激励并加速建设者、创新者、投资人和变革者的成长，为印尼乃至世界创造积极影响。',
      'Jakarta Selatan, Indonesia':'印度尼西亚，南雅加达',
      'Bergabung dengan Catalyst':'加入 Catalyst',
      'Bergabung ke tiga komunitas':'加入三个社群',
      'Membuat project pertama':'创建第一个项目',
      'Menuntaskan bootcamp':'完成训练营',
      'Membantu lima project':'协助五个项目',
      'Dampak dan skala':'影响力与规模',
      'Membangun produk internal Catalyst dari Passport sampai Ventures.':'构建 Catalyst 的内部产品，从 Passport 到 Ventures。',
      'Mencari partner pertumbuhan untuk platform belajar berbasis AI.':'为基于 AI 的学习平台寻找增长合作伙伴。',
      'Jaringan listrik mikro untuk desa terpencil di Indonesia timur.':'为印尼东部偏远村庄提供微电网供电。',
      'Membangun perangkat lunak gratis untuk organisasi sosial.':'为社会组织开发免费软件。',
      'Merancang pengalaman produk untuk komunitas pebisnis muda.':'为青年创业者社群设计产品体验。',
      'Mencari mitra penyelenggara dan sponsor untuk panggung tahunan.':'为年度舞台寻找承办伙伴和赞助商。',
      'Energi Terbarukan':'可再生能源',
      'Investasi Untuk Pemula':'投资入门',
      'Membangun Mindset Pebisnis':'培养商业思维',
      'Analisis Teknikal Lanjutan':'高级技术分析',
      'Coding Dari Dasar':'编程从零开始',
      'Investasi':'投资',
      'Strategi investasi cerdas untuk masa depan finansial yang bebas.':'为财务自由的未来制定明智的投资策略。',
      'Machine Learning Fundamentals untuk semua latar belakang.':'面向所有背景的机器学习基础。',
      'Bangun mindset pebisnis dan kembangkan bisnis yang berdampak.':'培养商业思维，发展有影响力的业务。',
      'Belajar coding dari dasar hingga mahir bangun aplikasi.':'从基础学起，直到熟练开发应用。',
      'Membaca struktur pasar dan mengelola risiko secara disiplin.':'解读市场结构，严格管理风险。',
      'Merancang produk digital dari riset hingga prototipe.':'从调研到原型，设计数字产品。'
    }
  };

  var LOCALE = { id: 'id-ID', en: 'en-US', zh: 'zh-CN' };

  function awal() {
    try { var s = localStorage.getItem(KUNCI); if (s && K[s]) return s; } catch (e) {}
    var n = (navigator.language || 'id').slice(0, 2).toLowerCase();
    return n === 'zh' ? 'zh' : n === 'en' ? 'en' : 'id';
  }
  var lang = awal();

  function t(kunci, v) {
    var s = (K[lang] && K[lang][kunci] != null) ? K[lang][kunci] : (K.id[kunci] != null ? K.id[kunci] : kunci);
    if (v) s = s.replace(/\{(\w+)\}/g, function (_, k) { return v[k] != null ? v[k] : ''; });
    return s;
  }

  function x(teks) {
    if (teks == null) return teks;
    var m = KONTEN[lang];
    return (m && m[teks] != null) ? m[teks] : teks;
  }

  function apply(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i18n')); });
    root.querySelectorAll('[data-i18n-ph]').forEach(function (el) { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph'))); });
    root.querySelectorAll('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
  }

  function set(kode) {
    if (!K[kode]) return;
    lang = kode;
    try { localStorage.setItem(KUNCI, kode); } catch (e) {}
    apply();
  }

  /* ---------- pemilih bahasa ---------- */
  var BENDERA = {
    id: '<rect width="24" height="8" y="4" fill="#ce1126"/><rect width="24" height="8" y="12" fill="#fff"/>',
    en: '<rect width="24" height="16" y="4" fill="#012169"/><path d="M0 4l24 16M24 4L0 20" stroke="#fff" stroke-width="3.2"/><path d="M0 4l24 16M24 4L0 20" stroke="#c8102e" stroke-width="1.9"/><path d="M12 4v16M0 12h24" stroke="#fff" stroke-width="5.4"/><path d="M12 4v16M0 12h24" stroke="#c8102e" stroke-width="3.2"/>',
    zh: '<rect width="24" height="16" y="4" fill="#ee1c25"/><path fill="#ff0" d="M5 7.2l.7 2.1h2.2l-1.8 1.3.7 2.1L5 11.4l-1.8 1.3.7-2.1L2.1 9.3h2.2z"/><circle fill="#ff0" cx="10.4" cy="7" r=".8"/><circle fill="#ff0" cx="12.2" cy="8.8" r=".8"/><circle fill="#ff0" cx="12.2" cy="11.2" r=".8"/><circle fill="#ff0" cx="10.4" cy="12.9" r=".8"/>'
  };
  var NAMA = { id: 'Bahasa Indonesia', en: 'English', zh: '中文' };

  function bendera(k) {
    return '<svg class="bendera" viewBox="0 4 24 16" aria-hidden="true">' + BENDERA[k] + '</svg>';
  }

  /* onGanti dipanggil sesudah bahasa berubah. App memuat ulang halaman
     karena banyak bagian digambar lewat JS; login cukup menggambar ulang. */
  function pasangPemilih(wadah, onGanti) {
    if (!wadah) return;
    function gambar() {
      wadah.innerHTML =
        '<button class="lang-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="' + t('lang.judul') + '">' +
          bendera(lang) + '<span class="lang-kode">' + lang.toUpperCase() + '</span>' +
          '<svg class="panah" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' +
        '<div class="lang-list" role="menu">' +
          ['id', 'en', 'zh'].map(function (k) {
            return '<button type="button" role="menuitem" data-lang="' + k + '" class="' + (k === lang ? 'on' : '') + '">' +
                   bendera(k) + NAMA[k] + '</button>';
          }).join('') +
        '</div>';
    }
    gambar();

    wadah.addEventListener('click', function (e) {
      var btn = e.target.closest('.lang-btn');
      if (btn) {
        e.stopPropagation();
        var buka = wadah.classList.toggle('buka');
        btn.setAttribute('aria-expanded', buka ? 'true' : 'false');
        return;
      }
      var pilih = e.target.closest('[data-lang]');
      if (pilih) {
        wadah.classList.remove('buka');
        if (pilih.dataset.lang === lang) return;
        set(pilih.dataset.lang);
        gambar();
        if (onGanti) onGanti(lang);
      }
    });
    document.addEventListener('click', function () { wadah.classList.remove('buka'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') wadah.classList.remove('buka'); });
  }

  return {
    t: t, x: x, apply: apply, set: set, pasangPemilih: pasangPemilih,
    get: function () { return lang; },
    locale: function () { return LOCALE[lang] || 'id-ID'; }
  };
})();
