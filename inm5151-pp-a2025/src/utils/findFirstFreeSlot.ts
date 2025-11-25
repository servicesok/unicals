export interface BusyInterval {
  start: Date;
  end: Date;
}

/**
 * Trouve le premier créneau libre assez long dans la fenêtre.
 * Règle : pas de chevauchement avec les intervalles occupés.
 */
export function findFirstFreeSlot(
  durationMinutes: number,
  windowStart: Date,
  windowEnd: Date,
  busyIntervals: BusyInterval[]
): { start: Date; end: Date } | null {
  const millis = durationMinutes * 60 * 1000;
  const sorted = [...busyIntervals].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  let cursor = new Date(windowStart);

  for (const interval of sorted) {
    if (interval.end <= cursor) continue;

    if (interval.start.getTime() - cursor.getTime() >= millis) {
      const potentialEnd = new Date(cursor.getTime() + millis);
      if (potentialEnd <= windowEnd) {
        return { start: new Date(cursor), end: potentialEnd };
      }
    }

    if (interval.end > cursor) {
      cursor = new Date(interval.end);
    }

    if (cursor >= windowEnd) return null;
  }

  if (windowEnd.getTime() - cursor.getTime() >= millis) {
    return { start: cursor, end: new Date(cursor.getTime() + millis) };
  }

  return null;
}
