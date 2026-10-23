/* Interaksi landing: alur pipeline, kartu Program, formulir kolaborasi bertahap,
   dan footer. Teks pipeline ada di sini (ID dan EN) karena panelnya dirender
   ulang setiap tahap atau bahasa berganti. */
(function () {
  'use strict';

  function bahasa() {
    var l = (document.documentElement.lang || 'id').slice(0, 2);
    return l === 'id' ? 'id' : 'en';
  }
  function t(k, a) {
    var K = window.CATALYST_I18N, l = (document.documentElement.lang || 'id').slice(0, 2);
    return (K && ((K[l] && K[l][k]) || (K.id && K.id[k]))) || a;
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  var hemat = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------
     1. Pipeline: enam tahap, dua sudut pandang
     ------------------------------------------------------------ */
  var KOLOM = {
    talenta: { id: ['Yang dipelajari', 'Yang didapatkan', 'Difasilitasi Catalyst'], en: ['What you learn', 'What you get', 'What Catalyst provides'] },
    mitra: { id: ['Peran mitra', 'Manfaat bagi mitra', 'Contoh program'], en: ['Partner role', 'Partner benefits', 'Program examples'] }
  };
  var TAHAP = [
    {
      j: ['Explorer', 'Connector'],
      talenta: {
        id: ['Mulai dari komunitas yang sesuai minat dan industri Anda.',
          ['Memetakan minat dan arah karier di 5 industri', 'Budaya kolaborasi dan berjejaring', 'Membangun identitas profesional lewat Passport'],
          ['Akses ke 300+ komunitas mitra', 'Catalyst Passport dan Catalyst ID', 'Teman sebaya dengan minat yang sama'],
          ['Direktori komunitas Catalyst', 'Kanal 5 industri: Business, Investments, AI & Tech, Builders, Social Impact', 'Event pengenalan komunitas'],
          'Passport aktif dan terhubung dengan komunitas pilihan.'],
        en: ['Start with a community that fits your interests and industry.',
          ['Mapping your interests and career direction across 5 industries', 'A culture of collaboration and networking', 'Building a professional identity with Passport'],
          ['Access to 300+ partner communities', 'Catalyst Passport and Catalyst ID', 'Peers who share your interests'],
          ['The Catalyst community directory', '5 industry channels: Business, Investments, AI & Tech, Builders, Social Impact', 'Community onboarding events'],
          'An active Passport connected to the communities you chose.']
      },
      mitra: {
        id: ['Hadir di titik awal perjalanan talenta muda.',
          ['Menjadi Community Partner', 'Membuka akses ke anggota komunitas Anda', 'Co-branding program komunitas'],
          ['Jangkauan ke 10.000+ anak muda', 'Brand dikenal sejak awal karier mereka', 'Kolaborasi lintas 300+ komunitas'],
          ['Event komunitas bersama', 'Program onboarding anggota', 'Kampanye di kanal industri'],
          'Komunitas dan brand Anda hadir sejak langkah pertama talenta.'],
        en: ['Be present at the very start of a young talent’s journey.',
          ['Become a Community Partner', 'Open access to your community members', 'Co-branded community programs'],
          ['Reach 10,000+ young people', 'Brand recognition from the start of their careers', 'Collaboration across 300+ communities'],
          ['Joint community events', 'Member onboarding programs', 'Campaigns on industry channels'],
          'Your community and brand are there from a talent’s first step.']
      }
    },
    {
      j: ['Challenger'],
      talenta: {
        id: ['Tingkatkan kemampuan lewat kelas yang dipandu praktisi industri.',
          ['Investing, AI, Business, dan Coding', 'Keterampilan praktis dari studi kasus nyata', 'Cara berpikir dan bekerja seperti praktisi'],
          ['E-course, workshop, dan bootcamp', 'Sertifikat yang tercatat di Passport', 'Akses langsung ke mentor'],
          ['Catalyst Academy', 'Mentor dan praktisi berpengalaman', 'Kelas, event, dan sesi belajar rutin'],
          'Kompetensi yang tervalidasi dan sertifikat di Passport.'],
        en: ['Level up through classes led by industry practitioners.',
          ['Investing, AI, Business, and Coding', 'Practical skills from real case studies', 'How practitioners think and work'],
          ['E-courses, workshops, and bootcamps', 'Certificates recorded on your Passport', 'Direct access to mentors'],
          ['Catalyst Academy', 'Experienced mentors and practitioners', 'Regular classes, events, and study sessions'],
          'Validated skills and certificates on your Passport.']
      },
      mitra: {
        id: ['Bentuk talenta sesuai kebutuhan industri Anda.',
          ['Pengajar, mentor, atau penyedia kurikulum', 'Sponsor kelas dan bootcamp', 'Mitra sertifikasi'],
          ['Employer branding di kalangan talenta muda', 'Talenta dibekali sesuai kebutuhan industri', 'Thought leadership perusahaan'],
          ['Corporate class', 'Bootcamp bersponsor', 'Workshop teknis'],
          'Talenta yang siap bekerja dengan keterampilan yang Anda butuhkan.'],
        en: ['Shape talent around your industry’s needs.',
          ['Instructor, mentor, or curriculum provider', 'Class and bootcamp sponsor', 'Certification partner'],
          ['Employer branding among young talent', 'Talent trained for your industry’s needs', 'Corporate thought leadership'],
          ['Corporate classes', 'Sponsored bootcamps', 'Technical workshops'],
          'Job-ready talent with the skills you need.']
      }
    },
    {
      j: ['Contributor'],
      talenta: {
        id: ['Bertemu orang dan peluang yang tepat untuk langkah berikutnya.',
          ['Membangun relasi profesional', 'Memperkenalkan diri dan ide dengan meyakinkan', 'Bekerja dalam tim lintas latar belakang'],
          ['Pertemuan dengan partner, mentor, dan perusahaan', 'Peluang kerja, magang, dan kolaborasi projek', 'Calon co-founder dan rekan tim'],
          ['Catalyst Finder', 'Fitur Connections di Passport', 'Sesi networking dan matchmaking'],
          'Jaringan aktif dan peluang nyata: kerja, kolaborasi, atau tim.'],
        en: ['Meet the right people and opportunities for your next step.',
          ['Building professional relationships', 'Presenting yourself and your ideas convincingly', 'Working in cross-background teams'],
          ['Meetings with partners, mentors, and companies', 'Jobs, internships, and project collaborations', 'Potential co-founders and teammates'],
          ['Catalyst Finder', 'Connections on Passport', 'Networking and matchmaking sessions'],
          'An active network and real opportunities: jobs, collaborations, or a team.']
      },
      mitra: {
        id: ['Temukan talenta yang tepat dengan profil yang terverifikasi.',
          ['Membuka lowongan dan magang', 'Mencari mitra atau vendor muda', 'Menjadi mentor'],
          ['Talenta terkurasi dengan rekam jejak di Passport', 'Proses rekrutmen lebih cepat', 'Pipeline talenta jangka panjang'],
          ['Hiring day', 'Program magang', 'Talent matchmaking'],
          'Talenta yang tepat untuk tim Anda, lengkap dengan rekam jejaknya.'],
        en: ['Find the right talent with verified profiles.',
          ['Post jobs and internships', 'Find young partners or vendors', 'Become a mentor'],
          ['Curated talent with a track record on Passport', 'A faster hiring process', 'A long-term talent pipeline'],
          ['Hiring days', 'Internship programs', 'Talent matchmaking'],
          'The right talent for your team, track record included.']
      }
    },
    {
      j: ['Innovator', 'Builder'],
      talenta: {
        id: ['Wujudkan ide menjadi projek atau produk bersama mentor.',
          ['Validasi masalah dan pasar', 'Membangun MVP dan model bisnis', 'Mengelola projek dan tim'],
          ['Pendampingan mentor yang intensif', 'Kerangka kerja dari ide sampai peluncuran', 'Umpan balik dari praktisi dan pengguna'],
          ['Catalyst Labs (inkubasi)', 'Kurikulum dari ide sampai peluncuran', 'Akses jaringan ahli dan alat kerja'],
          'Projek atau produk yang berjalan dan siap tumbuh.'],
        en: ['Turn your idea into a project or product with mentors.',
          ['Validating the problem and market', 'Building an MVP and business model', 'Managing projects and teams'],
          ['Intensive mentoring', 'A framework from idea to launch', 'Feedback from practitioners and users'],
          ['Catalyst Labs (incubation)', 'An idea-to-launch curriculum', 'Access to experts and tools'],
          'A running project or product, ready to grow.']
      },
      mitra: {
        id: ['Lahirkan inovasi dari tantangan nyata bisnis Anda.',
          ['Co-incubation dan open innovation', 'Mentor ahli di bidang Anda', 'Penyedia tantangan industri'],
          ['Solusi baru untuk masalah bisnis', 'Akses awal ke inovasi dan startup', 'Dampak CSR yang terukur'],
          ['Innovation challenge', 'Program inkubasi bersama', 'Hackathon tematik'],
          'Inovasi yang lahir dari tantangan nyata bisnis Anda.'],
        en: ['Spark innovation from your real business challenges.',
          ['Co-incubation and open innovation', 'Expert mentors from your field', 'Industry challenge provider'],
          ['New solutions to business problems', 'Early access to innovation and startups', 'Measurable CSR impact'],
          ['Innovation challenges', 'Joint incubation programs', 'Themed hackathons'],
          'Innovation born from your real business challenges.']
      }
    },
    {
      j: ['Founder'],
      talenta: {
        id: ['Siapkan bisnis untuk pendanaan dan pertumbuhan.',
          ['Fundraising dan menyusun pitch deck', 'Metrik, valuasi, dan strategi pertumbuhan', 'Bernegosiasi dengan investor'],
          ['Akses ke investor dan venture capital', 'Persiapan pitching dan due diligence', 'Jaringan Founder Catalyst'],
          ['Catalyst Ventures', 'Sesi pitching dan demo day', 'Pendampingan menuju pendanaan'],
          'Bisnis yang siap didanai dan dikembangkan lebih besar.'],
        en: ['Prepare your business for funding and growth.',
          ['Fundraising and building a pitch deck', 'Metrics, valuation, and growth strategy', 'Negotiating with investors'],
          ['Access to investors and venture capital', 'Pitch and due diligence preparation', 'The Catalyst Founder network'],
          ['Catalyst Ventures', 'Pitch sessions and demo days', 'Guidance toward funding'],
          'A business that is ready to be funded and scaled.']
      },
      mitra: {
        id: ['Akses startup terbaik yang sudah melalui proses Catalyst.',
          ['Investor, angel, atau venture partner', 'Mitra korporasi untuk projek percontohan', 'Penasihat pertumbuhan'],
          ['Deal flow startup yang sudah tervalidasi', 'Due diligence lebih efisien', 'Peluang investasi tahap awal'],
          ['Demo day', 'Sesi pitching tertutup', 'Program pilot korporat'],
          'Startup terkurasi yang siap untuk investasi atau kemitraan.'],
        en: ['Access the best startups that went through the Catalyst process.',
          ['Investor, angel, or venture partner', 'Corporate partner for pilot projects', 'Growth advisor'],
          ['A deal flow of validated startups', 'More efficient due diligence', 'Early-stage investment opportunities'],
          ['Demo days', 'Closed pitch sessions', 'Corporate pilot programs'],
          'Curated startups ready for investment or partnership.']
      }
    },
    {
      j: [],
      talenta: {
        id: ['Tampilkan karya Anda di panggung tahunan ekosistem Catalyst.',
          ['Storytelling dan presentasi di panggung', 'Membangun reputasi dan personal brand', 'Belajar dari builder lintas industri'],
          ['Eksposur ke investor, media, dan korporat', 'Kesempatan meraih pendanaan Rp100 juta lewat Best Project Innovation', 'Relasi dengan ekosistem nasional'],
          ['Catalyst Summit tahunan', 'Kompetisi dan showcase projek', 'Panggung, juri, dan venture capital'],
          'Karya yang dikenal luas dan membuka babak pendanaan berikutnya.'],
        en: ['Showcase your work on the Catalyst ecosystem’s annual stage.',
          ['Storytelling and presenting on stage', 'Building reputation and a personal brand', 'Learning from builders across industries'],
          ['Exposure to investors, media, and corporates', 'A shot at IDR 100 million in funding through Best Project Innovation', 'Connections across the national ecosystem'],
          ['The annual Catalyst Summit', 'Project competitions and showcases', 'The stage, judges, and venture capital'],
          'Widely recognized work that opens the next funding round.']
      },
      mitra: {
        id: ['Tampil di panggung utama ekosistem builder Indonesia.',
          ['Sponsor dan mitra resmi Summit', 'Juri, pembicara, atau investor', 'Penyedia hadiah dan pendanaan'],
          ['Visibilitas nasional di depan builders, media, dan investor', 'Positioning sebagai penggerak ekosistem', 'Bertemu startup dan talenta terbaik'],
          ['Catalyst Summit 2027', 'Best Project Innovation', 'Booth dan sesi panel'],
          'Brand Anda tampil di panggung utama ekosistem builder Indonesia.'],
        en: ['Take the main stage of Indonesia’s builder ecosystem.',
          ['Official Summit sponsor and partner', 'Judge, speaker, or investor', 'Prize and funding provider'],
          ['National visibility among builders, media, and investors', 'Positioning as an ecosystem driver', 'Meeting the best startups and talent'],
          ['Catalyst Summit 2027', 'Best Project Innovation', 'Booths and panel sessions'],
          'Your brand on the main stage of Indonesia’s builder ecosystem.']
      }
    }
  ];
  var NAMA = ['Community', 'Academy', 'Matchmaking', 'Labs', 'Ventures', 'Summit'];
  var KATA = ['Join', 'Learn', 'Connect', 'Build', 'Scale', 'Showcase'];

  function pipeline() {
    var root = document.getElementById('pipeline');
    if (!root) return;
    var tombol = [].slice.call(root.querySelectorAll('.pl-steps button'));
    var viewBtn = [].slice.call(root.querySelectorAll('.pl-view button'));
    var pil = root.querySelector('.pl-view-pil');
    var panel = root.querySelector('.pl-panel');
    var isi = root.querySelector('.pl-track i');
    var kini = 0, view = 'talenta', disentuh = false, timer = null;

    function render() {
      var l = bahasa(), d = TAHAP[kini][view][l], kol = KOLOM[view][l];
      tombol.forEach(function (b, i) {
        b.setAttribute('aria-selected', String(i === kini));
        b.tabIndex = i === kini ? 0 : -1;
        b.parentNode.classList.toggle('on', i === kini);
        b.parentNode.classList.toggle('lewat', i < kini);
      });
      isi.style.transform = 'scaleX(' + ((kini + 1) / TAHAP.length) + ')';
      root.querySelector('.pl-big').textContent = '0' + (kini + 1);
      root.querySelector('.pl-title').innerHTML = esc(NAMA[kini]) + ' <i>' + esc(KATA[kini]) + '</i>';
      root.querySelector('.pl-sum').textContent = d[0];
      var j = TAHAP[kini].j;
      root.querySelector('.pl-stage').innerHTML = view === 'talenta'
        ? '<span>' + (l === 'id' ? 'Tahap Journey' : 'Journey stage') + '</span>' +
          (j.length ? j.map(function (x) { return '<em>' + esc(x) + '</em>'; }).join('') : '<em>' + (l === 'id' ? 'Semua tahap' : 'All stages') + '</em>')
        : '';
      root.querySelector('.pl-cols').innerHTML = [1, 2, 3].map(function (n, k) {
        return '<div class="pl-col"><h4>' + esc(kol[k]) + '</h4><ul>' +
          d[n].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
      }).join('');
      root.querySelector('.pl-out b').textContent = d[4];
      panel.classList.remove('ganti'); void panel.offsetWidth; panel.classList.add('ganti');
    }
    function geserPil() {
      var b = viewBtn.filter(function (x) { return x.dataset.view === view; })[0];
      if (!b || !pil) return;
      pil.style.width = b.offsetWidth + 'px';
      pil.style.transform = 'translateX(' + b.offsetLeft + 'px)';
    }
    function pilih(i, dariPengguna) {
      kini = (i + TAHAP.length) % TAHAP.length;
      if (dariPengguna) { disentuh = true; berhenti(); }
      render();
    }
    function jalan() { if (!disentuh && !hemat && !timer) timer = setInterval(function () { pilih(kini + 1); }, 6500); }
    function berhenti() { clearInterval(timer); timer = null; }

    tombol.forEach(function (b, i) {
      b.addEventListener('click', function () { pilih(i, true); });
      b.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!n) return;
        e.preventDefault(); pilih(kini + n, true); tombol[kini].focus();
      });
    });
    viewBtn.forEach(function (b) {
      b.addEventListener('click', function () {
        view = b.dataset.view;
        viewBtn.forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
        disentuh = true; berhenti(); geserPil(); render();
      });
    });
    root.addEventListener('pointerenter', berhenti);
    root.addEventListener('pointerleave', jalan);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) jalan(); else berhenti(); }); }, { threshold: .35 }).observe(root);
    }
    document.addEventListener('bahasa-berubah', function () { render(); requestAnimationFrame(geserPil); });
    addEventListener('resize', geserPil);
    render(); geserPil();
  }

  /* ------------------------------------------------------------
     2. Kartu Program: animasi saat terlihat, Passport miring, Finder mengetik
     ------------------------------------------------------------ */
  function program() {
    var kartu = [].slice.call(document.querySelectorAll('.pg-card'));
    if (!kartu.length) return;
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('hidup'); io.unobserve(e.target); } });
      }, { threshold: .3 });
      kartu.forEach(function (k) { io.observe(k); });
    } else kartu.forEach(function (k) { k.classList.add('hidup'); });

    var pass = document.querySelector('.pg-passport');
    var kartuP = pass && pass.querySelector('.pgv-card');
    if (pass && kartuP && !hemat && matchMedia('(pointer: fine)').matches) {
      pass.addEventListener('pointermove', function (e) {
        var r = pass.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        kartuP.style.transform = 'rotateY(' + (x * 14).toFixed(2) + 'deg) rotateX(' + (-y * 12).toFixed(2) + 'deg) translateZ(0)';
      });
      pass.addEventListener('pointerleave', function () { kartuP.style.transform = ''; });
    }

    var ketik = document.querySelector('.pgv-type');
    if (ketik) {
      var kata = ['Product intern', 'Co-founder AI', 'Pre-seed investor', 'Mentor GTM'], ki = 0, ci = 0, hapus = false;
      if (hemat) { ketik.textContent = kata[0]; return; }
      (function langkah() {
        var w = kata[ki];
        ci += hapus ? -1 : 1;
        ketik.textContent = w.slice(0, ci);
        var jeda = hapus ? 40 : 85;
        if (!hapus && ci === w.length) { hapus = true; jeda = 1500; }
        else if (hapus && ci === 0) { hapus = false; ki = (ki + 1) % kata.length; jeda = 350; }
        setTimeout(langkah, jeda);
      })();
    }
  }

  /* ------------------------------------------------------------
     3. Formulir kolaborasi bertahap
     ------------------------------------------------------------ */
  function kolaborasi() {
    var wadah = document.getElementById('klForm2'), f = document.getElementById('klForm');
    if (!wadah || !f) return;
    var hal = [].slice.call(f.querySelectorAll('.kf-page'));
    var langkah = [].slice.call(f.querySelectorAll('.kf-steps li'));
    var st = document.getElementById('klStatus');
    var back = f.querySelector('.kf-back'), next = f.querySelector('.kf-next'), send = f.querySelector('.kf-send');
    var bar = f.querySelector('.kf-progress i');
    var done = wadah.querySelector('.kf-done');
    var pesan = f.querySelector('textarea[name="message"]'), hitung = f.querySelector('.kf-count b');
    var ke = 0;

    function tampil(i) {
      ke = i;
      hal.forEach(function (h, n) { h.classList.toggle('on', n === i); });
      langkah.forEach(function (l, n) { l.classList.toggle('on', n === i); l.classList.toggle('lewat', n < i); });
      back.hidden = i === 0; next.hidden = i === hal.length - 1; send.hidden = i !== hal.length - 1;
      bar.style.transform = 'scaleX(' + ((i + 1) / hal.length) + ')';
      st.textContent = '';
    }
    function salah(el) { var l = el.closest('.kf-f,.kf-g,.kf-setuju'); if (l) l.classList.add('salah'); }
    function cek(i) {
      f.querySelectorAll('.salah').forEach(function (x) { x.classList.remove('salah'); });
      var bad = [];
      if (i === 0) {
        ['full_name', 'email'].forEach(function (n) {
          var el = f.elements[n];
          if (!el.value.trim() || (el.type === 'email' && !el.checkValidity()) || (n === 'full_name' && el.value.trim().length < 2)) bad.push(el);
        });
        if (bad.length) { bad.forEach(salah); bad[0].focus(); st.textContent = t('kf.e1', 'Lengkapi nama dan email yang valid.'); return false; }
      }
      if (i === 1 && !f.querySelector('input[name="kinds"]:checked')) {
        salah(f.querySelector('input[name="kinds"]')); st.textContent = t('kf.e2', 'Pilih setidaknya satu jenis kolaborasi.'); return false;
      }
      if (i === 2) {
        if (pesan.value.trim().length < 10) bad.push(pesan);
        if (!f.elements.setuju.checked) bad.push(f.elements.setuju);
        if (bad.length) { bad.forEach(salah); bad[0].focus(); st.textContent = t('kf.e3', 'Ceritakan rencana Anda minimal 10 karakter, lalu centang persetujuan.'); return false; }
      }
      return true;
    }
    next.addEventListener('click', function () { if (cek(ke)) { tampil(ke + 1); fokusAwal(); } });
    back.addEventListener('click', function () { tampil(ke - 1); fokusAwal(); });
    function fokusAwal() { var el = hal[ke].querySelector('input:not([type=radio]):not([type=checkbox]),textarea'); if (el && matchMedia('(pointer: fine)').matches) el.focus({ preventScroll: true }); }
    f.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && ke < hal.length - 1) { e.preventDefault(); next.click(); }
    });
    pesan.addEventListener('input', function () { hitung.textContent = pesan.value.length; });

    /* Pilihan bawaan browser (kotak putih, sorotan biru) diganti daftar gelap yang
       sesuai formulir. Select asli tetap ada sebagai sumber nilai dan cadangan. */
    function dropdown(sel) {
      var id = 'kfdd-' + sel.name;
      var lab = sel.closest('.kf-f').querySelector('span');
      if (lab && !lab.id) lab.id = id + '-l';
      sel.classList.add('kf-native');
      sel.tabIndex = -1;
      var wrap = document.createElement('div'); wrap.className = 'kf-dd';
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'kf-dd-btn';
      btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', id);
      btn.innerHTML = '<span class="kf-dd-v" id="' + id + '-v"></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
      if (lab) btn.setAttribute('aria-labelledby', lab.id + ' ' + id + '-v');
      var list = document.createElement('ul');
      list.className = 'kf-dd-list'; list.id = id; list.setAttribute('role', 'listbox'); list.hidden = true;
      if (lab) list.setAttribute('aria-labelledby', lab.id);
      sel.insertAdjacentElement('afterend', wrap);
      wrap.appendChild(btn); wrap.appendChild(list);
      var aktif = -1;
      function opsi() { return [].slice.call(sel.options).filter(function (o) { return o.value; }); }
      function render() {
        var o = sel.options[sel.selectedIndex];
        btn.querySelector('.kf-dd-v').textContent = o ? o.textContent : '';
        btn.classList.toggle('kosong', !sel.value);
        list.innerHTML = opsi().map(function (o, i) {
          return '<li role="option" id="' + id + '-' + i + '" aria-selected="' + (o.value === sel.value) + '"><span>' + esc(o.textContent) +
            '</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 10 17l9-10"/></svg></li>';
        }).join('');
      }
      function sorot() {
        [].forEach.call(list.children, function (li, i) { li.classList.toggle('sorot', i === aktif); });
        var li = list.children[aktif];
        if (li) { btn.setAttribute('aria-activedescendant', li.id); li.scrollIntoView({ block: 'nearest' }); }
      }
      function buka(b) {
        list.hidden = !b; btn.setAttribute('aria-expanded', String(b)); wrap.classList.toggle('buka', b);
        if (b) { aktif = Math.max(0, opsi().map(function (o) { return o.value; }).indexOf(sel.value)); sorot(); }
        else btn.removeAttribute('aria-activedescendant');
      }
      function pilih(i) {
        var o = opsi()[i]; if (!o) return;
        sel.value = o.value; sel.dispatchEvent(new Event('change', { bubbles: true }));
        render(); buka(false); btn.focus();
      }
      btn.addEventListener('click', function () { buka(list.hidden); });
      btn.addEventListener('keydown', function (e) {
        var n = opsi().length;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (list.hidden) { buka(true); return; }
          aktif = (aktif + (e.key === 'ArrowDown' ? 1 : -1) + n) % n; sorot();
        } else if ((e.key === 'Enter' || e.key === ' ') && !list.hidden) { e.preventDefault(); pilih(aktif); }
        else if (e.key === 'Escape' && !list.hidden) { e.preventDefault(); e.stopPropagation(); buka(false); }
        else if (e.key === 'Tab') buka(false);
      });
      list.addEventListener('pointerdown', function (e) { e.preventDefault(); });
      list.addEventListener('click', function (e) {
        e.preventDefault();
        var li = e.target.closest('li'); if (li) pilih([].indexOf.call(list.children, li));
      });
      list.addEventListener('pointermove', function (e) {
        var li = e.target.closest('li'); if (li) { aktif = [].indexOf.call(list.children, li); sorot(); }
      });
      document.addEventListener('pointerdown', function (e) { if (!wrap.contains(e.target)) buka(false); });
      document.addEventListener('bahasa-berubah', function () { setTimeout(render); });
      f.addEventListener('reset', function () { setTimeout(render); });
      render();
    }
    [].forEach.call(f.querySelectorAll('.kf-f select'), dropdown);

    /* Kartu model kemitraan memilih jenis kolaborasi di formulir. */
    var model = [].slice.call(document.querySelectorAll('.kl-model'));
    function sinkronModel() {
      model.forEach(function (m) {
        var cb = f.querySelector('input[name="kinds"][value="' + m.dataset.kind.replace(/"/g, '') + '"]');
        m.classList.toggle('on', !!(cb && cb.checked));
        m.setAttribute('aria-pressed', String(!!(cb && cb.checked)));
      });
    }
    model.forEach(function (m) {
      m.addEventListener('click', function () {
        var cb = f.querySelector('input[name="kinds"][value="' + m.dataset.kind.replace(/"/g, '') + '"]');
        if (!cb) return;
        cb.checked = !cb.checked; sinkronModel();
        if (cb.checked && ke !== 1 && matchMedia('(max-width: 900px)').matches) wadah.scrollIntoView({ behavior: hemat ? 'auto' : 'smooth', block: 'start' });
      });
    });
    f.addEventListener('change', function (e) { if (e.target.name === 'kinds') sinkronModel(); });
    sinkronModel();

    function nilai(n) { var el = f.elements[n]; return el && el.value ? el.value.trim() : ''; }
    function pilihan(n) { return [].slice.call(f.querySelectorAll('input[name="' + n + '"]:checked')).map(function (x) { return x.value; }); }
    function radio(n) { var x = f.querySelector('input[name="' + n + '"]:checked'); return x ? x.value : ''; }

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!cek(0)) return tampil(0);
      if (!cek(1)) return tampil(1);
      if (!cek(2)) return;
      var data = {
        full_name: nilai('full_name'), job_title: nilai('job_title'), email: nilai('email'), phone: nilai('phone'),
        organization: nilai('organization'), org_type: radio('org_type'), website: nilai('website'),
        kinds: pilihan('kinds'), industries: pilihan('industries'), budget: nilai('budget'), timeline: nilai('timeline'),
        contact_pref: radio('contact_pref'), source: nilai('source'), message: pesan.value.trim(), situs_web: nilai('situs_web')
      };
      send.disabled = true; st.textContent = t('kf.kirim', 'Mengirim…');
      var db = window.CATALYST && window.CATALYST.db;
      if (!db) { cadangan(data); return; }
      db.rpc('submit_collaboration', { p: data }).then(function (r) {
        send.disabled = false;
        if (r.error) {
          st.textContent = /Terlalu banyak/.test(r.error.message) ? t('kf.banjir', 'Terlalu banyak kiriman dari email ini.') : t('kf.gagal', 'Pengiriman gagal. Coba lagi.');
          return;
        }
        selesai(data, r.data);
      }, function () { send.disabled = false; st.textContent = t('kf.gagal', 'Pengiriman gagal. Coba lagi.'); });
    });

    /* Tanpa koneksi Supabase (mis. konfigurasi belum terpasang): aplikasi email terbuka. */
    function cadangan(d) {
      send.disabled = false;
      var isi = 'Nama: ' + d.full_name + '\nJabatan: ' + (d.job_title || '-') + '\nEmail: ' + d.email + '\nTelepon: ' + (d.phone || '-') +
        '\nOrganisasi: ' + (d.organization || '-') + ' (' + (d.org_type || '-') + ')\nJenis kolaborasi: ' + d.kinds.join(', ') + '\n\n' + d.message;
      location.href = 'mailto:info@catalystsociety.id?subject=' + encodeURIComponent('Kolaborasi Catalyst Society: ' + d.kinds[0]) + '&body=' + encodeURIComponent(isi);
    }

    function selesai(d, ref) {
      st.textContent = ''; f.hidden = true; done.hidden = false;
      done.querySelector('.kf-done-nama').textContent = d.full_name.split(' ')[0] + '!';
      done.querySelector('.kf-ref-no').textContent = ref;
      done.querySelector('.kf-wa').href = 'https://wa.me/6285123350235?text=' + encodeURIComponent('Halo Catalyst Society, saya ' + d.full_name + ' baru mengirim permintaan kolaborasi dengan nomor ' + ref + '.');
      done.focus();
    }
    done.querySelector('.kf-salin').addEventListener('click', function (e) {
      var b = e.currentTarget, ref = done.querySelector('.kf-ref-no').textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(ref) : Promise.reject()).then(function () {
        b.textContent = t('kf.tersalin', 'Tersalin'); setTimeout(function () { b.textContent = t('kf.salin', 'Salin'); }, 1600);
      }, function () {});
    });
    done.querySelector('.kf-lagi').addEventListener('click', function () {
      f.reset(); hitung.textContent = '0'; sinkronModel(); done.hidden = true; f.hidden = false; tampil(0);
    });
    tampil(0);
  }

  /* ------------------------------------------------------------
     4. Footer: salin email, kembali ke atas
     ------------------------------------------------------------ */
  function footer() {
    document.querySelectorAll('.ft-salin').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-salin');
        if (!navigator.clipboard) return;
        navigator.clipboard.writeText(v).then(function () { b.classList.add('ok'); setTimeout(function () { b.classList.remove('ok'); }, 1600); });
      });
    });
    var atas = document.querySelector('.ft-top');
    if (atas) atas.addEventListener('click', function () {
      if (window.lenis && window.lenis.scrollTo) window.lenis.scrollTo(0); else scrollTo({ top: 0, behavior: hemat ? 'auto' : 'smooth' });
    });
  }


  /* ------------------------------------------------------------
     5. Kalimat Redefine: kata menyala satu per satu mengikuti gulir,
        frasa kunci (em) berubah jadi pil hitam saat tercapai.
     ------------------------------------------------------------ */
  function redefine() {
    var el = document.querySelector('.rd-teks');
    if (!el) return;
    var kata = [];
    var POTONG = /[\u3000-\u9fff\uff00-\uffef]|[^\s\u3000-\u9fff\uff00-\uffef]+|\s+/g;
    function pecah() {
      if (el.querySelector('.rw')) return;
      var hasil = document.createDocumentFragment();
      [].slice.call(el.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          (n.textContent.match(POTONG) || []).forEach(function (t) {
            if (/^\s+$/.test(t)) { hasil.appendChild(document.createTextNode(t)); return; }
            var sp = document.createElement('span'); sp.className = 'rw'; sp.textContent = t; hasil.appendChild(sp);
          });
        } else if (n.nodeType === 1) {
          n.classList.add('rw'); hasil.appendChild(n);
        }
      });
      el.innerHTML = ''; el.appendChild(hasil);
      kata = [].slice.call(el.querySelectorAll('.rw'));
      el.classList.add('rd-hidup');
      perbarui();
    }
    function perbarui() {
      if (!kata.length) return;
      if (hemat) { kata.forEach(function (w) { w.classList.add('on'); }); return; }
      var r = el.getBoundingClientRect(), vh = innerHeight;
      var p = (vh * 0.82 - r.top) / (r.height + vh * 0.3);
      var n = Math.round(Math.max(0, Math.min(1, p)) * kata.length);
      kata.forEach(function (w, i) { w.classList.toggle('on', i < n); });
    }
    var antre = false;
    function gulir() { if (antre) return; antre = true; requestAnimationFrame(function () { antre = false; perbarui(); }); }
    addEventListener('scroll', gulir, { passive: true });
    addEventListener('resize', gulir);
    document.addEventListener('bahasa-berubah', function () { kata = []; setTimeout(pecah); });
    pecah();
  }


  function mulai() { pipeline(); program(); kolaborasi(); footer(); redefine(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai); else mulai();
})();
