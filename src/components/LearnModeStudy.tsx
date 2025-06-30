/**
 * Learn Mode Study Component
 * Quizlet-style adaptive learning with multiple choice and self-assessment
 */

import React, { useCallback, useEffect, useState } from 'react'
import { useSpacedRepetition } from '../hooks/useSpacedRepetition'
import { FSRSCard, ReviewRating } from '../types/SRSTypes'
import styles from './LearnModeStudy.module.css'

interface LearnModeStudyProps {
  cards: FSRSCard[]
  onComplete?: () => void
  onExit?: () => void
  className?: string
}

interface ChoiceOption {
  id: string
  text: string
  isCorrect: boolean
}

const LearnModeStudy: React.FC<LearnModeStudyProps> = ({
  cards,
  onComplete,
  onExit,
  className
}) => {
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [showAnswer, setShowAnswer] = useState(false)
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [choices, setChoices] = useState<ChoiceOption[]>([])
  const [isMultipleChoice, setIsMultipleChoice] = useState(true)
  const [userAnswer, setUserAnswer] = useState('')
  const [showExplanation, setShowExplanation] = useState(false)
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    startTime: Date.now()
  })

  const srs = useSpacedRepetition(cards, {
    // Learn mode optimized parameters
    requestRetention: 0.85,
    learningSteps: [1, 10, 1440], // 1min, 10min, 1day
  })

  // Generate multiple choice options
  const generateChoices = useCallback((currentCard: FSRSCard, allCards: FSRSCard[]): ChoiceOption[] => {
    if (!currentCard) return []

    const correctAnswer = currentCard.answer
    const incorrectOptions = allCards
      .filter(card => card.id !== currentCard.id && card.answer !== correctAnswer)
      .map(card => card.answer)
      .slice(0, 3) // Take 3 incorrect options

    // If we don't have enough incorrect options, use generic ones
    while (incorrectOptions.length < 3) {
      incorrectOptions.push(`选项 ${incorrectOptions.length + 1}`)
    }

    const allOptions = [correctAnswer, ...incorrectOptions]
    
    // Shuffle options
    const shuffled = allOptions
      .sort(() => Math.random() - 0.5)
      .map((text, index) => ({
        id: `choice_${index}`,
        text,
        isCorrect: text === correctAnswer
      }))

    return shuffled
  }, [])

  // Determine study mode based on card difficulty and stability
  useEffect(() => {
    if (srs.currentCard) {
      const { difficulty, stability, reps } = srs.currentCard
      
      // Use multiple choice for new/difficult cards, written for easier/reviewed cards
      const shouldUseMultipleChoice = reps < 3 || difficulty > 6 || stability < 2
      setIsMultipleChoice(shouldUseMultipleChoice)
      
      if (shouldUseMultipleChoice) {
        setChoices(generateChoices(srs.currentCard, cards))
      }
      
      // Reset state for new card
      setShowAnswer(false)
      setSelectedChoice(null)
      setUserAnswer('')
      setShowExplanation(false)
      setStartTime(Date.now())
    }
  }, [srs.currentCard, cards, generateChoices])

  // Handle multiple choice selection
  const handleChoiceSelect = useCallback((choiceId: string) => {
    if (showAnswer) return
    
    setSelectedChoice(choiceId)
    setShowAnswer(true)
    
    const selectedOption = choices.find(choice => choice.id === choiceId)
    if (selectedOption?.isCorrect) {
      setSessionStats(prev => ({ ...prev, correct: prev.correct + 1 }))
    } else {
      setSessionStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }))
    }
  }, [choices, showAnswer])

  // Handle written answer submission
  const handleAnswerSubmit = useCallback(() => {
    if (showAnswer) return
    
    setShowAnswer(true)
    
    // Simple similarity check (in real implementation, use better matching)
    const isCorrect = userAnswer.toLowerCase().trim() === 
      srs.currentCard?.answer.toLowerCase().trim()
    
    if (isCorrect) {
      setSessionStats(prev => ({ ...prev, correct: prev.correct + 1 }))
    } else {
      setSessionStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }))
    }
  }, [userAnswer, showAnswer, srs.currentCard])

  // Submit review rating
  const handleRatingSubmit = useCallback(async (rating: ReviewRating) => {
    if (!srs.currentCard) return
    
    const duration = Date.now() - startTime
    await srs.submitReview(rating, duration)
    
    // Show explanation if available and rating is not EASY
    if (srs.currentCard.explanation && rating !== ReviewRating.EASY) {
      setShowExplanation(true)
      setTimeout(() => setShowExplanation(false), 3000)
    }
  }, [srs, startTime])

  // Auto-advance for easy cards
  useEffect(() => {
    if (showAnswer && srs.currentCard) {
      const isCorrectAnswer = isMultipleChoice 
        ? choices.find(c => c.id === selectedChoice)?.isCorrect
        : userAnswer.toLowerCase().trim() === srs.currentCard.answer.toLowerCase().trim()
      
      if (isCorrectAnswer && srs.currentCard.stability > 7) {
        // Auto-advance for well-known cards
        setTimeout(() => handleRatingSubmit(ReviewRating.GOOD), 1500)
      }
    }
  }, [showAnswer, srs.currentCard, isMultipleChoice, choices, selectedChoice, userAnswer, handleRatingSubmit])

  // Handle session completion
  useEffect(() => {
    if (srs.remainingCards === 0 && onComplete) {
      onComplete()
    }
  }, [srs.remainingCards, onComplete])

  if (!srs.currentCard) {
    return (
      <div className={`${styles.learnMode} ${className || ''}`}>
        <div className={styles.completionScreen}>
          <div className={styles.completionIcon}>🎉</div>
          <h2>学习完成！</h2>
          <div className={styles.completionStats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{sessionStats.correct}</span>
              <span className={styles.statLabel}>正确</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{sessionStats.incorrect}</span>
              <span className={styles.statLabel}>错误</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {Math.round((sessionStats.correct / (sessionStats.correct + sessionStats.incorrect)) * 100)}%
              </span>
              <span className={styles.statLabel}>准确率</span>
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
  const isCorrectAnswer = isMultipleChoice 
    ? choices.find(c => c.id === selectedChoice)?.isCorrect
    : userAnswer.toLowerCase().trim() === currentCard.answer.toLowerCase().trim()

  return (
    <div className={`${styles.learnMode} ${className || ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ 
                width: `${((cards.length - srs.remainingCards) / cards.length) * 100}%` 
              }}
            />
          </div>
          <span className={styles.progressText}>
            {cards.length - srs.remainingCards} / {cards.length}
          </span>
        </div>
        
        <div className={styles.stats}>
          <span className={styles.statItem}>
            ✅ {sessionStats.correct}
          </span>
          <span className={styles.statItem}>
            ❌ {sessionStats.incorrect}
          </span>
        </div>
        
        <button onClick={onExit} className={styles.exitButton}>
          ✕
        </button>
      </div>

      {/* Card Content */}
      <div className={styles.cardContainer}>
        <div className={styles.questionSection}>
          <h1 className={styles.question}>{currentCard.question}</h1>
          {currentCard.hint && !showAnswer && (
            <div className={styles.hint}>💡 {currentCard.hint}</div>
          )}
        </div>

        {/* Answer Section */}
        <div className={styles.answerSection}>
          {isMultipleChoice ? (
            // Multiple Choice Mode
            <div className={styles.choicesContainer}>
              {choices.map(choice => (
                <button
                  key={choice.id}
                  className={`${styles.choice} ${
                    selectedChoice === choice.id ? styles.selected : ''
                  } ${
                    showAnswer && choice.isCorrect ? styles.correct : ''
                  } ${
                    showAnswer && selectedChoice === choice.id && !choice.isCorrect ? styles.incorrect : ''
                  }`}
                  onClick={() => handleChoiceSelect(choice.id)}
                  disabled={showAnswer}
                >
                  {choice.text}
                </button>
              ))}
            </div>
          ) : (
            // Written Answer Mode
            <div className={styles.writtenContainer}>
              <textarea
                className={styles.answerInput}
                placeholder="输入你的答案..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={showAnswer}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleAnswerSubmit()
                  }
                }}
              />
              {!showAnswer && (
                <button 
                  className={styles.submitButton}
                  onClick={handleAnswerSubmit}
                  disabled={!userAnswer.trim()}
                >
                  检查答案
                </button>
              )}
            </div>
          )}

          {/* Show correct answer */}
          {showAnswer && (
            <div className={styles.answerReveal}>
              <div className={`${styles.resultIndicator} ${isCorrectAnswer ? styles.correct : styles.incorrect}`}>
                {isCorrectAnswer ? '✅ 正确！' : '❌ 错误'}
              </div>
              
              {!isCorrectAnswer && (
                <div className={styles.correctAnswer}>
                  <strong>正确答案：</strong> {currentCard.answer}
                </div>
              )}
              
              {showExplanation && currentCard.explanation && (
                <div className={styles.explanation}>
                  <strong>解释：</strong> {currentCard.explanation}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rating Buttons */}
        {showAnswer && (
          <div className={styles.ratingSection}>
            <p className={styles.ratingPrompt}>这道题对你来说有多难？</p>
            <div className={styles.ratingButtons}>
              <button
                className={`${styles.ratingButton} ${styles.again}`}
                onClick={() => handleRatingSubmit(ReviewRating.AGAIN)}
              >
                重新学习
                <span className={styles.ratingDesc}>完全不记得</span>
              </button>
              
              <button
                className={`${styles.ratingButton} ${styles.hard}`}
                onClick={() => handleRatingSubmit(ReviewRating.HARD)}
              >
                困难
                <span className={styles.ratingDesc}>勉强记得</span>
              </button>
              
              <button
                className={`${styles.ratingButton} ${styles.good}`}
                onClick={() => handleRatingSubmit(ReviewRating.GOOD)}
              >
                良好
                <span className={styles.ratingDesc}>正常回忆</span>
              </button>
              
              <button
                className={`${styles.ratingButton} ${styles.easy}`}
                onClick={() => handleRatingSubmit(ReviewRating.EASY)}
              >
                简单
                <span className={styles.ratingDesc}>很容易</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className={styles.cardInfo}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>难度:</span>
          <span className={styles.infoValue}>{currentCard.difficulty.toFixed(1)}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>稳定性:</span>
          <span className={styles.infoValue}>{currentCard.stability.toFixed(1)}天</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>复习次数:</span>
          <span className={styles.infoValue}>{currentCard.reps}</span>
        </div>
      </div>
    </div>
  )
}

export default LearnModeStudy 