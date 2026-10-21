/* ===========================================================
   Catalyst Society - konfigurasi Supabase + util bersama

   Kredensial di bawah ditanam oleh scripts/set-supabase-env.mjs
   dari supabase.config.json. Jangan disunting tangan.

   Klien dibuat dengan createBrowserClient dari @supabase/ssr,
   persis seperti aplikasi Passport di /bp. Keduanya menyimpan
   sesi di cookie dengan nama yang sama, sehingga sekali masuk
   di halaman ini, Passport langsung mengenali penggunanya.
   =========================================================== */
window.CATALYST_CONFIG = {
  SUPABASE_URL: 'https://ydhoxefcntwayjkslzje.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkaG94ZWZjbnR3YXlqa3NsemplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NzcxNzAsImV4cCI6MjEwODE1MzE3MH0.1zk_GLhrkzvE6kVdA39PU8k-RoJ_gqHXXPYNpzFVo8c'
};

(function () {
  var cfg = window.CATALYST_CONFIG;
  var siap = /^https:\/\/[^\s/]+$/.test(cfg.SUPABASE_URL) && cfg.SUPABASE_ANON_KEY.length > 20;

  /* Versi dikunci agar sama dengan yang dipakai bundel Passport,
     supaya format cookie sesi selalu cocok di kedua sisi. */
  var SSR = 'https://cdn.jsdelivr.net/npm/@supabase/ssr@0.12.7/+esm';

  var menunggu = null;

  window.CATALYST = {
    siap: siap,
    db: null,

    /* Memuat klien sekali saja, lalu memakai ulang hasilnya. */
    siapkan: function () {
      if (!siap) return Promise.resolve(null);
      if (!menunggu) {
        var diri = this;
        menunggu = import(SSR).then(function (m) {
          diri.db = m.createBrowserClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
          return diri.db;
        });
      }
      return menunggu;
    },

    CHANNEL: {
      investments:   { label: 'Investments',    sub: 'Finance & Investments' },
      ai_technology: { label: 'AI & Technology', sub: 'AI & Technology' },
      business:      { label: 'Business',        sub: 'Businessman & Entrepreneur' },
      builders:      { label: 'Builders',        sub: 'Developer & Builder' },
      social_impact: { label: 'Social Impact',   sub: 'Sustainability & Social Impact' }
    },

    JOURNEY: ['explorer', 'connector', 'builder', 'challenger', 'contributor', 'innovator'],

    /* Pengalihan halaman berdasarkan status sesi */
    async wajibLogin() {
      var db = await this.siapkan();
      if (!db) { location.href = 'login.html?perlu=konfigurasi'; return null; }
      var { data } = await db.auth.getSession();
      if (!data.session) { location.href = 'login.html'; return null; }
      return data.session.user;
    },

    async keluar() {
      var db = await this.siapkan();
      if (db) await db.auth.signOut();
      location.href = 'index.html';
    },

    /* Format angka ala Indonesia */
    /* Bahasa aktif dibaca dari PI18N kalau dimuat, jadi angka dan tanggal ikut berganti. */
    locale() { return window.PI18N ? window.PI18N.locale() : 'id-ID'; },

    angka(n) {
      return new Intl.NumberFormat(this.locale()).format(n || 0);
    },

    tanggal(iso) {
      if (!iso) return '';
      return new Date(iso).toLocaleDateString(this.locale(), { day: 'numeric', month: 'short', year: 'numeric' });
    },

    /* Inisial nama untuk avatar cadangan */
    inisial(nama) {
      return (nama || '?').trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
    }
  };
})();
