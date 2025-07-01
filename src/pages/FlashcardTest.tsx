import React, { useState } from 'react';
import StudyMode from '../components/StudyMode';
import StudyResults from '../components/StudyResults';
import { FSRSCard } from '../types/SRSTypes';
import { createDemoFlashcardSets, getMockDueCards } from '../utils/testData';
import styles from './FlashcardTest.module.css';

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

const FlashcardTest: React.FC = () => {
  const [studyMode, setStudyMode] = useState<'selection' | 'studying' | 'results'>('selection');
  const [selectedSet, setSelectedSet] = useState<any>(null);
  const [studyCards, setStudyCards] = useState<FSRSCard[]>([]);
  const [studySession, setStudySession] = useState<StudySession | null>(null);

  const demoSets = createDemoFlashcardSets();

  // 🎯 核心流程：选择卡片集
  const handleSelectSet = (set: any) => {
    const dueCards = getMockDueCards(set.id);
    console.log(`🎯 步骤1: 选择卡片集 "${set.title}"，待复习: ${dueCards.length}张`);
    
    setSelectedSet(set);
    setStudyCards(dueCards);
    setStudyMode('studying');
  };

  // 🎯 核心流程：学习完成
  const handleStudyComplete = (session: StudySession) => {
    console.log('🎯 步骤4: 学习完成，生成结果分析', session);
    setStudySession(session);
    setStudyMode('results');
  };

  // 🎯 核心流程：返回选择页面
  const handleBackToSelection = () => {
    console.log('🎯 返回选择页面');
    setStudyMode('selection');
    setSelectedSet(null);
    setStudyCards([]);
    setStudySession(null);
  };

  // 🎯 核心流程：再次学习
  const handleReviewAgain = () => {
    console.log('🎯 再次学习同一个卡片集');
    const dueCards = getMockDueCards(selectedSet.id);
    setStudyCards(dueCards);
    setStudyMode('studying');
    setStudySession(null);
  };

  // 渲染学习结果页面
  if (studyMode === 'results' && studySession && selectedSet) {
    return (
      <StudyResults
        session={studySession}
        setTitle={selectedSet.title}
        onReviewAgain={handleReviewAgain}
        onBackToSets={handleBackToSelection}
      />
    );
  }

  // 渲染学习模式页面
  if (studyMode === 'studying' && selectedSet && studyCards.length > 0) {
    return (
      <StudyMode
        cards={studyCards}
        setId={selectedSet.id}
        onComplete={handleStudyComplete}
        onExit={handleBackToSelection}
      />
    );
  }

  // 渲染卡片集选择页面
  return (
    <div className={styles.testPage}>
      <div className={styles.header}>
        <h1>🎯 核心学习流程测试</h1>
        <p>测试完整的学习流程：选择卡片集 → 开始学习 → 卡片翻转 → 四级评分 → 结果分析</p>
      </div>

      <div className={styles.flowDiagram}>
        <div className={styles.step}>
          <span className={styles.stepNumber}>1</span>
          <span className={styles.stepText}>选择卡片集</span>
        </div>
        <div className={styles.arrow}>→</div>
        <div className={styles.step}>
          <span className={styles.stepNumber}>2</span>
          <span className={styles.stepText}>卡片翻转学习</span>
        </div>
        <div className={styles.arrow}>→</div>
        <div className={styles.step}>
          <span className={styles.stepNumber}>3</span>
          <span className={styles.stepText}>四级评分</span>
        </div>
        <div className={styles.arrow}>→</div>
        <div className={styles.step}>
          <span className={styles.stepNumber}>4</span>
          <span className={styles.stepText}>学习结果分析</span>
        </div>
      </div>

      <div className={styles.setsGrid}>
        {demoSets.map(set => (
          <div key={set.id} className={styles.setCard}>
            <div className={styles.setHeader}>
              <h3>{set.title}</h3>
              <span className={styles.cardCount}>{set.cardCount} cards</span>
            </div>
            
            <div className={styles.setMeta}>
              <span className={styles.subject}>{set.subject}</span>
              <span className={styles.difficulty}>
                {'★'.repeat(set.difficulty)}
              </span>
            </div>

            <div className={styles.setStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>掌握度</span>
                <span className={styles.statValue}>{set.masteryLevel}%</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>预计时间</span>
                <span className={styles.statValue}>{set.estimatedStudyTime}min</span>
              </div>
            </div>

            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ 
                  width: `${set.masteryLevel}%`,
                  background: set.masteryLevel >= 80 ? '#00ff88' : 
                             set.masteryLevel >= 60 ? '#ffd700' : '#ff6b6b'
                }}
              />
            </div>

            <button 
              className={`${styles.studyButton} ${set.dueForReview ? styles.reviewButton : ''}`}
              onClick={() => handleSelectSet(set)}
            >
              <span className={styles.buttonIcon}>
                {set.dueForReview ? '🎯' : '📚'}
              </span>
              <span>{set.dueForReview ? 'Review Now' : 'Start Study'}</span>
            </button>

            {set.dueForReview && (
              <div className={styles.dueIndicator}>
                <span>⏰ Due for review</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.testInfo}>
        <h3>🧪 测试说明</h3>
        <ul>
          <li>点击任意卡片集的"Start Study"或"Review Now"按钮开始学习</li>
          <li>在学习模式中，可以翻转卡片查看答案</li>
          <li>使用键盘快捷键：空格键翻转，1-4数字键评分</li>
          <li>完成学习后查看详细的结果分析和智能建议</li>
          <li>可以选择重新学习或返回选择其他卡片集</li>
        </ul>
      </div>
    </div>
  );
};

export default FlashcardTest; 