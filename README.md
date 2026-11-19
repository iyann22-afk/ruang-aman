# 🛡️ RUANGAMAN — Safe Space Digital Perlindungan & Konseling Siswa

[![Full-Stack](https://img.shields.io/badge/Platform-Full--Stack%20Web-0F9F91.svg)](#)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%20%2B%20Tailwind%204-sky.svg)](frontend/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express%20%2B%20TypeScript-blue.svg)](backend/)
[![Tests](https://img.shields.io/badge/Tests-18%20Passed-emerald.svg)](backend/tests/)
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
*Menjalankan 18 automated integration tests Vitest + Supertest pada backend.*

### 5. Membangun Bundle Produksi (Build)
```bash
npm run build
```
*Mengompilasi TypeScript backend dan mem-bundling Vite React frontend tanpa error.*

---

## 🔑 KREDENSIAL DEMO ADMIN (MINGGU 2)

Gunakan kredensial berikut untuk masuk ke Portal Petugas di `/admin/login`:

| Email Akun | Password Demo | Role Wewenang |
|---|---|---|
| `admin@ruangaman.id` | `PasswordDemo123!` | `super_admin` |
| `casemanager@ruangaman.id` | `PasswordDemo123!` | `case_manager` |
| `counselor@ruangaman.id` | `PasswordDemo123!` | `counselor` (Guru BK) |

*Tersedia tombol pintas (autofill) akun demo langsung pada halaman login admin.*

---

## 📋 DAFTAR SITEMAP & ROUTE

### Pengguna Umum
- `/` — Beranda (Hero Banner Lottie, 4 Kartu VanillaTilt, Cara Kerja, Panduan Privasi)
- `/tentang` — Profil RUANGAMAN, Latar Belakang Permendikbud, Visi Misi, Layanan
- `/lapor` — Wizard Pelaporan Bertahap, Mode Anonim/Identitas, Preview Bukti, Kode Lacak
- `/lacak` — Pelacakan Progres Laporan dengan Kode Unik, Timeline Kasus Publik
- `/edukasi` — Mini LMS Edukasi Bullying, Pencarian & Filter Kategori, Reader Modal
- `/pendampingan` — Reservasi Konseling Guru BK (Data Simulasi), Direktori Hotline Krisis

### Panel Petugas Admin
- `/admin/login` — Autentikasi Demo Petugas Satgas & BK
- `/admin/dashboard` — Agregasi Metrik, Distribusi Kategori, Tabel Kasus Terbaru
- `/admin/laporan` — Manajemen Tabel Laporan, Pencarian, Filter Status & Identitas
- `/admin/laporan/:id` — Detail Lengkap Kasus, Kronologi, Bukti, Form Perubahan Status
- `/admin/riwayat-status` — Audit Trail Log Mutasi Status Kasus
- `/admin/profil` — Profil Admin, Hak Akses Wewenang, Status Akun

---

## 🗺️ ROADMAP MINGGU 3 (INTEGRASI SUPABASE)

Pada Minggu 3, aplikasi akan ditingkatkan dengan:
1. Menghubungkan project Supabase PostgreSQL dan menjalankan `database/migrations/0001_initial_schema.sql`.
2. Menjalankan `database/seed.sql`.
3. Mengganti `MockReportRepository`, `MockCounselingRepository`, `MockEducationRepository`, dan `MockAdminRepository` dengan class implementasi Supabase Repository menggunakan `@supabase/supabase-js`.
4. Mengaktifkan Supabase Auth dan Row Level Security (RLS) pada 9 tabel relasional.
5. Mengintegrasikan Supabase Storage Private Bucket `report-evidence-private` dengan presigned URL berbatas waktu untuk file bukti laporan.
