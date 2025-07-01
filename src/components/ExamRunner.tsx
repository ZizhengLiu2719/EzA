/**
 * 考试执行界面组件
 * 提供完整的考试体验，包括计时器、答题界面、进度跟踪等
 */

import { AnimatePresence, motion } from 'framer-motion'
import {
    AlertTriangle,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    Eye,
    EyeOff,
    Flag,
    PauseCircle,
    PlayCircle
} from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { GeneratedExam } from '../services/examAI'
import { ExamResponse, ExamSession } from '../types'
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
  const [session, setSession] = useState<ExamSession>({
    id: `session_${Date.now()}`,
    user_id: 'current_user', // TODO: 从context获取
    exam_id: exam.id,
    status: 'in_progress',
    start_time: new Date(),
    current_question_index: 0,
    responses: [],
    time_remaining: exam.config.duration * 60, // 转换为秒
    created_at: new Date()
  })

  const [timer, setTimer] = useState<TimerState>({
    timeRemaining: exam.config.duration * 60,
    isRunning: true,
    totalTime: exam.config.duration * 60
  })

  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [showReviewPanel, setShowReviewPanel] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())

  const timerRef = useRef<NodeJS.Timeout>()
  const currentQuestion = exam.questions[session.current_question_index]

  // 计时器管理
  useEffect(() => {
    if (timer.isRunning && timer.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          const newTimeRemaining = prev.timeRemaining - 1
          
          // 更新session
          setSession(s => ({
            ...s,
            time_remaining: newTimeRemaining
          }))

          if (newTimeRemaining <= 0) {
            // 时间到，自动提交
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
  }, [timer.isRunning])

  // 暂停/恢复计时器
  const toggleTimer = useCallback(() => {
    setTimer(prev => ({ ...prev, isRunning: !prev.isRunning }))
  }, [])

  // 格式化时间显示
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }, [])

  // 获取时间颜色
  const getTimeColor = useCallback((timeRemaining: number, totalTime: number): string => {
    const ratio = timeRemaining / totalTime
    if (ratio > 0.5) return 'text-green-600'
    if (ratio > 0.25) return 'text-yellow-600'
    return 'text-red-600'
  }, [])

  // 记录答案
  const handleAnswerSubmit = useCallback((answer: string | string[], confidence?: number) => {
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

    setSession(prev => {
      const existingResponseIndex = prev.responses.findIndex(r => r.question_id === currentQuestion.id)
      const updatedResponses = existingResponseIndex >= 0
        ? prev.responses.map((r, i) => i === existingResponseIndex ? newResponse : r)
        : [...prev.responses, newResponse]

      return {
        ...prev,
        responses: updatedResponses
      }
    })

    console.log('📝 答案已记录:', {
      question: currentQuestion.question.substring(0, 50),
      answer: Array.isArray(answer) ? answer.join(', ') : answer,
      responseTime: (responseTime / 1000).toFixed(1) + 's'
    })
  }, [currentQuestion, questionStartTime, flaggedQuestions])

  // 导航到指定题目
  const navigateToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < exam.questions.length) {
      setSession(prev => ({ ...prev, current_question_index: index }))
      setQuestionStartTime(Date.now())
      setShowReviewPanel(false)
    }
  }, [exam.questions.length])

  // 下一题
  const handleNextQuestion = useCallback(() => {
    if (session.current_question_index < exam.questions.length - 1) {
      navigateToQuestion(session.current_question_index + 1)
    }
  }, [session.current_question_index, exam.questions.length, navigateToQuestion])

  // 上一题
  const handlePreviousQuestion = useCallback(() => {
    if (session.current_question_index > 0) {
      navigateToQuestion(session.current_question_index - 1)
    }
  }, [session.current_question_index, navigateToQuestion])

  // 标记题目
  const toggleFlag = useCallback((questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }, [])

  // 提交考试
  const handleSubmitExam = useCallback(async () => {
    setIsSubmitting(true)
    
    try {
      const completedSession: ExamSession = {
        ...session,
        status: 'completed',
        end_time: new Date()
      }

      console.log('🎯 考试提交:', {
        totalQuestions: exam.questions.length,
        answeredQuestions: session.responses.length,
        timeUsed: formatTime(timer.totalTime - timer.timeRemaining)
      })

      onComplete(completedSession)
    } catch (error) {
      console.error('❌ 考试提交失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [session, onComplete, exam.questions.length, timer, formatTime])

  // 获取已答题目数量
  const answeredCount = session.responses.length
  const progressPercentage = (answeredCount / exam.questions.length) * 100

  // 获取当前题目的答案
  const getCurrentAnswer = useCallback(() => {
    const response = session.responses.find(r => r.question_id === currentQuestion.id)
    return response?.student_answer
  }, [session.responses, currentQuestion.id])

  // 初始化题目开始时间
  useEffect(() => {
    setQuestionStartTime(Date.now())
  }, [session.current_question_index])

  return (
    <div className={`exam-runner min-h-screen bg-gray-50 ${className}`}>
      {/* 头部工具栏 */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* 左侧：考试信息 */}
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-gray-800">{exam.config.title}</h1>
              <span className="text-sm text-gray-500">
                题目 {session.current_question_index + 1} / {exam.questions.length}
              </span>
            </div>

            {/* 中间：进度条 */}
            <div className="flex-1 max-w-md mx-8">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">进度</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-blue-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {answeredCount}/{exam.questions.length}
                </span>
              </div>
            </div>

            {/* 右侧：计时器和控制 */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className={`font-mono text-sm ${getTimeColor(timer.timeRemaining, timer.totalTime)}`}>
                  {formatTime(timer.timeRemaining)}
                </span>
                <button
                  onClick={toggleTimer}
                  className="p-1 hover:bg-gray-100 rounded"
                  title={timer.isRunning ? '暂停' : '继续'}
                >
                  {timer.isRunning ? (
                    <PauseCircle className="w-4 h-4 text-gray-600" />
                  ) : (
                    <PlayCircle className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>

              <button
                onClick={() => setShowReviewPanel(!showReviewPanel)}
                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {showReviewPanel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showReviewPanel ? '隐藏' : '概览'}
              </button>

              <button
                onClick={() => setShowExitConfirm(true)}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50"
              >
                退出考试
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 flex gap-6">
        {/* 主要答题区域 */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm p-6">
            {/* 题目标题栏 */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 font-semibold rounded-lg">
                  {session.current_question_index + 1}
                </span>
                <div>
                  <span className="text-sm text-gray-500">
                    {currentQuestion.type.replace('_', ' ')} • {currentQuestion.points}分
                  </span>
                  <div className="text-xs text-gray-400">
                    难度: {currentQuestion.difficulty}/10 • 
                    预计: {Math.floor(currentQuestion.estimated_time / 60)}分{currentQuestion.estimated_time % 60}秒
                  </div>
                </div>
              </div>

              <button
                onClick={() => toggleFlag(currentQuestion.id)}
                className={`p-2 rounded-lg transition-colors ${
                  flaggedQuestions.has(currentQuestion.id)
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                }`}
                title="标记此题"
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>

            {/* 题目渲染器 */}
            <QuestionRenderer
              question={currentQuestion}
              answer={getCurrentAnswer()}
              onAnswerChange={handleAnswerSubmit}
              showHint={false}
              disabled={false}
            />
          </div>

          {/* 导航按钮 */}
          <div className="flex justify-between mt-6">
            <button
              onClick={handlePreviousQuestion}
              disabled={session.current_question_index === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:text-gray-800"
            >
              <ChevronLeft className="w-4 h-4" />
              上一题
            </button>

            <div className="flex gap-3">
              {session.current_question_index === exam.questions.length - 1 ? (
                <button
                  onClick={handleSubmitExam}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isSubmitting ? '提交中...' : '提交考试'}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                >
                  下一题
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 侧边栏：题目概览 */}
        <AnimatePresence>
          {showReviewPanel && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-72 bg-white rounded-xl shadow-sm p-4"
            >
              <h3 className="font-semibold text-gray-800 mb-4">题目概览</h3>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {exam.questions.map((question, index) => {
                  const isAnswered = session.responses.some(r => r.question_id === question.id)
                  const isFlagged = flaggedQuestions.has(question.id)
                  const isCurrent = index === session.current_question_index

                  return (
                    <button
                      key={question.id}
                      onClick={() => navigateToQuestion(index)}
                      className={`w-full p-2 rounded-lg text-left transition-colors ${
                        isCurrent
                          ? 'bg-blue-100 border border-blue-300'
                          : 'hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          题目 {index + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          {isFlagged && <Flag className="w-3 h-3 text-orange-500" />}
                          {isAnswered ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <div className="w-3 h-3 border border-gray-300 rounded-full" />
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {question.type} • {question.points}分
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* 统计信息 */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-semibold text-green-700">{answeredCount}</div>
                    <div className="text-green-600">已答</div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <div className="font-semibold text-orange-700">{flaggedQuestions.size}</div>
                    <div className="text-orange-600">标记</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 退出确认对话框 */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md mx-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
                <h3 className="text-lg font-semibold text-gray-800">确认退出考试</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                您确定要退出考试吗？当前的答题进度将会丢失，无法恢复。
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  继续考试
                </button>
                <button
                  onClick={onExit}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg"
                >
                  确认退出
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ExamRunner
