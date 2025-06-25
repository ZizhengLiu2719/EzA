import { Link } from 'react-router-dom'
import styles from './Hero.module.css'

const Hero = () => {
  return (
    <section className={styles.hero}>
      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.title}>
              Upload your syllabus.
              <br />
              <span className={styles.highlight}>I'll handle the rest.</span>
            </h1>
            <p className={styles.subtitle}>
              让AI引导你整个学期，真正从混乱中走向掌控。
              <br />
              从课程开始，一路顺利走向成功。
            </p>
            <div className={styles.ctaGroup}>
              <Link to="/register" className={`btn btn-primary ${styles.ctaPrimary}`}>
                立即开始免费试用
              </Link>
              <Link to="/login" className={`btn btn-secondary ${styles.ctaSecondary}`}>
                已有账户？登录
              </Link>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.placeholder}>
              <div className={styles.placeholderContent}>
                <div className={styles.placeholderIcon}>📚</div>
                <p>智能学习界面预览</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero 