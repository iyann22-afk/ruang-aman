import { v4 as uuidv4 } from 'uuid';
import {
  CounselingBooking,
  CounselingSlot,
  SupportResource,
} from '../../types/index.js';
import { generateBookingCode } from '../../utils/entropy.js';
import {
  CreateBookingDTO,
  CreateCounselingSlotDTO,
  ICounselingRepository,
} from '../interfaces/counseling.repository.interface.js';

export class MockCounselingRepository implements ICounselingRepository {
  private slots: CounselingSlot[] = [
    {
      id: 'sl000001-0000-0000-0000-000000000001',
      counselor_admin_id: 'a0000001-0000-0000-0000-000000000002',
      start_at: new Date(Date.now() + 86400000 + 3600000 * 9).toISOString(), // Besok jam 09:00
      end_at: new Date(Date.now() + 86400000 + 3600000 * 10).toISOString(),
      session_mode: 'offline',
      location: 'Ruang Bimbingan Konseling Lt. 2 (Bilik Ramah Siswa)',
      meeting_link: null,
      capacity: 1,
      is_published: true,
      status: 'available',
      created_at: new Date().toISOString(),
    },
    {
      id: 'sl000001-0000-0000-0000-000000000002',
      counselor_admin_id: 'a0000001-0000-0000-0000-000000000002',
      start_at: new Date(Date.now() + 86400000 + 3600000 * 13).toISOString(), // Besok jam 13:00
      end_at: new Date(Date.now() + 86400000 + 3600000 * 14).toISOString(),
      session_mode: 'online',
      location: null,
      meeting_link: 'https://meet.google.com/demo-ruangaman-bk',
      capacity: 1,
      is_published: true,
      status: 'available',
      created_at: new Date().toISOString(),
    },
    {
      id: 'sl000001-0000-0000-0000-000000000003',
      counselor_admin_id: 'a0000001-0000-0000-0000-000000000002',
      start_at: new Date(Date.now() + 172800000 + 3600000 * 10).toISOString(), // Lusa jam 10:00
      end_at: new Date(Date.now() + 172800000 + 3600000 * 11).toISOString(),
      session_mode: 'offline',
      location: 'Ruang Bimbingan Konseling Lt. 2 (Bilik Ramah Siswa)',
      meeting_link: null,
      capacity: 1,
      is_published: true,
      status: 'available',
      created_at: new Date().toISOString(),
    },
    {
      id: 'sl000001-0000-0000-0000-000000000004',
      counselor_admin_id: 'a0000001-0000-0000-0000-000000000002',
      start_at: new Date(Date.now() + 172800000 + 3600000 * 14).toISOString(), // Lusa jam 14:00
      end_at: new Date(Date.now() + 172800000 + 3600000 * 15).toISOString(),
      session_mode: 'online',
      location: null,
      meeting_link: 'https://meet.google.com/demo-ruangaman-bk-2',
      capacity: 1,
      is_published: true,
      status: 'available',
      created_at: new Date().toISOString(),
    },
  ];

  private bookings: CounselingBooking[] = [
    {
      id: 'b0000001-0000-0000-0000-000000000001',
      slot_id: 'sl000001-0000-0000-0000-000000000001',
      booking_code: 'BK-2026-9A1B2C',
      student_name: 'Siswa Contoh (Kelas 11)',
      contact_method: 'whatsapp',
      contact_value: '081298765432',
      booking_status: 'confirmed',
      privacy_acknowledged: true,
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
  ];

  private supportResources: SupportResource[] = [
    {
      id: 's0000001-0000-0000-0000-000000000001',
      title: 'Layanan Sahabat Perempuan & Anak (SAPA 129)',
      resource_type: 'hotline',
      description: 'Layanan telepon darurat pengaduan kekerasan terhadap perempuan dan anak resmi Kementerian PPPA RI.',
      contact_name: 'KemenPPPA RI',
      phone: '129 / WhatsApp 08111-129-129',
      website_url: 'https://kemenpppa.go.id',
      operating_hours: '24 Jam Setiap Hari',
      location: 'Nasional',
      is_published: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 's0000001-0000-0000-0000-000000000002',
      title: 'Telepon Sahabat Anak (TEPSA 1500771)',
      resource_type: 'hotline',
      description: 'Dukungan respon cepat dari Kementerian Sosial RI untuk anak korban kekerasan dan penelantaran.',
      contact_name: 'Kementerian Sosial RI',
      phone: '1500771',
      website_url: 'https://kemensos.go.id',
      operating_hours: '24 Jam Bebas Pulsa',
      location: 'Nasional',
      is_published: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 's0000001-0000-0000-0000-000000000003',
      title: 'Ruang Bimbingan Konseling Sekolah (Bilik Ramah)',
      resource_type: 'counselor',
      description: 'Konseling empat mata bersama Guru Bimbingan Konseling yang bersertifikat dan berpegang pada kode etik kerahasiaan siswa.',
      contact_name: 'Budi Santoso, S.Psi., M.Psi.',
      phone: '0812-9988-7766 (Khusus Siswa)',
      website_url: null,
      operating_hours: 'Senin - Jumat: 08.00 - 15.00 WIB',
      location: 'Gedung A Lantai 2, Ruang BK',
      is_published: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 's0000001-0000-0000-0000-000000000004',
      title: 'KPAI (Komisi Perlindungan Anak Indonesia)',
      resource_type: 'legal',
      description: 'Lembaga independen negara untuk pengawasan perlindungan anak dan penanganan kasus kekerasan sistemik.',
      contact_name: 'Sekretariat KPAI',
      phone: '021-31901556',
      website_url: 'https://kpai.go.id',
      operating_hours: 'Senin - Jumat: 09.00 - 16.00 WIB',
      location: 'Jl. Teuku Umar No.10, Menteng, Jakarta Pusat',
      is_published: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  ];

  async listSlots(): Promise<CounselingSlot[]> {
    return this.slots
      .filter((s) => s.is_published && s.status === 'available')
      .map((s) => ({ ...s }));
  }

  async listAdminSlots(counselorAdminId?: string): Promise<CounselingSlot[]> {
    return this.slots
      .filter((slot) => !counselorAdminId || slot.counselor_admin_id === counselorAdminId)
      .map((slot) => ({ ...slot }));
  }

  async createSlot(dto: CreateCounselingSlotDTO): Promise<CounselingSlot> {
    const slot: CounselingSlot = {
      id: uuidv4(),
      counselor_admin_id: dto.counselor_admin_id,
      start_at: dto.start_at,
      end_at: dto.end_at,
      session_mode: dto.session_mode,
      location: dto.location,
      meeting_link: dto.meeting_link,
      capacity: dto.capacity,
      is_published: true,
      status: 'available',
      created_at: new Date().toISOString(),
    };
    this.slots.push(slot);
    return { ...slot };
  }

  async findSlotById(id: string): Promise<CounselingSlot | null> {
    const slot = this.slots.find((s) => s.id === id);
    return slot ? { ...slot } : null;
  }

  async createBooking(dto: CreateBookingDTO): Promise<CounselingBooking> {
    const slot = this.slots.find((s) => s.id === dto.slot_id);
    if (!slot) {
      throw new Error('Slot konseling tidak ditemukan');
    }

    slot.status = 'booked';

    const bookingCode = generateBookingCode();
    const newBooking: CounselingBooking = {
      id: uuidv4(),
      slot_id: dto.slot_id,
      booking_code: bookingCode,
      student_name: dto.student_name,
      contact_method: dto.contact_method,
      contact_value: dto.contact_value,
      booking_status: 'confirmed',
      privacy_acknowledged: dto.privacy_acknowledged,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.bookings.push(newBooking);
    return { ...newBooking };
  }

  async findBookingByCode(code: string): Promise<CounselingBooking | null> {
    const booking = this.bookings.find(
      (b) => b.booking_code.toUpperCase() === code.toUpperCase()
    );
    return booking ? { ...booking } : null;
  }

  async listSupportResources(): Promise<SupportResource[]> {
    return this.supportResources
      .filter((r) => r.is_published)
      .map((r) => ({ ...r }));
  }
}

export const counselingRepository = new MockCounselingRepository();
