/**
 * 考试成绩分析界面组件
 * 提供详细的考试结果分析、可视化图表和学习建议
 */

import { AnimatePresence, motion } from 'framer-motion'
import {
    BarChart3,
    Brain,
    Calendar,
    CheckCircle,
    Clock,
    Lightbulb,
    Target,
    TrendingUp,
    XCircle
} from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { createSetFromMistakes } from '../api/flashcards'
import type { ExamQuestion, ExamResult, ExamSession, GeneratedExam } from '../types/examTypes'
import styles from './ExamAnalytics.module.css'

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
  const [activeTab, setActiveTab] = useState<
    'overview' | 'detailed' | 'recommendations' | 'comparison'
  >('overview')
  const [showExplanations, setShowExplanations] = useState<string[]>([])
  const [isCreatingSet, setIsCreatingSet] = useState(false)
  const [creationStatus, setCreationStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle')

  // Destructure for easier access in JSX, now aligning with AI response
  const { analysis, grade_level, scored_questions, totalScore, percentage } = result;
  const { strengths, weaknesses, recommendations } = analysis;

  const handleCreateMistakeSet = async () => {
    setCreationStatus('loading')
    setIsCreatingSet(true)

    const incorrectQuestions = scored_questions
      .filter((score: { is_correct: boolean; }) => !score.is_correct)
      .map((score: { question_id: string; }) => exam.questions.find(q => q.id === score.question_id))
      .filter((q): q is ExamQuestion => q !== undefined);

    if (incorrectQuestions.length === 0) {
      setCreationStatus('success')
      setIsCreatingSet(false)
      return;
    }
    
    const setTitle = `Mistake Book - ${exam.config.title} (${new Date().toLocaleDateString()})`;

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
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0

    const totalTime = session.end_time && session.start_time 
      ? (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000 / 60
      : exam.config.duration
    const speed = totalTime > 0 ? totalQuestions / totalTime : 0

    // 计算答题时间一致性
    const responseTimes = session.responses.map(r => r.response_time)
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0
    const timeVariance = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + Math.pow(time - avgResponseTime, 2), 0) / responseTimes.length 
      : 0
    const consistency = avgResponseTime > 0 && responseTimes.length > 0
      ? Math.max(0, 100 - (Math.sqrt(timeVariance) / avgResponseTime * 100))
      : 80 // 默认值

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
      case 'A': return styles.gradeA
      case 'B': return styles.gradeB
      case 'C': return styles.gradeC
      case 'D': return styles.gradeD
      case 'F': return styles.gradeF
      default: return styles.gradeDefault
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
    { metric: 'Accuracy', value: isNaN(metrics.accuracy) ? 0 : metrics.accuracy, max: 100 },
    { metric: 'Speed', value: isNaN(metrics.speed) ? 0 : Math.min(metrics.speed * 10, 100), max: 100 },
    { metric: 'Consistency', value: isNaN(metrics.consistency) ? 80 : metrics.consistency, max: 100 },
    { metric: 'Confidence', value: isNaN(metrics.confidence) ? 60 : metrics.confidence, max: 100 }
  ]

  const tabItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'detailed', label: 'Detailed Analysis', icon: Clock },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
    { id: 'comparison', label: 'Comparison', icon: TrendingUp },
  ]

  return (
    <div className={`${styles.analyticsContainer} ${className}`}>
      {/* <BackToDashboardButton /> */}
      {/* 头部 */}
      <motion.div 
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.mainTitle}>{exam.config.title} - Results & Analysis</h1>
            <p className={styles.subTitle}>
              Completed at: {new Date(session.end_time || Date.now()).toLocaleString()} • 
              Time taken: {Math.floor((analysis?.time_analysis?.total_time || 0) / 60)}m {Math.round(analysis?.time_analysis?.total_time || 0) % 60}s
            </p>
          </div>

          <div className={styles.scoreContainer}>
            <div className={`${styles.gradeBadge} ${getGradeColor(grade_level || 'N/A')}`}>
              {grade_level || 'N/A'}
            </div>
            <div className={styles.scoreText}>
              <div className={styles.percentage}>
                {(percentage || 0).toFixed(1)}%
              </div>
              <div className={styles.scoreDetail}>
                {totalScore || 0}/{exam.config.total_points} Points
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 标签页导航 */}
      <div className={styles.tabNav}>
        {tabItems.map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              setActiveTab(
                tab.id as 'overview' | 'detailed' | 'recommendations'
              )
            }
            className={`${styles.tabButton} ${
              activeTab === tab.id ? styles.active : ''
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 核心内容区 */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={styles.tabContent}
          >
            <div className={styles.mainContent}>
              {/* 左侧栏 */}
              <div className={styles.leftPanel}>
                {/* AI 智能诊断 */}
                <div className={`${styles.card} ${styles.aiDiagnosisCard}`}>
                  <h2 className={styles.cardTitle}>
                    <Brain size={20} /> AI Diagnosis
                  </h2>
                  <div className={styles.diagnosisContent}>
                    <h3 className={styles.strengthsTitle}>
                      ✅ Strengths
                    </h3>
                    {(strengths || []).map((s, i) => (
                      <p key={`strength-${i}`} className={styles.diagnosisText}>
                        {s}
                      </p>
                    ))}
                    {strengths?.length === 0 && (
                      <p className={styles.diagnosisText}>
                        本次考试未发现明显的优势领域。
                      </p>
                    )}

                    <h3 className={styles.weaknessesTitle}>
                      ⚠️ Weaknesses & Error Patterns
                    </h3>
                    {(weaknesses || []).map((w, i) => (
                      <p key={`weakness-${i}`} className={styles.diagnosisText}>
                        {w}
                      </p>
                    ))}
                    {weaknesses?.length === 0 && (
                      <p className={styles.diagnosisText}>
                        恭喜！本次考试没有发现明显的弱点。
                      </p>
                    )}
                  </div>
                  <button
                    className={styles.createSetButton}
                    onClick={handleCreateMistakeSet}
                    disabled={isCreatingSet}
                  >
                    {isCreatingSet
                      ? 'Creating...'
                      : 'Create Mistake Set'}
                  </button>
                </div>

                {/* 综合表现雷达图 */}
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>
                    <Target size={20} /> Overall Performance
                  </h2>
                  <div className={styles.radarChartContainer}>
                    {radarData.map((data, index) => (
                      <div key={data.metric} className={styles.radarItem}>
                        <span className={styles.radarLabel}>{data.metric}</span>
                        <div className={styles.radarBar}>
                          <motion.div
                            className={styles.radarFill}
                            initial={{ width: 0 }}
                            animate={{ width: `${data.value}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                          />
                        </div>
                        <span className={styles.radarValue}>
                          {data.value.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 右侧栏 */}
              <div className={styles.rightPanel}>
                {/* 综合指标 */}
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>
                    <Target size={20} /> Key Metrics
                  </h2>
                  <div className={styles.metricsGrid}>
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>Accuracy</span>
                      <span className={styles.metricValue}>
                        {metrics.accuracy.toFixed(1)}%
                      </span>
                    </div>
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>Pace</span>
                      <span className={styles.metricValue}>
                        {metrics.speed.toFixed(1)} q/min
                      </span>
                    </div>
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>Consistency</span>
                      <span className={styles.metricValue}>
                        {metrics.consistency.toFixed(1)}%
                      </span>
                    </div>
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>Confidence</span>
                      <span className={styles.metricValue}>
                        {metrics.confidence.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* 难度表现 */}
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>
                    <BarChart3 size={20} /> Performance by Difficulty
                  </h2>
                  <div className={styles.difficultyContainer}>
                    {Object.entries(metrics.difficulty_performance).map(
                      ([level, score], index) => (
                        <div key={`diff-${level}-${index}-${score}`} className={styles.difficultyItem}>
                          <span className={styles.difficultyLabel}>
                            {level as string}
                          </span>
                          <div className={styles.difficultyBar}>
                            <div
                              className={styles.difficultyFill}
                              style={{
                                width: `${score as number}%`,
                                backgroundColor:
                                  (score as number) >= 80
                                    ? '#4ade80'
                                    : (score as number) >= 60
                                    ? '#facc15'
                                    : '#f87171',
                              }}
                            />
                          </div>
                          <span className={styles.difficultyValue}>
                            {(score as number).toFixed(0)}%
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'detailed' && (
          <motion.div
            key="detailed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={styles.tabContent}
          >
            <div className={`${styles.card} ${styles.detailedAnalysisCard}`}>
              <h2 className={styles.cardTitle}>
                <Clock size={20} /> Detailed Question Analysis
              </h2>
              <div className={styles.questionsList}>
                {exam.questions.map((question, index) => {
                  const questionResult = scored_questions.find(
                    (r) => r.question_id === question.id
                  )
                  const response = session.responses.find(
                    (r) => r.question_id === question.id
                  )
                  const isCorrect = questionResult?.is_correct || false
                  const showExplanation = showExplanations.includes(
                    question.id
                  )

                  return (
                    <div key={question.id} className={styles.questionItem}>
                      <div className={styles.questionHeader}>
                        <span
                          className={`${styles.questionNumber} ${
                            isCorrect ? styles.correct : styles.incorrect
                          }`}
                        >
                          {index + 1}
                        </span>
                        <p className={styles.questionText}>{question.question}</p>
                        <span
                          className={`${styles.questionScore} ${
                            isCorrect ? styles.correct : styles.incorrect
                          }`}
                        >
                          {questionResult?.score || 0} / {question.points}
                        </span>
                        {isCorrect ? (
                          <CheckCircle className={styles.correct} size={20} />
                        ) : (
                          <XCircle className={styles.incorrect} size={20} />
                        )}
                      </div>
                      <div className={styles.questionDetailsGrid}>
                        <div key={`student-answer-${question.id}`}>
                          <span className={styles.detailLabel}>Your Answer:</span>
                          <span className={styles.detailValue}>
                            {Array.isArray(response?.student_answer)
                              ? response.student_answer.join(', ')
                              : response?.student_answer || '未答'}
                          </span>
                        </div>
                        <div key={`correct-answer-${question.id}`}>
                          <span className={styles.detailLabel}>Correct Answer:</span>
                          <span
                            className={`${styles.detailValue} ${styles.correctAnswer}`}
                          >
                            {Array.isArray(question.correct_answer)
                              ? question.correct_answer.join(', ')
                              : question.correct_answer}
                          </span>
                        </div>
                        <div key={`response-time-${question.id}`}>
                          <span className={styles.detailLabel}>答题时间:</span>
                          <span className={styles.detailValue}>
                            {response
                              ? (response.response_time / 1000).toFixed(1)
                              : 0}
                            s
                          </span>
                        </div>
                      </div>

                      {question.explanation && (
                        <div className={styles.explanationContainer}>
                          <button
                            onClick={() => toggleExplanation(question.id)}
                            className={styles.explanationToggle}
                          >
                            <Lightbulb size={16} />
                            {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
                          </button>
                          {showExplanation && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className={styles.explanation}
                            >
                              <strong>解析:</strong> {question.explanation}
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'recommendations' && (
          <motion.div
            key="recommendations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={styles.tabContent}
          >
            <div className={`${styles.card} ${styles.recommendationsCard}`}>
              <h2 className={styles.cardTitle}>
                <Lightbulb size={20} /> AI Learning Recommendations
              </h2>
              <ul className={styles.recommendationsList}>
                {(recommendations || []).map(
                  (recommendation: string, index: number) => (
                    <li key={`rec-${index}`}>
                      <CheckCircle size={16} />
                      <span>{recommendation}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </motion.div>
        )}

        {activeTab === 'comparison' && (
          <motion.div
            key="comparison"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={styles.tabContent}
          >
            <div className={styles.card}>
               <div className={styles.placeholder}>
                 <Calendar size={48} />
                 <h3>Performance Comparison (Coming Soon)</h3>
                 <p>Compare your results against class averages and your own past performance.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ExamAnalytics
