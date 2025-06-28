import { useAIStats } from '@/hooks/useAI'
import { LucideBarChart3, LucideClock, LucideMessageCircle, LucideTarget, LucideTrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import styles from './AILearningProgress.module.css'

interface LearningStats {
  totalConversations: number
  totalMessages: number
  averageMessagesPerConversation: number
  mostUsedMode: string
  mostUsedType: string
  weeklyGrowth: number
  learningStreak: number
  totalStudyTime: number
}

const AILearningProgress = () => {
  const { stats, loading } = useAIStats()
  const [learningStats, setLearningStats] = useState<LearningStats>({
    totalConversations: 0,
    totalMessages: 0,
    averageMessagesPerConversation: 0,
    mostUsedMode: 'bullet_tutor',
    mostUsedType: 'writing',
    weeklyGrowth: 0,
    learningStreak: 0,
    totalStudyTime: 0
  })

  useEffect(() => {
    if (stats) {
      setLearningStats({
        ...stats,
        weeklyGrowth: Math.round(Math.random() * 50 + 10), // 模拟数据
        learningStreak: Math.round(Math.random() * 7 + 1), // 模拟数据
        totalStudyTime: Math.round(stats.totalMessages * 2.5) // 估算学习时间
      })
    }
  }, [stats])

  const getModeDisplayName = (mode: string) => {
    switch (mode) {
      case 'bullet_tutor': return 'Guided Tutor'
      case 'socratic_bot': return 'Socratic Method'
      case 'quick_fix': return 'Quick Fix'
      case 'diagram_ai': return 'Visual Assistant'
      default: return mode
    }
  }

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'writing': return 'Writing'
      case 'stem': return 'STEM'
      case 'reading': return 'Reading'
      case 'programming': return 'Programming'
      default: return type
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  if (loading) {
    return (
      <div className={styles.progressContainer}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading learning stats...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.progressContainer}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <LucideBarChart3 size={20} />
        </div>
        <div className={styles.headerContent}>
          <h3>Learning Progress</h3>
          <p>Your AI learning statistics and achievements</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {/* Total Conversations */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <LucideMessageCircle size={20} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{learningStats.totalConversations}</div>
            <div className={styles.statLabel}>Total Conversations</div>
          </div>
        </div>

        {/* Total Messages */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <LucideTrendingUp size={20} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{learningStats.totalMessages}</div>
            <div className={styles.statLabel}>Total Messages</div>
          </div>
        </div>

        {/* Study Time */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <LucideClock size={20} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{formatTime(learningStats.totalStudyTime)}</div>
            <div className={styles.statLabel}>Study Time</div>
          </div>
        </div>

        {/* Learning Streak */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <LucideTarget size={20} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{learningStats.learningStreak}</div>
            <div className={styles.statLabel}>Learning Streak (days)</div>
          </div>
        </div>
      </div>

      <div className={styles.detailsSection}>
        <h4>Detailed Statistics</h4>
        
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Avg. Messages per Conversation</span>
          <span className={styles.detailValue}>{learningStats.averageMessagesPerConversation}</span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Most Used AI Mode</span>
          <span className={styles.detailValue}>{getModeDisplayName(learningStats.mostUsedMode)}</span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Most Used Study Type</span>
          <span className={styles.detailValue}>{getTypeDisplayName(learningStats.mostUsedType)}</span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Weekly Growth</span>
          <span className={`${styles.detailValue} ${styles.growth}`}>
            +{learningStats.weeklyGrowth}%
          </span>
        </div>
      </div>

      <div className={styles.achievementsSection}>
        <h4>Learning Achievements</h4>
        <div className={styles.achievementsList}>
          {learningStats.totalConversations >= 5 && (
            <div className={styles.achievement}>
              <span className={styles.achievementIcon}>🎯</span>
              <span className={styles.achievementText}>Conversationalist - Completed 5 AI conversations</span>
            </div>
          )}
          {learningStats.totalMessages >= 50 && (
            <div className={styles.achievement}>
              <span className={styles.achievementIcon}>💬</span>
              <span className={styles.achievementText}>Communication Expert - Sent 50 messages</span>
            </div>
          )}
          {learningStats.learningStreak >= 3 && (
            <div className={styles.achievement}>
              <span className={styles.achievementIcon}>🔥</span>
              <span className={styles.achievementText}>Learning Enthusiast - 3 days learning streak</span>
            </div>
          )}
          {learningStats.totalStudyTime >= 120 && (
            <div className={styles.achievement}>
              <span className={styles.achievementIcon}>⏰</span>
              <span className={styles.achievementText}>Time Manager - 2 hours total study time</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AILearningProgress 