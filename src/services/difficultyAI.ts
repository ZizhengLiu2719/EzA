/**
 * AI difficulty adaptive service
 * Based on cognitive science and learning psychology
 */

import { getAIModel } from '@/config/aiModel'
import { FSRSCard } from '../types/SRSTypes'

export interface CognitiveLoad {
  intrinsic: number    // Intrinsic cognitive load (0-1)
  extraneous: number   // Extraneous cognitive load (0-1) 
  germane: number      // Germane cognitive load (0-1)
  total: number        // Total cognitive load (0-1)
  recommendation: 'reduce' | 'maintain' | 'increase'
}

export interface LearningContext {
  user_id: string
  subject: string
  session_duration: number // Current session duration in minutes
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night'
  energy_level: 'high' | 'medium' | 'low'
  distraction_level: 'high' | 'medium' | 'low'
  stress_level: 'high' | 'medium' | 'low'
  recent_performance: {
    accuracy: number
    response_time: number
    confidence: number
  }[]
}

export interface DifficultyRecommendation {
  target_difficulty: number      // Recommended target difficulty (1-10)
  adjustment_magnitude: number   // Adjustment magnitude (-3 to +3)
  confidence: number            // Recommendation confidence (0-1)
  reasoning: string            // Reason for the adjustment
  adaptive_strategy: 'gradual' | 'immediate' | 'delayed'
  next_review_timing: number   // Suggested next review interval in hours
  cognitive_load_target: CognitiveLoad
  personalization_factors: {
    learning_speed: number     // Learning speed factor (0-2)
    retention_strength: number // Memory retention strength (0-2)
    difficulty_preference: number // Difficulty preference (-1 to +1)
  }
}

export interface AdaptiveLearningProfile {
  user_id: string
  optimal_difficulty_range: [number, number]  // Optimal difficulty range
  cognitive_capacity: number                  // Cognitive capacity assessment
  learning_speed: number                      // Learning speed
  retention_rate: number                      // Memory retention rate
  preferred_challenge_level: number           // Preferred challenge level
  fatigue_pattern: number[]                   // Fatigue pattern (24 hours)
  peak_performance_hours: number[]            // Peak performance hours
  subject_strengths: Record<string, number>   // Subject strengths
  learning_style_weights: {
    visual: number
    auditory: number
    kinesthetic: number
    reading_writing: number
  }
}

interface Session {
  date: Date
  duration: number
  accuracy: number
  cards_count: number
  time_of_day: string
  subject: string
}

class DifficultyAI {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY
    this.baseUrl = 'https://api.openai.com/v1'
  }

  /**
   * Assesses the current cognitive load.
   */
  async assessCognitiveLoad(
    current_cards: FSRSCard[],
    context: LearningContext
  ): Promise<CognitiveLoad> {
    const prompt = `
As a cognitive psychology expert, assess the cognitive load of the current learning session:

Learning Context:
- Session Duration: ${context.session_duration} minutes
- Time of Day: ${context.time_of_day}
- Energy Level: ${context.energy_level}
- Distraction Level: ${context.distraction_level}
- Stress Level: ${context.stress_level}

Current Card Statistics:
- Number of Cards: ${current_cards.length}
- Average Difficulty: ${(current_cards.reduce((sum, card) => sum + card.difficulty, 0) / current_cards.length).toFixed(2)}
- Percentage of Complex Cards: ${(current_cards.filter(card => card.difficulty > 6).length / current_cards.length * 100).toFixed(1)}%

Recent Performance:
- Average Accuracy: ${(context.recent_performance.reduce((sum, p) => sum + p.accuracy, 0) / context.recent_performance.length * 100).toFixed(1)}%
- Average Response Time: ${(context.recent_performance.reduce((sum, p) => sum + p.response_time, 0) / context.recent_performance.length / 1000).toFixed(1)} seconds
- Average Confidence: ${(context.recent_performance.reduce((sum, p) => sum + p.confidence, 0) / context.recent_performance.length).toFixed(2)}

Based on cognitive load theory, please evaluate the three types of load:
1. Intrinsic Cognitive Load (complexity of the task itself)
2. Extraneous Cognitive Load (irrelevant distracting factors)
3. Germane Cognitive Load (processing that contributes to learning)

Output the assessment results and recommendations in JSON format.
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.3,
        max_tokens: 350
      })

      return this.parseCognitiveLoadResponse(response)
    } catch (error) {
      console.error('Cognitive load assessment failed:', error)
      return this.getFallbackCognitiveLoad(current_cards, context)
    }
  }

  /**
   * Generates a personalized difficulty recommendation.
   */
  async generateDifficultyRecommendation(
    card: FSRSCard,
    context: LearningContext,
    user_profile: AdaptiveLearningProfile,
    cognitive_load: CognitiveLoad
  ): Promise<DifficultyRecommendation> {
    const prompt = `
As an AI learning psychologist, provide a personalized difficulty adjustment recommendation for the user:

Current Card:
- Difficulty: ${card.difficulty}
- Stability: ${card.stability.toFixed(2)}
- Lapses: ${card.lapses}
- Repetitions: ${card.reps}

User Learning Profile:
- Optimal Difficulty Range: ${user_profile.optimal_difficulty_range[0]}-${user_profile.optimal_difficulty_range[1]}
- Cognitive Capacity: ${user_profile.cognitive_capacity.toFixed(2)}
- Learning Speed: ${user_profile.learning_speed.toFixed(2)}
- Retention Rate: ${(user_profile.retention_rate * 100).toFixed(1)}%
- Preferred Challenge Level: ${user_profile.preferred_challenge_level.toFixed(2)}

Current State:
- Cognitive Load: ${cognitive_load.total.toFixed(2)} (${cognitive_load.recommendation})
- Session Duration: ${context.session_duration} minutes
- Energy Level: ${context.energy_level}

Provide a recommendation based on the following principles:
1. Maintain an appropriate level of challenge (Zone of Proximal Development).
2. Avoid cognitive overload.
3. Personalize the adaptation to the user's profile.
4. Consider the current learning state.

Output a detailed difficulty adjustment recommendation in JSON format.
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.4,
        max_tokens: 450
      })

      return this.parseDifficultyRecommendation(response, card, user_profile)
    } catch (error) {
      console.error('Difficulty recommendation generation failed:', error)
      return this.getFallbackDifficultyRecommendation(card, context, user_profile, cognitive_load)
    }
  }

  /**
   * Dynamically adjusts the learning pace.
   */
  async adjustLearningPace(
    session_performance: {
      cards_completed: number
      total_time: number
      accuracy: number
      fatigue_indicators: string[]
    },
    target_goals: {
      desired_accuracy: number
      time_budget: number
      cards_target: number
    }
  ): Promise<{
    recommended_pace: 'slower' | 'maintain' | 'faster'
    break_suggestion: {
      needed: boolean
      duration: number // minutes
      type: 'micro' | 'short' | 'long'
    }
    session_adjustment: {
      continue: boolean
      remaining_time_allocation: number
      difficulty_adjustment: number
    }
    motivational_message: string
  }> {
    const pace_ratio = session_performance.cards_completed / (session_performance.total_time / 60) // cards/minute
    const accuracy_gap = target_goals.desired_accuracy - session_performance.accuracy
    
    const prompt = `
As a learning pace optimization expert, analyze the current learning session and provide adjustment recommendations:

Session Performance:
- Cards Completed: ${session_performance.cards_completed}
- Total Time: ${session_performance.total_time} minutes
- Current Accuracy: ${(session_performance.accuracy * 100).toFixed(1)}%
- Learning Pace: ${pace_ratio.toFixed(2)} cards/minute
- Fatigue Indicators: ${session_performance.fatigue_indicators.join(', ')}

Target Goals:
- Desired Accuracy: ${(target_goals.desired_accuracy * 100).toFixed(1)}%
- Time Budget: ${target_goals.time_budget} minutes
- Card Target: ${target_goals.cards_target} cards

Based on principles of learning psychology, provide:
1. Pace adjustment recommendation (slower/maintain/faster)
2. Break suggestion (if needed, duration, type)
3. Session adjustment strategy
4. Motivational feedback

Output the recommendations in JSON format.
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.5,
        max_tokens: 400
      })

      return this.parsePaceAdjustment(response)
    } catch (error) {
      console.error('Learning pace adjustment failed:', error)
      return this.getFallbackPaceAdjustment(session_performance, target_goals)
    }
  }

  /**
   * Builds a user's learning profile.
   */
  async buildLearningProfile(
    user_id: string,
    historical_data: {
      cards_studied: FSRSCard[]
      session_records: Array<{
        date: Date
        duration: number
        accuracy: number
        cards_count: number
        time_of_day: string
        subject: string
      }>
      preference_feedback: Array<{
        difficulty: number
        satisfaction: number
        perceived_challenge: number
      }>
    }
  ): Promise<AdaptiveLearningProfile> {
    const prompt = `
As an expert in educational data mining and learning analytics, build a comprehensive adaptive learning profile for the user.

**User ID:** ${user_id}

**Historical Data Summary:**
- Total Sessions: ${historical_data.session_records.length}
- Preference Feedbacks: ${historical_data.preference_feedback.length}
- Difficulty Distribution of Studied Cards: ${this.calculateDifficultyDistribution(historical_data.cards_studied)}
- Performance by Time of Day: ${this.analyzeTimePerformance(historical_data.session_records)}
- Performance by Subject: ${this.analyzeSubjectPerformance(historical_data.session_records)}

**Your Task:**
Analyze all the provided data to model the user's learning characteristics. Infer the following attributes for their profile:

1.  **Optimal Difficulty Range:** The sweet spot of difficulty (1-10) where the user learns most effectively.
2.  **Cognitive Capacity:** An estimation of the user's working memory and processing power.
3.  **Learning Speed:** How quickly the user masters new concepts.
4.  **Retention Rate:** How well the user retains information over time.
5.  **Preferred Challenge Level:** The user's stated or inferred preference for challenge.
6.  **Fatigue Pattern:** Identify patterns of performance decline over a 24-hour cycle.
7.  **Peak Performance Hours:** The times of day when the user performs best.
8.  **Subject Strengths:** A map of subjects where the user excels.
9.  **Learning Style Weights:** The user's dominant learning styles (visual, auditory, etc.).

**Methodology:**
- Use statistical analysis and machine learning principles.
- Correlate performance (accuracy, time) with context (difficulty, time of day, subject).
- Synthesize quantitative data with qualitative preference feedback.

Output the complete, structured learning profile in JSON format.
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.3,
        max_tokens: 600
      })

      return this.parseLearningProfile(response, user_id)
    } catch (error) {
      console.error('Learning profile building failed:', error)
      return this.getFallbackLearningProfile(user_id, historical_data)
    }
  }

  // === Private helper methods ===

  private async callOpenAI(prompt: string, options: any = {}): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: getAIModel(),
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.4,
        max_tokens: options.max_tokens || 400
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }

  private parseCognitiveLoadResponse(response: string): CognitiveLoad {
    try {
      const parsed = JSON.parse(response)
      return {
        intrinsic: parsed.intrinsic || 0.5,
        extraneous: parsed.extraneous || 0.3,
        germane: parsed.germane || 0.6,
        total: parsed.total || 0.7,
        recommendation: parsed.recommendation || 'maintain'
      }
    } catch (error) {
      return {
        intrinsic: 0.5,
        extraneous: 0.3,
        germane: 0.6,
        total: 0.7,
        recommendation: 'maintain'
      }
    }
  }

  private parseDifficultyRecommendation(
    response: string,
    card: FSRSCard,
    profile: AdaptiveLearningProfile
  ): DifficultyRecommendation {
    try {
      const parsed = JSON.parse(response)
      return {
        target_difficulty: parsed.target_difficulty || card.difficulty,
        adjustment_magnitude: parsed.adjustment_magnitude || 0,
        confidence: parsed.confidence || 0.7,
        reasoning: parsed.reasoning || 'Fallback logic based on cognitive load and recent accuracy.',
        adaptive_strategy: parsed.adaptive_strategy || 'gradual',
        next_review_timing: parsed.next_review_timing || 24,
        cognitive_load_target: parsed.cognitive_load_target || this.getFallbackCognitiveLoad([], {} as LearningContext),
        personalization_factors: parsed.personalization_factors || {
          learning_speed: profile.learning_speed,
          retention_strength: profile.retention_rate,
          difficulty_preference: profile.preferred_challenge_level,
        }
      }
    } catch (error) {
      return this.getFallbackDifficultyRecommendation(card, {} as LearningContext, profile, {} as CognitiveLoad)
    }
  }

  private parsePaceAdjustment(response: string): any {
    try {
      return JSON.parse(response)
    } catch (error) {
      return {
        recommended_pace: 'maintain',
        break_suggestion: {
          needed: false,
          duration: 0,
          type: 'micro'
        },
        session_adjustment: {
          continue: true,
          remaining_time_allocation: 30,
          difficulty_adjustment: 0
        },
        motivational_message: 'Keep up the great work! Consistency is key.'
      }
    }
  }

  private parseLearningProfile(response: string, user_id: string): AdaptiveLearningProfile {
    try {
      const parsed = JSON.parse(response)
      return {
        user_id,
        optimal_difficulty_range: parsed.optimal_difficulty_range || [4, 7],
        cognitive_capacity: parsed.cognitive_capacity || 0.8,
        learning_speed: parsed.learning_speed || 1.0,
        retention_rate: parsed.retention_rate || 0.8,
        preferred_challenge_level: parsed.preferred_challenge_level || 6,
        fatigue_pattern: parsed.fatigue_pattern || new Array(24).fill(0.5),
        peak_performance_hours: parsed.peak_performance_hours || [9, 10, 11, 15, 16],
        subject_strengths: parsed.subject_strengths || {},
        learning_style_weights: parsed.learning_style_weights || {
          visual: 0.3,
          auditory: 0.2,
          kinesthetic: 0.2,
          reading_writing: 0.3
        }
      }
    } catch (error) {
      return this.getFallbackLearningProfile(user_id, {} as any)
    }
  }

  private calculateDifficultyDistribution(cards: FSRSCard[]): string {
    const distribution = cards.reduce((acc, card) => {
      const BUCKET_SIZE = 2;
      const bucket = Math.floor((card.difficulty - 1) / BUCKET_SIZE) * BUCKET_SIZE;
      const key = `Difficulty ${bucket + 1}-${bucket + BUCKET_SIZE}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution)
      .map(([key, value]) => `${key}: ${((value / cards.length) * 100).toFixed(1)}%`)
      .join(', ');
  }

  private analyzeTimePerformance(sessions: Session[]): string {
    const performanceByHour = sessions.reduce((acc, session) => {
      const hour = new Date(session.date).getHours();
      if (!acc[hour]) {
        acc[hour] = [];
      }
      acc[hour].push(session.accuracy);
      return acc;
    }, {} as Record<number, number[]>);

    return Object.entries(performanceByHour)
      .map(([hour, accuracies]) => {
        const avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
        return `Hour ${hour}: ${avgAccuracy.toFixed(2)}%`;
      })
      .join('; ');
  }

  private analyzeSubjectPerformance(sessions: Session[]): string {
    const performanceBySubject = sessions.reduce((acc, session) => {
      const subject = session.subject;
      if (!acc[subject]) {
        acc[subject] = [];
      }
      acc[subject].push(session.accuracy);
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(performanceBySubject)
      .map(([subject, accuracies]) => {
        const avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
        return `${subject}: ${avgAccuracy.toFixed(2)}%`;
      })
      .join('; ');
  }

  private getFallbackCognitiveLoad(cards: FSRSCard[], context: LearningContext): CognitiveLoad {
    const total = (context.distraction_level === 'high' ? 0.8 : 0.5);
    return {
      intrinsic: 0.5,
      extraneous: 0.6,
      germane: 0.7,
      total,
      recommendation: total > 0.7 ? 'reduce' : 'maintain'
    };
  }

  private getFallbackDifficultyRecommendation(
    card: FSRSCard,
    context: LearningContext,
    profile: AdaptiveLearningProfile,
    load: CognitiveLoad
  ): DifficultyRecommendation {
    let adjustment = 0;
    if (load.total > 0.8) adjustment = -1;
    if (context.recent_performance.length > 0 && context.recent_performance.slice(-1)[0].accuracy < 0.6) {
      adjustment -= 1;
    }
    
    const target_difficulty = Math.max(1, Math.min(10, card.difficulty + adjustment));

    return {
      target_difficulty,
      adjustment_magnitude: adjustment,
      confidence: 0.6,
      reasoning: "Fallback logic based on cognitive load and recent accuracy.",
      adaptive_strategy: 'gradual',
      next_review_timing: 24,
      cognitive_load_target: this.getFallbackCognitiveLoad([], context),
      personalization_factors: {
        learning_speed: profile.learning_speed,
        retention_strength: profile.retention_rate,
        difficulty_preference: profile.preferred_challenge_level,
      }
    };
  }

  private getFallbackPaceAdjustment(performance: any, goals: any): any {
    return {
      recommended_pace: 'maintain',
      break_suggestion: { needed: false, duration: 0, type: 'micro' },
      session_adjustment: { continue: true, remaining_time_allocation: 30, difficulty_adjustment: 0 },
      motivational_message: 'Keep up the great work! Consistency is key.'
    };
  }

  private getFallbackLearningProfile(user_id: string, data: any): AdaptiveLearningProfile {
    return {
      user_id,
      optimal_difficulty_range: [4, 7],
      cognitive_capacity: 0.7,
      learning_speed: 1.0,
      retention_rate: 0.85,
      preferred_challenge_level: 6,
      fatigue_pattern: [],
      peak_performance_hours: [],
      subject_strengths: {},
      learning_style_weights: {
        visual: 0.25,
        auditory: 0.25,
        kinesthetic: 0.25,
        reading_writing: 0.25
      }
    };
  }
}

export const difficultyAI = new DifficultyAI()
export default difficultyAI 