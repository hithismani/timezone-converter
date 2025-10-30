// Utility functions for timezone conversion and formatting

export function formatForZone(date: Date | null, tz: string | null): string {
  if (!date || !tz) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, { timeZone: tz, dateStyle: 'medium', timeStyle: 'short' }).format(date);
  } catch {
    return date.toString();
  }
}

export function instantToLocalISO(instant: Date | null, tz: string | null): string {
  if (!instant || !tz) return '';
  try {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const parts: Record<string, string> = fmt.formatToParts(instant).reduce((a: Record<string, string>, p: Intl.DateTimeFormatPart) => {
      if (p.type !== 'literal') a[p.type] = p.value;
      return a;
    }, {});
    if (!parts.year) return '';
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  } catch {
    return '';
  }
}

export function getLocalHourDecimal(instant: Date | null, tz: string | null): number | null {
  if (!instant || !tz) return null;
  try {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit' });
    const parts: Record<string, string> = fmt.formatToParts(instant).reduce((a: Record<string, string>, p: Intl.DateTimeFormatPart) => {
      if (p.type !== 'literal') a[p.type] = p.value;
      return a;
    }, {});
    if (!parts.hour) return null;
    return Number(parts.hour) + Number(parts.minute) / 60;
  } catch {
    return null;
  }
}

export function formatTime12Hour(hh: number, mm: number): string {
  const hour12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  const ampm = hh >= 12 ? 'PM' : 'AM';
  return `${hour12}:${String(mm).padStart(2, '0')} ${ampm}`;
}

export function shortTimeForZone(date: Date | null, tz: string | null): string {
  if (!date || !tz) return '—';
  try {
    const fmt = new Intl.DateTimeFormat(undefined, { timeZone: tz, timeStyle: 'short' });
    return fmt.format(date);
  } catch {
    return formatForZone(date, tz);
  }
}

export function formatTimeWithDateIfDifferent(instant: Date | null, tz: string, baseInstant: Date | null, baseTz: string): string {
  if (!instant || !baseInstant) return '—';
  try {
    const tzDateParts = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(instant);
    const baseDateParts = new Intl.DateTimeFormat('en-US', { timeZone: baseTz, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(baseInstant);

    const tzDateStr = `${tzDateParts.find(p => p.type === 'year')?.value}-${tzDateParts.find(p => p.type === 'month')?.value}-${tzDateParts.find(p => p.type === 'day')?.value}`;
    const baseDateStr = `${baseDateParts.find(p => p.type === 'year')?.value}-${baseDateParts.find(p => p.type === 'month')?.value}-${baseDateParts.find(p => p.type === 'day')?.value}`;

    const timeStr = shortTimeForZone(instant, tz);
    const dateDiffers = tzDateStr !== baseDateStr;

    if (dateDiffers) {
      const dateStr = new Intl.DateTimeFormat('en-US', { timeZone: tz, month: 'short', day: 'numeric', year: 'numeric' }).format(instant);
      return `${dateStr} ${timeStr}`;
    }
    return timeStr;
  } catch {
    return shortTimeForZone(instant, tz);
  }
}

export function getShortTimezoneName(tz: string | null): string {
  if (!tz) return '';
  const parts = tz.split('/');
  return parts[parts.length - 1].replace(/_/g, ' ');
}

export function tzOffsetMinutes(tz: string | null, instant: Date | null): number | null {
  if (!tz || !instant) return null;
  try {
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const parts: Record<string, string> = fmt.formatToParts(instant).reduce((a: Record<string, string>, p: Intl.DateTimeFormatPart) => {
      if (p.type !== 'literal') a[p.type] = p.value;
      return a;
    }, {});
    if (!parts.year) return null;
    const epochLocal = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
    return (epochLocal - instant.getTime()) / 60000;
  } catch {
    return null;
  }
}

export function localYMD(tz: string | null, instant: Date | null): { year: number; month: number; day: number } | null {
  if (!tz || !instant) return null;
  try {
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit' });
    const parts: Record<string, string> = fmt.formatToParts(instant).reduce((a: Record<string, string>, p: Intl.DateTimeFormatPart) => {
      if (p.type !== 'literal') a[p.type] = p.value;
      return a;
    }, {});
    if (!parts.year) return null;
    return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
  } catch {
    return null;
  }
}

export function diffLabel(val: number | null): string {
  if (val == null) return '±?? hrs';
  const sign = val >= 0 ? '+' : '-';
  const abs = Math.abs(val);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''} hrs`;
}

export function parseLocalInputToDate(localValue: string, fromTz: string, timezones?: string[]): Date | null {
  if (!localValue || !fromTz) return null;

  const timezonePatterns = [
    /\b(UTC|GMT)\b/i,
    /\b(EST|EDT|CST|CDT|MST|MDT|PST|PDT)\b/i,
    /\b(Asia\/[A-Za-z_]+)\b/i,
    /\b(Europe\/[A-Za-z_]+)\b/i,
    /\b(America\/[A-Za-z_]+)\b/i,
    /\b(Africa\/[A-Za-z_]+)\b/i,
    /\b(Australia\/[A-Za-z_]+)\b/i,
    /\b(Pacific\/[A-Za-z_]+)\b/i,
    /\b(Atlantic\/[A-Za-z_]+)\b/i,
    /\b(Indian\/[A-Za-z_]+)\b/i
  ];

  let inputTz = fromTz;
  let cleanValue = localValue;

  for (const pattern of timezonePatterns) {
    const match = localValue.match(pattern);
    if (match) {
      let detectedTz = match[0];

      const tzMap: Record<string, string> = {
        'UTC': 'UTC',
        'GMT': 'UTC',
        'EST': 'America/New_York',
        'EDT': 'America/New_York',
        'CST': 'America/Chicago',
        'CDT': 'America/Chicago',
        'MST': 'America/Denver',
        'MDT': 'America/Denver',
        'PST': 'America/Los_Angeles',
        'PDT': 'America/Los_Angeles'
      };

      if (tzMap[detectedTz.toUpperCase()]) {
        detectedTz = tzMap[detectedTz.toUpperCase()];
      }

      if (!timezones || timezones.includes(detectedTz)) {
        inputTz = detectedTz;
        cleanValue = localValue.replace(pattern, '').trim();
      }
      break;
    }
  }

  try {
    if (cleanValue.includes('T') && cleanValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)) {
      const [datePart, timePart] = cleanValue.split('T');
      const [y, m, d] = datePart.split('-').map(Number);
      const [hh, mm] = (timePart || '00:00').split(':').map(Number);

      const targetLocal = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      const noonUTC = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: inputTz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      let low = new Date(noonUTC.getTime() - 18 * 60 * 60 * 1000);
      let high = new Date(noonUTC.getTime() + 18 * 60 * 60 * 1000);

      for (let i = 0; i < 50; i++) {
        const mid = new Date((low.getTime() + high.getTime()) / 2);
        const parts: Record<string, string> = {};
        formatter.formatToParts(mid).forEach((p: Intl.DateTimeFormatPart) => {
          if (p.type !== 'literal') parts[p.type] = p.value;
        });

        if (!parts.year || !parts.month || !parts.day || !parts.hour || !parts.minute) {
          break;
        }

        const formattedISO = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;

        if (formattedISO === targetLocal) {
          return mid;
        } else if (formattedISO < targetLocal) {
          low = mid;
        } else {
          high = mid;
        }

        if (Math.abs(low.getTime() - high.getTime()) < 60000) {
          return mid;
        }
      }

      const testDateUTC = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      const testFormatted = formatter.formatToParts(testDateUTC).reduce((acc: Record<string, string>, p: Intl.DateTimeFormatPart) => {
        if (p.type !== 'literal') acc[p.type] = p.value;
        return acc;
      }, {});

      if (testFormatted.year && testFormatted.month && testFormatted.day && testFormatted.hour && testFormatted.minute) {
        const tzHour = Number(testFormatted.hour);
        const tzMinute = Number(testFormatted.minute);

        const tzTimeMinutes = tzHour * 60 + tzMinute;
        const utcTimeMinutes = 12 * 60;
        let offsetMinutes = tzTimeMinutes - utcTimeMinutes;

        if (offsetMinutes > 12 * 60) offsetMinutes -= 24 * 60;
        if (offsetMinutes < -12 * 60) offsetMinutes += 24 * 60;

        const targetMinutes = hh * 60 + mm;
        const utcTargetMinutes = targetMinutes - offsetMinutes;

        let utcHours = Math.floor(utcTargetMinutes / 60);
        let utcMins = utcTargetMinutes % 60;

        if (utcMins < 0) {
          utcMins += 60;
          utcHours -= 1;
        }
        if (utcHours < 0) {
          utcHours += 24;
        }
        if (utcHours >= 24) {
          utcHours -= 24;
        }

        return new Date(Date.UTC(y, m - 1, d, utcHours, utcMins, 0));
      }

      return testDateUTC;
    }

    const naturalDate = new Date(cleanValue);
    if (!isNaN(naturalDate.getTime())) {
      const y = naturalDate.getUTCFullYear();
      const m = naturalDate.getUTCMonth() + 1;
      const d = naturalDate.getUTCDate();
      const hh = naturalDate.getUTCHours();
      const mm = naturalDate.getUTCMinutes();

      const targetLocal = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      const noonUTC = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: inputTz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      let low = new Date(noonUTC.getTime() - 12 * 60 * 60 * 1000);
      let high = new Date(noonUTC.getTime() + 12 * 60 * 60 * 1000);

      for (let i = 0; i < 30; i++) {
        const mid = new Date((low.getTime() + high.getTime()) / 2);
        const parts: Record<string, string> = {};
        formatter.formatToParts(mid).forEach((p: Intl.DateTimeFormatPart) => {
          if (p.type !== 'literal') parts[p.type] = p.value;
        });

        if (!parts.year || !parts.month || !parts.day || !parts.hour || !parts.minute) {
          break;
        }

        const formattedISO = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;

        if (formattedISO === targetLocal) {
          return mid;
        } else if (formattedISO < targetLocal) {
          low = mid;
        } else {
          high = mid;
        }

        if (Math.abs(low.getTime() - high.getTime()) < 60000) {
          return mid;
        }
      }

      return naturalDate;
    }

    return null;
  } catch (e) {
    console.error('Error parsing date:', e);
    return null;
  }
}

export function fuzzySearch(q: string, timezones: string[], aliasMap: Record<string, string[]>): string[] {
  function norm(s: string): string {
    return (s || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  if (!q) return timezones;
  const nq = norm(q);
  const set = new Set<string>();
  
  Object.keys(aliasMap).forEach(k => {
    if (norm(k).includes(nq)) {
      aliasMap[k].forEach((tz: string) => set.add(tz));
    }
  });
  
  timezones.forEach(tz => {
    if (norm(tz).includes(nq) || norm(tz.replace(/\//g, ' ')).includes(nq)) {
      set.add(tz);
    }
  });
  
  return Array.from(set);
}

