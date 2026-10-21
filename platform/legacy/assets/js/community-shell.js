/* ===========================================================
   Catalyst Society. Rangka halaman untuk communities.html dan
   community.html: bilah navigasi, ganti tema, menu burger, kemunculan.

   Perilakunya disalin dari index.html supaya kedua halaman ini terasa
   sama, hanya tanpa bagian yang khusus halaman utama (Lenis, kursor
   kustom, diagram orbit, pembalik kaca .di-gelap). Halaman komunitas
   tidak punya pita gelap, jadi .di-gelap tidak pernah dipakai di sini.
   =========================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var rm = matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---------- ganti tema ----------
     Sama seperti di index.html: tema menyebar dari titik tombol memakai
     View Transitions, dan langsung berganti kalau browser tidak mendukung
     atau hemat gerak sedang aktif. */
  function tukarTema() {
    var on = root.classList.toggle('dark-theme');
    try { localStorage.setItem('catalyst-theme', on ? 'dark' : 'light'); } catch (e) {}
    document.querySelectorAll('.theme-toggle').forEach(function (b) {
      b.setAttribute('aria-pressed', on);
    });
  }

  document.querySelectorAll('.theme-toggle').forEach(function (btn) {
    btn.setAttribute('aria-pressed', root.classList.contains('dark-theme'));
    btn.addEventListener('click', function () {
      if (rm || !document.startViewTransition) { tukarTema(); return; }
      var r = btn.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var jauh = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
      var vt = document.startViewTransition(tukarTema);
      /* Ketiga promise menolak bila transisi dibatalkan. Ditangkap diam diam
         supaya tidak bocor jadi rejection di konsol. */
      vt.updateCallbackDone.catch(function () {});
      vt.finished.catch(function () {});
      vt.ready.then(function () {
        root.animate(
          { clipPath: [
            'circle(0px at ' + cx + 'px ' + cy + 'px)',
            'circle(' + jauh + 'px at ' + cx + 'px ' + cy + 'px)'
          ] },
          { duration: 640, easing: 'cubic-bezier(.16,1,.3,1)',
            pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(function () {});
    });
  });

  /* ---------- keadaan bilah saat digulir ---------- */
  var nav = document.querySelector('.nav');
  function perbaruiGulir() {
    if (nav) nav.classList.toggle('scrolled', scrollY > 40);
  }
  addEventListener('scroll', perbaruiGulir, { passive: true });
  perbaruiGulir();

  /* ---------- menu burger ---------- */
  var burger = document.querySelector('.burger');
  var menu = document.querySelector('.nav-menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      menu.classList.toggle('open');
      body.classList.toggle('locked', menu.classList.contains('open'));
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        menu.classList.remove('open');
        body.classList.remove('locked');
      });
    });
  }

  /* ---------- kemunculan ----------
     Elemen bertanda .rv atau .stagger memperoleh .in begitu masuk layar.
     Kartu komunitas dirender setelah skrip ini berjalan, jadi pengamatnya
     dipasang ulang lewat window.amatiKemunculan(). */
  var pengamat = null;
  if ('IntersectionObserver' in window && !rm) {
    pengamat = new IntersectionObserver(function (entri) {
      entri.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        pengamat.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
  }

  window.amatiKemunculan = function (akar) {
    var target = (akar || document).querySelectorAll('.rv:not(.in),.stagger:not(.in)');
    if (!pengamat) {
      target.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    target.forEach(function (el) { pengamat.observe(el); });
  };

  /* Jaring pengaman, sama seperti di index.html. Isi halaman dimulai dari
     opacity:0 dan baru terbuka lewat pengamat. Kalau pengamatnya tidak
     pernah menyampaikan apa apa, misalnya tab dibuka di latar belakang dan
     browser menahan pengiriman, kepala halaman dan rail penyaring akan
     tinggal tak terlihat. Sesudah beberapa detik semuanya dibuka paksa. */
  setTimeout(function () {
    document.querySelectorAll('.rv:not(.in),.stagger:not(.in)').forEach(function (el) {
      el.classList.add('in');
    });
  }, 4000);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { window.amatiKemunculan(); });
  } else {
    window.amatiKemunculan();
  }
})();
