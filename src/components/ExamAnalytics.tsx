/**
 * 考试成绩分析界面组件
 * 提供详细的考试结果分析、可视化图表和学习建议
 */

import { motion } from 'framer-motion'
import {
    Award,
    BarChart3,
    Brain,
    Calendar,
    CheckCircle,
    Clock,
    Lightbulb,
    Loader2,
    PieChart,
    Target,
    TrendingUp,
    XCircle
} from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { createSetFromMistakes } from '../api/flashcards'
import type { ExamQuestion, ExamResult, ExamSession, GeneratedExam } from '../types/examTypes'

interface ExamAnalyticsProps {
  exam: GeneratedExam
  session: ExamSession
  result: ExamResult
  onRetake?: () => void
  onContinueStudy?: () => void
  className?: string
}

interface PerformanceMetrics {
  accuracy: number
  speed: number // 题/分钟
  consistency: number // 答题时间一致性
  confidence: number // 平均置信度
  difficulty_performance: Record<string, number>
  topic_performance: Record<string, number>
  cognitive_performance: Record<string, number>
}

const ExamAnalytics: React.FC<ExamAnalyticsProps> = ({
  exam,
  session,
  result,
  onRetake,
  onContinueStudy,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'recommendations' | 'comparison'>('overview')
  const [showExplanations, setShowExplanations] = useState<string[]>([])
  const [isCreatingSet, setIsCreatingSet] = useState(false);
  const [creationStatus, setCreationStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle');

  // Destructure for easier access in JSX, now aligning with AI response
  const { analysis, grade_level, scored_questions, totalScore, percentage } = result;
  const { strengths, weaknesses, recommendations } = analysis;

  const handleCreateMistakeSet = async () => {
    setCreationStatus('loading');
    setIsCreatingSet(true);

    const incorrectQuestions = scored_questions
      .filter((score: { is_correct: boolean; }) => !score.is_correct)
      .map((score: { question_id: string; }) => exam.questions.find(q => q.id === score.question_id))
      .filter((q): q is ExamQuestion => q !== undefined);

    if (incorrectQuestions.length === 0) {
      setCreationStatus('success');
      setIsCreatingSet(false);
      return;
    }
    
    const setTitle = `错题集 - ${exam.config.title} (${new Date().toLocaleDateString()})`;

    try {
      await createSetFromMistakes(setTitle, incorrectQuestions);
      setCreationStatus('success');
    } catch (error) {
      console.error("Failed to create mistake set:", error);
      setCreationStatus('error');
    } finally {
      setIsCreatingSet(false);
    }
  };

  // 计算性能指标
  const metrics = useMemo((): PerformanceMetrics => {
    const totalQuestions = exam.questions.length
    const correctAnswers = scored_questions.filter((q: { is_correct: boolean; }) => q.is_correct).length
    const accuracy = (correctAnswers / totalQuestions) * 100

    const totalTime = session.end_time && session.start_time 
      ? (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000 / 60
      : exam.config.duration
    const speed = totalQuestions / totalTime

    // 计算答题时间一致性
    const responseTimes = session.responses.map(r => r.response_time)
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    const timeVariance = responseTimes.reduce((sum, time) => sum + Math.pow(time - avgResponseTime, 2), 0) / responseTimes.length
    const consistency = Math.max(0, 100 - (Math.sqrt(timeVariance) / avgResponseTime * 100))

    // 计算平均置信度
    const confidenceLevels = session.responses
      .map(r => r.confidence_level)
      .filter(c => c !== undefined) as number[]
    const confidence = confidenceLevels.length > 0 
      ? (confidenceLevels.reduce((sum, c) => sum + c, 0) / confidenceLevels.length) * 20
      : 60

    // 按难度分析
    const difficultyPerformance: Record<string, number> = {}
    const difficultyGroups = {
      'easy': exam.questions.filter(q => q.difficulty <= 3),
      'medium': exam.questions.filter(q => q.difficulty > 3 && q.difficulty <= 7),
      'hard': exam.questions.filter(q => q.difficulty > 7)
    }

    Object.entries(difficultyGroups).forEach(([level, questions]) => {
      if (questions.length > 0) {
        const correct = questions.filter(q => 
          scored_questions.find((r: { question_id: string; }) => r.question_id === q.id)?.is_correct
        ).length
        difficultyPerformance[level] = (correct / questions.length) * 100
      }
    })

    // 按主题分析
    const topicPerformance: Record<string, number> = {}
    const topics = Array.from(new Set(exam.questions.map(q => q.topic)))
    topics.forEach(topic => {
      const topicQuestions = exam.questions.filter(q => q.topic === topic)
      const correct = topicQuestions.filter(q => 
        scored_questions.find((r: { question_id: string; }) => r.question_id === q.id)?.is_correct
      ).length
      if (topicQuestions.length > 0) {
        topicPerformance[topic] = (correct / topicQuestions.length) * 100
      }
    })

    // 按认知层次分析
    const cognitivePerformance: Record<string, number> = {}
    const cognitiveLevels = Array.from(new Set(exam.questions.map(q => q.cognitive_level)))
    cognitiveLevels.forEach(level => {
      const levelQuestions = exam.questions.filter(q => q.cognitive_level === level)
      const correct = levelQuestions.filter(q => 
        scored_questions.find((r: { question_id: string; }) => r.question_id === q.id)?.is_correct
      ).length
      if (levelQuestions.length > 0) {
        cognitivePerformance[level] = (correct / levelQuestions.length) * 100
      }
    })

    return {
      accuracy,
      speed,
      consistency,
      confidence,
      difficulty_performance: difficultyPerformance,
      topic_performance: topicPerformance,
      cognitive_performance: cognitivePerformance
    }
  }, [exam, session, result])

  // 获取等级颜色
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100'
      case 'B': return 'text-blue-600 bg-blue-100'
      case 'C': return 'text-yellow-600 bg-yellow-100'
      case 'D': return 'text-orange-600 bg-orange-100'
      case 'F': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // 切换题目解释显示
  const toggleExplanation = (questionId: string) => {
    setShowExplanations(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    )
  }

  // 渲染性能雷达图数据
  const radarData = [
    { metric: '准确率', value: metrics.accuracy, max: 100 },
    { metric: '答题速度', value: Math.min(metrics.speed * 10, 100), max: 100 },
    { metric: '稳定性', value: metrics.consistency, max: 100 },
    { metric: '置信度', value: metrics.confidence, max: 100 }
  ]

  return (
    <div className={`exam-analytics bg-gray-50 min-h-screen ${className}`}>
      {/* 头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{exam.config.title} - 成绩分析</h1>
              <p className="text-gray-600 mt-1">
                完成时间: {new Date(session.end_time || Date.now()).toLocaleString()} • 
                用时: {Math.floor(analysis.time_analysis.total_time / 60)}分{Math.round(analysis.time_analysis.total_time) % 60}秒
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-xl font-bold text-2xl ${getGradeColor(grade_level || 'N/A')}`}>
                {grade_level || 'N/A'}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-800">
                  {(percentage || 0).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">
                  {totalScore || 0}/{exam.config.total_points}分
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: '总览', icon: BarChart3 },
              { id: 'detailed', label: '详细分析', icon: PieChart },
              { id: 'recommendations', label: '学习建议', icon: Lightbulb },
              { id: 'comparison', label: '对比分析', icon: TrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* 总览标签页 */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* AI Smart Diagnosis */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-bold text-gray-800">AI 智能诊断</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-green-600 mb-2">✅ 优势分析 (Strengths)</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {strengths.map((item, index) => (
                      <li key={`strength-${index}`}>{item}</li>
                    ))}
                    {strengths.length === 0 && <li>本次考试未发现明显的优势领域。</li>}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-red-600 mb-2">⚠️ 弱点与错误模式 (Weaknesses)</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {weaknesses.map((item, index) => (
                      <li key={`weakness-${index}`}>{item}</li>
                    ))}
                    {weaknesses.length === 0 && <li>恭喜！本次考试没有发现明显的弱点。</li>}
                  </ul>
                </div>
              </div>
              <div className="mt-6 text-center">
                <button
                  onClick={handleCreateMistakeSet}
                  disabled={isCreatingSet || creationStatus === 'success'}
                  className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center mx-auto"
                >
                  {isCreatingSet && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                  {creationStatus === 'idle' && '一键创建错题集'}
                  {creationStatus === 'loading' && '正在创建...'}
                  {creationStatus === 'success' && '✅ 创建成功!'}
                  {creationStatus === 'error' && '创建失败, 请重试'}
                </button>
                {creationStatus === 'error' && <p className="text-red-500 text-sm mt-2">创建失败，请检查网络或稍后重试。</p>}
              </div>
            </div>

            {/* 关键指标卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">准确率</p>
                    <p className="text-2xl font-bold text-green-600">{metrics.accuracy.toFixed(1)}%</p>
                  </div>
                  <Target className="w-8 h-8 text-green-500" />
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-green-500 rounded-full transition-all duration-1000"
                    style={{ width: `${metrics.accuracy}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">答题速度</p>
                    <p className="text-2xl font-bold text-blue-600">{metrics.speed.toFixed(1)} 题/分</p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  平均每题 {(60 / metrics.speed).toFixed(0)} 秒
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">稳定性</p>
                    <p className="text-2xl font-bold text-purple-600">{metrics.consistency.toFixed(1)}%</p>
                  </div>
                  <Brain className="w-8 h-8 text-purple-500" />
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-purple-500 rounded-full transition-all duration-1000"
                    style={{ width: `${metrics.consistency}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">置信度</p>
                    <p className="text-2xl font-bold text-orange-600">{metrics.confidence.toFixed(1)}%</p>
                  </div>
                  <Award className="w-8 h-8 text-orange-500" />
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-orange-500 rounded-full transition-all duration-1000"
                    style={{ width: `${metrics.confidence}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 性能雷达图 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">综合表现</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 简化的雷达图显示 */}
                <div className="space-y-4">
                  {radarData.map((data, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-16 text-sm text-gray-600">{data.metric}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <motion.div
                          className="bg-blue-500 h-3 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${data.value}%` }}
                          transition={{ duration: 1, delay: index * 0.2 }}
                        />
                      </div>
                      <div className="w-12 text-sm font-medium text-gray-800">
                        {data.value.toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>

                {/* 难度分析 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">难度表现</h4>
                  {Object.entries(metrics.difficulty_performance).map(([level, score]) => (
                    <div key={level} className="flex items-center gap-4">
                      <div className="w-16 text-sm text-gray-600 capitalize">{level}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            score >= 80 ? 'bg-green-500' :
                            score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <div className="w-12 text-sm font-medium text-gray-800">
                        {score.toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 优势和待改进 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  优势领域
                </h3>
                <div className="space-y-2">
                  {strengths.map((strength, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-green-700 text-sm">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  待改进领域
                </h3>
                <div className="space-y-2">
                  {weaknesses.map((weakness, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span className="text-red-700 text-sm">{weakness}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 详细分析标签页 */}
        {activeTab === 'detailed' && (
          <motion.div
            key="detailed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* 逐题分析 */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">逐题分析</h3>
                <p className="text-gray-600 mt-1">详细查看每道题的答题情况</p>
              </div>

              <div className="p-6 space-y-4">
                {exam.questions.map((question, index) => {
                  const questionResult = scored_questions.find(r => r.question_id === question.id)
                  const response = session.responses.find(r => r.question_id === question.id)
                  const isCorrect = questionResult?.is_correct || false
                  const showExplanation = showExplanations.includes(question.id)

                  return (
                    <div
                      key={question.id}
                      className={`border rounded-lg p-4 ${
                        isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                          isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {index + 1}
                        </div>

                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 mb-2">
                            {question.question}
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">你的答案: </span>
                              <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                                {Array.isArray(response?.student_answer) 
                                  ? response.student_answer.join(', ') 
                                  : response?.student_answer || '未答'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">正确答案: </span>
                              <span className="text-green-700">
                                {Array.isArray(question.correct_answer)
                                  ? question.correct_answer.join(', ')
                                  : question.correct_answer}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">答题时间: </span>
                              <span className="text-gray-700">
                                {response ? (response.response_time / 1000).toFixed(1) : 0}秒
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">得分: </span>
                              <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                                {questionResult?.score || 0}/{question.points}分
                              </span>
                            </div>
                          </div>

                          {question.explanation && (
                            <button
                              onClick={() => toggleExplanation(question.id)}
                              className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <Lightbulb className="w-4 h-4" />
                              {showExplanation ? '隐藏解释' : '查看解释'}
                            </button>
                          )}

                          {showExplanation && question.explanation && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                            >
                              <p className="text-sm text-blue-800">{question.explanation}</p>
                            </motion.div>
                          )}
                        </div>

                        <div className="text-right">
                          {isCorrect ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* 学习建议标签页 */}
        {activeTab === 'recommendations' && (
          <motion.div
            key="recommendations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-4">学习建议</h2>
              <ul className="space-y-3">
                {(recommendations || []).map((recommendation: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* 对比分析标签页 */}
        {activeTab === 'comparison' && (
          <motion.div
            key="comparison"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">历史对比分析</h3>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>历史考试数据功能正在开发中...</p>
                <p className="text-sm mt-2">将显示您的学习进步轨迹和趋势分析</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default ExamAnalytics
