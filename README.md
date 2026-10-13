# E-Tamu

Sistem Buku Tamu Digital untuk Pengadilan Militer Utama. Aplikasi ini menyediakan registrasi pengunjung berbasis web, panel administrasi lengkap, dan tampilan layar TV untuk monitoring real-time di resepsionis.

## Fitur Utama

### Halaman Publik
- **Registrasi Pengunjung** (`/pengunjung`)
  - Formulir pendaftaran dengan validasi input
  - Autocomplete pencarian pegawai tujuan
  - Pilihan keperluan kunjungan (8 kategori standar + lainnya)
  - Tanggal dan waktu otomatis (real-time)
  - Notifikasi toast saat registrasi berhasil
  - Background gambar dapat dikustomisasi via pengaturan admin

- **Beranda** (`/`)
  - Hero section dengan jam digital dan statistik pengunjung hari ini (real-time via Supabase Realtime)
  - Gambar background dapat diganti melalui panel admin
  - Deskripsi singkat sistem dan CTA ke halaman registrasi

### Panel Administrasi (`/admin`) — Akses Terbatas Admin
Autentikasi berbasis Supabase Auth dengan role `admin` dan `staff`. Super Admin memiliki akses manajemen pengguna.

- **Dasbor**
  - Ringkasan statistik: hari ini, minggu ini, bulan ini
  - Grafik tren kunjungan: Harian (5 hari kerja), Mingguan (8 minggu), Bulanan (6 bulan)
  - Tabel pengunjung terbaru dengan pagination, filter (tujuan, rentang tanggal), dan **pencarian global server-side** (PostgreSQL full-text search, debounce 300ms)
  - Aksi: Edit, Hapus (dengan logging aktivitas)
  - Ekspor data: CSV, Excel (.xlsx), PDF — mendukung filter periode (semua, rentang, bulanan, tahunan)

- **Data Pegawai**
  - CRUD pegawai (nama, pangkat, jabatan)
  - Pengurutan via tombol panah (disimpan ke `sort_order`)
  - Pagination
  - **Pencarian global server-side** memfilter nama, pangkat, jabatan via RPC `search_global`

- **Kelola Admin** (hanya Super Admin)
  - Tambah admin baru via RPC `admin_create_user`
  - Ubah peran Admin ↔ Staff via RPC `admin_update_role`
  - Reset kata sandi paksa (flag `must_change_password`) via RPC `admin_reset_password`
  - **Pencarian global server-side** memfilter nama, email, peran via RPC `search_global`

- **Log Aktivitas**
  - Riwayat edit/hapus kunjungan dengan detail (admin, aksi, target, waktu)
  - Filter "Hanya aktivitas saya"
  - Pagination
  - **Pencarian global server-side** memfilter admin, aksi, target, detail via RPC `search_global`

- **Pengaturan Tampilan**
  - Upload gambar: Background Beranda, Background Registrasi, Logo, Favicon
  - Penyimpanan ke Supabase Storage bucket `site-assets`
  - Hapus otomatis file lama saat upload baru
  - Validasi tipe file (image) dan ukuran maksimal 5 MB

- **Profil Admin** (`/admin/profile`)
  - Informasi akun (nama, email, peran, status Super Admin)
  - Ganti kata sandi (wajib untuk akun baru dengan `force=1`)

### Tampilan TV Resepsionis (`/tv`)
- Layar monitoring real-time untuk 4 terminal resepsionis
- Jam digital dan tanggal lengkap
- Daftar 12 pengunjung terbaru dengan foto inisial, host/departemen, waktu kedatangan
- Statistik pengunjung hari ini (angka besar)
- Ticker pengumuman bergerak
- Indikator status terminal online
- Update otomatis via Supabase Realtime

### Keamanan & Otentikasi
- Supabase Auth (email/password, PKCE flow)
- Custom storage per-tab (isolasi sesi multi-tab)
- Row Level Security (RLS) di database
- Proteksi rute via `ProtectedRoute` component
- Enforced password change untuk akun baru
- Activity logging untuk audit trail

### Ekspor Data
- **CSV** via `xlsx` (sheet_to_csv)
- **Excel** via `exceljs` (styled worksheet, auto-fit column, border)
- **PDF** via `jsPDF` + `jspdf-autotable` (landscape, header berwarna)

## Cara Instalasi dan Menjalankan Proyek

### Prasyarat
- Node.js >= 18
- npm >= 9
- Proyek Supabase (URL dan Anon Key)

### Langkah Instalasi

1. **Clone repositori**
   ```bash
   git clone <repository-url>
   cd E-Tamu
   ```

2. **Install dependensi**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**
   Buat file `.env` di root proyek:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Setup Database (Supabase)**
     - Jalankan migrasi di folder `supabase/migrations/` berurutan (0001_init.sql sampai 0031_admin_visits_page_rpc.sql)
     - Sudah pernah sampai 0026? Cukup jalankan sekali file gabungan `supabase/pending_0028-0031.sql` (gabungan 0028–0031, idempotent)
     - Jika fitur Edit Data Kunjungan gagal disimpan dengan pesan `row-level security`, jalankan ulang `0027_fix_visitors_update_policy.sql` (script aman diulang)
     - `0028_lock_site_assets_storage.sql` wajib: tanpa itu siapa pun bisa mengunggah/menghapus aset (logo, background, favicon)
     - `0029_visit_stats_rpc.sql` wajib: tanpa itu grafik dasbor kosong
     - `0030_create_visit_rpc.sql` wajib: registrasi pengunjung memakai RPC `create_visit`; policy insert publik sudah dihapus
     - `0031_admin_visits_page_rpc.sql` wajib: tabel dasbor (filter, pencarian, paginasi, kartu ringkasan) memakai RPC `admin_visits_page`
     - Bucket Storage `site-assets` harus public (hanya read publik, tulis/hapus admin)
     - Aktifkan Realtime pada tabel `visits` dan `activity_logs`

5. **Jalankan Development Server**
   ```bash
   npm run dev
   ```
   Aplikasi tersedia di `http://localhost:5173`

6. **Build Production**
   ```bash
   npm run build
   ```
   Output di folder `dist/`, siap deploy ke Vercel, Netlify, atau static hosting lain.
   Route admin dimuat lewat `React.lazy`, jadi pengunjung umum tidak mengunduh
   bundel dasbor.

## Catatan Penting

- **Rute `/tv`** (tampilan TV resepsionis) berada di dalam `ProtectedRoute` dan
  memakai RPC `admin_visits_page` (butuh migration 0031), karena tabel `visits`
  hanya bisa dibaca oleh admin. TV harus dijaga dengan sesi admin yang sudah login.
- **Angka "Pengunjung Hari Ini" di beranda masih kosong** untuk pengunjung
  anon: `visits` dilindungi RLS admin-only sehingga `count` selalu 0. Jika
  ingin angka publik, tambahkan RPC agregat yang hanya mengembalikan jumlah
  (tanpa nama pengunjung) — belum disediakan demi menjaga privasi data.

## Struktur Folder

```
E-Tamu/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── ActivityLogTab.jsx     # Tab log aktivitas
│   │   │   ├── AdminSidebar.jsx       # Sidebar + navigasi tab
│   │   │   ├── AdminTopbar.jsx        # Topbar + pencarian global
│   │   │   ├── AdminsTab.jsx          # Tab kelola admin + reset password
│   │   │   ├── DashboardTab.jsx       # Komposisi tab dasbor
│   │   │   ├── EditEmployeeModal.jsx  # Modal edit pegawai
│   │   │   ├── EditVisitModal.jsx     # Modal edit kunjungan
│   │   │   ├── EmployeesTab.jsx       # Tab data pegawai
│   │   │   ├── ExportToolbar.jsx      # Toolbar export CSV/Excel/PDF
│   │   │   ├── SettingsTab.jsx        # Tab pengaturan gambar situs
│   │   │   ├── SummaryCards.jsx       # Kartu ringkasan kunjungan
│   │   │   ├── VisitChart.jsx         # Grafik harian/mingguan/bulanan
│   │   │   └── VisitorsTable.jsx      # Tabel pengunjung + filter + paginasi
│   │   ├── FaviconManager.jsx      # Dynamic favicon dari site_settings
│   │   ├── Footer.jsx              # Footer publik
│   │   ├── Hero.jsx                # Hero section beranda
│   │   ├── Icon.jsx                # Wrapper Material Symbols
│   │   ├── ProtectedRoute.jsx      # Guard rute admin
│   │   └── SiteNavBar.jsx          # Navbar publik
│   ├── context/
│   │   ├── AuthContext.jsx         # Provider auth (session, profile, role)
│   │   └── SiteSettingsContext.jsx  # Provider site settings (1 request + 1 channel)
│   ├── lib/
│   │   ├── activityLog.js          # Insert ke activity_logs
│   │   ├── export.js               # CSV/Excel/PDF export (code-split)
│   │   ├── supabase.js             # Supabase client + custom storage
│   │   └── visitFormat.js          # Label keperluan + format tanggal/waktu
│   ├── pages/
│   │   ├── AdminDashboard.jsx      # Panel admin (logika data; JSX per tab di components/admin)
│   │   ├── AdminLogin.jsx          # Login admin
│   │   ├── AdminProfile.jsx        # Profil & ganti password
│   │   ├── RegistrationForm.jsx    # Form registrasi pengunjung
│   │   └── TvDisplay.jsx           # Tampilan TV resepsionis (rute /tv)
│   ├── App.jsx                     # Routing + layout
│   ├── index.css                   # Tailwind + custom theme (CSS variables)
│   └── main.jsx                    # Entry point
├── supabase/
│   ├── functions/
│   │   └── invite-admin/           # Edge Function invite admin (opsional)
│   └── migrations/                 # 31 file migrasi SQL (0001_init.sql sampai 0031_admin_visits_page_rpc.sql)
├── .env                            # Environment variables (tidak di-commit)
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json                     # Konfigurasi deploy Vercel
└── vite.config.js
```

## Teknologi yang Digunakan

### Frontend
- **React 18** — UI library (functional components, hooks)
- **React Router DOM v7** — Client-side routing
- **Vite 5** — Build tool & dev server
- **Tailwind CSS 3** — Utility-first styling dengan custom design tokens (CSS variables)
- **Material Symbols** — Icon font (via CDN di index.html)

### Backend & Database (Supabase)
- **@supabase/supabase-js v2** — Client library
- **PostgreSQL** — Database relasional
- **Row Level Security (RLS)** — Otorisasi level baris
- **Supabase Auth** — Autentikasi email/password
- **Supabase Realtime** — Subscription perubahan data (WebSocket)
- **Supabase Storage** — Upload gambar (bucket `site-assets`)
- **PostgreSQL Functions (RPC)** — `register_visitor`, `admin_create_user`, `admin_update_role`, `admin_reset_password`, `search_global` (full-text search)

### Ekspor & Utilitas
- **exceljs** — Generate Excel (.xlsx) dengan styling
- **xlsx (SheetJS)** — Generate CSV
- **jsPDF + jspdf-autotable** — Generate PDF landscape
- **Dynamic Import** — Code-splitting library export (load on demand)

### Deployment
- **Vercel** (via `vercel.json`) — Static hosting + SPA fallback
- **Environment Variables** — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Skema Database Utama

| Tabel | Deskripsi |
|-------|-----------|
| `visitors` | Data pengunjung (id, full_name, phone, organization, photo_url) |
| `visits` | Riwayat kunjungan (id, visitor_id, employee_id, purpose, remarks, status, check_in_at, check_out_at, qr_code, destination_text) |
| `employees` | Daftar pegawai tujuan (id, full_name, rank, position, sort_order) |
| `profiles` | Profil user/admin (id, full_name, email, role, is_super_admin, must_change_password, avatar_url) |
| `activity_logs` | Audit trail (admin_id, admin_name, action, target_type, target_id, target_name, detail, created_at) |
| `site_settings` | Konfigurasi tampilan (hero_bg_url, form_bg_url, logo_url, favicon_url, updated_at) |

## Peran Pengguna

| Peran | Akses |
|-------|-------|
| **Super Admin** | Semua fitur admin + Kelola Admin (tambah, ubah role, reset password) |
| **Admin** | Dasbor, Data Pegawai, Log Aktivitas, Pengaturan, Profil |
| **Staff** | Sama dengan Admin tapi tidak bisa akses Kelola Admin |

## Catatan Pengembangan

- **State Management**: React hooks (`useState`, `useEffect`, `useMemo`, `useRef`, `useCallback`) — tanpa library eksternal (Redux, Zustand)
- **Styling**: Tailwind dengan CSS variables untuk theming (light/dark ready via `color-scheme`)
- **Realtime**: Dua channel terpisah (`visits-changes` untuk admin, `tv-visits` untuk TV, `hero-visits` untuk beranda)
- **Code Splitting**: Library export di-load lazy saat tombol ekspor diklik
- **Storage Isolation**: Custom storage key per tab (`e-tamu-tab-id`) mencegah konflik session multi-tab
- **Error Handling**: Try-catch dengan detail error (code, details, hint) ditampilkan ke user
- **Pencarian Global Server-Side**: 
  - Debounce 300ms pada input header → memanggil RPC `search_global(query, tab, limit, offset)`
  - PostgreSQL full-text search dengan `to_tsvector('indonesian', ...)` + `plainto_tsquery` + `ts_rank_cd` untuk relevance ranking
  - Union hasil dari 4 tabel: `visits`, `employees`, `profiles` (admin), `activity_logs`
  - Loading spinner di UI saat fetching; auto-clear hasil saat ganti tab
  - Fallback ke filter lokal (client-side) untuk filter non-teks (tujuan, tanggal)

## Lisensi

Proyek internal Pengadilan Militer Utama. Hak cipta dilindungi.