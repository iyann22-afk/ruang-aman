export type ReportStatus =
  | 'submitted'
  | 'under_review'
  | 'need_more_info'
  | 'referred'
  | 'resolved'
  | 'closed';

export type IdentityMode = 'anonymous' | 'identified';

export interface ReportCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
}

export interface TimelineItem {
  status: ReportStatus;
  created_at: string;
  public_message?: string | null;
}

export interface TrackedReport {
  tracking_code: string;
  category_name: string;
  incident_date: string;
  incident_location: string;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  timeline: TimelineItem[];
}

export interface ReportEvidence {
  id: string;
  report_id: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  uploaded_at: string;
  signed_url?: string | null;
}

export interface ReportStatusHistory {
  id: string;
  report_id: string;
  tracking_code?: string;
  changed_by_admin_id: string | null;
  admin_name?: string;
  previous_status: ReportStatus | null;
  new_status: ReportStatus;
  public_message: string | null;
  internal_note: string | null;
  created_at: string;
}

export interface AdminReportDetail {
  id: string;
  tracking_code: string;
  category_id: string;
  category_name: string;
  incident_date: string;
  incident_location: string;
  chronology: string;
  identity_mode: IdentityMode;
  reporter_name?: string | null;
  reporter_contact?: string | null;
  status: ReportStatus;
  assigned_admin_id?: string | null;
  assigned_admin?: { id: string; full_name: string } | null;
  privacy_acknowledged: boolean;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  evidences: ReportEvidence[];
  histories: ReportStatusHistory[];
}

export interface AdminReportListItem {
  id: string;
  tracking_code: string;
  category_name: string;
  incident_date: string;
  incident_location: string;
  identity_mode: IdentityMode;
  status: ReportStatus;
  assigned_admin_id?: string | null;
  assigned_admin_name?: string | null;
  created_at: string;
}

export interface EducationMaterial {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  media_url?: string | null;
  cover_path?: string | null;
  reading_minutes: number;
  created_at: string;
}

export interface SupportResource {
  id: string;
  title: string;
  resource_type: string;
  description: string;
  contact_name?: string | null;
  phone?: string | null;
  website_url?: string | null;
  operating_hours?: string | null;
  location?: string | null;
}

export interface CounselingSlot {
  id: string;
  counselor_name: string;
  start_at: string;
  end_at: string;
  session_mode: 'offline' | 'online';
  location?: string | null;
  meeting_link?: string | null;
  capacity: number;
  status: string;
}

export interface AdminCounselingSlot extends CounselingSlot {
  counselor_admin_id: string;
  is_published: boolean;
  created_at: string;
}

export interface CounselingCounselorOption {
  id: string;
  full_name: string;
}

export interface CreateAdminCounselingSlotPayload {
  counselor_admin_id?: string;
  start_at: string;
  end_at: string;
  session_mode: 'offline' | 'online';
  location?: string | null;
  meeting_link?: string | null;
}

export interface CounselingBookingResult {
  booking_code: string;
  student_name: string;
  session_mode: string;
  start_at: string;
  location: string;
  meeting_link?: string | null;
  booking_status: string;
  is_simulation: boolean;
}

export type AdminRole = 'super_admin' | 'case_manager' | 'counselor';

export interface AdminProfile {
  id: string;
  full_name: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  permissions: string[];
}

export interface AdminPetugasItem {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  total_reports: number;
  new_reports: number;
  under_review: number;
  referred: number;
  resolved: number;
  closed: number;
  category_breakdown: Array<{ category: string; count: number }>;
  recent_reports: AdminReportListItem[];
  recent_activities: ReportStatusHistory[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field?: string; message: string }>;
}
