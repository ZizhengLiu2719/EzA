import BackToDashboardButton from '@/components/BackToDashboardButton'
import { useUser } from '@/context/UserContext'
import { useAdvancedLearningAnalytics } from '@/hooks/useAdvancedLearningAnalytics'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createFlashcardSet, CreateFlashcardSetData } from '../api/flashcards'
import AIFlashcardGenerator from '../components/AIFlashcardGenerator'
import BatchImportModal from '../components/BatchImportModal'
import CreateFlashcardSetModal from '../components/CreateFlashcardSetModal'
import FlashcardsList from '../components/FlashcardsList'
import StudyMode from '../components/StudyMode'
import StudyResults from '../components/StudyResults'
import { FSRSCard } from '../types/SRSTypes'
import { calculateMockStats, createDemoFlashcardSets, getMockDueCards } from '../utils/testData'
import styles from './Review.module.css'

interface FlashcardSet {
  id: string
  title: string
  description: string
  subject: string
  cardCount: number
  difficulty: 1 | 2 | 3 | 4 | 5
  isPublic: boolean
  author: string
  lastStudied?: Date
  masteryLevel: number // 0-100
  estimatedStudyTime: number // minutes
  tags: string[]
  dueForReview: boolean
  nextReview?: Date
}

interface StudyMode {
  id: string
  name: string
  description: string
  icon: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  estimatedTime: string
  features: string[]
  inspiration: string // 来源app
}

interface ExamType {
  id: string
  name: string
  description: string
  duration: number
  questionCount: number
  subjects: string[]
  difficulty: string
  format: string[]
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

const Review = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const { 
    comprehensive_analysis, 
    is_analyzing, 
    triggerAnalysis,
    analytics 
  } = useAdvancedLearningAnalytics(user?.id || '')
  
  // State management
  const [activeTab, setActiveTab] = useState<'flashcards' | 'study' | 'exams' | 'analytics'>('flashcards')
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null)
  const [studyMode, setStudyMode] = useState<'none' | 'studying' | 'results'>('none')
  const [focusMode, setFocusMode] = useState(false)
  const [currentStreak, setCurrentStreak] = useState(7) // Example streak
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [showBatchImportModal, setShowBatchImportModal] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [studyCards, setStudyCards] = useState<FSRSCard[]>([])
  const [studySession, setStudySession] = useState<StudySession | null>(null)

  // Mock data - 在实际环境中这些会从API获取
  const myFlashcardSets = useMemo(() => createDemoFlashcardSets(), []);
  
  const studyStats = useMemo(() => calculateMockStats(), []);

  const studyModes = [
    {
      id: 'flashcard',
      name: 'Flashcard Review',
      description: 'Classic spaced repetition with AI-optimized intervals',
      icon: '🃏',
      difficulty: 'Beginner' as const,
      estimatedTime: '15-30 min',
      features: ['Spaced repetition', 'Difficulty adjustment', 'Progress tracking'],
      inspiration: 'Anki + Quizlet'
    },
    {
      id: 'active-recall',
      name: 'Active Recall',
      description: 'Test yourself without seeing the answer first',
      icon: '🧠',
      difficulty: 'Intermediate' as const,
      estimatedTime: '20-40 min',
      features: ['Self-testing', 'Confidence tracking', 'Mistake analysis'],
      inspiration: 'RemNote + Obsidian'
    },
    {
      id: 'ai-tutor',
      name: 'AI Tutor Mode',
      description: 'Personalized explanations and adaptive questioning',
      icon: '🤖',
      difficulty: 'Advanced' as const,
      estimatedTime: '25-45 min',
      features: ['AI explanations', 'Adaptive difficulty', 'Socratic method'],
      inspiration: 'Khan Academy + Socratic'
    },
    {
      id: 'speed-drill',
      name: 'Speed Drill',
      description: 'Rapid-fire questions to build automaticity',
      icon: '⚡',
      difficulty: 'Intermediate' as const,
      estimatedTime: '10-20 min',
      features: ['Time pressure', 'Quick recall', 'Fluency building'],
      inspiration: 'Duolingo + Memrise'
    },
    {
      id: 'deep-study',
      name: 'Deep Study Session',
      description: 'Thorough review with detailed explanations',
      icon: '📚',
      difficulty: 'Advanced' as const,
      estimatedTime: '45-90 min',
      features: ['Detailed feedback', 'Concept mapping', 'Cross-connections'],
      inspiration: 'Notion + Roam Research'
    },
    {
      id: 'memory-palace',
      name: 'Memory Palace',
      description: 'Spatial memory techniques for better retention',
      icon: '🏰',
      difficulty: 'Advanced' as const,
      estimatedTime: '30-60 min',
      features: ['Spatial learning', 'Visual associations', 'Location method'],
      inspiration: 'Memrise + Ancient techniques'
    }
  ];

  const examTypes: ExamType[] = useMemo(() => [
    {
      id: 'unit-test',
      name: 'Unit Test Simulation',
      description: 'Focused assessment covering 1-2 weeks of course material',
      duration: 50,
      questionCount: 25,
      subjects: ['Math', 'Science', 'History', 'English', 'Foreign Languages'],
      difficulty: 'Standard',
      format: ['Multiple Choice', 'Short Answer', 'Problem Solving']
    },
    {
      id: 'chapter-exam',
      name: 'Chapter Exam',
      description: 'Comprehensive review of complete chapter or unit',
      duration: 75,
      questionCount: 35,
      subjects: ['All Academic Subjects'],
      difficulty: 'Moderate',
      format: ['Multiple Choice', 'Short Answer', 'Essay Questions']
    },
    {
      id: 'midterm',
      name: 'Midterm Exam Simulation',
      description: 'Half-semester comprehensive examination',
      duration: 90,
      questionCount: 45,
      subjects: ['All Course Materials'],
      difficulty: 'Challenging',
      format: ['Multiple Choice', 'Essays', 'Problem Sets', 'Analysis']
    },
    {
      id: 'final-exam',
      name: 'Final Exam Preparation',
      description: 'Complete semester cumulative examination',
      duration: 120,
      questionCount: 60,
      subjects: ['Entire Course Content'],
      difficulty: 'Comprehensive',
      format: ['All Question Types', 'Research Component', 'Critical Analysis']
    },
    {
      id: 'pop-quiz',
      name: 'Pop Quiz Practice',
      description: 'Quick assessment of recent class material',
      duration: 15,
      questionCount: 10,
      subjects: ['Current Topic'],
      difficulty: 'Basic',
      format: ['Multiple Choice', 'True/False', 'Fill-in-blank']
    }
  ], [])

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return '#10B981' // Green - Easy
      case 2: return '#06B6D4' // Cyan - Basic
      case 3: return '#F59E0B' // Yellow - Moderate
      case 4: return '#EF4444' // Red - Hard
      case 5: return '#8B5CF6' // Purple - Expert
      default: return '#6B7280'
    }
  }

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 90) return '#10B981'      // Green - Mastered
    if (mastery >= 75) return '#06B6D4'      // Cyan - Proficient  
    if (mastery >= 50) return '#F59E0B'      // Yellow - Familiar
    if (mastery >= 25) return '#EF4444'      // Red - Learning
    return '#6B7280'                         // Gray - Not started
  }

  const getMasteryLabel = (mastery: number) => {
    if (mastery >= 90) return 'Mastered'
    if (mastery >= 75) return 'Proficient'
    if (mastery >= 50) return 'Familiar'
    if (mastery >= 25) return 'Learning'
    return 'Not Started'
  }

  // Forest-inspired focus mode timer
  useEffect(() => {
    let focusTimer: NodeJS.Timeout
    if (focusMode) {
      // Start 25-minute focus session
      focusTimer = setTimeout(() => {
        setFocusMode(false)
        // Show completion notification
        alert('🌲 Focus session complete! Take a 5-minute break.')
      }, 25 * 60 * 1000) // 25 minutes
    }
    return () => {
      if (focusTimer) clearTimeout(focusTimer)
    }
  }, [focusMode])

  // Handle creating new flashcard set
  const handleCreateFlashcardSet = async (data: CreateFlashcardSetData) => {
    try {
      setIsCreating(true)
      const newSet = await createFlashcardSet(data)
      
      // TODO: Add the new set to the list or refresh the data
      console.log('Created new flashcard set:', newSet)
      
      setShowCreateModal(false)
      
      // Show success notification (you might want to add a toast system)
      alert('Flashcard set created successfully!')
      
    } catch (error) {
      console.error('Error creating flashcard set:', error)
      throw error // Re-throw to let the modal handle the error
    } finally {
      setIsCreating(false)
    }
  }

  // 清理状态的辅助函数
  const handleCloseManageModal = () => {
    setShowManageModal(false);
    setSelectedSet(null);
  };

  const handleCloseBatchImportModal = () => {
    setShowBatchImportModal(false);
    setSelectedSet(null);
  };

  // 开始学习模式
  const handleStartStudy = async (set: FlashcardSet) => {
    try {
      // 使用演示数据进行测试
      const dueCards = getMockDueCards(set.id);
      
      if (dueCards.length === 0) {
        alert('🎉 恭喜！当前没有需要复习的卡片。');
        return;
      }

      console.log(`开始学习: ${set.title}，待复习卡片: ${dueCards.length}张`);
      setSelectedSet(set);
      setStudyCards(dueCards);
      setStudyMode('studying');
    } catch (error) {
      console.error('获取待复习卡片失败:', error);
      alert('无法加载复习卡片，请重试');
    }
  };

  // 学习完成
  const handleStudyComplete = (session: StudySession) => {
    setStudySession(session);
    setStudyMode('results');
    // 刷新数据以更新统计
    console.log('Study session completed:', session);
  };

  // 退出学习模式
  const handleExitStudy = () => {
    setStudyMode('none');
    setSelectedSet(null);
    setStudyCards([]);
    setStudySession(null);
  };

  // 再次复习
  const handleReviewAgain = () => {
    if (selectedSet) {
      handleStartStudy(selectedSet);
    }
  };

  // 如果正在学习，显示学习模式
  if (studyMode === 'studying' && selectedSet && studyCards.length > 0) {
    return (
      <StudyMode
        cards={studyCards}
        setId={selectedSet.id}
        onComplete={handleStudyComplete}
        onExit={handleExitStudy}
      />
    );
  }

  // 如果学习完成，显示结果
  if (studyMode === 'results' && selectedSet && studySession) {
    return (
      <StudyResults
        session={studySession}
        setTitle={selectedSet.title}
        onReviewAgain={handleReviewAgain}
        onBackToSets={handleExitStudy}
      />
    );
  }

  return (
    <div className={styles.review} style={{ position: 'relative' }}>
      <BackToDashboardButton />
      
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Review & Exam Prep</h1>
          <p>AI-powered study system combining the best of Quizlet, Anki, Khan Academy, and more</p>
          
          {/* Quick Stats Dashboard */}
          <div className={styles.quickStats}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{studyStats.totalSets}</span>
              <span className={styles.statLabel}>Study Sets</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{studyStats.totalCards}</span>
              <span className={styles.statLabel}>Total Cards</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{studyStats.averageMastery}%</span>
              <span className={styles.statLabel}>Avg Mastery</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{studyStats.streak}</span>
              <span className={styles.statLabel}>Day Streak 🔥</span>
            </div>
            {studyStats.dueForReview > 0 && (
              <div className={styles.statCard + ' ' + styles.alertCard}>
                <span className={styles.statValue}>{studyStats.dueForReview}</span>
                <span className={styles.statLabel}>Due for Review ⏰</span>
              </div>
            )}
          </div>
        </div>

        {/* Forest-inspired Focus Mode Toggle */}
        <div className={styles.focusControls}>
          <button 
            className={`${styles.focusBtn} ${focusMode ? styles.focusActive : ''}`}
            onClick={() => setFocusMode(!focusMode)}
          >
            <span className={styles.focusIcon}>🌲</span>
            <span>{focusMode ? 'Focus Active' : 'Start Focus'}</span>
            {focusMode && <span className={styles.focusTimer}>25:00</span>}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        {(['flashcards', 'study', 'exams', 'analytics'] as const).map(tab => (
          <button
            key={tab}
            className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            <span className={styles.tabIcon}>
              {tab === 'flashcards' && '🃏'}
              {tab === 'study' && '📚'}
              {tab === 'exams' && '📝'}
              {tab === 'analytics' && '📊'}
            </span>
            <span className={styles.tabLabel}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </span>
            {/* Notification badges */}
            {tab === 'flashcards' && studyStats.dueForReview > 0 && (
              <span className={styles.notificationBadge}>{studyStats.dueForReview}</span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        
        {/* Flashcards Tab - Redesigned Clean Version */}
        {activeTab === 'flashcards' && (
          <div className={styles.flashcardsTab}>
            
            {/* Quick Actions Header */}
            <div className={styles.actionsHeader}>
              <div className={styles.headerLeft}>
                <h2 className={styles.tabTitle}>My Study Sets</h2>
                <p className={styles.tabSubtitle}>Manage and study your flashcard collections</p>
              </div>
              <div className={styles.quickActions}>
                <button className={styles.actionBtn}>
                  <span className={styles.actionIcon}>📷</span>
                  <span>Photo Scan</span>
                </button>
                <button className={styles.actionBtn}>
                  <span className={styles.actionIcon}>📄</span>
                  <span>Import</span>
                </button>
                <button className={styles.actionBtn + ' ' + styles.primaryAction} onClick={() => setShowCreateModal(true)}>
                  <span className={styles.actionIcon}>➕</span>
                  <span>Create New</span>
                </button>
              </div>
            </div>

            {/* Priority Review Banner - Only show if has due cards */}
            {studyStats.dueForReview > 0 && (
              <div className={styles.reviewBanner}>
                <div className={styles.bannerContent}>
                  <div className={styles.bannerIcon}>⏰</div>
                  <div className={styles.bannerText}>
                    <h3>Ready for Review</h3>
                    <p>{studyStats.dueForReview} sets are due for spaced repetition review</p>
                  </div>
                  <button className={styles.bannerAction}>Review All</button>
                </div>
              </div>
            )}

            {/* Study Sets - Clean Grid Layout */}
            <div className={styles.setsContainer}>
              <div className={styles.setsGrid}>
                {myFlashcardSets.map(set => (
                  <div key={set.id} className={`${styles.setCard} ${set.dueForReview ? styles.needsReview : ''}`}>
                    
                    {/* Card Header */}
                    <div className={styles.cardHeader}>
                      <div className={styles.cardTitle}>
                        <h3>{set.title}</h3>
                        <span className={styles.cardCount}>{set.cardCount} cards</span>
                      </div>
                      {set.dueForReview && (
                        <div className={styles.dueIndicator}>
                          <span className={styles.dueIcon}>🔔</span>
                        </div>
                      )}
                    </div>

                    {/* Subject Badge */}
                    <div className={styles.subjectBadge}>
                      <span className={styles.subjectIcon}>
                        {set.subject === 'Mathematics' && '📐'}
                        {set.subject === 'Chemistry' && '🧪'}
                        {set.subject === 'History' && '📜'}
                        {set.subject === 'Foreign Language' && '🌍'}
                      </span>
                      <span>{set.subject}</span>
                    </div>

                    {/* Progress Section */}
                    <div className={styles.progressSection}>
                      <div className={styles.progressHeader}>
                        <span className={styles.masteryText}>Mastery</span>
                        <span className={styles.masteryPercent}>{set.masteryLevel}%</span>
                      </div>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill}
                          style={{ 
                            width: `${set.masteryLevel}%`,
                            background: getMasteryColor(set.masteryLevel)
                          }}
                        />
                      </div>
                      <div className={styles.progressMeta}>
                        <span className={styles.difficulty}>
                          {'★'.repeat(set.difficulty)}
                        </span>
                        <span className={styles.studyTime}>~{set.estimatedStudyTime}min</span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className={styles.setActions}>
                      <button 
                        className={`${styles.studyButton} ${set.dueForReview ? styles.reviewButton : ''}`}
                        onClick={() => handleStartStudy(set)}
                      >
                        <span className={styles.buttonIcon}>
                          {set.dueForReview ? '🎯' : '📚'}
                        </span>
                        <span>{set.dueForReview ? 'Review Now' : 'Study'}</span>
                      </button>
                      
                      <button 
                        className={styles.manageButton}
                        onClick={() => {
                          setSelectedSet(set);
                          setShowManageModal(true);
                        }}
                        style={{ 
                          background: 'rgba(0, 255, 255, 0.1)', 
                          color: '#00ffff',
                          border: '1px solid rgba(0, 255, 255, 0.3)',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          marginLeft: '8px'
                        }}
                      >
                        📝 Manage Cards
                      </button>
                      
                      <button 
                        className={styles.importButton}
                        onClick={() => {
                          setSelectedSet(set);
                          setShowBatchImportModal(true);
                        }}
                        style={{ 
                          background: 'rgba(255, 107, 107, 0.1)', 
                          color: '#ff6b6b',
                          border: '1px solid rgba(255, 107, 107, 0.3)',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          marginLeft: '8px'
                        }}
                      >
                        📤 Import
                      </button>
                      
                      <button 
                        className={styles.aiGenerateButton}
                        onClick={() => {
                          setSelectedSet(set);
                          setShowAIGenerator(true);
                        }}
                        style={{ 
                          background: 'rgba(0, 210, 255, 0.1)', 
                          color: '#00d2ff',
                          border: '1px solid rgba(0, 210, 255, 0.3)',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          marginLeft: '8px'
                        }}
                      >
                        🤖 AI Generate
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              {/* Empty State */}
              {myFlashcardSets.length === 0 && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🃏</div>
                  <h3>No Study Sets Yet</h3>
                  <p>Create your first flashcard set to start learning</p>
                  <button className={styles.createFirstButton} onClick={() => setShowCreateModal(true)}>
                    <span>➕</span>
                    Create Your First Set
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Study Tab - Multiple App Inspirations */}
        {activeTab === 'study' && (
          <div className={styles.studyTab}>
            <div className={styles.tabHeader}>
              <h2>Study Modes</h2>
              <p>Choose your learning style - inspired by the best educational apps</p>
            </div>

            <div className={styles.studyModesGrid}>
              {studyModes.map(mode => (
                <div key={mode.id} className={styles.studyModeCard}>
                  <div className={styles.modeHeader}>
                    <span className={styles.modeIcon}>{mode.icon}</span>
                    <div className={styles.modeTitle}>
                      <h3 className={styles.modeName}>{mode.name}</h3>
                      <span className={styles.modeInspiration}>Inspired by {mode.inspiration}</span>
                    </div>
                    <span className={styles.modeDifficulty}>{mode.difficulty}</span>
                  </div>
                  
                  <p className={styles.modeDescription}>{mode.description}</p>
                  
                  <div className={styles.modeInfo}>
                    <span className={styles.estimatedTime}>⏱️ {mode.estimatedTime}</span>
                  </div>
                  
                  <div className={styles.modeFeatures}>
                    {mode.features.map(feature => (
                      <span key={feature} className={styles.feature}>✓ {feature}</span>
                    ))}
                  </div>
                  
                  <button 
                    className={styles.startStudyBtn}
                    onClick={() => {
                      // TODO: 整合新的学习模式逻辑
                      alert(`${mode.name} 学习模式正在开发中，请使用卡片集中的"开始学习"按钮`);
                    }}
                  >
                    Start {mode.name}
                  </button>
                </div>
              ))}
            </div>

            {/* AI Study Recommendations - Khan Academy inspired */}
            <div className={styles.aiRecommendations}>
              <h3>🤖 AI Study Recommendations</h3>
              <div className={styles.recommendationsGrid}>
                <div className={styles.recommendationCard}>
                  <h4>📊 Recommended Focus Areas</h4>
                  <ul>
                    <li>Organic Chemistry reactions (65% mastery) - Study for 30 min</li>
                    <li>Calculus integration techniques (78% mastery) - Quick review</li>
                    <li>Spanish advanced vocabulary - 15 min spaced repetition</li>
                  </ul>
                </div>
                <div className={styles.recommendationCard}>
                  <h4>⏰ Optimal Study Schedule</h4>
                  <ul>
                    <li>Best time: 9:00-11:00 AM (your peak focus hours)</li>
                    <li>Break every 25 minutes (Pomodoro technique)</li>
                    <li>Review before sleep for better retention</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exams Tab - Course-focused */}
        {activeTab === 'exams' && (
          <div className={styles.examsTab}>
            <div className={styles.tabHeader}>
              <h2>Course Exam Simulation</h2>
              <p>Practice with realistic high school and college course exams</p>
            </div>

            <div className={styles.examTypesGrid}>
              {examTypes.map(examType => (
                <div key={examType.id} className={styles.examTypeCard}>
                  <h3 className={styles.examTypeName}>{examType.name}</h3>
                  <p className={styles.examTypeDescription}>{examType.description}</p>
                  
                  <div className={styles.examTypeInfo}>
                    <div className={styles.examInfo}>
                      <span className={styles.infoLabel}>Duration:</span>
                      <span className={styles.infoValue}>{examType.duration} minutes</span>
                    </div>
                    <div className={styles.examInfo}>
                      <span className={styles.infoLabel}>Questions:</span>
                      <span className={styles.infoValue}>{examType.questionCount}</span>
                    </div>
                    <div className={styles.examInfo}>
                      <span className={styles.infoLabel}>Difficulty:</span>
                      <span className={styles.infoValue}>{examType.difficulty}</span>
                    </div>
                  </div>
                  
                  <div className={styles.examFormats}>
                    <span className={styles.formatsLabel}>Question Types:</span>
                    <div className={styles.formatTags}>
                      {examType.format.map(format => (
                        <span key={format} className={styles.formatTag}>{format}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className={styles.examSubjects}>
                    <span className={styles.subjectsLabel}>Subjects:</span>
                    <div className={styles.subjectTags}>
                      {examType.subjects.map(subject => (
                        <span key={subject} className={styles.subjectTag}>{subject}</span>
                      ))}
                    </div>
                  </div>
                  
                  <button className={styles.startExamBtn}>
                    <span className={styles.actionIcon}>🚀</span>
                    Start {examType.name}
                  </button>
                </div>
              ))}
            </div>

            {/* AI Exam Generator */}
            <div className={styles.aiExamGenerator}>
              <h3>🤖 AI Exam Generator</h3>
              <p>Create personalized exams based on your study materials and weak spots</p>
              
              <div className={styles.examGeneratorForm}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Subject Area:</label>
                    <select className={styles.formSelect}>
                      <option>Mathematics</option>
                      <option>Chemistry</option>
                      <option>Physics</option>
                      <option>History</option>
                      <option>English Literature</option>
                      <option>Foreign Languages</option>
                      <option>Biology</option>
                      <option>Psychology</option>
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Exam Type:</label>
                    <select className={styles.formSelect}>
                      <option>Unit Test</option>
                      <option>Chapter Exam</option>
                      <option>Midterm</option>
                      <option>Final Exam</option>
                      <option>Pop Quiz</option>
                      <option>Custom Mix</option>
                    </select>
                  </div>
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Duration (minutes):</label>
                    <input type="number" className={styles.formInput} defaultValue={50} min={10} max={180} />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Question Count:</label>
                    <input type="number" className={styles.formInput} defaultValue={25} min={5} max={100} />
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Focus on Weak Areas:</label>
                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkbox}>
                      <input type="checkbox" defaultChecked />
                      Include low-mastery topics
                    </label>
                    <label className={styles.checkbox}>
                      <input type="checkbox" defaultChecked />
                      Weight recent material higher
                    </label>
                    <label className={styles.checkbox}>
                      <input type="checkbox" />
                      Include cumulative review
                    </label>
                  </div>
                </div>
                
                <button className={styles.generateExamBtn}>
                  <span className={styles.actionIcon}>✨</span>
                  Generate Personalized Exam
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab - Learning Insights Integration */}
        {activeTab === 'analytics' && (
          <div className={styles.analyticsTab}>
            <div className={styles.tabHeader}>
              <h2>Learning Analytics & Performance</h2>
              <p>Detailed insights into your study patterns and academic performance</p>
            </div>

            <div className={styles.analyticsGrid}>
              
              {/* Performance Overview Card */}
              <div className={styles.analyticsCard}>
                <h3>📈 Study Performance Overview</h3>
                <div className={styles.performanceMetrics}>
                  <div className={styles.metric}>
                    <span className={styles.metricValue}>
                      {comprehensive_analysis?.efficiency_score || 85}%
                    </span>
                    <span className={styles.metricLabel}>Study Efficiency</span>
                    <span className={styles.metricTrend}>↗️ +5% this week</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricValue}>
                      {comprehensive_analysis?.learning_velocity || 76}%
                    </span>
                    <span className={styles.metricLabel}>Learning Velocity</span>
                    <span className={styles.metricTrend}>↗️ +3% this week</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricValue}>
                      {studyStats.averageMastery}%
                    </span>
                    <span className={styles.metricLabel}>Average Mastery</span>
                    <span className={styles.metricTrend}>↗️ +8% this month</span>
                  </div>
                </div>
              </div>

              {/* Memory Retention Analysis - Anki inspired */}
              <div className={styles.analyticsCard}>
                <h3>🧠 Memory Retention Analysis</h3>
                <div className={styles.retentionChart}>
                  <div className={styles.retentionItem}>
                    <span className={styles.retentionLabel}>Immediate (24h)</span>
                    <div className={styles.retentionBar}>
                      <div className={styles.retentionFill} style={{ width: '94%' }}></div>
                    </div>
                    <span className={styles.retentionValue}>94%</span>
                  </div>
                  <div className={styles.retentionItem}>
                    <span className={styles.retentionLabel}>Short-term (1 week)</span>
                    <div className={styles.retentionBar}>
                      <div className={styles.retentionFill} style={{ width: '82%' }}></div>
                    </div>
                    <span className={styles.retentionValue}>82%</span>
                  </div>
                  <div className={styles.retentionItem}>
                    <span className={styles.retentionLabel}>Medium-term (1 month)</span>
                    <div className={styles.retentionBar}>
                      <div className={styles.retentionFill} style={{ width: '71%' }}></div>
                    </div>
                    <span className={styles.retentionValue}>71%</span>
                  </div>
                  <div className={styles.retentionItem}>
                    <span className={styles.retentionLabel}>Long-term (3 months)</span>
                    <div className={styles.retentionBar}>
                      <div className={styles.retentionFill} style={{ width: '63%' }}></div>
                    </div>
                    <span className={styles.retentionValue}>63%</span>
                  </div>
                </div>
              </div>

              {/* Subject Breakdown */}
              <div className={styles.analyticsCard}>
                <h3>📚 Subject Mastery Breakdown</h3>
                <div className={styles.subjectBreakdown}>
                  {myFlashcardSets.map(set => (
                    <div key={set.id} className={styles.subjectItem}>
                      <div className={styles.subjectHeader}>
                        <span className={styles.subjectName}>{set.subject}</span>
                        <span className={styles.subjectMastery}>{set.masteryLevel}%</span>
                      </div>
                      <div className={styles.subjectProgress}>
                        <div 
                          className={styles.subjectFill}
                          style={{ 
                            width: `${set.masteryLevel}%`,
                            backgroundColor: getMasteryColor(set.masteryLevel)
                          }}
                        ></div>
                      </div>
                      <span className={styles.subjectCards}>{set.cardCount} cards</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Study Recommendations */}
              <div className={styles.analyticsCard}>
                <h3>💡 AI-Powered Recommendations</h3>
                <div className={styles.aiRecommendationsList}>
                  <div className={styles.recommendation}>
                    <span className={styles.recommendationIcon}>🎯</span>
                    <div className={styles.recommendationContent}>
                      <span className={styles.recommendationTitle}>Focus Priority</span>
                      <span className={styles.recommendationText}>
                        Organic Chemistry needs attention - 35% improvement potential
                      </span>
                    </div>
                  </div>
                  <div className={styles.recommendation}>
                    <span className={styles.recommendationIcon}>⏰</span>
                    <div className={styles.recommendationContent}>
                      <span className={styles.recommendationTitle}>Optimal Timing</span>
                      <span className={styles.recommendationText}>
                        Your peak performance is 9-11 AM. Schedule difficult topics then.
                      </span>
                    </div>
                  </div>
                  <div className={styles.recommendation}>
                    <span className={styles.recommendationIcon}>🔄</span>
                    <div className={styles.recommendationContent}>
                      <span className={styles.recommendationTitle}>Spaced Review</span>
                      <span className={styles.recommendationText}>
                        Review Spanish vocabulary in 2 days for optimal retention
                      </span>
                    </div>
                  </div>
                  <div className={styles.recommendation}>
                    <span className={styles.recommendationIcon}>🎮</span>
                    <div className={styles.recommendationContent}>
                      <span className={styles.recommendationTitle}>Study Method</span>
                      <span className={styles.recommendationText}>
                        Try Match Game for Calculus - suits your learning style
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Progress Chart */}
              <div className={styles.analyticsCard}>
                <h3>📊 Weekly Study Progress</h3>
                <div className={styles.weeklyProgress}>
                  <div className={styles.progressChart}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                      <div key={day} className={styles.dayProgress}>
                        <div className={styles.dayBar}>
                          <div 
                            className={styles.dayFill}
                            style={{ height: `${[60, 80, 45, 90, 70, 30, 40][index]}%` }}
                          ></div>
                        </div>
                        <span className={styles.dayLabel}>{day}</span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.progressStats}>
                    <span>Total study time this week: 4h 32m</span>
                    <span>Average session: 38 minutes</span>
                    <span>Best day: Thursday (1h 15m)</span>
                  </div>
                </div>
              </div>

              {/* Streak & Achievements */}
              <div className={styles.analyticsCard}>
                <h3>🏆 Achievements & Streaks</h3>
                <div className={styles.achievements}>
                  <div className={styles.streakCard}>
                    <span className={styles.streakNumber}>{studyStats.streak}</span>
                    <span className={styles.streakLabel}>Day Study Streak 🔥</span>
                    <span className={styles.streakMotivation}>Keep it up! Goal: 30 days</span>
                  </div>
                  
                  <div className={styles.badgesGrid}>
                    <div className={styles.badge}>
                      <span className={styles.badgeIcon}>🎯</span>
                      <span className={styles.badgeName}>Sharp Shooter</span>
                      <span className={styles.badgeDesc}>90%+ accuracy on tests</span>
                    </div>
                    <div className={styles.badge}>
                      <span className={styles.badgeIcon}>⚡</span>
                      <span className={styles.badgeName}>Speed Demon</span>
                      <span className={styles.badgeDesc}>Fast match game times</span>
                    </div>
                    <div className={styles.badge}>
                      <span className={styles.badgeIcon}>📚</span>
                      <span className={styles.badgeName}>Scholar</span>
                      <span className={styles.badgeDesc}>Mastered 3 subjects</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Quick Action Floating Panel */}
      <div className={styles.quickActions}>
        <button className={styles.quickActionBtn} onClick={() => triggerAnalysis()}>
          <span className={styles.actionIcon}>🔄</span>
          <span>Refresh Analytics</span>
        </button>
        <button className={styles.quickActionBtn}>
          <span className={styles.actionIcon}>📊</span>
          <span>Export Progress</span>
        </button>
        <button className={styles.quickActionBtn}>
          <span className={styles.actionIcon}>🎯</span>
          <span>Set Study Goals</span>
        </button>
        <button className={styles.quickActionBtn}>
          <span className={styles.actionIcon}>💡</span>
          <span>Get AI Tips</span>
        </button>
        <button 
          className={styles.quickActionBtn}
          onClick={() => navigate('/flashcard-test')}
          style={{ backgroundColor: 'rgba(0, 255, 255, 0.1)', borderColor: 'rgba(0, 255, 255, 0.3)' }}
        >
          <span className={styles.actionIcon}>🧪</span>
          <span>Test New Features</span>
        </button>
      </div>

      {/* Create Flashcard Set Modal */}
      <CreateFlashcardSetModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateFlashcardSet}
        isLoading={isCreating}
      />

      {/* Manage Cards Modal */}
      {selectedSet && showManageModal && (
        <div className={styles.modalOverlay} onClick={handleCloseManageModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <FlashcardsList 
              setId={selectedSet.id}
              setTitle={selectedSet.title}
              onClose={handleCloseManageModal}
            />
          </div>
        </div>
      )}

      {/* Batch Import Modal */}
      {selectedSet && (
        <BatchImportModal
          isOpen={showBatchImportModal}
          onClose={handleCloseBatchImportModal}
          onImport={async (cards) => {
            try {
              console.log('Importing cards to set:', selectedSet.id, cards);
              // TODO: 实现实际的导入逻辑
              // const importedCards = await createFlashcards(cards);
              
              // 模拟导入成功
              console.log('Mock import successful:', cards.length, 'cards');
              alert(`✅ 成功导入 ${cards.length} 张卡片到 "${selectedSet.title}"！\n\n导入的卡片：\n${cards.slice(0, 3).map(card => `• ${card.question}`).join('\n')}${cards.length > 3 ? '\n...' : ''}`);
              
              handleCloseBatchImportModal();
            } catch (error) {
              console.error('Import failed:', error);
              alert(`❌ 导入失败：${error instanceof Error ? error.message : '未知错误'}`);
            }
          }}
          setId={selectedSet.id}
        />
      )}

      {/* AI Flashcard Generator */}
      {selectedSet && showAIGenerator && (
        <AIFlashcardGenerator
          setId={selectedSet.id}
          onClose={() => setShowAIGenerator(false)}
          onGenerated={(count) => {
            setShowAIGenerator(false);
            alert(`🎉 成功生成 ${count} 张闪卡！`);
            console.log('AI generated cards:', count);
          }}
        />
      )}
    </div>
  )
}

export default Review 