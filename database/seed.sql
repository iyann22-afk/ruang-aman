-- =====================================================================
-- RUANGAMAN - SEED DATA DEMO (MINGGU 2 / MINGGU 3)
-- Data realistis lingkungan pendidikan Indonesia
-- =====================================================================

-- 1. SEED ADMINS
INSERT INTO admins (id, full_name, email, role, is_active) VALUES
('a0000001-0000-0000-0000-000000000001', 'Dra. Hj. Nurul Hidayati, M.Pd.', 'admin@ruangaman.id', 'super_admin', true),
('a0000001-0000-0000-0000-000000000002', 'Budi Santoso, S.Psi., M.Psi.', 'counselor@ruangaman.id', 'counselor', true),
('a0000001-0000-0000-0000-000000000003', 'Siti Rahmawati, S.Sos.', 'casemanager@ruangaman.id', 'case_manager', true)
ON CONFLICT (email) DO NOTHING;

-- 2. SEED REPORT CATEGORIES
INSERT INTO report_categories (id, name, slug, description, is_active) VALUES
('c0000001-0000-0000-0000-000000000001', 'Perundungan Fisik', 'perundungan-fisik', 'Tindakan kekerasan fisik seperti memukul, menendang, mendorong, menjegal, memalak, atau merusak barang pribadi.', true),
('c0000001-0000-0000-0000-000000000002', 'Perundungan Verbal', 'perundungan-verbal', 'Tindakan menghina, mencaci, memanggil dengan julukan merendahkan, mengejek kondisi fisik, atau mengancam secara lisan.', true),
('c0000001-0000-0000-0000-000000000003', 'Cyberbullying (Daring)', 'cyberbullying', 'Pelecehan, pengucilan, penyebaran rumor palsu, teror digital, atau doxxing melalui media sosial dan aplikasi perpesanan.', true),
('c0000001-0000-0000-0000-000000000004', 'Perundungan Relasional / Sosial', 'perundungan-sosial', 'Pengucilan secara sistematis, memfitnah, memanipulasi hubungan pertemanan untuk mengisolasi seseorang dari kelompok.', true),
('c0000001-0000-0000-0000-000000000005', 'Kekerasan Seksual & Pelecehan', 'kekerasan-seksual', 'Segala bentuk ucapan, isyarat, sentuhan fisik, atau pemaksaan yang bernuansa seksual tanpa persetujuan.', true),
('c0000001-0000-0000-0000-000000000006', 'Pemerasan & Intimidasi', 'pemerasan-intimidasi', 'Pemaksaan meminta uang jajan, barang, atau pekerjaan rumah (PR) dengan ancaman kekerasan atau pengucilan.', true)
ON CONFLICT (slug) DO NOTHING;

-- 3. SEED REPORTS
INSERT INTO reports (id, tracking_code, category_id, incident_date, incident_location, chronology, identity_mode, reporter_name, reporter_contact, status, assigned_admin_id, privacy_acknowledged, created_at, updated_at) VALUES
('r0000001-0000-0000-0000-000000000001', 'RA-2026-F9X2K1', 'c0000001-0000-0000-0000-000000000001', '2026-11-10', 'Kantin Belakang Sekolah saat istirahat kedua', 'Seorang siswa kelas 10 diintimidasi dan didorong hingga jatuh oleh sekelompok siswa senior karena menolak membelikan makanan.', 'anonymous', NULL, NULL, 'under_review', 'a0000001-0000-0000-0000-000000000003', true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
('r0000001-0000-0000-0000-000000000002', 'RA-2026-B4M8N7', 'c0000001-0000-0000-0000-000000000003', '2026-11-12', 'Grup WhatsApp Angkatan & Instagram Story', 'Penyebaran stiker foto teman sekelas yang diedit dengan kata-kata merendahkan martabat keluarga secara berulang.', 'identified', 'Andi Pratama', '081234567890', 'referred', 'a0000001-0000-0000-0000-000000000002', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '12 hours'),
('r0000001-0000-0000-0000-000000000003', 'RA-2026-K7L3P9', 'c0000001-0000-0000-0000-000000000002', '2026-11-05', 'Koridor Depan Lab Komputer', 'Pengejekan verbal nama orang tua setiap pergantian jam pelajaran oleh teman sekelas.', 'anonymous', NULL, NULL, 'resolved', 'a0000001-0000-0000-0000-000000000001', true, NOW() - INTERVAL '7 days', NOW() - INTERVAL '2 days')
ON CONFLICT (tracking_code) DO NOTHING;

-- 4. SEED REPORT STATUS HISTORIES
INSERT INTO report_status_histories (id, report_id, changed_by_admin_id, previous_status, new_status, public_message, internal_note, created_at) VALUES
('h0000001-0000-0000-0000-000000000001', 'r0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'submitted', 'under_review', 'Laporan telah diterima oleh Tim Satgas Pencegahan Kekerasan dan saat ini sedang ditelaah awal bukti kronologinya.', 'Verifikasi awal lokasi CCTV kantin belakang sekolah untuk konfirmasi jam 12:15 WIB.', NOW() - INTERVAL '2 days'),
('h0000001-0000-0000-0000-000000000002', 'r0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'submitted', 'under_review', 'Laporan diverifikasi. Terindikasi perundungan siber pada kanal media sosial.', 'Hubungi wali kelas 11 IPA 2 untuk koordinasi mediasi tertutup.', NOW() - INTERVAL '1 day'),
('h0000001-0000-0000-0000-000000000003', 'r0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'under_review', 'referred', 'Kasus telah dirujuk ke Guru Bimbingan Konseling (BK) untuk sesi konseling pemulihan psikologis korban.', 'Jadwalkan konseling tatap muka dengan orang tua kedua belah pihak.', NOW() - INTERVAL '12 hours'),
('h0000001-0000-0000-0000-000000000004', 'r0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'under_review', 'resolved', 'Mediasi kekeluargaan dan bimbingan konseling telah selesai. Kedua pihak sepakat berdamai dan pelaku telah menandatangani surat komitmen.', 'Evaluasi berkala setiap 2 minggu oleh guru BK untuk memastikan tidak ada relaps.', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- 5. SEED EDUCATION MATERIALS
INSERT INTO education_materials (id, title, slug, category, summary, content, reading_minutes, is_published, created_by_admin_id) VALUES
('e0000001-0000-0000-0000-000000000001', 'Mengenal Definisi dan Unsur Utama Perundungan', 'mengenal-perundungan', 'Pemahaman Dasar', 'Perundungan bukan sekadar candaan biasa. Kenali 3 unsur utama yang membedakan perundungan dari perselisihan biasa.', 'Perundungan (bullying) adalah perilaku agresif berulang yang melibatkan ketidakseimbangan kekuatan antara pelaku dan korban. Tiga unsur utamanya meliputi: 1) Niat menyakiti, 2) Ketidakseimbangan kekuasaan fisik atau sosial, dan 3) Pengulangan dalam jangka waktu tertentu.', 4, true, 'a0000001-0000-0000-0000-000000000001'),
('e0000001-0000-0000-0000-000000000002', 'Bahaya Cyberbullying dan Jejak Digital', 'bahaya-cyberbullying', 'Dunia Digital', 'Mengapa perundungan di dunia maya seringkali lebih merusak? Pahami dampaknya pada kesehatan mental remaja.', 'Cyberbullying dapat terjadi 24 jam sehari, 7 hari seminggu, menjangkau korban bahkan saat berada di dalam rumah yang aman. Bukti digital seperti tangkapan layar, riwayat pesan, dan metadata sangat penting untuk didokumentasikan sebagai bukti formal pelaporan.', 6, true, 'a0000001-0000-0000-0000-000000000002'),
('e0000001-0000-0000-0000-000000000003', 'Menjadi Upstander: Bukan Sekadar Penonton', 'menjadi-upstander', 'Aksi Nyata', 'Bagaimana saksi mata bisa menghentikan 57% kasus perundungan hanya dalam waktu 10 detik pertama intervensi.', 'Ketika kita melihat teman dirundung, diam bukanlah pilihan netral. Diam seringkali diartikan pelaku sebagai persetujuan sosial. Jadilah *upstander* dengan cara: mengalihkan perhatian, mendampingi korban, menolak tertawa atas lelucon merendahkan, dan melaporkan secara rahasia via RUANGAMAN.', 5, true, 'a0000001-0000-0000-0000-000000000003'),
('e0000001-0000-0000-0000-000000000004', 'Langkah Aman Melaporkan Tanpa Takut Balas Dendam', 'cara-aman-melapor', 'Panduan Lapor', 'Panduan menggunakan fitur pelaporan anonim RUANGAMAN dan hak perlindungan identitas pelapor.', 'RUANGAMAN dibangun dengan prinsip *Privacy by Design*. Anda dapat memilih opsi Anonim sehingga nama dan nomor kontak Anda tidak disimpan di sistem. Kode pelacakan unik berfungsi sebagai akses memantau tindak lanjut tanpa perlu membuat akun.', 3, true, 'a0000001-0000-0000-0000-000000000001')
ON CONFLICT (slug) DO NOTHING;

-- 6. SEED SUPPORT RESOURCES
INSERT INTO support_resources (id, title, resource_type, description, contact_name, phone, website_url, operating_hours, location, is_published) VALUES
('s0000001-0000-0000-0000-000000000001', 'Layanan Sahabat Perempuan & Anak (SAPA 129)', 'hotline', 'Layanan pengaduan kekerasan terhadap perempuan dan anak resmi Kementerian PPPA Republik Indonesia.', 'KemenPPPA RI', '129', 'https://kemenpppa.go.id', '24 Jam Setiap Hari', 'Nasional', true),
('s0000001-0000-0000-0000-000000000002', 'Telepon Sahabat Anak (TEPSA 1500771)', 'hotline', 'Bantuan darurat perlindungan anak oleh Kementerian Sosial RI untuk respon krisis psikososial.', 'Kemensos RI', '1500771', 'https://kemensos.go.id', '24 Jam Bebas Pulsa', 'Nasional', true),
('s0000001-0000-0000-0000-000000000003', 'Unit Bimbingan Konseling Sekolah (Ruang BK)', 'counselor', 'Konseling tatap muka empat mata dengan konselor dan psikolog sekolah yang menjamin kerahasiaan penuh.', 'Pak Budi Santoso, S.Psi.', '0812-9988-7766', NULL, 'Senin - Jumat (08.00 - 15.00 WIB)', 'Gedung A Lantai 2, Ruang BK', true),
('s0000001-0000-0000-0000-000000000004', 'KPAI (Komisi Perlindungan Anak Indonesia)', 'legal', 'Pengaduan pelanggaran hak anak, kekerasan sistemik di sekolah, dan pendampingan advokasi hukum.', 'Sekretariat KPAI', '021-31901556', 'https://kpai.go.id', 'Hari Kerja (09.00 - 16.00 WIB)', 'Jl. Teuku Umar No.10, Menteng, Jakarta', true)
ON CONFLICT (id) DO NOTHING;

-- 7. SEED COUNSELING SLOTS
INSERT INTO counseling_slots (id, counselor_admin_id, start_at, end_at, session_mode, location, meeting_link, capacity, is_published, status) VALUES
('sl000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', NOW() + INTERVAL '1 day' + INTERVAL '9 hours', NOW() + INTERVAL '1 day' + INTERVAL '10 hours', 'offline', 'Ruang Bimbingan Konseling Lt. 2 (Bilik Ramah)', NULL, 1, true, 'available'),
('sl000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', NOW() + INTERVAL '1 day' + INTERVAL '13 hours', NOW() + INTERVAL '1 day' + INTERVAL '14 hours', 'online', NULL, 'https://meet.google.com/demo-ruangaman-bk', 1, true, 'available'),
('sl000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000002', NOW() + INTERVAL '2 day' + INTERVAL '10 hours', NOW() + INTERVAL '2 day' + INTERVAL '11 hours', 'offline', 'Ruang Bimbingan Konseling Lt. 2 (Bilik Ramah)', NULL, 1, true, 'available')
ON CONFLICT (id) DO NOTHING;

-- 8. SEED COUNSELING BOOKINGS
INSERT INTO counseling_bookings (id, slot_id, booking_code, student_name, contact_method, contact_value, booking_status, privacy_acknowledged) VALUES
('b0000001-0000-0000-0000-000000000001', 'sl000001-0000-0000-0000-000000000001', 'BK-2026-9A1B2C', 'Siswa Simulasi Kelas 11', 'whatsapp', '081298765432', 'confirmed', true)
ON CONFLICT (booking_code) DO NOTHING;
