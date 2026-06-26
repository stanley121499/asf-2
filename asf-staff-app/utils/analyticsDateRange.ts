/**
 * Returns a { from, to } date range for a human-readable time range label.
 * Ported from asf-2-next/src/utils/analyticsDateRange.ts — keep in sync.
 *
 * Week boundaries follow ISO convention: Monday = start of week.
 * Quarter boundaries: Q1 = Jan–Mar, Q2 = Apr–Jun, Q3 = Jul–Sep, Q4 = Oct–Dec.
 */
export function getDateRange(label: string): { from: Date; to: Date } {
  const now = new Date();

  function startOfDay(year: number, month: number, day: number): Date {
    return new Date(year, month, day, 0, 0, 0, 0);
  }
  function endOfDay(year: number, month: number, day: number): Date {
    return new Date(year, month, day, 23, 59, 59, 999);
  }
  function mondayOf(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function quarterStartMonth(month: number): number {
    return Math.floor(month / 3) * 3;
  }

  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  switch (label) {
    case "今天":
      return { from: startOfDay(y, m, d), to: endOfDay(y, m, d) };

    case "昨天": {
      const yest = new Date(y, m, d - 1);
      return {
        from: startOfDay(yest.getFullYear(), yest.getMonth(), yest.getDate()),
        to: endOfDay(yest.getFullYear(), yest.getMonth(), yest.getDate()),
      };
    }

    case "本周": {
      const monday = mondayOf(now);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { from: monday, to: endOfDay(sunday.getFullYear(), sunday.getMonth(), sunday.getDate()) };
    }

    case "上周": {
      const thisMonday = mondayOf(now);
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      return { from: lastMonday, to: endOfDay(lastSunday.getFullYear(), lastSunday.getMonth(), lastSunday.getDate()) };
    }

    case "本月":
      return { from: startOfDay(y, m, 1), to: endOfDay(y, m + 1, 0) };

    case "上月": {
      const lm = new Date(y, m - 1, 1);
      return { from: startOfDay(lm.getFullYear(), lm.getMonth(), 1), to: endOfDay(lm.getFullYear(), lm.getMonth() + 1, 0) };
    }

    case "本季度": {
      const qs = quarterStartMonth(m);
      return { from: startOfDay(y, qs, 1), to: endOfDay(y, qs + 3, 0) };
    }

    case "上季度": {
      const tqs = quarterStartMonth(m);
      const pqs = tqs - 3;
      if (pqs < 0) return { from: startOfDay(y - 1, 9, 1), to: endOfDay(y - 1, 12, 0) };
      return { from: startOfDay(y, pqs, 1), to: endOfDay(y, pqs + 3, 0) };
    }

    case "今年":
      return { from: startOfDay(y, 0, 1), to: endOfDay(y, 12, 0) };

    case "去年":
      return { from: startOfDay(y - 1, 0, 1), to: endOfDay(y - 1, 12, 0) };

    default:
      return { from: startOfDay(y, m, 1), to: endOfDay(y, m + 1, 0) };
  }
}

/** Formats an ISO date string "YYYY-MM-DD" to "M/D" */
export function fmtDate(iso: string): string {
  const parts = iso.split("-");
  return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
}

/** Formats a number as "RM X,XXX" */
export function fmtRM(amount: number): string {
  return `RM ${Math.round(amount).toLocaleString()}`;
}
