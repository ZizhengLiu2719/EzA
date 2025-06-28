import { Link } from 'react-router-dom'
import styles from './Hero.module.css'

const Hero = () => {
  return (
    <section className={styles.hero}>
      {/* Cyber Grid Background */}
      <div className={styles.cyberGrid} />
      
      {/* Floating Geometric Shapes */}
      <div className={styles.floatingShapes}>
        <div className={`${styles.shape} ${styles.shape1}`} />
        <div className={`${styles.shape} ${styles.shape2}`} />
        <div className={`${styles.shape} ${styles.shape3}`} />
      </div>
      
      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.title} data-text="Upload your syllabus. I'll handle the rest.">
              Upload your syllabus.
              <br />
              <span className={styles.highlight}>I'll handle the rest.</span>
            </h1>
            
            <p className={styles.subtitle}>
              Let AI guide you through the entire semester, transforming chaos into control.
              <br />
              From course start to successful completion.
            </p>
            
            {/* Stats Ticker */}
            <div className={styles.statsTicker}>
              <div className={styles.statItem}>
                <span className={styles.statEmoji}>🔥</span>
                <span>2.3K+ students vibing</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statEmoji}>⚡</span>
                <span>15K+ tasks completed</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statEmoji}>🏆</span>
                <span>98% success rate</span>
              </div>
            </div>
            
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
            <div className={styles.interfacePreview}>
              <div className={styles.previewCard}>
                <div className={styles.previewIcon}>🤖</div>
                <div className={styles.previewText}>Smart Learning Interface</div>
                <div className={styles.previewSubtext}>Powered by Advanced AI</div>
              </div>
              
              {/* Floating Elements around Preview */}
              <div className={`${styles.floatingElement} ${styles.element1}`}>📚</div>
              <div className={`${styles.floatingElement} ${styles.element2}`}>🎯</div>
              <div className={`${styles.floatingElement} ${styles.element3}`}>⚡</div>
              <div className={`${styles.floatingElement} ${styles.element4}`}>🚀</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero 