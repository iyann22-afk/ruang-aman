import { IReportRepository } from '../repositories/interfaces/report.repository.interface.js';
import { getRepositoriesSync } from '../repositories/repository.factory.js';

export class TrackingService {
  constructor(private repo?: IReportRepository) {}

  private getRepository(): IReportRepository {
    if (this.repo) return this.repo;
    return getRepositoriesSync().reportRepository;
  }

  async trackReport(trackingCode: string) {
    if (!trackingCode || trackingCode.trim() === '') {
      throw new Error('Kode pelacakan wajib diisi');
    }

    const repo = this.getRepository();
    const report = await repo.findByTrackingCode(trackingCode.trim());
    if (!report) {
      return null;
    }

    const category = await repo.getCategoryById(report.category_id);
    const histories = await repo.getHistoriesByReportId(report.id);

    // Filter timeline untuk tampilan publik:
    // HANYA public_message yang aman; TIDAK ADA internal_note atau identitas admin
    const publicTimeline = histories.map((h) => ({
      status: h.new_status,
      created_at: h.created_at,
      public_message: h.public_message,
    }));

    // Strict Privacy Guarantee:
    // 1. Lokasi kejadian sensitif disamarkan demi privasi & keamanan pelapor/korban
    // 2. TIDAK menampilkan kronologi lengkap
    // 3. TIDAK menampilkan identitas/kontak pelapor
    // 4. TIDAK menampilkan catatan internal tim penanganan
    return {
      tracking_code: report.tracking_code,
      category_name: category ? category.name : 'Kategori Umum',
      incident_date: report.incident_date,
      incident_location: 'Lingkungan Sekolah (Dirahasiakan demi perlindungan)',
      status: report.status,
      created_at: report.created_at,
      updated_at: report.updated_at,
      resolved_at: report.resolved_at,
      timeline: publicTimeline,
    };
  }
}

export const trackingService = new TrackingService();
