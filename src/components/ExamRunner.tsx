/**
 * 考试执行界面组件
 * 提供完整的考试体验，包括计时器、答题界面、进度跟踪等
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
  timeRemaining: number // 秒
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
    user_id: 'current_user', // TODO: 从context获取
    exam_id: exam.id,
    status: 'in_progress',
    start_time: new Date(),
    current_question_index: 0,
    responses: [],
    time_remaining: exam.config.duration * 60, // 转换为秒
    created_at: new Date()
  }))

  const [timer, setTimer] = useState<TimerState>({
    timeRemaining: exam.config.duration * 60,
    isRunning: true,
    totalTime: exam.config.duration * 60
  })

  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())

  const timerRef = useRef<NodeJS.Timeout>()
  
  const handleSubmitExam = useCallback(async () => {
    setIsSubmitting(true)
    
    try {
      const completedSession: ExamSession = {
        ...session,
        status: 'completed',
        end_time: new Date()
      }
      onComplete(completedSession)
    } catch (error) {
      console.error('❌ 考试提交失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [session, onComplete])

  // Primary defense against invalid exam data
  if (!exam || !exam.questions || exam.questions.length === 0) {
    return (
      <div className={styles.confirmOverlay}>
          <div className={styles.confirmModal}>
              <h3>考试加载失败</h3>
              <p>未能加载有效的考试题目。请返回并尝试重新生成考试。</p>
              <div className={styles.confirmActions}>
                  <button onClick={onExit} style={{ flex: '1' }}>返回</button>
              </div>
          </div>
      </div>
    );
  }

  // 安全获取当前题目
  const currentQuestion = exam.questions[session.current_question_index]

  // 计时器管理
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
      return '未知'
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0 && secs > 0) return `${mins}分${secs}秒`;
    if (mins > 0) return `${mins}分钟`;
    return `${secs}秒`;
  }, []);

  const handleAnswerSubmit = useCallback((answer: string | string[], confidence?: number) => {
    if (!currentQuestion) return;

    const now = Date.now()
    const responseTime = now - questionStartTime

    const newResponse: ExamResponse = {
      question_id: currentQuestion.id,
      student_answer: answer,
      response_time: responseTime,
      confidence_level: confidence,
      flagged_for_review: flaggedQuestions.has(currentQuestion.id),
      timestamp: new Date()
    }

    setSession((prev: ExamSession) => {
      const existingResponseIndex = prev.responses.findIndex((r: ExamResponse) => r.question_id === currentQuestion.id)
      const updatedResponses = existingResponseIndex >= 0
        ? prev.responses.map((r: ExamResponse, i: number) => i === existingResponseIndex ? newResponse : r)
        : [...prev.responses, newResponse]

      return {
        ...prev,
        responses: updatedResponses
      }
    })
  }, [currentQuestion, questionStartTime, flaggedQuestions])

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

  const answeredCount = session.responses.length
  const progressPercentage = (answeredCount / exam.questions.length) * 100

  const getCurrentAnswer = useCallback(() => {
    if (!currentQuestion) return undefined;
    const response = session.responses.find((r: ExamResponse) => r.question_id === currentQuestion.id)
    return response ? response.student_answer : undefined
  }, [session.responses, currentQuestion])

  return (
    <div className={styles.examRunner}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.examTitle}>{exam.config.title}</h1>
          <p className={styles.examSubtitle}>由 AI 智能生成</p>
        </div>

        <div className={styles.sidebarSection}>
            <div className={styles.timer}>
                <Clock size={20} />
                <span>{formatTime(timer.timeRemaining)}</span>
                <button onClick={toggleTimer} className={styles.timerControl}>
                    {timer.isRunning ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
                </button>
            </div>
             <div className={styles.progressBar}>
                <div 
                    className={styles.progressFill}
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>
            <div className={styles.progressText}>
                <span>进度: {answeredCount} / {exam.questions.length}</span>
            </div>
        </div>

        <div className={styles.sidebarSection}>
            <h3 className={styles.sectionTitle}>题目导航</h3>
            <div className={styles.questionGrid}>
                {exam.questions.map((q, index) => {
                    const isAnswered = session.responses.some(r => r.question_id === q.id);
                    const isCurrent = index === session.current_question_index;
                    const isFlagged = flaggedQuestions.has(q.id);
                    
                    return (
                        <button
                            key={q?.id || index}
                            onClick={() => navigateToQuestion(index)}
                            className={`${styles.questionGridItem} ${isCurrent ? styles.current : ''} ${isAnswered ? styles.answered : ''}`}
                        >
                            {isFlagged && <Flag size={10} className={styles.flagIcon} />}
                            {index + 1}
                        </button>
                    )
                })}
            </div>
        </div>

        <div className={styles.sidebarFooter}>
            <button className={styles.exitButton} onClick={() => setShowExitConfirm(true)}>
                <Home size={16} />
                <span>返回主页</span>
            </button>
             <button className={styles.submitButton} onClick={handleSubmitExam}>
                <Send size={16} />
                <span>提交试卷</span>
            </button>
        </div>
      </div>

      <div className={styles.mainContent}>
        <AnimatePresence mode="wait">
          {currentQuestion ? (
            <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={styles.questionContainer}
            >
                <div className={styles.questionHeader}>
                    <div className={styles.questionMeta}>
                        {/* ABSOLUTELY ROBUST RENDERING */}
                        <span>{currentQuestion.type?.replace('_', ' ') ?? '未知题型'}</span>
                        <span>&bull;</span>
                        <span>{currentQuestion.points ?? '?'} 分</span>
                        <span>&bull;</span>
                        <span>难度: {currentQuestion.difficulty ?? '?'}/10</span>
                        <span>&bull;</span>
                        <span>预计: {formatTimeWithUnits(currentQuestion.estimated_time)}</span>
                    </div>
                    <button onClick={() => toggleFlag(currentQuestion.id)} className={`${styles.flagButton} ${flaggedQuestions.has(currentQuestion.id) ? styles.flagged : ''}`}>
                        <Flag size={18} />
                        <span>{flaggedQuestions.has(currentQuestion.id) ? '已标记' : '标记题目'}</span>
                    </button>
                </div>

                <QuestionRenderer
                    question={currentQuestion}
                    onAnswerChange={handleAnswerSubmit}
                    answer={getCurrentAnswer()}
                />

                {currentQuestion.hint && (
                    <div className={styles.hintBox}>
                        <strong>💡 提示:</strong>
                        <p>{currentQuestion.hint.replace(/hint:/i, '').trim()}</p>
                    </div>
                )}

                <div className={styles.questionFooter}>
                     <div className={styles.confidenceSlider}>
                        <label>答题置信度</label>
                        <input type="range" min="1" max="5" defaultValue="3" />
                    </div>
                    <div className={styles.navigationButtons}>
                        <button onClick={handlePreviousQuestion} disabled={session.current_question_index === 0}>
                            <ChevronLeft size={20}/>
                            上一题
                        </button>
                        <button onClick={handleNextQuestion} disabled={session.current_question_index === exam.questions.length - 1}>
                            下一题
                            <ChevronRight size={20}/>
                        </button>
                    </div>
                </div>
            </motion.div>
          ) : (
            <div className={styles.confirmOverlay}>
              <div className={styles.confirmModal}>
                  <h3>加载题目失败</h3>
                  <p>无法加载当前题目。可能是考试数据有误或已全部完成。</p>
                  <div className={styles.confirmActions}>
                    <button onClick={onExit} style={{ flex: '1' }}>返回</button>
                  </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {showExitConfirm && (
         <div className={styles.confirmOverlay}>
            <div className={styles.confirmModal}>
                <h3>确认退出</h3>
                <p>退出后，本次考试进度将不会被保存。您确定要退出吗？</p>
                <div className={styles.confirmActions}>
                    <button onClick={() => setShowExitConfirm(false)}>继续答题</button>
                    <button onClick={onExit}>毅然退出</button>
                </div>
            </div>
         </div>
      )}
    </div>
  )
}

export default ExamRunner 