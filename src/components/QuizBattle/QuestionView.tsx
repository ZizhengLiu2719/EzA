import { useCallback } from 'react'
import { supabase } from '../../api/supabase'
import styles from './QuizBattle.module.css'
import { useQuizStore } from './useQuizStore'
import { useRealtimeQuiz } from './useRealtimeQuiz'

const QuestionView = () => {
  const { questions, currentQIndex, participants, nickname, sessionId, setState } = useQuizStore()
  useRealtimeQuiz()

  const currentQ = questions[currentQIndex]

  const handleChoose = useCallback(
    async (idx: number) => {
      if (!sessionId || !currentQ) return
      const participant = participants.find((p) => p.isMe)
      if (!participant) return

      setState({ currentQIndex: currentQIndex + 1 })

      await supabase.functions.invoke('submit_answer', {
        body: {
          session_id: sessionId,
          participant_id: participant.id,
          flashcard_id: currentQ.id,
          chosen_idx: idx,
          latency: 500, // TODO: track actual latency
        },
      })
    },
    [sessionId, currentQ, participants, currentQIndex, setState],
  )

  if (!currentQ) return <div className={styles.centered}>Loading question...</div>

  return (
    <div className={styles.centered}>
      <h3>{currentQ.text}</h3>
      <div style={{ display: 'grid', gap: '16px', maxWidth: '480px', margin: '24px auto' }}>
        {currentQ.options.map((opt, idx) => (
          <button key={idx} onClick={() => handleChoose(idx)} className={`${styles.button} ${styles.secondary}`}>
            {opt}
          </button>
        ))}
      </div>
      <p style={{ opacity: 0.6 }}>Player: {nickname}</p>
    </div>
  )
}

export default QuestionView 