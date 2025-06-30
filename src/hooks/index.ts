/**
 * Hooks Index
 * Centralized exports for all custom hooks
 */

// Data management hooks
export * from './useFlashcardSets';
export * from './useRealtimeSync';
export * from './useStudyProgress';

// Utility hooks
export * from './useSpacedRepetition';
export * from './useToast';

// Re-export commonly used types
export type {
    CreateFlashcardSetData, FlashcardSetWithStats, UpdateFlashcardSetData
} from './useFlashcardSets';

export type {
    StudyAnalytics, StudyProgressSummary, StudySessionState, WeeklyStudyStats
} from './useStudyProgress';

export type {
    ConnectionState, RealtimeSubscription, SyncQueueItem
} from './useRealtimeSync';
