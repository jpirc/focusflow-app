/**
 * Date Utilities - Consistent date handling across the app
 * 
 * IMPORTANT: Always use YYYY-MM-DD strings for task dates to avoid timezone issues.
 * When parsing, use `new Date(dateStr + 'T00:00:00')` to get local midnight.
 */

/**
 * Parse a date string to a Date object at local midnight
 * This avoids the UTC interpretation issue with YYYY-MM-DD strings
 */
export function parseLocalDate(dateStr: string): Date {
    // Add T00:00:00 to force local timezone interpretation
    return new Date(dateStr + 'T00:00:00');
}

/**
 * Format a Date object to YYYY-MM-DD string (using local timezone)
 */
export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return '';
    // When parsing strings, use local midnight to avoid timezone shift
    const d = typeof date === 'string' ? parseLocalDate(date) : date;
    if (Number.isNaN(d.getTime())) return '';
    // Use local date components to avoid timezone issues
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    const date = parseLocalDate(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
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
    const date = parseLocalDate(dateStr);
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

/**
 * Get the next N days after a set of displayed days
 * Used for the upcoming days sidebar
 */
export function getUpcomingDays(
    currentDate: Date, 
    displayedDays: number, 
    count: number = 4
): { date: Date; dateStr: string; dayName: string; isWeekend: boolean }[] {
    const result: { date: Date; dateStr: string; dayName: string; isWeekend: boolean }[] = [];
    
    for (let i = 0; i < count; i++) {
        const date = addDays(currentDate, displayedDays + i);
        result.push({
            date,
            dateStr: formatDate(date),
            dayName: getDayName(date),
            isWeekend: isWeekend(date),
        });
    }
    
    return result;
}

/**
 * Get the start of the week (Sunday) for a given date
 */
export function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday
    d.setDate(d.getDate() - day);
    return d;
}

/**
 * Get dates for the current week (Sunday through Saturday)
 */
export function getWeekDates(date: Date): Date[] {
    const start = getWeekStart(date);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * Get days between today and a future date (for sidebar navigation)
 * When viewing a future date, shows days in between so user can navigate back
 */
export function getDaysBetweenTodayAndDate(
    targetDate: Date,
    excludeToday: boolean = true
): { date: Date; dateStr: string; dayName: string; isWeekend: boolean; isToday: boolean }[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    
    const result: { date: Date; dateStr: string; dayName: string; isWeekend: boolean; isToday: boolean }[] = [];
    
    // Calculate days between
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // If target is in the past or today, return empty
    if (diffDays <= 0) return result;
    
    // Add today if not excluded
    if (!excludeToday) {
        result.push({
            date: today,
            dateStr: formatDate(today),
            dayName: getDayName(today),
            isWeekend: isWeekend(today),
            isToday: true,
        });
    }
    
    // Add days between today and target (exclusive of target)
    for (let i = excludeToday ? 1 : 1; i < diffDays; i++) {
        const date = addDays(today, i);
        result.push({
            date,
            dateStr: formatDate(date),
            dayName: getDayName(date),
            isWeekend: isWeekend(date),
            isToday: false,
        });
    }
    
    return result;
}
