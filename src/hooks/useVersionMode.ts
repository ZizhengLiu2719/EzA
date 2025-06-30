import { getAvailableModesForGrade, getModeConfig } from '@/config/aiModeConfigs'
import { AcademicVersion, AIAssistantConfig, AIModeConfig, AIModeId } from '@/types'
import { useCallback, useEffect, useState } from 'react'

interface VersionModeState {
  currentVersion: AcademicVersion
  availableModes: AIModeConfig[]
  selectedModeId: AIModeId | null
  userGrade?: number
  aiConfig: AIAssistantConfig
}

interface UseVersionModeReturn {
  // State
  currentVersion: AcademicVersion
  availableModes: AIModeConfig[]
  selectedModeId: AIModeId | null
  selectedMode: AIModeConfig | null
  userGrade?: number
  aiConfig: AIAssistantConfig
  
  // Actions
  switchVersion: (version: AcademicVersion) => void
  selectMode: (modeId: AIModeId) => void
  updateUserGrade: (grade: number) => void
  updateAIConfig: (config: Partial<AIAssistantConfig>) => void
  
  // Utilities
  isHighSchoolMode: boolean
  isCollegeMode: boolean
  hasAdvancedModes: boolean
  getRecommendedVersion: () => AcademicVersion
}

const STORAGE_KEY = 'eza_version_mode_state'

export const useVersionMode = (initialGrade?: number): UseVersionModeReturn => {
  // Initialize state with sensible defaults
  const [state, setState] = useState<VersionModeState>(() => {
    // Try to load from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Validate the stored data structure
        if (parsed.currentVersion && parsed.aiConfig) {
          return {
            ...parsed,
            availableModes: getAvailableModesForGrade(parsed.currentVersion, parsed.userGrade)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load version mode state from localStorage:', error)
    }

    // Default initialization
    const defaultGrade = initialGrade || 13 // Default to college freshman
    const defaultVersion: AcademicVersion = defaultGrade <= 12 ? 'high_school' : 'college'
    const availableModes = getAvailableModesForGrade(defaultVersion, defaultGrade)
    
    return {
      currentVersion: defaultVersion,
      availableModes,
      selectedModeId: availableModes[0]?.id || null,
      userGrade: defaultGrade,
      aiConfig: {
        mode: availableModes[0]?.id || 'study_buddy',
        academicVersion: defaultVersion,
        model: 'gpt-3.5-turbo',
        difficulty_level: defaultVersion === 'high_school' ? 'beginner' : 'intermediate',
        citation_format: 'mla',
        userGrade: defaultGrade
      }
    }
  })

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.warn('Failed to save version mode state to localStorage:', error)
    }
  }, [state])

  // Switch between high school and college versions
  const switchVersion = useCallback((version: AcademicVersion) => {
    console.log(`🔄 Switching to ${version} version`)
    
    setState(prevState => {
      const newAvailableModes = getAvailableModesForGrade(version, prevState.userGrade)
      const newSelectedModeId = newAvailableModes[0]?.id || null
      
      const newState: VersionModeState = {
        ...prevState,
        currentVersion: version,
        availableModes: newAvailableModes,
        selectedModeId: newSelectedModeId,
        aiConfig: {
          ...prevState.aiConfig,
          mode: newSelectedModeId || 'study_buddy',
          academicVersion: version,
          difficulty_level: version === 'high_school' ? 'beginner' : 'intermediate'
        }
      }
      
      // Track analytics
      try {
        // Add analytics tracking here if available
        console.log('📊 Version switch tracked:', {
          from: prevState.currentVersion,
          to: version,
          userGrade: prevState.userGrade
        })
      } catch (error) {
        console.warn('Analytics tracking failed:', error)
      }
      
      return newState
    })
  }, [])

  // Select a specific AI mode
  const selectMode = useCallback((modeId: AIModeId) => {
    const modeConfig = getModeConfig(modeId)
    if (!modeConfig) {
      console.warn(`Mode ${modeId} not found`)
      return
    }

    // Check if mode is available for current version and grade
    const isAvailable = state.availableModes.some(mode => mode.id === modeId)
    if (!isAvailable) {
      console.warn(`Mode ${modeId} not available for current version/grade`)
      return
    }

    console.log(`🎯 Selecting AI mode: ${modeId}`)
    
    setState(prevState => ({
      ...prevState,
      selectedModeId: modeId,
      aiConfig: {
        ...prevState.aiConfig,
        mode: modeId
      }
    }))
  }, [state.availableModes])

  // Update user grade and potentially switch version
  const updateUserGrade = useCallback((grade: number) => {
    console.log(`📚 Updating user grade to: ${grade}`)
    
    setState(prevState => {
      const recommendedVersion: AcademicVersion = grade <= 12 ? 'high_school' : 'college'
      const shouldSwitchVersion = recommendedVersion !== prevState.currentVersion
      
      const newVersion = shouldSwitchVersion ? recommendedVersion : prevState.currentVersion
      const newAvailableModes = getAvailableModesForGrade(newVersion, grade)
      const newSelectedModeId = newAvailableModes[0]?.id || prevState.selectedModeId
      
      const newState: VersionModeState = {
        ...prevState,
        userGrade: grade,
        currentVersion: newVersion,
        availableModes: newAvailableModes,
        selectedModeId: newSelectedModeId,
        aiConfig: {
          ...prevState.aiConfig,
          userGrade: grade,
          academicVersion: newVersion,
          mode: newSelectedModeId || 'study_buddy',
          difficulty_level: newVersion === 'high_school' ? 'beginner' : 'intermediate'
        }
      }
      
      if (shouldSwitchVersion) {
        console.log(`🔄 Auto-switching to ${recommendedVersion} version based on grade`)
      }
      
      return newState
    })
  }, [])

  // Update AI configuration
  const updateAIConfig = useCallback((configUpdate: Partial<AIAssistantConfig>) => {
    console.log('⚙️ Updating AI config:', configUpdate)
    
    setState(prevState => ({
      ...prevState,
      aiConfig: {
        ...prevState.aiConfig,
        ...configUpdate
      }
    }))
  }, [])

  // Get recommended version based on user grade
  const getRecommendedVersion = useCallback((): AcademicVersion => {
    return state.userGrade && state.userGrade <= 12 ? 'high_school' : 'college'
  }, [state.userGrade])

  // Derived state
  const selectedMode = state.selectedModeId ? getModeConfig(state.selectedModeId) || null : null
  const isHighSchoolMode = state.currentVersion === 'high_school'
  const isCollegeMode = state.currentVersion === 'college'
  const hasAdvancedModes = Boolean(isHighSchoolMode && state.userGrade && state.userGrade >= 11)

  return {
    // State
    currentVersion: state.currentVersion,
    availableModes: state.availableModes,
    selectedModeId: state.selectedModeId,
    selectedMode,
    userGrade: state.userGrade,
    aiConfig: state.aiConfig,
    
    // Actions
    switchVersion,
    selectMode,
    updateUserGrade,
    updateAIConfig,
    
    // Utilities
    isHighSchoolMode,
    isCollegeMode,
    hasAdvancedModes,
    getRecommendedVersion
  }
}

// Helper hook for getting mode information
export const useModeInfo = () => {
  const getModeDescription = useCallback((modeId: AIModeId): string => {
    const mode = getModeConfig(modeId)
    return mode?.description || ''
  }, [])

  const getModeIcon = useCallback((modeId: AIModeId): string => {
    const mode = getModeConfig(modeId)
    return mode?.icon || '🤖'
  }, [])

  const isModeAvailable = useCallback((
    modeId: AIModeId, 
    version: AcademicVersion, 
    grade?: number
  ): boolean => {
    const availableModes = getAvailableModesForGrade(version, grade)
    return availableModes.some(mode => mode.id === modeId)
  }, [])

  return {
    getModeDescription,
    getModeIcon,
    isModeAvailable
  }
} 