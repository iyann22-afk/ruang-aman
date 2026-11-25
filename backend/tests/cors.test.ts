import { afterEach, describe, expect, it } from 'vitest';
import { isAllowedVercelPreviewOrigin } from '../src/config/cors.js';

const originalVercelEnv = process.env.VERCEL_ENV;

afterEach(() => {
  if (originalVercelEnv === undefined) {
    delete process.env.VERCEL_ENV;
  } else {
    process.env.VERCEL_ENV = originalVercelEnv;
  }
});

describe('Vercel Preview CORS origin allowlist', () => {
  it('allows a unique deployment hostname of the RUANGAMAN frontend in Preview', () => {
    process.env.VERCEL_ENV = 'preview';

    expect(
      isAllowedVercelPreviewOrigin('https://ruangaman-frontend-fw9bcoxd6-iyann22-afk.vercel.app')
    ).toBe(true);
  });

  it('allows the stable feature branch hostname in Preview', () => {
    process.env.VERCEL_ENV = 'preview';

    expect(
      isAllowedVercelPreviewOrigin(
        'https://ruangaman-frontend-git-feat-week-3-supabase-a8c3dc-iyann22-afk.vercel.app'
      )
    ).toBe(true);
  });

  it('rejects a different Vercel project hostname', () => {
    process.env.VERCEL_ENV = 'preview';

    expect(isAllowedVercelPreviewOrigin('https://other-project-iyann22-afk.vercel.app')).toBe(false);
  });

  it('rejects non-HTTPS origins', () => {
    process.env.VERCEL_ENV = 'preview';

    expect(
      isAllowedVercelPreviewOrigin('http://ruangaman-frontend-fw9bcoxd6-iyann22-afk.vercel.app')
    ).toBe(false);
  });

  it('does not apply the wildcard allowlist outside Preview', () => {
    process.env.VERCEL_ENV = 'production';

    expect(
      isAllowedVercelPreviewOrigin('https://ruangaman-frontend-fw9bcoxd6-iyann22-afk.vercel.app')
    ).toBe(false);
  });
});
