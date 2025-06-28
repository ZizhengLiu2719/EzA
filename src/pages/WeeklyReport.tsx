import BackToDashboardButton from '@/components/BackToDashboardButton'
import styles from './WeeklyReport.module.css'

const WeeklyReport = () => {
  const weeklyStats = {
    tasksCompleted: 8,
    totalTasks: 12,
    completionRate: 67,
    studyHours: 24,
    procrastinationIndex: 3,
    focusScore: 85
  }

  const weeklyTasks = [
    { name: 'History Paper Outline', status: 'completed', time: '2 hours' },
    { name: 'Math Homework Chapter 3', status: 'completed', time: '3 hours' },
    { name: 'Psychology Reading', status: 'in-progress', time: '1.5 hours' },
    { name: 'Programming Project', status: 'pending', time: '4 hours' }
  ]

  const recommendations = [
    'Recommend prioritizing psychology reading this week to avoid backlog',
    'Programming project needs more time, suggest completing over two days',
    'Your learning efficiency is excellent, keep it up!'
  ]

  return (
    <div className={styles.report} style={{ position: 'relative' }}>
      <BackToDashboardButton />
      <div className="container">
        <div className={styles.header}>
          <h1>This Week\'s Learning Report</h1>
          <p>January 15, 2024 - January 21, 2024</p>
        </div>
        
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statInfo}>
              <h3>Task Completion Rate</h3>
              <p className={styles.statNumber}>{weeklyStats.completionRate}%</p>
              <span className={styles.statDetail}>
                {weeklyStats.tasksCompleted}/{weeklyStats.totalTasks} tasks completed
              </span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏰</div>
            <div className={styles.statInfo}>
              <h3>Study Hours</h3>
              <p className={styles.statNumber}>{weeklyStats.studyHours}h</p>
              <span className={styles.statDetail}>Total study time this week</span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎯</div>
            <div className={styles.statInfo}>
              <h3>Focus Score</h3>
              <p className={styles.statNumber}>{weeklyStats.focusScore}/100</p>
              <span className={styles.statDetail}>Based on learning efficiency</span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statInfo}>
              <h3>Procrastination Index</h3>
              <p className={styles.statNumber}>{weeklyStats.procrastinationIndex}/10</p>
              <span className={styles.statDetail}>Lower is better</span>
            </div>
          </div>
        </div>
        
        <div className={styles.contentGrid}>
          <div className={styles.taskSection}>
            <h2>This Week\'s Task Details</h2>
            <div className={styles.taskList}>
              {weeklyTasks.map((task, index) => (
                <div key={index} className={styles.taskItem}>
                  <div className={styles.taskInfo}>
                    <span className={styles.taskName}>{task.name}</span>
                    <span className={styles.taskTime}>{task.time}</span>
                  </div>
                  <span className={`${styles.taskStatus} ${styles[task.status]}`}>
                    {task.status === 'completed' && 'Completed'}
                    {task.status === 'in-progress' && 'In Progress'}
                    {task.status === 'pending' && 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className={styles.recommendationsSection}>
            <h2>AI Recommendations</h2>
            <div className={styles.recommendationsList}>
              {recommendations.map((rec, index) => (
                <div key={index} className={styles.recommendation}>
                  <div className={styles.recIcon}>💡</div>
                  <p>{rec}</p>
                </div>
              ))}
            </div>
            
            <div className={styles.nextWeekPreview}>
              <h3>Next Week Preview</h3>
              <p>Expected 10 new tasks, recommend planning time in advance</p>
              <button className="btn btn-primary">View Detailed Plan</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeeklyReport 