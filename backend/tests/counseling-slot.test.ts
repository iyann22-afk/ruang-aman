import { describe, expect, it } from 'vitest';
import { isUpcomingCounselingSlot } from '../src/utils/counseling-slot.js';

describe('isUpcomingCounselingSlot', () => {
  const now = new Date('2026-11-25T12:00:00.000Z');

  it('accepts a valid future slot', () => {
    expect(
      isUpcomingCounselingSlot(
        {
          start_at: '2026-11-25T13:00:00.000Z',
          end_at: '2026-11-25T14:00:00.000Z',
        },
        now
      )
    ).toBe(true);
  });

  it('rejects a slot whose start time has passed', () => {
    expect(
      isUpcomingCounselingSlot(
        {
          start_at: '2026-11-25T11:00:00.000Z',
          end_at: '2026-11-25T12:30:00.000Z',
        },
        now
      )
    ).toBe(false);
  });

  it('rejects a slot that starts exactly now', () => {
    expect(
      isUpcomingCounselingSlot(
        {
          start_at: now.toISOString(),
          end_at: '2026-11-25T13:00:00.000Z',
        },
        now
      )
    ).toBe(false);
  });

  it('rejects a slot that has already ended', () => {
    expect(
      isUpcomingCounselingSlot(
        {
          start_at: '2026-11-25T11:30:00.000Z',
          end_at: '2026-11-25T11:45:00.000Z',
        },
        now
      )
    ).toBe(false);
  });

  it('rejects invalid or reversed timestamps', () => {
    expect(
      isUpcomingCounselingSlot(
        {
          start_at: 'not-a-date',
          end_at: '2026-11-25T14:00:00.000Z',
        },
        now
      )
    ).toBe(false);

    expect(
      isUpcomingCounselingSlot(
        {
          start_at: '2026-11-25T14:00:00.000Z',
          end_at: '2026-11-25T13:00:00.000Z',
        },
        now
      )
    ).toBe(false);
  });
});
