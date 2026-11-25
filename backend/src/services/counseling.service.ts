import { Admin } from '../types/index.js';
import { IAdminRepository } from '../repositories/interfaces/admin.repository.interface.js';
import {
  CreateBookingDTO,
  CreateCounselingSlotDTO,
  ICounselingRepository,
} from '../repositories/interfaces/counseling.repository.interface.js';
import { getRepositoriesSync } from '../repositories/repository.factory.js';
import { isUpcomingCounselingSlot } from '../utils/counseling-slot.js';

function serviceError(message: string, statusCode: number): Error {
  return Object.assign(new Error(message), { statusCode });
}

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
    return slots.map((slot) => ({
      ...slot,
      counselor_name: (slot.counselor_admin_id && adminMap.get(slot.counselor_admin_id)) || 'Guru Bimbingan Konseling',
    }));
  }

  async getAdminSlots(currentAdmin: Admin) {
    const counselorAdminId = currentAdmin.role === 'counselor' ? currentAdmin.id : undefined;
    const slots = await this.getCounselingRepository().listAdminSlots(counselorAdminId);
    const admins = await this.getAdminRepository().listAdmins();
    const adminMap = new Map(admins.map((admin) => [admin.id, admin.full_name]));
    return slots.map((slot) => ({
      ...slot,
      counselor_name: (slot.counselor_admin_id && adminMap.get(slot.counselor_admin_id)) || 'Guru Bimbingan Konseling',
    }));
  }

  async getActiveCounselors() {
    const admins = await this.getAdminRepository().listAdmins();
    return admins
      .filter((admin) => admin.is_active && admin.role === 'counselor')
      .map((admin) => ({ id: admin.id, full_name: admin.full_name }));
  }

  async createAdminSlot(
    dto: Omit<CreateCounselingSlotDTO, 'counselor_admin_id' | 'capacity'> & { counselor_admin_id?: string },
    currentAdmin: Admin
  ) {
    const startMs = Date.parse(dto.start_at);
    const endMs = Date.parse(dto.end_at);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      throw serviceError('Format tanggal atau waktu jadwal tidak valid.', 400);
    }
    if (startMs <= Date.now()) throw serviceError('Waktu mulai harus berada di masa depan.', 400);
    if (endMs <= startMs) throw serviceError('Waktu selesai harus setelah waktu mulai.', 400);

    let counselorAdminId = currentAdmin.id;
    if (currentAdmin.role !== 'counselor') {
      if (!dto.counselor_admin_id) {
        throw serviceError('Pilih Guru BK yang akan bertanggung jawab atas jadwal ini.', 400);
      }
      const assignedAdmin = await this.getAdminRepository().findById(dto.counselor_admin_id);
      if (!assignedAdmin || !assignedAdmin.is_active || assignedAdmin.role !== 'counselor') {
        throw serviceError('Guru BK yang dipilih tidak ditemukan atau tidak aktif.', 400);
      }
      counselorAdminId = assignedAdmin.id;
    }

    const existingSlots = await this.getCounselingRepository().listAdminSlots(counselorAdminId);
    const overlaps = existingSlots.some((slot) => {
      if (slot.status === 'cancelled') return false;
      const existingStart = Date.parse(slot.start_at);
      const existingEnd = Date.parse(slot.end_at);
      return Number.isFinite(existingStart) && Number.isFinite(existingEnd) &&
        startMs < existingEnd && endMs > existingStart;
    });
    if (overlaps) {
      throw serviceError('Jadwal bertabrakan dengan sesi lain milik Guru BK tersebut. Pilih waktu berbeda.', 409);
    }

    const created = await this.getCounselingRepository().createSlot({
      counselor_admin_id: counselorAdminId,
      start_at: dto.start_at,
      end_at: dto.end_at,
      session_mode: dto.session_mode,
      location: dto.session_mode === 'offline' ? dto.location : null,
      meeting_link: dto.session_mode === 'online' ? dto.meeting_link : null,
      capacity: 1,
    });
    const counselorName = currentAdmin.role === 'counselor'
      ? currentAdmin.full_name
      : (await this.getAdminRepository().findById(counselorAdminId))?.full_name || 'Guru Bimbingan Konseling';
    return { ...created, counselor_name: counselorName };
  }

  async bookSlot(dto: CreateBookingDTO) {
    const counselingRepo = this.getCounselingRepository();
    const slot = await counselingRepo.findSlotById(dto.slot_id);
    if (!slot) throw serviceError('Slot jadwal konseling tidak ditemukan', 404);
    if (slot.status !== 'available') throw serviceError('Slot jadwal konseling ini sudah tidak tersedia', 409);
    if (!isUpcomingCounselingSlot(slot)) {
      throw serviceError('Jadwal konseling telah lewat. Silakan pilih jadwal lain.', 409);
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
