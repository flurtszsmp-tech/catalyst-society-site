/* Teks tambahan untuk Program, alur, kolaborasi, dan footer. Digabung ke kamus
   CATALYST_I18N sebelum terapkanBahasa pertama berjalan. Bahasa Mandarin memakai
   teks Inggris sampai terjemahannya tersedia. Atribut data-i18n-ph (placeholder)
   dan data-i18n-aria (aria-label) diterapkan ulang setiap bahasa berganti. */
(function () {
  var K = window.CATALYST_I18N;
  if (!K) return;
  var T = {
    'pg.buat': ['Buat Passport', 'Create Passport'],
    'pg.learn': ['Belajar dari praktisi', 'Learn from practitioners'],
    'pg.summit': ['Lihat Summit 2027', 'See Summit 2027'],
    'pg.prize': ['Pendanaan tahap awal', 'Early-stage funding'],

    'pl.v1': ['Untuk talenta muda', 'For young talent'],
    'pl.v2': ['Untuk mitra &amp; korporat', 'For partners &amp; corporates'],
    'pl.hint': ['Pilih tahap untuk melihat apa yang dipelajari, didapatkan, dan difasilitasi.', 'Choose a stage to see what is learned, gained, and facilitated.'],
    'pl.out': ['Hasil tahap ini', 'Stage outcome'],

    'kf.judul': ['Bangun dampak bersama Catalyst Society.', 'Build impact with Catalyst Society.'],
    'kf.lead': ['Kami bermitra dengan perusahaan, komunitas, kampus, investor, dan pemerintah untuk membuka akses bagi generasi muda Indonesia. Pilih model kemitraan, ceritakan rencana Anda, dan tim kemitraan kami akan menindaklanjuti.',
      'We partner with companies, communities, universities, investors, and government to open access for Indonesia’s young generation. Pick a partnership model, tell us your plan, and our partnerships team will follow up.'],
    'kf.model': ['Model kemitraan', 'Partnership models'],
    'kf.m1': ['Corporate Partnership', 'Corporate Partnership'],
    'kf.m1d': ['Program bersama, employer branding, dan akses talenta muda.', 'Joint programs, employer branding, and access to young talent.'],
    'kf.m2': ['Sponsorship', 'Sponsorship'],
    'kf.m2d': ['Hadir di Catalyst Summit, workshop, dan event komunitas.', 'Be present at Catalyst Summit, workshops, and community events.'],
    'kf.m3': ['Community Partner', 'Community Partner'],
    'kf.m3d': ['Kolaborasi program dan event antarkomunitas.', 'Cross-community programs and events.'],
    'kf.m4': ['Mentor &amp; Speaker', 'Mentor &amp; Speaker'],
    'kf.m4d': ['Berbagi pengalaman di Academy, Labs, dan Summit.', 'Share your experience at Academy, Labs, and Summit.'],
    'kf.m5': ['Investor &amp; Venture', 'Investor &amp; Venture'],
    'kf.m5d': ['Akses deal flow startup yang sudah tervalidasi.', 'Access a deal flow of validated startups.'],
    'kf.m6': ['Talent &amp; Hiring', 'Talent &amp; Hiring'],
    'kf.m6d': ['Rekrut talenta muda terkurasi lewat Catalyst Finder.', 'Hire curated young talent through Catalyst Finder.'],
    'kf.proses': ['Bagaimana prosesnya', 'How it works'],
    'kf.pr1': ['Anda mengirim permintaan dan menerima nomor referensi.', 'You submit a request and receive a reference number.'],
    'kf.pr2': ['Tim kemitraan meninjau dan menghubungi Anda.', 'Our partnerships team reviews it and reaches out.'],
    'kf.pr3': ['Diskusi kebutuhan dan penyusunan proposal kerja sama.', 'We discuss your needs and draft a proposal.'],
    'kf.pr4': ['Kesepakatan, lalu program berjalan bersama.', 'Agreement, then the program runs together.'],
    'kf.t1': ['Tentang Anda', 'About you'],
    'kf.t2': ['Kolaborasi', 'Collaboration'],
    'kf.t3': ['Rencana', 'Plan'],
    'kf.nama': ['Nama lengkap *', 'Full name *'],
    'kf.jabatan': ['Jabatan', 'Job title'],
    'kf.email': ['Email kerja *', 'Work email *'],
    'kf.wa': ['WhatsApp / telepon', 'WhatsApp / phone'],
    'kf.org': ['Organisasi / perusahaan', 'Organization / company'],
    'kf.web': ['Situs / LinkedIn', 'Website / LinkedIn'],
    'kf.jenisorg': ['Jenis organisasi', 'Organization type'],
    'kf.o1': ['Korporasi', 'Corporate'], 'kf.o2': ['Startup', 'Startup'], 'kf.o3': ['UMKM', 'SME'],
    'kf.o4': ['BUMN / Pemerintah', 'State-owned / Government'], 'kf.o5': ['Kampus / Sekolah', 'University / School'],
    'kf.o6': ['Komunitas', 'Community'], 'kf.o7': ['NGO / Yayasan', 'NGO / Foundation'], 'kf.o8': ['Media', 'Media'],
    'kf.o9': ['Investor / VC', 'Investor / VC'], 'kf.o10': ['Individu', 'Individual'],
    'kf.jenis': ['Jenis kolaborasi *', 'Collaboration type *'],
    'kf.boleh': ['boleh lebih dari satu', 'choose one or more'],
    'kf.k7': ['Program Kampus', 'Campus Program'],
    'kf.industri': ['Fokus industri', 'Industry focus'],
    'kf.nilai': ['Perkiraan nilai', 'Estimated value'],
    'kf.waktu': ['Target waktu mulai', 'Target start'],
    'kf.pilih': ['Pilih', 'Select'],
    'kf.b1': ['Belum ditentukan', 'Not decided yet'], 'kf.b2': ['Non-finansial (barang atau jasa)', 'Non-financial (in-kind)'],
    'kf.b3': ['Di bawah Rp10 juta', 'Under IDR 10 million'], 'kf.b4': ['Rp10–50 juta', 'IDR 10–50 million'],
    'kf.b5': ['Rp50–200 juta', 'IDR 50–200 million'], 'kf.b6': ['Di atas Rp200 juta', 'Over IDR 200 million'],
    'kf.w1': ['Dalam 1 bulan', 'Within 1 month'], 'kf.w2': ['1–3 bulan', '1–3 months'],
    'kf.w3': ['3–6 bulan', '3–6 months'], 'kf.w4': ['Fleksibel', 'Flexible'],
    'kf.pnilai': ['Pilih perkiraan nilai', 'Choose an estimate'], 'kf.pwaktu': ['Pilih waktu mulai', 'Choose a start time'],
    'kf.psumber': ['Pilih salah satu', 'Choose one'],
    'kd.mitra': ['Community Partner Catalyst Society', 'Catalyst Society Community Partner', 'Catalyst Society 社群合作伙伴'],
    'alur.kicker': ['Alur Catalyst · 6 Tahap', 'The Catalyst Path · 6 Stages', 'Catalyst 路径 · 6 个阶段'],
    'alur.judul': ['Dari bergabung sampai didanai.', 'From joining to getting funded.', '从加入到获得融资。'],
    'alur.desc': ['Ikuti perjalanan builder tahap demi tahap: apa yang dipelajari, didapatkan, dan difasilitasi Catalyst, untuk talenta muda maupun mitra dan korporat.',
      'Follow the builder journey stage by stage: what is learned, gained, and provided by Catalyst, for young talent as well as partners and corporates.',
      '逐步了解建设者的成长旅程：每个阶段学到什么、获得什么，以及 Catalyst 提供哪些支持，适用于青年人才与合作伙伴。'],
    's4.judul': ['Enam program. Satu jalan untuk bertumbuh.', 'Six programs. One path to grow.', '六大项目，一条成长之路。'],
    's4.sub': ['Dari identitas digital sampai panggung pendanaan, setiap program saling terhubung untuk membantu generasi muda menjadi Founder, Entrepreneur, Pebisnis, dan Changemaker.',
      'From a digital identity to the funding stage, every program connects to help young people become Founders, Entrepreneurs, Business leaders, and Changemakers.',
      '从数字身份到融资舞台，每个项目环环相扣，帮助年轻人成为创始人、企业家、商业领袖与变革者。'],
    'kf.pesan': ['Ceritakan rencana Anda *', 'Tell us your plan *'],
    'kf.pesanph': ['Tujuan kolaborasi, sasaran peserta, bentuk dukungan yang Anda bayangkan, dan hasil yang diharapkan.', 'Goals, target participants, the support you have in mind, and expected outcomes.'],
    'kf.pref': ['Lebih nyaman dihubungi lewat', 'Preferred contact'],
    'kf.p3': ['Telepon', 'Phone call'], 'kf.p4': ['Meeting online', 'Online meeting'],
    'kf.sumber': ['Mengetahui kami dari', 'How did you hear about us'],
    'kf.s3': ['Teman / rekan', 'Friend / colleague'], 'kf.s4': ['Event Catalyst', 'Catalyst event'], 'kf.s5': ['Mesin pencari', 'Search engine'],
    'kf.setuju': ['Saya setuju data ini dipakai tim Catalyst Society untuk menindaklanjuti permintaan kolaborasi.', 'I agree that the Catalyst Society team may use this data to follow up on my collaboration request.'],
    'kf.kembali': ['Kembali', 'Back'],
    'kf.lanjut': ['Lanjut', 'Continue'],
    'kf.terima': ['Terima kasih,', 'Thank you,'],
    'kf.diterima': ['Permintaan kolaborasi Anda sudah kami terima dan masuk ke tim kemitraan Catalyst Society.', 'We have received your collaboration request and passed it to the Catalyst Society partnerships team.'],
    'kf.ref': ['Nomor referensi', 'Reference number'],
    'kf.salin': ['Salin', 'Copy'],
    'kf.lanjutan': ['Simpan nomor ini. Tim kami akan menghubungi Anda melalui kontak yang Anda berikan.', 'Keep this number. Our team will contact you through the details you provided.'],
    'kf.chat': ['Konfirmasi via WhatsApp', 'Confirm via WhatsApp'],
    'kf.lagi': ['Kirim permintaan lain', 'Send another request'],
    'kf.e1': ['Lengkapi nama dan email yang valid.', 'Please enter your name and a valid email.'],
    'kf.e2': ['Pilih setidaknya satu jenis kolaborasi.', 'Choose at least one collaboration type.'],
    'kf.e3': ['Ceritakan rencana Anda minimal 10 karakter, lalu centang persetujuan.', 'Describe your plan in at least 10 characters and tick the consent box.'],
    'kf.kirim': ['Mengirim…', 'Sending…'],
    'kf.gagal': ['Pengiriman gagal. Coba lagi, atau hubungi kami di info@catalystsociety.id.', 'Sending failed. Try again, or reach us at info@catalystsociety.id.'],
    'kf.banjir': ['Terlalu banyak kiriman dari email ini. Coba lagi beberapa menit lagi.', 'Too many requests from this email. Please try again in a few minutes.'],
    'kf.tersalin': ['Tersalin', 'Copied'],

    'ft.kicker': ['Mari terhubung', 'Let’s connect'],
    'ft.judul': ['Siap bertumbuh bersama Catalyst Society?', 'Ready to grow with Catalyst Society?'],
    'ft.ajukan': ['Ajukan kolaborasi', 'Propose a collaboration'],
    'ft.wa': ['Chat WhatsApp', 'Chat on WhatsApp'],
    'ft.desc': ['Ekosistem yang menghubungkan generasi muda Indonesia dengan mentor, komunitas, perusahaan, dan investor, dari belajar sampai membangun bisnis.', 'An ecosystem connecting Indonesia’s young generation with mentors, communities, companies, and investors, from learning to building a business.'],
    'ft.perusahaan': ['Perusahaan', 'Company'],
    'ft.legal': ['Badan hukum resmi, terdaftar dengan NIB dan Akta Pendirian', 'Registered legal entity with a Business ID (NIB) and Deed of Establishment'],
    'ft.kantor': ['Kantor', 'Office'],
    'ft.arah': ['Petunjuk arah', 'Get directions'],
    'ft.kontak': ['Kontak', 'Contact'],
    'ft.cp': ['Contact person &amp; WhatsApp', 'Contact person &amp; WhatsApp'],
    'ft.telp': ['Telepon', 'Phone'],
    'ft.jelajah': ['Jelajahi', 'Explore'],
    'ft.komunitas': ['Komunitas', 'Community'],
    'ft.kolab': ['Kolaborasi', 'Collaboration'],
    'ft.hak': ['hak cipta dilindungi.', 'all rights reserved.'],
    'ft.atas': ['Kembali ke atas', 'Back to top']
  };
  Object.keys(T).forEach(function (k) {
    if (K.id) K.id[k] = T[k][0];
    if (K.en) K.en[k] = T[k][1];
    if (K.zh && (T[k][2] || K.zh[k] == null)) K.zh[k] = T[k][2] || T[k][1];
  });

  function atribut(e) {
    var k = K[e && e.detail] || K.id;
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var v = k[el.getAttribute('data-i18n-ph')];
      if (v != null) el.setAttribute('placeholder', v);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var v = k[el.getAttribute('data-i18n-aria')];
      if (v != null) el.setAttribute('aria-label', v);
    });
  }
  document.addEventListener('bahasa-berubah', atribut);
})();
