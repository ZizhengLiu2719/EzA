/**
 * 考试成绩分析界面组件
 * 提供详细的考试结果分析、可视化图表和学习建议
 */

import { createSetFromMistakes } from '@/api/flashcards'
import { useUser } from '@/context/UserContext'
import { gamificationService } from '@/services/gamificationService'
import { motion } from 'framer-motion'
import {
    BarChart3,
    Brain,
    FilePlus2,
    Lightbulb,
    PieChart,
    RefreshCw,
    Target
} from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import Confetti from 'react-confetti'
import { examAI, ExamResult, GeneratedExam, StudyRecommendations } from '../services/examAI'
import { ExamSession } from '../types'
import styles from './ExamAnalytics.module.css'

interface ExamAnalyticsProps {
  exam: GeneratedExam
  session: ExamSession
  result: ExamResult
  onRetake: () => void
  onContinueStudy: () => void
  className?: string
}

const ExamAnalytics: React.FC<ExamAnalyticsProps> = ({
  exam,
  session,
  result,
  onRetake,
  onContinueStudy,
  className = ''
}) => {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'recommendations'>('overview')
  const [showExplanations, setShowExplanations] = useState<Set<string>>(new Set())
  const [isCreatingSet, setIsCreatingSet] = useState(false)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [studyPlan, setStudyPlan] = useState<StudyRecommendations | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (!user || !result) return
    const score = result.scoring.percentage
    gamificationService.awardXP(user.id, Math.round(result.scoring.total_score))
    
    let celebration = false
    if (score >= 90) {
      gamificationService.unlockAchievement(user.id, 'FIRST_A')
      celebration = true
    }
    if (score >= 100) {
      gamificationService.unlockAchievement(user.id, 'PERFECT_SCORE')
      celebration = true
    }

    if (celebration) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 8000)
    }
  }, [user, result])

  const mistakenQuestions = useMemo(() => {
    const mistakenIDs = new Set(result.scoring.question_scores.filter(q => !q.is_correct).map(q => q.question_id))
    return exam.questions.filter(q => mistakenIDs.has(q.id))
  }, [result, exam])

  const handleCreateMistakeSet = async () => {
    if (mistakenQuestions.length === 0) return
    setIsCreatingSet(true)
    try {
      await createSetFromMistakes(`Mistakes from: ${exam.config.title}`, mistakenQuestions)
    } catch (error) {
      console.error("Failed to create mistake set:", error)
    } finally {
      setIsCreatingSet(false)
    }
  }

  const handleGenerateStudyPlan = async () => {
    setIsGeneratingPlan(true)
    try {
      const plan = await examAI.generateStudyRecommendations(result, {
        learning_style: 'visual',
        difficulty_preference: 5,
        time_availability: 60,
        goal_performance: 90,
      })
      setStudyPlan(plan)
      setActiveTab('recommendations')
    } catch (error) {
      console.error("Failed to generate study plan:", error)
    } finally {
      setIsGeneratingPlan(false)
    }
  }

  const toggleExplanation = (questionId: string) => {
    setShowExplanations(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) newSet.delete(questionId)
      else newSet.add(questionId)
      return newSet
    })
  }

  if (!result) return <div>Loading results...</div>;

  const { scoring, analysis } = result;

  return (
    <div className={`exam-analytics bg-gray-50 min-h-screen ${className}`}>
      {showConfetti && <Confetti recycle={false} numberOfPieces={400} />}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{exam.config.title} - Results</h1>
          <p className={styles.subtitle}>
            Completed on: {new Date().toLocaleString()}
          </p>
        </div>
        <div className={styles.scoreContainer}>
          <div className={`${styles.grade} ${styles[result.grade_level.toLowerCase() as keyof typeof styles]}`}>
            {result.grade_level}
          </div>
          <div className={styles.score}>
            <span className={styles.scorePercentage}>{scoring.percentage.toFixed(1)}%</span>
            <span className={styles.scorePoints}>{scoring.total_score}/{scoring.max_possible_score} pts</span>
          </div>
        </div>
      </header>

      <nav className={styles.nav}>
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('detailed')}
          className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${
            activeTab === 'detailed'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <PieChart className="w-4 h-4" />
          Detailed Analysis
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${
            activeTab === 'recommendations'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          Learning Suggestions
        </button>
      </nav>

      <main className={styles.mainContent}>
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.grid}>
            <div className={`${styles.card} ${styles.colSpan2}`}>
              <h3 className={styles.cardTitle}><Target/> Performance Summary</h3>
              <p>Accuracy: {scoring.percentage.toFixed(1)}%</p>
              <p>Time Taken: {analysis.time_analysis.total_time}s</p>
            </div>

            <div className={`${styles.card} ${styles.colSpan2}`}>
              <h3 className={styles.cardTitle}><Brain/> AI Diagnosis</h3>
              <div className={styles.diagnosisSection}>
                <h4>Strengths</h4>
                <ul>{analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
              <div className={styles.diagnosisSection}>
                <h4>Areas for Improvement</h4>
                <ul>{analysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
              </div>
            </div>

            <div className={`${styles.card} ${styles.colSpanFull}`}>
              <h3 className={styles.cardTitle}><Lightbulb/> Action Center</h3>
              <div className={styles.actionButtons}>
                <button onClick={onRetake} disabled={isCreatingSet || isGeneratingPlan}><RefreshCw/> Retake Exam</button>
                <button onClick={handleCreateMistakeSet} disabled={isCreatingSet || mistakenQuestions.length === 0}>
                  {isCreatingSet ? 'Creating...' : <><FilePlus2/> Create Mistake Set ({mistakenQuestions.length})</>}
                </button>
                <button onClick={handleGenerateStudyPlan} disabled={isGeneratingPlan}>
                  {isGeneratingPlan ? 'Analyzing...' : <><Lightbulb/> Generate Study Plan</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'detailed' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.detailedView}>
            {exam.questions.map((question) => {
              const qResult = scoring.question_scores.find(qs => qs.question_id === question.id)
              return (
                <div key={question.id} className={`${styles.questionCard} ${qResult?.is_correct ? styles.correct : styles.incorrect}`}>
                  <p>{question.question}</p>
                </div>
              )
            })}
          </motion.div>
        )}

        {activeTab === 'recommendations' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.recommendationsView}>
            {isGeneratingPlan && <div>Generating your personalized plan...</div>}
            {studyPlan && (
              <div>
                <h4>Immediate Actions</h4>
                <ul>{studyPlan.immediate_actions.map((action, i) => <li key={i}>{action}</li>)}</ul>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  )
}

export default ExamAnalytics
