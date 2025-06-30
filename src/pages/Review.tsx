import BackToDashboardButton from '@/components/BackToDashboardButton'
import { useUser } from '@/context/UserContext'
import { useAdvancedLearningAnalytics } from '@/hooks/useAdvancedLearningAnalytics'
import { useEffect, useMemo, useState } from 'react'
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

const Review = () => {
  const { user } = useUser()
  const { 
    comprehensive_analysis, 
    is_analyzing, 
    triggerAnalysis,
    analytics 
  } = useAdvancedLearningAnalytics(user?.id || '')
  
  // State management
  const [activeTab, setActiveTab] = useState<'flashcards' | 'study' | 'exams' | 'analytics'>('flashcards')
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null)
  const [studyMode, setStudyMode] = useState<string>('flashcard')
  const [focusMode, setFocusMode] = useState(false)
  const [currentStreak, setCurrentStreak] = useState(7) // Example streak
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Mock data - 在实际环境中这些会从API获取
  const myFlashcardSets: FlashcardSet[] = useMemo(() => [
    {
      id: 'set-1',
      title: 'Calculus BC - Derivatives & Integrals',
      description: 'Advanced calculus concepts including derivative rules, integration techniques, and applications',
      subject: 'Mathematics',
      cardCount: 45,
      difficulty: 4,
      isPublic: false,
      author: 'You',
      lastStudied: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      masteryLevel: 78,
      estimatedStudyTime: 25,
      tags: ['calculus', 'derivatives', 'integrals', 'ap-math'],
      dueForReview: true,
      nextReview: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'set-2', 
      title: 'Organic Chemistry - Reaction Mechanisms',
      description: 'Major organic reaction mechanisms, stereochemistry, and synthetic pathways',
      subject: 'Chemistry',
      cardCount: 32,
      difficulty: 5,
      isPublic: false,
      author: 'You',
      lastStudied: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      masteryLevel: 65,
      estimatedStudyTime: 40,
      tags: ['chemistry', 'organic', 'reactions', 'mechanisms'],
      dueForReview: true,
      nextReview: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'set-3',
      title: 'US History - Civil War Era (1850-1870)',
      description: 'Key events, figures, causes, and consequences of the American Civil War period',
      subject: 'History',
      cardCount: 28,
      difficulty: 3,
      isPublic: true,
      author: 'You',
      masteryLevel: 92,
      estimatedStudyTime: 15,
      tags: ['history', 'civil-war', 'american', 'reconstruction'],
      dueForReview: false,
      nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'set-4',
      title: 'Spanish Vocabulary - Advanced Level',
      description: 'Advanced Spanish vocabulary for academic and professional contexts',
      subject: 'Foreign Language',
      cardCount: 60,
      difficulty: 4,
      isPublic: false,
      author: 'You',
      lastStudied: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      masteryLevel: 83,
      estimatedStudyTime: 30,
      tags: ['spanish', 'vocabulary', 'advanced', 'academic'],
      dueForReview: true,
      nextReview: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
    }
  ], [])

  const studyModes: StudyMode[] = useMemo(() => [
    {
      id: 'flashcard',
      name: 'Classic Flashcards',
      description: 'Traditional card flipping with AI-powered hints and explanations',
      icon: '🃏',
      difficulty: 'Beginner',
      estimatedTime: '10-20 min',
      features: ['Flip animation', 'Audio support', 'Progress tracking', 'AI hints', 'Spaced repetition'],
      inspiration: 'Quizlet + Anki'
    },
    {
      id: 'learn',
      name: 'Adaptive Learn Mode',
      description: 'Multiple question types with AI-powered difficulty adaptation',
      icon: '🧠',
      difficulty: 'Intermediate', 
      estimatedTime: '15-30 min',
      features: ['Multiple choice', 'Type answers', 'True/False', 'AI adaptation', 'Confidence tracking'],
      inspiration: 'Quizlet + Brainscape'
    },
    {
      id: 'test',
      name: 'Comprehensive Test',
      description: 'Full testing experience with detailed performance analytics',
      icon: '📝',
      difficulty: 'Advanced',
      estimatedTime: '20-45 min',
      features: ['Timed questions', 'Mixed formats', 'Performance analysis', 'Weak spot detection'],
      inspiration: 'Khan Academy + Magoosh'
    },
    {
      id: 'match',
      name: 'Match Game',
      description: 'Fast-paced drag-and-drop matching challenge',
      icon: '🎯',
      difficulty: 'Beginner',
      estimatedTime: '5-10 min',
      features: ['Drag & drop', 'Speed challenge', 'Leaderboards', 'Personal best tracking'],
      inspiration: 'Quizlet Match'
    },
    {
      id: 'gravity',
      name: 'Gravity Challenge',
      description: 'Type answers before terms fall from the sky',
      icon: '🌪️',
      difficulty: 'Intermediate',
      estimatedTime: '5-15 min',
      features: ['Typing speed', 'Progressive difficulty', 'Power-ups', 'High score system'],
      inspiration: 'Quizlet Gravity'
    },
    {
      id: 'ai-tutor',
      name: 'AI Tutor Session',
      description: 'One-on-one AI tutoring with personalized explanations',
      icon: '🤖',
      difficulty: 'Advanced',
      estimatedTime: '15-25 min',
      features: ['Conversational AI', 'Personalized explanations', 'Concept connections', 'Real-time feedback'],
      inspiration: 'EzA Original + Khan Academy'
    }
  ], [])

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

  // Calculate study statistics
  const studyStats = useMemo(() => {
    const totalCards = myFlashcardSets.reduce((sum, set) => sum + set.cardCount, 0)
    const averageMastery = myFlashcardSets.reduce((sum, set) => sum + set.masteryLevel, 0) / myFlashcardSets.length
    const totalStudyTime = myFlashcardSets.reduce((sum, set) => sum + set.estimatedStudyTime, 0)
    const dueForReview = myFlashcardSets.filter(set => set.dueForReview).length
    
    return {
      totalSets: myFlashcardSets.length,
      totalCards,
      averageMastery: Math.round(averageMastery),
      totalStudyTime,
      streak: currentStreak,
      dueForReview
    }
  }, [myFlashcardSets, currentStreak])

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
        
        {/* Flashcards Tab - Quizlet + Anki Inspired */}
        {activeTab === 'flashcards' && (
          <div className={styles.flashcardsTab}>
            <div className={styles.tabHeader}>
              <h2>My Study Sets</h2>
              <div className={styles.tabActions}>
                <button className={styles.actionBtn}>
                  <span className={styles.actionIcon}>📷</span>
                  Photo to Cards
                </button>
                <button className={styles.actionBtn}>
                  <span className={styles.actionIcon}>📄</span>
                  Import Document
                </button>
                <button className={styles.actionBtn}>
                  <span className={styles.actionIcon}>🤖</span>
                  AI Generate
                </button>
                <button className={styles.actionBtn + ' ' + styles.primaryAction}>
                  <span className={styles.actionIcon}>➕</span>
                  Create New Set
                </button>
              </div>
            </div>

            {/* Priority Review Section - Anki inspired */}
            {studyStats.dueForReview > 0 && (
              <div className={styles.priorityReview}>
                <h3>📅 Due for Review ({studyStats.dueForReview} sets)</h3>
                <p>Based on spaced repetition algorithm - optimal time to review for maximum retention</p>
                <div className={styles.dueCards}>
                  {myFlashcardSets.filter(set => set.dueForReview).map(set => (
                    <div key={set.id} className={styles.dueCard}>
                      <span className={styles.dueTitle}>{set.title}</span>
                      <span className={styles.dueTime}>Due now</span>
                      <button className={styles.reviewNowBtn}>Review Now</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Study Sets Grid */}
            <div className={styles.setsGrid}>
              {myFlashcardSets.map(set => (
                <div key={set.id} className={`${styles.setCard} ${set.dueForReview ? styles.dueCard : ''}`}>
                  <div className={styles.setHeader}>
                    <h3 className={styles.setTitle}>{set.title}</h3>
                    <div className={styles.setMeta}>
                      <span className={styles.cardCount}>{set.cardCount} cards</span>
                      <div 
                        className={styles.difficultyBadge}
                        style={{ backgroundColor: getDifficultyColor(set.difficulty) }}
                        title={`Difficulty: ${set.difficulty}/5`}
                      >
                        {'★'.repeat(set.difficulty)}
                      </div>
                    </div>
                  </div>
                  
                  <p className={styles.setDescription}>{set.description}</p>
                  
                  {/* Mastery Progress - Khan Academy inspired */}
                  <div className={styles.masterySection}>
                    <div className={styles.masteryHeader}>
                      <span className={styles.masteryLabel}>
                        {getMasteryLabel(set.masteryLevel)}: {set.masteryLevel}%
                      </span>
                      <span className={styles.studyTime}>~{set.estimatedStudyTime} min</span>
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
                    {set.dueForReview && (
                      <span className={styles.dueIndicator}>📅 Due for review</span>
                    )}
                  </div>

                  <div className={styles.setTags}>
                    {set.tags.map(tag => (
                      <span key={tag} className={styles.tag}>#{tag}</span>
                    ))}
                  </div>

                  <div className={styles.setActions}>
                    <button 
                      className={`${styles.studyBtn} ${set.dueForReview ? styles.urgent : ''}`}
                      onClick={() => setSelectedSet(set)}
                    >
                      <span className={styles.actionIcon}>🎯</span>
                      {set.dueForReview ? 'Review Now' : 'Study'}
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
                    onClick={() => setStudyMode(mode.id)}
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
      </div>
    </div>
  )
}

export default Review 