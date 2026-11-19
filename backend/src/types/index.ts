export type AdminRole = 'super_admin' | 'case_manager' | 'counselor';

export type ReportStatus =
  | 'submitted'
  | 'under_review'
  | 'need_more_info'
  | 'referred'
  | 'resolved'
  | 'closed';

export type IdentityMode = 'anonymous' | 'identified';

export type SupportResourceType =
  | 'hotline'
  | 'counselor'
  | 'medical'
  | 'legal'
  | 'foundation';

export type CounselingSessionMode = 'offline' | 'online';

export type CounselingSlotStatus = 'available' | 'booked' | 'completed' | 'cancelled';

export type CounselingBookingStatus = 'confirmed' | 'cancelled' | 'completed';

export type ContactMethod = 'whatsapp' | 'email' | 'telegram';

export interface Admin {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReportCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  tracking_code: string;
  category_id: string;
  incident_date: string;
  incident_location: string;
  chronology: string;
  identity_mode: IdentityMode;
  reporter_name: string | null;
  reporter_contact: string | null;
  status: ReportStatus;
  assigned_admin_id: string | null;
  privacy_acknowledged: boolean;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface ReportEvidence {
  id: string;
  report_id: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  uploaded_at: string;
}

export interface ReportStatusHistory {
  id: string;
  report_id: string;
  changed_by_admin_id: string | null;
  previous_status: ReportStatus | null;
  new_status: ReportStatus;
  public_message: string | null;
  internal_note: string | null;
  created_at: string;
}

export interface EducationMaterial {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  media_url: string | null;
  cover_path: string | null;
  reading_minutes: number;
  is_published: boolean;
  created_by_admin_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportResource {
  id: string;
  title: string;
  resource_type: SupportResourceType;
  description: string;
  contact_name: string | null;
  phone: string | null;
  website_url: string | null;
  operating_hours: string | null;
  location: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CounselingSlot {
  id: string;
  counselor_admin_id: string;
  start_at: string;
  end_at: string;
  session_mode: CounselingSessionMode;
  location: string | null;
  meeting_link: string | null;
  capacity: number;
  is_published: boolean;
  status: CounselingSlotStatus;
  created_at: string;
}

export interface CounselingBooking {
  id: string;
  slot_id: string;
  booking_code: string;
  student_name: string;
  contact_method: ContactMethod;
  contact_value: string;
  booking_status: CounselingBookingStatus;
  privacy_acknowledged: boolean;
  created_at: string;
  updated_at: string;
}

// API Standard Response
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field?: string; message: string }>;
}
