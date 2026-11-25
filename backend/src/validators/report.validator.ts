import { z } from 'zod';

export const createReportSchema = z.object({
  category_id: z.string({
    required_error: 'Kategori laporan wajib dipilih',
  }).min(1, 'Kategori laporan tidak boleh kosong'),

  incident_date: z.string({
    required_error: 'Tanggal kejadian wajib diisi',
  }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),

  incident_location: z.string({
    required_error: 'Lokasi kejadian wajib diisi',
  }).min(3, 'Lokasi kejadian minimal 3 karakter').max(255, 'Lokasi maksimal 255 karakter'),

  chronology: z.string({
    required_error: 'Kronologi kejadian wajib diceritakan',
  }).min(10, 'Kronologi kejadian minimal 10 karakter agar dapat ditelaah').max(5000, 'Kronologi maksimal 5000 karakter'),

  identity_mode: z.enum(['anonymous', 'identified'], {
    required_error: 'Pilih mode identitas (anonim atau dengan nama)',
  }),

  reporter_name: z.string().max(150).optional().nullable(),
  reporter_contact: z.string().max(150).optional().nullable(),

  privacy_acknowledged: z.boolean().refine((val) => val === true, {
    message: 'Anda harus menyetujui pernyataan privasi dan komitmen kebenaran data',
  }),
});

export const updateStatusSchema = z.object({
  status: z.enum(
    ['submitted', 'under_review', 'need_more_info', 'referred', 'resolved', 'closed'],
    { required_error: 'Status baru wajib ditentukan' }
  ),
  public_message: z.string().max(1000).optional().nullable(),
  internal_note: z.string().max(2000).optional().nullable(),
});

export const assignReportSchema = z.object({
  assigned_admin_id: z.string().uuid('ID Guru BK tidak valid').nullable().optional(),
  notes: z.string().max(500, 'Catatan penugasan maksimal 500 karakter').optional().nullable(),
});
