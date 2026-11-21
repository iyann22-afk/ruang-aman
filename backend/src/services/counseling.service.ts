import { IAdminRepository } from '../repositories/interfaces/admin.repository.interface.js';
import {
  CreateBookingDTO,
  ICounselingRepository,
} from '../repositories/interfaces/counseling.repository.interface.js';
import { getRepositoriesSync } from '../repositories/repository.factory.js';

export class CounselingService {
  constructor(
    private counselingRepo?: ICounselingRepository,
    private adminRepo?: IAdminRepository
  ) {}

  private getCounselingRepository(): ICounselingRepository {
    if (this.counselingRepo) return this.counselingRepo;
    return getRepositoriesSync().counselingRepository;
  }

  private getAdminRepository(): IAdminRepository {
    if (this.adminRepo) return this.adminRepo;
    return getRepositoriesSync().adminRepository;
  }

  async getSlots() {
    const slots = await this.getCounselingRepository().listSlots();
    const admins = await this.getAdminRepository().listAdmins();
    const adminMap = new Map(admins.map((a) => [a.id, a.full_name]));

    return slots.map((s) => ({
      ...s,
      counselor_name: (s.counselor_admin_id && adminMap.get(s.counselor_admin_id)) || 'Guru Bimbingan Konseling',
    }));
  }

  async bookSlot(dto: CreateBookingDTO) {
    const counselingRepo = this.getCounselingRepository();
    const slot = await counselingRepo.findSlotById(dto.slot_id);
    if (!slot) {
      throw new Error('Slot jadwal konseling tidak ditemukan');
    }

    if (slot.status !== 'available') {
      throw new Error('Slot jadwal konseling ini sudah tidak tersedia');
    }

    const booking = await counselingRepo.createBooking(dto);
    return {
      ...booking,
      session_mode: slot.session_mode,
      start_at: slot.start_at,
      location: slot.location || 'Daring (Google Meet)',
      is_simulation: true,
    };
  }

  async getSupportResources() {
    return this.getCounselingRepository().listSupportResources();
  }
}

export const counselingService = new CounselingService();
