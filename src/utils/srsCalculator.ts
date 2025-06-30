/**
 * SRS 计算器工具函数
 * 用于复习间隔计算、统计分析和学习预测
 */

import {
    FSRSCard,
    FSRSState,
    LearningStats,
    ReviewLog,
    ReviewRating,
    ReviewSession
} from '../types/SRSTypes'

/**
 * 时间相关的计算工具
 */
export class TimeCalculator {
  /**
   * 将毫秒转换为友好的时间显示
   */
  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}天 ${hours % 24}小时`
    } else if (hours > 0) {
      return `${hours}小时 ${minutes % 60}分钟`
    } else if (minutes > 0) {
      return `${minutes}分钟 ${seconds % 60}秒`
    } else {
      return `${seconds}秒`
    }
  }

  /**
   * 计算下次复习的友好显示时间
   */
  static getNextReviewText(due: Date): string {
    const now = new Date()
    const diff = due.getTime() - now.getTime()
    
    if (diff <= 0) {
      return '现在复习'
    }
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)

    if (years > 0) {
      return `${years}年后`
    } else if (months > 0) {
      return `${months}个月后`
    } else if (weeks > 0) {
      return `${weeks}周后`
    } else if (days > 0) {
      return `${days}天后`
    } else if (hours > 0) {
      return `${hours}小时后`
    } else {
      return `${minutes}分钟后`
    }
  }

  /**
   * 获取相对时间 (例如: "2天前", "1小时前")
   */
  static getRelativeTime(date: Date): string {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 0) {
      return '未来'
    }
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30)

    if (months > 0) {
      return `${months}个月前`
    } else if (weeks > 0) {
      return `${weeks}周前`
    } else if (days > 0) {
      return `${days}天前`
    } else if (hours > 0) {
      return `${hours}小时前`
    } else if (minutes > 0) {
      return `${minutes}分钟前`
    } else {
      return '刚刚'
    }
  }
}

/**
 * 统计计算器
 */
export class StatsCalculator {
  /**
   * 计算学习统计数据
   */
  static calculateLearningStats(
    cards: FSRSCard[],
    sessions: ReviewSession[]
  ): LearningStats {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // 基础统计
    const total_cards = cards.length
    const new_cards = cards.filter(card => card.state === FSRSState.NEW).length
    const learning_cards = cards.filter(card => card.state === FSRSState.LEARNING || card.state === FSRSState.RELEARNING).length
    const review_cards = cards.filter(card => card.state === FSRSState.REVIEW).length

    // 复习统计
    const todaySessions = sessions.filter(session => session.created_at >= today)
    const thisWeekSessions = sessions.filter(session => session.created_at >= thisWeekStart)
    const thisMonthSessions = sessions.filter(session => session.created_at >= thisMonthStart)

    const reviews_today = todaySessions.reduce((sum, session) => sum + session.cards_reviewed, 0)
    const reviews_this_week = thisWeekSessions.reduce((sum, session) => sum + session.cards_reviewed, 0)
    const reviews_this_month = thisMonthSessions.reduce((sum, session) => sum + session.cards_reviewed, 0)

    // 掌握度统计
    const validCards = cards.filter(card => card.state !== FSRSState.NEW)
    const average_stability = validCards.length > 0 
      ? validCards.reduce((sum, card) => sum + card.stability, 0) / validCards.length 
      : 0
    const average_difficulty = validCards.length > 0 
      ? validCards.reduce((sum, card) => sum + card.difficulty, 0) / validCards.length 
      : 0
    const average_success_rate = validCards.length > 0 
      ? validCards.reduce((sum, card) => sum + card.success_rate, 0) / validCards.length 
      : 0

    // 时间统计 (转换为分钟)
    const time_studied_today = Math.round(todaySessions.reduce((sum, session) => sum + session.total_time, 0) / 60)
    const time_studied_this_week = Math.round(thisWeekSessions.reduce((sum, session) => sum + session.total_time, 0) / 60)
    const time_studied_this_month = Math.round(thisMonthSessions.reduce((sum, session) => sum + session.total_time, 0) / 60)

    // 预测数据
    const cards_due_today = cards.filter(card => card.due <= now).length
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const cards_due_tomorrow = cards.filter(card => card.due <= tomorrow && card.due > now).length
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const cards_due_this_week = cards.filter(card => card.due <= nextWeek && card.due > now).length

    // 保持率预测 (基于遗忘曲线)
    const retention_rate = this.calculateRetentionRates(cards)

    return {
      total_cards,
      new_cards,
      learning_cards,
      review_cards,
      reviews_today,
      reviews_this_week,
      reviews_this_month,
      average_stability,
      average_difficulty,
      average_success_rate,
      time_studied_today,
      time_studied_this_week,
      time_studied_this_month,
      cards_due_today,
      cards_due_tomorrow,
      cards_due_this_week,
      retention_rate
    }
  }

  /**
   * 计算保持率预测
   */
  private static calculateRetentionRates(cards: FSRSCard[]): {
    one_day: number
    one_week: number
    one_month: number
    three_months: number
  } {
    const reviewCards = cards.filter(card => card.state === FSRSState.REVIEW && card.stability > 0)
    
    if (reviewCards.length === 0) {
      return { one_day: 0, one_week: 0, one_month: 0, three_months: 0 }
    }

    const calculateRetention = (days: number) => {
      const retentions = reviewCards.map(card => 
        Math.pow(1 + (days / (9 * card.stability)), -1)
      )
      return retentions.reduce((sum, r) => sum + r, 0) / retentions.length
    }

    return {
      one_day: Math.round(calculateRetention(1) * 100) / 100,
      one_week: Math.round(calculateRetention(7) * 100) / 100,
      one_month: Math.round(calculateRetention(30) * 100) / 100,
      three_months: Math.round(calculateRetention(90) * 100) / 100
    }
  }

  /**
   * 计算会话的准确率分布
   */
  static calculateAccuracyDistribution(reviews: ReviewLog[]): {
    again: number
    hard: number
    good: number
    easy: number
  } {
    const total = reviews.length
    if (total === 0) {
      return { again: 0, hard: 0, good: 0, easy: 0 }
    }

    const again = reviews.filter(r => r.rating === ReviewRating.AGAIN).length
    const hard = reviews.filter(r => r.rating === ReviewRating.HARD).length
    const good = reviews.filter(r => r.rating === ReviewRating.GOOD).length
    const easy = reviews.filter(r => r.rating === ReviewRating.EASY).length

    return {
      again: Math.round((again / total) * 100) / 100,
      hard: Math.round((hard / total) * 100) / 100,
      good: Math.round((good / total) * 100) / 100,
      easy: Math.round((easy / total) * 100) / 100
    }
  }

  /**
   * 计算学习效率分数 (0-100)
   */
  static calculateEfficiencyScore(sessions: ReviewSession[]): number {
    if (sessions.length === 0) return 0

    const recentSessions = sessions.slice(-10) // 最近10次会话
    const averageAccuracy = recentSessions.reduce((sum, session) => sum + session.accuracy, 0) / recentSessions.length
    const averageTimePerCard = recentSessions.reduce((sum, session) => 
      sum + (session.total_time / session.cards_reviewed), 0
    ) / recentSessions.length

    // 理想时间设定为30秒/卡片
    const idealTimePerCard = 30
    const timeEfficiency = Math.min(idealTimePerCard / averageTimePerCard, 1)
    
    // 综合分数: 70%准确率 + 30%时间效率
    const score = (averageAccuracy * 0.7 + timeEfficiency * 0.3) * 100
    
    return Math.round(score)
  }
}

/**
 * 预测计算器
 */
export class PredictionCalculator {
  /**
   * 预测学习完成时间
   */
  static predictCompletionTime(
    cards: FSRSCard[],
    dailyReviewLimit: number = 50
  ): {
    newCardsCompletionDays: number
    reviewBacklogDays: number
    totalCompletionDays: number
  } {
    const newCards = cards.filter(card => card.state === FSRSState.NEW).length
    const dueCards = cards.filter(card => card.due <= new Date()).length
    
    // 假设每天能学习的新卡片数量为复习限制的20%
    const dailyNewCards = Math.max(Math.floor(dailyReviewLimit * 0.2), 5)
    const dailyReviewCards = dailyReviewLimit - dailyNewCards
    
    const newCardsCompletionDays = Math.ceil(newCards / dailyNewCards)
    const reviewBacklogDays = Math.ceil(dueCards / dailyReviewCards)
    const totalCompletionDays = Math.max(newCardsCompletionDays, reviewBacklogDays)
    
    return {
      newCardsCompletionDays,
      reviewBacklogDays,
      totalCompletionDays
    }
  }

  /**
   * 预测记忆保持率趋势
   */
  static predictRetentionTrend(
    cards: FSRSCard[],
    days: number = 30
  ): Array<{ day: number; retention: number }> {
    const reviewCards = cards.filter(card => card.state === FSRSState.REVIEW)
    
    if (reviewCards.length === 0) {
      return Array.from({ length: days }, (_, i) => ({ day: i + 1, retention: 0 }))
    }

    return Array.from({ length: days }, (_, i) => {
      const day = i + 1
      const retentions = reviewCards.map(card => 
        Math.pow(1 + (day / (9 * card.stability)), -1)
      )
      const averageRetention = retentions.reduce((sum, r) => sum + r, 0) / retentions.length
      
      return {
        day,
        retention: Math.round(averageRetention * 100) / 100
      }
    })
  }

  /**
   * 预测每日复习工作量
   */
  static predictDailyWorkload(
    cards: FSRSCard[],
    days: number = 14
  ): Array<{ date: Date; dueCards: number; newCards: number }> {
    const now = new Date()
    
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      
      const dueCards = cards.filter(card => 
        card.due >= dayStart && card.due < dayEnd && card.state !== FSRSState.NEW
      ).length
      
      // 新卡片分配策略: 平均分配到未来几天
      const newCards = i === 0 ? cards.filter(card => card.state === FSRSState.NEW).length : 0
      
      return {
        date,
        dueCards,
        newCards
      }
    })
  }
}

/**
 * 难度分析器
 */
export class DifficultyAnalyzer {
  /**
   * 分析卡片难度分布
   */
  static analyzeDifficultyDistribution(cards: FSRSCard[]): {
    easy: number      // 难度 1-3
    medium: number    // 难度 4-6
    hard: number      // 难度 7-10
    average: number
  } {
    const validCards = cards.filter(card => card.state !== FSRSState.NEW)
    
    if (validCards.length === 0) {
      return { easy: 0, medium: 0, hard: 0, average: 0 }
    }

    const easy = validCards.filter(card => card.difficulty <= 3).length
    const medium = validCards.filter(card => card.difficulty > 3 && card.difficulty <= 6).length
    const hard = validCards.filter(card => card.difficulty > 6).length
    const average = validCards.reduce((sum, card) => sum + card.difficulty, 0) / validCards.length

    return {
      easy: Math.round((easy / validCards.length) * 100),
      medium: Math.round((medium / validCards.length) * 100),
      hard: Math.round((hard / validCards.length) * 100),
      average: Math.round(average * 100) / 100
    }
  }

  /**
   * 识别问题卡片
   */
  static identifyProblemCards(cards: FSRSCard[]): {
    highLapses: FSRSCard[]      // 高错误次数
    lowStability: FSRSCard[]    // 低稳定性
    highDifficulty: FSRSCard[]  // 高难度
  } {
    const reviewCards = cards.filter(card => card.state === FSRSState.REVIEW)
    
    // 计算阈值
    const averageLapses = reviewCards.reduce((sum, card) => sum + card.lapses, 0) / reviewCards.length
    const averageStability = reviewCards.reduce((sum, card) => sum + card.stability, 0) / reviewCards.length
    const averageDifficulty = reviewCards.reduce((sum, card) => sum + card.difficulty, 0) / reviewCards.length

    return {
      highLapses: reviewCards.filter(card => card.lapses > averageLapses * 2),
      lowStability: reviewCards.filter(card => card.stability < averageStability * 0.5),
      highDifficulty: reviewCards.filter(card => card.difficulty > Math.max(averageDifficulty * 1.5, 7))
    }
  }
}

/**
 * 便捷导出的计算器函数
 */

// 时间相关
export const formatDuration = TimeCalculator.formatDuration
export const getNextReviewText = TimeCalculator.getNextReviewText
export const getRelativeTime = TimeCalculator.getRelativeTime

// 统计相关
export const calculateLearningStats = StatsCalculator.calculateLearningStats
export const calculateAccuracyDistribution = StatsCalculator.calculateAccuracyDistribution
export const calculateEfficiencyScore = StatsCalculator.calculateEfficiencyScore

// 预测相关
export const predictCompletionTime = PredictionCalculator.predictCompletionTime
export const predictRetentionTrend = PredictionCalculator.predictRetentionTrend
export const predictDailyWorkload = PredictionCalculator.predictDailyWorkload

// 难度分析
export const analyzeDifficultyDistribution = DifficultyAnalyzer.analyzeDifficultyDistribution
export const identifyProblemCards = DifficultyAnalyzer.identifyProblemCards 