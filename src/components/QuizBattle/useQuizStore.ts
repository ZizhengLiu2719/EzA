import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface QuizQuestion {
  id: string
  text: string
  options: string[]
  correctIndex: number
}

export interface Participant {
  id: string
  nickname: string
  score: number
  isMe?: boolean
}

export interface QuizState {
  // Session details
  sessionId?: string
  pin?: string
  status: 'waiting' | 'playing' | 'ended'
  // Questions & progress
  currentQIndex: number
  questions: QuizQuestion[]
  // Participants
  participants: Participant[]
  // Client role
  isHost: boolean
  nickname?: string
  // Actions
  setState: (partial: Partial<QuizState>) => void
  reset: () => void
}

const baseState = {
  status: 'waiting' as QuizState['status'],
  currentQIndex: 0,
  questions: [] as QuizQuestion[],
  participants: [] as Participant[],
  isHost: false,
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      ...baseState,
      setState: (partial) => set(partial),
      reset: () => set(baseState),
    }),
    {
      name: 'quiz-battle-store',
    },
  ),
) 