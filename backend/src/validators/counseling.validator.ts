import { z } from 'zod';

export const createBookingSchema = z.object({
  slot_id: z.string({ required_error: 'Slot jadwal konseling wajib dipilih' })
    .min(1, 'ID slot konseling tidak boleh kosong'),
  student_name: z.string({ required_error: 'Nama atau inisial siswa wajib diisi' })
    .min(2, 'Nama minimal 2 karakter').max(150, 'Nama maksimal 150 karakter'),
  contact_method: z.enum(['whatsapp', 'email', 'telegram'], {
    required_error: 'Metode kontak wajib dipilih',
  }),
  contact_value: z.string({ required_error: 'Nomor telepon atau alamat kontak wajib diisi' })
    .min(3, 'Kontak minimal 3 karakter').max(150, 'Kontak maksimal 150 karakter'),
  privacy_acknowledged: z.boolean().refine((val) => val === true, {
    message: 'Anda harus menyetujui komitmen privasi konseling',
  }),
});

export const createCounselingSlotSchema = z.object({
  counselor_admin_id: z.string().uuid('ID Guru BK tidak valid').optional(),
  start_at: z.string().datetime({ offset: true, message: 'Waktu mulai harus berupa tanggal ISO yang valid' }),
  end_at: z.string().datetime({ offset: true, message: 'Waktu selesai harus berupa tanggal ISO yang valid' }),
  session_mode: z.enum(['offline', 'online']),
  location: z.string().trim().max(255).optional().nullable(),
  meeting_link: z.string().trim().url('Tautan pertemuan tidak valid').max(255).optional().nullable(),
}).superRefine((value, ctx) => {
  if (value.session_mode === 'offline' && !value.location?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['location'],
      message: 'Lokasi wajib diisi untuk sesi tatap muka.',
    });
  }
  if (value.session_mode === 'online') {
    if (!value.meeting_link?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['meeting_link'],
        message: 'Tautan pertemuan wajib diisi untuk sesi online.',
      });
    } else if (!value.meeting_link.startsWith('https://')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['meeting_link'],
        message: 'Tautan pertemuan harus menggunakan HTTPS.',
      });
    }
  }
});
