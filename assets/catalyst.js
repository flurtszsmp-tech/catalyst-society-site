/* ===========================================================
   Catalyst Society - konfigurasi Supabase + util bersama
   Isi dua nilai di bawah dengan kredensial project Supabase.
   Ambil di: Supabase Dashboard > Project Settings > API
   =========================================================== */
window.CATALYST_CONFIG = {
  SUPABASE_URL: 'ISI_URL_SUPABASE',        // contoh: https://abcdefgh.supabase.co
  SUPABASE_ANON_KEY: 'ISI_ANON_KEY'        // kunci publik anon, aman dipakai di browser
};

(function () {
  var cfg = window.CATALYST_CONFIG;
  var siap = cfg.SUPABASE_URL.indexOf('http') === 0 && cfg.SUPABASE_ANON_KEY.length > 20;

  window.CATALYST = {
    siap: siap,
    db: siap && window.supabase
      ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
      : null,

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
      if (!this.db) { location.href = 'login.html?perlu=konfigurasi'; return null; }
      var { data } = await this.db.auth.getSession();
      if (!data.session) { location.href = 'login.html'; return null; }
      return data.session.user;
    },

    async keluar() {
      if (this.db) await this.db.auth.signOut();
      location.href = 'index.html';
    },

    /* Akun demo untuk presentasi, dipakai hanya selama Supabase belum diisi.
       Kredensialnya terlihat di sumber halaman, jadi JANGAN dipakai untuk akun
       asli. Hapus blok demo ini begitu Supabase produksi menyala. */
    DEMO_AKUN: { username: 'Bagas ceo', sandi: 'ceo123' },

    demoAktif() {
      try { return localStorage.getItem('catalyst-demo-sesi') === '1'; } catch (e) { return false; }
    },

    demoMasuk(username, sandi) {
      var a = this.DEMO_AKUN;
      var cocok = String(username).trim().toLowerCase() === a.username.toLowerCase() && sandi === a.sandi;
      if (cocok) { try { localStorage.setItem('catalyst-demo-sesi', '1'); } catch (e) {} }
      return cocok;
    },

    demoKeluar() {
      try { localStorage.removeItem('catalyst-demo-sesi'); } catch (e) {}
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
