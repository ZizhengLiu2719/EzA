import { useEffect, useState } from 'react'
import styles from './Flashcard.module.css'

interface FlashcardData {
  id: string
  question: string
  answer: string
  subject: string
  difficulty: 1 | 2 | 3 | 4 | 5
  tags: string[]
  aiHint?: string
  explanation?: string
}

interface FlashcardProps {
  card: FlashcardData
  onNext: () => void
  onPrevious: () => void
  onMastered: () => void
  onNeedReview: () => void
  showHints?: boolean
  isLast?: boolean
  currentIndex: number
  totalCards: number
}

const Flashcard: React.FC<FlashcardProps> = ({
  card,
  onNext,
  onPrevious,
  onMastered,
  onNeedReview,
  showHints = true,
  isLast = false,
  currentIndex,
  totalCards
}) => {
  const [isFlipped, setIsFlipped] = useState(false)
  const [showAIHint, setShowAIHint] = useState(false)
  const [confidence, setConfidence] = useState<1 | 2 | 3 | null>(null)

  // Reset state when card changes
  useEffect(() => {
    setIsFlipped(false)
    setShowAIHint(false)
    setConfidence(null)
  }, [card.id])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case ' ':
          event.preventDefault()
          setIsFlipped(!isFlipped)
          break
        case 'ArrowLeft':
          if (currentIndex > 0) onPrevious()
          break
        case 'ArrowRight':
          if (currentIndex < totalCards - 1) onNext()
          break
        case '1':
          if (isFlipped) setConfidence(1)
          break
        case '2':
          if (isFlipped) setConfidence(2)
          break
        case '3':
          if (isFlipped) setConfidence(3)
          break
        case 'h':
          if (showHints && !isFlipped) setShowAIHint(!showAIHint)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isFlipped, showAIHint, currentIndex, totalCards, onNext, onPrevious])

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return '#10B981' // Green
      case 2: return '#06B6D4' // Cyan
      case 3: return '#F59E0B' // Yellow
      case 4: return '#EF4444' // Red
      case 5: return '#8B5CF6' // Purple
      default: return '#6B7280'
    }
  }

  const handleConfidenceSelect = (level: 1 | 2 | 3) => {
    setConfidence(level)
    
    // Auto-advance based on confidence
    setTimeout(() => {
      if (level === 1) {
        onNeedReview()
      } else if (level === 3) {
        onMastered()
      } else {
        onNext()
      }
    }, 1500)
  }

  return (
    <div className={styles.flashcardContainer}>
      {/* Header with progress */}
      <div className={styles.header}>
        <div className={styles.progress}>
          <span className={styles.progressText}>
            {currentIndex + 1} of {totalCards}
          </span>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className={styles.cardMeta}>
          <span className={styles.subject}>{card.subject}</span>
          <div 
            className={styles.difficultyBadge}
            style={{ backgroundColor: getDifficultyColor(card.difficulty) }}
          >
            {'★'.repeat(card.difficulty)}
          </div>
        </div>
      </div>

      {/* Main Flashcard */}
      <div className={styles.cardWrapper}>
        <div className={`${styles.card} ${isFlipped ? styles.flipped : ''}`}>
          {/* Front Side */}
          <div className={styles.cardSide + ' ' + styles.front}>
            <div className={styles.cardContent}>
              <h3 className={styles.question}>{card.question}</h3>
              
              <div className={styles.tags}>
                {card.tags.map(tag => (
                  <span key={tag} className={styles.tag}>#{tag}</span>
                ))}
              </div>
            </div>
            
            <div className={styles.flipHint}>
              <span>Space to flip</span>
            </div>
          </div>

          {/* Back Side */}
          <div className={styles.cardSide + ' ' + styles.back}>
            <div className={styles.cardContent}>
              <h3 className={styles.answer}>{card.answer}</h3>
              
              {card.explanation && (
                <div className={styles.explanation}>
                  <h4>💡 Explanation:</h4>
                  <p>{card.explanation}</p>
                </div>
              )}
            </div>
            
            {/* Confidence Rating */}
            <div className={styles.confidenceRating}>
              <h4>How confident are you?</h4>
              <div className={styles.confidenceButtons}>
                <button 
                  className={`${styles.confidenceBtn} ${styles.hard} ${confidence === 1 ? styles.selected : ''}`}
                  onClick={() => handleConfidenceSelect(1)}
                >
                  <span className={styles.confidenceIcon}>😰</span>
                  <span>Hard (1)</span>
                </button>
                <button 
                  className={`${styles.confidenceBtn} ${styles.medium} ${confidence === 2 ? styles.selected : ''}`}
                  onClick={() => handleConfidenceSelect(2)}
                >
                  <span className={styles.confidenceIcon}>🤔</span>
                  <span>Medium (2)</span>
                </button>
                <button 
                  className={`${styles.confidenceBtn} ${styles.easy} ${confidence === 3 ? styles.selected : ''}`}
                  onClick={() => handleConfidenceSelect(3)}
                >
                  <span className={styles.confidenceIcon}>😊</span>
                  <span>Easy (3)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Hint Panel */}
        {showHints && !isFlipped && (
          <div className={`${styles.aiHintPanel} ${showAIHint ? styles.visible : ''}`}>
            <div className={styles.hintHeader}>
              <span className={styles.hintIcon}>💡</span>
              <span>AI Hint</span>
              <button 
                className={styles.closeHint}
                onClick={() => setShowAIHint(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.hintContent}>
              {card.aiHint || "Think about the key concepts and relationships involved in this question."}
            </div>
          </div>
        )}

        {/* Flip Button */}
        <button 
          className={styles.flipButton}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <span className={styles.flipIcon}>↻</span>
          <span>{isFlipped ? 'Show Question' : 'Show Answer'}</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <div className={styles.navigationButtons}>
          <button 
            className={styles.navBtn}
            onClick={onPrevious}
            disabled={currentIndex === 0}
          >
            <span className={styles.navIcon}>←</span>
            Previous
          </button>
          
          <button 
            className={styles.navBtn}
            onClick={onNext}
            disabled={isLast}
          >
            Next
            <span className={styles.navIcon}>→</span>
          </button>
        </div>

        {showHints && !isFlipped && (
          <button 
            className={styles.hintButton}
            onClick={() => setShowAIHint(!showAIHint)}
          >
            <span className={styles.hintIcon}>💡</span>
            <span>Get Hint (H)</span>
          </button>
        )}

        <div className={styles.masteryButtons}>
          <button 
            className={styles.masteryBtn + ' ' + styles.needReview}
            onClick={onNeedReview}
          >
            <span className={styles.masteryIcon}>🔄</span>
            Need Review
          </button>
          
          <button 
            className={styles.masteryBtn + ' ' + styles.mastered}
            onClick={onMastered}
          >
            <span className={styles.masteryIcon}>✅</span>
            Mastered
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className={styles.shortcuts}>
        <div className={styles.shortcutItem}>
          <kbd>Space</kbd> Flip card
        </div>
        <div className={styles.shortcutItem}>
          <kbd>←</kbd> <kbd>→</kbd> Navigate
        </div>
        <div className={styles.shortcutItem}>
          <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> Rate confidence
        </div>
        <div className={styles.shortcutItem}>
          <kbd>H</kbd> Show hint
        </div>
      </div>
    </div>
  )
}

export default Flashcard 