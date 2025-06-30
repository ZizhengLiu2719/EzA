/**
 * Study Sessions API - Data Access Layer
 * Manages study sessions, review logs, and learning analytics
 */

import { supabase } from '../config/supabase';
import { ReviewLog, ReviewRating } from '../types/SRSTypes';

// ============================================================================
// Types for Study Sessions
// ============================================================================

export interface CreateStudySessionData {
  set_id: string;
  mode: 'flashcard' | 'learn' | 'test' | 'match' | 'gravity' | 'ai-tutor';
  config?: Record<string, any>;
}

export interface UpdateStudySessionData {
  duration?: number;
  cards_studied?: number;
  correct_answers?: number;
  total_answers?: number;
  accuracy?: number;
  session_data?: Record<string, any>;
  average_response_time?: number;
  fastest_response?: number;
  slowest_response?: number;
  streak_best?: number;
  improvement_rate?: number;
  status?: 'active' | 'completed' | 'abandoned';
  ended_at?: string;
}

export interface StudySessionWithDetails {
  id: string;
  user_id: string;
  set_id: string;
  mode: string;
  duration: number;
  cards_studied: number;
  correct_answers: number;
  total_answers: number;
  accuracy: number;
  session_data?: Record<string, any>;
  config?: Record<string, any>;
  average_response_time: number;
  fastest_response?: number;
  slowest_response?: number;
  streak_best: number;
  improvement_rate: number;
  status: string;
  started_at: string;
  ended_at?: string;
  created_at: string;
  // Related data
  set_title?: string;
  review_logs?: ReviewLog[];
}

export interface CreateReviewLogData {
  card_id: string;
  session_id?: string;
  rating: ReviewRating;
  response_time?: number;
  previous_state: number;
  new_state: number;
  previous_due: Date;
  new_due: Date;
  previous_stability: number;
  new_stability: number;
  previous_difficulty: number;
  new_difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
}

export interface StudyAnalytics {
  total_sessions: number;
  total_study_time: number; // seconds
  average_session_duration: number;
  total_cards_reviewed: number;
  overall_accuracy: number;
  sessions_this_week: number;
  study_time_this_week: number;
  current_streak: number;
  longest_streak: number;
  favorite_study_mode: string;
  best_performance_time: string;
  improvement_trend: 'improving' | 'stable' | 'declining';
  mastery_rate: number;
}

export interface WeeklyStudyStats {
  week_start: string;
  sessions_count: number;
  total_duration: number;
  cards_studied: number;
  accuracy: number;
  improvement_rate: number;
}

// ============================================================================
// Study Sessions API
// ============================================================================

/**
 * Create a new study session
 */
export const createStudySession = async (sessionData: CreateStudySessionData): Promise<StudySessionWithDetails> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      ...sessionData,
      user_id: user.id,
      status: 'active',
      started_at: new Date().toISOString()
    })
    .select(`
      *,
      flashcard_sets!inner(title)
    `)
    .single();

  if (error) throw error;

  return {
    ...data,
    set_title: data.flashcard_sets?.title
  };
};

/**
 * Update a study session
 */
export const updateStudySession = async (
  sessionId: string,
  updates: UpdateStudySessionData
): Promise<StudySessionWithDetails> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('study_sessions')
    .update(updates)
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select(`
      *,
      flashcard_sets!inner(title)
    `)
    .single();

  if (error) throw error;

  return {
    ...data,
    set_title: data.flashcard_sets?.title
  };
};

/**
 * Complete a study session
 */
export const completeStudySession = async (
  sessionId: string,
  finalData: UpdateStudySessionData
): Promise<StudySessionWithDetails> => {
  const updates: UpdateStudySessionData = {
    ...finalData,
    status: 'completed',
    ended_at: new Date().toISOString()
  };

  return await updateStudySession(sessionId, updates);
};

/**
 * Abandon a study session
 */
export const abandonStudySession = async (sessionId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('study_sessions')
    .update({
      status: 'abandoned',
      ended_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (error) throw error;
};

/**
 * Get user's study sessions with pagination
 */
export const getStudySessions = async (
  limit: number = 20,
  offset: number = 0,
  setId?: string,
  mode?: string
): Promise<StudySessionWithDetails[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  let query = supabase
    .from('study_sessions')
    .select(`
      *,
      flashcard_sets!inner(title)
    `)
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (setId) {
    query = query.eq('set_id', setId);
  }

  if (mode) {
    query = query.eq('mode', mode);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data.map(session => ({
    ...session,
    set_title: session.flashcard_sets?.title
  }));
};

/**
 * Get a specific study session with review logs
 */
export const getStudySession = async (sessionId: string): Promise<StudySessionWithDetails> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('study_sessions')
    .select(`
      *,
      flashcard_sets!inner(title),
      review_logs(*)
    `)
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;

  return {
    ...data,
    set_title: data.flashcard_sets?.title,
    review_logs: data.review_logs || []
  };
};

/**
 * Get active study session for a user
 */
export const getActiveStudySession = async (): Promise<StudySessionWithDetails | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('study_sessions')
    .select(`
      *,
      flashcard_sets!inner(title)
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    set_title: data.flashcard_sets?.title
  };
};

// ============================================================================
// Review Logs API
// ============================================================================

/**
 * Create a review log entry
 */
export const createReviewLog = async (logData: CreateReviewLogData): Promise<ReviewLog> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('review_logs')
    .insert({
      ...logData,
      user_id: user.id,
      previous_due: logData.previous_due.toISOString(),
      new_due: logData.new_due.toISOString(),
      reviewed_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    cardId: data.card_id,
    rating: data.rating,
    responseTime: data.response_time,
    state: data.new_state,
    due: new Date(data.new_due),
    stability: data.new_stability,
    difficulty: data.new_difficulty,
    elapsed_days: data.elapsed_days,
    last_elapsed_days: 0, // TODO: Calculate this
    scheduled_days: data.scheduled_days,
    review: new Date(data.reviewed_at),
    duration: data.response_time
  };
};

/**
 * Get review logs for a card
 */
export const getCardReviewLogs = async (
  cardId: string,
  limit: number = 50
): Promise<ReviewLog[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('review_logs')
    .select('*')
    .eq('card_id', cardId)
    .eq('user_id', user.id)
    .order('reviewed_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data.map(log => ({
    id: log.id,
    cardId: log.card_id,
    rating: log.rating,
    responseTime: log.response_time,
    state: log.new_state,
    due: new Date(log.new_due),
    stability: log.new_stability,
    difficulty: log.new_difficulty,
    elapsed_days: log.elapsed_days,
    last_elapsed_days: 0,
    scheduled_days: log.scheduled_days,
    review: new Date(log.reviewed_at),
    duration: log.response_time
  }));
};

/**
 * Get review logs for a session
 */
export const getSessionReviewLogs = async (sessionId: string): Promise<ReviewLog[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('review_logs')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .order('reviewed_at', { ascending: true });

  if (error) throw error;

  return data.map(log => ({
    id: log.id,
    cardId: log.card_id,
    rating: log.rating,
    responseTime: log.response_time,
    state: log.new_state,
    due: new Date(log.new_due),
    stability: log.new_stability,
    difficulty: log.new_difficulty,
    elapsed_days: log.elapsed_days,
    last_elapsed_days: 0,
    scheduled_days: log.scheduled_days,
    review: new Date(log.reviewed_at),
    duration: log.response_time
  }));
};

// ============================================================================
// Study Analytics API
// ============================================================================

/**
 * Get comprehensive study analytics for a user
 */
export const getStudyAnalytics = async (
  timeframe: 'week' | 'month' | 'year' | 'all' = 'all'
): Promise<StudyAnalytics> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Calculate date range
  const now = new Date();
  let startDate: Date;

  switch (timeframe) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date('2020-01-01'); // Very old date for 'all'
  }

  // Get study sessions data
  const { data: sessions, error: sessionsError } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', user.id)
    .gte('started_at', startDate.toISOString())
    .eq('status', 'completed');

  if (sessionsError) throw sessionsError;

  // Calculate analytics
  const totalSessions = sessions.length;
  const totalStudyTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalCardsReviewed = sessions.reduce((sum, s) => sum + (s.cards_studied || 0), 0);
  const totalCorrectAnswers = sessions.reduce((sum, s) => sum + (s.correct_answers || 0), 0);
  const totalAnswers = sessions.reduce((sum, s) => sum + (s.total_answers || 0), 0);

  // This week data
  const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekSessions = sessions.filter(s => new Date(s.started_at) >= thisWeekStart);
  const sessionsThisWeek = thisWeekSessions.length;
  const studyTimeThisWeek = thisWeekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);

  // Calculate streak
  const currentStreak = await calculateStudyStreak(user.id);

  // Most used study mode
  const modeCounts = sessions.reduce((acc, s) => {
    acc[s.mode] = (acc[s.mode] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const favoriteStudyMode = Object.entries(modeCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'flashcard';

  // Calculate improvement trend
  const recentSessions = sessions.slice(-10);
  const oldSessions = sessions.slice(0, 10);
  const recentAccuracy = recentSessions.length > 0 
    ? recentSessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / recentSessions.length
    : 0;
  const oldAccuracy = oldSessions.length > 0
    ? oldSessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / oldSessions.length
    : 0;

  let improvementTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (recentAccuracy > oldAccuracy + 0.05) improvementTrend = 'improving';
  else if (recentAccuracy < oldAccuracy - 0.05) improvementTrend = 'declining';

  return {
    total_sessions: totalSessions,
    total_study_time: totalStudyTime,
    average_session_duration: totalSessions > 0 ? totalStudyTime / totalSessions : 0,
    total_cards_reviewed: totalCardsReviewed,
    overall_accuracy: totalAnswers > 0 ? totalCorrectAnswers / totalAnswers : 0,
    sessions_this_week: sessionsThisWeek,
    study_time_this_week: studyTimeThisWeek,
    current_streak: currentStreak,
    longest_streak: currentStreak, // TODO: Calculate actual longest streak
    favorite_study_mode: favoriteStudyMode,
    best_performance_time: '10:00', // TODO: Calculate actual best performance time
    improvement_trend: improvementTrend,
    mastery_rate: 0.7 // TODO: Calculate actual mastery rate
  };
};

/**
 * Get weekly study statistics
 */
export const getWeeklyStudyStats = async (weeksBack: number = 12): Promise<WeeklyStudyStats[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const weeks: WeeklyStudyStats[] = [];
  const now = new Date();

  for (let i = 0; i < weeksBack; i++) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data: weekSessions, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('started_at', weekStart.toISOString())
      .lt('started_at', weekEnd.toISOString())
      .eq('status', 'completed');

    if (error) throw error;

    const sessionsCount = weekSessions.length;
    const totalDuration = weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const cardsStudied = weekSessions.reduce((sum, s) => sum + (s.cards_studied || 0), 0);
    const totalAnswers = weekSessions.reduce((sum, s) => sum + (s.total_answers || 0), 0);
    const correctAnswers = weekSessions.reduce((sum, s) => sum + (s.correct_answers || 0), 0);
    const accuracy = totalAnswers > 0 ? correctAnswers / totalAnswers : 0;
    const improvementRate = weekSessions.reduce((sum, s) => sum + (s.improvement_rate || 0), 0) / Math.max(sessionsCount, 1);

    weeks.unshift({
      week_start: weekStart.toISOString().split('T')[0],
      sessions_count: sessionsCount,
      total_duration: totalDuration,
      cards_studied: cardsStudied,
      accuracy: accuracy,
      improvement_rate: improvementRate
    });
  }

  return weeks;
};

/**
 * Get study statistics for a specific flashcard set
 */
export const getSetStudyStats = async (setId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: sessions, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('set_id', setId)
    .eq('status', 'completed');

  if (error) throw error;

  const totalSessions = sessions.length;
  const totalStudyTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalCardsStudied = sessions.reduce((sum, s) => sum + (s.cards_studied || 0), 0);
  const totalCorrect = sessions.reduce((sum, s) => sum + (s.correct_answers || 0), 0);
  const totalAnswers = sessions.reduce((sum, s) => sum + (s.total_answers || 0), 0);
  const averageAccuracy = totalAnswers > 0 ? totalCorrect / totalAnswers : 0;
  const averageSessionDuration = totalSessions > 0 ? totalStudyTime / totalSessions : 0;

  // Get last session date
  const lastSession = sessions.length > 0 
    ? sessions.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0]
    : null;

  return {
    total_sessions: totalSessions,
    total_study_time: totalStudyTime,
    total_cards_studied: totalCardsStudied,
    average_accuracy: averageAccuracy,
    average_session_duration: averageSessionDuration,
    last_studied: lastSession?.started_at,
    improvement_trend: calculateImprovementTrend(sessions)
  };
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate current study streak
 */
async function calculateStudyStreak(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('started_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('started_at', { ascending: false });

  if (error || !data.length) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < data.length; i++) {
    const sessionDate = new Date(data[i].started_at);
    sessionDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (24 * 60 * 60 * 1000));

    if (daysDiff === streak) {
      streak++;
    } else if (daysDiff === streak + 1) {
      // Skip if there's a gap of exactly one day
      continue;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate improvement trend for sessions
 */
function calculateImprovementTrend(sessions: any[]): 'improving' | 'stable' | 'declining' {
  if (sessions.length < 4) return 'stable';

  const recent = sessions.slice(-3);
  const earlier = sessions.slice(-6, -3);

  const recentAvg = recent.reduce((sum, s) => sum + (s.accuracy || 0), 0) / recent.length;
  const earlierAvg = earlier.reduce((sum, s) => sum + (s.accuracy || 0), 0) / earlier.length;

  if (recentAvg > earlierAvg + 0.05) return 'improving';
  if (recentAvg < earlierAvg - 0.05) return 'declining';
  return 'stable';
}

/**
 * Export study data as JSON
 */
export const exportStudyData = async (setId?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  let sessionsQuery = supabase
    .from('study_sessions')
    .select(`
      *,
      flashcard_sets!inner(title),
      review_logs(*)
    `)
    .eq('user_id', user.id);

  if (setId) {
    sessionsQuery = sessionsQuery.eq('set_id', setId);
  }

  const { data: sessions, error } = await sessionsQuery;
  if (error) throw error;

  return {
    export_date: new Date().toISOString(),
    user_id: user.id,
    sessions: sessions,
    total_sessions: sessions.length,
    total_study_time: sessions.reduce((sum, s) => sum + (s.duration || 0), 0)
  };
}; 