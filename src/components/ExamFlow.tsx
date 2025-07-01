import { getAllUserFlashcards } from '@/api/flashcards'
import { examAI, GeneratedExam } from '@/services/examAI'
import { ExamSession, ExamResult as TypesExamResult } from '@/types'
import { FSRSCard } from '@/types/SRSTypes'
import React, { useEffect, useState } from 'react'
import ExamAnalytics from './ExamAnalytics'
import styles from './ExamFlow.module.css'
import ExamGeneratorModal from './ExamGeneratorModal'
import ExamRunner from './ExamRunner'

interface ExamFlowProps {
  isOpen: boolean
  examType: any
  onClose: () => void
}

const ExamFlow: React.FC<ExamFlowProps> = ({ isOpen, examType: _examType, onClose }) => {
  const [phase, setPhase] = useState<'loading' | 'generator' | 'runner' | 'analytics'>('loading')
  const [cards, setCards] = useState<FSRSCard[]>([])
  const [exam, setExam] = useState<GeneratedExam | null>(null)
  const [session, setSession] = useState<ExamSession | null>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      // Reset state when flow is closed, regardless of phase
      setPhase('loading');
      setCards([]);
      setExam(null);
      setSession(null);
      setResult(null);
      setError(null);
      return;
    }

    setPhase('loading')
    setError(null)
    
    const loadCards = async () => {
      try {
        const allCards = await getAllUserFlashcards()
        if (allCards.length === 0) {
          setError('您还没有任何闪卡可用于生成考试。')
          return
        }
        setCards(allCards)
        setPhase('generator')
      } catch (err) {
        console.error('Failed to load flashcards for exam:', err)
        setError('无法加载闪卡数据，请稍后重试。')
      }
    }

    loadCards()
  }, [isOpen])

  const handleExamGenerated = (generatedExam: GeneratedExam) => {
    setExam(generatedExam)
    setPhase('runner')
  }

  const handleSessionComplete = async (completedSession: ExamSession) => {
    if (!exam) return
    setSession(completedSession)
    setPhase('loading')
    try {
      const scoredResult = await examAI.scoreExam(exam, completedSession.responses)
      setResult(scoredResult)
      setPhase('analytics')
    } catch (err) {
      console.error('Score exam failed:', err)
      setError('考试评分失败，请检查网络连接或稍后重试。')
    }
  }

  const handleRetake = () => {
    setPhase('generator')
    setExam(null)
    setSession(null)
    setResult(null)
  }

  if (!isOpen) return null

  // The 'generator' phase now uses its own self-contained modal component
  if (phase === 'generator') {
    return (
      <ExamGeneratorModal
        isOpen={true}
        onClose={onClose}
        cards={cards}
        onExamGenerated={handleExamGenerated}
      />
    )
  }

  // Loading and Error states are also modals
  if (phase === 'loading' || error) {
    return (
      <div className={styles.modalOverlay} onClick={error ? onClose : undefined}>
        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
          <div className={styles.centeredMessage}>
            {error ? (
              <>
                <p className={styles.errorMessageHeader}>出错了</p>
                <p className={styles.errorMessageText}>{error}</p>
                <button onClick={onClose} className={styles.closeButtonAction}>
                  关闭
                </button>
              </>
            ) : (
              <>
                <div className={styles.spinner} />
                <p className={styles.loadingMessage}>正在准备考试环境...</p>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Runner and Analytics are full-screen
  if (phase === 'runner' || phase === 'analytics') {
    return (
      <div className={styles.fullScreenContainer}>
        {phase === 'runner' && exam && (
          <ExamRunner exam={exam} onComplete={handleSessionComplete} onExit={onClose} />
        )}
        {phase === 'analytics' && exam && session && result && (
          <ExamAnalytics
            exam={exam}
            session={session}
            result={result as unknown as TypesExamResult}
            onRetake={handleRetake}
            onContinueStudy={onClose}
          />
        )}
      </div>
    )
  }

  return null
}

export default ExamFlow 