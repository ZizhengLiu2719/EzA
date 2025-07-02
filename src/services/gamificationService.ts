/**
 * Gamification Service
 * Handles all logic related to user motivation, including XP, achievements, and streaks.
 */

export interface UserGamificationStats {
  user_id: string;
  xp: number;
  level: number;
  streak: number;
  last_active_date: string;
  achievements: string[]; // Array of achievement IDs
}

export const ACHIEVEMENT_LIST = {
  FIRST_A: { id: 'FIRST_A', name: 'Top Scorer', description: 'Get an A (90%+) on an exam for the first time!' },
  PERFECT_SCORE: { id: 'PERFECT_SCORE', name: 'Perfectionist', description: 'Get a 100% on an exam.' },
  STREAK_7: { id: 'STREAK_7', name: 'Week-Long Warrior', description: 'Maintain a study streak for 7 consecutive days.' },
  // Add more achievements here
};


class GamificationService {
  /**
   * Updates user XP and checks for level-ups.
   */
  async awardXP(userId: string, xp: number): Promise<{ oldLevel: number; newLevel: number; leveledUp: boolean }> {
    console.log(`Awarding ${xp} XP to user ${userId}`);
    // This is a stub. In a real implementation, you would:
    // 1. Fetch user's current gamification stats from Supabase.
    // 2. Add the new XP.
    // 3. Calculate the new level based on your XP-to-level formula.
    // 4. Update the user's stats in the database.
    // 5. Return the result.
    return { oldLevel: 1, newLevel: 1, leveledUp: false };
  }

  /**
   * Checks if a user has unlocked a new achievement.
   */
  async unlockAchievement(userId: string, achievementId: keyof typeof ACHIEVEMENT_LIST): Promise<boolean> {
    console.log(`Checking achievement ${achievementId} for user ${userId}`);
    // This is a stub. In a real implementation, you would:
    // 1. Fetch the user's unlocked achievements.
    // 2. If the achievement is not already unlocked, add it to the list.
    // 3. Update the user's stats in the database.
    // 4. Return true if a new achievement was unlocked, otherwise false.
    return true; // Assume it was newly unlocked for demonstration
  }

  /**
   * Updates the user's study streak.
   */
  async updateStreak(userId: string): Promise<{ newStreak: number; streakBroken: boolean }> {
    console.log(`Updating streak for user ${userId}`);
    // This is a stub.
    return { newStreak: 8, streakBroken: false };
  }
}

export const gamificationService = new GamificationService(); 