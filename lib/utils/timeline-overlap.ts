/**
 * Timeline Overlap Detection & Multi-Lane Rendering
 *
 * Algorithm inspired by react-big-calendar's overlap detection
 * Adapted for FocusFlow's ADHD-friendly timeline view
 *
 * Key concepts:
 * - Events that overlap in time are placed in separate "columns" (lanes)
 * - Column width = 100% / number of overlapping events
 * - Events are sorted: Earlier -> Up, Longer -> Left
 */

import { Task } from '@/types';

export interface StyledTask extends Task {
  // Layout properties for rendering
  column: number;      // Which column (0-indexed)
  columns: number;     // Total columns in this overlap group
  left: number;        // Left position as percentage (0-100)
  width: number;       // Width as percentage (0-100)
  top: number;         // Top position in pixels (from timeline start)
  height: number;      // Height in pixels (based on duration)
}

export interface OverlapGroup {
  startMinute: number; // Minutes from midnight (e.g., 540 = 9am)
  endMinute: number;
  tasks: StyledTask[];
}

/**
 * Convert hour/minute to minutes from midnight
 */
function toMinutes(hour: number, minute: number = 0): number {
  return hour * 60 + minute;
}

/**
 * Check if two tasks overlap in time
 */
function tasksOverlap(a: Task, b: Task): boolean {
  if (typeof a.scheduledHour !== 'number' || typeof b.scheduledHour !== 'number') return false;

  const aStart = toMinutes(a.scheduledHour, a.scheduledMinute || 0);
  const aEnd = aStart + (a.estimatedMinutes || 30);

  const bStart = toMinutes(b.scheduledHour, b.scheduledMinute || 0);
  const bEnd = bStart + (b.estimatedMinutes || 30);

  // Overlaps if: A starts before B ends AND B starts before A ends
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Sort tasks by start time (earlier first), then by duration (longer first)
 * This ensures better visual layout
 */
function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const aStart = toMinutes(a.scheduledHour!, a.scheduledMinute || 0);
    const bStart = toMinutes(b.scheduledHour!, b.scheduledMinute || 0);

    if (aStart !== bStart) {
      return aStart - bStart; // Earlier first
    }

    // Same start time: longer duration first
    const aDuration = a.estimatedMinutes || 30;
    const bDuration = b.estimatedMinutes || 30;
    return bDuration - aDuration;
  });
}

/**
 * Group tasks into overlapping clusters
 * Each cluster contains tasks that overlap with each other
 */
function groupOverlappingTasks(tasks: Task[]): Task[][] {
  if (tasks.length === 0) return [];

  const sorted = sortTasks(tasks);
  const groups: Task[][] = [];

  for (const task of sorted) {
    // Find a group this task overlaps with
    let foundGroup = false;

    for (const group of groups) {
      // Check if task overlaps with ANY task in this group
      if (group.some(t => tasksOverlap(task, t))) {
        group.push(task);
        foundGroup = true;
        break;
      }
    }

    // No overlap found, create new group
    if (!foundGroup) {
      groups.push([task]);
    }
  }

  return groups;
}

/**
 * Assign columns to tasks within an overlap group
 * Uses a greedy algorithm to minimize columns needed
 */
function assignColumns(tasks: Task[]): StyledTask[] {
  if (tasks.length === 0) return [];

  const sorted = sortTasks(tasks);
  const columns: StyledTask[][] = []; // Each column is an array of tasks

  for (const task of sorted) {
    const taskStart = toMinutes(task.scheduledHour!, task.scheduledMinute || 0);
    const taskEnd = taskStart + (task.estimatedMinutes || 30);

    // Find first column where this task doesn't overlap with existing tasks
    let assignedColumn = -1;

    for (let col = 0; col < columns.length; col++) {
      const columnTasks = columns[col];

      // Check if task fits in this column (no overlap with tasks in column)
      const fits = columnTasks.every(existingTask => {
        const existingStart = toMinutes(existingTask.scheduledHour!, existingTask.scheduledMinute || 0);
        const existingEnd = existingStart + (existingTask.estimatedMinutes || 30);

        // Tasks don't overlap if one ends before the other starts
        return taskEnd <= existingStart || existingEnd <= taskStart;
      });

      if (fits) {
        assignedColumn = col;
        break;
      }
    }

    // If no column found, create new column
    if (assignedColumn === -1) {
      assignedColumn = columns.length;
      columns.push([]);
    }

    // Add task to column
    const styledTask: StyledTask = {
      ...task,
      column: assignedColumn,
      columns: 0, // Will be set below
      left: 0,    // Will be calculated below
      width: 0,   // Will be calculated below
      top: 0,     // Will be calculated by renderer
      height: 0,  // Will be calculated by renderer
    };

    columns[assignedColumn].push(styledTask);
  }

  // Flatten columns back into single array and set column count
  const totalColumns = columns.length;
  const allTasks = columns.flat();

  // Calculate width and left position for each task
  allTasks.forEach(task => {
    task.columns = totalColumns;
    task.width = 100 / totalColumns; // Full width, cards can touch
    task.left = (task.column / totalColumns) * 100;
  });

  return allTasks;
}

/**
 * Main function: Calculate layout for all tasks in timeline
 * Returns tasks with column assignments and positioning
 */
export function calculateTimelineLayout(
  tasks: Task[],
  hourHeight: number = 80, // Height per hour in pixels
  startHour: number = 6    // Timeline starts at 6am
): StyledTask[] {
  // Filter only scheduled tasks (not floating)
  const scheduledTasks = tasks.filter(
    t => t.scheduledHour !== null && t.scheduledHour !== undefined
  );

  if (scheduledTasks.length === 0) return [];

  // Group overlapping tasks
  const groups = groupOverlappingTasks(scheduledTasks);

  // Assign columns within each group
  const styledTasksGroups = groups.map(group => assignColumns(group));

  // Flatten and calculate top/height positions
  const allStyledTasks = styledTasksGroups.flat();

  allStyledTasks.forEach(task => {
    const taskStart = toMinutes(task.scheduledHour!, task.scheduledMinute || 0);
    const minutesFromStart = taskStart - (startHour * 60);

    task.top = (minutesFromStart / 60) * hourHeight;
    task.height = ((task.estimatedMinutes || 30) / 60) * hourHeight;
  });

  return allStyledTasks;
}

/**
 * Get all overlap groups for visualization
 * Useful for debugging or showing overlap indicators
 */
export function getOverlapGroups(tasks: Task[]): OverlapGroup[] {
  const scheduledTasks = tasks.filter(
    t => t.scheduledHour !== null && t.scheduledHour !== undefined
  );

  const groups = groupOverlappingTasks(scheduledTasks);

  return groups.map(group => {
    const styledTasks = assignColumns(group);

    // Find earliest start and latest end
    const startMinute = Math.min(
      ...group.map(t => toMinutes(t.scheduledHour!, t.scheduledMinute || 0))
    );
    const endMinute = Math.max(
      ...group.map(t => {
        const start = toMinutes(t.scheduledHour!, t.scheduledMinute || 0);
        return start + (t.estimatedMinutes || 30);
      })
    );

    return {
      startMinute,
      endMinute,
      tasks: styledTasks,
    };
  });
}

/**
 * Check if a task can be scheduled at a specific time without conflicts
 * Returns true if no overlaps, or if overlaps are allowed (max 3 columns)
 */
export function canScheduleAt(
  taskId: string,
  hour: number,
  minute: number,
  duration: number,
  existingTasks: Task[],
  maxOverlaps: number = 3
): boolean {
  const proposedStart = toMinutes(hour, minute);
  const proposedEnd = proposedStart + duration;

  // Count how many tasks already overlap at this time
  const overlappingTasks = existingTasks.filter(t => {
    if (t.id === taskId) return false; // Don't count self
    if (typeof t.scheduledHour !== 'number') return false;

    const taskStart = toMinutes(t.scheduledHour, t.scheduledMinute || 0);
    const taskEnd = taskStart + (t.estimatedMinutes || 30);

    return proposedStart < taskEnd && taskStart < proposedEnd;
  });

  return overlappingTasks.length < maxOverlaps;
}

/**
 * Find next available time slot when conflicts exist
 */
export function findNextAvailableSlot(
  hour: number,
  minute: number,
  duration: number,
  existingTasks: Task[],
  maxHour: number = 22, // Don't schedule past 10pm
  snapInterval: number = 15 // Snap to 15-min intervals
): { hour: number; minute: number } | null {
  let currentMinute = toMinutes(hour, minute);
  const maxMinute = maxHour * 60;

  while (currentMinute <= maxMinute) {
    const testHour = Math.floor(currentMinute / 60);
    const testMinute = currentMinute % 60;

    if (canScheduleAt('new-task', testHour, testMinute, duration, existingTasks)) {
      return { hour: testHour, minute: testMinute };
    }

    // Try next interval
    currentMinute += snapInterval;
  }

  return null; // No available slot found
}
