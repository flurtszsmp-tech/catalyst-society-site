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

    /* Format angka ala Indonesia */
    angka(n) {
      return new Intl.NumberFormat('id-ID').format(n || 0);
    },

    tanggal(iso) {
      if (!iso) return '';
      return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    },

    /* Inisial nama untuk avatar cadangan */
    inisial(nama) {
      return (nama || '?').trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
    }
  };
})();
