import { AIModeConfig, AIModeId, AcademicVersion } from '@/types'
import { useState } from 'react'
import styles from './AIModeSelector.module.css'

interface AIModeSelectorProps {
  availableModes: AIModeConfig[]
  selectedModeId: AIModeId | null
  onModeSelect: (modeId: AIModeId) => void
  academicVersion: AcademicVersion
  userGrade?: number
  disabled?: boolean
  showExamples?: boolean
}

const AIModeSelector: React.FC<AIModeSelectorProps> = ({
  availableModes,
  selectedModeId,
  onModeSelect,
  academicVersion,
  userGrade,
  disabled = false,
  showExamples = true
}) => {
  const [expandedMode, setExpandedMode] = useState<AIModeId | null>(null)

  const getCategoryModes = (category: 'core' | 'advanced' | 'specialized') => {
    switch (category) {
      case 'core':
        return availableModes.filter(mode => 
          !mode.requiredGrade && !mode.subjectSpecialization
        )
      case 'advanced':
        return availableModes.filter(mode => 
          mode.requiredGrade && academicVersion === 'high_school'
        )
      case 'specialized':
        return availableModes.filter(mode => 
          mode.subjectSpecialization && academicVersion === 'college'
        )
      default:
        return []
    }
  }

  const isModeLocked = (mode: AIModeConfig): boolean => {
    if (mode.requiredGrade && userGrade) {
      return userGrade < mode.requiredGrade
    }
    return false
  }

  const renderModeCard = (mode: AIModeConfig) => {
    const isSelected = selectedModeId === mode.id
    const isLocked = isModeLocked(mode)
    const isExpanded = expandedMode === mode.id

    return (
      <div 
        key={mode.id}
        className={`${styles.modeCard} ${
          isSelected ? styles.selected : ''
        } ${isLocked ? styles.locked : ''}`}
        onClick={() => {
          if (!disabled && !isLocked) {
            onModeSelect(mode.id)
          }
        }}
      >
        <div className={styles.modeHeader}>
          <div className={styles.modeIcon}>{mode.icon}</div>
          <div className={styles.modeInfo}>
            <div className={styles.modeName}>{mode.name}</div>
            <div className={styles.modeDescription}>{mode.description}</div>
            {mode.subjectSpecialization && (
              <div className={styles.specializations}>
                {mode.subjectSpecialization.slice(0, 2).map(subject => (
                  <span key={subject} className={styles.specializationTag}>
                    {subject.replace('_', ' ')}
                  </span>
                ))}
                {mode.subjectSpecialization.length > 2 && (
                  <span className={styles.specializationTag}>
                    +{mode.subjectSpecialization.length - 2} more
                  </span>
                )}
              </div>
            )}
          </div>
          <div className={styles.modeActions}>
            {isLocked && (
              <div className={styles.lockIcon} title={`Unlocks at grade ${mode.requiredGrade}`}>
                🔒
              </div>
            )}
            {isSelected && (
              <div className={styles.selectedIcon}>✓</div>
            )}
            {showExamples && (
              <button
                className={styles.expandButton}
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedMode(isExpanded ? null : mode.id)
                }}
                disabled={disabled}
              >
                {isExpanded ? '↑' : '↓'}
              </button>
            )}
          </div>
        </div>
        
        {isExpanded && showExamples && (
          <div className={styles.modeExample}>
            <div className={styles.exampleLabel}>Example Usage:</div>
            <div className={styles.exampleText}>"{mode.example}"</div>
            <div className={styles.modeStats}>
              <div className={styles.statItem}>
                <span className={styles.statIcon}>💬</span>
                <span>{mode.maxTokens} max tokens</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statIcon}>🎯</span>
                <span>{mode.responseStyle} style</span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderModeCategory = (title: string, modes: AIModeConfig[]) => {
    if (modes.length === 0) return null

    return (
      <div className={styles.modeCategory}>
        <div className={styles.categoryHeader}>
          <h3 className={styles.categoryTitle}>{title}</h3>
          <span className={styles.categoryCount}>{modes.length} modes</span>
        </div>
        <div className={styles.categoryModes}>
          {modes.map(renderModeCard)}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.aiModeSelector}>
      <div className={styles.selectorHeader}>
        <div className={styles.headerTitle}>
          🤖 Choose Your AI Assistant
        </div>
        <div className={styles.headerSubtitle}>
          {academicVersion === 'high_school' 
            ? 'Perfect for high school students' 
            : 'Advanced modes for college success'}
        </div>
      </div>

      <div className={styles.modeCategories}>
        {academicVersion === 'high_school' ? (
          <>
            {renderModeCategory('Essential Modes', getCategoryModes('core'))}
            {userGrade && userGrade >= 11 && renderModeCategory('Advanced Modes (Grades 11-12)', getCategoryModes('advanced'))}
          </>
        ) : (
          <>
            {renderModeCategory('General Academic Support', getCategoryModes('core'))}
            {renderModeCategory('Subject Specialists', getCategoryModes('specialized'))}
          </>
        )}
      </div>

      {/* Quick Stats */}
      <div className={styles.quickStats}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{availableModes.length}</span>
          <span className={styles.statLabel}>Available Modes</span>
        </div>
        {academicVersion === 'high_school' && userGrade && userGrade < 11 && (
          <div className={styles.statCard}>
            <span className={styles.statNumber}>3</span>
            <span className={styles.statLabel}>Unlock at Grade 11</span>
          </div>
        )}
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{selectedModeId ? '1' : '0'}</span>
          <span className={styles.statLabel}>Selected</span>
        </div>
      </div>
    </div>
  )
}

export default AIModeSelector 