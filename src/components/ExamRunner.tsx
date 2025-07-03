/**
 * Exam Runner Component
 * Provides a complete exam experience, including a timer, question interface, progress tracking, etc.
 */

import { AnimatePresence, motion } from 'framer-motion'
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Flag,
    Home,
    PauseCircle,
    PlayCircle,
    Send
} from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { GeneratedExam } from '../services/examAI'
import { ExamResponse, ExamSession } from '../types/examTypes'
import styles from './ExamRunner.module.css'
import QuestionRenderer from './QuestionRenderer'

interface ExamRunnerProps {
  exam: GeneratedExam
  onComplete: (session: ExamSession) => void
  onExit: () => void
  className?: string
}

interface TimerState {
  timeRemaining: number // seconds
  isRunning: boolean
  totalTime: number
}

const ExamRunner: React.FC<ExamRunnerProps> = ({
  exam,
  onComplete,
  onExit,
  className = ''
}) => {
  const [session, setSession] = useState<ExamSession>(() => ({
    id: `session_${Date.now()}`,
    user_id: 'current_user', // TODO: get from context
    exam_id: exam.id,
    status: 'in_progress',
    start_time: new Date(),
    current_question_index: 0,
    responses: [],
    time_remaining: exam.config.duration * 60, // convert to seconds
    created_at: new Date()
  }))

  const [timer, setTimer] = useState<TimerState>({
    timeRemaining: exam.config.duration * 60,
    isRunning: true,
    totalTime: exam.config.duration * 60
  })

  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())

  const timerRef = useRef<NodeJS.Timeout>()
  const responseStartTime = useRef<number | null>(null)
  
  useEffect(() => {
    if (isCompleting) {
      const completedSession: ExamSession = {
        ...session,
        status: 'completed',
        end_time: new Date()
      };
      onComplete(completedSession);
    }
  }, [isCompleting, session, onComplete]);

  const handleSubmitExam = useCallback(async () => {
    setIsSubmitting(true);
    setIsCompleting(true);
  }, []);

  // Primary defense against invalid exam data
  if (!exam || !exam.questions || exam.questions.length === 0) {
    return (
      <div className={styles.confirmOverlay}>
          <div className={styles.confirmModal}>
              <h3>Exam Load Failed</h3>
              <p>Failed to load valid exam questions. Please go back and try to generate the exam again.</p>
              <div className={styles.confirmActions}>
                  <button onClick={onExit} style={{ flex: '1' }}>Back</button>
              </div>
          </div>
      </div>
    );
  }

  // Safely get the current question
  const currentQuestion = exam.questions[session.current_question_index]

  // Timer management
  useEffect(() => {
    if (timer.isRunning && timer.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimer((prev: TimerState) => {
          const newTimeRemaining = prev.timeRemaining - 1
          
          setSession((s: ExamSession) => ({
            ...s,
            time_remaining: newTimeRemaining
          }))

          if (newTimeRemaining <= 0) {
            handleSubmitExam()
            return { ...prev, timeRemaining: 0, isRunning: false }
          }

          return { ...prev, timeRemaining: newTimeRemaining }
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [timer.isRunning, handleSubmitExam])

  const toggleTimer = useCallback(() => {
    setTimer(prev => ({ ...prev, isRunning: !prev.isRunning }))
  }, [])

  const formatTime = useCallback((seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) {
      return '0:00'
    }
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])
  
  const formatTimeWithUnits = useCallback((seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) {
      return 'Unknown'
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0 && secs > 0) return `${mins}m ${secs}s`;
    if (mins > 0) return `${mins} mins`;
    return `${secs} secs`;
  }, []);

  const handleAnswerSubmit = useCallback(
    (questionId: string, student_answer: string | string[], confidence_level?: number) => {
      // Start timer if not running
      if (!timer.isRunning) {
        setTimer((prev) => ({ ...prev, isRunning: true }))
      }
      
      responseStartTime.current = Date.now()

      setSession((prevSession) => {
        const questionExists = exam.questions.some(q => q.id === questionId)
        if (!questionExists) {
          return prevSession
        }

        const newResponses = [...prevSession.responses]
        const existingResponseIndex = newResponses.findIndex(
          (r) => r.question_id === questionId
        )

        const newResponse: ExamResponse = {
          question_id: questionId,
          student_answer,
          response_time: Date.now() - (responseStartTime.current || Date.now()),
          confidence_level: confidence_level || 3,
          timestamp: new Date(),
        }

        if (existingResponseIndex > -1) {
          newResponses[existingResponseIndex] = newResponse
        } else {
          newResponses.push(newResponse)
        }
        
        const updatedSession = {
          ...prevSession,
          responses: newResponses,
        }
        return updatedSession;
      })
    },
    [exam.questions, timer.isRunning]
  )

  const navigateToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < exam.questions.length) {
      setSession((prev: ExamSession) => ({ ...prev, current_question_index: index }))
      setQuestionStartTime(Date.now())
    }
  }, [exam.questions.length])

  const handleNextQuestion = useCallback(() => {
    if (session.current_question_index < exam.questions.length - 1) {
      navigateToQuestion(session.current_question_index + 1)
    }
  }, [session.current_question_index, exam.questions.length, navigateToQuestion])

  const handlePreviousQuestion = useCallback(() => {
    if (session.current_question_index > 0) {
      navigateToQuestion(session.current_question_index - 1)
    }
  }, [session.current_question_index, navigateToQuestion])

  const toggleFlag = useCallback((questionId: string) => {
    setFlaggedQuestions((prev: Set<string>) => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }, [])

  useEffect(() => {
    setQuestionStartTime(Date.now())
  }, [session.current_question_index])

  const answeredCount = new Set(session.responses.map((r) => r.question_id))
  const progressPercentage = (answeredCount.size / exam.questions.length) * 100

  const getCurrentAnswer = useCallback(() => {
    if (!currentQuestion) return undefined;
    const response = session.responses.find((r: ExamResponse) => r.question_id === currentQuestion.id)
    return response ? response.student_answer : undefined
  }, [session.responses, currentQuestion])

  return (
    <div className={`${styles.examRunner} ${className}`}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.examTitle}>{exam.config.title}</h1>
          <p className={styles.examSubtitle}>Intelligently generated by AI</p>
        </div>

        <div className={styles.sidebarSection}>
            <div className={styles.timer}>
                <Clock size={18} />
                <span>{formatTime(timer.timeRemaining)}</span>
                <button onClick={toggleTimer} className={styles.timerControl}>
                    {timer.isRunning ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
                </button>
            </div>
             <div className={styles.progressBar}>
                <motion.div 
                    className={styles.progressFill}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>
            <div className={styles.progressText}>
                <span>Progress: {answeredCount.size} / {exam.questions.length}</span>
            </div>
        </div>
        
        <div className={styles.sidebarSection}>
          <h2 className={styles.navHeader}>Question Navigation</h2>
          <div className={styles.questionGrid}>
            {exam.questions.map((q, index) => {
              const isAnswered = session.responses.some(r => r.question_id === q.id);
              const isCurrent = session.current_question_index === index;
              const isFlagged = flaggedQuestions.has(q.id);

              return (
                <button 
                  key={q.id || `question-nav-${index}`}
                  onClick={() => navigateToQuestion(index)}
                  className={`${styles.questionNavItem} ${
                    isCurrent ? styles.current : ''
                  } ${
                    isAnswered ? styles.answered : ''
                  }`}
                >
                  {isFlagged && <Flag size={10} className={styles.flagIcon} />}
                  {index + 1}
                </button>
              )
            })}
          </div>
        </div>

        <div className={styles.sidebarFooter}>
            <button onClick={() => setShowExitConfirm(true)} className={styles.exitButton}>
                <Home size={16} />
                <span>Exit Exam</span>
            </button>
            <button onClick={handleSubmitExam} className={styles.submitButton} disabled={isSubmitting}>
                <Send size={16}/>
                <span>{isSubmitting ? 'Submitting...' : 'Submit Exam'}</span>
            </button>
        </div>
      </div>
      
      <div className={styles.mainContent}>
        <AnimatePresence mode="wait">
            <motion.div
                key={currentQuestion.id}
                className={styles.questionContainer}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
            >
                <div className={styles.questionHeader}>
                    <div className={styles.questionMeta}>
                        <span>{currentQuestion.points} Points</span> • 
                        <span>Difficulty: {currentQuestion.difficulty}/10</span> •
                        <span>{currentQuestion.topic}</span>
                    </div>
                    <button 
                      onClick={() => toggleFlag(currentQuestion.id)}
                      className={`${styles.flagButton} ${flaggedQuestions.has(currentQuestion.id) ? styles.flagged : ''}`}
                    >
                      <Flag size={16} />
                      <span>{flaggedQuestions.has(currentQuestion.id) ? 'Flagged' : 'Flag Question'}</span>
                    </button>
                </div>

                <QuestionRenderer
                  question={currentQuestion}
                  onAnswerChange={handleAnswerSubmit}
                  answer={getCurrentAnswer()}
                  className={styles.questionRenderer}
                />
                
                <div className={styles.navigationButtons}>
                    <button onClick={handlePreviousQuestion} disabled={session.current_question_index === 0}>
                        <ChevronLeft />
                        Previous
                    </button>
                    <button onClick={handleNextQuestion} disabled={session.current_question_index === exam.questions.length - 1}>
                        Next
                        <ChevronRight />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showExitConfirm && (
            <motion.div 
                className={styles.confirmOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div 
                    className={styles.confirmModal}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                >
                    <h3>Confirm Exit?</h3>
                    <p>Your progress will be lost. Are you sure you want to exit the exam?</p>
                    <div className={styles.confirmActions}>
                        <button onClick={() => setShowExitConfirm(false)}>Continue Exam</button>
                        <button onClick={onExit} className={styles.confirmExit}>Exit Anyway</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ExamRunner 