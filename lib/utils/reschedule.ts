/**
 * Smart Rescheduling Utilities
 *
 * Helps ADHD users recover from mid-day derailment by intelligently
 * rescheduling remaining tasks to available time slots.
 */

import { Task } from '@/types';

export interface RescheduleResult {
    taskId: string;
    scheduledHour: number;
    scheduledMinute: number;
    timeBlock: 'morning' | 'afternoon' | 'evening';
}

/**
 * Smart reschedule algorithm for "Restart My Day" feature
 *
 * Strategy:
 * 1. Preserve Top 3 priorities (don't move them)
 * 2. Start from current time
 * 3. Fill available slots in chronological order
 * 4. Respect task duration estimates
 * 5. Pack efficiently without gaps
 */
export function smartReschedule(
    incompleteTasks: Task[],
    currentDate: Date = new Date()
): RescheduleResult[] {
    const results: RescheduleResult[] = [];
    const now = new Date(currentDate);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Separate Top 3 priorities from other tasks
    const topPriorities = incompleteTasks.filter(t => t.isTopPriority);
    const otherTasks = incompleteTasks.filter(t => !t.isTopPriority);

    // Top 3 stay where they are (we don't reschedule them)
    // Only reschedule the "other" tasks

    // Define time block boundaries
    const timeBlocks = {
        morning: { start: 6, end: 12 },
        afternoon: { start: 12, end: 17 },
        evening: { start: 17, end: 22 },
    };

    // Find the earliest available slot (current time or later)
    let nextAvailableHour = currentHour;
    let nextAvailableMinute = Math.ceil(currentMinute / 15) * 15; // Round up to next 15-min interval

    // If we're past 9pm, start tomorrow morning (edge case)
    if (nextAvailableHour >= 22) {
        console.log('[Reschedule] Too late today - would need to move to tomorrow');
        // For now, just don't reschedule anything
        return results;
    }

    // Adjust minute overflow
    if (nextAvailableMinute >= 60) {
        nextAvailableHour += 1;
        nextAvailableMinute = 0;
    }

    // Get all scheduled time slots (including Top 3 priorities) to avoid conflicts
    const occupiedSlots = new Set<string>();
    topPriorities.forEach(task => {
        if (task.scheduledHour !== null && task.scheduledHour !== undefined) {
            const duration = task.estimatedMinutes || 30;
            const endTime = task.scheduledHour * 60 + (task.scheduledMinute || 0) + duration;

            // Mark all 15-minute intervals as occupied
            for (let time = task.scheduledHour * 60 + (task.scheduledMinute || 0); time < endTime; time += 15) {
                const hour = Math.floor(time / 60);
                const minute = time % 60;
                occupiedSlots.add(`${hour}:${minute}`);
            }
        }
    });

    // Helper to check if a time slot is available
    const isSlotAvailable = (hour: number, minute: number, durationMinutes: number): boolean => {
        const endTime = hour * 60 + minute + durationMinutes;

        for (let time = hour * 60 + minute; time < endTime; time += 15) {
            const h = Math.floor(time / 60);
            const m = time % 60;

            // Check if outside working hours (6am-10pm)
            if (h < 6 || h >= 22) return false;

            // Check if occupied by Top 3 task
            if (occupiedSlots.has(`${h}:${m}`)) return false;
        }

        return true;
    };

    // Helper to find next available slot
    const findNextAvailableSlot = (fromHour: number, fromMinute: number, durationMinutes: number): { hour: number; minute: number } | null => {
        let testHour = fromHour;
        let testMinute = fromMinute;

        // Try every 15-minute interval until 10pm
        while (testHour < 22) {
            if (isSlotAvailable(testHour, testMinute, durationMinutes)) {
                return { hour: testHour, minute: testMinute };
            }

            // Advance by 15 minutes
            testMinute += 15;
            if (testMinute >= 60) {
                testHour += 1;
                testMinute = 0;
            }
        }

        return null; // No available slot found
    };

    // Sort other tasks by original scheduled time (if any), then by order
    const sortedTasks = [...otherTasks].sort((a, b) => {
        // Scheduled tasks first (maintain relative order)
        const aScheduled = a.scheduledHour !== null && a.scheduledHour !== undefined;
        const bScheduled = b.scheduledHour !== null && b.scheduledHour !== undefined;

        if (aScheduled && !bScheduled) return -1;
        if (!aScheduled && bScheduled) return 1;

        if (aScheduled && bScheduled) {
            const aTime = a.scheduledHour! * 60 + (a.scheduledMinute || 0);
            const bTime = b.scheduledHour! * 60 + (b.scheduledMinute || 0);
            if (aTime !== bTime) return aTime - bTime;
        }

        return (a.order || 0) - (b.order || 0);
    });

    // Schedule each task
    for (const task of sortedTasks) {
        const duration = task.estimatedMinutes || 30;

        const slot = findNextAvailableSlot(nextAvailableHour, nextAvailableMinute, duration);

        if (!slot) {
            console.log(`[Reschedule] No available slot for task: ${task.title}`);
            continue; // Skip this task - no room left today
        }

        // Determine time block
        let timeBlock: 'morning' | 'afternoon' | 'evening' = 'evening';
        if (slot.hour >= 6 && slot.hour < 12) timeBlock = 'morning';
        else if (slot.hour >= 12 && slot.hour < 17) timeBlock = 'afternoon';
        else if (slot.hour >= 17 && slot.hour < 22) timeBlock = 'evening';

        results.push({
            taskId: task.id,
            scheduledHour: slot.hour,
            scheduledMinute: slot.minute,
            timeBlock,
        });

        // Mark this slot as occupied
        const endTime = slot.hour * 60 + slot.minute + duration;
        for (let time = slot.hour * 60 + slot.minute; time < endTime; time += 15) {
            const h = Math.floor(time / 60);
            const m = time % 60;
            occupiedSlots.add(`${h}:${m}`);
        }

        // Update next available time to after this task
        nextAvailableHour = Math.floor(endTime / 60);
        nextAvailableMinute = endTime % 60;

        if (nextAvailableMinute >= 60) {
            nextAvailableHour += 1;
            nextAvailableMinute = 0;
        }

        console.log(`[Reschedule] Scheduled "${task.title}" at ${slot.hour}:${slot.minute.toString().padStart(2, '0')} (${duration}m) in ${timeBlock}`);
    }

    return results;
}

/**
 * Save a "What threw me off?" note to localStorage
 * (Can be enhanced later to save to database)
 */
export function saveRestartNote(note: string, date: Date = new Date()) {
    const dateStr = date.toISOString().split('T')[0];
    const key = `focusflow_restart_note_${dateStr}`;

    const existing = localStorage.getItem(key);
    const notes = existing ? JSON.parse(existing) : [];

    notes.push({
        timestamp: new Date().toISOString(),
        note,
    });

    localStorage.setItem(key, JSON.stringify(notes));
    console.log('[Restart] Saved note:', note);
}

/**
 * Get restart notes for a specific date
 */
export function getRestartNotes(date: Date = new Date()): Array<{ timestamp: string; note: string }> {
    const dateStr = date.toISOString().split('T')[0];
    const key = `focusflow_restart_note_${dateStr}`;

    const existing = localStorage.getItem(key);
    return existing ? JSON.parse(existing) : [];
}
