import {
  deleteEvidenceFromStorage,
  getEvidenceSignedUrl,
  uploadEvidenceToStorage,
} from '../middleware/upload.middleware.js';
import {
  CreateReportDTO,
  IReportRepository,
  ReportFilterOptions,
} from '../repositories/interfaces/report.repository.interface.js';
import { getRepositoriesSync } from '../repositories/repository.factory.js';
import { Report, ReportCategory, ReportStatus } from '../types/index.js';

export class ReportService {
  constructor(private repo?: IReportRepository) {}

  private getRepository(): IReportRepository {
    if (this.repo) return this.repo;
    return getRepositoriesSync().reportRepository;
  }

  async getCategories(): Promise<ReportCategory[]> {
    return this.getRepository().getCategories();
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
    const repo = this.getRepository();

    // 1. Verify Category exists
    const category = await repo.getCategoryById(dto.category_id);
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
    const report = await repo.createReport(sanitizedDto);

    // 4. Attach evidence if file is present
    let hasEvidence = false;
    if (file) {
      let storagePath: string;

      // Upload ke storage — lempar error jika gagal di production
      storagePath = await uploadEvidenceToStorage(report.id, file);
      // uploadEvidenceToStorage sudah menangani dev fallback dan melempar error di production

      // Simpan metadata evidence ke database
      try {
        await repo.createEvidence({
          report_id: report.id,
          storage_path: storagePath,
          original_filename: file.originalname,
          mime_type: file.mimetype,
          file_size_bytes: file.size,
        });
        hasEvidence = true;
      } catch (dbError) {
        // Kompensasi: hapus file dari storage jika metadata DB gagal disimpan.
        // deleteEvidenceFromStorage menangani bucket name dan dev fallback secara konsisten.
        const deleted = await deleteEvidenceFromStorage(storagePath);
        if (!deleted) {
          console.error(`[kompensasi] Gagal menghapus file orphan dari storage: ${storagePath}`);
        }
        throw new Error(
          `Gagal menyimpan metadata bukti: ${dbError instanceof Error ? dbError.message : String(dbError)}`
        );
      }
    }

    return {
      tracking_code: report.tracking_code,
      status: report.status,
      created_at: report.created_at,
      has_evidence: hasEvidence,
    };
  }

  async getAdminReportList(filters?: ReportFilterOptions) {
    const repo = this.getRepository();
    const { items, total } = await repo.listReports(filters);
    const categories = await repo.getCategories();
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const enrichedItems = items.map((r) => ({
      ...r,
      category_name: categoryMap.get(r.category_id) || 'Tidak Diketahui',
    }));

    return { items: enrichedItems, total };
  }

  async getAdminReportDetail(id: string) {
    const repo = this.getRepository();
    const report = await repo.findById(id);
    if (!report) return null;

    const category = await repo.getCategoryById(report.category_id);
    const evidences = await repo.getEvidencesByReportId(report.id);
    const histories = await repo.getHistoriesByReportId(report.id);

    // Buat signed URL berbatas waktu untuk setiap bukti (hanya admin terautentikasi)
    const enrichedEvidences = await Promise.all(
      evidences.map(async (ev) => {
        let signedUrl: string | null = null;
        try {
          signedUrl = await getEvidenceSignedUrl(ev.storage_path);
        } catch {
          signedUrl = null;
        }
        return {
          ...ev,
          signed_url: signedUrl,
        };
      })
    );

    return {
      ...report,
      category_name: category ? category.name : 'Tidak Diketahui',
      evidences: enrichedEvidences,
      histories,
    };
  }

  async getEvidenceSignedUrl(reportId: string, evidenceId: string): Promise<string | null> {
    const repo = this.getRepository();
    const evidences = await repo.getEvidencesByReportId(reportId);
    const evidence = evidences.find((e) => e.id === evidenceId);
    if (!evidence) return null;
    return getEvidenceSignedUrl(evidence.storage_path);
  }

  async updateReportStatus(
    id: string,
    status: ReportStatus,
    adminId?: string,
    publicMessage?: string,
    internalNote?: string
  ) {
    const repo = this.getRepository();
    const report = await repo.findById(id);
    if (!report) {
      throw new Error('Laporan tidak ditemukan');
    }

    const updated = await repo.updateStatus(
      id,
      status,
      adminId,
      publicMessage,
      internalNote
    );
    return updated;
  }

  async getAuditTrail(limit?: number) {
    const repo = this.getRepository();
    const histories = await repo.getAllStatusHistories(limit);
    // Enrich with report tracking codes
    const reports = await repo.listReports({ limit: 100 });
    const reportMap = new Map(reports.items.map((r) => [r.id, r.tracking_code]));

    return histories.map((h) => ({
      ...h,
      tracking_code: reportMap.get(h.report_id) || 'N/A',
    }));
  }

  async getDashboardSummary() {
    return this.getRepository().getDashboardSummary();
  }
}

export const reportService = new ReportService();
