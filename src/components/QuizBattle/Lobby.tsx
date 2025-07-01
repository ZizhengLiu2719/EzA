import styles from './QuizBattle.module.css'
import { useQuizStore } from './useQuizStore'
import { useRealtimeQuiz } from './useRealtimeQuiz'

const Lobby = () => {
  const { participants, pin, isHost, setState } = useQuizStore()

  useRealtimeQuiz()

  const handleStart = () => {
    // Host triggers session start – placeholder edge call
    // In real impl. call supabase.functions.invoke('start_quiz_session', { body: { session_id }})
    setState({ status: 'playing' })
  }

  return (
    <div className={styles.centered}>
      <h2>Lobby</h2>
      <div className={styles.pin}>{pin}</div>

      <h3>Participants ({participants.length})</h3>
      <ul className={styles.participantsList}>
        {participants.map((p) => (
          <li key={p.id} className={styles.participantItem}>
            <span>{p.nickname}</span>
            <span>{p.score} pts</span>
          </li>
        ))}
      </ul>

      {isHost && (
        <button onClick={handleStart} className={`${styles.button} ${styles.primary}`}>Start Quiz</button>
      )}
    </div>
  )
}

export default Lobby 