import { IReportRepository } from '../repositories/interfaces/report.repository.interface.js';
import { reportRepository } from '../repositories/mock/report.repository.js';

export class TrackingService {
  constructor(private repo: IReportRepository = reportRepository) {}

  async trackReport(trackingCode: string) {
    if (!trackingCode || trackingCode.trim() === '') {
      throw new Error('Kode pelacakan wajib diisi');
    }

    const report = await this.repo.findByTrackingCode(trackingCode.trim());
    if (!report) {
      return null;
    }

    const category = await this.repo.getCategoryById(report.category_id);
    const histories = await this.repo.getHistoriesByReportId(report.id);

    // Filter timeline for public view: ONLY public_message, NO internal_note, NO admin identifiers
    const publicTimeline = histories.map((h) => ({
      status: h.new_status,
      created_at: h.created_at,
      public_message: h.public_message,
    }));

    // Strict privacy guarantee: DO NOT expose chronology, reporter_name, reporter_contact, internal_note
    return {
      tracking_code: report.tracking_code,
      category_name: category ? category.name : 'Kategori Umum',
      incident_date: report.incident_date,
      incident_location: report.incident_location,
      status: report.status,
      created_at: report.created_at,
      updated_at: report.updated_at,
      resolved_at: report.resolved_at,
      timeline: publicTimeline,
    };
  }
}

export const trackingService = new TrackingService();
