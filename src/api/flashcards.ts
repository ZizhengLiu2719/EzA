/**
 * Flashcards API - Data Access Layer
 * Provides CRUD operations for flashcard sets and individual flashcards
 * Integrates with FSRS-5 algorithm for spaced repetition
 */

import { ExamQuestion } from '@/types/examTypes';
import { FlashcardSet, FSRSCard, FSRSParameters, ReviewRating } from '../types/SRSTypes';
import { FSRS } from '../utils/fsrsAlgorithm';
import { supabase } from './supabase';

// ============================================================================
// Types for Database Operations
// ============================================================================

export interface CreateFlashcardSetData {
  title: string;
  description?: string;
  subject?: string;
  difficulty?: number;
  is_public?: boolean;
  tags?: string[];
  visibility?: 'private' | 'public' | 'shared';
  language?: string;
  category?: string;
}

export interface UpdateFlashcardSetData {
  title?: string;
  description?: string;
  subject?: string;
  difficulty?: number;
  is_public?: boolean;
  tags?: string[];
  visibility?: 'private' | 'public' | 'shared';
  language?: string;
  category?: string;
}

export interface CreateFlashcardData {
  set_id: string;
  question: string;
  answer: string;
  hint?: string;
  explanation?: string;
  card_type?: 'basic' | 'cloze' | 'multiple_choice';
  tags?: string[];
  image_url?: string;
  audio_url?: string;
}

export interface UpdateFlashcardData {
  question?: string;
  answer?: string;
  hint?: string;
  explanation?: string;
  card_type?: 'basic' | 'cloze' | 'multiple_choice';
  tags?: string[];
  image_url?: string;
  audio_url?: string;
}

export interface FlashcardSetWithStats {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  difficulty: number;
  is_public: boolean;
  card_count: number;
  mastery_level: number;
  tags: string[];
  visibility: 'private' | 'public' | 'shared';
  total_study_time: number;
  last_studied?: string;
  created_at: string;
  updated_at: string;
  // Computed stats
  due_cards_count?: number;
  new_cards_count?: number;
  learning_cards_count?: number;
  review_cards_count?: number;
}

// ============================================================================
// Flashcard Sets API
// ============================================================================

/**
 * Get all flashcard sets for the current user
 */
export const getFlashcardSets = async (): Promise<FlashcardSetWithStats[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('flashcard_sets')
    .select(`
      *,
      flashcards!inner(count)
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  // Get due cards count for each set
  const setsWithStats = await Promise.all(
    data.map(async (set) => {
      const stats = await getFlashcardSetStats(set.id);
      return {
        ...set,
        ...stats,
      };
    })
  );

  return setsWithStats;
};

/**
 * Get a specific flashcard set by ID
 */
export const getFlashcardSet = async (setId: string): Promise<FlashcardSetWithStats> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('flashcard_sets')
    .select('*')
    .eq('id', setId)
    .single();

  if (error) throw error;

  // Check if user has access (owner or public set)
  if (data.user_id !== user.id && !data.is_public) {
    throw new Error('Access denied to this flashcard set');
  }

  const stats = await getFlashcardSetStats(setId);
  return { ...data, ...stats };
};

/**
 * Get statistics for a flashcard set
 */
export const getFlashcardSetStats = async (setId: string) => {
  const { data, error } = await supabase
    .from('flashcards')
    .select('state, due')
    .eq('set_id', setId);

  if (error) throw error;

  const now = new Date();
  const stats = {
    due_cards_count: 0,
    new_cards_count: 0,
    learning_cards_count: 0,
    review_cards_count: 0
  };

  data.forEach(card => {
    const cardDue = new Date(card.due);
    
    switch (card.state) {
      case 0: // NEW
        stats.new_cards_count++;
        if (cardDue <= now) stats.due_cards_count++;
        break;
      case 1: // LEARNING
        stats.learning_cards_count++;
        if (cardDue <= now) stats.due_cards_count++;
        break;
      case 2: // REVIEW
        stats.review_cards_count++;
        if (cardDue <= now) stats.due_cards_count++;
        break;
      case 3: // RELEARNING
        if (cardDue <= now) stats.due_cards_count++;
        break;
    }
  });

  return stats;
};

/**
 * Create a new flashcard set
 */
export const createFlashcardSet = async (setData: CreateFlashcardSetData): Promise<FlashcardSet> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('flashcard_sets')
    .insert({
      ...setData,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update a flashcard set
 */
export const updateFlashcardSet = async (
  setId: string, 
  updates: UpdateFlashcardSetData
): Promise<FlashcardSet> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('flashcard_sets')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', setId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete a flashcard set and all its cards
 */
export const deleteFlashcardSet = async (setId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('flashcard_sets')
    .delete()
    .eq('id', setId)
    .eq('user_id', user.id);

  if (error) throw error;
};

/**
 * Delete all flashcard sets for the current user
 */
export const deleteAllFlashcardSets = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('flashcard_sets')
    .delete()
    .eq('user_id', user.id);

  if (error) throw error;
};

/**
 * Delete multiple flashcard sets by their IDs.
 */
export const deleteFlashcardSets = async (setIds: string[]): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('flashcard_sets')
    .delete()
    .in('id', setIds)
    .eq('user_id', user.id);

  if (error) throw error;
};

/**
 * Get public flashcard sets
 */
export const getPublicFlashcardSets = async (
  subject?: string,
  difficulty?: number,
  limit: number = 20,
  offset: number = 0
): Promise<FlashcardSetWithStats[]> => {
  let query = supabase
    .from('flashcard_sets')
    .select('*')
    .eq('is_public', true)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (subject) {
    query = query.eq('subject', subject);
  }

  if (difficulty) {
    query = query.eq('difficulty', difficulty);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data.map(set => ({ ...set }));
};

// ============================================================================
// Flashcards API
// ============================================================================

/**
 * Get all flashcards in a set
 */
export const getFlashcards = async (setId: string): Promise<FSRSCard[]> => {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('set_id', setId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Convert database format to FSRSCard format
  return data.map(convertToFSRSCard);
};

/**
 * Get due flashcards for study
 */
export const getDueFlashcards = async (setId: string): Promise<FSRSCard[]> => {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('set_id', setId)
    .lte('due', now)
    .order('due', { ascending: true });

  if (error) throw error;
  return data.map(convertToFSRSCard);
};

/**
 * Get new flashcards (state = 0)
 */
export const getNewFlashcards = async (setId: string, limit: number = 20): Promise<FSRSCard[]> => {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('set_id', setId)
    .eq('state', 0)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data.map(convertToFSRSCard);
};

/**
 * Create a new flashcard
 */
export const createFlashcard = async (cardData: CreateFlashcardData): Promise<FSRSCard> => {
  const { data, error } = await supabase
    .from('flashcards')
    .insert(cardData)
    .select()
    .single();

  if (error) throw error;
  return convertToFSRSCard(data);
};

/**
 * Create multiple flashcards in batch
 */
export const createFlashcards = async (cards: CreateFlashcardData[]): Promise<FSRSCard[]> => {
  const { data, error } = await supabase
    .from('flashcards')
    .insert(cards)
    .select();

  if (error) throw error;
  return data.map(convertToFSRSCard);
};

/**
 * Update a flashcard
 */
export const updateFlashcard = async (
  cardId: string, 
  updates: UpdateFlashcardData
): Promise<FSRSCard> => {
  const { data, error } = await supabase
    .from('flashcards')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', cardId)
    .select()
    .single();

  if (error) throw error;
  return convertToFSRSCard(data);
};

/**
 * Update flashcard with FSRS review data
 */
export const updateFlashcardAfterReview = async (
  cardId: string,
  fsrsData: {
    due: Date;
    stability: number;
    difficulty: number;
    elapsed_days: number;
    scheduled_days: number;
    reps: number;
    lapses: number;
    state: number;
    last_review: Date;
    total_time: number;
    success_rate: number;
  }
): Promise<FSRSCard> => {
  const { data, error } = await supabase
    .from('flashcards')
    .update({
      due: fsrsData.due.toISOString(),
      stability: fsrsData.stability,
      difficulty: fsrsData.difficulty,
      elapsed_days: fsrsData.elapsed_days,
      scheduled_days: fsrsData.scheduled_days,
      reps: fsrsData.reps,
      lapses: fsrsData.lapses,
      state: fsrsData.state,
      last_review: fsrsData.last_review.toISOString(),
      total_time: Math.round(fsrsData.total_time),
      success_rate: fsrsData.success_rate,
      updated_at: new Date().toISOString()
    })
    .eq('id', cardId)
    .select()
    .single();

  if (error) throw error;
  return convertToFSRSCard(data);
};

/**
 * Delete a flashcard
 */
export const deleteFlashcard = async (cardId: string): Promise<void> => {
  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', cardId);

  if (error) throw error;
};

/**
 * Delete multiple flashcards
 */
export const deleteFlashcards = async (cardIds: string[]): Promise<void> => {
  const { error } = await supabase
    .from('flashcards')
    .delete()
    .in('id', cardIds);

  if (error) throw error;
};

// ============================================================================
// FSRS Integration Functions
// ============================================================================

/**
 * Submit a review for a flashcard using FSRS algorithm
 */
export const submitCardReview = async (
  cardId: string,
  rating: ReviewRating,
  sessionId?: string,
  responseTime?: number
): Promise<FSRSCard> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get current card state
  const { data: cardData, error: cardError } = await supabase
    .from('flashcards')
    .select('*')
    .eq('id', cardId)
    .single();

  if (cardError) throw cardError;

  const currentCard = convertToFSRSCard(cardData);

  // Get user's FSRS parameters
  const parameters = await getUserFSRSParameters(user.id, currentCard.set_id);
  const fsrs = new FSRS(parameters);

  // Calculate new card state using FSRS
  const updatedCard = fsrs.schedule(currentCard, rating);
  
  // Create review log
  const reviewLog = fsrs.createReviewLog(currentCard, rating, responseTime);

  // Start a transaction
  const { error: transactionError } = await supabase.rpc('submit_card_review_transaction', {
    p_card_id: cardId,
    p_user_id: user.id,
    p_session_id: sessionId,
    p_rating: rating,
    p_response_time: responseTime,
    p_due: updatedCard.due.toISOString(),
    p_stability: updatedCard.stability,
    p_difficulty: updatedCard.difficulty,
    p_elapsed_days: Math.round(updatedCard.elapsed_days),
    p_scheduled_days: Math.round(updatedCard.scheduled_days),
    p_reps: updatedCard.reps,
    p_lapses: updatedCard.lapses,
    p_state: updatedCard.state,
    p_last_review: updatedCard.last_review?.toISOString() || new Date().toISOString()
  });

  if (transactionError) throw transactionError;

  // Update local card data
  const finalCard = await updateFlashcardAfterReview(cardId, {
    due: updatedCard.due,
    stability: updatedCard.stability,
    difficulty: updatedCard.difficulty,
    elapsed_days: Math.round(updatedCard.elapsed_days),
    scheduled_days: Math.round(updatedCard.scheduled_days),
    reps: updatedCard.reps,
    lapses: updatedCard.lapses,
    state: updatedCard.state,
    last_review: updatedCard.last_review || new Date(),
    total_time: Math.round(currentCard.total_time + (responseTime ? responseTime / 1000 : 0)),
    success_rate: calculateSuccessRate(updatedCard.reps, updatedCard.lapses)
  });

  return finalCard;
};

/**
 * Get user's FSRS parameters
 */
export const getUserFSRSParameters = async (
  userId: string, 
  setId?: string
): Promise<FSRSParameters> => {
  const { data, error } = await supabase
    .from('fsrs_parameters')
    .select('*')
    .eq('user_id', userId)
    .eq('set_id', setId || null)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  if (!data) {
    // Create default parameters if they don't exist
    return await createDefaultFSRSParameters(userId, setId);
  }

  return {
    w0: data.w0,
    w1: data.w1,
    w2: data.w2,
    w3: data.w3,
    w4: data.w4,
    w5: data.w5,
    w6: data.w6,
    w7: data.w7,
    w8: data.w8,
    w9: data.w9,
    w10: data.w10,
    w11: data.w11,
    w12: data.w12,
    w13: data.w13,
    w14: data.w14,
    w15: data.w15,
    w16: data.w16,
    requestRetention: data.request_retention,
    maximumInterval: data.maximum_interval,
    easyBonus: data.easy_bonus,
    hardInterval: data.hard_interval,
    newInterval: data.new_interval,
    graduatingInterval: data.graduating_interval,
    easyInterval: data.easy_interval,
    learningSteps: data.learning_steps,
    relearningSteps: data.relearning_steps
  };
};

/**
 * Create default FSRS parameters for a user
 */
export const createDefaultFSRSParameters = async (
  userId: string,
  setId?: string
): Promise<FSRSParameters> => {
  const defaultParams = {
    user_id: userId,
    set_id: setId,
    // Default FSRS-5 parameters
    w0: 0.4072,
    w1: 1.1829,
    w2: 3.1262,
    w3: 15.4722,
    w4: 7.2102,
    w5: 0.5316,
    w6: 1.0651,
    w7: 0.0234,
    w8: 1.616,
    w9: 0.1544,
    w10: 0.8395,
    w11: 1.9519,
    w12: 0.0967,
    w13: 0.8132,
    w14: 0.0179,
    w15: 0.1097,
    w16: 2.4681,
    request_retention: 0.9,
    maximum_interval: 36500,
    easy_bonus: 1.3,
    hard_interval: 1.2,
    new_interval: 0.0,
    graduating_interval: 1,
    easy_interval: 4,
    learning_steps: [1, 10],
    relearning_steps: [10]
  };

  const { data, error } = await supabase
    .from('fsrs_parameters')
    .insert(defaultParams)
    .select()
    .single();

  if (error) throw error;

  return {
    w0: data.w0,
    w1: data.w1,
    w2: data.w2,
    w3: data.w3,
    w4: data.w4,
    w5: data.w5,
    w6: data.w6,
    w7: data.w7,
    w8: data.w8,
    w9: data.w9,
    w10: data.w10,
    w11: data.w11,
    w12: data.w12,
    w13: data.w13,
    w14: data.w14,
    w15: data.w15,
    w16: data.w16,
    requestRetention: data.request_retention,
    maximumInterval: data.maximum_interval,
    easyBonus: data.easy_bonus,
    hardInterval: data.hard_interval,
    newInterval: data.new_interval,
    graduatingInterval: data.graduating_interval,
    easyInterval: data.easy_interval,
    learningSteps: data.learning_steps,
    relearningSteps: data.relearning_steps
  };
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert database flashcard to FSRSCard format
 */
function convertToFSRSCard(dbCard: any): FSRSCard {
  return {
    id: dbCard.id,
    question: dbCard.question,
    answer: dbCard.answer,
    hint: dbCard.hint,
    explanation: dbCard.explanation,
    due: new Date(dbCard.due),
    stability: dbCard.stability,
    difficulty: dbCard.difficulty,
    elapsed_days: dbCard.elapsed_days,
    scheduled_days: dbCard.scheduled_days,
    reps: dbCard.reps,
    lapses: dbCard.lapses,
    state: dbCard.state,
    last_review: dbCard.last_review ? new Date(dbCard.last_review) : undefined,
    total_time: dbCard.total_time,
    average_time: dbCard.average_time,
    success_rate: dbCard.success_rate,
    created_at: new Date(dbCard.created_at),
    updated_at: new Date(dbCard.updated_at),
    tags: dbCard.tags || [],
    subject: dbCard.subject,
    set_id: dbCard.set_id
  };
}

/**
 * Calculate success rate based on reps and lapses
 */
function calculateSuccessRate(reps: number, lapses: number): number {
  if (reps === 0) return 0;
  return Math.max(0, (reps - lapses) / reps);
}

/**
 * Update set's last_studied timestamp
 */
export const updateSetLastStudied = async (setId: string): Promise<void> => {
  const { error } = await supabase
    .from('flashcard_sets')
    .update({
      last_studied: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', setId);

  if (error) throw error;
};

// 获取当前用户的所有闪卡（遍历所有集合）
export const getAllUserFlashcards = async (): Promise<FSRSCard[]> => {
  // 1. 先获取所有集合
  const sets = await getFlashcardSets()
  if (sets.length === 0) return []

  const allCards: FSRSCard[] = []
  // 2. 逐个集合获取闪卡并合并
  for (const set of sets) {
    try {
      const cards = await getFlashcards(set.id)
      allCards.push(...cards)
    } catch (err) {
      console.error(`Failed to load cards for set ${set.id}:`, err)
    }
  }

  return allCards
}

/**
 * Get all flashcards from a list of set IDs
 */
export const getFlashcardsBySetIds = async (setIds: string[]): Promise<FSRSCard[]> => {
  if (!setIds || setIds.length === 0) {
    return [];
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .in('set_id', setIds)
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error('Error fetching flashcards by set IDs:', error);
    throw error;
  }
  
  return data.map(convertToFSRSCard);
};

/**
 * Create a new flashcard set from exam mistakes
 */
export const createSetFromMistakes = async (
  title: string,
  questions: ExamQuestion[]
): Promise<FlashcardSet> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // 1. Create the new flashcard set
  const newSetData: CreateFlashcardSetData = {
    title,
    description: `A collection of incorrect answers from the exam taken on ${new Date().toLocaleDateString()}.`,
    subject: questions.length > 0 ? questions[0].subject_area : 'General',
    tags: ['mistake-collection', 'exam-review'],
  };
  
  const { data: newSet, error: setError } = await supabase
    .from('flashcard_sets')
    .insert({ ...newSetData, user_id: user.id })
    .select()
    .single();

  if (setError) {
    console.error('Error creating new set from mistakes:', setError);
    throw setError;
  }

  // 2. Prepare the new flashcards (the mistakes)
  const cardsToCreate: CreateFlashcardData[] = questions.map(q => ({
    set_id: newSet.id,
    question: q.question,
    answer: Array.isArray(q.correct_answer) ? q.correct_answer.join('; ') : q.correct_answer,
    card_type: 'basic',
    tags: q.topic ? [q.topic] : [],
  }));

  // 3. Insert the new flashcards
  if (cardsToCreate.length > 0) {
    const { error: cardsError } = await supabase
      .from('flashcards')
      .insert(cardsToCreate);

    if (cardsError) {
      console.error('Error inserting mistake flashcards:', cardsError);
      // Optional: Clean up by deleting the newly created set if cards fail to insert
      await supabase.from('flashcard_sets').delete().eq('id', newSet.id);
      throw cardsError;
    }
  }

  return newSet;
}; 