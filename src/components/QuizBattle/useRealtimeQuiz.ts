import { useEffect } from 'react'
import { supabase } from '../../api/supabase'
import { useQuizStore } from './useQuizStore'

/**
 * Subscribes to realtime quiz events based on the current sessionId.
 * Automatically updates Zustand store with incoming payloads.
 */
export const useRealtimeQuiz = () => {
  const { sessionId, setState } = useQuizStore((s) => ({
    sessionId: s.sessionId,
    setState: s.setState,
  }))

  useEffect(() => {
    if (!sessionId) return

    const channel = supabase.channel(`quiz:session:${sessionId}`)
      .on('broadcast', { event: 'SCORE_UPDATE' }, (payload) => {
        const { participantId, total } = payload.payload as { participantId: string; total: number }
        const current = useQuizStore.getState().participants
        setState({
          participants: current.map((p) => (p.id === participantId ? { ...p, score: total } : p)),
        })
      })
      // Listen for generic session events (START, NEXT_Q, END)
      .on('broadcast', { event: 'SESSION_START' }, (payload) => {
        setState({ status: 'playing' })
      })
      .on('broadcast', { event: 'SESSION_END' }, (payload) => {
        setState({ status: 'ended' })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, setState])
} 