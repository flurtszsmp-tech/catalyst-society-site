/* ===========================================================
   Catalyst Passport. Kumpulan ikon.

   Disuntikkan sebagai satu <svg><defs> di awal <body> supaya
   passport.html dan p.html memakai set yang sama tanpa menyalin
   ratusan baris markup dua kali. Dipanggil sebelum penampil
   berjalan, jadi <use href="#ps-..."> sudah punya rujukan.

   Semua digambar pada kanvas 24x24 dengan goresan 1.5, mengikuti
   ikon yang sudah dipakai di index.html.
   =========================================================== */
(function () {
  'use strict';

  var S = 'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';

  var ikon = {
    /* navigasi sisi kiri */
    'home':     '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
    'user':     '<circle cx="12" cy="8" r="3.4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
    'journey':  '<circle cx="12" cy="12" r="8.5"/><path d="m15 9-2.2 5.2L8 16l2.2-5.2z"/>',
    'users':    '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M17 6a3 3 0 0 1 0 6M15 20a6 6 0 0 0-1-3.3"/>',
    'cube':     '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 3v18M4 7.5l8 4.5 8-4.5"/>',
    'award':    '<circle cx="12" cy="9" r="5.2"/><path d="m8.6 13.4-1.1 7 4.5-2.3 4.5 2.3-1.1-7"/>',
    'skills':   '<path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z"/>',
    'network':  '<circle cx="12" cy="5" r="2.4"/><circle cx="5" cy="18" r="2.4"/><circle cx="19" cy="18" r="2.4"/><path d="M10.6 6.9 6.4 15.8M13.4 6.9l4.2 8.9M7.4 18h9.2"/>',
    'chart':    '<path d="M4 20h16M7 20v-7M12 20V6M17 20v-4"/>',
    'settings': '<circle cx="12" cy="12" r="3"/><path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',

    /* bilah atas */
    'search':   '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
    'bell':     '<path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5"/><path d="M13.7 19a2 2 0 0 1-3.4 0"/>',
    'chat':     '<path d="M20.5 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 20.5 12z"/>',
    'chevron':  '<path d="M6 9.5 12 15l6-5.5"/>',
    'menu':     '<path d="M4 7h16M4 12h16M4 17h16"/>',
    'plus':     '<path d="M12 5v14M5 12h14"/>',

    /* kartu passport */
    'pencil':   '<path d="M4 20h4L19.5 8.5a2 2 0 0 0-2.8-2.8L4.2 18.2z"/><path d="M15.5 5.7 18.3 8.5"/>',
    'share':    '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4M8.2 13.2l7.6 4"/>',
    'copy':     '<rect x="9" y="9" width="11" height="11" rx="2.2"/><path d="M5.5 15H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v.5"/>',
    'pin':      '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    'check':    '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    'arrow':    '<path d="M4 12h16M14 6l6 6-6 6"/>',
    'up':       '<path d="M12 19V5M6 11l6-6 6 6"/>',
    'qr':       '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2.5v2.5H14zM19.5 14H20v.5M14 19.5v.5h.5M17.5 17.5H20v2.5h-2.5z"/>',

    /* tautan sosial */
    'linkedin': '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7.5 10.5V17M7.5 7.5v.01M11.5 17v-3.6a2.4 2.4 0 0 1 4.8 0V17M11.5 10.5V17"/>',
    'instagram':'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/>',
    'x':        '<path d="M4.5 4.5 19.5 19.5M19.5 4.5 4.5 19.5"/>',
    'youtube':  '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10.5 9.5v5l4.2-2.5z"/>',
    'globe':    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18-2.5-2.6-2.5-15.4 0-18z"/>',
    'doc':      '<path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z"/><path d="M14 3v4h4M9 13h6M9 17h4"/>',

    /* tahap perjalanan */
    'j-explorer':    '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6"/>',
    'j-connector':   '<circle cx="6" cy="8" r="2.2"/><circle cx="18" cy="8" r="2.2"/><circle cx="12" cy="17" r="2.2"/><path d="M7.6 9.6 10.6 15M16.4 9.6 13.4 15M8.2 8h7.6"/>',
    'j-builder':     '<path d="M12 4l7 4v8l-7 4-7-4V8z"/><path d="M12 4v16M5 8l7 4 7-4"/>',
    'j-challenger':  '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
    'j-contributor': '<path d="M12 20s-7-4.2-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.8-7 9-7 9z"/>',
    'j-innovator':   '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 4 10.5c-.7.7-1 1.3-1 2.5H9c0-1.2-.3-1.8-1-2.5A6 6 0 0 1 12 3z"/>',

    /* lencana */
    'b-spark':  '<path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z"/>',
    'b-users':  '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M17 6a3 3 0 0 1 0 6M15 20a6 6 0 0 0-1-3.3"/>',
    'b-search': '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
    'b-globe':  '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18-2.5-2.6-2.5-15.4 0-18z"/>',
    'b-rocket': '<path d="M12 3c3.5 2 5 5.5 5 9l-3 3H10l-3-3c0-3.5 1.5-7 5-9z"/><path d="M10 18c-1 1-1.5 3-1.5 3s2-.5 3-1.5M14 18c1 1 1.5 3 1.5 3s-2-.5-3-1.5"/><circle cx="12" cy="10" r="1.6"/>',
    'b-badge':  '<circle cx="12" cy="9" r="5.2"/><path d="m8.6 13.4-1.1 7 4.5-2.3 4.5 2.3-1.1-7"/>',
    'b-cube':   '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 3v18M4 7.5l8 4.5 8-4.5"/>',

    /* pita bawah */
    's-showcase': '<path d="M4 20h16M7 20v-6M12 20V8M17 20v-9"/><path d="M19 3.5c.3 2 1 2.7 3 3-2 .3-2.7 1-3 3-.3-2-1-2.7-3-3 2-.3 2.7-1 3-3z"/>',
    's-journey':  '<path d="M6 4c6 0 6 6 0 6s-6 6 0 6 6 4 12 4"/><circle cx="6" cy="4" r="1.6"/><circle cx="18" cy="20" r="1.6"/>',
    's-network':  '<circle cx="12" cy="7" r="2.6"/><circle cx="5" cy="17" r="2.6"/><circle cx="19" cy="17" r="2.6"/><path d="M10 8.8 6.6 14.6M14 8.8l3.4 5.8M7.6 17h8.8"/>',
    's-impact':   '<path d="M12 3c3.5 2 5 5.5 5 9l-3 3H10l-3-3c0-3.5 1.5-7 5-9z"/><path d="M10 18c-1 1-1.5 3-1.5 3s2-.5 3-1.5M14 18c1 1 1.5 3 1.5 3s-2-.5-3-1.5"/>'
  };

  /* Ikon yang dicat penuh, bukan digores. */
  var padat = {
    'bolt':     '<path d="M13.2 2 4.5 13.4h5.4L10.3 22l8.7-11.4h-5.4z"/>',
    'spark4':   '<path d="M12 1.6c.9 5.6 2.9 8.3 8.6 9.2v2.4c-5.7.9-7.7 3.6-8.6 9.2-.9-5.6-2.9-8.3-8.6-9.2v-2.4c5.7-.9 7.7-3.6 8.6-9.2z"/>',
    'verified': '<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m7.6 12.3 3 3 5.8-6.2" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  };

  var bagian = [];
  Object.keys(ikon).forEach(function (k) {
    bagian.push('<g id="ps-' + k + '" ' + S + '>' + ikon[k] + '</g>');
  });
  Object.keys(padat).forEach(function (k) {
    bagian.push('<g id="ps-' + k + '" fill="currentColor" stroke="none">' + padat[k] + '</g>');
  });

  /* Segi enam lencana. Dipisah karena dicat maupun digores, tergantung kelas. */
  bagian.push('<g id="ps-hex"><path d="M23 1.6 43.2 13v22.8L23 47.2 2.8 35.8V13z"/></g>');

  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.innerHTML = '<defs>' + bagian.join('') + '</defs>';

  function pasang() { document.body.insertBefore(svg, document.body.firstChild); }
  if (document.body) pasang();
  else document.addEventListener('DOMContentLoaded', pasang);
})();
