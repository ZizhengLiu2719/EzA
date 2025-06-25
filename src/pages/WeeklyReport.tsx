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
    { name: '历史论文大纲', status: 'completed', time: '2小时' },
    { name: '数学作业第三章', status: 'completed', time: '3小时' },
    { name: '心理学阅读', status: 'in-progress', time: '1.5小时' },
    { name: '编程项目', status: 'pending', time: '4小时' }
  ]

  const recommendations = [
    '建议本周优先处理心理学阅读，避免堆积',
    '编程项目需要更多时间，建议分两天完成',
    '你的学习效率很高，继续保持！'
  ]

  return (
    <div className={styles.report}>
      <div className="container">
        <div className={styles.header}>
          <h1>本周学习报告</h1>
          <p>2024年1月15日 - 1月21日</p>
        </div>
        
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statInfo}>
              <h3>任务完成率</h3>
              <p className={styles.statNumber}>{weeklyStats.completionRate}%</p>
              <span className={styles.statDetail}>
                {weeklyStats.tasksCompleted}/{weeklyStats.totalTasks} 任务完成
              </span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏰</div>
            <div className={styles.statInfo}>
              <h3>学习时长</h3>
              <p className={styles.statNumber}>{weeklyStats.studyHours}h</p>
              <span className={styles.statDetail}>本周总学习时间</span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎯</div>
            <div className={styles.statInfo}>
              <h3>专注度评分</h3>
              <p className={styles.statNumber}>{weeklyStats.focusScore}/100</p>
              <span className={styles.statDetail}>基于学习效率计算</span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statInfo}>
              <h3>拖延指数</h3>
              <p className={styles.statNumber}>{weeklyStats.procrastinationIndex}/10</p>
              <span className={styles.statDetail}>越低越好</span>
            </div>
          </div>
        </div>
        
        <div className={styles.contentGrid}>
          <div className={styles.taskSection}>
            <h2>本周任务详情</h2>
            <div className={styles.taskList}>
              {weeklyTasks.map((task, index) => (
                <div key={index} className={styles.taskItem}>
                  <div className={styles.taskInfo}>
                    <span className={styles.taskName}>{task.name}</span>
                    <span className={styles.taskTime}>{task.time}</span>
                  </div>
                  <span className={`${styles.taskStatus} ${styles[task.status]}`}>
                    {task.status === 'completed' && '已完成'}
                    {task.status === 'in-progress' && '进行中'}
                    {task.status === 'pending' && '待开始'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className={styles.recommendationsSection}>
            <h2>AI 建议</h2>
            <div className={styles.recommendationsList}>
              {recommendations.map((rec, index) => (
                <div key={index} className={styles.recommendation}>
                  <div className={styles.recIcon}>💡</div>
                  <p>{rec}</p>
                </div>
              ))}
            </div>
            
            <div className={styles.nextWeekPreview}>
              <h3>下周预览</h3>
              <p>预计有 10 个新任务，建议提前规划时间</p>
              <button className="btn btn-primary">查看详细计划</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeeklyReport 