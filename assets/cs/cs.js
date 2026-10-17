/* Tanya Catalyst: CS AI di landing. Pesan dikirim ke Cloudflare Worker (window.CATALYST_CS_URL)
   yang memegang kunci Gemini dan pengetahuan Catalyst. Selama alamat Worker kosong, tombol
   tidak tampil. Riwayat chat hanya disimpan di tab ini (sessionStorage). */
(function () {
  var URL_CS = window.CATALYST_CS_URL || '';
  if (/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) URL_CS = new URLSearchParams(location.search).get('cs_url') || URL_CS;
  if (!URL_CS) return;

  var T = {
    id: { tombol: 'Tanya Catalyst', judul: 'Catalyst Assistant', sub: 'Dijawab AI dari info resmi Catalyst', ph: 'Tulis pertanyaanmu…',
      halo: 'Halo! Saya asisten Catalyst Society. Mau tahu soal program, komunitas, Passport, atau cara berkolaborasi?',
      saran: ['Apa itu Catalyst Society?', 'Cara gabung komunitas', 'Apa itu Catalyst Passport?', 'Info Catalyst Summit'],
      galat: 'Maaf, asisten sedang tidak bisa dihubungi. Coba lagi sebentar, atau email info@catalystsociety.site.',
      catatan: 'AI bisa keliru. Untuk hal penting, hubungi tim Catalyst.', tutup: 'Tutup', kirim: 'Kirim' },
    en: { tombol: 'Ask Catalyst', judul: 'Catalyst Assistant', sub: 'AI answers from official Catalyst info', ph: 'Type your question…',
      halo: 'Hi! I am the Catalyst Society assistant. Want to know about our programs, communities, Passport, or how to collaborate?',
      saran: ['What is Catalyst Society?', 'How to join a community', 'What is Catalyst Passport?', 'Catalyst Summit info'],
      galat: 'Sorry, the assistant is unavailable right now. Try again shortly, or email info@catalystsociety.site.',
      catatan: 'AI can make mistakes. For anything important, contact the Catalyst team.', tutup: 'Close', kirim: 'Send' },
    zh: { tombol: '咨询 Catalyst', judul: 'Catalyst 助手', sub: '由 AI 根据 Catalyst 官方信息回答', ph: '输入你的问题…',
      halo: '你好！我是 Catalyst Society 助手。想了解我们的项目、社区、Passport，或如何合作吗？',
      saran: ['Catalyst Society 是什么？', '如何加入社区', 'Catalyst Passport 是什么？', 'Catalyst Summit 信息'],
      galat: '抱歉，助手暂时无法连接。请稍后再试，或发送邮件至 info@catalystsociety.site。',
      catatan: 'AI 可能会出错。重要事项请联系 Catalyst 团队。', tutup: '关闭', kirim: '发送' }
  };
  function bahasa() { var l = (document.documentElement.lang || 'id').slice(0, 2); return T[l] ? l : 'id'; }
  function t(k) { return T[bahasa()][k]; }

  var KUNCI = 'catalyst-cs-riwayat', riwayat = [];
  try { riwayat = JSON.parse(sessionStorage.getItem(KUNCI) || '[]'); } catch (e) {}
  function simpan() { try { sessionStorage.setItem(KUNCI, JSON.stringify(riwayat.slice(-30))); } catch (e) {} }

  var IKON = {
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v10H9l-5 4z" stroke-linejoin="round"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>',
    kirim: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  var tombol = document.createElement('button');
  tombol.type = 'button'; tombol.className = 'cs-tombol';
  var panel = document.createElement('section');
  panel.className = 'cs-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false');
  panel.innerHTML =
    '<header class="cs-kepala"><span class="cs-logo" translate="no">C</span><div><b></b><small></small></div>' +
    '<button type="button" class="cs-tutup">' + IKON.x + '</button></header>' +
    '<div class="cs-isi" data-lenis-prevent aria-live="polite"></div>' +
    '<div class="cs-saran"></div>' +
    '<form class="cs-form"><textarea rows="1" maxlength="1000"></textarea><button type="submit" class="cs-kirim" disabled>' + IKON.kirim + '</button></form>' +
    '<p class="cs-catatan"></p>';
  document.body.appendChild(tombol); document.body.appendChild(panel);
  var isi = panel.querySelector('.cs-isi'), saran = panel.querySelector('.cs-saran'), form = panel.querySelector('.cs-form'),
      input = form.querySelector('textarea'), kirimBtn = form.querySelector('.cs-kirim');

  function label() {
    tombol.innerHTML = '<span class="cs-titik" aria-hidden="true"></span>' + IKON.chat + '<span>' + t('tombol') + '</span>';
    tombol.setAttribute('aria-label', t('tombol'));
    panel.setAttribute('aria-label', t('judul'));
    panel.querySelector('.cs-kepala b').textContent = t('judul');
    panel.querySelector('.cs-kepala small').textContent = t('sub');
    panel.querySelector('.cs-tutup').setAttribute('aria-label', t('tutup'));
    kirimBtn.setAttribute('aria-label', t('kirim'));
    input.placeholder = t('ph');
    panel.querySelector('.cs-catatan').textContent = t('catatan');
    gambarSaran();
    if (!riwayat.length) gambarSemua();
  }

  /* teks aman: HTML di-escape dulu, lalu hanya tautan, tebal, dan daftar sederhana yang dihidupkan */
  function rapikan(s) {
    s = s.replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
    s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    s = s.replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    s = s.replace(/(^|[\s(])((?:www\.)?[a-z0-9-]+\.(?:id|com|site|ai)(?:\/[^\s<)]*)?)(?=[\s.,)!?]|$)/gi, function (m, a, d) {
      return /href=/.test(m) ? m : a + '<a href="https://' + d + '" target="_blank" rel="noopener noreferrer">' + d + '</a>';
    });
    s = s.replace(/([\w.+-]+@[\w-]+\.[\w.]+)/g, '<a href="mailto:$1">$1</a>');
    var baris = s.split(/\n/), out = [], dalam = false;
    baris.forEach(function (b) {
      var m = b.match(/^\s*(?:[*•]|\d+[.)])\s+(.*)/);
      if (m) { if (!dalam) { out.push('<ul>'); dalam = true; } out.push('<li>' + m[1] + '</li>'); }
      else { if (dalam) { out.push('</ul>'); dalam = false; } if (b.trim()) out.push(b + '<br>'); }
    });
    if (dalam) out.push('</ul>');
    return out.join('').replace(/(<br>)+$/, '');
  }
  function gelembung(teks, siapa, galat) {
    var d = document.createElement('div');
    d.className = 'cs-pesan ' + (siapa === 'user' ? 'saya' : 'bot') + (galat ? ' galat' : '');
    if (siapa === 'user') d.textContent = teks; else d.innerHTML = rapikan(teks);
    isi.appendChild(d); isi.scrollTop = isi.scrollHeight; return d;
  }
  function gambarSemua() {
    isi.innerHTML = '';
    gelembung(t('halo'), 'model');
    riwayat.forEach(function (m) { gelembung(m.teks, m.peran); });
  }
  function gambarSaran() {
    saran.innerHTML = '';
    if (riwayat.length) return;
    t('saran').forEach(function (s) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = s;
      b.addEventListener('click', function () { kirim(s); });
      saran.appendChild(b);
    });
  }

  var sibuk = false;
  function kirim(teks) {
    teks = (teks || '').trim();
    if (!teks || sibuk) return;
    sibuk = true; kirimBtn.disabled = true;
    riwayat.push({ peran: 'user', teks: teks }); simpan();
    gelembung(teks, 'user'); saran.innerHTML = ''; input.value = ''; ukurInput();
    var tunggu = gelembung('', 'model'); tunggu.innerHTML = '<span class="cs-mengetik"><i></i><i></i><i></i></span>';
    fetch(URL_CS, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bahasa: bahasa(), pesan: riwayat.slice(-10) }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (h) {
        tunggu.remove();
        if (h.ok && h.d.balasan) { riwayat.push({ peran: 'model', teks: h.d.balasan }); simpan(); gelembung(h.d.balasan, 'model'); }
        else gelembung(h.d.error || t('galat'), 'model', true);
      })
      .catch(function () { tunggu.remove(); gelembung(t('galat'), 'model', true); })
      .then(function () { sibuk = false; kirimBtn.disabled = !input.value.trim(); });
  }

  function ukurInput() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 110) + 'px'; }
  input.addEventListener('input', function () { ukurInput(); kirimBtn.disabled = sibuk || !input.value.trim(); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirim(input.value); } });
  form.addEventListener('submit', function (e) { e.preventDefault(); kirim(input.value); });

  function buka() { document.documentElement.classList.add('cs-buka'); setTimeout(function () { input.focus(); }, 250); isi.scrollTop = isi.scrollHeight; }
  function tutup() { document.documentElement.classList.remove('cs-buka'); tombol.focus(); }
  tombol.addEventListener('click', buka);
  panel.querySelector('.cs-tutup').addEventListener('click', tutup);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.documentElement.classList.contains('cs-buka')) tutup(); });
  document.addEventListener('bahasa-berubah', label);

  label(); gambarSemua();
})();
