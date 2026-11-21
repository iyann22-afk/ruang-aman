import { v4 as uuidv4 } from 'uuid';
import {
  Report,
  ReportCategory,
  ReportEvidence,
  ReportStatus,
  ReportStatusHistory,
} from '../../types/index.js';
import {
  CreateReportDTO,
  IReportRepository,
  ReportFilterOptions,
} from '../interfaces/report.repository.interface.js';
import { supabaseAdmin } from './supabase.client.js';

function generateTrackingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'RA-';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export class SupabaseReportRepository implements IReportRepository {
  async createReport(dto: CreateReportDTO): Promise<Report> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');

    const tracking_code = generateTrackingCode();
    const { data, error } = await supabaseAdmin
      .from('reports')
      .insert({
        tracking_code,
        category_id: dto.category_id,
        incident_date: dto.incident_date,
        incident_location: dto.incident_location,
        chronology: dto.chronology,
        identity_mode: dto.identity_mode,
        reporter_name: dto.identity_mode === 'anonymous' ? null : dto.reporter_name ?? null,
        reporter_contact:
          dto.identity_mode === 'anonymous' ? null : dto.reporter_contact ?? null,
        reporter_user_id: null, // Selalu null saat create; diisi terpisah jika user consent
        privacy_acknowledged: dto.privacy_acknowledged,
        status: 'submitted',
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Gagal membuat laporan: ${error?.message}`);
    }
    return data as Report;
  }

  async findById(id: string): Promise<Report | null> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return data as Report;
  }

  async findByTrackingCode(code: string): Promise<Report | null> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('tracking_code', code.toUpperCase())
      .single();
    if (error || !data) return null;
    return data as Report;
  }

  async listReports(
    filters: ReportFilterOptions = {}
  ): Promise<{ items: Report[]; total: number }> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin.from('reports').select('*', { count: 'exact' });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.category_id) query = query.eq('category_id', filters.category_id);
    if (filters.identity_mode) query = query.eq('identity_mode', filters.identity_mode);
    if (filters.search) {
      query = query.or(
        `tracking_code.ilike.%${filters.search}%,incident_location.ilike.%${filters.search}%`
      );
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new Error(`Gagal mengambil daftar laporan: ${error.message}`);
    return { items: (data as Report[]) ?? [], total: count ?? 0 };
  }

  async updateStatus(
    id: string,
    status: ReportStatus,
    _adminId?: string,
    _publicMessage?: string,
    _internalNote?: string
  ): Promise<Report | null> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');

    const updateData: Record<string, unknown> = { status };
    if (status === 'resolved') updateData.resolved_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return null;
    return data as Report;
  }

  async appendStatusHistory(
    history: Omit<ReportStatusHistory, 'id' | 'created_at'>
  ): Promise<ReportStatusHistory> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');

    const { data, error } = await supabaseAdmin
      .from('report_status_histories')
      .insert({ ...history, id: uuidv4() })
      .select()
      .single();

    if (error || !data) throw new Error(`Gagal menyimpan riwayat status: ${error?.message}`);
    return data as ReportStatusHistory;
  }

  async getHistoriesByReportId(reportId: string): Promise<ReportStatusHistory[]> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('report_status_histories')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true });
    if (error) return [];
    return (data as ReportStatusHistory[]) ?? [];
  }

  async getAllStatusHistories(limit = 20): Promise<ReportStatusHistory[]> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('report_status_histories')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data as ReportStatusHistory[]) ?? [];
  }

  async getCategories(): Promise<ReportCategory[]> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('report_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) return [];
    return (data as ReportCategory[]) ?? [];
  }

  async getCategoryById(id: string): Promise<ReportCategory | null> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('report_categories')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return data as ReportCategory;
  }

  async createEvidence(
    evidence: Omit<ReportEvidence, 'id' | 'uploaded_at'>
  ): Promise<ReportEvidence> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('report_evidences')
      .insert({ ...evidence, id: uuidv4() })
      .select()
      .single();
    if (error || !data) throw new Error(`Gagal menyimpan bukti: ${error?.message}`);
    return data as ReportEvidence;
  }

  async getEvidencesByReportId(reportId: string): Promise<ReportEvidence[]> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('report_evidences')
      .select('*')
      .eq('report_id', reportId)
      .order('uploaded_at', { ascending: true });
    if (error) return [];
    return (data as ReportEvidence[]) ?? [];
  }

  async getDashboardSummary() {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');

    const [reports, histories, categories] = await Promise.all([
      supabaseAdmin.from('reports').select('*', { count: 'exact' }),
      supabaseAdmin
        .from('report_status_histories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),
      supabaseAdmin.from('report_categories').select('id, name').eq('is_active', true),
    ]);

    const allReports = (reports.data as Report[]) ?? [];
    const total_reports = reports.count ?? allReports.length;
    const new_reports = allReports.filter((r) => r.status === 'submitted').length;
    const under_review = allReports.filter((r) => r.status === 'under_review').length;
    const referred = allReports.filter((r) => r.status === 'referred').length;
    const resolved = allReports.filter((r) => r.status === 'resolved').length;
    const closed = allReports.filter((r) => r.status === 'closed').length;

    const categoryMap = new Map<string, string>();
    ((categories.data ?? []) as ReportCategory[]).forEach((c) => categoryMap.set(c.id, c.name));

    const countByCategory = new Map<string, number>();
    allReports.forEach((r) => {
      const name = categoryMap.get(r.category_id) ?? 'Tidak Diketahui';
      countByCategory.set(name, (countByCategory.get(name) ?? 0) + 1);
    });

    const category_breakdown = Array.from(countByCategory.entries()).map(
      ([category, count]) => ({ category, count })
    );

    const recent_reports = allReports.slice(0, 5);
    const recent_activities = (histories.data as ReportStatusHistory[]) ?? [];

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
