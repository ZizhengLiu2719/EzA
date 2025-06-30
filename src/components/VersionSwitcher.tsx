import { AcademicVersion } from '@/types'
import { useState } from 'react'
import styles from './VersionSwitcher.module.css'

interface VersionSwitcherProps {
  currentVersion: AcademicVersion
  onVersionChange: (version: AcademicVersion) => void
  userGrade?: number
  disabled?: boolean
}

const VersionSwitcher: React.FC<VersionSwitcherProps> = ({
  currentVersion,
  onVersionChange,
  userGrade,
  disabled = false
}) => {
  const [showTooltip, setShowTooltip] = useState(false)

  const getVersionDescription = (version: AcademicVersion) => {
    switch (version) {
      case 'high_school':
        return 'Simplified modes designed for grades 9-12 students with age-appropriate guidance and homework support'
      case 'college':
        return 'Advanced modes for college-level academic work with sophisticated research and critical thinking support'
      default:
        return ''
    }
  }



  return (
    <div className={styles.versionSwitcher}>
      <div className={styles.switchHeader}>
        <span className={styles.switchLabel}>Academic Level</span>
        {userGrade && (
          <span className={styles.gradeIndicator}>
            {userGrade <= 12 ? `Grade ${userGrade}` : `Year ${userGrade - 12}`}
          </span>
        )}
      </div>
      
      <div className={styles.switchContainer}>
        <button
          className={`${styles.versionButton} ${styles.highSchool} ${
            currentVersion === 'high_school' ? styles.active : ''
          }`}
          onClick={() => !disabled && onVersionChange('high_school')}
          disabled={disabled}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className={styles.buttonIcon}>🏫</div>
          <div className={styles.buttonContent}>
            <div className={styles.buttonTitle}>High School</div>
            <div className={styles.buttonSubtitle}>Grades 9-12</div>
          </div>
        </button>
        
        <button
          className={`${styles.versionButton} ${styles.college} ${
            currentVersion === 'college' ? styles.active : ''
          }`}
          onClick={() => !disabled && onVersionChange('college')}
          disabled={disabled}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className={styles.buttonIcon}>🎓</div>
          <div className={styles.buttonContent}>
            <div className={styles.buttonTitle}>College</div>
            <div className={styles.buttonSubtitle}>Advanced</div>
          </div>
        </button>
      </div>
      
      {/* Version Description */}
      <div className={styles.versionDescription}>
        <div className={styles.descriptionIcon}>
          {currentVersion === 'high_school' ? '📚' : '🔬'}
        </div>
        <div className={styles.descriptionText}>
          {getVersionDescription(currentVersion)}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className={styles.featureHighlights}>
        {currentVersion === 'high_school' ? (
          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>🤗</span>
              <span>Friendly homework support</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>📝</span>
              <span>5-paragraph essay guidance</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>📊</span>
              <span>AP exam preparation</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>⏰</span>
              <span>Time management help</span>
            </div>
          </div>
        ) : (
          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>🧠</span>
              <span>Critical thinking development</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>📊</span>
              <span>Advanced research methods</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>🤝</span>
              <span>Collaboration strategies</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureIcon}>📝</span>
              <span>Thesis development</span>
            </div>
          </div>
        )}
      </div>

      {/* Mode Count */}
      <div className={styles.modeCount}>
        <span className={styles.countText}>
          {currentVersion === 'high_school' ? '8 specialized modes' : '12 advanced modes'}
        </span>
        {currentVersion === 'high_school' && userGrade && userGrade >= 11 && (
          <span className={styles.unlockText}>
            Advanced modes unlocked for grades 11-12
          </span>
        )}
      </div>
    </div>
  )
}

export default VersionSwitcher 