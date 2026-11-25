import { EducationMaterial } from '../../types/index.js';
import { IEducationRepository } from '../interfaces/education.repository.interface.js';

export class MockEducationRepository implements IEducationRepository {
  private materials: EducationMaterial[] = [
    {
      id: 'e0000001-0000-0000-0000-000000000001',
      title: 'Mengenal Definisi dan Unsur Utama Perundungan',
      slug: 'mengenal-definisi-perundungan',
      category: 'Pemahaman Dasar',
      summary: 'Perundungan bukan sekadar lelucon biasa. Pahami tiga unsur fundamental yang membedakan candaan dengan perundungan nyata.',
      content: `### Apa Itu Perundungan (Bullying)?
Perundungan adalah perilaku agresif berulang yang disengaja dan melibatkan ketidakseimbangan kekuatan (*power imbalance*) nyata atau yang dirasakan antara pelaku dan korban.

### Tiga Kriteria Utama
1. **Niat Melukai (Intentionality):** Perilaku sengaja dilakukan untuk menimbulkan rasa sakit fisik, psikis, atau sosial.
2. **Ketidakseimbangan Kuasa (Imbalance of Power):** Korban merasa tidak berdaya membela diri karena perbedaan fisik, status sosial, jumlah teman, atau popularitas.
3. **Pengulangan (Repetition):** Tindakan terjadi lebih dari satu kali atau berpotensi terjadi terus menerus.

Ingat, jika salah satu pihak merasa tertekan, takut, atau sedih, itu bukan lagi candaan sehat!`,
      media_url: null,
      cover_path: '/images/education/definisi-perundungan.webp',
      reading_minutes: 4,
      is_published: true,
      created_by_admin_id: 'a0000001-0000-0000-0000-000000000001',
      created_at: '2026-11-01T08:00:00.000Z',
      updated_at: '2026-11-01T08:00:00.000Z',
    },
    {
      id: 'e0000001-0000-0000-0000-000000000002',
      title: 'Perundungan Fisik: Batasan dan Bahayanya',
      slug: 'perundungan-fisik',
      category: 'Jenis Perundungan',
      summary: 'Mendorong, memukul, hingga merusak barang pribadi adalah bentuk pelanggaran hukum dan tata tertib sekolah.',
      content: `### Karakteristik Perundungan Fisik
Perundungan fisik merupakan bentuk yang paling mudah diamati kasat mata, namun sering kali disamarkan sebagai "permainan cowok" atau "orientasi".

### Bentuk Tindakan
- Memukul, menendang, mencubit, atau menjegal langkah kaki.
- Meminta uang atau barang berharga secara paksa (pemalakan).
- Merusak buku, seragam, atau peralatan belajar orang lain.
- Mengurung korban di dalam toilet atau ruangan kelas kosong.

### Hak Anda di Sekolah
Setiap siswa berhak atas rasa aman dan bebas dari rasa sakit fisik sesuai Permendikbudristek No. 46 Tahun 2023. Jangan ragu melapor via RUANGAMAN jika mengalaminya!`,
      media_url: null,
      cover_path: '/images/education/perundungan-fisik.webp',
      reading_minutes: 5,
      is_published: true,
      created_by_admin_id: 'a0000001-0000-0000-0000-000000000001',
      created_at: '2026-11-02T08:00:00.000Z',
      updated_at: '2026-11-02T08:00:00.000Z',
    },
    {
      id: 'e0000001-0000-0000-0000-000000000003',
      title: 'Luka Tak Kasat Mata: Perundungan Verbal dan Relasional',
      slug: 'perundungan-verbal-dan-relasional',
      category: 'Jenis Perundungan',
      summary: 'Kata-kata kasar, panggilan menghina fisik, dan pengucilan kelompok bisa membekas seumur hidup.',
      content: `### Mengapa Verbal Bullying Sangat Berbahaya?
Kata-kata tidak meninggalkan lebam biru di kulit, tetapi merusak konsep diri (*self-esteem*) dan menyebabkan trauma mendalam.

### Bentuk Perundungan Verbal & Relasional
1. **Body Shaming:** Menghina berat badan, warna kulit, bentuk wajah, atau gaya berjalan.
2. **Panggilan Ejekan:** Memanggil dengan nama orang tua bernada merendahkan atau sebutan binatang.
3. **Pengucilan Sosial (Silent Treatment):** Menghasut seisi kelas agar tidak berbicara atau tidak mengajak seseorang ke dalam kelompok kerja.
4. **Penyebaran Gosip / Fitnah:** Menyebarkan cerita bohong untuk merusak reputasi korban.`,
      media_url: null,
      cover_path: '/images/education/perundungan-verbal.webp',
      reading_minutes: 6,
      is_published: true,
      created_by_admin_id: 'a0000001-0000-0000-0000-000000000002',
      created_at: '2026-11-03T08:00:00.000Z',
      updated_at: '2026-11-03T08:00:00.000Z',
    },
    {
      id: 'e0000001-0000-0000-0000-000000000004',
      title: 'Cyberbullying: Mengamankan Jejak Digital Anda',
      slug: 'cyberbullying-jejak-digital',
      category: 'Dunia Digital',
      summary: 'Perundungan daring dapat terjadi tanpa henti 24 jam. Ketahui cara mengumpulkan barang bukti digital yang sah.',
      content: `### Karakteristik Khusus Cyberbullying
- **Jangkauan Luas:** Dapat disaksikan ribuan pasang mata dalam hitungan detik.
- **Anonimitas Semu:** Pelaku sering merasa terlindungi di balik akun samaran/fake account.
- **Dampak 24/7:** Korban merasa diteror bahkan saat berada di dalam kamar tidur.

### 4 Langkah Menghadapi Cyberbullying
1. **Screenshot Segera:** Ambil tangkapan layar lengkap dengan nama akun, tanggal, dan jam kejadian.
2. **Jangan Membalas dengan Emosi:** Respons agresif sering digunakan pelaku untuk membalikkan tuduhan.
3. **Blokir & Laporkan Fitur Medsos:** Manfaatkan fitur 'Report' pada platform Instagram, TikTok, atau WhatsApp.
4. **Laporkan ke Satgas Sekolah melalui RUANGAMAN:** Sertakan file screenshot saat mengisi form laporan!`,
      media_url: null,
      cover_path: '/images/education/cyberbullying.webp',
      reading_minutes: 6,
      is_published: true,
      created_by_admin_id: 'a0000001-0000-0000-0000-000000000003',
      created_at: '2026-11-04T08:00:00.000Z',
      updated_at: '2026-11-04T08:00:00.000Z',
    },
    {
      id: 'e0000001-0000-0000-0000-000000000005',
      title: 'Dampak Perundungan Terhadap Kesehatan Mental Siswa',
      slug: 'dampak-perundungan-kesehatan-mental',
      category: 'Kesehatan Mental',
      summary: 'Mulai dari penurunan prestasi akademik, kecemasan sosial, hingga depresi berat. Jangan biarkan korban berjuang sendirian.',
      content: `### Dampak pada Korban
- **Fisik:** Sakit kepala psikosomatis, sakit perut sebelum berangkat sekolah, insomnia.
- **Akademik:** Sulit berkonsentrasi, nilai ujian menurun, enggan masuk sekolah (membolos).
- **Emosional:** Merasa cemas berlebihan, rendah diri, kehilangan minat pada hobi, hingga ide bunuh diri.

### Dampak pada Pelaku & Saksi Mata
Pelaku perundungan yang tidak ditangani berisiko tinggi mengembangkan perilaku kriminal di masa dewasa. Sementara saksi mata (*bystander*) sering mengalami rasa bersalah berkepanjangan dan ketakutan akan menjadi sasaran berikutnya.`,
      media_url: null,
      cover_path: '/images/education/dampak-mental.webp',
      reading_minutes: 5,
      is_published: true,
      created_by_admin_id: 'a0000001-0000-0000-0000-000000000002',
      created_at: '2026-11-05T08:00:00.000Z',
      updated_at: '2026-11-05T08:00:00.000Z',
    },
    {
      id: 'e0000001-0000-0000-0000-000000000006',
      title: 'Menjadi Upstander: Cara Efektif Membantu Teman',
      slug: 'cara-membantu-teman-upstander',
      category: 'Aksi Nyata',
      summary: '57% insiden perundungan berhenti dalam 10 detik ketika saksi mengambil tindakan bijak.',
      content: `### Bedanya Bystander vs Upstander
- **Bystander:** Penonton yang hanya diam, menonton, merekam video, atau bahkan tertawa.
- **Upstander:** Seseorang yang memiliki empati dan mengambil langkah konkret untuk melindungi sesama.

### Teknik 4D untuk Upstander:
1. **Direct (Langsung):** Tegur dengan tenang jika situasi aman: "Hei, itu tidak lucu sama sekali."
2. **Distract (Alihkan):** Buat distraksi, ajak korban pergi: "Eh Budi, dicari Pak Guru di perpustakaan sekarang."
3. **Delegate (Minta Bantuan):** Segera laporkan ke guru piket, wali kelas, atau satpam sekolah.
4. **Delay (Dukung Nanti):** Setelah insiden selesai, datangi korban: "Kamu tidak apa-apa? Aku melihat kejadian tadi, kamu tidak bersalah."`,
      media_url: null,
      cover_path: '/images/education/upstander.webp',
      reading_minutes: 5,
      is_published: true,
      created_by_admin_id: 'a0000001-0000-0000-0000-000000000003',
      created_at: '2026-11-06T08:00:00.000Z',
      updated_at: '2026-11-06T08:00:00.000Z',
    },
    {
      id: 'e0000001-0000-0000-0000-000000000007',
      title: 'Panduan Praktis Melapor Secara Aman di RUANGAMAN',
      slug: 'panduan-praktis-melapor-aman',
      category: 'Panduan Lapor',
      summary: 'Ketahui hak Anda untuk memilih mode anonim dan bagaimana kode pelacakan melindungi privasi Anda.',
      content: `### Prinsip Perlindungan Identitas RUANGAMAN
Platform RUANGAMAN dibuat untuk memberikan rasa aman penuh bagi siswa yang ragu melapor karena takut ancaman balas dendam.

### Fitur Perlindungan:
- **Mode Anonim Murni:** Anda tidak diwajibkan mencantumkan nama dan nomor telepon.
- **Kode Pelacakan Unik:** Anda memegang kendali atas kode unik seperti 'RA-2026-XXXX'. Cukup simpan kodenya untuk melihat perkembangan kasus.
- **Enkripsi & Kerahasiaan:** Laporan hanya dapat diakses oleh tim Satgas Anti-Kekerasan dan Guru BK yang terikat kode etik kerahasiaan.`,
      media_url: null,
      cover_path: '/images/education/panduan-lapor.webp',
      reading_minutes: 3,
      is_published: true,
      created_by_admin_id: 'a0000001-0000-0000-0000-000000000001',
      created_at: '2026-11-07T08:00:00.000Z',
      updated_at: '2026-11-07T08:00:00.000Z',
    },
  ];

  async listMaterials(search?: string, category?: string): Promise<EducationMaterial[]> {
    let result = this.materials.filter((m) => m.is_published);

    const normalizedCategory = category?.trim();
    if (normalizedCategory && !['semua', 'all'].includes(normalizedCategory.toLowerCase())) {
      result = result.filter(
        (m) => m.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (search && search.trim() !== '') {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.summary.toLowerCase().includes(q) ||
          m.content.toLowerCase().includes(q)
      );
    }

    return result.map((m) => ({ ...m }));
  }

  async findBySlug(slug: string): Promise<EducationMaterial | null> {
    const item = this.materials.find(
      (m) => m.slug.toLowerCase() === slug.toLowerCase() && m.is_published
    );
    return item ? { ...item } : null;
  }

  async findById(id: string): Promise<EducationMaterial | null> {
    const item = this.materials.find((m) => m.id === id && m.is_published);
    return item ? { ...item } : null;
  }

  async getCategories(): Promise<string[]> {
    const set = new Set(this.materials.map((m) => m.category));
    return Array.from(set);
  }
}

export const educationRepository = new MockEducationRepository();
