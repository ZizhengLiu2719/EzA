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
  },
  {
    icon: <LucideBookOpen size={48} color="#06b6d4" />,
    title: 'Current Semester Course Overview',
    desc: 'View all uploaded courses, quick access to syllabus editing',
    to: '/courses',
    emoji: '📖',
  },
  {
    icon: <LucideCalendar size={48} color="#10b981" />,
    title: 'Smart Task Engine',
    desc: 'Automatically generate learning path maps, subtask breakdown, calendar sync',
    to: '/planner',
    emoji: '📅',
  },
  {
    icon: <LucideBot size={48} color="#f59e0b" />,
    title: 'AI Learning Assistant',
    desc: 'Writing guidance, STEM problem solving, reading summaries, comprehensive AI tutoring',
    to: '/assistant',
    emoji: '🤖',
  },
  {
    icon: <LucideBarChart2 size={48} color="#6366f1" />,
    title: 'Weekly Feedback Coach',
    desc: 'Task completion rate analysis, procrastination index, personalized recommendations',
    to: '/weekly-report',
    emoji: '📊',
  },
  {
    icon: <LucideBrain size={48} color="#ec4899" />,
    title: 'Review & Exam Preparation',
    desc: 'Automatically generate review cards, practice questions, error tracking',
    to: '/review',
    emoji: '🧠',
  },
  {
    icon: <LucideCrown size={48} color="#8b5cf6" />,
    title: 'Subscription Plans',
    desc: 'View and manage your subscription, upgrade to higher tier plans',
    to: '/subscription',
    emoji: '👑',
  },
]

const Dashboard = () => {
  return (
    <div className={styles.dashboardModules}>
      <div className={styles.header}>
        <h1>Welcome back, Student!</h1>
        <p>Please select the EzA core module you want to enter</p>
      </div>
      <div className={styles.modulesGrid}>
        {modules.map((mod, idx) => (
          <Link to={mod.to} className={styles.moduleCard} key={mod.title}>
            <div className={styles.moduleIcon}>{mod.emoji}</div>
            <div className={styles.moduleContent}>
              <h2 className={styles.moduleTitle}>{mod.title}</h2>
              <p className={styles.moduleDesc}>{mod.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Dashboard 