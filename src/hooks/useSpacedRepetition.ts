/**
 * 间隔重复系统主要 Hook
 * 提供完整的FSRS-5学习功能和状态管理
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    DEFAULT_FSRS_PARAMETERS,
    DEFAULT_SRS_CONFIG,
    FSRSCard,
    FSRSParameters,
    FSRSState,
    ReviewLog,
    ReviewRating,
    ReviewSession,
    SRSSchedulerConfig,
    UseSpacedRepetitionReturn
} from '../types/SRSTypes'
import { FSRS } from '../utils/fsrsAlgorithm'
import { calculateLearningStats } from '../utils/srsCalculator'

/**
 * 间隔重复系统 Hook
 */
export function useSpacedRepetition(
  initialCards: FSRSCard[] = [],
  initialParameters: Partial<FSRSParameters> = {},
  initialConfig: Partial<SRSSchedulerConfig> = {}
): UseSpacedRepetitionReturn {
  // 状态管理
  const [cards, setCards] = useState<FSRSCard[]>(initialCards)
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0)
  const [reviewLogs, setReviewLogs] = useState<ReviewLog[]>([])
  const [currentSession, setCurrentSession] = useState<Partial<ReviewSession> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionHistory, setSessionHistory] = useState<ReviewSession[]>([])

  // 配置管理
  const [parameters, setParameters] = useState<FSRSParameters>({
    ...DEFAULT_FSRS_PARAMETERS,
    ...initialParameters
  })
  
  const [config, setConfig] = useState<SRSSchedulerConfig>({
    ...DEFAULT_SRS_CONFIG,
    ...initialConfig
  })

  // FSRS 实例
  const fsrs = useMemo(() => new FSRS(parameters), [parameters])

  // 获取当前学习队列 (按优先级排序)
  const studyQueue = useMemo(() => {
    const dueCards = fsrs.getDueCards(cards)
    const sortedCards = fsrs.sortCards(dueCards)
    
    // 限制新卡片数量
    const newCardsInQueue = sortedCards.filter(card => card.state === FSRSState.NEW)
    if (newCardsInQueue.length > config.daily_new_cards) {
      // 移除超出限制的新卡片
      const excessNewCards = newCardsInQueue.slice(config.daily_new_cards)
      return sortedCards.filter(card => !excessNewCards.includes(card))
    }
    
    return sortedCards.slice(0, config.daily_review_cards)
  }, [cards, fsrs, config.daily_new_cards, config.daily_review_cards])

  // 当前卡片
  const currentCard = useMemo(() => {
    return studyQueue[currentCardIndex] || null
  }, [studyQueue, currentCardIndex])

  // 剩余卡片数量
  const remainingCards = useMemo(() => {
    return Math.max(0, studyQueue.length - currentCardIndex)
  }, [studyQueue.length, currentCardIndex])

  // 学习统计
  const learningStats = useMemo(() => {
    return calculateLearningStats(cards, sessionHistory)
  }, [cards, sessionHistory])

  // 会话统计
  const sessionStats = useMemo((): Partial<ReviewSession> => {
    if (!currentSession) {
      return {}
    }

    const now = new Date()
    const sessionDuration = currentSession.started_at 
      ? Math.floor((now.getTime() - currentSession.started_at.getTime()) / 1000)
      : 0

    const reviews = reviewLogs.filter(log => 
      currentSession.started_at && log.review >= currentSession.started_at
    )

    const accuracy = reviews.length > 0 
      ? reviews.filter(log => log.rating >= ReviewRating.GOOD).length / reviews.length 
      : 0

    return {
      ...currentSession,
      cards_reviewed: reviews.length,
      total_time: sessionDuration,
      accuracy,
      again_count: reviews.filter(log => log.rating === ReviewRating.AGAIN).length,
      hard_count: reviews.filter(log => log.rating === ReviewRating.HARD).length,
      good_count: reviews.filter(log => log.rating === ReviewRating.GOOD).length,
      easy_count: reviews.filter(log => log.rating === ReviewRating.EASY).length,
      reviews
    }
  }, [currentSession, reviewLogs])

  /**
   * 开始新的学习会话
   */
  const startSession = useCallback((mode: ReviewSession['mode'] = 'flashcard') => {
    const session: Partial<ReviewSession> = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: '', // 需要从上下文获取
      set_id: '', // 需要从上下文获取
      mode,
      started_at: new Date(),
      cards_reviewed: 0,
      total_time: 0,
      accuracy: 0,
      again_count: 0,
      hard_count: 0,
      good_count: 0,
      easy_count: 0,
      reviews: []
    }

    setCurrentSession(session)
    setCurrentCardIndex(0)
    setReviewLogs([])
    setError(null)
    
    console.log('🎯 开始新的学习会话:', mode)
  }, [])

  /**
   * 提交复习结果
   */
  const submitReview = useCallback(async (rating: ReviewRating, duration?: number) => {
    if (!currentCard) {
      setError('没有可复习的卡片')
      return
    }

    if (!currentSession) {
      setError('没有活动的学习会话')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 创建复习日志
      const reviewLog = fsrs.createReviewLog(currentCard, rating, duration)
      
      // 计算新的卡片状态
      const updatedCard = fsrs.schedule(currentCard, rating)
      
      // 更新卡片统计
      const newTotalTime = currentCard.total_time + (duration || 0) / 1000
      const newReps = updatedCard.reps
      const newAverageTime = newReps > 0 ? newTotalTime / newReps : 0
      const successfulReviews = reviewLogs.filter(log => 
        log.cardId === currentCard.id && log.rating >= ReviewRating.GOOD
      ).length + (rating >= ReviewRating.GOOD ? 1 : 0)
      const totalReviews = reviewLogs.filter(log => log.cardId === currentCard.id).length + 1
      const newSuccessRate = totalReviews > 0 ? successfulReviews / totalReviews : 0

      const finalUpdatedCard: FSRSCard = {
        ...updatedCard,
        total_time: newTotalTime,
        average_time: newAverageTime,
        success_rate: newSuccessRate
      }

      // 更新状态
      setCards(prevCards => 
        prevCards.map(card => 
          card.id === currentCard.id ? finalUpdatedCard : card
        )
      )
      
      setReviewLogs(prevLogs => [...prevLogs, reviewLog])

      // 移动到下一张卡片
      setCurrentCardIndex(prevIndex => prevIndex + 1)

      console.log('✅ 复习提交成功:', {
        rating: ReviewRating[rating],
        nextDue: finalUpdatedCard.due,
        stability: finalUpdatedCard.stability.toFixed(2),
        difficulty: finalUpdatedCard.difficulty.toFixed(2)
      })

    } catch (err: any) {
      console.error('❌ 复习提交失败:', err)
      setError(err.message || '提交复习失败')
    } finally {
      setIsLoading(false)
    }
  }, [currentCard, currentSession, fsrs, reviewLogs])

  /**
   * 跳过当前卡片
   */
  const skipCard = useCallback(() => {
    if (currentCard) {
      setCurrentCardIndex(prevIndex => prevIndex + 1)
      console.log('⏭️ 跳过卡片:', currentCard.question)
    }
  }, [currentCard])

  /**
   * 结束当前会话
   */
  const endSession = useCallback(async (): Promise<ReviewSession> => {
    if (!currentSession) {
      throw new Error('没有活动的会话可以结束')
    }

    const finalSession: ReviewSession = {
      ...currentSession,
      ended_at: new Date(),
      created_at: new Date(),
      reviews: reviewLogs.filter(log => 
        currentSession.started_at && log.review >= currentSession.started_at
      )
    } as ReviewSession

    // 更新会话历史
    setSessionHistory(prevHistory => [...prevHistory, finalSession])
    
    // 清理当前会话
    setCurrentSession(null)
    setCurrentCardIndex(0)
    setReviewLogs([])

    console.log('🎉 学习会话已结束:', {
      duration: finalSession.total_time,
      cardsReviewed: finalSession.cards_reviewed,
      accuracy: Math.round(finalSession.accuracy * 100)
    })

    return finalSession
  }, [currentSession, reviewLogs])

  /**
   * 更新FSRS参数
   */
  const updateParameters = useCallback((newParams: Partial<FSRSParameters>) => {
    setParameters(prevParams => ({
      ...prevParams,
      ...newParams
    }))
    console.log('⚙️ FSRS参数已更新')
  }, [])

  /**
   * 更新调度器配置
   */
  const updateConfig = useCallback((newConfig: Partial<SRSSchedulerConfig>) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      ...newConfig
    }))
    console.log('⚙️ 调度器配置已更新')
  }, [])

  /**
   * 重置当前会话
   */
  const resetSession = useCallback(() => {
    setCurrentSession(null)
    setCurrentCardIndex(0)
    setReviewLogs([])
    setError(null)
    console.log('🔄 会话已重置')
  }, [])

  /**
   * 添加新卡片
   */
  const addCards = useCallback((newCards: FSRSCard[]) => {
    setCards(prevCards => [...prevCards, ...newCards])
    console.log('➕ 添加了新卡片:', newCards.length)
  }, [])

  /**
   * 移除卡片
   */
  const removeCard = useCallback((cardId: string) => {
    setCards(prevCards => prevCards.filter(card => card.id !== cardId))
    console.log('🗑️ 移除了卡片:', cardId)
  }, [])

  /**
   * 获取卡片预览 (所有评级选项的结果)
   */
  const getCardPreview = useCallback((card: FSRSCard) => {
    return fsrs.preview(card)
  }, [fsrs])

  /**
   * 获取卡片的当前可检索性
   */
  const getCardRetrievability = useCallback((card: FSRSCard) => {
    return fsrs.getRetrievability(card)
  }, [fsrs])

  // 自动开始会话 (如果有卡片但没有活动会话)
  useEffect(() => {
    if (studyQueue.length > 0 && !currentSession && !isLoading) {
      startSession()
    }
  }, [studyQueue.length, currentSession, isLoading, startSession])

  // 返回Hook接口
  return {
    // 当前学习数据
    currentCard,
    remainingCards,
    sessionStats,
    
    // 学习控制
    submitReview,
    skipCard,
    endSession,
    
    // 状态
    isLoading,
    error,
    
    // 统计数据
    learningStats,
    
    // 配置
    parameters,
    updateParameters,
    
    // 扩展功能 (不在原接口中，但很有用)
    studyQueue,
    config,
    updateConfig,
    startSession,
    resetSession,
    addCards,
    removeCard,
    getCardPreview,
    getCardRetrievability,
    sessionHistory,
    reviewLogs
  } as UseSpacedRepetitionReturn & {
    // 扩展接口
    studyQueue: FSRSCard[]
    config: SRSSchedulerConfig
    updateConfig: (newConfig: Partial<SRSSchedulerConfig>) => void
    startSession: (mode?: ReviewSession['mode']) => void
    resetSession: () => void
    addCards: (newCards: FSRSCard[]) => void
    removeCard: (cardId: string) => void
    getCardPreview: (card: FSRSCard) => { [key in ReviewRating]: FSRSCard }
    getCardRetrievability: (card: FSRSCard) => number
    sessionHistory: ReviewSession[]
    reviewLogs: ReviewLog[]
  }
}

/**
 * 便捷Hook：用于单个卡片集的学习
 */
export function useFlashcardSetSRS(
  setId: string,
  cards: FSRSCard[],
  options?: {
    parameters?: Partial<FSRSParameters>
    config?: Partial<SRSSchedulerConfig>
    autoStart?: boolean
  }
) {
  const srs = useSpacedRepetition(cards, options?.parameters, options?.config)
  
  // 自动开始会话
  useEffect(() => {
    if (options?.autoStart && cards.length > 0 && !srs.currentCard) {
      (srs as any).startSession('flashcard')
    }
  }, [cards.length, options?.autoStart, srs])

  return {
    ...srs,
    setId
  }
}

/**
 * 便捷Hook：用于特定学习模式的SRS
 */
export function useStudyModeSRS(
  mode: ReviewSession['mode'],
  cards: FSRSCard[],
  options?: {
    parameters?: Partial<FSRSParameters>
    config?: Partial<SRSSchedulerConfig>
  }
) {
  const srs = useSpacedRepetition(cards, options?.parameters, options?.config)
  
  // 自动以指定模式开始会话
  useEffect(() => {
    if (cards.length > 0 && !srs.currentCard) {
      (srs as any).startSession(mode)
    }
  }, [cards.length, mode, srs])

  return {
    ...srs,
    mode
  }
}

export default useSpacedRepetition 