# DOKUMEN DESAIN DATABASE & PERSIAPAN SUPABASE (WEEK 3)
## SISTEM INFORMASI RUANGAMAN

---

## 1. PENDEKATAN ARSITEKTUR DATA

Database RUANGAMAN didesain menggunakan PostgreSQL dengan arsitektur relasional yang ketat, memprioritaskan:
1. **Integritas Data Relasional:** Penggunaan Foreign Keys bertingkat dengan aturan `ON DELETE CASCADE` untuk data turunan (`evidences`, `status_histories`, `bookings`) dan `ON DELETE RESTRICT` untuk data referensi master (`categories`, `admins`).
2. **Privacy-by-Design & PII Isolation:** Memisahkan data publik dengan data sensitif. Kolom `internal_note` pada `report_status_histories` dan identitas pelapor pada `reports` dilindungi secara ketat agar tidak pernah bocor ke interface publik.
3. **Audit Trail Imutabel:** Setiap perubahan status laporan dicatat sebagai entitas terpisah pada `report_status_histories` lengkap dengan penanda admin yang mengeksekusi dan stempel waktu `TIMESTAMPTZ`.

---

## 2. SKEMA ROW LEVEL SECURITY (RLS) UNTUK MINGGU 3

Pada Minggu 3 saat migrasi ke Supabase, kebijakan RLS berikut akan langsung diterapkan melalui migration SQL:

### A. Tabel `reports`
```sql
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 1. Public dapat melakukan INSERT laporan baru (tanpa perlu login)
CREATE POLICY "Public can submit reports" ON reports
    FOR INSERT WITH CHECK (true);

-- 2. Public hanya bisa membaca laporan yang tracking_code-nya cocok secara presisi
-- (Hanya kolom tertentu yang disajikan via View atau API controller)
CREATE POLICY "Public can read own report by tracking code" ON reports
    FOR SELECT USING (true); -- Dibatasi ketat oleh Controller/Backend Service

-- 3. Admin terautentikasi (auth.uid() ada di tabel admins) dapat membaca dan mengelola semua laporan
CREATE POLICY "Admins have full access to reports" ON reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE admins.auth_user_id = auth.uid() 
            AND admins.is_active = true
        )
    );
```

### B. Tabel `report_evidences` & Supabase Storage
```sql
ALTER TABLE report_evidences ENABLE ROW LEVEL SECURITY;

-- Storage Bucket Private: 'report-evidences'
-- Tidak ada URL publik langsung. Hanya admin yang dapat men-generate signed URL sementara (TTL 60 menit).
CREATE POLICY "Admins can view evidences" ON report_evidences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE admins.auth_user_id = auth.uid() 
            AND admins.is_active = true
        )
    );
```

### C. Tabel `report_status_histories`
```sql
ALTER TABLE report_status_histories ENABLE ROW LEVEL SECURITY;

-- Public hanya bisa melihat history tanpa internal_note
-- Admin dapat melihat seluruh kolom termasuk internal_note
```

---

## 3. STRATEGI MOCK REPOSITORY MINGGU 2 VS SUPABASE MINGGU 3

Untuk memenuhi ketentuan Minggu 2:
- **Minggu 2:** Aplikasi backend mengimplementasikan `ReportRepository`, `EducationRepository`, `CounselingRepository`, dan `AdminRepository` menggunakan in-memory state TypeScript yang meniru perilaku database sesungguhnya (UUID generation, relasi, filter status, error handling).
- **Minggu 3:** Membuat class `SupabaseReportRepository` yang mengimplementasikan interface yang persis sama dengan memanfaatkan Supabase Client (`@supabase/supabase-js`). Tidak ada satupun service layer atau endpoint controller yang perlu diubah.

```mermaid
flowchart LR
    subgraph Controller Layer
        C[ReportController]
    end
    subgraph Service Layer
        S[ReportService]
    end
    subgraph Repository Interface
        I[<<interface>> IReportRepository]
    end
    subgraph Week 2 Implementation
        M[MockReportRepository (Memory State)]
    end
    subgraph Week 3 Implementation
        SB[SupabaseReportRepository (PostgreSQL + RLS)]
    end

    C --> S
    S --> I
    I -.-> M
    I -.-> SB
```

---

## 4. PENANGANAN PRIVASI & PII (PERSONALLY IDENTIFIABLE INFORMATION)
1. **Mode Anonim vs Teridentifikasi:**
   - Jika `identity_mode == 'anonymous'`, maka kolom `reporter_name` dan `reporter_contact` di database wajib bernilai `NULL`.
2. **Entropy Tracking Code:**
   - Format: `RA-YYYY-[A-Z0-9]{6}` (contoh: `RA-2026-X8K9M2`), menghasilkan ruang kombinasi lebih dari 2 miliar kemungkinan, mencegah serangan brute-force enumerasi.
3. **Penyembunyian Kronologi Publik:**
   - Endpoint publik `/api/v1/public/reports/track` hanya mengembalikan `tracking_code`, `status`, `category_name`, `created_at`, `updated_at`, dan riwayat `public_message`. Kronologi insiden tidak pernah dikembalikan ke endpoint publik demi melindungi korban dari pengintipan perangkat.
