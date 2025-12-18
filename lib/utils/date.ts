/**
 * Date Utilities - Consistent date handling across the app
 * 
 * IMPORTANT: Always use YYYY-MM-DD strings for task dates to avoid timezone issues.
 * When parsing, use `new Date(dateStr + 'T00:00:00')` to get local midnight.
 */

/**
 * Format a Date object to YYYY-MM-DD string
 */
export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
}

/**
 * Add days to a date (returns new Date, doesn't mutate)
 */
export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Format a date string for display (Today, Tomorrow, or "Mon, Dec 18")
 */
export function formatDisplayDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const tomorrow = addDays(today, 1);

    if (dateStr === formatDate(today)) return 'Today';
    if (dateStr === formatDate(tomorrow)) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Check if a date string represents today
 */
export function isToday(dateStr: string): boolean {
    return dateStr === formatDate(new Date());
}

/**
 * Get an array of date strings starting from a given date
 */
export function getDateRange(startDate: Date, days: number): string[] {
    return Array.from({ length: days }, (_, i) => 
        formatDate(addDays(startDate, i))
    );
}

/**
 * Calculate days between now and a date string
 */
export function daysAgo(dateStr: string): number {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
