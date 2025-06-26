import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './FeatureSteps.module.css';

const steps = [
  {
    icon: '📚',
    title: '课程导入中心',
    description: '上传syllabus、教材、讲义，1分钟内掌握整个学期结构',
    link: '/upload'
  },
  {
    icon: '📖',
    title: '本学期课程总览',
    description: '查看和管理你本学期所有已上传syllabus的课程信息',
    link: '/courses'
  },
  {
    icon: '📅',
    title: '智能任务引擎',
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

const FeatureSteps = () => {
  useEffect(() => {
    setTimeout(() => {
    }, 100);
  }, []);

  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>EzA 六大核心模块</h2>
          <p className={styles.subtitle}>
            从课程导入到考试准备，一站式智能学习解决方案
          </p>
        </div>
        <div className={styles.stepsGrid}>
          {steps.map((step, index) => {
            return step.link ? (
              <Link to={step.link} key={index + '-' + step.title} className={styles.step} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className={styles.stepIcon}>{step.icon}</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDescription}>{step.description}</p>
                </div>
              </Link>
            ) : (
              <div key={index + '-' + step.title} className={styles.step}>
                <div className={styles.stepIcon}>{step.icon}</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDescription}>{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  )
}

export default FeatureSteps