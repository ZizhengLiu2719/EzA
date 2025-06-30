import BackToDashboardButton from '@/components/BackToDashboardButton'
import { useUser } from '@/context/UserContext'
import { useAdvancedLearningAnalytics } from '@/hooks/useAdvancedLearningAnalytics'
import { useMemo, useState } from 'react'
import styles from './ReviewExamPrep.module.css'

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
}

interface StudyMode {
  id: string
  name: string
  description: string
  icon: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  estimatedTime: string
  features: string[]
}

interface ExamType {
  id: string
  name: string
  description: string
  duration: number
  questionCount: number
  subjects: string[]
  difficulty: string
}

const ReviewExamPrep = () => {
  const { user } = useUser()
  const { comprehensive_analysis, is_analyzing, triggerAnalysis } = useAdvancedLearningAnalytics(user?.id || '')
  
  // State management
  const [activeTab, setActiveTab] = useState<'flashcards' | 'study' | 'exams' | 'analytics'>('flashcards')
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null)
  const [studyMode, setStudyMode] = useState<string>('flashcard')
  const [focusMode, setFocusMode] = useState(false)
  const [currentStreak, setCurrentStreak] = useState(0)

  // Mock data - 在实际环境中这些会从API获取
  const myFlashcardSets: FlashcardSet[] = useMemo(() => [
    {
      id: 'set-1',
      title: 'Calculus BC - Derivatives',
      description: 'Advanced derivative rules and applications',
      subject: 'Mathematics',
      cardCount: 45,
      difficulty: 4,
      isPublic: false,
      author: 'You',
      lastStudied: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      masteryLevel: 78,
      estimatedStudyTime: 25,
      tags: ['calculus', 'derivatives', 'ap-math']
    },
    {
      id: 'set-2', 
      title: 'Chemistry - Organic Reactions',
      description: 'Major organic reaction mechanisms',
      subject: 'Chemistry',
      cardCount: 32,
      difficulty: 5,
      isPublic: false,
      author: 'You',
      lastStudied: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      masteryLevel: 65,
      estimatedStudyTime: 40,
      tags: ['chemistry', 'organic', 'reactions']
    },
    {
      id: 'set-3',
      title: 'US History - Civil War Era',
      description: 'Key events, figures, and consequences 1850-1870',
      subject: 'History',
      cardCount: 28,
      difficulty: 3,
      isPublic: true,
      author: 'You',
      masteryLevel: 92,
      estimatedStudyTime: 15,
      tags: ['history', 'civil-war', 'american']
    }
  ], [])

  const studyModes: StudyMode[] = useMemo(() => [
    {
      id: 'flashcard',
      name: 'Flashcards',
      description: 'Classic card flipping with AI hints',
      icon: '🃏',
      difficulty: 'Beginner',
      estimatedTime: '10-20 min',
      features: ['Flip cards', 'Audio support', 'Progress tracking', 'AI hints']
    },
    {
      id: 'learn',
      name: 'Learn Mode',
      description: 'Adaptive learning with multiple question types',
      icon: '🧠',
      difficulty: 'Intermediate', 
      estimatedTime: '15-30 min',
      features: ['Multiple choice', 'Type answers', 'Spaced repetition', 'Difficulty adaptation']
    },
    {
      id: 'test',
      name: 'Test Mode',
      description: 'Comprehensive testing with detailed analytics',
      icon: '📝',
      difficulty: 'Advanced',
      estimatedTime: '20-45 min',
      features: ['Timed questions', 'Mixed formats', 'Performance analysis', 'Weak spot detection']
    },
    {
      id: 'match',
      name: 'Match Game',
      description: 'Fast-paced matching game (Quizlet style)',
      icon: '🎯',
      difficulty: 'Beginner',
      estimatedTime: '5-10 min',
      features: ['Drag & drop', 'Speed challenge', 'Leaderboards', 'Personal best']
    },
    {
      id: 'gravity',
      name: 'Gravity Game',
      description: 'Type answers before terms fall (Quizlet style)',
      icon: '🌪️',
      difficulty: 'Intermediate',
      estimatedTime: '5-15 min',
      features: ['Typing speed', 'Progressive difficulty', 'Power-ups', 'High scores']
    },
    {
      id: 'ai-challenge',
      name: 'AI Challenge',
      description: 'Adaptive difficulty with AI-powered questions',
      icon: '🤖',
      difficulty: 'Advanced',
      estimatedTime: '15-25 min',
      features: ['AI adaptation', 'Contextual clues', 'Personalized hints', 'Smart feedback']
    }
  ], [])

  const examTypes: ExamType[] = useMemo(() => [
    {
      id: 'unit-test',
      name: 'Unit Test',
      description: 'Focus on 1-2 weeks of course material',
      duration: 50,
      questionCount: 25,
      subjects: ['Math', 'Science', 'History', 'English'],
      difficulty: 'Standard'
    },
    {
      id: 'midterm',
      name: 'Midterm Exam',
      description: 'Comprehensive half-semester review',
      duration: 90,
      questionCount: 45,
      subjects: ['All Subjects'],
      difficulty: 'Challenging'
    },
    {
      id: 'final-exam',
      name: 'Final Exam',
      description: 'Complete semester cumulative exam',
      duration: 120,
      questionCount: 60,
      subjects: ['All Subjects'],
      difficulty: 'Comprehensive'
    },
    {
      id: 'pop-quiz',
      name: 'Pop Quiz',
      description: 'Quick assessment of recent material',
      duration: 15,
      questionCount: 10,
      subjects: ['Current Topic'],
      difficulty: 'Easy'
    }
  ], [])

  // Calculate study statistics
  const studyStats = useMemo(() => {
    const totalCards = myFlashcardSets.reduce((sum, set) => sum + set.cardCount, 0)
    const averageMastery = myFlashcardSets.reduce((sum, set) => sum + set.masteryLevel, 0) / myFlashcardSets.length
    const totalStudyTime = myFlashcardSets.reduce((sum, set) => sum + set.estimatedStudyTime, 0)
    
    return {
      totalSets: myFlashcardSets.length,
      totalCards,
      averageMastery: Math.round(averageMastery),
      totalStudyTime,
      streak: currentStreak
    }
  }, [myFlashcardSets, currentStreak])

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

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 90) return '#10B981'      // Green - Mastered
    if (mastery >= 75) return '#06B6D4'      // Cyan - Proficient  
    if (mastery >= 50) return '#F59E0B'      // Yellow - Familiar
    if (mastery >= 25) return '#EF4444'      // Red - Learning
    return '#6B7280'                         // Gray - Not started
  }

  return (
    <div className={styles.reviewExamPrep} style={{ position: 'relative' }}>
      <BackToDashboardButton />
      
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Review & Exam Prep</h1>
          <p>AI-powered study system integrating the best of Quizlet, Anki, and more</p>
          
          {/* Quick Stats */}
          <div className={styles.quickStats}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{studyStats.totalSets}</span>
              <span className={styles.statLabel}>Study Sets</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{studyStats.totalCards}</span>
              <span className={styles.statLabel}>Cards</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{studyStats.averageMastery}%</span>
              <span className={styles.statLabel}>Avg Mastery</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{studyStats.streak}</span>
              <span className={styles.statLabel}>Day Streak</span>
            </div>
          </div>
        </div>

        {/* Focus Mode Toggle */}
        <div className={styles.focusToggle}>
          <button 
            className={`${styles.focusBtn} ${focusMode ? styles.active : ''}`}
            onClick={() => setFocusMode(!focusMode)}
          >
            <span className={styles.focusIcon}>🌲</span>
            <span>Focus Mode</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
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
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        
        {/* Flashcards Tab */}
        {activeTab === 'flashcards' && (
          <div className={styles.flashcardsTab}>
            <div className={styles.tabHeader}>
              <h2>My Study Sets</h2>
              <div className={styles.tabActions}>
                <button className={styles.actionBtn}>
                  <span className={styles.actionIcon}>📷</span>
                  Create from Photo
                </button>
                <button className={styles.actionBtn}>
                  <span className={styles.actionIcon}>📄</span>
                  Import from Document
                </button>
                <button className={styles.actionBtn}>
                  <span className={styles.actionIcon}>➕</span>
                  Create New Set
                </button>
              </div>
            </div>

            <div className={styles.setsGrid}>
              {myFlashcardSets.map(set => (
                <div key={set.id} className={styles.setCard}>
                  <div className={styles.setHeader}>
                    <h3 className={styles.setTitle}>{set.title}</h3>
                    <div className={styles.setMeta}>
                      <span className={styles.cardCount}>{set.cardCount} cards</span>
                      <div 
                        className={styles.difficultyBadge}
                        style={{ backgroundColor: getDifficultyColor(set.difficulty) }}
                      >
                        {'★'.repeat(set.difficulty)}
                      </div>
                    </div>
                  </div>
                  
                  <p className={styles.setDescription}>{set.description}</p>
                  
                  <div className={styles.setStats}>
                    <div className={styles.masteryBar}>
                      <div className={styles.masteryLabel}>
                        <span>Mastery: {set.masteryLevel}%</span>
                      </div>
                      <div className={styles.masteryProgress}>
                        <div 
                          className={styles.masteryFill}
                          style={{ 
                            width: `${set.masteryLevel}%`,
                            backgroundColor: getMasteryColor(set.masteryLevel)
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className={styles.setInfo}>
                      <span className={styles.subject}>{set.subject}</span>
                      <span className={styles.studyTime}>~{set.estimatedStudyTime} min</span>
                    </div>
                  </div>

                  <div className={styles.setTags}>
                    {set.tags.map(tag => (
                      <span key={tag} className={styles.tag}>#{tag}</span>
                    ))}
                  </div>

                  <div className={styles.setActions}>
                    <button className={styles.studyBtn} onClick={() => setSelectedSet(set)}>
                      <span className={styles.actionIcon}>🎯</span>
                      Study Now
                    </button>
                    <button className={styles.editBtn}>
                      <span className={styles.actionIcon}>✏️</span>
                      Edit
                    </button>
                    <button className={styles.shareBtn}>
                      <span className={styles.actionIcon}>🔗</span>
                      Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Study Tab */}
        {activeTab === 'study' && (
          <div className={styles.studyTab}>
            <div className={styles.tabHeader}>
              <h2>Study Modes</h2>
              <p>Choose your learning style - from classic flashcards to AI-powered challenges</p>
            </div>

            <div className={styles.studyModesGrid}>
              {studyModes.map(mode => (
                <div key={mode.id} className={styles.studyModeCard}>
                  <div className={styles.modeHeader}>
                    <span className={styles.modeIcon}>{mode.icon}</span>
                    <h3 className={styles.modeName}>{mode.name}</h3>
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
                    onClick={() => setStudyMode(mode.id)}
                  >
                    Start {mode.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exams Tab */}
        {activeTab === 'exams' && (
          <div className={styles.examsTab}>
            <div className={styles.tabHeader}>
              <h2>Course Exam Simulation</h2>
              <p>Practice with realistic exam environments for high school and college courses</p>
            </div>

            <div className={styles.examTypesGrid}>
              {examTypes.map(examType => (
                <div key={examType.id} className={styles.examTypeCard}>
                  <h3 className={styles.examTypeName}>{examType.name}</h3>
                  <p className={styles.examTypeDescription}>{examType.description}</p>
                  
                  <div className={styles.examTypeInfo}>
                    <div className={styles.examInfo}>
                      <span className={styles.infoLabel}>Duration:</span>
                      <span className={styles.infoValue}>{examType.duration} min</span>
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
                  
                  <div className={styles.examSubjects}>
                    {examType.subjects.map(subject => (
                      <span key={subject} className={styles.subject}>{subject}</span>
                    ))}
                  </div>
                  
                  <button className={styles.startExamBtn}>
                    Start {examType.name}
                  </button>
                </div>
              ))}
            </div>

            {/* AI Exam Generator */}
            <div className={styles.aiExamGenerator}>
              <h3>🤖 AI Exam Generator</h3>
              <p>Create custom exams based on your course materials and learning history</p>
              
              <div className={styles.examGeneratorForm}>
                <div className={styles.formGroup}>
                  <label>Subject:</label>
                  <select className={styles.formSelect}>
                    <option>Mathematics</option>
                    <option>Chemistry</option>
                    <option>Physics</option>
                    <option>History</option>
                    <option>English</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Exam Type:</label>
                  <select className={styles.formSelect}>
                    <option>Unit Test</option>
                    <option>Midterm</option>
                    <option>Final Exam</option>
                    <option>Custom</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Duration (minutes):</label>
                  <input type="number" className={styles.formInput} defaultValue={50} />
                </div>
                
                <button className={styles.generateExamBtn}>
                  <span className={styles.actionIcon}>🎯</span>
                  Generate AI Exam
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className={styles.analyticsTab}>
            <div className={styles.tabHeader}>
              <h2>Learning Analytics</h2>
              <p>Deep insights into your study patterns and performance</p>
            </div>

            <div className={styles.analyticsGrid}>
              {/* Performance Overview */}
              <div className={styles.analyticsCard}>
                <h3>📈 Performance Overview</h3>
                <div className={styles.performanceMetrics}>
                  <div className={styles.metric}>
                    <span className={styles.metricValue}>
                      {comprehensive_analysis?.efficiency_score || 85}%
                    </span>
                    <span className={styles.metricLabel}>Study Efficiency</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricValue}>
                      {comprehensive_analysis?.learning_velocity || 76}%
                    </span>
                    <span className={styles.metricLabel}>Learning Velocity</span>
                  </div>
                </div>
              </div>

              {/* Memory Retention */}
              <div className={styles.analyticsCard}>
                <h3>🧠 Memory Retention</h3>
                <div className={styles.retentionChart}>
                  <div className={styles.retentionBar}>
                    <span className={styles.retentionLabel}>24 hours</span>
                    <div className={styles.retentionProgress}>
                      <div className={styles.retentionFill} style={{ width: '92%' }}></div>
                    </div>
                    <span className={styles.retentionValue}>92%</span>
                  </div>
                  <div className={styles.retentionBar}>
                    <span className={styles.retentionLabel}>1 week</span>
                    <div className={styles.retentionProgress}>
                      <div className={styles.retentionFill} style={{ width: '78%' }}></div>
                    </div>
                    <span className={styles.retentionValue}>78%</span>
                  </div>
                  <div className={styles.retentionBar}>
                    <span className={styles.retentionLabel}>1 month</span>
                    <div className={styles.retentionProgress}>
                      <div className={styles.retentionFill} style={{ width: '65%' }}></div>
                    </div>
                    <span className={styles.retentionValue}>65%</span>
                  </div>
                </div>
              </div>

              {/* Study Recommendations */}
              <div className={styles.analyticsCard}>
                <h3>💡 AI Recommendations</h3>
                <div className={styles.recommendations}>
                  <div className={styles.recommendation}>
                    <span className={styles.recommendationIcon}>🎯</span>
                    <span className={styles.recommendationText}>
                      Focus more on Chemistry - Organic Reactions (65% mastery)
                    </span>
                  </div>
                  <div className={styles.recommendation}>
                    <span className={styles.recommendationIcon}>⏰</span>
                    <span className={styles.recommendationText}>
                      Your peak learning time is 9-11 AM
                    </span>
                  </div>
                  <div className={styles.recommendation}>
                    <span className={styles.recommendationIcon}>🔄</span>
                    <span className={styles.recommendationText}>
                      Review Calculus derivatives in 2 days for optimal retention
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions Floating Panel */}
      <div className={styles.quickActions}>
        <button className={styles.quickActionBtn} onClick={() => triggerAnalysis()}>
          <span className={styles.actionIcon}>🔄</span>
          Refresh Analytics
        </button>
        <button className={styles.quickActionBtn}>
          <span className={styles.actionIcon}>📊</span>
          Export Progress
        </button>
        <button className={styles.quickActionBtn}>
          <span className={styles.actionIcon}>🎯</span>
          Set Study Goals
        </button>
      </div>
    </div>
  )
}

export default ReviewExamPrep 