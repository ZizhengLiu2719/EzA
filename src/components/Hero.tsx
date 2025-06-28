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
              Let AI guide you through the entire semester, transforming chaos into control.
              <br />
              From course start to successful completion.
            </p>
            <div className={styles.ctaGroup}>
              <Link to="/register" className={`btn btn-primary ${styles.ctaPrimary}`}>
                Start Free Trial
              </Link>
              <Link to="/login" className={`btn btn-secondary ${styles.ctaSecondary}`}>
                Already have an account? Sign In
              </Link>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.placeholder}>
              <div className={styles.placeholderContent}>
                <div className={styles.placeholderIcon}>📚</div>
                <p>Smart Learning Interface Preview</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero 