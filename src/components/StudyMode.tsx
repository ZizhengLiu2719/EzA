import React, { useCallback, useEffect, useState } from 'react';
import { submitCardReview, updateSetLastStudied } from '../api/flashcards';
import { FSRSCard, FSRSState, ReviewRating } from '../types/SRSTypes';
import { FSRS } from '../utils/fsrsAlgorithm';
import styles from './StudyMode.module.css';

interface StudyModeProps {
  cards: FSRSCard[];
  setId: string;
  onComplete: (session: StudySession) => void;
  onExit: () => void;
}

interface StudySession {
  totalCards: number;
  cardsReviewed: number;
  correctAnswers: number;
  totalTime: number;
  ratingsCount: {
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
}

const StudyMode: React.FC<StudyModeProps> = ({ cards, setId, onComplete, onExit }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [session, setSession] = useState<StudySession>({
    totalCards: cards.length,
    cardsReviewed: 0,
    correctAnswers: 0,
    totalTime: 0,
    ratingsCount: {
      again: 0,
      hard: 0,
      good: 0,
      easy: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [fsrs] = useState(new FSRS());

  const currentCard = cards[currentCardIndex];
  const progress = ((currentCardIndex) / cards.length) * 100;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!showAnswer) {
        if (event.code === 'Space') {
          event.preventDefault();
          handleShowAnswer();
        }
        return;
      }

      // Rating shortcuts
      switch (event.key) {
        case '1':
          handleRating(ReviewRating.AGAIN);
          break;
        case '2':
          handleRating(ReviewRating.HARD);
          break;
        case '3':
          handleRating(ReviewRating.GOOD);
          break;
        case '4':
          handleRating(ReviewRating.EASY);
          break;
        case ' ':
          event.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showAnswer, currentCard]);

  // Show answer
  const handleShowAnswer = useCallback(() => {
    setIsFlipped(true);
    setTimeout(() => {
      setShowAnswer(true);
    }, 150);
  }, []);

  // Handle rating
  const handleRating = async (rating: ReviewRating) => {
    if (!currentCard || loading) return;
    
    setLoading(true);
    const responseTime = Date.now() - cardStartTime;

    try {
      // Submit rating to the backend for FSRS algorithm processing
      await submitCardReview(currentCard.id, rating, undefined, responseTime);
      
      // Update session statistics
      const isCorrect = rating === ReviewRating.GOOD || rating === ReviewRating.EASY;
      setSession(prev => ({
        ...prev,
        cardsReviewed: prev.cardsReviewed + 1,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        ratingsCount: {
          ...prev.ratingsCount,
          [rating === ReviewRating.AGAIN ? 'again' : 
           rating === ReviewRating.HARD ? 'hard' :
           rating === ReviewRating.GOOD ? 'good' : 'easy']: 
           prev.ratingsCount[
             rating === ReviewRating.AGAIN ? 'again' : 
             rating === ReviewRating.HARD ? 'hard' :
             rating === ReviewRating.GOOD ? 'good' : 'easy'
           ] + 1
        }
      }));

      // Move to the next card
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
        setIsFlipped(false);
        setShowAnswer(false);
        setCardStartTime(Date.now());
      } else {
        // Study complete
        const totalTime = Date.now() - sessionStartTime;
        const finalSession = {
          ...session,
          cardsReviewed: session.cardsReviewed + 1,
          correctAnswers: session.correctAnswers + (isCorrect ? 1 : 0),
          totalTime: Math.round(totalTime / 1000),
          ratingsCount: {
            ...session.ratingsCount,
            [rating === ReviewRating.AGAIN ? 'again' : 
             rating === ReviewRating.HARD ? 'hard' :
             rating === ReviewRating.GOOD ? 'good' : 'easy']: 
             session.ratingsCount[
               rating === ReviewRating.AGAIN ? 'again' : 
               rating === ReviewRating.HARD ? 'hard' :
               rating === ReviewRating.GOOD ? 'good' : 'easy'
             ] + 1
          }
        };
        
        // Update the set's last studied time
        await updateSetLastStudied(setId);
        
        onComplete(finalSession);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review, please try again');
    } finally {
      setLoading(false);
    }
  };

  // Get card state text
  const getCardStateText = (state: FSRSState) => {
    switch (state) {
      case FSRSState.NEW: return 'New Card';
      case FSRSState.LEARNING: return 'Learning';
      case FSRSState.REVIEW: return 'Review';
      case FSRSState.RELEARNING: return 'Relearning';
      default: return 'Unknown';
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return '#00ff7f';
    if (difficulty <= 6) return '#ff9f0a';
    return '#ff453a';
  };

  if (!currentCard) {
    return <div className={styles.container}>No cards to study</div>;
  }

  return (
    <div className={styles.container}>
      {/* Header Info */}
      <div className={styles.header}>
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={styles.progressText}>
            {currentCardIndex + 1} / {cards.length}
          </span>
        </div>
        
        <div className={styles.cardInfo}>
          <span className={styles.cardState}>
            {getCardStateText(currentCard.state)}
          </span>
          <span 
            className={styles.cardDifficulty}
            style={{ color: getDifficultyColor(currentCard.difficulty) }}
          >
            Difficulty: {currentCard.difficulty.toFixed(1)}
          </span>
        </div>
        
        <button onClick={onExit} className={styles.exitButton}>
          ✕ Exit
        </button>
      </div>

      {/* Card Area */}
      <div className={styles.cardContainer}>
        <div className={`${styles.card} ${isFlipped ? styles.flipped : ''}`}>
          {/* Front - Question */}
          <div className={styles.cardFront}>
            <div className={styles.cardContent}>
              <div className={styles.questionLabel}>Question</div>
              <div className={styles.question}>
                {currentCard.question}
              </div>
              
              {currentCard.hint && (
                <div className={styles.hint}>
                  💡 Hint: {currentCard.hint}
                </div>
              )}
              
              {currentCard.tags && currentCard.tags.length > 0 && (
                <div className={styles.tags}>
                  {currentCard.tags.map((tag, index) => (
                    <span key={index} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Back - Answer */}
          <div className={styles.cardBack}>
            <div className={styles.cardContent}>
              <div className={styles.answerLabel}>Answer</div>
              <div className={styles.answer}>
                {currentCard.answer}
              </div>
              
              {currentCard.explanation && (
                <div className={styles.explanation}>
                  📝 Explanation: {currentCard.explanation}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className={styles.actions}>
        {!showAnswer ? (
          <button
            className={styles.showAnswerButton}
            onClick={handleShowAnswer}
          >
            Show Answer
            <span className={styles.shortcut}>Spacebar</span>
          </button>
        ) : loading ? (
          <div className={styles.ratingButtons}>
            <div className={styles.ratingTitle}>How well did you know this?</div>
            <div className={styles.buttons}>
              <button className={styles.processingButton} disabled>
                Processing...
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.ratingButtons}>
            <div className={styles.ratingTitle}>How well did you know this?</div>
            <div className={styles.buttons}>
              <button
                className={`${styles.ratingButton} ${styles.again}`}
                onClick={() => handleRating(ReviewRating.AGAIN)}
                disabled={loading}
              >
                <div className={styles.ratingLabel}>Again</div>
                <div className={styles.ratingDescription}>Complete Review</div>
                <span className={styles.shortcut}>1</span>
              </button>
              <button
                className={`${styles.ratingButton} ${styles.hard}`}
                onClick={() => handleRating(ReviewRating.HARD)}
                disabled={loading}
              >
                <div className={styles.ratingLabel}>Hard</div>
                <div className={styles.ratingDescription}>Review Tomorrow</div>
                <span className={styles.shortcut}>2</span>
              </button>
              <button
                className={`${styles.ratingButton} ${styles.good}`}
                onClick={() => handleRating(ReviewRating.GOOD)}
                disabled={loading}
              >
                <div className={styles.ratingLabel}>Good</div>
                <div className={styles.ratingDescription}>Review in 3 days</div>
                <span className={styles.shortcut}>3</span>
              </button>
              <button
                className={`${styles.ratingButton} ${styles.easy}`}
                onClick={() => handleRating(ReviewRating.EASY)}
                disabled={loading}
              >
                <div className={styles.ratingLabel}>Easy</div>
                <div className={styles.ratingDescription}>Review in 7 days</div>
                <span className={styles.shortcut}>4</span>
              </button>
            </div>
          </div>
        )}

        {/* Session Stats */}
        <div className={styles.sessionStats}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{session.cardsReviewed}</div>
            <div className={styles.statLabel}>Reviewed</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>
              {session.cardsReviewed > 0 
                ? `${Math.round((session.correctAnswers / session.cardsReviewed) * 100)}%`
                : '0%'}
            </div>
            <div className={styles.statLabel}>Correct</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{session.totalCards}</div>
            <div className={styles.statLabel}>Total</div>
          </div>
        </div>
      </div>

      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
        </div>
      )}
    </div>
  );
};

export default StudyMode; 