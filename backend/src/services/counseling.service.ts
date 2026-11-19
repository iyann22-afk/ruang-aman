import { IAdminRepository } from '../repositories/interfaces/admin.repository.interface.js';
import {
  CreateBookingDTO,
  ICounselingRepository,
} from '../repositories/interfaces/counseling.repository.interface.js';
import { adminRepository } from '../repositories/mock/admin.repository.js';
import { counselingRepository } from '../repositories/mock/counseling.repository.js';

export class CounselingService {
  constructor(
    private counselingRepo: ICounselingRepository = counselingRepository,
    private adminRepo: IAdminRepository = adminRepository
  ) {}

  async getSlots() {
    const slots = await this.counselingRepo.listSlots();
    const admins = await this.adminRepo.listAdmins();
    const adminMap = new Map(admins.map((a) => [a.id, a.full_name]));

    return slots.map((s) => ({
      ...s,
      counselor_name: adminMap.get(s.counselor_admin_id) || 'Guru Bimbingan Konseling',
    }));
  }

  async bookSlot(dto: CreateBookingDTO) {
    const slot = await this.counselingRepo.findSlotById(dto.slot_id);
    if (!slot) {
      throw new Error('Slot jadwal konseling tidak ditemukan');
    }

    if (slot.status !== 'available') {
      throw new Error('Slot jadwal konseling ini sudah tidak tersedia');
    }

    const booking = await this.counselingRepo.createBooking(dto);
    return {
      ...booking,
      session_mode: slot.session_mode,
      start_at: slot.start_at,
      location: slot.location || 'Daring (Google Meet)',
      is_simulation: true,
    };
  }

  async getSupportResources() {
    return this.counselingRepo.listSupportResources();
  }
}

export const counselingService = new CounselingService();
