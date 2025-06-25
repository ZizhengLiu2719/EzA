import styles from './Dashboard.module.css'

const Dashboard = () => {
  return (
    <div className={styles.dashboard}>
      <div className="container">
        <div className={styles.header}>
          <h1>欢迎回来，学生！</h1>
          <p>这是你的学习总览面板</p>
        </div>
        
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <h3>进行中的课程</h3>
            <p className={styles.statNumber}>3</p>
          </div>
          <div className={styles.statCard}>
            <h3>本周任务</h3>
            <p className={styles.statNumber}>12</p>
          </div>
          <div className={styles.statCard}>
            <h3>完成率</h3>
            <p className={styles.statNumber}>78%</p>
          </div>
        </div>
        
        <div className={styles.content}>
          <div className={styles.section}>
            <h2>最近任务</h2>
            <div className={styles.taskList}>
              <div className={styles.taskItem}>
                <span className={styles.taskTitle}>历史论文初稿</span>
                <span className={styles.taskDue}>明天截止</span>
              </div>
              <div className={styles.taskItem}>
                <span className={styles.taskTitle}>数学作业</span>
                <span className={styles.taskDue}>3天后截止</span>
              </div>
            </div>
          </div>
          
          <div className={styles.section}>
            <h2>快速操作</h2>
            <div className={styles.actions}>
              <button className="btn btn-primary">上传新课程</button>
              <button className="btn btn-secondary">查看学习计划</button>
              <button className="btn btn-secondary">开始复习</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 