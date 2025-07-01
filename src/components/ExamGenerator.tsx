/**
 * 智能考试生成器组件
 * 基于flashcard集合和学习目标生成个性化考试
 */

import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Brain, CheckCircle, Clock, Settings, Target, Zap } from 'lucide-react'
import React, { useCallback, useState } from 'react'
import { examAI, GeneratedExam } from '../services/examAI'
import { ExamConfiguration, ExamQuestion } from '../types'
import { FSRSCard } from '../types/SRSTypes'

interface ExamGeneratorProps {
  cards: FSRSCard[]
  onExamGenerated: (exam: GeneratedExam) => void
  onCancel: () => void
  className?: string
}

interface ExamSettings {
  title: string
  subject: string
  duration: number // 分钟
  total_points: number
  question_types: {
    multiple_choice: number
    true_false: number
    short_answer: number
    essay: number
    fill_blank: number
  }
  difficulty_focus: 'easy' | 'medium' | 'hard' | 'mixed'
  cognitive_focus: 'remember' | 'understand' | 'apply' | 'analyze' | 'mixed'
  learning_objectives: string[]
}

const ExamGenerator: React.FC<ExamGeneratorProps> = ({
  cards,
  onExamGenerated,
  onCancel,
  className = ''
}) => {
  const [step, setStep] = useState<'settings' | 'generating' | 'preview' | 'error'>('settings')
  const [settings, setSettings] = useState<ExamSettings>({
    title: '复习测试',
    subject: '通用',
    duration: 30,
    total_points: 100,
    question_types: {
      multiple_choice: 5,
      true_false: 3,
      short_answer: 2,
      essay: 0,
      fill_blank: 0
    },
    difficulty_focus: 'mixed',
    cognitive_focus: 'mixed',
    learning_objectives: ['测试知识掌握度', '巩固学习成果']
  })
  const [generatedExam, setGeneratedExam] = useState<GeneratedExam | null>(null)
  const [error, setError] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)

  // 计算总题数
  const totalQuestions = Object.values(settings.question_types).reduce((sum, count) => sum + count, 0)

  // 生成考试配置
  const createExamConfig = useCallback((): ExamConfiguration => {
    const questionDistribution = Object.entries(settings.question_types)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({
        type: type as ExamQuestion['type'],
        count,
        points_per_question: Math.floor(settings.total_points / totalQuestions)
      }))

    const difficultyDistribution = settings.difficulty_focus === 'mixed'
      ? [
          { difficulty_range: [1, 4] as [number, number], percentage: 30 },
          { difficulty_range: [4, 7] as [number, number], percentage: 50 },
          { difficulty_range: [7, 10] as [number, number], percentage: 20 }
        ]
      : [{ 
          difficulty_range: settings.difficulty_focus === 'easy' ? [1, 4] : 
                          settings.difficulty_focus === 'medium' ? [4, 7] : [7, 10] as [number, number],
          percentage: 100 
        }]

    const cognitiveDistribution = settings.cognitive_focus === 'mixed'
      ? [
          { level: 'remember' as const, percentage: 25 },
          { level: 'understand' as const, percentage: 30 },
          { level: 'apply' as const, percentage: 25 },
          { level: 'analyze' as const, percentage: 20 }
        ]
      : [{ level: settings.cognitive_focus as any, percentage: 100 }]

    return {
      title: settings.title,
      subject: settings.subject,
      topics: Array.from(new Set(cards.map(card => card.tags || []).flat())).filter(Boolean),
      duration: settings.duration,
      total_points: settings.total_points,
      question_distribution: questionDistribution,
      difficulty_distribution: difficultyDistribution,
      cognitive_distribution: cognitiveDistribution,
      learning_objectives: settings.learning_objectives
    }
  }, [settings, cards, totalQuestions])

  // 生成考试
  const handleGenerateExam = useCallback(async () => {
    if (cards.length === 0) {
      setError('需要至少一张闪卡才能生成考试')
      setStep('error')
      return
    }

    if (totalQuestions === 0) {
      setError('请至少选择一种题型')
      setStep('error')
      return
    }

    setIsGenerating(true)
    setStep('generating')
    setError('')

    try {
      const examConfig = createExamConfig()
      const exam = await examAI.generateExamFromCards(cards, examConfig)
      
      setGeneratedExam(exam)
      setStep('preview')
      console.log('✅ 考试生成成功:', exam.metadata.total_questions, '道题')
    } catch (err) {
      console.error('❌ 考试生成失败:', err)
      setError(err instanceof Error ? err.message : '考试生成失败，请稍后重试')
      setStep('error')
    } finally {
      setIsGenerating(false)
    }
  }, [cards, totalQuestions, createExamConfig])

  // 确认生成的考试
  const handleConfirmExam = useCallback(() => {
    if (generatedExam) {
      onExamGenerated(generatedExam)
    }
  }, [generatedExam, onExamGenerated])

  // 更新设置
  const updateSettings = useCallback((updates: Partial<ExamSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }, [])

  // 更新题型数量
  const updateQuestionType = useCallback((type: keyof ExamSettings['question_types'], count: number) => {
    setSettings(prev => ({
      ...prev,
      question_types: {
        ...prev.question_types,
        [type]: Math.max(0, count)
      }
    }))
  }, [])

  // 添加学习目标
  const addLearningObjective = useCallback((objective: string) => {
    if (objective.trim() && !settings.learning_objectives.includes(objective.trim())) {
      updateSettings({
        learning_objectives: [...settings.learning_objectives, objective.trim()]
      })
    }
  }, [settings.learning_objectives, updateSettings])

  // 移除学习目标
  const removeLearningObjective = useCallback((index: number) => {
    updateSettings({
      learning_objectives: settings.learning_objectives.filter((_, i) => i !== index)
    })
  }, [settings.learning_objectives, updateSettings])

  return (
    <div className={`exam-generator ${className}`}>
      <AnimatePresence mode="wait">
        {/* 设置阶段 */}
        {step === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">智能考试生成器</h2>
              <span className="ml-auto text-sm text-gray-500">基于 {cards.length} 张闪卡</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 基本设置 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  基本设置
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">考试标题</label>
                  <input
                    type="text"
                    value={settings.title}
                    onChange={(e) => updateSettings({ title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入考试标题"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">学科</label>
                  <input
                    type="text"
                    value={settings.subject}
                    onChange={(e) => updateSettings({ subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入学科名称"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      <Clock className="w-4 h-4 inline mr-1" />
                      时长 (分钟)
                    </label>
                    <input
                      type="number"
                      value={settings.duration}
                      onChange={(e) => updateSettings({ duration: parseInt(e.target.value) || 30 })}
                      min="5"
                      max="180"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">总分</label>
                    <input
                      type="number"
                      value={settings.total_points}
                      onChange={(e) => updateSettings({ total_points: parseInt(e.target.value) || 100 })}
                      min="10"
                      max="500"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">难度重点</label>
                    <select
                      value={settings.difficulty_focus}
                      onChange={(e) => updateSettings({ difficulty_focus: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="easy">简单为主</option>
                      <option value="medium">中等为主</option>
                      <option value="hard">困难为主</option>
                      <option value="mixed">混合难度</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">认知层次</label>
                    <select
                      value={settings.cognitive_focus}
                      onChange={(e) => updateSettings({ cognitive_focus: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="remember">记忆</option>
                      <option value="understand">理解</option>
                      <option value="apply">应用</option>
                      <option value="analyze">分析</option>
                      <option value="mixed">混合层次</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 题型设置 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  题型配置 (共 {totalQuestions} 题)
                </h3>

                <div className="space-y-3">
                  {Object.entries(settings.question_types).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">
                        {type.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuestionType(type as any, count - 1)}
                          className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{count}</span>
                        <button
                          onClick={() => updateQuestionType(type as any, count + 1)}
                          className="w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 学习目标 */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">学习目标</label>
                  <div className="space-y-2">
                    {settings.learning_objectives.map((objective, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="flex-1 text-sm text-gray-700 px-2 py-1 bg-gray-50 rounded">
                          {objective}
                        </span>
                        <button
                          onClick={() => removeLearningObjective(index)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          移除
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="添加学习目标"
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addLearningObjective(e.currentTarget.value)
                            e.currentTarget.value = ''
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                取消
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleGenerateExam}
                  disabled={totalQuestions === 0 || cards.length === 0}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  生成考试
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 生成中 */}
        {step === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="w-8 h-8 text-blue-600" />
              </motion.div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">正在生成智能考试</h3>
            <p className="text-gray-600 mb-4">AI正在分析您的闪卡并生成个性化考试...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        )}

        {/* 预览阶段 */}
        {step === 'preview' && generatedExam && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">考试预览</h2>
              <span className="ml-auto text-sm text-green-600 font-medium">
                AI置信度: {(generatedExam.metadata.ai_confidence * 100).toFixed(0)}%
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">考试信息</h4>
                <div className="space-y-1 text-sm text-blue-700">
                  <p><strong>标题:</strong> {generatedExam.config.title}</p>
                  <p><strong>时长:</strong> {generatedExam.config.duration}分钟</p>
                  <p><strong>总分:</strong> {generatedExam.config.total_points}分</p>
                  <p><strong>题数:</strong> {generatedExam.metadata.total_questions}题</p>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">难度分析</h4>
                <div className="space-y-1 text-sm text-green-700">
                  <p><strong>平均难度:</strong> {generatedExam.metadata.difficulty_average.toFixed(1)}/10</p>
                  <p><strong>预计用时:</strong> {generatedExam.metadata.estimated_completion_time}分钟</p>
                  <p><strong>认知层次:</strong> 多元化</p>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2">题型分布</h4>
                <div className="space-y-1 text-sm text-purple-700">
                  {generatedExam.config.question_distribution.map((dist, index) => (
                    <p key={index}>
                      <strong>{dist.type}:</strong> {dist.count}题
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* 题目预览 */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3">题目预览 (前3题)</h4>
              <div className="space-y-3">
                {generatedExam.questions.slice(0, 3).map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-gray-800">
                        {index + 1}. {question.question}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {question.type} • {question.points}分
                      </span>
                    </div>
                    {question.options && (
                      <div className="ml-4 space-y-1 text-sm text-gray-600">
                        {question.options.map((option, optIndex) => (
                          <p key={optIndex}>○ {option}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {generatedExam.questions.length > 3 && (
                  <p className="text-center text-gray-500 text-sm">
                    ... 还有 {generatedExam.questions.length - 3} 道题目
                  </p>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-between pt-4 border-t border-gray-200">
              <button
                onClick={() => setStep('settings')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                返回修改
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmExam}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  开始考试
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 错误状态 */}
        {step === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">生成失败</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setStep('settings')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                返回设置
              </button>
              <button
                onClick={handleGenerateExam}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
              >
                重试
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ExamGenerator 