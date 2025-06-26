import { LucideBarChart2, LucideBookOpen, LucideBot, LucideBrain, LucideCalendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import styles from './Dashboard.module.css'

const modules = [
  {
    icon: <LucideBookOpen size={48} color="#3b82f6" />,
    title: '课程导入中心',
    desc: '上传syllabus、教材、讲义，1分钟内掌握整个学期结构',
    to: '/upload',
    emoji: '📚',
  },
  {
    icon: <LucideBookOpen size={48} color="#06b6d4" />,
    title: '本学期课程总览',
    desc: '查看所有已上传课程，快速访问 syllabus 编辑',
    to: '/courses',
    emoji: '📖',
  },
  {
    icon: <LucideCalendar size={48} color="#10b981" />,
    title: '智能任务引擎',
    desc: '自动生成学习路径图，子任务拆解，与日历同步',
    to: '/planner',
    emoji: '📅',
  },
  {
    icon: <LucideBot size={48} color="#f59e0b" />,
    title: 'AI学习助理',
    desc: '写作引导、STEM解题、阅读摘要，全方位AI辅导',
    to: '/assistant',
    emoji: '🤖',
  },
  {
    icon: <LucideBarChart2 size={48} color="#6366f1" />,
    title: '每周反馈教练',
    desc: '任务完成率分析、拖延指数、个性化建议',
    to: '/weekly-report',
    emoji: '📊',
  },
  {
    icon: <LucideBrain size={48} color="#ec4899" />,
    title: '复习与考试准备',
    desc: '自动生成复习卡、模拟题、错题追踪',
    to: '/review',
    emoji: '🧠',
  },
]

const Dashboard = () => {
  return (
    <div className={styles.dashboardModules}>
      <div className={styles.header}>
        <h1>欢迎回来，学生！</h1>
        <p>请选择你要进入的 EzA 核心模块</p>
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