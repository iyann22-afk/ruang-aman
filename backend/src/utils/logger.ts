export interface LogMeta {
  requestId?: string;
  method?: string;
  url?: string;
  status?: number;
  [key: string]: any;
}

const SENSITIVE_KEYS = new Set([
  'chronology',
  'reporter_name',
  'reporter_contact',
  'contact_value',
  'password',
  'token',
  'authorization',
  'internal_note',
]);

function sanitize(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitize);

  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      cleaned[key] = '[REDACTED_PRIVACY]';
    } else if (typeof val === 'object') {
      cleaned[key] = sanitize(val);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

export const logger = {
  info: (msg: string, meta?: LogMeta) => {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] [${timestamp}] ${msg}`, meta ? sanitize(meta) : '');
  },
  warn: (msg: string, meta?: LogMeta) => {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN] [${timestamp}] ${msg}`, meta ? sanitize(meta) : '');
  },
  error: (msg: string, error?: any, meta?: LogMeta) => {
    const timestamp = new Date().toISOString();
    console.error(
      `[ERROR] [${timestamp}] ${msg}`,
      error?.message || error,
      meta ? sanitize(meta) : ''
    );
  },
};
