import { z } from 'zod';

export const createBookingSchema = z.object({
  slot_id: z.string({
    required_error: 'Slot jadwal konseling wajib dipilih',
  }).min(1, 'ID slot konseling tidak boleh kosong'),

  student_name: z.string({
    required_error: 'Nama atau inisial siswa wajib diisi',
  }).min(2, 'Nama minimal 2 karakter').max(150, 'Nama maksimal 150 karakter'),

  contact_method: z.enum(['whatsapp', 'email', 'telegram'], {
    required_error: 'Metode kontak wajib dipilih',
  }),

  contact_value: z.string({
    required_error: 'Nomor telepon atau alamat kontak wajib diisi',
  }).min(3, 'Kontak minimal 3 karakter').max(150, 'Kontak maksimal 150 karakter'),

  privacy_acknowledged: z.boolean().refine((val) => val === true, {
    message: 'Anda harus menyetujui komitmen privasi konseling',
  }),
});
