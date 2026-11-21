import { v4 as uuidv4 } from 'uuid';
import { CounselingBooking, CounselingSlot, SupportResource } from '../../types/index.js';
import {
  CreateBookingDTO,
  ICounselingRepository,
} from '../interfaces/counseling.repository.interface.js';
import { supabaseAdmin } from './supabase.client.js';

function generateBookingCode(): string {
  return `BK-${uuidv4().split('-')[0].toUpperCase()}`;
}

export class SupabaseCounselingRepository implements ICounselingRepository {
  async listSlots(): Promise<CounselingSlot[]> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('counseling_slots')
      .select('*')
      .eq('status', 'available')
      .order('slot_date')
      .order('slot_time');
    if (error) return [];
    return (data as CounselingSlot[]) ?? [];
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

    // Periksa ketersediaan slot
    const slot = await this.findSlotById(dto.slot_id);
    if (!slot || slot.status !== 'available') {
      throw new Error('Slot konseling tidak tersedia');
    }

    const booking_code = generateBookingCode();

    // Buat booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('counseling_bookings')
      .insert({
        id: uuidv4(),
        slot_id: dto.slot_id,
        booking_code,
        student_name: dto.student_name,
        contact_method: dto.contact_method,
        contact_value: dto.contact_value,
        privacy_acknowledged: dto.privacy_acknowledged,
        status: 'confirmed',
      })
      .select()
      .single();

    if (bookingError || !booking) {
      throw new Error(`Gagal membuat booking: ${bookingError?.message}`);
    }

    // Update status slot
    await supabaseAdmin
      .from('counseling_slots')
      .update({ status: 'booked' })
      .eq('id', dto.slot_id);

    return booking as CounselingBooking;
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
      .eq('is_active', true)
      .order('name');
    if (error) return [];
    return (data as SupportResource[]) ?? [];
  }
}
