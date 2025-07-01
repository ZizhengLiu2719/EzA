/**
 * useStudyProgress Hook
 * Manages study sessions, progress tracking, and learning analytics
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { submitCardReview, updateSetLastStudied } from '../api/flashcards';
import {
    abandonStudySession,
    completeStudySession,
    createStudySession,
    CreateStudySessionData,
    getActiveStudySession,
    getSetStudyStats,
    getStudyAnalytics,
    getStudySessions,
    getWeeklyStudyStats,
    StudyAnalytics,
    StudySessionWithDetails,
    updateStudySession,
    UpdateStudySessionData,
    WeeklyStudyStats
} from '../api/studySessions';
import { FSRSCard, ReviewRating } from '../types/SRSTypes';
import { useToast } from './useToast';

// ============================================================================
// Types
// ============================================================================

export interface StudySessionState {
  id?: string;
  setId: string;
  mode: 'flashcard' | 'learn' | 'test' | 'match' | 'gravity' | 'ai-tutor';
  config: Record<string, any>;
  
  // Progress tracking
  cardsStudied: number;
  correctAnswers: number;
  totalAnswers: number;
  startTime: Date;
  endTime?: Date;
  
  // Performance metrics
  responseTimes: number[];
  currentStreak: number;
  bestStreak: number;
  
  // Current state
  isActive: boolean;
  isPaused: boolean;
  
  // Session data for different modes
  sessionData: Record<string, any>;
}

export interface StudyProgressSummary {
  cardsReviewed: number;
  accuracy: number;
  averageResponseTime: number;
  sessionDuration: number;
  improvementRate: number;
  masteredCards: number;
  strugglingCards: number;
}

// ============================================================================
// Active Study Session Hook
// ============================================================================

export const useActiveStudySession = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [localSession, setLocalSession] = useState<StudySessionState | null>(null);
  const [sessionTimer, setSessionTimer] = useState(0);

  // Query for active session from database
  const {
    data: dbActiveSession,
    isLoading,
    error
  } = useQuery({
    queryKey: ['active-study-session'],
    queryFn: getActiveStudySession,
    refetchInterval: 30000, // Check every 30 seconds
    staleTime: 10000 // 10 seconds
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (localSession?.isActive && !localSession?.isPaused) {
      interval = setInterval(() => {
        setSessionTimer(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [localSession?.isActive, localSession?.isPaused]);

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: createStudySession,
    onSuccess: (session) => {
      setLocalSession({
        id: session.id,
        setId: session.set_id,
        mode: session.mode as any,
        config: session.config || {},
        cardsStudied: 0,
        correctAnswers: 0,
        totalAnswers: 0,
        startTime: new Date(session.started_at),
        responseTimes: [],
        currentStreak: 0,
        bestStreak: 0,
        isActive: true,
        isPaused: false,
        sessionData: {}
      });
      
      setSessionTimer(0);
      queryClient.setQueryData(['active-study-session'], session);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to start study session',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: ({ sessionId, updates }: { sessionId: string; updates: UpdateStudySessionData }) =>
      updateStudySession(sessionId, updates),
    onMutate: ({ updates }) => {
      // Optimistic update
      setLocalSession(prev => prev ? { ...prev, ...updates } : null);
    },
    onError: (error: Error, variables, context) => {
      toast({
        title: 'Failed to update session',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Complete session mutation
  const completeSessionMutation = useMutation({
    mutationFn: ({ sessionId, finalData }: { sessionId: string; finalData: UpdateStudySessionData }) =>
      completeStudySession(sessionId, finalData),
    onSuccess: (session) => {
      setLocalSession(null);
      setSessionTimer(0);
      queryClient.setQueryData(['active-study-session'], null);
      queryClient.invalidateQueries(['study-sessions']);
      queryClient.invalidateQueries(['study-analytics']);
      
      toast({
        title: 'Study session completed!',
        description: `Great job! You studied ${session.cards_studied} cards with ${Math.round((session.accuracy || 0) * 100)}% accuracy.`
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to complete session',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Actions
  const startSession = useCallback(async (sessionData: CreateStudySessionData) => {
    return startSessionMutation.mutateAsync(sessionData);
  }, [startSessionMutation]);

  const updateSession = useCallback((updates: Partial<StudySessionState>) => {
    if (!localSession?.id) return;
    
    const dbUpdates: UpdateStudySessionData = {
      cards_studied: updates.cardsStudied,
      correct_answers: updates.correctAnswers,
      total_answers: updates.totalAnswers,
      accuracy: updates.totalAnswers ? (updates.correctAnswers || 0) / updates.totalAnswers : 0,
      session_data: updates.sessionData,
      average_response_time: updates.responseTimes?.length 
        ? updates.responseTimes.reduce((a, b) => a + b, 0) / updates.responseTimes.length 
        : undefined,
      fastest_response: updates.responseTimes?.length ? Math.min(...updates.responseTimes) : undefined,
      slowest_response: updates.responseTimes?.length ? Math.max(...updates.responseTimes) : undefined,
      streak_best: updates.bestStreak
    };

    updateSessionMutation.mutate({ sessionId: localSession.id, updates: dbUpdates });
  }, [localSession?.id, updateSessionMutation]);

  const completeSession = useCallback((summary?: StudyProgressSummary) => {
    if (!localSession?.id) return;

    const finalData: UpdateStudySessionData = {
      duration: sessionTimer,
      cards_studied: localSession.cardsStudied,
      correct_answers: localSession.correctAnswers,
      total_answers: localSession.totalAnswers,
      accuracy: localSession.totalAnswers > 0 ? localSession.correctAnswers / localSession.totalAnswers : 0,
      session_data: {
        ...localSession.sessionData,
        summary
      },
      average_response_time: localSession.responseTimes.length > 0
        ? localSession.responseTimes.reduce((a, b) => a + b, 0) / localSession.responseTimes.length
        : 0,
      fastest_response: localSession.responseTimes.length > 0 ? Math.min(...localSession.responseTimes) : undefined,
      slowest_response: localSession.responseTimes.length > 0 ? Math.max(...localSession.responseTimes) : undefined,
      streak_best: localSession.bestStreak,
      improvement_rate: summary?.improvementRate || 0
    };

    completeSessionMutation.mutate({ sessionId: localSession.id, finalData });
  }, [localSession, sessionTimer, completeSessionMutation]);

  const pauseSession = useCallback(() => {
    setLocalSession(prev => prev ? { ...prev, isPaused: true } : null);
  }, []);

  const resumeSession = useCallback(() => {
    setLocalSession(prev => prev ? { ...prev, isPaused: false } : null);
  }, []);

  const abandonSession = useCallback(async () => {
    if (!localSession?.id) return;
    
    try {
      await abandonStudySession(localSession.id);
      setLocalSession(null);
      setSessionTimer(0);
      queryClient.setQueryData(['active-study-session'], null);
      
      toast({
        title: 'Study session abandoned',
        description: 'Your progress has been saved.'
      });
    } catch (error: any) {
      toast({
        title: 'Failed to abandon session',
        description: error.message,
        variant: 'destructive'
      });
    }
  }, [localSession?.id, queryClient, toast]);

  // Record card review
  const recordCardReview = useCallback(async (
    card: FSRSCard,
    rating: ReviewRating,
    responseTime?: number
  ) => {
    if (!localSession) return;

    try {
      // Submit card review to FSRS system
      await submitCardReview(card.id!, rating, localSession.id, responseTime);
      
      // Update local session state
      const isCorrect = rating >= 3; // Good or Easy
      setLocalSession(prev => {
        if (!prev) return null;
        
        const newCorrectAnswers = prev.correctAnswers + (isCorrect ? 1 : 0);
        const newTotalAnswers = prev.totalAnswers + 1;
        const newCardsStudied = prev.cardsStudied + 1;
        const newResponseTimes = responseTime ? [...prev.responseTimes, responseTime] : prev.responseTimes;
        
        const newCurrentStreak = isCorrect ? prev.currentStreak + 1 : 0;
        const newBestStreak = Math.max(prev.bestStreak, newCurrentStreak);
        
        return {
          ...prev,
          cardsStudied: newCardsStudied,
          correctAnswers: newCorrectAnswers,
          totalAnswers: newTotalAnswers,
          responseTimes: newResponseTimes,
          currentStreak: newCurrentStreak,
          bestStreak: newBestStreak
        };
      });
      
      // Update set's last studied timestamp
      await updateSetLastStudied(localSession.setId);
      
    } catch (error: any) {
      toast({
        title: 'Failed to record review',
        description: error.message,
        variant: 'destructive'
      });
    }
  }, [localSession, toast]);

  // Calculate current session statistics
  const sessionStats = useMemo(() => {
    if (!localSession) return null;
    
    const accuracy = localSession.totalAnswers > 0 
      ? localSession.correctAnswers / localSession.totalAnswers 
      : 0;
    
    const averageResponseTime = localSession.responseTimes.length > 0
      ? localSession.responseTimes.reduce((a, b) => a + b, 0) / localSession.responseTimes.length
      : 0;

    return {
      duration: sessionTimer,
      cardsStudied: localSession.cardsStudied,
      accuracy,
      averageResponseTime,
      currentStreak: localSession.currentStreak,
      bestStreak: localSession.bestStreak
    };
  }, [localSession, sessionTimer]);

  return {
    // Session state
    session: localSession || dbActiveSession,
    sessionStats,
    isLoading,
    error,
    
    // Session control
    isStarting: startSessionMutation.isLoading,
    isUpdating: updateSessionMutation.isLoading,
    isCompleting: completeSessionMutation.isLoading,
    
    // Actions
    startSession,
    updateSession,
    completeSession,
    pauseSession,
    resumeSession,
    abandonSession,
    recordCardReview
  };
};

// ============================================================================
// Study History Hook
// ============================================================================

export const useStudyHistory = (setId?: string, mode?: string) => {
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const {
    data: sessions = [],
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useQuery({
    queryKey: ['study-sessions', setId, mode, page],
    queryFn: () => getStudySessions(pageSize, page * pageSize, setId, mode),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const loadMore = useCallback(() => {
    if (!isFetchingNextPage) {
      setPage(prev => prev + 1);
    }
  }, [isFetchingNextPage]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalSessions = sessions.length;
    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalCards = sessions.reduce((sum, s) => sum + s.cards_studied, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correct_answers, 0);
    const totalAnswers = sessions.reduce((sum, s) => sum + s.total_answers, 0);
    
    const averageAccuracy = totalAnswers > 0 ? totalCorrect / totalAnswers : 0;
    const averageSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
    
    return {
      totalSessions,
      totalDuration,
      totalCards,
      averageAccuracy,
      averageSessionDuration
    };
  }, [sessions]);

  return {
    sessions,
    summary,
    isLoading,
    error,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,
    loadMore
  };
};

// ============================================================================
// Study Analytics Hook
// ============================================================================

export const useStudyAnalytics = (timeframe: 'week' | 'month' | 'year' | 'all' = 'all') => {
  const {
    data: analytics,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['study-analytics', timeframe],
    queryFn: () => getStudyAnalytics(timeframe),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Weekly statistics
  const {
    data: weeklyStats = [],
    isLoading: isLoadingWeekly
  } = useQuery({
    queryKey: ['weekly-study-stats'],
    queryFn: () => getWeeklyStudyStats(12), // Last 12 weeks
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: timeframe === 'week' || timeframe === 'all'
  });

  return {
    analytics,
    weeklyStats,
    isLoading: isLoading || isLoadingWeekly,
    error,
    refetch
  };
};

// ============================================================================
// Set-specific Study Progress Hook
// ============================================================================

export const useSetStudyProgress = (setId: string) => {
  const {
    data: stats,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['set-study-stats', setId],
    queryFn: () => getSetStudyStats(setId),
    enabled: !!setId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Recent sessions for this set
  const {
    data: recentSessions = []
  } = useQuery({
    queryKey: ['set-recent-sessions', setId],
    queryFn: () => getStudySessions(5, 0, setId), // Last 5 sessions
    enabled: !!setId,
    staleTime: 2 * 60 * 1000 // 2 minutes
  });

  return {
    stats,
    recentSessions,
    isLoading,
    error,
    refetch
  };
};

// ============================================================================
// Study Recommendations Hook
// ============================================================================

export const useStudyRecommendations = () => {
  const { analytics } = useStudyAnalytics();
  
  const recommendations = useMemo(() => {
    if (!analytics) return [];
    
    const recs: Array<{
      type: 'goal' | 'schedule' | 'improvement' | 'achievement';
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      action?: string;
    }> = [];

    // Study streak recommendations
    if (analytics.current_streak === 0) {
      recs.push({
        type: 'goal',
        title: 'Start Your Study Streak',
        description: 'Begin a daily study habit to improve retention and build momentum.',
        priority: 'high',
        action: 'Study now'
      });
    } else if (analytics.current_streak < 7) {
      recs.push({
        type: 'goal',
        title: 'Build Your Streak',
        description: `You're ${7 - analytics.current_streak} days away from a weekly streak!`,
        priority: 'medium',
        action: 'Continue studying'
      });
    }

    // Accuracy recommendations
    if (analytics.overall_accuracy < 0.7) {
      recs.push({
        type: 'improvement',
        title: 'Focus on Accuracy',
        description: 'Consider reviewing cards more carefully or adjusting difficulty.',
        priority: 'high'
      });
    }

    // Study time recommendations
    if (analytics.sessions_this_week < 3) {
      recs.push({
        type: 'schedule',
        title: 'Increase Study Frequency',
        description: 'Aim for at least 3-4 study sessions per week for optimal retention.',
        priority: 'medium'
      });
    }

    // Improvement trend recommendations
    if (analytics.improvement_trend === 'declining') {
      recs.push({
        type: 'improvement',
        title: 'Review Your Study Strategy',
        description: 'Your performance has been declining. Consider taking breaks or trying different study modes.',
        priority: 'high'
      });
    }

    // Achievement recommendations
    if (analytics.mastery_rate > 0.8) {
      recs.push({
        type: 'achievement',
        title: 'Excellent Progress!',
        description: 'You\'re mastering your cards well. Consider learning new material.',
        priority: 'low',
        action: 'Add new cards'
      });
    }

    return recs.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [analytics]);

  return recommendations;
};

// ============================================================================
// Study Streak Hook
// ============================================================================

export const useStudyStreak = () => {
  const { analytics } = useStudyAnalytics();
  
  const streakData = useMemo(() => {
    if (!analytics) return null;
    
    const currentStreak = analytics.current_streak;
    const longestStreak = analytics.longest_streak;
    
    // Calculate next milestone
    const milestones = [7, 14, 30, 60, 100, 365];
    const nextMilestone = milestones.find(m => m > currentStreak) || null;
    const daysToMilestone = nextMilestone ? nextMilestone - currentStreak : null;
    
    // Calculate streak level
    let level = 'Beginner';
    if (currentStreak >= 365) level = 'Master';
    else if (currentStreak >= 100) level = 'Expert';
    else if (currentStreak >= 30) level = 'Advanced';
    else if (currentStreak >= 7) level = 'Intermediate';
    
    return {
      currentStreak,
      longestStreak,
      nextMilestone,
      daysToMilestone,
      level,
      isActive: currentStreak > 0
    };
  }, [analytics]);

  return streakData;
};

export type {
    StudyAnalytics, StudyProgressSummary, StudySessionState, StudySessionWithDetails, WeeklyStudyStats
};

