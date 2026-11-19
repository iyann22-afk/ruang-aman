import { IReportRepository } from '../repositories/interfaces/report.repository.interface.js';
import { reportRepository } from '../repositories/mock/report.repository.js';
import { CreateReportDTO } from '../repositories/interfaces/report.repository.interface.js';
import { Report, ReportCategory } from '../types/index.js';

export class ReportService {
  constructor(private repo: IReportRepository = reportRepository) {}

  async getCategories(): Promise<ReportCategory[]> {
    return this.repo.getCategories();
  }

  async submitReport(
    dto: CreateReportDTO,
    file?: Express.Multer.File
  ): Promise<{
    tracking_code: string;
    status: string;
    created_at: string;
    has_evidence: boolean;
  }> {
    // 1. Verify Category exists
    const category = await this.repo.getCategoryById(dto.category_id);
    if (!category) {
      throw new Error('Kategori laporan tidak valid atau tidak ditemukan');
    }

    // 2. Enforce identity mode constraints
    const sanitizedDto: CreateReportDTO = {
      ...dto,
      reporter_name: dto.identity_mode === 'identified' ? dto.reporter_name?.trim() || null : null,
      reporter_contact: dto.identity_mode === 'identified' ? dto.reporter_contact?.trim() || null : null,
    };

    // 3. Create Report
    const report = await this.repo.createReport(sanitizedDto);

    // 4. Attach evidence if file is present
    let hasEvidence = false;
    if (file) {
      hasEvidence = true;
      const storagePath = `report-evidence-private/demo/${report.id}/${file.originalname}`;
      await this.repo.createEvidence({
        report_id: report.id,
        storage_path: storagePath,
        original_filename: file.originalname,
        mime_type: file.mimetype,
        file_size_bytes: file.size,
      });
    }

    return {
      tracking_code: report.tracking_code,
      status: report.status,
      created_at: report.created_at,
      has_evidence: hasEvidence,
    };
  }

  async getAdminReportList(filters?: any) {
    const { items, total } = await this.repo.listReports(filters);
    const categories = await this.repo.getCategories();
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const enrichedItems = items.map((r) => ({
      ...r,
      category_name: categoryMap.get(r.category_id) || 'Tidak Diketahui',
    }));

    return { items: enrichedItems, total };
  }

  async getAdminReportDetail(id: string) {
    const report = await this.repo.findById(id);
    if (!report) return null;

    const category = await this.repo.getCategoryById(report.category_id);
    const evidences = await this.repo.getEvidencesByReportId(report.id);
    const histories = await this.repo.getHistoriesByReportId(report.id);

    return {
      ...report,
      category_name: category ? category.name : 'Tidak Diketahui',
      evidences,
      histories,
    };
  }

  async updateReportStatus(
    id: string,
    status: any,
    adminId?: string,
    publicMessage?: string,
    internalNote?: string
  ) {
    const report = await this.repo.findById(id);
    if (!report) {
      throw new Error('Laporan tidak ditemukan');
    }

    const updated = await this.repo.updateStatus(
      id,
      status,
      adminId,
      publicMessage,
      internalNote
    );
    return updated;
  }

  async getAuditTrail(limit?: number) {
    const histories = await this.repo.getAllStatusHistories(limit);
    // Enrich with report tracking codes
    const reports = await this.repo.listReports({ limit: 100 });
    const reportMap = new Map(reports.items.map((r) => [r.id, r.tracking_code]));

    return histories.map((h) => ({
      ...h,
      tracking_code: reportMap.get(h.report_id) || 'N/A',
    }));
  }

  async getDashboardSummary() {
    return this.repo.getDashboardSummary();
  }
}

export const reportService = new ReportService();
