import {
  AdminProfile,
  AdminReportDetail,
  AdminReportListItem,
  ApiResponse,
  CounselingBookingResult,
  CounselingSlot,
  DashboardSummary,
  EducationMaterial,
  ReportCategory,
  ReportStatus,
  ReportStatusHistory,
  SupportResource,
  TrackedReport,
} from '../types/index.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('ruangaman_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...this.getAuthHeader(),
      ...(options.headers || {}),
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await res.json().catch(() => ({
      success: false,
      message: 'Gagal memproses respons server',
    }));

    if (!res.ok || !data.success) {
      const errorMessage =
        data.message || (data.errors && data.errors[0]?.message) || `HTTP Error ${res.status}`;
      const error: any = new Error(errorMessage);
      error.status = res.status;
      error.errors = data.errors;
      throw error;
    }

    return data.data as T;
  }

  // ==========================================
  // PUBLIC API CALLS
  // ==========================================

  async getHealth() {
    return this.request<{ success: boolean; message: string; version: string }>('/health');
  }

  async getCategories(): Promise<ReportCategory[]> {
    return this.request<ReportCategory[]>('/public/categories');
  }

  async submitReport(formData: FormData): Promise<{
    tracking_code: string;
    status: ReportStatus;
    created_at: string;
    has_evidence: boolean;
  }> {
    // When sending FormData, browser sets multipart/form-data boundary automatically
    const url = `${this.baseUrl}/public/reports`;
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json().catch(() => ({
      success: false,
      message: 'Gagal mengirim laporan',
    }));

    if (!res.ok || !data.success) {
      const errorMessage =
        data.message || (data.errors && data.errors[0]?.message) || `HTTP Error ${res.status}`;
      const error: any = new Error(errorMessage);
      error.status = res.status;
      error.errors = data.errors;
      throw error;
    }

    return data.data;
  }

  async trackReport(trackingCode: string): Promise<TrackedReport> {
    return this.request<TrackedReport>('/public/reports/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tracking_code: trackingCode.trim() }),
    });
  }

  async getEducationMaterials(search?: string, category?: string): Promise<EducationMaterial[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'Semua') params.append('category', category);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<EducationMaterial[]>(`/public/education${query}`);
  }

  async getEducationDetail(slug: string): Promise<EducationMaterial> {
    return this.request<EducationMaterial>(`/public/education/${slug}`);
  }

  async getSupportResources(): Promise<SupportResource[]> {
    return this.request<SupportResource[]>('/public/support-resources');
  }

  async getCounselingSlots(): Promise<CounselingSlot[]> {
    return this.request<CounselingSlot[]>('/public/counseling-slots');
  }

  async bookCounselingSlot(payload: {
    slot_id: string;
    student_name: string;
    contact_method: string;
    contact_value: string;
    privacy_acknowledged: boolean;
  }): Promise<CounselingBookingResult> {
    return this.request<CounselingBookingResult>('/public/counseling-bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  // ==========================================
  // ADMIN API CALLS
  // ==========================================

  async adminLogin(email: string, password: string): Promise<{ token: string; admin: AdminProfile }> {
    return this.request<{ token: string; admin: AdminProfile }>('/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.request<DashboardSummary>('/admin/dashboard/summary');
  }

  async getAdminReports(filters?: {
    status?: string;
    category_id?: string;
    identity_mode?: string;
    search?: string;
  }): Promise<{ items: AdminReportListItem[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.category_id && filters.category_id !== 'all') params.append('category_id', filters.category_id);
    if (filters?.identity_mode && filters.identity_mode !== 'all') params.append('identity_mode', filters.identity_mode);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ items: AdminReportListItem[]; total: number }>(`/admin/reports${query}`);
  }

  async getAdminReportDetail(id: string): Promise<AdminReportDetail> {
    return this.request<AdminReportDetail>(`/admin/reports/${id}`);
  }

  async updateReportStatus(
    id: string,
    payload: {
      status: ReportStatus;
      public_message?: string;
      internal_note?: string;
    }
  ): Promise<any> {
    return this.request(`/admin/reports/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  async getStatusHistory(): Promise<ReportStatusHistory[]> {
    return this.request<ReportStatusHistory[]>('/admin/status-history');
  }

  async getAdminProfile(): Promise<AdminProfile> {
    return this.request<AdminProfile>('/admin/profile');
  }
}

export const apiClient = new ApiClient();
