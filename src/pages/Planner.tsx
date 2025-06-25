import styles from './Planner.module.css'

const Planner = () => {
  return (
    <div className={styles.planner}>
      <div className="container">
        <div className={styles.header}>
          <h1>智能学习计划</h1>
          <p>你的个性化学习时间线和任务安排</p>
        </div>
        
        <div className={styles.plannerContent}>
          <div className={styles.sidebar}>
            <div className={styles.courseList}>
              <h3>我的课程</h3>
              <div className={styles.courseItem}>
                <span className={styles.courseName}>历史学概论</span>
                <span className={styles.taskCount}>5个任务</span>
              </div>
              <div className={styles.courseItem}>
                <span className={styles.courseName}>高等数学</span>
                <span className={styles.taskCount}>8个任务</span>
              </div>
              <div className={styles.courseItem}>
                <span className={styles.courseName}>心理学基础</span>
                <span className={styles.taskCount}>3个任务</span>
              </div>
            </div>
          </div>
          
          <div className={styles.mainContent}>
            <div className={styles.weekView}>
              <h2>本周计划</h2>
              <div className={styles.weekGrid}>
                {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day) => (
                  <div key={day} className={styles.dayColumn}>
                    <h4>{day}</h4>
                    <div className={styles.dayTasks}>
                      {day === '周一' && (
                        <div className={styles.taskCard}>
                          <span className={styles.taskTitle}>历史论文大纲</span>
                          <span className={styles.taskTime}>2小时</span>
                        </div>
                      )}
                      {day === '周三' && (
                        <div className={styles.taskCard}>
                          <span className={styles.taskTitle}>数学作业</span>
                          <span className={styles.taskTime}>1.5小时</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Planner 