import React from 'react';
import styles from './StudyResults.module.css';

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

interface StudyResultsProps {
  session: StudySession;
  setTitle: string;
  onReviewAgain: () => void;
  onBackToSets: () => void;
}

const StudyResults: React.FC<StudyResultsProps> = ({
  session,
  setTitle,
  onReviewAgain,
  onBackToSets
}) => {
  const accuracy = session.cardsReviewed > 0 
    ? Math.round((session.correctAnswers / session.cardsReviewed) * 100) 
    : 0;
  
  const avgTimePerCard = session.cardsReviewed > 0 
    ? Math.round(session.totalTime / session.cardsReviewed) 
    : 0;

  const getPerformanceLevel = (accuracy: number) => {
    if (accuracy >= 90) return { level: '优秀', color: '#00ff7f', emoji: '🎉' };
    if (accuracy >= 75) return { level: '良好', color: '#00d2ff', emoji: '👍' };
    if (accuracy >= 60) return { level: '及格', color: '#ff9f0a', emoji: '📚' };
    return { level: '需加强', color: '#ff453a', emoji: '💪' };
  };

  const performance = getPerformanceLevel(accuracy);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}分${remainingSeconds}秒` : `${seconds}秒`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.icon}>{performance.emoji}</div>
        <h1 className={styles.title}>学习完成！</h1>
        <p className={styles.subtitle}>《{setTitle}》</p>
      </div>

      <div className={styles.performanceCard}>
        <div className={styles.performanceHeader}>
          <span 
            className={styles.performanceLevel}
            style={{ color: performance.color }}
          >
            {performance.level}
          </span>
          <span className={styles.accuracyScore} style={{ color: performance.color }}>
            {accuracy}%
          </span>
        </div>
        <div className={styles.performanceDescription}>
          本次学习表现评价
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📚</div>
          <div className={styles.statValue}>{session.cardsReviewed}</div>
          <div className={styles.statLabel}>学习卡片</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statValue}>{session.correctAnswers}</div>
          <div className={styles.statLabel}>正确回答</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>⏱️</div>
          <div className={styles.statValue}>{formatTime(session.totalTime)}</div>
          <div className={styles.statLabel}>总学习时间</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>⚡</div>
          <div className={styles.statValue}>{avgTimePerCard}秒</div>
          <div className={styles.statLabel}>平均每卡</div>
        </div>
      </div>

      <div className={styles.ratingsBreakdown}>
        <h3 className={styles.breakdownTitle}>评分分布</h3>
        <div className={styles.ratingsGrid}>
          <div className={styles.ratingItem}>
            <div className={`${styles.ratingBar} ${styles.again}`}>
              <div 
                className={styles.ratingFill}
                style={{ 
                  width: `${session.cardsReviewed > 0 ? (session.ratingsCount.again / session.cardsReviewed) * 100 : 0}%` 
                }}
              />
            </div>
            <div className={styles.ratingInfo}>
              <span className={styles.ratingLabel}>忘记了</span>
              <span className={styles.ratingCount}>{session.ratingsCount.again}</span>
            </div>
          </div>

          <div className={styles.ratingItem}>
            <div className={`${styles.ratingBar} ${styles.hard}`}>
              <div 
                className={styles.ratingFill}
                style={{ 
                  width: `${session.cardsReviewed > 0 ? (session.ratingsCount.hard / session.cardsReviewed) * 100 : 0}%` 
                }}
              />
            </div>
            <div className={styles.ratingInfo}>
              <span className={styles.ratingLabel}>困难</span>
              <span className={styles.ratingCount}>{session.ratingsCount.hard}</span>
            </div>
          </div>

          <div className={styles.ratingItem}>
            <div className={`${styles.ratingBar} ${styles.good}`}>
              <div 
                className={styles.ratingFill}
                style={{ 
                  width: `${session.cardsReviewed > 0 ? (session.ratingsCount.good / session.cardsReviewed) * 100 : 0}%` 
                }}
              />
            </div>
            <div className={styles.ratingInfo}>
              <span className={styles.ratingLabel}>良好</span>
              <span className={styles.ratingCount}>{session.ratingsCount.good}</span>
            </div>
          </div>

          <div className={styles.ratingItem}>
            <div className={`${styles.ratingBar} ${styles.easy}`}>
              <div 
                className={styles.ratingFill}
                style={{ 
                  width: `${session.cardsReviewed > 0 ? (session.ratingsCount.easy / session.cardsReviewed) * 100 : 0}%` 
                }}
              />
            </div>
            <div className={styles.ratingInfo}>
              <span className={styles.ratingLabel}>简单</span>
              <span className={styles.ratingCount}>{session.ratingsCount.easy}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.insights}>
        <h3 className={styles.insightsTitle}>🧠 学习建议</h3>
        <div className={styles.insightsList}>
          {accuracy >= 90 && (
            <div className={styles.insight}>
              <span className={styles.insightIcon}>🌟</span>
              <span>表现优异！继续保持这种学习状态。</span>
            </div>
          )}
          
          {accuracy < 75 && session.ratingsCount.again > 0 && (
            <div className={styles.insight}>
              <span className={styles.insightIcon}>🔄</span>
              <span>有{session.ratingsCount.again}张卡片需要重新学习，建议稍后再次复习。</span>
            </div>
          )}
          
          {avgTimePerCard > 30 && (
            <div className={styles.insight}>
              <span className={styles.insightIcon}>⏰</span>
              <span>思考时间较长，可以多复习这些概念来提高熟练度。</span>
            </div>
          )}
          
          {avgTimePerCard < 10 && accuracy >= 80 && (
            <div className={styles.insight}>
              <span className={styles.insightIcon}>🚀</span>
              <span>反应迅速且准确率高，可以尝试学习更多新内容。</span>
            </div>
          )}
          
          {session.ratingsCount.hard > session.cardsReviewed * 0.3 && (
            <div className={styles.insight}>
              <span className={styles.insightIcon}>📖</span>
              <span>较多困难卡片，建议回顾相关概念或寻求额外帮助。</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <button 
          onClick={onReviewAgain}
          className={styles.primaryButton}
        >
          🔄 再次复习
        </button>
        
        <button 
          onClick={onBackToSets}
          className={styles.secondaryButton}
        >
          📚 返回卡片集
        </button>
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          💡 基于FSRS算法，系统已为您智能安排下次复习时间
        </p>
      </div>
    </div>
  );
};

export default StudyResults; 