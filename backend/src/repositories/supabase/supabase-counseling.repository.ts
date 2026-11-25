import { randomBytes } from 'crypto';
import { CounselingBooking, CounselingSlot, SupportResource } from '../../types/index.js';
import {
  CreateBookingDTO,
  CreateCounselingSlotDTO,
  ICounselingRepository,
} from '../interfaces/counseling.repository.interface.js';
import { isUpcomingCounselingSlot } from '../../utils/counseling-slot.js';
import { supabaseAdmin } from './supabase.client.js';

function generateBookingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  let suffix = '';
  for (const byte of bytes) suffix += chars[byte % chars.length];
  return `BK-${suffix}`;
}

export class SupabaseCounselingRepository implements ICounselingRepository {
  async listSlots(): Promise<CounselingSlot[]> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const now = new Date();
    const { data, error } = await supabaseAdmin
      .from('counseling_slots')
      .select('*')
      .eq('status', 'available')
      .eq('is_published', true)
      .gt('start_at', now.toISOString())
      .order('start_at', { ascending: true });
    if (error) throw new Error(`Gagal memuat slot konseling: ${error.message}`);
    return ((data as CounselingSlot[]) ?? []).filter((slot) => isUpcomingCounselingSlot(slot, now));
  }

  async listAdminSlots(counselorAdminId?: string): Promise<CounselingSlot[]> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    let query = supabaseAdmin
      .from('counseling_slots')
      .select('*')
      .order('start_at', { ascending: true });
    if (counselorAdminId) query = query.eq('counselor_admin_id', counselorAdminId);
    const { data, error } = await query;
    if (error) throw new Error(`Gagal memuat jadwal petugas: ${error.message}`);
    return (data as CounselingSlot[]) ?? [];
  }

  async createSlot(dto: CreateCounselingSlotDTO): Promise<CounselingSlot> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('counseling_slots')
      .insert({
        counselor_admin_id: dto.counselor_admin_id,
        start_at: dto.start_at,
        end_at: dto.end_at,
        session_mode: dto.session_mode,
        location: dto.location,
        meeting_link: dto.meeting_link,
        capacity: dto.capacity,
        is_published: true,
        status: 'available',
      })
      .select('*')
      .single();
    if (error || !data) {
      throw new Error(`Gagal membuat jadwal konseling: ${error?.message || 'Data tidak dikembalikan'}`);
    }
    return data as CounselingSlot;
  }

  async findSlotById(id: string): Promise<CounselingSlot | null> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('counseling_slots')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return data as CounselingSlot;
  }

  async createBooking(dto: CreateBookingDTO): Promise<CounselingBooking> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const booking_code = generateBookingCode();
    const { data, error } = await supabaseAdmin.rpc('book_counseling_slot', {
      p_slot_id: dto.slot_id,
      p_booking_code: booking_code,
      p_student_name: dto.student_name,
      p_contact_method: dto.contact_method,
      p_contact_value: dto.contact_value,
      p_privacy_acknowledged: dto.privacy_acknowledged,
    });
    if (error) {
      if (error.message?.includes('SLOT_NOT_FOUND')) {
        throw Object.assign(new Error('Slot konseling tidak ditemukan'), { statusCode: 404 });
      }
      if (error.message?.includes('SLOT_EXPIRED')) {
        throw Object.assign(new Error('Jadwal konseling telah lewat. Silakan pilih jadwal lain.'), { statusCode: 409 });
      }
      if (error.message?.includes('SLOT_UNAVAILABLE')) {
        throw Object.assign(new Error('Slot konseling sudah tidak tersedia atau telah dipesan'), { statusCode: 409 });
      }
      if (error.message?.includes('SLOT_NOT_PUBLISHED')) {
        throw Object.assign(new Error('Slot konseling tidak aktif'), { statusCode: 409 });
      }
      throw new Error(`Gagal membuat booking: ${error.message}`);
    }
    if (!data) throw new Error('Booking gagal: tidak ada data yang dikembalikan');
    return data as CounselingBooking;
  }

  async findBookingByCode(code: string): Promise<CounselingBooking | null> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('counseling_bookings')
      .select('*')
      .eq('booking_code', code.toUpperCase())
      .single();
    if (error || !data) return null;
    return data as CounselingBooking;
  }

  async listSupportResources(): Promise<SupportResource[]> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('support_resources')
      .select('*')
      .eq('is_published', true)
      .order('title', { ascending: true });
    if (error) return [];
    return (data as SupportResource[]) ?? [];
  }
}
