# 🛡️ RUANGAMAN — Safe Space Digital Perlindungan & Konseling Siswa

[![Full-Stack](https://img.shields.io/badge/Platform-Full--Stack%20Web-0F9F91.svg)](#)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%20%2B%20Tailwind%204-sky.svg)](frontend/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express%20%2B%20TypeScript-blue.svg)](backend/)
[![Tests](https://img.shields.io/badge/Tests-150%20Passed-emerald.svg)](backend/tests/)
[![License](https://img.shields.io/badge/License-MIT-slate.svg)](#)

> **RUANGAMAN** adalah platform pelaporan dan pendampingan terpadu untuk menangani kasus perundungan (*bullying*) dan kekerasan di lingkungan pendidikan (sekolah dan madrasah) berbasis web. Didesain secara empatik, aman, dan mematuhi Permendikbudristek No. 46 Tahun 2023.

---

## 🌟 FITUR UTAMA SISTEM

### 1. Pengguna Umum (Siswa, Saksi, Orang Tua)
- **Pelaporan Cepat (100% Anonim atau Teridentifikasi):** Formulir wizard interaktif dengan pilihan samaran identitas dan unggah lampiran bukti (JPG, PNG, WEBP, PDF maks 5 MB).
- **Zero-Authentication Tracking:** Pelacakan progres kasus secara transparan hanya dengan kode unik pelacakan acak ber-entropi tinggi (`RA-YYYY-XXXXXX`) tanpa perlu login atau membuka identitas pelapor.
- **Pusat Edukasi Anti-Perundungan (LMS Mini):** Modul edukasi definisi, jenis cyberbullying, dampak kesehatan mental, dan panduan menjadi *upstander*.
- **Jadwal Konseling Guru BK:** Pemilihan slot waktu tatap muka atau daring dengan Guru BK sekolah serta nomor darurat hotline 24 Jam (SAPA 129 & TEPSA 1500771).

### 2. Panel Petugas Internal (Satgas Anti-Kekerasan & Guru BK)
- **Dashboard Ringkasan Eksekutif:** Statistik total kasus, laporan baru, telaah aktif, rujukan konseling, dan diagram distribusi kategori perundungan.
- **Manajemen Kasus Komprehensif:** Akses kronologi lengkap dan bukti dokumen bagi petugas berwenang.
- **Pemisahan Catatan Publik & Internal:** Petugas dapat mengirim pesan progres transparan kepada korban sekaligus mencatat catatan sensitif internal tim yang dijamin tidak bocor ke publik.
- **Audit Trail Imutabel:** Riwayat perubahan status kasus dicatat secara otomatis untuk akuntabilitas SOP penanganan.

---

## 🧱 ARSITEKTUR REPOSITORY

Aplikasi mengadopsi struktur monorepo dengan pemisahan tegas antara frontend dan backend:

```text
RUANGAMAN/
├── frontend/               # Single Page Application (React + Vite + Tailwind 4)
│   ├── public/             # Asset statis, favicon shield, animasi
│   ├── src/
│   │   ├── app/            # App router & root
│   │   ├── components/     # Reusable components (animations, cards, feedback, layout)
│   │   ├── layouts/        # PublicLayout & AdminLayout
│   │   ├── pages/          # 6 Halaman Publik & 6 Halaman Admin
│   │   ├── services/       # apiClient.ts (Komunikasi HTTP REST)
│   │   ├── styles/         # Animated CSS Mesh Gradient & Glassmorphism (Tailwind 4)
│   │   └── types/          # TypeScript domain contracts
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                # REST API Service (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/         # Environment & CORS configuration
│   │   ├── controllers/    # Express controllers
│   │   ├── services/       # Business logic services
│   │   ├── repositories/   # Service-Repository Pattern (Mock Week 2 -> Supabase Week 3)
│   │   │   ├── interfaces/ # IReportRepository, ICounselingRepository, dll
│   │   │   └── mock/       # In-Memory State Mock Repository
│   │   ├── middleware/     # Auth, Zod Validation, Rate Limit, Upload, Error Handler
│   │   ├── validators/     # Zod Schemas
│   │   ├── utils/          # High-Entropy Code Generator, Privacy Logger
│   │   ├── app.ts          # Express App factory
│   │   └── server.ts       # Local development runner (Port 4000)
│   ├── tests/              # 18 Test Suites (Vitest + Supertest)
│   ├── package.json
│   └── tsconfig.json
│
├── database/               # Artefak Desain Basis Data
│   ├── erd/
│   │   └── ERD-RUANGAMAN.drawio  # Valid XML diagrams.net ERD (9 Entitas & Relasi)
│   ├── migrations/
│   │   └── 0001_initial_schema.sql # DDL PostgreSQL / Supabase
│   ├── seed.sql            # Seed data demo realistis sekolah Indonesia
│   ├── ERD.md              # Kamus data & skema relasional
│   └── DATABASE-DESIGN.md  # Dokumen arsitektur, RLS, dan PII security
│
├── docs/                   # Dokumentasi Resmi Proyek
│   ├── WEEK-1-BASELINE.md  # Landasan sitemap & user flow Minggu 1
│   ├── WEEK-2-IMPLEMENTATION.md # Laporan komprehensif implementasi Minggu 2
│   ├── API-CONTRACT.md     # Spesifikasi seluruh endpoint REST API
│   └── DEPLOYMENT.md       # Panduan dual-project Vercel deployment
│
├── package.json            # Root orchestrator (concurrently)
├── .gitignore
└── README.md
```

---

## 🎨 IDENTITAS VISUAL & UI/UX

- **Soft Blue (`#E0F2FE`)**: Ketenangan dan penerimaan emosional.
- **Calm Teal (`#CCFBF1`)**: Kesembuhan mental dan keselamatan.
- **Pure White (`#FFFFFF`)**: Kebersihan, ruang bernapas visual (*white space*).
- **Deep Navy (`#17324D`)**: Teks utama, ketegasan etika hukum dan wibawa institusi.
- **Teal Accent (`#0F9F91`)**: Warna aksi (CTA button, link penting, hover state, indikator aktif).
- **Animated CSS Mesh Gradient:** Latar belakang dinamis lembut dengan radial gradient bergerak tanpa mengganggu keterbacaan teks.
- **Glassmorphism:** Panel dengan `backdrop-blur-md`, border transparan putih halus, dan drop shadow lembut.
- **VanillaTilt.js:** Efek 3D tilt lembut (6–8 derajat) pada 4 kartu utama Beranda dengan lifecycle cleanup.
- **tsParticles:** Partikel melayang lembut yang menghormati preferensi `prefers-reduced-motion`.
- **LottieFiles (`<dotlottie-wc>`):** Animasi sambutan bertema perlindungan dan kepedulian dengan fallback SVG otomatis.

---

## 🚀 PANDUAN MENJALANKAN SECARA LOKAL

### 1. Prasyarat
- Node.js versi 18+ (Disarankan Node.js v20+)
- npm versi 9+

### 2. Instalasi Seluruh Dependensi Sekaligus
Jalankan perintah ini di root folder:
```bash
npm run install:all
```
*Perintah ini akan menginstal dependensi di root, frontend, dan backend.*

### 3. Menjalankan Frontend & Backend Bersamaan
```bash
npm run dev
```
Aplikasi akan aktif secara bersamaan:
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:4000](http://localhost:4000)
- **API Health Check:** [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)

### 4. Menjalankan Pengujian (Testing)
```bash
npm test
```
*Menjalankan 150 automated security and integration tests Vitest + Supertest pada backend (100% lulus).*

### 5. Membangun Bundle Produksi (Build)
```bash
npm run build
```
*Mengompilasi TypeScript backend dan mem-bundling Vite React frontend tanpa error.*

---

## 🔑 MANAJEMEN PETUGAS & AUTENTIKASI (MINGGU 3)

RUANGAMAN mengadopsi mekanisme autentikasi terpadu berbasis Google OAuth dan Supabase Auth dengan penegakan peran berbasis RBAC:

- **Pendaftaran Petugas:** Hanya `super_admin` yang berwenang mendaftarkan akun petugas melalui panel Manajemen Petugas (`/admin/petugas`).
- **Google OAuth Login:** Petugas masuk menggunakan akun Google yang emailnya telah terdaftar resmi oleh Super Admin.
- **Role & Wewenang:**
  - `super_admin`: Pengelola utama sistem, manajemen petugas, dashboard ringkasan, audit trail, penugasan kasus, dan konseling.
  - `case_manager`: Pengelolaan penanganan laporan, penugasan kasus ke Guru BK, pemantauan status kasus, dan jadwal konseling.
  - `counselor` (Guru BK): Akses khusus untuk kasus yang ditugaskan ke dirinya, perbaruan status penanganan konseling, dan pengelolaan jadwal konseling mandiri.
- **Keamanan Sesi:**
  - Idle timeout 15 menit dengan dialog peringatan aktivitas.
  - Touch session atomik via RPC PostgreSQL.
  - Single active session per device dengan session revocation atomik.

---

## 📋 DAFTAR SITEMAP & ROUTE

### Pengguna Umum
- `/` — Beranda (Hero Banner Lottie, 4 Kartu VanillaTilt, Cara Kerja, Panduan Privasi)
- `/tentang` — Profil RUANGAMAN, Latar Belakang Permendikbud, Visi Misi, Layanan
- `/lapor` — Wizard Pelaporan Bertahap, Mode Anonim/Identitas, Upload Bukti Private Storage, Kode Lacak Kriptografis
- `/lacak` — Pelacakan Kasus Real-Time via Kode Unik (`RA-YYYY-XXXXXX`), Timeline Status Publik
- `/edukasi` — Mini LMS Edukasi Bullying, Pencarian & Filter Kategori, Reader Modal Artikel
- `/pendampingan` — Reservasi Sesi Konseling Guru BK, Direktori Kontak Krisis 24 Jam (SAPA 129 & TEPSA 1500771)

### Panel Petugas Admin
- `/admin/login` — Autentikasi Google OAuth Petugas Satgas & Guru BK
- `/admin/dashboard` — Agregasi Metrik, Distribusi Kategori, Tabel Kasus Terkait
- `/admin/laporan` — Manajemen Laporan, Penugasan Guru BK, Pencarian, Filter Status & Identitas
- `/admin/laporan/:id` — Detail Lengkap Kasus, Penugasan Guru BK, Bukti Signed URL, Form Perubahan Status
- `/admin/jadwal-konseling` — Manajemen Slot Waktu Konseling Daring/Luring
- `/admin/riwayat-status` — Audit Trail Log Mutasi Status Kasus
- `/admin/petugas` — Manajemen Akun Petugas Satgas & Guru BK (Super Admin Only)
- `/admin/profil` — Profil Petugas, Hak Akses Wewenang, Status Akun
