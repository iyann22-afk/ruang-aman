# DOKUMEN KONTRAK REST API (API CONTRACT)
## RUANGAMAN API v1

Dokumen ini merupakan spesifikasi antarmuka standar untuk komunikasi antara Frontend dan Backend RUANGAMAN.

---

## 1. ATURAN UMUM & STANDAR KOMUNIKASI

- **Base URL:** `http://localhost:4000/api/v1`
- **Content-Type:** `application/json` (Kecuali endpoint multipart untuk upload file bukti).
- **Format Respons Sukses:**
  ```json
  {
    "success": true,
    "message": "Deskripsi singkat operasi",
    "data": {}
  }
  ```
- **Format Respons Gagal:**
  ```json
  {
    "success": false,
    "message": "Pesan kesalahan yang mudah dipahami",
    "errors": [
      {
        "field": "category_id",
        "message": "Kategori laporan wajib dipilih"
      }
    ]
  }
  ```
- **Autentikasi Admin:**
  Header `Authorization: Bearer <TOKEN_DEMO>` pada setiap pemanggilan endpoint admin (kecuali `/admin/auth/login`).

---

## 2. HEALTH CHECK

### `GET /api/v1/health`
Menguji ketersediaan layanan backend.

**Respons Sukses (200 OK):**
```json
{
  "success": true,
  "message": "RUANGAMAN API is running",
  "version": "1.0.0"
}
```

---

## 3. PUBLIC API ENDPOINTS

### 3.1. `GET /api/v1/public/categories`
Mengambil daftar kategori perundungan/kekerasan aktif.

**Respons Sukses (200 OK):**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": "c0000001-0000-0000-0000-000000000001",
      "name": "Perundungan Fisik",
      "slug": "perundungan-fisik",
      "description": "Tindakan kekerasan fisik seperti memukul, menendang, mendorong...",
      "is_active": true
    }
  ]
}
```

---

### 3.2. `POST /api/v1/public/reports`
Mengirimkan laporan baru. Mendukung `application/json` atau `multipart/form-data` dengan lampiran file `evidence` (maks. 5MB, format: jpg, png, webp, pdf).

**Request Body (JSON atau FormData fields):**
```json
{
  "category_id": "c0000001-0000-0000-0000-000000000001",
  "incident_date": "2026-11-18",
  "incident_location": "Kantin Belakang Sekolah",
  "chronology": "Terjadi dorongan fisik dan pemalakan saat jam istirahat...",
  "identity_mode": "anonymous",
  "reporter_name": null,
  "reporter_contact": null,
  "privacy_acknowledged": true
}
```

**Respons Sukses (201 Created):**
```json
{
  "success": true,
  "message": "Laporan berhasil dikirim dan diamankan",
  "data": {
    "tracking_code": "RA-2026-X8K9M2",
    "status": "submitted",
    "created_at": "2026-11-19T10:15:30.000Z",
    "has_evidence": false
  }
}
```

---

### 3.3. `POST /api/v1/public/reports/track`
Melacak status laporan berdasarkan kode unik pelacakan.

**Request Body:**
```json
{
  "tracking_code": "RA-2026-X8K9M2"
}
```

**Respons Sukses (200 OK):**
```json
{
  "success": true,
  "message": "Laporan ditemukan",
  "data": {
    "tracking_code": "RA-2026-X8K9M2",
    "category_name": "Perundungan Fisik",
    "incident_date": "2026-11-18",
    "incident_location": "Kantin Belakang Sekolah",
    "status": "under_review",
    "created_at": "2026-11-19T10:15:30.000Z",
    "updated_at": "2026-11-19T11:00:00.000Z",
    "timeline": [
      {
        "status": "under_review",
        "created_at": "2026-11-19T11:00:00.000Z",
        "public_message": "Laporan telah ditelaah oleh tim Satgas Sekolah."
      },
      {
        "status": "submitted",
        "created_at": "2026-11-19T10:15:30.000Z",
        "public_message": "Laporan masuk ke antrean verifikasi sistem."
      }
    ]
  }
}
```
> **Aturan Keamanan:** `reporter_name`, `reporter_contact`, `chronology`, `internal_note`, dan tautan file bukti **tidak pernah** disertakan dalam endpoint ini.

---

### 3.4. `GET /api/v1/public/education`
Mengambil daftar artikel/materi pencegahan perundungan.

**Query Parameters:**
- `search` (opsional): kata kunci pencarian judul atau ringkasan
- `category` (opsional): filter kategori materi

**Respons Sukses (200 OK):**
```json
{
  "success": true,
  "message": "Education materials retrieved",
  "data": [
    {
      "id": "e0000001-0000-0000-0000-000000000001",
      "title": "Mengenal Definisi dan Unsur Utama Perundungan",
      "slug": "mengenal-perundungan",
      "category": "Pemahaman Dasar",
      "summary": "Perundungan bukan sekadar candaan biasa...",
      "reading_minutes": 4,
      "created_at": "2026-11-10T08:00:00.000Z"
    }
  ]
}
```

---

### 3.5. `GET /api/v1/public/education/:slug`
Mengambil detail lengkap satu materi edukasi.

**Respons Sukses (200 OK):**
```json
{
  "success": true,
  "message": "Article retrieved",
  "data": {
    "id": "e0000001-0000-0000-0000-000000000001",
    "title": "Mengenal Definisi dan Unsur Utama Perundungan",
    "slug": "mengenal-perundungan",
    "category": "Pemahaman Dasar",
    "summary": "Perundungan bukan sekadar candaan biasa...",
    "content": "Perundungan (bullying) adalah perilaku agresif berulang...",
    "reading_minutes": 4,
    "created_at": "2026-11-10T08:00:00.000Z"
  }
}
```

---

### 3.6. `GET /api/v1/public/support-resources`
Mengambil daftar lembaga pendampingan & hotline krisis.

**Respons Sukses (200 OK):**
```json
{
  "success": true,
  "message": "Support resources retrieved",
  "data": [
    {
      "id": "s0000001-0000-0000-0000-000000000001",
      "title": "Layanan Sahabat Perempuan & Anak (SAPA 129)",
      "resource_type": "hotline",
      "description": "Layanan pengaduan kekerasan KemenPPPA RI.",
      "contact_name": "KemenPPPA RI",
      "phone": "129",
      "website_url": "https://kemenpppa.go.id",
      "operating_hours": "24 Jam Setiap Hari",
      "location": "Nasional"
    }
  ]
}
```

---

### 3.7. `GET /api/v1/public/counseling-slots`
Mengambil jadwal sesi konseling Guru BK yang tersedia untuk booking.

**Respons Sukses (200 OK):**
```json
{
  "success": true,
  "message": "Counseling slots retrieved",
  "data": [
    {
      "id": "sl000001-0000-0000-0000-000000000001",
      "counselor_name": "Budi Santoso, S.Psi., M.Psi.",
      "start_at": "2026-11-20T09:00:00.000Z",
      "end_at": "2026-11-20T10:00:00.000Z",
      "session_mode": "offline",
      "location": "Ruang BK Lt. 2",
      "capacity": 1,
      "status": "available"
    }
  ]
}
```

---

### 3.8. `POST /api/v1/public/counseling-bookings`
Mengajukan reservasi jadwal konseling BK.

**Request Body:**
```json
{
  "slot_id": "sl000001-0000-0000-0000-000000000001",
  "student_name": "Siswa Simulasi",
  "contact_method": "whatsapp",
  "contact_value": "081298765432",
  "privacy_acknowledged": true
}
```

**Respons Sukses (201 Created):**
```json
{
  "success": true,
  "message": "Jadwal konseling berhasil diajukan (DATA SIMULASI)",
  "data": {
    "booking_code": "BK-2026-7Y2H1P",
    "student_name": "Siswa Simulasi",
    "session_mode": "offline",
    "start_at": "2026-11-20T09:00:00.000Z",
    "location": "Ruang BK Lt. 2",
    "booking_status": "confirmed"
  }
}
```

---

## 4. ADMIN API ENDPOINTS (PROTECTED)

### 4.1. `POST /api/v1/admin/auth/login`
Autentikasi petugas demo (Minggu 2).

**Request Body:**
```json
{
  "email": "admin@ruangaman.id",
  "password": "PasswordDemo123!"
}
```

**Respons Sukses (200 OK):**
```json
{
  "success": true,
  "message": "Login berhasil (Sesi Demo Minggu 2)",
  "data": {
    "token": "demo-token-super_admin-admin@ruangaman.id",
    "admin": {
      "id": "a0000001-0000-0000-0000-000000000001",
      "full_name": "Dra. Hj. Nurul Hidayati, M.Pd.",
      "email": "admin@ruangaman.id",
      "role": "super_admin",
      "is_active": true
    }
  }
}
```

---

### 4.2. `GET /api/v1/admin/dashboard/summary`
Ringkasan metrik statistik untuk Dashboard Admin.

**Respons Sukses (200 OK):**
```json
{
  "success": true,
  "message": "Dashboard summary retrieved",
  "data": {
    "total_reports": 15,
    "new_reports": 4,
    "under_review": 5,
    "referred": 3,
    "resolved": 3,
    "category_breakdown": [
      { "category": "Perundungan Fisik", "count": 6 },
      { "category": "Cyberbullying", "count": 5 },
      { "category": "Perundungan Verbal", "count": 4 }
    ],
    "recent_reports": [],
    "recent_activities": []
  }
}
```

---

### 4.3. `GET /api/v1/admin/reports`
Daftar seluruh laporan untuk panel manajemen kasus.

**Query Parameters:**
- `status` (opsional): filter status
- `category_id` (opsional): filter kategori
- `identity_mode` (opsional): `anonymous` atau `identified`
- `search` (opsional): cari kode laporan atau lokasi

**Respons Sukses (200 OK):**
```json
{
  "success": true,
  "message": "Reports list retrieved",
  "data": {
    "items": [
      {
        "id": "r0000001-0000-0000-0000-000000000001",
        "tracking_code": "RA-2026-F9X2K1",
        "category_name": "Perundungan Fisik",
        "incident_date": "2026-11-10",
        "incident_location": "Kantin Belakang",
        "identity_mode": "anonymous",
        "status": "under_review",
        "created_at": "2026-11-16T10:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

---

### 4.4. `GET /api/v1/admin/reports/:id`
Detail kasus lengkap bagi petugas berwenang (termasuk kronologi, identitas jika non-anonim, dan daftar file bukti).

**Respons Sukses (200 OK):**
```json
{
  "success": true,
  "message": "Report details retrieved",
  "data": {
    "id": "r0000001-0000-0000-0000-000000000001",
    "tracking_code": "RA-2026-F9X2K1",
    "category_name": "Perundungan Fisik",
    "incident_date": "2026-11-10",
    "incident_location": "Kantin Belakang Sekolah",
    "chronology": "Kronologi mendalam kasus...",
    "identity_mode": "anonymous",
    "reporter_name": null,
    "reporter_contact": null,
    "status": "under_review",
    "assigned_admin": {
      "id": "a0000001-0000-0000-0000-000000000003",
      "full_name": "Siti Rahmawati, S.Sos."
    },
    "evidences": [],
    "histories": []
  }
}
```

---

### 4.5. `PATCH /api/v1/admin/reports/:id/status`
Memperbarui status penanganan laporan beserta audit trail catatan.

**Request Body:**
```json
{
  "status": "referred",
  "public_message": "Kasus telah dialihkan ke Tim Bimbingan Konseling.",
  "internal_note": "Koordinasi tertutup dengan orang tua korban jam 13.00."
}
```

**Respons Sukses (200 OK):**
```json
{
  "success": true,
  "message": "Status laporan berhasil diperbarui",
  "data": {
    "id": "r0000001-0000-0000-0000-000000000001",
    "status": "referred",
    "updated_at": "2026-11-19T10:45:00.000Z"
  }
}
```

---

### 4.6. `PATCH /api/v1/admin/reports/:id/assign`
Menugaskan laporan kepada Guru BK / Konselor yang bertugas.
- **Otorisasi:** `super_admin` dan `case_manager`.
- **Aturan Bisnis:**
  - `counselor` ditolak (403).
  - Target petugas harus aktif dan memiliki peran `counselor` (400 jika tidak aktif atau bukan konselor).
  - Melewatkan `assigned_admin_id: null` mencabut penugasan.
  - Setiap perubahan dicatat ke dalam tabel audit `report_assignment_histories`.

**Request Body:**
```json
{
  "assigned_admin_id": "a0000001-0000-0000-0000-000000000002",
  "notes": "Dampingi korban pada mediasi tertutup."
}
```

**Respons Sukses (200 OK):**
```json
{
  "success": true,
  "message": "Laporan berhasil ditugaskan ke Guru BK terpilih",
  "data": {
    "id": "r0000001-0000-0000-0000-000000000001",
    "assigned_admin_id": "a0000001-0000-0000-0000-000000000002",
    "updated_at": "2026-11-25T15:00:00.000Z"
  }
}
```

---

### 4.7. `GET /api/v1/admin/status-history`
Audit trail lengkap perubahan status penanganan laporan.

**Respons Sukses (200 OK):**
```json
{
  "success": true,
  "message": "Audit trail retrieved",
  "data": [
    {
      "id": "h0000001-0000-0000-0000-000000000001",
      "report_id": "r0000001-0000-0000-0000-000000000001",
      "tracking_code": "RA-2026-F9X2K1",
      "admin_name": "Siti Rahmawati, S.Sos.",
      "previous_status": "submitted",
      "new_status": "under_review",
      "public_message": "Laporan telah diterima...",
      "internal_note": "Verifikasi awal CCTV...",
      "created_at": "2026-11-17T11:00:00.000Z"
    }
  ]
}
```

---

### 4.7. `GET /api/v1/admin/profile`
Informasi profil dan hak akses admin yang sedang login.

**Respons Sukses (200 OK):**
```json
{
  "success": true,
  "message": "Profile retrieved",
  "data": {
    "id": "a0000001-0000-0000-0000-000000000001",
    "full_name": "Dra. Hj. Nurul Hidayati, M.Pd.",
    "email": "admin@ruangaman.id",
    "role": "super_admin",
    "is_active": true,
    "permissions": ["all_reports_read", "all_reports_write", "manage_users"]
  }
}
```
