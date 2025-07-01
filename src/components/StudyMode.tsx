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

  // 键盘快捷键
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!showAnswer) {
        if (event.code === 'Space') {
          event.preventDefault();
          handleShowAnswer();
        }
        return;
      }

      // 评分快捷键
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

  // 显示答案
  const handleShowAnswer = useCallback(() => {
    setIsFlipped(true);
    setTimeout(() => {
      setShowAnswer(true);
    }, 150);
  }, []);

  // 处理评分
  const handleRating = async (rating: ReviewRating) => {
    if (!currentCard || loading) return;
    
    setLoading(true);
    const responseTime = Date.now() - cardStartTime;

    try {
      // 提交评分到后端，让FSRS算法处理
      await submitCardReview(currentCard.id, rating, undefined, responseTime);
      
      // 更新会话统计
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

      // 移动到下一张卡片
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
        setIsFlipped(false);
        setShowAnswer(false);
        setCardStartTime(Date.now());
      } else {
        // 学习完成
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
        
        // 更新集合的最后学习时间
        await updateSetLastStudied(setId);
        
        onComplete(finalSession);
      }
    } catch (error) {
      console.error('评分提交失败:', error);
      alert('评分提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取卡片状态文本
  const getCardStateText = (state: FSRSState) => {
    switch (state) {
      case FSRSState.NEW: return '新卡片';
      case FSRSState.LEARNING: return '学习中';
      case FSRSState.REVIEW: return '复习';
      case FSRSState.RELEARNING: return '重新学习';
      default: return '未知';
    }
  };

  // 获取难度颜色
  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return '#00ff7f';
    if (difficulty <= 6) return '#ff9f0a';
    return '#ff453a';
  };

  if (!currentCard) {
    return <div className={styles.container}>没有可学习的卡片</div>;
  }

  return (
    <div className={styles.container}>
      {/* 头部信息 */}
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
            难度: {currentCard.difficulty.toFixed(1)}
          </span>
        </div>
        
        <button onClick={onExit} className={styles.exitButton}>
          ✕ 退出
        </button>
      </div>

      {/* 卡片区域 */}
      <div className={styles.cardContainer}>
        <div className={`${styles.card} ${isFlipped ? styles.flipped : ''}`}>
          {/* 正面 - 问题 */}
          <div className={styles.cardFront}>
            <div className={styles.cardContent}>
              <div className={styles.questionLabel}>问题</div>
              <div className={styles.question}>
                {currentCard.question}
              </div>
              
              {currentCard.hint && (
                <div className={styles.hint}>
                  💡 提示: {currentCard.hint}
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

          {/* 背面 - 答案 */}
          <div className={styles.cardBack}>
            <div className={styles.cardContent}>
              <div className={styles.questionLabel}>问题</div>
              <div className={styles.questionSmall}>
                {currentCard.question}
              </div>
              
              <div className={styles.answerLabel}>答案</div>
              <div className={styles.answer}>
                {currentCard.answer}
              </div>
              
              {currentCard.explanation && (
                <div className={styles.explanation}>
                  📝 解释: {currentCard.explanation}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 操作区域 */}
      <div className={styles.actions}>
        {!showAnswer ? (
          <button 
            onClick={handleShowAnswer}
            className={styles.showAnswerButton}
            disabled={loading}
          >
            <span>显示答案</span>
            <span className={styles.shortcut}>空格键</span>
          </button>
        ) : (
          <div className={styles.ratingButtons}>
            <div className={styles.ratingTitle}>
              你记住了这张卡片吗？
            </div>
            
            <div className={styles.buttons}>
              <button
                onClick={() => handleRating(ReviewRating.AGAIN)}
                className={`${styles.ratingButton} ${styles.again}`}
                disabled={loading}
              >
                <span className={styles.ratingLabel}>忘记了</span>
                <span className={styles.ratingDescription}>需要重新学习</span>
                <span className={styles.shortcut}>1</span>
              </button>
              
              <button
                onClick={() => handleRating(ReviewRating.HARD)}
                className={`${styles.ratingButton} ${styles.hard}`}
                disabled={loading}
              >
                <span className={styles.ratingLabel}>困难</span>
                <span className={styles.ratingDescription}>勉强想起来</span>
                <span className={styles.shortcut}>2</span>
              </button>
              
              <button
                onClick={() => handleRating(ReviewRating.GOOD)}
                className={`${styles.ratingButton} ${styles.good}`}
                disabled={loading}
              >
                <span className={styles.ratingLabel}>良好</span>
                <span className={styles.ratingDescription}>正确回忆</span>
                <span className={styles.shortcut}>3</span>
              </button>
              
              <button
                onClick={() => handleRating(ReviewRating.EASY)}
                className={`${styles.ratingButton} ${styles.easy}`}
                disabled={loading}
              >
                <span className={styles.ratingLabel}>简单</span>
                <span className={styles.ratingDescription}>轻松回忆</span>
                <span className={styles.shortcut}>4</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 会话统计 */}
      <div className={styles.sessionStats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{session.cardsReviewed}</span>
          <span className={styles.statLabel}>已学习</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {session.cardsReviewed > 0 ? Math.round((session.correctAnswers / session.cardsReviewed) * 100) : 0}%
          </span>
          <span className={styles.statLabel}>正确率</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {Math.round((Date.now() - sessionStartTime) / 60000)}
          </span>
          <span className={styles.statLabel}>分钟</span>
        </div>
      </div>

      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}>处理中...</div>
        </div>
      )}
    </div>
  );
};

export default StudyMode; 