import { v4 as uuidv4 } from 'uuid';
import {
  Report,
  ReportCategory,
  ReportEvidence,
  ReportStatus,
  ReportStatusHistory,
} from '../../types/index.js';
import { generateTrackingCode } from '../../utils/entropy.js';
import {
  CreateReportDTO,
  IReportRepository,
  ReportFilterOptions,
} from '../interfaces/report.repository.interface.js';

export class MockReportRepository implements IReportRepository {
  private categories: ReportCategory[] = [
    {
      id: 'c0000001-0000-0000-0000-000000000001',
      name: 'Perundungan Fisik',
      slug: 'perundungan-fisik',
      description: 'Tindakan kekerasan fisik seperti memukul, menendang, mendorong, menjegal, memalak, atau merusak barang pribadi.',
      is_active: true,
      created_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'c0000001-0000-0000-0000-000000000002',
      name: 'Perundungan Verbal',
      slug: 'perundungan-verbal',
      description: 'Tindakan menghina, mencaci, memanggil dengan julukan merendahkan, mengejek kondisi fisik, atau mengancam secara lisan.',
      is_active: true,
      created_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'c0000001-0000-0000-0000-000000000003',
      name: 'Cyberbullying (Daring)',
      slug: 'cyberbullying',
      description: 'Pelecehan, pengucilan, penyebaran rumor palsu, teror digital, atau doxxing melalui media sosial dan aplikasi perpesanan.',
      is_active: true,
      created_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'c0000001-0000-0000-0000-000000000004',
      name: 'Perundungan Relasional / Sosial',
      slug: 'perundungan-sosial',
      description: 'Pengucilan secara sistematis, memfitnah, memanipulasi hubungan pertemanan untuk mengisolasi seseorang dari kelompok.',
      is_active: true,
      created_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'c0000001-0000-0000-0000-000000000005',
      name: 'Kekerasan Seksual & Pelecehan',
      slug: 'kekerasan-seksual',
      description: 'Segala bentuk ucapan, isyarat, sentuhan fisik, atau pemaksaan yang bernuansa seksual tanpa persetujuan.',
      is_active: true,
      created_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'c0000001-0000-0000-0000-000000000006',
      name: 'Pemerasan & Intimidasi',
      slug: 'pemerasan-intimidasi',
      description: 'Pemaksaan meminta uang jajan, barang, atau pekerjaan rumah (PR) dengan ancaman kekerasan atau pengucilan.',
      is_active: true,
      created_at: '2026-01-01T00:00:00.000Z',
    },
  ];

  private reports: Report[] = [
    {
      id: 'r0000001-0000-0000-0000-000000000001',
      tracking_code: 'RA-2026-F9X2K1',
      category_id: 'c0000001-0000-0000-0000-000000000001',
      incident_date: '2026-11-10',
      incident_location: 'Kantin Belakang Sekolah saat istirahat kedua',
      chronology: 'Seorang siswa kelas 10 diintimidasi dan didorong hingga jatuh oleh sekelompok siswa senior karena menolak membelikan makanan.',
      identity_mode: 'anonymous',
      reporter_name: null,
      reporter_contact: null,
      status: 'under_review',
      assigned_admin_id: 'a0000001-0000-0000-0000-000000000003',
      privacy_acknowledged: true,
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      resolved_at: null,
    },
    {
      id: 'r0000001-0000-0000-0000-000000000002',
      tracking_code: 'RA-2026-B4M8N7',
      category_id: 'c0000001-0000-0000-0000-000000000003',
      incident_date: '2026-11-12',
      incident_location: 'Grup WhatsApp Angkatan & Instagram Story',
      chronology: 'Penyebaran stiker foto teman sekelas yang diedit dengan kata-kata merendahkan martabat keluarga secara berulang.',
      identity_mode: 'identified',
      reporter_name: 'Andi Pratama',
      reporter_contact: '081234567890',
      status: 'referred',
      assigned_admin_id: 'a0000001-0000-0000-0000-000000000002',
      privacy_acknowledged: true,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      resolved_at: null,
    },
    {
      id: 'r0000001-0000-0000-0000-000000000003',
      tracking_code: 'RA-2026-K7L3P9',
      category_id: 'c0000001-0000-0000-0000-000000000002',
      incident_date: '2026-11-05',
      incident_location: 'Koridor Depan Lab Komputer',
      chronology: 'Pengejekan verbal nama orang tua setiap pergantian jam pelajaran oleh teman sekelas.',
      identity_mode: 'anonymous',
      reporter_name: null,
      reporter_contact: null,
      status: 'resolved',
      assigned_admin_id: 'a0000001-0000-0000-0000-000000000001',
      privacy_acknowledged: true,
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      resolved_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'r0000001-0000-0000-0000-000000000004',
      tracking_code: 'RA-2026-W3E5R8',
      category_id: 'c0000001-0000-0000-0000-000000000006',
      incident_date: '2026-11-17',
      incident_location: 'Area Parkir Motor Sekolah',
      chronology: 'Siswa dimintai uang parkir ilegal disertai ancaman ban motor dikempeskan jika tidak membayar.',
      identity_mode: 'anonymous',
      reporter_name: null,
      reporter_contact: null,
      status: 'submitted',
      assigned_admin_id: null,
      privacy_acknowledged: true,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      resolved_at: null,
    },
  ];

  private evidences: ReportEvidence[] = [
    {
      id: 'ev000001-0000-0000-0000-000000000001',
      report_id: 'r0000001-0000-0000-0000-000000000002',
      storage_path: 'local/r0000001-0000-0000-0000-000000000002/screenshot_wa.png',
      original_filename: 'screenshot_wa.png',
      mime_type: 'image/png',
      file_size_bytes: 345120,
      uploaded_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];

  private histories: ReportStatusHistory[] = [
    {
      id: 'h0000001-0000-0000-0000-000000000001',
      report_id: 'r0000001-0000-0000-0000-000000000001',
      changed_by_admin_id: 'a0000001-0000-0000-0000-000000000003',
      previous_status: 'submitted',
      new_status: 'under_review',
      public_message: 'Laporan telah diterima oleh Tim Satgas Pencegahan Kekerasan dan saat ini sedang ditelaah awal bukti kronologinya.',
      internal_note: 'Verifikasi awal lokasi CCTV kantin belakang sekolah untuk konfirmasi jam 12:15 WIB.',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'h0000001-0000-0000-0000-000000000002',
      report_id: 'r0000001-0000-0000-0000-000000000002',
      changed_by_admin_id: 'a0000001-0000-0000-0000-000000000002',
      previous_status: 'submitted',
      new_status: 'under_review',
      public_message: 'Laporan diverifikasi. Terindikasi perundungan siber pada kanal media sosial.',
      internal_note: 'Hubungi wali kelas 11 IPA 2 untuk koordinasi mediasi tertutup.',
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: 'h0000001-0000-0000-0000-000000000003',
      report_id: 'r0000001-0000-0000-0000-000000000002',
      changed_by_admin_id: 'a0000001-0000-0000-0000-000000000002',
      previous_status: 'under_review',
      new_status: 'referred',
      public_message: 'Kasus telah dirujuk ke Guru Bimbingan Konseling (BK) untuk sesi konseling pemulihan psikologis korban.',
      internal_note: 'Jadwalkan konseling tatap muka dengan orang tua kedua belah pihak.',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: 'h0000001-0000-0000-0000-000000000004',
      report_id: 'r0000001-0000-0000-0000-000000000003',
      changed_by_admin_id: 'a0000001-0000-0000-0000-000000000001',
      previous_status: 'under_review',
      new_status: 'resolved',
      public_message: 'Mediasi kekeluargaan dan bimbingan konseling telah selesai. Kedua pihak sepakat berdamai dan menandatangani surat komitmen tertulis.',
      internal_note: 'Evaluasi berkala setiap 2 minggu oleh guru BK untuk memastikan tidak ada relaps.',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];

  async getCategories(): Promise<ReportCategory[]> {
    return this.categories.filter((c) => c.is_active).map((c) => ({ ...c }));
  }

  async getCategoryById(id: string): Promise<ReportCategory | null> {
    const cat = this.categories.find((c) => c.id === id);
    return cat ? { ...cat } : null;
  }

  async createReport(dto: CreateReportDTO): Promise<Report> {
    const trackingCode = generateTrackingCode();
    const now = new Date().toISOString();

    const newReport: Report = {
      id: uuidv4(),
      tracking_code: trackingCode,
      category_id: dto.category_id,
      incident_date: dto.incident_date,
      incident_location: dto.incident_location,
      chronology: dto.chronology,
      identity_mode: dto.identity_mode,
      reporter_name: dto.identity_mode === 'identified' ? dto.reporter_name || null : null,
      reporter_contact: dto.identity_mode === 'identified' ? dto.reporter_contact || null : null,
      status: 'submitted',
      assigned_admin_id: null,
      privacy_acknowledged: dto.privacy_acknowledged,
      created_at: now,
      updated_at: now,
      resolved_at: null,
    };

    this.reports.unshift(newReport);

    // Initial status history
    await this.appendStatusHistory({
      report_id: newReport.id,
      changed_by_admin_id: null,
      previous_status: null,
      new_status: 'submitted',
      public_message: 'Laporan berhasil dibuat dan masuk ke antrean verifikasi tim Satgas.',
      internal_note: 'Laporan baru diterima oleh sistem.',
    });

    return { ...newReport };
  }

  async findById(id: string): Promise<Report | null> {
    const report = this.reports.find((r) => r.id === id);
    return report ? { ...report } : null;
  }

  async findByTrackingCode(code: string): Promise<Report | null> {
    const report = this.reports.find(
      (r) => r.tracking_code.toUpperCase() === code.trim().toUpperCase()
    );
    return report ? { ...report } : null;
  }

  async listReports(filters?: ReportFilterOptions): Promise<{ items: Report[]; total: number }> {
    let result = [...this.reports];

    if (filters) {
      if (filters.status) {
        result = result.filter((r) => r.status === filters.status);
      }
      if (filters.category_id) {
        result = result.filter((r) => r.category_id === filters.category_id);
      }
      if (filters.identity_mode) {
        result = result.filter((r) => r.identity_mode === filters.identity_mode);
      }
      if (filters.search && filters.search.trim() !== '') {
        const q = filters.search.toLowerCase();
        result = result.filter(
          (r) =>
            r.tracking_code.toLowerCase().includes(q) ||
            r.incident_location.toLowerCase().includes(q) ||
            (r.reporter_name && r.reporter_name.toLowerCase().includes(q))
        );
      }
    }

    const total = result.length;
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const startIndex = (page - 1) * limit;
    const paginatedItems = result.slice(startIndex, startIndex + limit);

    return { items: paginatedItems.map((r) => ({ ...r })), total };
  }

  async updateStatus(
    id: string,
    status: ReportStatus,
    adminId?: string,
    publicMessage?: string,
    internalNote?: string
  ): Promise<Report | null> {
    const report = this.reports.find((r) => r.id === id);
    if (!report) return null;

    const previousStatus = report.status;
    report.status = status;
    report.updated_at = new Date().toISOString();
    if (status === 'resolved' || status === 'closed') {
      report.resolved_at = new Date().toISOString();
    }

    if (adminId) {
      report.assigned_admin_id = adminId;
    }

    await this.appendStatusHistory({
      report_id: report.id,
      changed_by_admin_id: adminId || null,
      previous_status: previousStatus,
      new_status: status,
      public_message: publicMessage || null,
      internal_note: internalNote || null,
    });

    return { ...report };
  }

  async appendStatusHistory(
    history: Omit<ReportStatusHistory, 'id' | 'created_at'>
  ): Promise<ReportStatusHistory> {
    const newHistory: ReportStatusHistory = {
      id: uuidv4(),
      report_id: history.report_id,
      changed_by_admin_id: history.changed_by_admin_id,
      previous_status: history.previous_status,
      new_status: history.new_status,
      public_message: history.public_message,
      internal_note: history.internal_note,
      created_at: new Date().toISOString(),
    };

    this.histories.unshift(newHistory);
    return { ...newHistory };
  }

  async getHistoriesByReportId(reportId: string): Promise<ReportStatusHistory[]> {
    return this.histories
      .filter((h) => h.report_id === reportId)
      .map((h) => ({ ...h }));
  }

  async getAllStatusHistories(limit: number = 50): Promise<ReportStatusHistory[]> {
    return this.histories.slice(0, limit).map((h) => ({ ...h }));
  }

  async createEvidence(
    evidence: Omit<ReportEvidence, 'id' | 'uploaded_at'>
  ): Promise<ReportEvidence> {
    const newEvidence: ReportEvidence = {
      id: uuidv4(),
      report_id: evidence.report_id,
      storage_path: evidence.storage_path,
      original_filename: evidence.original_filename,
      mime_type: evidence.mime_type,
      file_size_bytes: evidence.file_size_bytes,
      uploaded_at: new Date().toISOString(),
    };

    this.evidences.push(newEvidence);
    return { ...newEvidence };
  }

  async getEvidencesByReportId(reportId: string): Promise<ReportEvidence[]> {
    return this.evidences
      .filter((e) => e.report_id === reportId)
      .map((e) => ({ ...e }));
  }

  async getDashboardSummary(): Promise<{
    total_reports: number;
    new_reports: number;
    under_review: number;
    referred: number;
    resolved: number;
    closed: number;
    category_breakdown: Array<{ category: string; count: number }>;
    recent_reports: Report[];
    recent_activities: ReportStatusHistory[];
  }> {
    const total_reports = this.reports.length;
    const new_reports = this.reports.filter((r) => r.status === 'submitted').length;
    const under_review = this.reports.filter((r) => r.status === 'under_review' || r.status === 'need_more_info').length;
    const referred = this.reports.filter((r) => r.status === 'referred').length;
    const resolved = this.reports.filter((r) => r.status === 'resolved').length;
    const closed = this.reports.filter((r) => r.status === 'closed').length;

    const categoryCountMap: Record<string, number> = {};
    for (const cat of this.categories) {
      categoryCountMap[cat.name] = 0;
    }
    for (const r of this.reports) {
      const cat = this.categories.find((c) => c.id === r.category_id);
      const name = cat ? cat.name : 'Lainnya';
      categoryCountMap[name] = (categoryCountMap[name] || 0) + 1;
    }

    const category_breakdown = Object.entries(categoryCountMap).map(([category, count]) => ({
      category,
      count,
    }));

    const recent_reports = this.reports.slice(0, 5).map((r) => ({ ...r }));
    const recent_activities = this.histories.slice(0, 5).map((h) => ({ ...h }));

    return {
      total_reports,
      new_reports,
      under_review,
      referred,
      resolved,
      closed,
      category_breakdown,
      recent_reports,
      recent_activities,
    };
  }
}

export const reportRepository = new MockReportRepository();
