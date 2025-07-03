import { FlashcardSetWithStats, getFlashcardSets } from '@/api/flashcards'
import { examAI, GeneratedExam } from '@/services/examAI'
import { ExamResult, ExamSession } from '@/types/examTypes'
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
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSetWithStats[]>([])
  const [exam, setExam] = useState<GeneratedExam | null>(null)
  const [session, setSession] = useState<ExamSession | null>(null)
  const [result, setResult] = useState<ExamResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      // Reset state when flow is closed, regardless of phase
      setPhase('loading');
      setFlashcardSets([]);
      setExam(null);
      setSession(null);
      setResult(null);
      setError(null);
      return;
    }

    setPhase('loading')
    setError(null)
    
    const loadSets = async () => {
      try {
        const sets = await getFlashcardSets()
        if (sets.length === 0) {
          setError('You do not have any flashcard sets to generate an exam from. Please create some flashcard sets first.')
          return
        }
        setFlashcardSets(sets)
        setPhase('generator')
      } catch (err) {
        console.error('Failed to load flashcard sets for exam:', err)
        setError('Could not load flashcard set data, please try again later.')
      }
    }

    loadSets()
  }, [isOpen])

  const handleExamGenerated = (generatedExam: GeneratedExam) => {
    if (!generatedExam || !generatedExam.questions || generatedExam.questions.length === 0) {
      console.error('Exam generation resulted in an empty question set.', { generatedExam });
      setError('The AI failed to generate any questions. Please try adjusting the exam configuration or try again later.');
      setPhase('loading'); // Use the loading phase to display the modal error
      return;
    }
    
    // Ensure all questions have unique IDs
    const questionsWithIds = generatedExam.questions.map((q, index) => ({
      ...q,
      id: q.id || `gen_qid_${index}_${Date.now()}`
    }));
    
    const examWithEnsuredIds = {
      ...generatedExam,
      questions: questionsWithIds
    };

    setExam(examWithEnsuredIds);
    setPhase('runner')
  }

  const handleSessionComplete = async (completedSession: ExamSession) => {
    if (!exam || !exam.questions || exam.questions.length === 0) {
      console.error('Scoring failed: Exam data is incomplete or missing.', { exam });
      setError('Cannot score: Exam data is incomplete, please try generating the exam again.');
      setPhase('loading'); // Show error in modal
      return;
    }

    setSession(completedSession)
    setPhase('loading')
    try {
      const scoredResult = await examAI.scoreExam(exam, completedSession.responses)
      setResult(scoredResult)
      setPhase('analytics')
    } catch (err) {
      console.error('Score exam failed:', err)
      setError('Exam scoring failed, please check your network connection or try again later.')
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
        flashcardSets={flashcardSets}
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
                <p className={styles.errorMessageHeader}>An error occurred</p>
                <p className={styles.errorMessageText}>{error}</p>
                <button onClick={onClose} className={styles.closeButtonAction}>
                  Close
                </button>
              </>
            ) : (
              <>
                <div className={styles.spinner} />
                <p className={styles.loadingMessage}>Preparing exam environment...</p>
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
            result={result}
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