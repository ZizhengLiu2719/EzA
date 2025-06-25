import styles from './FeatureSteps.module.css'

const FeatureSteps = () => {
  const steps = [
    {
      icon: '📚',
      title: '上传课程资料',
      description: '上传syllabus、教材、讲义，1分钟内掌握整个学期结构'
    },
    {
      icon: '📅',
      title: '智能任务规划',
      description: '自动生成学习路径图，子任务拆解，与日历同步'
    },
    {
      icon: '🤖',
      title: 'AI学习助理',
      description: '写作引导、STEM解题、阅读摘要，全方位AI辅导'
    },
    {
      icon: '📊',
      title: '每周反馈教练',
      description: '任务完成率分析、拖延指数、个性化建议'
    },
    {
      icon: '🧠',
      title: '复习与考试准备',
      description: '自动生成复习卡、模拟题、错题追踪'
    }
  ]

  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>EzA 五大核心模块</h2>
          <p className={styles.subtitle}>
            从课程导入到考试准备，一站式智能学习解决方案
          </p>
        </div>
        
        <div className={styles.stepsGrid}>
          {steps.map((step, index) => (
            <div key={index} className={styles.step}>
              <div className={styles.stepIcon}>{step.icon}</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeatureSteps 