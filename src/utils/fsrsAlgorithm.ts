/**
 * FSRS-5 算法核心实现
 * Free Spaced Repetition Scheduler - Version 5
 * 基于最新的记忆研究和认知科学优化
 */

import {
    DEFAULT_FSRS_PARAMETERS,
    FSRSCard,
    FSRSParameters,
    FSRSState,
    ReviewLog,
    ReviewRating
} from '../types/SRSTypes'

/**
 * FSRS-5 核心算法类
 */
export class FSRS {
  private parameters: FSRSParameters

  constructor(parameters: FSRSParameters = DEFAULT_FSRS_PARAMETERS) {
    this.parameters = parameters
  }

  /**
   * 更新算法参数
   */
  updateParameters(newParameters: Partial<FSRSParameters>): void {
    this.parameters = { ...this.parameters, ...newParameters }
  }

  /**
   * 获取当前参数
   */
  getParameters(): FSRSParameters {
    return { ...this.parameters }
  }

  /**
   * 计算卡片的初始难度
   */
  private initDifficulty(grade: ReviewRating): number {
    return Math.min(Math.max(this.parameters.w0 + this.parameters.w1 * (grade - 3), 1), 10)
  }

  /**
   * 计算卡片的初始稳定性
   */
  private initStability(grade: ReviewRating): number {
    return Math.max(this.parameters.w2 + this.parameters.w3 * (grade - 3), 0.1)
  }

  /**
   * 计算下次复习的稳定性
   */
  private nextStability(
    difficulty: number,
    stability: number,
    retrievability: number,
    grade: ReviewRating,
    elapsed_days: number
  ): number {
    const hard_penalty = grade === ReviewRating.HARD ? this.parameters.w5 : 1
    const easy_bonus = grade === ReviewRating.EASY ? this.parameters.easyBonus : 1

    if (grade === ReviewRating.AGAIN) {
      // 遗忘情况，重新学习
      return (
        this.parameters.w6 * 
        Math.pow(difficulty, this.parameters.w7) * 
        Math.pow(stability, this.parameters.w8) * 
        Math.exp(this.parameters.w9 * (1 - retrievability))
      ) * hard_penalty
    } else {
      // 成功回忆
      return (
        stability * 
        (1 + 
          Math.exp(this.parameters.w10) * 
          (11 - difficulty) * 
          Math.pow(stability, this.parameters.w11) * 
          (Math.exp(this.parameters.w12 * (1 - retrievability)) - 1) *
          hard_penalty *
          easy_bonus
        )
      )
    }
  }

  /**
   * 计算下次复习的难度
   */
  private nextDifficulty(difficulty: number, grade: ReviewRating): number {
    const next_difficulty = difficulty + this.parameters.w13 * (grade - 3)
    return Math.min(Math.max(next_difficulty, 1), 10)
  }

  /**
   * 计算可检索性 (记忆强度)
   */
  private forgettingCurve(elapsed_days: number, stability: number): number {
    return Math.pow(1 + (elapsed_days / (9 * stability)), -1)
  }

  /**
   * 计算复习间隔
   */
  private calculateInterval(stability: number): number {
    return Math.max(
      1,
      Math.min(
        Math.round(stability * Math.log(this.parameters.requestRetention) / Math.log(0.9)),
        this.parameters.maximumInterval
      )
    )
  }

  /**
   * 处理新卡片的复习
   */
  private scheduleNewCard(card: FSRSCard, grade: ReviewRating): FSRSCard {
    const scheduledDays = grade === ReviewRating.EASY 
      ? Math.round(this.parameters.easyInterval) 
      : Math.round(this.parameters.graduatingInterval)

    const newCard: FSRSCard = {
      ...card,
      difficulty: this.initDifficulty(grade),
      stability: this.initStability(grade),
      due: new Date(Date.now() + scheduledDays * 24 * 60 * 60 * 1000),
      scheduled_days: Math.round(scheduledDays),
      elapsed_days: 0,
      reps: Math.round(card.reps + 1),
      state: Math.round(grade === ReviewRating.AGAIN ? FSRSState.LEARNING : FSRSState.REVIEW),
      last_review: new Date(),
      updated_at: new Date()
    }

    if (grade === ReviewRating.AGAIN) {
      newCard.lapses = Math.round(card.lapses + 1)
    }

    return newCard
  }

  /**
   * 处理学习中卡片的复习
   */
  private scheduleLearningCard(card: FSRSCard, grade: ReviewRating): FSRSCard {
    const learningSteps = this.parameters.learningSteps
    const currentStep = Math.min(Math.round(card.reps), learningSteps.length - 1)

    if (grade === ReviewRating.AGAIN) {
      // 重新开始学习
      return {
        ...card,
        due: new Date(Date.now() + learningSteps[0] * 60 * 1000),
        scheduled_days: Math.round(learningSteps[0] / (24 * 60)),
        elapsed_days: 0,
        reps: 1,
        lapses: Math.round(card.lapses + 1),
        state: Math.round(FSRSState.LEARNING),
        last_review: new Date(),
        updated_at: new Date()
      }
    } else if (currentStep >= learningSteps.length - 1 && grade >= ReviewRating.GOOD) {
      // 毕业到复习状态
      const stability = this.initStability(grade)
      const interval = this.calculateInterval(stability)
      
      return {
        ...card,
        difficulty: this.initDifficulty(grade),
        stability,
        due: new Date(Date.now() + interval * 24 * 60 * 60 * 1000),
        scheduled_days: Math.round(interval),
        elapsed_days: 0,
        reps: Math.round(card.reps + 1),
        state: Math.round(FSRSState.REVIEW),
        last_review: new Date(),
        updated_at: new Date()
      }
    } else {
      // 继续学习
      const nextStepIndex = grade >= ReviewRating.GOOD ? currentStep + 1 : currentStep
      const nextStep = learningSteps[Math.min(nextStepIndex, learningSteps.length - 1)]
      
      return {
        ...card,
        due: new Date(Date.now() + nextStep * 60 * 1000),
        scheduled_days: Math.round(nextStep / (24 * 60)),
        elapsed_days: 0,
        reps: Math.round(card.reps + 1),
        state: Math.round(FSRSState.LEARNING),
        last_review: new Date(),
        updated_at: new Date()
      }
    }
  }

  /**
   * 处理复习卡片的复习
   */
  private scheduleReviewCard(card: FSRSCard, grade: ReviewRating): FSRSCard {
    const elapsed_days = Math.round(card.elapsed_days > 0 ? card.elapsed_days : 1)
    const retrievability = this.forgettingCurve(elapsed_days, card.stability)
    
    const new_difficulty = this.nextDifficulty(card.difficulty, grade)
    const new_stability = this.nextStability(
      card.difficulty,
      card.stability,
      retrievability,
      grade,
      elapsed_days
    )

    if (grade === ReviewRating.AGAIN) {
      // 进入重新学习状态
      const relearningSteps = this.parameters.relearningSteps
      
      return {
        ...card,
        difficulty: new_difficulty,
        stability: new_stability,
        due: new Date(Date.now() + relearningSteps[0] * 60 * 1000),
        scheduled_days: Math.round(relearningSteps[0] / (24 * 60)),
        elapsed_days: 0,
        reps: Math.round(card.reps + 1),
        lapses: Math.round(card.lapses + 1),
        state: Math.round(FSRSState.RELEARNING),
        last_review: new Date(),
        updated_at: new Date()
      }
    } else {
      // 正常复习
      const interval = this.calculateInterval(new_stability)
      
      return {
        ...card,
        difficulty: new_difficulty,
        stability: new_stability,
        due: new Date(Date.now() + interval * 24 * 60 * 60 * 1000),
        scheduled_days: Math.round(interval),
        elapsed_days: 0,
        reps: Math.round(card.reps + 1),
        state: Math.round(FSRSState.REVIEW),
        last_review: new Date(),
        updated_at: new Date()
      }
    }
  }

  /**
   * 处理重新学习卡片的复习
   */
  private scheduleRelearningCard(card: FSRSCard, grade: ReviewRating): FSRSCard {
    const relearningSteps = this.parameters.relearningSteps
    const currentStep = Math.min(Math.round(card.reps), relearningSteps.length - 1)

    if (grade === ReviewRating.AGAIN) {
      // 重新开始重新学习
      return {
        ...card,
        due: new Date(Date.now() + relearningSteps[0] * 60 * 1000),
        scheduled_days: Math.round(relearningSteps[0] / (24 * 60)),
        elapsed_days: 0,
        reps: 1,
        lapses: Math.round(card.lapses + 1),
        state: Math.round(FSRSState.RELEARNING),
        last_review: new Date(),
        updated_at: new Date()
      }
    } else if (currentStep >= relearningSteps.length - 1 && grade >= ReviewRating.GOOD) {
      // 毕业到复习状态
      const stability = this.initStability(grade)
      const interval = this.calculateInterval(stability)
      
      return {
        ...card,
        difficulty: this.initDifficulty(grade),
        stability,
        due: new Date(Date.now() + interval * 24 * 60 * 60 * 1000),
        scheduled_days: Math.round(interval),
        elapsed_days: 0,
        reps: Math.round(card.reps + 1),
        state: Math.round(FSRSState.REVIEW),
        last_review: new Date(),
        updated_at: new Date()
      }
    } else {
      // 继续重新学习
      const nextStepIndex = grade >= ReviewRating.GOOD ? currentStep + 1 : currentStep
      const nextStep = relearningSteps[Math.min(nextStepIndex, relearningSteps.length - 1)]
      
      return {
        ...card,
        due: new Date(Date.now() + nextStep * 60 * 1000),
        scheduled_days: Math.round(nextStep / (24 * 60)),
        elapsed_days: 0,
        reps: Math.round(card.reps + 1),
        state: Math.round(FSRSState.RELEARNING),
        last_review: new Date(),
        updated_at: new Date()
      }
    }
  }

  /**
   * 主要的复习调度方法
   */
  public schedule(card: FSRSCard, grade: ReviewRating): FSRSCard {
    // 更新经过天数
    if (card.last_review) {
      const elapsed = Math.max(
        0,
        Math.floor((Date.now() - card.last_review.getTime()) / (24 * 60 * 60 * 1000))
      )
      card.elapsed_days = elapsed
    }

    // 根据卡片状态分发到不同的调度方法
    switch (card.state) {
      case FSRSState.NEW:
        return this.scheduleNewCard(card, grade)
      case FSRSState.LEARNING:
        return this.scheduleLearningCard(card, grade)
      case FSRSState.REVIEW:
        return this.scheduleReviewCard(card, grade)
      case FSRSState.RELEARNING:
        return this.scheduleRelearningCard(card, grade)
      default:
        throw new Error(`Unknown card state: ${card.state}`)
    }
  }

  /**
   * 创建复习日志
   */
  public createReviewLog(card: FSRSCard, grade: ReviewRating, duration?: number): ReviewLog {
    return {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      cardId: card.id,
      rating: grade,
      state: card.state,
      due: card.due,
      stability: card.stability,
      difficulty: card.difficulty,
      elapsed_days: card.elapsed_days,
      last_elapsed_days: card.elapsed_days,
      scheduled_days: card.scheduled_days,
      review: new Date(),
      duration
    }
  }

  /**
   * 获取卡片的当前可检索性
   */
  public getRetrievability(card: FSRSCard): number {
    if (card.state === FSRSState.NEW) return 0
    
    const elapsed_days = card.last_review 
      ? Math.max(0, Math.floor((Date.now() - card.last_review.getTime()) / (24 * 60 * 60 * 1000)))
      : 0
    
    return this.forgettingCurve(elapsed_days, card.stability)
  }

  /**
   * 预测所有评级选项的结果
   */
  public preview(card: FSRSCard): { [key in ReviewRating]: FSRSCard } {
    return {
      [ReviewRating.AGAIN]: this.schedule({ ...card }, ReviewRating.AGAIN),
      [ReviewRating.HARD]: this.schedule({ ...card }, ReviewRating.HARD),
      [ReviewRating.GOOD]: this.schedule({ ...card }, ReviewRating.GOOD),
      [ReviewRating.EASY]: this.schedule({ ...card }, ReviewRating.EASY)
    }
  }

  /**
   * 检查卡片是否到期
   */
  public isDue(card: FSRSCard): boolean {
    return card.due.getTime() <= Date.now()
  }

  /**
   * 获取到期卡片列表
   */
  public getDueCards(cards: FSRSCard[]): FSRSCard[] {
    return cards.filter(card => this.isDue(card))
  }

  /**
   * 按优先级排序卡片 (到期时间 + 状态优先级)
   */
  public sortCards(cards: FSRSCard[]): FSRSCard[] {
    return cards.sort((a, b) => {
      // 状态优先级: LEARNING > RELEARNING > REVIEW > NEW
      const statePriority = {
        [FSRSState.LEARNING]: 4,
        [FSRSState.RELEARNING]: 3,
        [FSRSState.REVIEW]: 2,
        [FSRSState.NEW]: 1
      }
      
      // 首先按状态优先级排序
      const priorityDiff = statePriority[b.state] - statePriority[a.state]
      if (priorityDiff !== 0) return priorityDiff
      
      // 然后按到期时间排序
      return a.due.getTime() - b.due.getTime()
    })
  }
}

/**
 * 全局FSRS实例
 */
export const fsrs = new FSRS()

/**
 * 便捷函数：调度卡片复习
 */
export function scheduleCard(card: FSRSCard, grade: ReviewRating): FSRSCard {
  return fsrs.schedule(card, grade)
}

/**
 * 便捷函数：获取卡片可检索性
 */
export function getCardRetrievability(card: FSRSCard): number {
  return fsrs.getRetrievability(card)
}

/**
 * 便捷函数：检查卡片是否到期
 */
export function isCardDue(card: FSRSCard): boolean {
  return fsrs.isDue(card)
}

/**
 * 便捷函数：创建新卡片
 */
export function createNewCard(
  id: string,
  set_id: string,
  question: string,
  answer: string,
  hint?: string,
  explanation?: string
): FSRSCard {
  const now = new Date()
  
  return {
    id,
    set_id,
    question,
    answer,
    hint,
    explanation,
    due: now,
    stability: 2.0,
    difficulty: 5.0,
    elapsed_days: 0,
    scheduled_days: 1,
    reps: 0,
    lapses: 0,
    state: FSRSState.NEW,
    total_time: 0,
    average_time: 0,
    success_rate: 0,
    created_at: now,
    updated_at: now
  }
} 