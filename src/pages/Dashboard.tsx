import AIModelSelector from '@/components/AIModelSelector'
import { LucideBarChart2, LucideBookOpen, LucideBot, LucideBrain, LucideCalendar, LucideCrown } from 'lucide-react'
import { Link } from 'react-router-dom'
import styles from './Dashboard.module.css'

const modules = [
  {
    icon: <LucideBookOpen size={48} color="#3b82f6" />,
    title: 'Course Import Center',
    desc: 'Upload syllabus, textbooks, lecture notes, master entire semester structure in 1 minute',
    to: '/upload',
    emoji: '📚',
    status: 'ACTIVE',
    xp: '+150 XP'
  },
  {
    icon: <LucideBookOpen size={48} color="#06b6d4" />,
    title: 'Semester Overview',
    desc: 'View all uploaded courses, quick access to syllabus editing with real-time tracking',
    to: '/courses',
    emoji: '📖',
    status: 'READY',
    xp: '+120 XP'
  },
  {
    icon: <LucideCalendar size={48} color="#10b981" />,
    title: 'Smart Task Engine',
    desc: 'Automatically generate learning path maps, subtask breakdown, calendar sync',
    to: '/planner',
    emoji: '🎯',
    status: 'POWERED',
    xp: '+180 XP'
  },
  {
    icon: <LucideBot size={48} color="#f59e0b" />,
    title: 'AI Learning Assistant',
    desc: 'Writing guidance, STEM problem solving, reading summaries, comprehensive AI tutoring',
    to: '/assistant',
    emoji: '🤖',
    status: 'ONLINE',
    xp: '+200 XP'
  },
  {
    icon: <LucideBarChart2 size={48} color="#6366f1" />,
          title: 'AI Learning Insights',
      desc: 'Advanced analytics, performance patterns, predictive recommendations, learning health score',
    to: '/learning-insights',
    emoji: '📊',
    status: 'ANALYZING',
    xp: '+130 XP'
  },
  {
    icon: <LucideBrain size={48} color="#ec4899" />,
    title: 'Review & Exam Prep',
    desc: 'Automatically generate review cards, practice questions, error tracking for exam success',
    to: '/review',
    emoji: '🧠',
    status: 'BOOSTED',
    xp: '+160 XP'
  },
  {
    icon: <LucideCrown size={48} color="#8b5cf6" />,
    title: 'Subscription Plans',
    desc: 'View and manage your subscription, upgrade to higher tier plans for premium features',
    to: '/subscription',
    emoji: '👑',
    status: 'PREMIUM',
    xp: '+50 XP'
  },
]

const Dashboard = () => {
  return (
    <div className={styles.dashboardModules}>
      <div className="container">
        <div className={styles.header}>
          <h1>Welcome back, Student! 🎮</h1>
          <p>Choose your learning adventure - Level up your academic game! 🚀</p>
          
          {/* Player Stats */}
          <div className={styles.playerStats}>
            <div className={styles.statBadge}>
              <span className={styles.statEmoji}>⚡</span>
              <span>Streak: 7 days</span>
            </div>
            <div className={styles.statBadge}>
              <span className={styles.statEmoji}>🏆</span>
              <span>Level 12 Scholar</span>
            </div>
            <div className={styles.statBadge}>
              <span className={styles.statEmoji}>💎</span>
              <span>2,450 XP</span>
            </div>
          </div>

          {/* AI Model Selector */}
          <div style={{ marginTop: '12px' }}>
            <AIModelSelector />
          </div>
        </div>
        
        <div className={styles.modulesGrid}>
          {modules.map((mod, idx) => (
            <Link to={mod.to} className={styles.moduleCard} key={mod.title}>
              {/* Module Status */}
              <div className={styles.moduleStatus}>{mod.status}</div>
              
              {/* Gaming Icon */}
              <div className={styles.moduleIcon}>{mod.emoji}</div>
              
              <div className={styles.moduleContent}>
                <h2 className={styles.moduleTitle}>{mod.title}</h2>
                <p className={styles.moduleDesc}>{mod.desc}</p>
                
                {/* XP Badge */}
                <div className={styles.xpBadge}>
                  <span>💫</span>
                  <span>{mod.xp}</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className={styles.moduleProgress}>
                <div className={styles.progressFill} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard 