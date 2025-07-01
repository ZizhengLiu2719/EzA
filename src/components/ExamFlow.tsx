import { getAllUserFlashcards } from '@/api/flashcards'
import { examAI, GeneratedExam } from '@/services/examAI'
import { ExamSession, ExamResult as TypesExamResult } from '@/types'
import { FSRSCard } from '@/types/SRSTypes'
import React, { useEffect, useState } from 'react'
import ExamAnalytics from './ExamAnalytics'
import ExamGenerator from './ExamGenerator'
import ExamRunner from './ExamRunner'

interface ExamFlowProps {
  isOpen: boolean
  examType: any // 不直接依赖外部类型，保持灵活
  onClose: () => void
}

const ExamFlow: React.FC<ExamFlowProps> = ({ isOpen, examType: _examType, onClose }) => {
  const [phase, setPhase] = useState<'loading' | 'generator' | 'runner' | 'analytics'>('loading')
  const [cards, setCards] = useState<FSRSCard[]>([])
  const [exam, setExam] = useState<GeneratedExam | null>(null)
  const [session, setSession] = useState<ExamSession | null>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // 加载所有闪卡
  useEffect(() => {
    if (!isOpen) return

    const loadCards = async () => {
      try {
        setPhase('loading')
        const allCards = await getAllUserFlashcards()
        setCards(allCards)
        setPhase('generator')
      } catch (err) {
        console.error('Failed to load flashcards for exam:', err)
        setError('无法加载闪卡，请稍后重试')
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
      setError('考试评分失败')
    }
  }

  // 重新开始考试
  const handleRetake = () => {
    setExam(null)
    setSession(null)
    setResult(null)
    setPhase('generator')
  }

  // 关闭并重置
  const handleClose = () => {
    setExam(null)
    setSession(null)
    setResult(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      style={{ overscrollBehavior: 'contain' }}
    >
      <div className="w-full h-full overflow-auto bg-white">
        {/* 错误状态 */}
        {error && (
          <div className="flex flex-col items-center justify-center h-full p-10 text-center text-red-600">
            <p className="mb-4 text-xl font-semibold">{error}</p>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg"
            >
              关闭
            </button>
          </div>
        )}

        {/* 加载状态 */}
        {phase === 'loading' && !error && (
          <div className="flex flex-col items-center justify-center h-full p-10 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-6" />
            <p className="text-gray-700">加载中，请稍候...</p>
          </div>
        )}

        {/* 考试生成 */}
        {phase === 'generator' && !error && (
          <ExamGenerator
            cards={cards}
            onExamGenerated={handleExamGenerated}
            onCancel={handleClose}
          />
        )}

        {/* 考试进行 */}
        {phase === 'runner' && exam && !error && (
          <ExamRunner
            exam={exam}
            onComplete={handleSessionComplete}
            onExit={handleClose}
          />
        )}

        {/* 分析 */}
        {phase === 'analytics' && exam && session && result && !error && (
          <ExamAnalytics
            exam={exam}
            session={session}
            result={result as unknown as TypesExamResult}
            onRetake={handleRetake}
            onContinueStudy={handleClose}
          />
        )}
      </div>
    </div>
  )
}

export default ExamFlow 