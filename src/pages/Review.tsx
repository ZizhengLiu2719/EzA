import BackToDashboardButton from '@/components/BackToDashboardButton'
import ExamFlow from '@/components/ExamFlow'
import { useUser } from '@/context/UserContext'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createFlashcardSet, CreateFlashcardSetData, deleteAllFlashcardSets, deleteFlashcardSet, FlashcardSetWithStats, getDueFlashcards, getFlashcardSets } from '../api/flashcards'
import AIFlashcardGenerator from '../components/AIFlashcardGenerator'
import BatchImportModal from '../components/BatchImportModal'
import CreateFlashcardSetModal from '../components/CreateFlashcardSetModal'
import FlashcardsList from '../components/FlashcardsList'
import StemSolver from '../components/StemSolver'
import StudyMode from '../components/StudyMode'
import StudyResults from '../components/StudyResults'
import { FSRSCard } from '../types/SRSTypes'
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
  
  // 使用简单的状态管理代替复杂的React Query
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSetWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'all';
    setId?: string;
    setTitle?: string;
  }>({
    isOpen: false,
    type: 'single'
  })
  
  // State management
  const [activeTab, setActiveTab] = useState<'flashcards' | 'solver' | 'exams' | 'analytics'>('flashcards')
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null)
  const [studyMode, setStudyMode] = useState<'none' | 'studying' | 'results'>('none')
  const [focusMode, setFocusMode] = useState(false)
  const [currentStreak, setCurrentStreak] = useState(7) // Example streak
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [showBatchImportModal, setShowBatchImportModal] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [studyCards, setStudyCards] = useState<FSRSCard[]>([])
  const [studySession, setStudySession] = useState<StudySession | null>(null)
  const [pendingSetData, setPendingSetData] = useState<CreateFlashcardSetData | null>(null)
  const [examFlowOpen, setExamFlowOpen] = useState(false)
  const [selectedExamType, setSelectedExamType] = useState<ExamType | null>(null)

  // 加载flashcard sets
  const loadFlashcardSets = async () => {
    if (!user?.id) return
    
    try {
      setIsLoading(true)
      setError(null)
      const sets = await getFlashcardSets()
      setFlashcardSets(sets)
    } catch (err) {
      console.error('Error loading flashcard sets:', err)
      setError(err instanceof Error ? err.message : 'Failed to load flashcard sets')
    } finally {
      setIsLoading(false)
    }
  }

  // 在组件挂载和用户变化时加载数据
  useEffect(() => {
    loadFlashcardSets()
  }, [user?.id])

  // 转换数据格式以匹配现有接口
  const myFlashcardSets = useMemo(() => {
    return flashcardSets.map((set: FlashcardSetWithStats) => ({
      id: set.id,
      title: set.title,
      description: set.description || '',
      subject: set.subject || 'General',
      cardCount: set.card_count,
      difficulty: set.difficulty as 1 | 2 | 3 | 4 | 5,
      isPublic: set.is_public,
      author: 'You',
      lastStudied: set.last_studied ? new Date(set.last_studied) : undefined,
      masteryLevel: Math.round(set.mastery_level * 100), // 转换为百分比
      estimatedStudyTime: Math.max(5, Math.round(set.card_count * 0.5)), // 估算学习时间
      tags: set.tags || [],
      dueForReview: (set.due_cards_count || 0) > 0,
      nextReview: undefined
    }))
  }, [flashcardSets])
  
  // 计算统计数据
  const studyStats = useMemo(() => {
    const totalSets = flashcardSets.length
    const totalCards = flashcardSets.reduce((sum, set) => sum + set.card_count, 0)
    const totalDueCards = flashcardSets.reduce((sum, set) => sum + (set.due_cards_count || 0), 0)
    const averageMastery = flashcardSets.length > 0 
      ? flashcardSets.reduce((sum, set) => sum + set.mastery_level, 0) / flashcardSets.length 
      : 0

    return {
      totalSets,
      totalCards,
      averageMastery: Math.round(averageMastery * 100),
      streak: currentStreak,
      dueForReview: totalDueCards
    }
  }, [flashcardSets, currentStreak])

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
      const newSet = await createFlashcardSet(data)
      
      // 刷新数据以显示新创建的卡片集
      await loadFlashcardSets()
      
      console.log('Created new flashcard set:', newSet)
      
      setShowCreateModal(false)
      
      // Show success notification (you might want to add a toast system)
      alert('Flashcard set created successfully!')
      
      return newSet // <== 关键: 返回新建的集合，供后续流程使用
    } catch (error) {
      console.error('Error creating flashcard set:', error)
      throw error // Re-throw to let the modal handle the error
    }
  }

  // Handle deleting a single flashcard set
  const handleDeleteSet = async (setId: string, setTitle: string) => {
    setDeleteConfirmModal({
      isOpen: true,
      type: 'single',
      setId,
      setTitle
    })
  }

  // Handle deleting all flashcard sets
  const handleDeleteAllSets = () => {
    if (flashcardSets.length === 0) {
      alert('没有卡片集可以删除')
      return
    }
    
    setDeleteConfirmModal({
      isOpen: true,
      type: 'all'
    })
  }

  // Confirm and execute deletion
  const handleConfirmDelete = async () => {
    if (!deleteConfirmModal.isOpen) return

    try {
      setIsDeleting(true)

      if (deleteConfirmModal.type === 'single' && deleteConfirmModal.setId) {
        await deleteFlashcardSet(deleteConfirmModal.setId)
        alert(`✅ 成功删除卡片集"${deleteConfirmModal.setTitle}"`)
      } else if (deleteConfirmModal.type === 'all') {
        await deleteAllFlashcardSets()
        alert('✅ 成功删除所有卡片集')
      }

      // 刷新数据
      await loadFlashcardSets()
      
      // 关闭确认模态框
      setDeleteConfirmModal({
        isOpen: false,
        type: 'single'
      })

    } catch (error) {
      console.error('Error deleting flashcard set(s):', error)
      alert(`❌ 删除失败：${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // Cancel deletion
  const handleCancelDelete = () => {
    setDeleteConfirmModal({
      isOpen: false,
      type: 'single'
    })
  }

  // 处理创建方法选择
  const handleMethodSelected = async (method: 'manual' | 'import' | 'ai-generate', setData: CreateFlashcardSetData) => {
    console.log('Selected method:', method, 'with data:', setData)
    
    try {
      // 先创建基本的卡片集，并获取其信息
      const newSet = await handleCreateFlashcardSet(setData)
      
      // 保存设置数据以供后续使用
      setPendingSetData(setData)
      
      // 构造包含真实ID的临时对象，供后续模态框使用
      const tempSet: FlashcardSet = {
        id: newSet.id, // 使用真实UUID，避免"temp-id"导致数据库错误
        title: newSet.title,
        description: newSet.description || '',
        subject: newSet.subject || 'Other',
        cardCount: 0,
        difficulty: (setData.difficulty || 1) as 1 | 2 | 3 | 4 | 5,
        isPublic: setData.is_public || false,
        author: 'current-user',
        masteryLevel: 0,
        estimatedStudyTime: 0,
        tags: setData.tags || [],
        dueForReview: false
      }
      
      // 根据选择的方法打开相应的模态框
      if (method === 'import') {
        setSelectedSet(tempSet)
        setShowBatchImportModal(true)
      } else if (method === 'ai-generate') {
        setSelectedSet(tempSet)
        setShowAIGenerator(true)
      }
      // manual 方法已在 handleCreateFlashcardSet 中处理
      
    } catch (error) {
      console.error('Error in method selection:', error)
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
    setPendingSetData(null);
  };

  // 开始学习模式
  const handleStartStudy = async (set: FlashcardSet) => {
    try {
      // 从数据库获取实际的待复习卡片
      const dueCards = await getDueFlashcards(set.id)
      
      if (dueCards.length === 0) {
        alert('🎉 恭喜！当前没有需要复习的卡片。')
        return
      }

      console.log(`开始学习: ${set.title}，待复习卡片: ${dueCards.length}张`)
      setSelectedSet(set)
      setStudyCards(dueCards)
      setStudyMode('studying')
    } catch (error) {
      console.error('获取待复习卡片失败:', error)
      alert('无法加载复习卡片，请重试')
    }
  }

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

  // 开始考试流程
  const handleStartExamFlow = (examType: ExamType) => {
    setSelectedExamType(examType)
    setExamFlowOpen(true)
  }

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
        {(['flashcards', 'solver', 'exams', 'analytics'] as const).map(tab => (
          <button
            key={tab}
            className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            <span className={styles.tabIcon}>
              {tab === 'flashcards' && '🃏'}
              {tab === 'solver' && '🔬'}
              {tab === 'exams' && '📝'}
              {tab === 'analytics' && '📊'}
            </span>
            <span className={styles.tabLabel}>
              {tab === 'solver' ? 'Problem Solver' : tab.charAt(0).toUpperCase() + tab.slice(1)}
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
        
        {/* Flashcards Tab - Redesigned to Match Modern Style */}
        {activeTab === 'flashcards' && (
          <div className={styles.flashcardsTab}>
            
            {/* Modern Tab Header */}
            <div className={styles.modernTabHeader}>
              <div className={styles.headerLeft}>
                <h2 className={styles.modernTabTitle}>
                  <span className={styles.titleIcon}>🃏</span>
                  My Study Sets
                </h2>
                <p className={styles.modernTabSubtitle}>
                  Manage and study your flashcard collections with AI-powered spaced repetition
                </p>
              </div>
              <div className={styles.headerActions}>
                <div className={styles.flashcardStats}>
                  <div className={styles.flashcardStatItem}>
                    <span className={styles.statNumber}>{myFlashcardSets.length}</span>
                    <span className={styles.statLabel}>Study Sets</span>
                  </div>
                  <div className={styles.flashcardStatItem}>
                    <span className={styles.statNumber}>{studyStats.totalCards}</span>
                    <span className={styles.statLabel}>Total Cards</span>
                  </div>
                  {studyStats.dueForReview > 0 && (
                    <div className={styles.flashcardStatItem}>
                      <span className={styles.statNumber + ' ' + styles.dueNumber}>{studyStats.dueForReview}</span>
                      <span className={styles.statLabel}>Due Now</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Section */}
            <div className={styles.quickActionsSection}>
              <div className={styles.quickActionsCard}>
                <div className={styles.quickActionsHeader}>
                  <span className={styles.quickIcon}>⚡</span>
                  <h3>Quick Actions</h3>
                </div>
                <div className={styles.quickActionsGrid}>
                  <button 
                    className={styles.modernActionBtn + ' ' + styles.primaryAction} 
                    onClick={() => setShowCreateModal(true)}
                  >
                    <span className={styles.actionIcon}>➕</span>
                    <span className={styles.actionText}>Create New Set</span>
                  </button>
                  
                  {studyStats.dueForReview > 0 && (
                    <button className={styles.modernActionBtn + ' ' + styles.reviewAction}>
                      <span className={styles.actionIcon}>⏰</span>
                      <span className={styles.actionText}>Review All Due</span>
                    </button>
                  )}
                  
                  {myFlashcardSets.length > 0 && (
                    <button 
                      className={styles.modernActionBtn + ' ' + styles.dangerAction} 
                      onClick={handleDeleteAllSets}
                    >
                      <span className={styles.actionIcon}>🗑️</span>
                      <span className={styles.actionText}>Delete All</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Priority Review Section */}
            {studyStats.dueForReview > 0 && (
              <div className={styles.priorityReviewSection}>
                <div className={styles.priorityReviewCard}>
                  <div className={styles.priorityHeader}>
                    <div className={styles.priorityIcon}>🔥</div>
                    <div className={styles.priorityContent}>
                      <h3 className={styles.priorityTitle}>Ready for Review</h3>
                      <p className={styles.priorityDesc}>
                        {studyStats.dueForReview} sets are due for spaced repetition review
                      </p>
                    </div>
                    <div className={styles.priorityBadge}>
                      <span className={styles.priorityCount}>{studyStats.dueForReview}</span>
                    </div>
                  </div>
                  <button className={styles.priorityActionBtn}>
                    <span>Review All Now</span>
                    <span className={styles.priorityArrow}>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* Study Sets Grid - Modern Design */}
            <div className={styles.modernSetsContainer}>
              <div className={styles.modernSetsGrid}>
                {myFlashcardSets.map((set, index) => (
                  <div key={set.id} className={`${styles.modernSetCard} ${set.dueForReview ? styles.dueCard : ''}`}>
                    <div className={styles.setCardGlow}></div>
                    
                    {/* Card Header */}
                    <div className={styles.modernCardHeader}>
                      <div className={styles.setSubjectIcon}>
                        {set.subject === 'Mathematics' && '📐'}
                        {set.subject === 'Chemistry' && '🧪'}
                        {set.subject === 'History' && '📜'}
                        {set.subject === 'Foreign Language' && '🌍'}
                        {!['Mathematics', 'Chemistry', 'History', 'Foreign Language'].includes(set.subject) && '📚'}
                      </div>
                      {set.dueForReview && (
                        <div className={styles.modernDueIndicator}>
                          <span className={styles.dueNotification}>DUE</span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className={styles.modernCardContent}>
                      <div className={styles.setTitleSection}>
                        <h3 className={styles.modernSetTitle}>{set.title}</h3>
                        <div className={styles.setMeta}>
                          <span className={styles.setCardCount}>{set.cardCount} cards</span>
                          <span className={styles.setSubject}>{set.subject}</span>
                        </div>
                      </div>

                      {/* Mastery Progress */}
                      <div className={styles.modernProgressSection}>
                        <div className={styles.progressHeader}>
                          <span className={styles.progressLabel}>Mastery Level</span>
                          <span className={styles.progressValue}>{set.masteryLevel}%</span>
                        </div>
                        <div className={styles.progressTrack}>
                          <div 
                            className={styles.progressBar}
                            style={{ 
                              width: `${set.masteryLevel}%`,
                              background: getMasteryColor(set.masteryLevel)
                            }}
                          ></div>
                        </div>
                        <div className={styles.progressDetails}>
                          <div className={styles.difficultyStars}>
                            {[...Array(5)].map((_, i) => (
                              <span 
                                key={i} 
                                className={`${styles.star} ${i < set.difficulty ? styles.active : ''}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className={styles.estimatedTime}>~{set.estimatedStudyTime}min</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className={styles.modernCardActions}>
                      <button 
                        className={`${styles.modernStudyBtn} ${set.dueForReview ? styles.reviewBtn : ''}`}
                        onClick={() => handleStartStudy(set)}
                      >
                        <span className={styles.btnIcon}>
                          {set.dueForReview ? '🎯' : '📚'}
                        </span>
                        <span className={styles.btnText}>
                          {set.dueForReview ? 'Review Now' : 'Study'}
                        </span>
                      </button>
                      
                      <div className={styles.secondaryActions}>
                        <button 
                          className={styles.modernSecondaryBtn}
                          onClick={() => {
                            setSelectedSet(set);
                            setShowManageModal(true);
                          }}
                          title="Manage Cards"
                        >
                          <span className={styles.secondaryIcon}>📝</span>
                        </button>
                        
                        <button 
                          className={styles.modernSecondaryBtn + ' ' + styles.deleteBtn}
                          onClick={() => handleDeleteSet(set.id, set.title)}
                          title="Delete Set"
                        >
                          <span className={styles.secondaryIcon}>🗑️</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {myFlashcardSets.length === 0 && (
                <div className={styles.modernEmptyState}>
                  <div className={styles.emptyStateCard}>
                    <div className={styles.emptyIcon}>🃏</div>
                    <h3 className={styles.emptyTitle}>No Study Sets Yet</h3>
                    <p className={styles.emptyDesc}>
                      Create your first flashcard set to start your learning journey
                    </p>
                    <button 
                      className={styles.emptyActionBtn} 
                      onClick={() => setShowCreateModal(true)}
                    >
                      <span className={styles.actionIcon}>➕</span>
                      <span>Create Your First Set</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Problem Solver Tab - Redesigned with Cyberpunk Aesthetic */}
        {activeTab === 'solver' && (
          <div className={styles.solverTab}>
            <StemSolver />
          </div>
        )}

        {/* Exams Tab - Completely Redesigned */}
        {activeTab === 'exams' && (
          <div className={styles.examsTab}>
            {/* Enhanced Header */}
            <div className={styles.modernTabHeader}>
              <div className={styles.headerLeft}>
                <h2 className={styles.modernTabTitle}>
                  <span className={styles.titleIcon}>📝</span>
                  Exam Preparation Hub
                </h2>
                <p className={styles.modernTabSubtitle}>
                  AI-generated exams and realistic course simulations
                </p>
              </div>
              <div className={styles.headerActions}>
                <div className={styles.examStats}>
                  <div className={styles.examStatItem}>
                    <span className={styles.statNumber}>12</span>
                    <span className={styles.statLabel}>Exams Taken</span>
                  </div>
                  <div className={styles.examStatItem}>
                    <span className={styles.statNumber}>87%</span>
                    <span className={styles.statLabel}>Avg Score</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Exam Generator */}
            <div className={styles.quickExamSection}>
              <div className={styles.quickExamCard}>
                <div className={styles.quickExamHeader}>
                  <span className={styles.quickIcon}>⚡</span>
                  <h3>Quick Exam Generator</h3>
                </div>
                <div className={styles.quickExamForm}>
                  <div className={styles.formRow}>
                    <select className={styles.modernSelect}>
                      <option>Select Subject</option>
                      <option>Mathematics</option>
                      <option>Chemistry</option>
                      <option>Physics</option>
                      <option>History</option>
                    </select>
                    <select className={styles.modernSelect}>
                      <option>Difficulty</option>
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                    <input 
                      type="number" 
                      className={styles.modernInput} 
                      placeholder="Questions" 
                      defaultValue={25} 
                    />
                    <button className={styles.generateBtn}>
                      <span>Generate</span>
                      <span className={styles.sparkles}>✨</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Exam Types Grid - Modern Design */}
            <div className={styles.modernExamGrid}>
              {examTypes.map((examType, index) => (
                <div key={examType.id} className={`${styles.modernExamCard} ${styles[`examCard${index + 1}`]}`}>
                  <div className={styles.examCardGlow}></div>
                  
                  <div className={styles.examCardHeader}>
                    <div className={styles.examTypeIcon}>
                      {examType.name.includes('SAT') ? '🎓' : 
                       examType.name.includes('AP') ? '📚' : 
                       examType.name.includes('Final') ? '📊' : '📝'}
                    </div>
                    <div className={styles.examDifficulty}>
                      <div className={styles.difficultyDots}>
                        {[1,2,3,4,5].map(dot => (
                          <div 
                            key={dot} 
                            className={`${styles.difficultyDot} ${
                              dot <= (examType.difficulty === 'Easy' ? 2 : 
                                     examType.difficulty === 'Medium' ? 3 : 
                                     examType.difficulty === 'Hard' ? 4 : 5) 
                              ? styles.active : ''
                            }`}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.examCardContent}>
                    <h3 className={styles.examTypeName}>{examType.name}</h3>
                    <p className={styles.examTypeDesc}>{examType.description}</p>
                    
                    <div className={styles.examDetails}>
                      <div className={styles.examDetail}>
                        <span className={styles.detailIcon}>⏱️</span>
                        <span className={styles.detailText}>{examType.duration} min</span>
                      </div>
                      <div className={styles.examDetail}>
                        <span className={styles.detailIcon}>❓</span>
                        <span className={styles.detailText}>{examType.questionCount} questions</span>
                      </div>
                    </div>
                    
                    <div className={styles.examSubjects}>
                      {examType.subjects.slice(0, 3).map(subject => (
                        <span key={subject} className={styles.subjectChip}>{subject}</span>
                      ))}
                      {examType.subjects.length > 3 && (
                        <span className={styles.moreSubjects}>+{examType.subjects.length - 3}</span>
                      )}
                    </div>
                  </div>
                  
                  <button className={styles.modernExamButton} onClick={() => handleStartExamFlow(examType)}>
                    <span className={styles.buttonText}>Start Exam</span>
                    <span className={styles.buttonIcon}>🚀</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab - Completely Redesigned */}
        {activeTab === 'analytics' && (
          <div className={styles.analyticsTab}>
            {/* Enhanced Header */}
            <div className={styles.modernTabHeader}>
              <div className={styles.headerLeft}>
                <h2 className={styles.modernTabTitle}>
                  <span className={styles.titleIcon}>📊</span>
                  Learning Analytics
                </h2>
                <p className={styles.modernTabSubtitle}>
                  AI-powered insights into your study patterns and performance
                </p>
              </div>
              <div className={styles.headerActions}>
                <div className={styles.timeRangeSelector}>
                  <button className={styles.timeRange + ' ' + styles.active}>Week</button>
                  <button className={styles.timeRange}>Month</button>
                  <button className={styles.timeRange}>Year</button>
                </div>
              </div>
            </div>

            {/* Analytics Dashboard Grid */}
            <div className={styles.modernAnalyticsGrid}>
              
              {/* Performance Overview - Hero Card */}
              <div className={styles.heroAnalyticsCard}>
                <div className={styles.heroCardHeader}>
                  <h3 className={styles.heroTitle}>Performance Overview</h3>
                  <div className={styles.heroTrend}>
                    <span className={styles.trendIcon}>↗️</span>
                    <span className={styles.trendText}>+12% this week</span>
                  </div>
                </div>
                
                <div className={styles.heroMetrics}>
                  <div className={styles.heroMetric}>
                    <div className={styles.metricCircle}>
                      <svg className={styles.progressRing} viewBox="0 0 100 100">
                        <circle 
                          cx="50" cy="50" r="45" 
                          fill="none" 
                          stroke="rgba(79, 70, 229, 0.2)" 
                          strokeWidth="8"
                        />
                        <circle 
                          cx="50" cy="50" r="45" 
                          fill="none" 
                          stroke="url(#gradient1)" 
                          strokeWidth="8"
                          strokeDasharray="283"
                          strokeDashoffset="85"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className={styles.metricValue}>85%</div>
                    </div>
                    <span className={styles.metricLabel}>Study Efficiency</span>
                  </div>
                  
                  <div className={styles.heroMetric}>
                    <div className={styles.metricCircle}>
                      <svg className={styles.progressRing} viewBox="0 0 100 100">
                        <circle 
                          cx="50" cy="50" r="45" 
                          fill="none" 
                          stroke="rgba(6, 182, 212, 0.2)" 
                          strokeWidth="8"
                        />
                        <circle 
                          cx="50" cy="50" r="45" 
                          fill="none" 
                          stroke="url(#gradient2)" 
                          strokeWidth="8"
                          strokeDasharray="283"
                          strokeDashoffset="68"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className={styles.metricValue}>76%</div>
                    </div>
                    <span className={styles.metricLabel}>Learning Velocity</span>
                  </div>
                  
                  <div className={styles.heroMetric}>
                    <div className={styles.metricCircle}>
                      <svg className={styles.progressRing} viewBox="0 0 100 100">
                        <circle 
                          cx="50" cy="50" r="45" 
                          fill="none" 
                          stroke="rgba(0, 212, 255, 0.2)" 
                          strokeWidth="8"
                        />
                        <circle 
                          cx="50" cy="50" r="45" 
                          fill="none" 
                          stroke="url(#gradient3)" 
                          strokeWidth="8"
                          strokeDasharray="283"
                          strokeDashoffset="28"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className={styles.metricValue}>{studyStats.averageMastery}%</div>
                    </div>
                    <span className={styles.metricLabel}>Average Mastery</span>
                  </div>
                </div>
                
                <div className={styles.heroFooter}>
                  <div className={styles.heroStat}>
                    <span className={styles.heroStatValue}>4h 32m</span>
                    <span className={styles.heroStatLabel}>This week</span>
                  </div>
                  <div className={styles.heroStat}>
                    <span className={styles.heroStatValue}>38 min</span>
                    <span className={styles.heroStatLabel}>Avg session</span>
                  </div>
                  <div className={styles.heroStat}>
                    <span className={styles.heroStatValue}>{studyStats.streak} days</span>
                    <span className={styles.heroStatLabel}>Current streak</span>
                  </div>
                </div>
              </div>

              {/* Memory Retention Analysis */}
              <div className={styles.modernAnalyticsCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <span className={styles.cardIcon}>🧠</span>
                    Memory Retention
                  </h3>
                  <div className={styles.cardBadge}>FSRS-5</div>
                </div>
                
                <div className={styles.retentionViz}>
                  {[
                    { label: '24h', value: 94, color: '#00D4FF' },
                    { label: '1 week', value: 82, color: '#06B6D4' },
                    { label: '1 month', value: 71, color: '#4F46E5' },
                    { label: '3 months', value: 63, color: '#7C3AED' }
                  ].map((item, index) => (
                    <div key={item.label} className={styles.retentionItem}>
                      <div className={styles.retentionHeader}>
                        <span className={styles.retentionLabel}>{item.label}</span>
                        <span className={styles.retentionPercent}>{item.value}%</span>
                      </div>
                      <div className={styles.retentionBarContainer}>
                        <div 
                          className={styles.retentionBar}
                          style={{ 
                            width: `${item.value}%`,
                            background: `linear-gradient(90deg, ${item.color}40, ${item.color})`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Study Heatmap */}
              <div className={styles.modernAnalyticsCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <span className={styles.cardIcon}>📅</span>
                    Study Heatmap
                  </h3>
                </div>
                
                <div className={styles.heatmapContainer}>
                  <div className={styles.heatmapGrid}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                      const intensity = [60, 80, 45, 90, 70, 30, 40][index];
                      return (
                        <div key={day} className={styles.heatmapDay}>
                          <div className={styles.dayLabel}>{day}</div>
                          <div 
                            className={styles.heatmapCell}
                            style={{ 
                              background: `rgba(79, 70, 229, ${intensity / 100})`,
                              height: `${intensity}%`
                            }}
                            title={`${Math.round(intensity * 1.5)} minutes`}
                          ></div>
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles.heatmapLegend}>
                    <span>Less</span>
                    <div className={styles.legendScale}>
                      {[0.2, 0.4, 0.6, 0.8, 1.0].map(opacity => (
                        <div 
                          key={opacity}
                          className={styles.legendCell}
                          style={{ background: `rgba(79, 70, 229, ${opacity})` }}
                        ></div>
                      ))}
                    </div>
                    <span>More</span>
                  </div>
                </div>
              </div>

              {/* Subject Performance Radar */}
              <div className={styles.modernAnalyticsCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <span className={styles.cardIcon}>📚</span>
                    Subject Mastery
                  </h3>
                </div>
                
                <div className={styles.subjectList}>
                  {myFlashcardSets.slice(0, 5).map(set => (
                    <div key={set.id} className={styles.subjectRow}>
                      <div className={styles.subjectInfo}>
                        <span className={styles.subjectName}>{set.subject}</span>
                        <span className={styles.subjectCards}>{set.cardCount} cards</span>
                      </div>
                      <div className={styles.subjectProgress}>
                        <div className={styles.progressTrack}>
                          <div 
                            className={styles.progressThumb}
                            style={{ 
                              width: `${set.masteryLevel}%`,
                              background: getMasteryColor(set.masteryLevel)
                            }}
                          ></div>
                        </div>
                        <span className={styles.progressValue}>{set.masteryLevel}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Insights */}
              <div className={styles.modernAnalyticsCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <span className={styles.cardIcon}>🤖</span>
                    AI Insights
                  </h3>
                  <div className={styles.cardBadge}>Live</div>
                </div>
                
                <div className={styles.insightsList}>
                  {[
                    { icon: '🎯', text: 'Focus on Organic Chemistry - 35% improvement potential', type: 'priority' },
                    { icon: '⏰', text: 'Your peak performance is 9-11 AM', type: 'timing' },
                    { icon: '🔄', text: 'Review Spanish vocabulary in 2 days', type: 'schedule' },
                    { icon: '🎮', text: 'Try Match Game for Calculus concepts', type: 'method' }
                  ].map((insight, index) => (
                    <div key={index} className={styles.insightItem}>
                      <span className={styles.insightIcon}>{insight.icon}</span>
                      <span className={styles.insightText}>{insight.text}</span>
                      <div className={styles.insightType}>{insight.type}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements Showcase */}
              <div className={styles.modernAnalyticsCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <span className={styles.cardIcon}>🏆</span>
                    Achievements
                  </h3>
                </div>
                
                <div className={styles.achievementsGrid}>
                  <div className={styles.achievementBadge}>
                    <div className={styles.badgeIcon}>🎯</div>
                    <div className={styles.badgeInfo}>
                      <span className={styles.badgeName}>Sharp Shooter</span>
                      <span className={styles.badgeDesc}>90%+ accuracy</span>
                    </div>
                    <div className={styles.badgeRarity}>Rare</div>
                  </div>
                  
                  <div className={styles.achievementBadge}>
                    <div className={styles.badgeIcon}>⚡</div>
                    <div className={styles.badgeInfo}>
                      <span className={styles.badgeName}>Speed Demon</span>
                      <span className={styles.badgeDesc}>Fast responses</span>
                    </div>
                    <div className={`${styles.badgeRarity} ${styles.epic}`}>Epic</div>
                  </div>
                  
                  <div className={styles.achievementBadge}>
                    <div className={styles.badgeIcon}>📚</div>
                    <div className={styles.badgeInfo}>
                      <span className={styles.badgeName}>Scholar</span>
                      <span className={styles.badgeDesc}>3 subjects mastered</span>
                    </div>
                    <div className={`${styles.badgeRarity} ${styles.legendary}`}>Legendary</div>
                  </div>
                </div>
                
                <div className={styles.nextAchievement}>
                  <span className={styles.nextText}>Next: </span>
                  <span className={styles.nextName}>Perfect Week (6/7 days)</span>
                  <div className={styles.nextProgress}>
                    <div className={styles.nextBar}>
                      <div className={styles.nextFill} style={{ width: '86%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SVG Gradients for circular progress */}
            <svg width="0" height="0">
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4F46E5" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#00D4FF" />
                </linearGradient>
                <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00D4FF" />
                  <stop offset="100%" stopColor="#4F46E5" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        )}
      </div>

      {/* Create Flashcard Set Modal */}
      <CreateFlashcardSetModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={async (data) => { await handleCreateFlashcardSet(data); }}
        onMethodSelected={handleMethodSelected}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div 
          className={styles.modalOverlay} 
          onClick={handleCancelDelete}
          style={{ zIndex: 9999 }}
        >
          <div 
            className={styles.deleteConfirmModal}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              border: '1px solid rgba(255, 0, 0, 0.3)',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
              maxWidth: '450px',
              width: '90vw',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 0, 0, 0.2)',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>
              ⚠️
            </div>
            
            <h3 style={{ 
              color: '#ffffff', 
              marginBottom: '16px', 
              fontSize: '24px',
              fontWeight: '600' 
            }}>
              {deleteConfirmModal.type === 'single' ? '确认删除卡片集' : '确认删除所有卡片集'}
            </h3>
            
            <p style={{ 
              color: '#cccccc', 
              marginBottom: '32px', 
              lineHeight: '1.6',
              fontSize: '16px'
            }}>
              {deleteConfirmModal.type === 'single' 
                ? `你确定要删除卡片集 "${deleteConfirmModal.setTitle}" 吗？\n\n这个操作无法撤销，所有卡片和学习进度都将被永久删除。`
                : `你确定要删除所有 ${flashcardSets.length} 个卡片集吗？\n\n这个操作无法撤销，所有卡片和学习进度都将被永久删除。`
              }
            </p>

            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              justifyContent: 'center' 
            }}>
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                style={{
                  padding: '14px 28px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '10px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  opacity: isDeleting ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
              >
                取消
              </button>
              
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  padding: '14px 28px',
                  background: isDeleting ? 'rgba(255, 0, 0, 0.3)' : '#ef4444',
                  color: '#ffffff',
                  border: '1px solid #dc2626',
                  borderRadius: '10px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  opacity: isDeleting ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) {
                    const btn = e.currentTarget as HTMLElement;
                    btn.style.background = '#dc2626';
                    btn.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting) {
                    const btn = e.currentTarget as HTMLElement;
                    btn.style.background = '#ef4444';
                    btn.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isDeleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exam Flow Modal */}
      {examFlowOpen && selectedExamType && (
        <ExamFlow
          isOpen={examFlowOpen}
          examType={selectedExamType}
          onClose={() => setExamFlowOpen(false)}
        />
      )}
    </div>
  )
}

export default Review 