import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './StudyModeSelector.module.css'

interface StudyMode {
  id: string
  name: string
  description: string
  icon: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  estimatedTime: string
  features: string[]
  inspiration: string
  component: string // 对应的组件路径
}

interface StudyModeSelectorProps {
  flashcardSetId: string
  flashcardSet: {
    title: string
    cardCount: number
    subject: string
    difficulty: number
  }
  onClose: () => void
}

const StudyModeSelector: React.FC<StudyModeSelectorProps> = ({
  flashcardSetId,
  flashcardSet,
  onClose
}) => {
  const navigate = useNavigate()
  const [selectedMode, setSelectedMode] = useState<string>('')

  const studyModes: StudyMode[] = [
    {
      id: 'flashcard',
      name: 'Classic Flashcards',
      description: 'Traditional card flipping with AI-powered hints',
      icon: '🃏',
      difficulty: 'Beginner',
      estimatedTime: '10-20 min',
      features: ['Flip animation', 'Audio support', 'Progress tracking', 'AI hints', 'Spaced repetition'],
      inspiration: 'Quizlet + Anki',
      component: 'FlashcardStudy'
    },
    {
      id: 'learn',
      name: 'Adaptive Learn Mode', 
      description: 'Multiple question types with AI-powered difficulty adaptation',
      icon: '🧠',
      difficulty: 'Intermediate',
      estimatedTime: '15-30 min',
      features: ['Multiple choice', 'Type answers', 'True/False', 'AI adaptation', 'Confidence tracking'],
      inspiration: 'Quizlet + Brainscape',
      component: 'LearnModeStudy'
    },
    {
      id: 'test',
      name: 'Comprehensive Test',
      description: 'Full testing experience with detailed performance analytics',
      icon: '📝',
      difficulty: 'Advanced',
      estimatedTime: '20-45 min',
      features: ['Timed questions', 'Mixed formats', 'Performance analysis', 'Weak spot detection'],
      inspiration: 'Khan Academy + Testing',
      component: 'TestModeStudy'
    },
    {
      id: 'match',
      name: 'Match Game',
      description: 'Fast-paced drag-and-drop matching challenge',
      icon: '🎯',
      difficulty: 'Beginner',
      estimatedTime: '5-10 min',
      features: ['Drag & drop', 'Speed challenge', 'Leaderboards', 'Personal best tracking'],
      inspiration: 'Quizlet Match',
      component: 'MatchGameStudy'
    },
    {
      id: 'gravity',
      name: 'Gravity Challenge',
      description: 'Type answers before terms fall from the sky',
      icon: '🌪️',
      difficulty: 'Intermediate', 
      estimatedTime: '5-15 min',
      features: ['Typing speed', 'Progressive difficulty', 'Power-ups', 'High score system'],
      inspiration: 'Quizlet Gravity',
      component: 'GravityGameStudy'
    },
    {
      id: 'ai-tutor',
      name: 'AI Tutor Session',
      description: 'One-on-one AI tutoring with personalized explanations',
      icon: '🤖',
      difficulty: 'Advanced',
      estimatedTime: '15-25 min',
      features: ['Conversational AI', 'Personalized explanations', 'Concept connections', 'Real-time feedback'],
      inspiration: 'EzA Original + Khan Academy',
      component: 'AITutorStudy'
    }
  ]

  const handleStartStudy = (mode: StudyMode) => {
    // 导航到对应的学习组件
    navigate(`/study/${mode.component}`, {
      state: {
        modeId: mode.id,
        flashcardSetId,
        flashcardSet,
        mode
      }
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return '#10B981'
      case 'Intermediate': return '#F59E0B'  
      case 'Advanced': return '#EF4444'
      default: return '#6B7280'
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerInfo}>
            <h2>Choose Study Mode</h2>
            <p>Select how you want to study <strong>{flashcardSet.title}</strong></p>
            <div className={styles.setInfo}>
              <span className={styles.cardCount}>{flashcardSet.cardCount} cards</span>
              <span className={styles.subject}>{flashcardSet.subject}</span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <span>✕</span>
          </button>
        </div>

        <div className={styles.modesGrid}>
          {studyModes.map(mode => (
            <div 
              key={mode.id}
              className={`${styles.modeCard} ${selectedMode === mode.id ? styles.selected : ''}`}
              onClick={() => setSelectedMode(mode.id)}
            >
              <div className={styles.modeHeader}>
                <span className={styles.modeIcon}>{mode.icon}</span>
                <div className={styles.modeTitle}>
                  <h3>{mode.name}</h3>
                  <span className={styles.inspiration}>Inspired by {mode.inspiration}</span>
                </div>
                <div 
                  className={styles.difficultyBadge}
                  style={{ backgroundColor: getDifficultyColor(mode.difficulty) }}
                >
                  {mode.difficulty}
                </div>
              </div>

              <p className={styles.modeDescription}>{mode.description}</p>

              <div className={styles.modeInfo}>
                <span className={styles.estimatedTime}>⏱️ {mode.estimatedTime}</span>
              </div>

              <div className={styles.modeFeatures}>
                {mode.features.slice(0, 3).map(feature => (
                  <span key={feature} className={styles.feature}>✓ {feature}</span>
                ))}
                {mode.features.length > 3 && (
                  <span className={styles.moreFeatures}>+{mode.features.length - 3} more</span>
                )}
              </div>

              <button 
                className={`${styles.selectBtn} ${selectedMode === mode.id ? styles.selected : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleStartStudy(mode)
                }}
              >
                {selectedMode === mode.id ? 'Start Study' : 'Select Mode'}
              </button>
            </div>
          ))}
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.quickActions}>
            <button className={styles.quickBtn}>
              <span className={styles.quickIcon}>🎯</span>
              <span>Quick Review (5 min)</span>
            </button>
            <button className={styles.quickBtn}>
              <span className={styles.quickIcon}>🎲</span>
              <span>Random Mode</span>
            </button>
            <button className={styles.quickBtn}>
              <span className={styles.quickIcon}>💡</span>
              <span>AI Recommendation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudyModeSelector 