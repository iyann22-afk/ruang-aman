-- =====================================================================
-- RUANGAMAN SEED DATA — Week 3
-- Jalankan setelah 0001 dan 0002 migration
-- =====================================================================

-- ===== 1. KATEGORI LAPORAN =====
INSERT INTO report_categories (id, name, slug, description, is_active) VALUES
  (gen_random_uuid(), 'Perundungan Fisik', 'perundungan-fisik',
   'Tindakan kekerasan fisik seperti memukul, menendang, mendorong, atau bentuk agresi fisik lainnya.', true),
  (gen_random_uuid(), 'Perundungan Verbal', 'perundungan-verbal',
   'Penghinaan, olok-olok, ancaman, atau kata-kata menyakitkan yang dilakukan berulang kali.', true),
  (gen_random_uuid(), 'Perundungan Siber (Cyberbullying)', 'perundungan-siber',
   'Pelecehan, ancaman, atau penyebaran konten memalukan melalui media sosial, pesan, atau platform digital.', true),
  (gen_random_uuid(), 'Kekerasan Seksual', 'kekerasan-seksual',
   'Pelecehan, sentuhan tidak senonoh, atau tindakan seksual yang tidak dikehendaki dalam lingkungan sekolah.', true),
  (gen_random_uuid(), 'Diskriminasi', 'diskriminasi',
   'Perlakuan tidak adil berdasarkan suku, agama, ras, gender, kondisi fisik, atau latar belakang ekonomi.', true),
  (gen_random_uuid(), 'Pemerasan atau Pencurian', 'pemerasan-pencurian',
   'Memaksa korban menyerahkan uang, barang, atau melakukan sesuatu melalui intimidasi.', true),
  (gen_random_uuid(), 'Lainnya', 'lainnya',
   'Bentuk kekerasan atau pelanggaran lain yang tidak termasuk kategori di atas.', true)
ON CONFLICT (slug) DO NOTHING;

-- ===== 2. MATERI EDUKASI =====
INSERT INTO education_materials (id, title, slug, description, content, category, read_time_minutes, is_published) VALUES
  (
    gen_random_uuid(),
    'Apa itu Perundungan? Kenali Bentuk dan Dampaknya',
    'apa-itu-perundungan',
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
    'pengenalan-dasar',
    8,
    true
  ),
  (
    gen_random_uuid(),
    'Langkah Aman Melaporkan Perundungan',
    'cara-melaporkan-perundungan',
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
    'panduan-tindakan',
    6,
    true
  ),
  (
    gen_random_uuid(),
    'Memahami Hak-Hak Korban Kekerasan di Sekolah',
    'hak-korban-kekerasan',
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
    'hak-dan-regulasi',
    10,
    true
  ),
  (
    gen_random_uuid(),
    'Cara Mendukung Teman yang Mengalami Perundungan',
    'mendukung-teman-korban',
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
    'panduan-tindakan',
    7,
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- ===== 3. SUMBER DAYA PENDAMPINGAN =====
INSERT INTO support_resources (id, name, type, contact_info, description, is_active) VALUES
  (
    gen_random_uuid(),
    'SAPA 129 — Hotline Perlindungan Perempuan dan Anak',
    'hotline',
    '{"phone": "129", "hours": "24/7"}',
    'Layanan hotline nasional 24 jam yang dikelola Kementerian Pemberdayaan Perempuan dan Perlindungan Anak. Gratis dari seluruh Indonesia.',
    true
  ),
  (
    gen_random_uuid(),
    'Into The Light Indonesia',
    'foundation',
    '{"phone": "119 ext 8", "website": "https://www.intothelightid.org"}',
    'Organisasi yang bergerak di pencegahan bunuh diri dan peningkatan kesehatan mental remaja Indonesia.',
    true
  ),
  (
    gen_random_uuid(),
    'Yayasan Pulih',
    'counselor',
    '{"phone": "(021) 788-42580", "website": "https://www.yayasanpulih.org"}',
    'Lembaga psikososial yang menyediakan layanan konseling, pendampingan trauma, dan pemulihan bagi korban kekerasan.',
    true
  ),
  (
    gen_random_uuid(),
    'Hotline Kesehatan Jiwa Kemenkes',
    'hotline',
    '{"phone": "119 ext 8", "hours": "24/7"}',
    'Layanan konseling kesehatan jiwa gratis dari Kementerian Kesehatan RI. Tersedia 24 jam untuk krisis mental.',
    true
  ),
  (
    gen_random_uuid(),
    'LBH APIK — Bantuan Hukum',
    'legal',
    '{"phone": "(021) 877-97289", "website": "https://lbhapik.or.id"}',
    'Lembaga Bantuan Hukum untuk perempuan dan anak korban kekerasan. Menyediakan pendampingan hukum secara gratis.',
    true
  )
ON CONFLICT DO NOTHING;

-- ===== 4. SLOT KONSELING (Contoh) =====
INSERT INTO counseling_slots (id, counselor_name, counselor_title, slot_date, slot_time, duration_minutes, session_mode, location_or_link, max_capacity, status) VALUES
  (
    gen_random_uuid(),
    'Dr. Anita Rahayu, M.Psi., Psikolog',
    'Psikolog Klinis',
    CURRENT_DATE + INTERVAL '3 days',
    '09:00:00',
    60,
    'online',
    'Link Zoom akan dikirim via email setelah konfirmasi',
    1,
    'available'
  ),
  (
    gen_random_uuid(),
    'Reza Firmansyah, S.Psi.',
    'Konselor Sebaya Tersertifikasi',
    CURRENT_DATE + INTERVAL '4 days',
    '13:00:00',
    45,
    'online',
    'Google Meet — link dikirim setelah booking dikonfirmasi',
    1,
    'available'
  ),
  (
    gen_random_uuid(),
    'Dr. Anita Rahayu, M.Psi., Psikolog',
    'Psikolog Klinis',
    CURRENT_DATE + INTERVAL '7 days',
    '10:00:00',
    60,
    'offline',
    'Ruang BK Lantai 2, Gedung A',
    1,
    'available'
  )
ON CONFLICT DO NOTHING;

-- =====================================================================
-- SELESAI — Seed data berhasil diterapkan
-- =====================================================================
SELECT 'Seed data berhasil diterapkan.' AS status;
