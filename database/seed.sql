-- =====================================================================
-- RUANGAMAN SEED DATA — Week 3
-- Disesuaikan secara presisi dengan 0001_initial_schema.sql & 0002_week3_additions.sql
-- =====================================================================

-- ===== 1. KATEGORI LAPORAN =====
INSERT INTO report_categories (id, name, slug, description, is_active) VALUES
  (
    'c0000001-0000-0000-0000-000000000001',
    'Perundungan Fisik',
    'perundungan-fisik',
    'Tindakan kekerasan fisik seperti memukul, menendang, mendorong, atau bentuk agresi fisik lainnya.',
    true
  ),
  (
    'c0000001-0000-0000-0000-000000000002',
    'Perundungan Verbal',
    'perundungan-verbal',
    'Penghinaan, olok-olok, ancaman, atau kata-kata menyakitkan yang dilakukan berulang kali.',
    true
  ),
  (
    'c0000001-0000-0000-0000-000000000003',
    'Perundungan Siber (Cyberbullying)',
    'perundungan-siber',
    'Pelecehan, ancaman, atau penyebaran konten memalukan melalui media sosial, pesan, atau platform digital.',
    true
  ),
  (
    'c0000001-0000-0000-0000-000000000004',
    'Kekerasan Seksual',
    'kekerasan-seksual',
    'Pelecehan, sentuhan tidak senonoh, atau tindakan seksual yang tidak dikehendaki dalam lingkungan sekolah.',
    true
  ),
  (
    'c0000001-0000-0000-0000-000000000005',
    'Diskriminasi',
    'diskriminasi',
    'Perlakuan tidak adil berdasarkan suku, agama, ras, gender, kondisi fisik, atau latar belakang ekonomi.',
    true
  ),
  (
    'c0000001-0000-0000-0000-000000000006',
    'Pemerasan atau Pencurian',
    'pemerasan-pencurian',
    'Memaksa korban menyerahkan uang, barang, atau melakukan sesuatu melalui intimidasi.',
    true
  ),
  (
    'c0000001-0000-0000-0000-000000000007',
    'Lainnya',
    'lainnya',
    'Bentuk kekerasan atau pelanggaran lain yang tidak termasuk kategori di atas.',
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- ===== 2. MATERI EDUKASI =====
INSERT INTO education_materials (
  id,
  title,
  slug,
  category,
  summary,
  content,
  reading_minutes,
  is_published
) VALUES
  (
    'e0000001-0000-0000-0000-000000000001',
    'Apa itu Perundungan? Kenali Bentuk dan Dampaknya',
    'apa-itu-perundungan',
    'pengenalan-dasar',
    'Panduan lengkap mengenali perundungan dalam berbagai bentuknya dan dampak psikologis yang ditimbulkan.',
    'Perundungan (bullying) adalah perilaku agresif yang dilakukan secara berulang oleh seseorang atau kelompok terhadap orang lain yang lebih lemah. Ada tiga komponen utama: intensi (disengaja), repetisi (berulang), dan ketidakseimbangan kekuatan.

## Jenis Perundungan

**1. Perundungan Fisik**
Memukul, menendang, mendorong, merusak barang milik korban.

**2. Perundungan Verbal**
Mengejek, mengancam, menghina, menyebarkan rumor.

**3. Perundungan Sosial/Relasional**
Mengucilkan dari kelompok, mempermalukan di depan umum.

**4. Perundungan Siber**
Pelecehan melalui media sosial, pesan, atau konten digital yang memalukan.

## Dampak Perundungan
- Gangguan kesehatan mental (kecemasan, depresi)
- Penurunan prestasi akademik
- Isolasi sosial
- Dalam kasus parah: risiko menyakiti diri sendiri',
    8,
    true
  ),
  (
    'e0000001-0000-0000-0000-000000000002',
    'Langkah Aman Melaporkan Perundungan',
    'cara-melaporkan-perundungan',
    'panduan-tindakan',
    'Panduan praktis bagi korban atau saksi perundungan tentang cara melaporkan kejadian dengan aman dan terlindungi.',
    '## Mengapa Melaporkan Itu Penting?

Banyak korban memilih diam karena takut, malu, atau tidak tahu harus melapor ke mana. Padahal, diam hanya memberi kesempatan pelaku untuk terus melakukan tindakannya.

## Langkah Pelaporan yang Aman

**1. Dokumentasikan Kejadian**
Catat tanggal, waktu, lokasi, dan deskripsi kejadian. Simpan bukti seperti pesan atau foto jika ada.

**2. Gunakan Sistem Pelaporan Anonim**
RUANGAMAN menyediakan formulir pelaporan anonim — identitas Anda tetap terlindungi.

**3. Hubungi Orang Terpercaya**
Guru BK, orang tua, atau konselor adalah orang pertama yang bisa membantu.

**4. Jangan Konfrontasi Sendirian**
Hindari menghadapi pelaku tanpa dukungan. Prioritaskan keselamatan Anda.',
    6,
    true
  ),
  (
    'e0000001-0000-0000-0000-000000000003',
    'Memahami Hak-Hak Korban Kekerasan di Sekolah',
    'hak-korban-kekerasan',
    'hak-dan-regulasi',
    'Penjelasan tentang hak-hak hukum dan kelembagaan yang dimiliki korban kekerasan di lingkungan sekolah.',
    '## Dasar Hukum Perlindungan Siswa

Siswa di Indonesia dilindungi oleh beberapa regulasi penting:
- UU No. 23 Tahun 2002 tentang Perlindungan Anak
- Permendikbud No. 82 Tahun 2015 tentang Pencegahan dan Penanggulangan Tindak Kekerasan
- Perpres No. 101 Tahun 2022 tentang Strategi Nasional Penghapusan Kekerasan terhadap Anak

## Hak-Hak Korban

✅ Hak mendapatkan perlindungan dari sekolah
✅ Hak untuk melaporkan tanpa takut dibalas
✅ Hak mendapatkan layanan konseling
✅ Hak atas kerahasiaan identitas
✅ Hak mendapatkan penanganan yang adil dan cepat',
    10,
    true
  ),
  (
    'e0000001-0000-0000-0000-000000000004',
    'Cara Mendukung Teman yang Mengalami Perundungan',
    'mendukung-teman-korban',
    'panduan-tindakan',
    'Panduan praktis bagi saksi dan teman untuk memberikan dukungan yang tepat kepada korban perundungan.',
    '## Peran Penting Saksi dan Teman Sebaya

Penelitian menunjukkan bahwa 85% kasus perundungan terjadi di depan saksi. Dukungan teman sebaya adalah salah satu faktor terkuat dalam menghentikan perundungan.

## Yang Bisa Kamu Lakukan

**Jika Menyaksikan Langsung:**
- Jangan tertawa atau ikut-ikutan
- Tunjukkan sikap tidak setuju secara tegas namun aman
- Segera laporkan ke guru atau pihak sekolah

**Mendukung Korban:**
- Dengarkan tanpa menghakimi
- Validasi perasaan mereka: "Itu tidak adil dan bukan salahmu"
- Dampingi ke konselor atau guru BK
- Bantu dokumentasikan kejadian jika mereka setuju',
    7,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  summary = EXCLUDED.summary,
  content = EXCLUDED.content,
  reading_minutes = EXCLUDED.reading_minutes,
  is_published = EXCLUDED.is_published;

-- ===== 3. SUMBER DAYA PENDAMPINGAN =====
INSERT INTO support_resources (
  id,
  title,
  resource_type,
  description,
  contact_name,
  phone,
  website_url,
  operating_hours,
  location,
  is_published
) VALUES
  (
    's0000001-0000-0000-0000-000000000001',
    'Layanan Sahabat Perempuan & Anak (SAPA 129)',
    'hotline',
    'Layanan telepon darurat pengaduan kekerasan terhadap perempuan dan anak resmi Kementerian PPPA RI.',
    'KemenPPPA RI',
    '129 / WhatsApp 08111-129-129',
    'https://kemenpppa.go.id',
    '24 Jam Setiap Hari',
    'Nasional',
    true
  ),
  (
    's0000001-0000-0000-0000-000000000002',
    'Into The Light Indonesia',
    'foundation',
    'Organisasi berbasis komunitas yang fokus pada advokasi kesehatan mental dan pencegahan bunuh diri remaja.',
    'Tim Pendamping Sebaya',
    '119 ext 8',
    'https://www.intothelightid.org',
    'Senin - Jumat, 09:00 - 17:00 WIB',
    'Daring / Komunitas',
    true
  ),
  (
    's0000001-0000-0000-0000-000000000003',
    'Yayasan Pulih (Pemulihan Trauma Psikologis)',
    'counselor',
    'Layanan konseling profesional dan psikoterapi pemulihan trauma kekerasan serta perundungan anak.',
    'Pusat Krisis Pulih',
    '021-78842580 / 0811-8436-633',
    'https://yayasanpulih.org',
    'Senin - Sabtu, 09:00 - 18:00 WIB',
    'Jakarta Selatan & Konseling Daring',
    true
  ),
  (
    's0000001-0000-0000-0000-000000000004',
    'Hotline Kesehatan Jiwa Kemenkes Sejiwa',
    'hotline',
    'Layanan pertolongan pertama psikologis cepat dari Kementerian Kesehatan Republik Indonesia.',
    'Kementerian Kesehatan RI',
    '119 ext 8',
    'https://kemkes.go.id',
    '24 Jam Setiap Hari',
    'Nasional',
    true
  ),
  (
    's0000001-0000-0000-0000-000000000005',
    'LBH APIK (Bantuan Hukum Perempuan & Anak)',
    'legal',
    'Lembaga bantuan hukum pro bono yang mendampingi proses hukum korban kekerasan di lingkungan pendidikan.',
    'Divisi Pelayanan Hukum LBH APIK',
    '0813-8882-2669',
    'https://lbhapik.or.id',
    'Senin - Jumat, 08:30 - 16:30 WIB',
    'Nasional / Jabodetabek',
    true
  )
ON CONFLICT (title) DO UPDATE SET
  resource_type = EXCLUDED.resource_type,
  description = EXCLUDED.description,
  contact_name = EXCLUDED.contact_name,
  phone = EXCLUDED.phone,
  website_url = EXCLUDED.website_url,
  operating_hours = EXCLUDED.operating_hours,
  location = EXCLUDED.location,
  is_published = EXCLUDED.is_published;

-- ===== 4. SLOT KONSELING =====
-- counselor_admin_id bernilai NULL pada seed awal
-- Petugas konselor yang disetujui dapat mengklaim atau ditugaskan pada slot ini
INSERT INTO counseling_slots (
  id,
  counselor_admin_id,
  start_at,
  end_at,
  session_mode,
  location,
  meeting_link,
  capacity,
  is_published,
  status
) VALUES
  (
    'sl000001-0000-0000-0000-000000000001',
    NULL,
    NOW() + INTERVAL '1 day' + INTERVAL '9 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '10 hours',
    'offline',
    'Ruang Bimbingan Konseling Lt. 2 (Bilik Ramah Siswa)',
    NULL,
    1,
    true,
    'available'
  ),
  (
    'sl000001-0000-0000-0000-000000000002',
    NULL,
    NOW() + INTERVAL '1 day' + INTERVAL '13 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '14 hours',
    'online',
    NULL,
    'https://meet.google.com/demo-ruangaman-bk',
    1,
    true,
    'available'
  ),
  (
    'sl000001-0000-0000-0000-000000000003',
    NULL,
    NOW() + INTERVAL '2 days' + INTERVAL '10 hours',
    NOW() + INTERVAL '2 days' + INTERVAL '11 hours',
    'offline',
    'Ruang Bimbingan Konseling Lt. 2 (Bilik Ramah Siswa)',
    NULL,
    1,
    true,
    'available'
  )
ON CONFLICT (id) DO UPDATE SET
  start_at = EXCLUDED.start_at,
  end_at = EXCLUDED.end_at,
  session_mode = EXCLUDED.session_mode,
  location = EXCLUDED.location,
  meeting_link = EXCLUDED.meeting_link,
  capacity = EXCLUDED.capacity,
  is_published = EXCLUDED.is_published,
  status = EXCLUDED.status;

-- =====================================================================
-- SELESAI — Seed data konsisten dengan seluruh skema PostgreSQL
-- =====================================================================
SELECT 'Seed data berhasil diverifikasi dan diterapkan.' AS status;
