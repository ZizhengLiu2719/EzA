import { getAvailableModesForGrade, getModeConfig } from '@/config/aiModeConfigs'
import { AcademicVersion, AIAssistantConfig, AIModeConfig, AIModeId } from '@/types'
import { useCallback, useEffect, useMemo, useState } from 'react'

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
      
      return {
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
    })
  }, [])

  // Select a specific AI mode
  const selectMode = useCallback((modeId: AIModeId) => {
    const modeConfig = getModeConfig(modeId)
    if (!modeConfig) {
      console.warn(`Mode ${modeId} not found`)
      return
    }

    setState(prevState => {
      // Check if mode is available for current version and grade
      const isAvailable = prevState.availableModes.some(mode => mode.id === modeId)
      if (!isAvailable) {
        console.warn(`Mode ${modeId} not available for current version/grade`)
        return prevState
      }

      console.log(`🎯 Selecting AI mode: ${modeId}`)
      
      return {
        ...prevState,
        selectedModeId: modeId,
        aiConfig: {
          ...prevState.aiConfig,
          mode: modeId
        }
      }
    })
  }, [])

  // Update user grade and potentially switch version
  const updateUserGrade = useCallback((grade: number) => {
    console.log(`📚 Updating user grade to: ${grade}`)
    
    setState(prevState => {
      const recommendedVersion: AcademicVersion = grade <= 12 ? 'high_school' : 'college'
      const shouldSwitchVersion = recommendedVersion !== prevState.currentVersion
      
      const newVersion = shouldSwitchVersion ? recommendedVersion : prevState.currentVersion
      const newAvailableModes = getAvailableModesForGrade(newVersion, grade)
      const newSelectedModeId = newAvailableModes[0]?.id || prevState.selectedModeId
      
      return {
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
    const currentGrade = state.userGrade
    return currentGrade && currentGrade <= 12 ? 'high_school' : 'college'
  }, [state.userGrade])

  // Derived state - 使用useMemo避免每次重新计算
  const derivedState = useMemo(() => {
    const selectedMode = state.selectedModeId ? getModeConfig(state.selectedModeId) || null : null
    const isHighSchoolMode = state.currentVersion === 'high_school'
    const isCollegeMode = state.currentVersion === 'college'
    const hasAdvancedModes = Boolean(isHighSchoolMode && state.userGrade && state.userGrade >= 11)
    
    return {
      selectedMode,
      isHighSchoolMode,
      isCollegeMode,
      hasAdvancedModes
    }
  }, [state.selectedModeId, state.currentVersion, state.userGrade])

  // 返回对象使用useMemo优化
  return useMemo(() => ({
    // State
    currentVersion: state.currentVersion,
    availableModes: state.availableModes,
    selectedModeId: state.selectedModeId,
    selectedMode: derivedState.selectedMode,
    userGrade: state.userGrade,
    aiConfig: state.aiConfig,
    
    // Actions
    switchVersion,
    selectMode,
    updateUserGrade,
    updateAIConfig,
    
    // Utilities
    isHighSchoolMode: derivedState.isHighSchoolMode,
    isCollegeMode: derivedState.isCollegeMode,
    hasAdvancedModes: derivedState.hasAdvancedModes,
    getRecommendedVersion
  }), [
    state.currentVersion,
    state.availableModes,
    state.selectedModeId,
    state.userGrade,
    state.aiConfig,
    derivedState.selectedMode,
    derivedState.isHighSchoolMode,
    derivedState.isCollegeMode,
    derivedState.hasAdvancedModes,
    switchVersion,
    selectMode,
    updateUserGrade,
    updateAIConfig,
    getRecommendedVersion
  ])
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