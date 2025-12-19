/**
 * Intelligence Layer Types
 * Core types for the learning and suggestion system
 */

import { Task, TimeBlock, Priority, EnergyLevel } from '@/types';

// ============================================
// EVENT TYPES
// ============================================

export type TaskEventType =
    | 'task_created'
    | 'task_updated'
    | 'task_completed'
    | 'task_started'      // Status changed to in-progress
    | 'task_paused'       // Status changed from in-progress to pending
    | 'task_moved'        // Date or time block changed
    | 'task_deleted'
    | 'task_uncompleted'  // Marked incomplete
    | 'subtask_added'
    | 'subtask_completed'
    | 'timer_started'
    | 'timer_stopped'
    | 'session_start'     // User opened the app
    | 'session_end';

export interface TaskEvent {
    id?: string;
    userId: string;
    taskId?: string | null;
    eventType: TaskEventType;
    
    // Context at time of event
    hourOfDay?: number;
    dayOfWeek?: number;
    timeBlock?: TimeBlock;
    projectId?: string | null;
    priority?: Priority;
    energyLevel?: EnergyLevel;
    
    // Change tracking
    previousValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    
    // Extra context
    metadata?: Record<string, unknown>;
    
    createdAt?: Date;
}

// ============================================
// INSIGHT TYPES
// ============================================

export type InsightType =
    | 'time_preference'      // "You do client work in mornings"
    | 'energy_pattern'       // "High-energy tasks work best before noon"
    | 'project_timing'       // "Design project tasks: afternoon"
    | 'completion_velocity'  // "You complete 5 tasks/day on average"
    | 'estimation_accuracy'  // "You underestimate by 40%"
    | 'productivity_window'  // "Your peak hours are 9-11am"
    | 'rollover_pattern'     // "Tasks without deadlines get rolled over 3x"
    | 'priority_behavior';   // "You complete urgent tasks 2x faster"

export interface Pattern {
    // Time-based patterns
    preferredTimeBlock?: TimeBlock;
    preferredHours?: number[];   // [9, 10, 11] = 9am-noon
    preferredDays?: number[];    // [1, 2, 3, 4, 5] = weekdays
    
    // Velocity patterns
    avgTasksPerDay?: number;
    avgCompletionTimeMinutes?: number;
    estimationAccuracy?: number; // 1.0 = perfect, 1.4 = 40% underestimate
    
    // Behavioral patterns
    avgRolloverCount?: number;
    completionRate?: number;     // 0-1
    
    // Context
    projectId?: string;
    energyLevel?: EnergyLevel;
    priority?: Priority;
}

export interface UserInsight {
    id?: string;
    userId: string;
    insightType: InsightType;
    category?: string;
    pattern: Pattern;
    confidence: number;
    sampleSize: number;
    isActive: boolean;
    lastUpdated: Date;
    expiresAt?: Date | null;
}

// ============================================
// SUGGESTION TYPES
// ============================================

export type SuggestionType =
    | 'time_block'           // Suggest moving to different time block
    | 'reschedule'           // Suggest different date
    | 'priority'             // Suggest priority change
    | 'breakdown'            // Suggest breaking down large task
    | 'energy_match'         // Task energy doesn't match your pattern
    | 'overload_warning'     // Too many tasks for this time block
    | 'stale_task'           // Task hasn't been touched in a while
    | 'dependency_ready'     // Blocked task is now unblocked
    | 'focus_recommendation' // "Based on your patterns, focus on X next"
    | 'daily_plan';          // Morning suggestion of what to tackle

export type SuggestionAction =
    | { type: 'move_time_block'; targetTimeBlock: TimeBlock }
    | { type: 'move_date'; targetDate: string }
    | { type: 'change_priority'; targetPriority: Priority }
    | { type: 'breakdown'; suggestedSubtasks?: string[] }
    | { type: 'archive' }
    | { type: 'focus'; taskIds: string[] }
    | { type: 'dismiss' };

export type SuggestionStatus = 'pending' | 'accepted' | 'dismissed' | 'expired';
export type SuggestionSource = 'rule' | 'pattern' | 'ai';

export interface Suggestion {
    id?: string;
    userId: string;
    taskId?: string | null;
    
    type: SuggestionType;
    title: string;
    description?: string;
    
    action: SuggestionAction;
    reasoning?: string;
    
    confidence: number;
    source: SuggestionSource;
    
    status: SuggestionStatus;
    respondedAt?: Date | null;
    expiresAt?: Date | null;
    createdAt?: Date;
}

// ============================================
// SERVICE INTERFACES
// ============================================

export interface IntelligenceService {
    // Event tracking
    trackEvent(event: TaskEvent): Promise<void>;
    
    // Pattern analysis
    analyzePatterns(userId: string): Promise<UserInsight[]>;
    getInsights(userId: string): Promise<UserInsight[]>;
    
    // Suggestions
    generateSuggestions(userId: string, tasks: Task[]): Promise<Suggestion[]>;
    getSuggestions(userId: string, status?: SuggestionStatus): Promise<Suggestion[]>;
    respondToSuggestion(suggestionId: string, accepted: boolean): Promise<void>;
    
    // Specific recommendations
    suggestTimeBlock(task: Task, userId: string): Promise<TimeBlock | null>;
    suggestPriority(task: Task, userId: string): Promise<Priority | null>;
    getDailyFocus(userId: string, tasks: Task[]): Promise<Task[]>;
}

// ============================================
// USER FEATURES
// ============================================

export type SuggestionFrequency = 'minimal' | 'balanced' | 'proactive';
export type PrivacyLevel = 'full' | 'limited' | 'none';

export interface UserFeatures {
    userId: string;
    smartSuggestions: boolean;
    aiBreakdown: boolean;
    autoScheduling: boolean;
    learningEnabled: boolean;
    suggestionFrequency: SuggestionFrequency;
    privacyLevel: PrivacyLevel;
}
