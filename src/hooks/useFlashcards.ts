/**
 * useFlashcards Hook - Simplified Version
 * 提供基本的flashcard sets数据管理功能
 */

import { useCallback, useEffect, useState } from 'react'
import {
    createFlashcardSet,
    CreateFlashcardSetData,
    FlashcardSetWithStats,
    getFlashcardSets
} from '../api/flashcards'
import { useUser } from '../context/UserContext'

export interface UseFlashcardsReturn {
  // Data
  flashcardSets: FlashcardSetWithStats[]
  isLoading: boolean
  isCreating: boolean
  error: string | null
  
  // Actions
  createSet: (data: CreateFlashcardSetData) => Promise<void>
  refreshSets: () => Promise<void>
  clearError: () => void
}

export const useFlashcards = (): UseFlashcardsReturn => {
  const { user } = useUser()
  
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSetWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFlashcardSets = useCallback(async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      setError(null)
      const sets = await getFlashcardSets()
      setFlashcardSets(sets)
    } catch (err) {
      console.error('Error loading flashcard sets:', err)
      setError(err instanceof Error ? err.message : 'Failed to load flashcard sets')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  const createSet = useCallback(async (data: CreateFlashcardSetData): Promise<void> => {
    try {
      setIsCreating(true)
      setError(null)
      await createFlashcardSet(data)
      // Refresh the sets list after creation
      await loadFlashcardSets()
    } catch (err) {
      console.error('Error creating flashcard set:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create flashcard set'
      setError(errorMessage)
      throw err
    } finally {
      setIsCreating(false)
    }
  }, [loadFlashcardSets])

  const refreshSets = useCallback(async () => {
    await loadFlashcardSets()
  }, [loadFlashcardSets])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  useEffect(() => {
    if (user?.id) {
      loadFlashcardSets()
    } else {
      setFlashcardSets([])
      setIsLoading(false)
    }
  }, [user?.id, loadFlashcardSets])

  return {
    flashcardSets,
    isLoading,
    isCreating,
    error,
    createSet,
    refreshSets,
    clearError
  }
} 