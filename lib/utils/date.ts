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

/**
 * Get day of week name from a date
 */
export function getDayName(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Check if a date is a weekend day
 */
export function isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Get remaining weekdays in the current week (excluding today)
 * Returns up to 4 days (the rest of the work week)
 */
export function getRemainingWeekdays(fromDate: Date): { date: Date; dateStr: string; dayName: string }[] {
    const result: { date: Date; dateStr: string; dayName: string }[] = [];
    const currentDay = fromDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate remaining weekdays until Friday (day 5)
    // If it's Saturday or Sunday, return empty
    if (currentDay === 0 || currentDay === 6) return result;
    
    // Days remaining until Friday
    for (let i = 1; i <= 5 - currentDay; i++) {
        const nextDate = addDays(fromDate, i);
        result.push({
            date: nextDate,
            dateStr: formatDate(nextDate),
            dayName: getDayName(nextDate),
        });
    }
    
    return result;
}

/**
 * Format a date for compact display (time-based)
 */
export function formatTimeAgo(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
