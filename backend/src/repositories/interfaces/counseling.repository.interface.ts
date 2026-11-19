import {
  CounselingBooking,
  CounselingSlot,
  SupportResource,
} from '../../types/index.js';

export interface CreateBookingDTO {
  slot_id: string;
  student_name: string;
  contact_method: 'whatsapp' | 'email' | 'telegram';
  contact_value: string;
  privacy_acknowledged: boolean;
}

export interface ICounselingRepository {
  listSlots(): Promise<CounselingSlot[]>;
  findSlotById(id: string): Promise<CounselingSlot | null>;
  createBooking(dto: CreateBookingDTO): Promise<CounselingBooking>;
  findBookingByCode(code: string): Promise<CounselingBooking | null>;
  listSupportResources(): Promise<SupportResource[]>;
}
