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
      case 'bullet_tutor': return '引导式导师'
      case 'socratic_bot': return '苏格拉底式'
      case 'quick_fix': return '快速修复'
      case 'diagram_ai': return '视觉化助手'
      default: return mode
    }
  }

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'writing': return '写作'
      case 'stem': return 'STEM'
      case 'reading': return '阅读'
      case 'programming': return '编程'
      default: return type
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`
  }

  if (loading) {
    return (
      <div className={styles.progressContainer}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>加载学习数据中...</p>
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
          <h3>学习进度</h3>
          <p>你的AI学习统计和成就</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {/* 总对话数 */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <LucideMessageCircle size={20} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{learningStats.totalConversations}</div>
            <div className={styles.statLabel}>总对话数</div>
          </div>
        </div>

        {/* 总消息数 */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <LucideTrendingUp size={20} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{learningStats.totalMessages}</div>
            <div className={styles.statLabel}>总消息数</div>
          </div>
        </div>

        {/* 学习时长 */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <LucideClock size={20} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{formatTime(learningStats.totalStudyTime)}</div>
            <div className={styles.statLabel}>学习时长</div>
          </div>
        </div>

        {/* 学习连续天数 */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <LucideTarget size={20} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{learningStats.learningStreak}</div>
            <div className={styles.statLabel}>连续学习天数</div>
          </div>
        </div>
      </div>

      <div className={styles.detailsSection}>
        <h4>详细统计</h4>
        
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>平均每对话消息数</span>
          <span className={styles.detailValue}>{learningStats.averageMessagesPerConversation}</span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>最常用AI模式</span>
          <span className={styles.detailValue}>{getModeDisplayName(learningStats.mostUsedMode)}</span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>最常用学习类型</span>
          <span className={styles.detailValue}>{getTypeDisplayName(learningStats.mostUsedType)}</span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>本周增长</span>
          <span className={`${styles.detailValue} ${styles.growth}`}>
            +{learningStats.weeklyGrowth}%
          </span>
        </div>
      </div>

      <div className={styles.achievementsSection}>
        <h4>学习成就</h4>
        <div className={styles.achievementsList}>
          {learningStats.totalConversations >= 5 && (
            <div className={styles.achievement}>
              <span className={styles.achievementIcon}>🎯</span>
              <span className={styles.achievementText}>对话达人 - 完成5次AI对话</span>
            </div>
          )}
          {learningStats.totalMessages >= 50 && (
            <div className={styles.achievement}>
              <span className={styles.achievementIcon}>💬</span>
              <span className={styles.achievementText}>交流专家 - 发送50条消息</span>
            </div>
          )}
          {learningStats.learningStreak >= 3 && (
            <div className={styles.achievement}>
              <span className={styles.achievementIcon}>🔥</span>
              <span className={styles.achievementText}>学习热情 - 连续学习3天</span>
            </div>
          )}
          {learningStats.totalStudyTime >= 120 && (
            <div className={styles.achievement}>
              <span className={styles.achievementIcon}>⏰</span>
              <span className={styles.achievementText}>时间管理 - 累计学习2小时</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AILearningProgress 