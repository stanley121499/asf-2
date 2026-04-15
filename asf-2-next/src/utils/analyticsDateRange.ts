/**
 * Returns a { from, to } date range for a human-readable time range label.
 * Uses plain Date arithmetic — no external date libraries required.
 *
 * Week boundaries follow ISO convention: Monday = start of week.
 * Quarter boundaries: Q1 = Jan–Mar, Q2 = Apr–Jun, Q3 = Jul–Sep, Q4 = Oct–Dec.
 *
 * @param label - One of the standard time range labels used across analytics pages.
 * @returns An object with `from` (start of range, midnight) and `to` (end of range, 23:59:59.999).
 */
export function getDateRange(label: string): { from: Date; to: Date } {
  const now = new Date();

  /** Returns a Date at midnight (00:00:00.000) for the given year/month/day. */
  function startOfDay(year: number, month: number, day: number): Date {
    return new Date(year, month, day, 0, 0, 0, 0);
  }

  /** Returns a Date at end-of-day (23:59:59.999) for the given year/month/day. */
  function endOfDay(year: number, month: number, day: number): Date {
    return new Date(year, month, day, 23, 59, 59, 999);
  }

  /** Returns the Monday of the week containing the given date (ISO week start). */
  function mondayOf(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const diff = day === 0 ? -6 : 1 - day; // shift so Monday = 0
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /** Returns the first month (0-indexed) of the quarter containing the given month. */
  function quarterStartMonth(month: number): number {
    return Math.floor(month / 3) * 3;
  }

  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed
  const d = now.getDate();

  switch (label) {
    case "Today":
      return {
        from: startOfDay(y, m, d),
        to: endOfDay(y, m, d),
      };

    case "Yesterday": {
      const yest = new Date(y, m, d - 1);
      return {
        from: startOfDay(yest.getFullYear(), yest.getMonth(), yest.getDate()),
        to: endOfDay(yest.getFullYear(), yest.getMonth(), yest.getDate()),
      };
    }

    case "This Week": {
      const monday = mondayOf(now);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        from: monday,
        to: endOfDay(sunday.getFullYear(), sunday.getMonth(), sunday.getDate()),
      };
    }

    case "Last Week": {
      const thisMonday = mondayOf(now);
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      return {
        from: lastMonday,
        to: endOfDay(lastSunday.getFullYear(), lastSunday.getMonth(), lastSunday.getDate()),
      };
    }

    case "This Month":
      return {
        from: startOfDay(y, m, 1),
        to: endOfDay(y, m + 1, 0), // day 0 of next month = last day of this month
      };

    case "Last Month": {
      const lastMonthDate = new Date(y, m - 1, 1);
      const lmy = lastMonthDate.getFullYear();
      const lmm = lastMonthDate.getMonth();
      return {
        from: startOfDay(lmy, lmm, 1),
        to: endOfDay(lmy, lmm + 1, 0),
      };
    }

    case "This Quarter": {
      const qStart = quarterStartMonth(m);
      return {
        from: startOfDay(y, qStart, 1),
        to: endOfDay(y, qStart + 3, 0),
      };
    }

    case "Last Quarter": {
      const thisQStart = quarterStartMonth(m);
      const prevQStart = thisQStart - 3;
      if (prevQStart < 0) {
        // Previous quarter is in the prior year (Q4)
        return {
          from: startOfDay(y - 1, 9, 1), // Oct 1 of prior year
          to: endOfDay(y - 1, 12, 0),    // Dec 31 of prior year
        };
      }
      return {
        from: startOfDay(y, prevQStart, 1),
        to: endOfDay(y, prevQStart + 3, 0),
      };
    }

    case "This Year":
      return {
        from: startOfDay(y, 0, 1),
        to: endOfDay(y, 12, 0),
      };

    case "Last Year":
      return {
        from: startOfDay(y - 1, 0, 1),
        to: endOfDay(y - 1, 12, 0),
      };

    default:
      // Unknown label → fall back to This Month
      return {
        from: startOfDay(y, m, 1),
        to: endOfDay(y, m + 1, 0),
      };
  }
}
