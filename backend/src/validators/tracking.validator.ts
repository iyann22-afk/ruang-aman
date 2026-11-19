import { z } from 'zod';

export const trackReportSchema = z.object({
  tracking_code: z.string({
    required_error: 'Kode pelacakan wajib diisi',
  }).min(5, 'Kode pelacakan tidak valid').max(32, 'Kode pelacakan maksimal 32 karakter'),
});
