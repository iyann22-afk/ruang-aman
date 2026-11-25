import type { CounselingSlot } from '../types/index.js';

/**
 * Returns true only for a structurally valid counseling slot that has not started
 * and has not ended yet. The database query remains the primary filter; this
 * check is a defensive guard against stale responses and request timing races.
 */
export function isUpcomingCounselingSlot(
  slot: Pick<CounselingSlot, 'start_at' | 'end_at'>,
  now: Date = new Date()
): boolean {
  const startsAt = Date.parse(slot.start_at);
  const endsAt = Date.parse(slot.end_at);
  const nowMs = now.getTime();

  return (
    Number.isFinite(startsAt) &&
    Number.isFinite(endsAt) &&
    startsAt > nowMs &&
    endsAt > nowMs &&
    endsAt > startsAt
  );
}
