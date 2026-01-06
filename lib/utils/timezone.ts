/**
 * Timezone utilities for consistent date handling
 * All dates should be calculated in the user's timezone
 */

/**
 * Get today's date in YYYY-MM-DD format for a specific timezone
 */
export function getTodayInTimezone(timezone: string = 'America/Chicago'): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value;
  const day = parts.find(p => p.type === 'day')!.value;
  return `${year}-${month}-${day}`;
}

/**
 * Get current hour (0-23) in a specific timezone
 */
export function getCurrentHourInTimezone(timezone: string = 'America/Chicago'): number {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  });
  return parseInt(formatter.format(now));
}

/**
 * Format a date string to display in user's timezone
 */
export function formatDateInTimezone(date: Date | string, timezone: string = 'America/Chicago'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(d);
  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value;
  const day = parts.find(p => p.type === 'day')!.value;
  return `${year}-${month}-${day}`;
}
