import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { reportService } from '../services/report.service.js';

export class ReportController {
  async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await reportService.getCategories();
      res.status(200).json({
        success: true,
        message: 'Kategori laporan berhasil dimuat',
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  }

  async submitReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      const result = await reportService.submitReport(req.body, file);
      res.status(201).json({
        success: true,
        message: 'Laporan Anda telah berhasil dikirim dan disimpan dengan aman dalam sistem terlindungi.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAdminReports(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, category_id, identity_mode, search, page, limit } = req.query;
      const result = await reportService.getAdminReportList(
        {
          status: status as any,
          category_id: category_id as string,
          identity_mode: identity_mode as any,
          search: search as string,
          page: page ? parseInt(page as string, 10) : 1,
          limit: limit ? parseInt(limit as string, 10) : 50,
        },
        req.admin
      );

      res.status(200).json({
        success: true,
        message: 'Daftar laporan berhasil diambil',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAdminReportDetail(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const detail = await reportService.getAdminReportDetail(id, req.admin);
      if (!detail) {
        res.status(404).json({
          success: false,
          message: 'Laporan dengan ID tersebut tidak ditemukan',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Detail laporan berhasil diambil',
        data: detail,
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: err.message || 'Terjadi kesalahan saat memuat detail laporan',
      });
    }
  }

  async getEvidenceSignedUrl(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const evidenceId = Array.isArray(req.params.evidenceId) ? req.params.evidenceId[0] : req.params.evidenceId;
      const url = await reportService.getEvidenceSignedUrl(id, evidenceId, req.admin);
      if (!url) {
        res.status(404).json({
          success: false,
          message: 'Bukti tidak ditemukan atau file tidak tersimpan di remote storage',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Signed URL berhasil dibuat',
        data: { signed_url: url },
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: err.message || 'Gagal membuat signed URL',
      });
    }
  }

  async updateReportStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status, public_message, internal_note } = req.body;
      const adminId = req.admin?.id;

      const updated = await reportService.updateReportStatus(
        id,
        status,
        adminId,
        public_message,
        internal_note,
        req.admin
      );

      res.status(200).json({
        success: true,
        message: 'Status laporan berhasil diperbarui',
        data: updated,
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: err.message || 'Gagal memperbarui status laporan',
      });
    }
  }

  async getAuditTrail(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const trail = await reportService.getAuditTrail(limit);

      res.status(200).json({
        success: true,
        message: 'Riwayat status audit trail berhasil dimuat',
        data: trail,
      });
    } catch (err) {
      next(err);
    }
  }

  async getDashboardSummary(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await reportService.getDashboardSummary();
      res.status(200).json({
        success: true,
        message: 'Ringkasan data dashboard berhasil dimuat',
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const reportController = new ReportController();
