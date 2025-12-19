/**
 * Intelligence Service
 * Main entry point for the learning and suggestion system
 */

import { Task, TimeBlock, Priority } from '@/types';
import { 
    IntelligenceService, 
    TaskEvent, 
    UserInsight, 
    Suggestion, 
    SuggestionStatus,
} from './types';
import { trackEvent } from './events';
import { analyzePatterns, getInsights } from './patterns';
import { 
    generateSuggestions, 
    getSuggestions, 
    respondToSuggestion,
    suggestTimeBlock,
    suggestPriority,
    getDailyFocus,
} from './suggestions';

/**
 * The main intelligence service implementation
 */
class FocusFlowIntelligence implements IntelligenceService {
    // ============================================
    // EVENT TRACKING
    // ============================================
    
    async trackEvent(event: TaskEvent): Promise<void> {
        return trackEvent(event);
    }
    
    // ============================================
    // PATTERN ANALYSIS
    // ============================================
    
    async analyzePatterns(userId: string): Promise<UserInsight[]> {
        return analyzePatterns(userId);
    }
    
    async getInsights(userId: string): Promise<UserInsight[]> {
        return getInsights(userId);
    }
    
    // ============================================
    // SUGGESTIONS
    // ============================================
    
    async generateSuggestions(userId: string, tasks: Task[]): Promise<Suggestion[]> {
        return generateSuggestions(userId, tasks);
    }
    
    async getSuggestions(userId: string, status?: SuggestionStatus): Promise<Suggestion[]> {
        return getSuggestions(userId, status);
    }
    
    async respondToSuggestion(suggestionId: string, accepted: boolean): Promise<void> {
        return respondToSuggestion(suggestionId, accepted);
    }
    
    // ============================================
    // SPECIFIC RECOMMENDATIONS
    // ============================================
    
    async suggestTimeBlock(task: Task, userId: string): Promise<TimeBlock | null> {
        return suggestTimeBlock(task, userId);
    }
    
    async suggestPriority(task: Task, userId: string): Promise<Priority | null> {
        return suggestPriority(task, userId);
    }
    
    async getDailyFocus(userId: string, tasks: Task[]): Promise<Task[]> {
        return getDailyFocus(userId, tasks);
    }
}

// Export singleton instance
export const intelligence = new FocusFlowIntelligence();

// Re-export types and utilities
export * from './types';
export * from './events';
export * from './patterns';
export * from './suggestions';
