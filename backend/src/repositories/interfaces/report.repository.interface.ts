import {
  Report,
  ReportCategory,
  ReportEvidence,
  ReportStatus,
  ReportStatusHistory,
} from '../../types/index.js';

export interface CreateReportDTO {
  category_id: string;
  incident_date: string;
  incident_location: string;
  chronology: string;
  identity_mode: 'anonymous' | 'identified';
  reporter_name?: string | null;
  reporter_contact?: string | null;
  privacy_acknowledged: boolean;
}

export interface ReportFilterOptions {
  status?: ReportStatus;
  category_id?: string;
  identity_mode?: 'anonymous' | 'identified';
  assigned_admin_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface IReportRepository {
  createReport(dto: CreateReportDTO): Promise<Report>;
  findById(id: string): Promise<Report | null>;
  findByTrackingCode(code: string): Promise<Report | null>;
  listReports(filters?: ReportFilterOptions): Promise<{ items: Report[]; total: number }>;
  updateStatus(
    id: string,
    status: ReportStatus,
    adminId?: string,
    publicMessage?: string,
    internalNote?: string
  ): Promise<Report | null>;
  appendStatusHistory(
    history: Omit<ReportStatusHistory, 'id' | 'created_at'>
  ): Promise<ReportStatusHistory>;
  getHistoriesByReportId(reportId: string): Promise<ReportStatusHistory[]>;
  getAllStatusHistories(limit?: number): Promise<ReportStatusHistory[]>;
  getCategories(): Promise<ReportCategory[]>;
  getCategoryById(id: string): Promise<ReportCategory | null>;
  createEvidence(
    evidence: Omit<ReportEvidence, 'id' | 'uploaded_at'>
  ): Promise<ReportEvidence>;
  getEvidencesByReportId(reportId: string): Promise<ReportEvidence[]>;
  getDashboardSummary(): Promise<{
    total_reports: number;
    new_reports: number;
    under_review: number;
    referred: number;
    resolved: number;
    closed: number;
    category_breakdown: Array<{ category: string; count: number }>;
    recent_reports: Report[];
    recent_activities: ReportStatusHistory[];
  }>;
}
