import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { CounselingBooking, CounselingSlot, SupportResource } from '../../types/index.js';
import {
  CreateBookingDTO,
  ICounselingRepository,
} from '../interfaces/counseling.repository.interface.js';
import { isUpcomingCounselingSlot } from '../../utils/counseling-slot.js';
import { supabaseAdmin } from './supabase.client.js';

function generateBookingCode(): string {
  // Gunakan crypto.randomBytes agar kode tidak mudah ditebak
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  let suffix = '';
  for (const byte of bytes) {
    suffix += chars[byte % chars.length];
  }
  return `BK-${suffix}`;
}

export class SupabaseCounselingRepository implements ICounselingRepository {
  async listSlots(): Promise<CounselingSlot[]> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    // Filter di database dan validasi ulang setelah respons untuk mencegah slot kedaluwarsa tampil.
    const now = new Date();
    const { data, error } = await supabaseAdmin
      .from('counseling_slots')
      .select('*')
      .eq('status', 'available')
      .eq('is_published', true)
      .gt('start_at', now.toISOString())
      .order('start_at', { ascending: true });
    if (error) return [];
    return ((data as CounselingSlot[]) ?? []).filter((slot) =>
      isUpcomingCounselingSlot(slot, now)
    );
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

    // Gunakan RPC atomik untuk mencegah double booking (SELECT FOR UPDATE).
    // Database juga memvalidasi waktu slot tepat sebelum booking dibuat.
    const { data, error } = await supabaseAdmin.rpc('book_counseling_slot', {
      p_slot_id: dto.slot_id,
      p_booking_code: booking_code,
      p_student_name: dto.student_name,
      p_contact_method: dto.contact_method,
      p_contact_value: dto.contact_value,
      p_privacy_acknowledged: dto.privacy_acknowledged,
    });

    if (error) {
      // Terjemahkan kode error RPC ke pesan yang ramah pengguna
      if (error.message?.includes('SLOT_NOT_FOUND')) {
        throw new Error('Slot konseling tidak ditemukan');
      }
      if (error.message?.includes('SLOT_EXPIRED')) {
        throw new Error('Jadwal konseling telah lewat. Silakan pilih jadwal lain.');
      }
      if (error.message?.includes('SLOT_UNAVAILABLE')) {
        throw new Error('Slot konseling sudah tidak tersedia atau telah dipesan');
      }
      if (error.message?.includes('SLOT_NOT_PUBLISHED')) {
        throw new Error('Slot konseling tidak aktif');
      }
      throw new Error(`Gagal membuat booking: ${error.message}`);
    }

    if (!data) {
      throw new Error('Booking gagal: tidak ada data yang dikembalikan');
    }

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
    // Kolom aktual skema 0001: title dan is_published (bukan name / is_active)
    const { data, error } = await supabaseAdmin
      .from('support_resources')
      .select('*')
      .eq('is_published', true)
      .order('title', { ascending: true });
    if (error) return [];
    return (data as SupportResource[]) ?? [];
  }
}
