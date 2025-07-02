import { Solution } from '@/types'
import { supabase } from './supabase'

export interface ProblemHistoryItem {
  id: string
  created_at: string
  problem_type: 'text' | 'image'
  problem_input: string
  ai_solution: Solution | null
  problem_title: string
}

/**
 * Fetches the problem solving history for the current user.
 * @returns A promise that resolves to an array of history items.
 */
export const getProblemHistory = async (): Promise<ProblemHistoryItem[]> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('problem_solving_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50) // Limit to the last 50 problems

  if (error) {
    console.error('Error fetching problem history:', error)
    throw error
  }

  return data as ProblemHistoryItem[]
}

interface SaveProblemData {
  problem_type: 'text' | 'image'
  problem_input: string
  ai_solution: Solution
  problem_title: string
}

/**
 * Saves a solved problem to the user's history.
 * @param problemData The data for the problem to save.
 * @returns A promise that resolves to the saved history item.
 */
export const saveProblemToHistory = async (problemData: SaveProblemData): Promise<ProblemHistoryItem> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('problem_solving_history')
    .insert({
      ...problemData,
      user_id: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving problem to history:', error)
    throw error
  }

  return data as ProblemHistoryItem
}

/**
 * Deletes a specific problem from the user's history.
 * @param historyId The ID of the history item to delete.
 */
export const deleteProblemHistory = async (historyId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('problem_solving_history')
    .delete()
    .eq('id', historyId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting problem history:', error)
    throw error
  }
}

/**
 * Deletes all problem solving history for the current user.
 */
export const deleteAllProblemHistory = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('problem_solving_history')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting all problem history:', error)
    throw error
  }
} 