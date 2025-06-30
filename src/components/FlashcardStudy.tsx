/**
 * Enhanced Flashcard Study Component
 * Classic flashcard learning with FSRS-5 integration and modern features
 */

import React, { useCallback, useEffect, useState } from 'react'
import { useSpacedRepetition } from '../hooks/useSpacedRepetition'
import { FSRSCard, FSRSState, ReviewRating } from '../types/SRSTypes'
import { getCardRetrievability } from '../utils/fsrsAlgorithm'
import styles from './FlashcardStudy.module.css'

interface FlashcardStudyProps {
  cards: FSRSCard[]
  onComplete?: () => void
  onExit?: () => void
  showAnswerTimer?: boolean
  autoFlip?: boolean
  className?: string
}

const FlashcardStudy: React.FC<FlashcardStudyProps> = ({
  cards,
  onComplete,
  onExit,
  showAnswerTimer = true,
  autoFlip = false,
  className
}) => {
  const [isFlipped, setIsFlipped] = useState(false)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [thinkingTime, setThinkingTime] = useState<number>(0)
  const [showHint, setShowHint] = useState(false)
  const [sessionStats, setSessionStats] = useState({
    totalCards: 0,
    correctCards: 0,
    totalTime: 0,
    averageTime: 0
  })

  const srs = useSpacedRepetition(cards, {
    // Flashcard mode optimized parameters
    requestRetention: 0.9,
    learningSteps: [1, 10],
    show_answer_timer: showAnswerTimer
  })

  // Reset card state when new card appears
  useEffect(() => {
    if (srs.currentCard) {
      setIsFlipped(false)
      setShowHint(false)
      setStartTime(Date.now())
      setThinkingTime(0)
      
      // Auto-flip for cards in learning phase if enabled
      if (autoFlip && srs.currentCard.state === FSRSState.LEARNING) {
        const timer = setTimeout(() => setIsFlipped(true), 2000)
        return () => clearTimeout(timer)
      }
    }
  }, [srs.currentCard, autoFlip])

  // Update thinking time
  useEffect(() => {
    if (!isFlipped && srs.currentCard) {
      const interval = setInterval(() => {
        setThinkingTime(Date.now() - startTime)
      }, 100)
      return () => clearInterval(interval)
    }
  }, [isFlipped, startTime, srs.currentCard])

  // Handle card flip
  const handleFlip = useCallback(() => {
    if (!isFlipped) {
      setThinkingTime(Date.now() - startTime)
    }
    setIsFlipped(!isFlipped)
  }, [isFlipped, startTime])

  // Handle rating submission
  const handleRating = useCallback(async (rating: ReviewRating) => {
    if (!srs.currentCard) return

    const totalTime = Date.now() - startTime
    await srs.submitReview(rating, totalTime)

    // Update session stats
    setSessionStats(prev => ({
      totalCards: prev.totalCards + 1,
      correctCards: prev.correctCards + (rating >= ReviewRating.GOOD ? 1 : 0),
      totalTime: prev.totalTime + totalTime,
      averageTime: (prev.totalTime + totalTime) / (prev.totalCards + 1)
    }))

    // Reset for next card
    setStartTime(Date.now())
  }, [srs, startTime])

  // Handle session completion
  useEffect(() => {
    if (srs.remainingCards === 0 && onComplete) {
      onComplete()
    }
  }, [srs.remainingCards, onComplete])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!srs.currentCard) return

      switch (event.key) {
        case ' ':
        case 'Enter':
          event.preventDefault()
          if (!isFlipped) {
            handleFlip()
          }
          break
        case '1':
          if (isFlipped) {
            event.preventDefault()
            handleRating(ReviewRating.AGAIN)
          }
          break
        case '2':
          if (isFlipped) {
            event.preventDefault()
            handleRating(ReviewRating.HARD)
          }
          break
        case '3':
          if (isFlipped) {
            event.preventDefault()
            handleRating(ReviewRating.GOOD)
          }
          break
        case '4':
          if (isFlipped) {
            event.preventDefault()
            handleRating(ReviewRating.EASY)
          }
          break
        case 'h':
          if (!isFlipped && srs.currentCard.hint) {
            event.preventDefault()
            setShowHint(!showHint)
          }
          break
        case 'Escape':
          event.preventDefault()
          onExit?.()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [srs.currentCard, isFlipped, showHint, handleFlip, handleRating, onExit])

  if (!srs.currentCard) {
    return (
      <div className={`${styles.flashcardStudy} ${className || ''}`}>
        <div className={styles.completionScreen}>
          <div className={styles.completionIcon}>🎉</div>
          <h2>复习完成！</h2>
          <div className={styles.completionStats}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{sessionStats.totalCards}</div>
              <div className={styles.statLabel}>复习卡片</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {Math.round((sessionStats.correctCards / sessionStats.totalCards) * 100)}%
              </div>
              <div className={styles.statLabel}>准确率</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {Math.round(sessionStats.averageTime / 1000)}s
              </div>
              <div className={styles.statLabel}>平均用时</div>
            </div>
          </div>
          <button onClick={onExit} className={styles.exitButton}>
            返回主页
          </button>
        </div>
      </div>
    )
  }

  const currentCard = srs.currentCard
  const retrievability = getCardRetrievability(currentCard)
  const difficultyLevel = currentCard.difficulty > 7 ? 'hard' : currentCard.difficulty > 4 ? 'medium' : 'easy'

  return (
    <div className={`${styles.flashcardStudy} ${className || ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.progressInfo}>
          <div className={styles.progressText}>
            {cards.length - srs.remainingCards} / {cards.length}
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ 
                width: `${((cards.length - srs.remainingCards) / cards.length) * 100}%` 
              }}
            />
          </div>
        </div>

        <div className={styles.cardMetrics}>
          <div className={`${styles.metric} ${styles[difficultyLevel]}`}>
            <span className={styles.metricLabel}>难度</span>
            <span className={styles.metricValue}>{currentCard.difficulty.toFixed(1)}</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>记忆强度</span>
            <span className={styles.metricValue}>{Math.round(retrievability * 100)}%</span>
          </div>
          {showAnswerTimer && (
            <div className={styles.timer}>
              <span className={styles.metricLabel}>⏱️</span>
              <span className={styles.metricValue}>
                {Math.round(thinkingTime / 1000)}s
              </span>
            </div>
          )}
        </div>

        <button onClick={onExit} className={styles.exitButton}>
          ✕
        </button>
      </div>

      {/* Main Card */}
      <div className={styles.cardContainer}>
        <div className={`${styles.card} ${isFlipped ? styles.flipped : ''}`}>
          {/* Front Side (Question) */}
          <div className={styles.cardFront}>
            <div className={styles.cardContent}>
              <h1 className={styles.question}>{currentCard.question}</h1>
              
              {showHint && currentCard.hint && (
                <div className={styles.hint}>
                  💡 {currentCard.hint}
                </div>
              )}
              
              <div className={styles.cardActions}>
                {currentCard.hint && !showHint && (
                  <button 
                    className={styles.hintButton}
                    onClick={() => setShowHint(true)}
                  >
                    💡 显示提示 (H)
                  </button>
                )}
                
                <button 
                  className={styles.flipButton}
                  onClick={handleFlip}
                >
                  翻转查看答案 (空格键)
                </button>
              </div>
            </div>
          </div>

          {/* Back Side (Answer) */}
          <div className={styles.cardBack}>
            <div className={styles.cardContent}>
              <div className={styles.questionSmall}>{currentCard.question}</div>
              <div className={styles.divider}></div>
              <h2 className={styles.answer}>{currentCard.answer}</h2>
              
              {currentCard.explanation && (
                <div className={styles.explanation}>
                  <strong>解释：</strong> {currentCard.explanation}
                </div>
              )}
              
              <div className={styles.ratingSection}>
                <p className={styles.ratingPrompt}>你对这道题的掌握程度如何？</p>
                <div className={styles.ratingButtons}>
                  <button
                    className={`${styles.ratingButton} ${styles.again}`}
                    onClick={() => handleRating(ReviewRating.AGAIN)}
                    title="完全不记得 (1)"
                  >
                    <span className={styles.ratingKey}>1</span>
                    <span className={styles.ratingLabel}>重新学习</span>
                    <span className={styles.ratingTime}>
                      {srs.getCardPreview?.(currentCard)[ReviewRating.AGAIN]?.scheduled_days < 1 
                        ? `${Math.round(srs.getCardPreview?.(currentCard)[ReviewRating.AGAIN]?.scheduled_days * 24 * 60)}分钟后`
                        : `${Math.round(srs.getCardPreview?.(currentCard)[ReviewRating.AGAIN]?.scheduled_days)}天后`
                      }
                    </span>
                  </button>
                  
                  <button
                    className={`${styles.ratingButton} ${styles.hard}`}
                    onClick={() => handleRating(ReviewRating.HARD)}
                    title="勉强记得 (2)"
                  >
                    <span className={styles.ratingKey}>2</span>
                    <span className={styles.ratingLabel}>困难</span>
                    <span className={styles.ratingTime}>
                      {Math.round(srs.getCardPreview?.(currentCard)[ReviewRating.HARD]?.scheduled_days)}天后
                    </span>
                  </button>
                  
                  <button
                    className={`${styles.ratingButton} ${styles.good}`}
                    onClick={() => handleRating(ReviewRating.GOOD)}
                    title="正常回忆 (3)"
                  >
                    <span className={styles.ratingKey}>3</span>
                    <span className={styles.ratingLabel}>良好</span>
                    <span className={styles.ratingTime}>
                      {Math.round(srs.getCardPreview?.(currentCard)[ReviewRating.GOOD]?.scheduled_days)}天后
                    </span>
                  </button>
                  
                  <button
                    className={`${styles.ratingButton} ${styles.easy}`}
                    onClick={() => handleRating(ReviewRating.EASY)}
                    title="很容易 (4)"
                  >
                    <span className={styles.ratingKey}>4</span>
                    <span className={styles.ratingLabel}>简单</span>
                    <span className={styles.ratingTime}>
                      {Math.round(srs.getCardPreview?.(currentCard)[ReviewRating.EASY]?.scheduled_days)}天后
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Info */}
      <div className={styles.bottomInfo}>
        <div className={styles.cardStats}>
          <span>复习 {currentCard.reps} 次</span>
          <span>错误 {currentCard.lapses} 次</span>
          <span>成功率 {Math.round(currentCard.success_rate * 100)}%</span>
        </div>
        
        <div className={styles.shortcuts}>
          <span>快捷键：空格键翻转 | 1-4评分 | H提示 | ESC退出</span>
        </div>
      </div>
    </div>
  )
}

export default FlashcardStudy 