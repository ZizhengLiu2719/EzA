import { useState } from 'react'
import { supabase } from '../../api/supabase'
import styles from './QuizBattle.module.css'
import { useQuizStore } from './useQuizStore'

/**
 * QuizHome – landing screen for the Quiz Battle module.
 * 1. Teachers (hosts) can create a session from an existing flashcard set.
 * 2. Students / guests can join with a 6-digit PIN.
 */
const QuizHome = () => {
  const [flashcardSetId, setFlashcardSetId] = useState('')
  const [questionCount, setQuestionCount] = useState(10)
  const [joinPin, setJoinPin] = useState('')
  const { setState } = useQuizStore((s) => ({ setState: s.setState }))

  // Host creates a new session
  const handleCreateSession = async () => {
    if (!flashcardSetId) return alert('Please input a Flashcard Set ID (placeholder)')

    const { data, error } = await supabase.functions.invoke('create_quiz_session', {
      body: { flashcard_set_id: flashcardSetId, question_count: questionCount },
    })
    if (error) return alert(error.message)

    const { sessionId, pin, questions } = data as any
    setState({ sessionId, pin, questions, isHost: true })
  }

  // Player joins an existing session
  const handleJoinSession = async () => {
    if (joinPin.length !== 6) return alert('PIN should be 6 digits')

    const nickname = prompt('Enter your nickname')
    if (!nickname) return

    const { data, error } = await supabase.functions.invoke('join_quiz_session', {
      body: { pin: joinPin, nickname },
    })
    if (error) return alert(error.message)

    const { sessionId, participantId, questions } = data as any
    setState({ sessionId, participants: [{ id: participantId, nickname, score: 0, isMe: true }], questions, nickname, isHost: false })
  }

  return (
    <div className={styles.container}>
      {/* Host panel */}
      <div className={styles.panel}>
        <h3 className={styles.panelHeader}>Create Quiz Battle</h3>
        <input
          type="text"
          placeholder="Flashcard Set ID"
          value={flashcardSetId}
          onChange={(e) => setFlashcardSetId(e.target.value)}
          className={styles.input}
        />
        <input
          type="number"
          min={5}
          max={50}
          value={questionCount}
          onChange={(e) => setQuestionCount(Number(e.target.value))}
          className={styles.input}
        />
        <button onClick={handleCreateSession} className={`${styles.button} ${styles.primary}`}>
          Create Session
        </button>
      </div>

      {/* Join panel */}
      <div className={styles.panel}>
        <h3 className={styles.panelHeader}>Join Quiz Battle</h3>
        <input
          type="text"
          placeholder="Enter 6-digit PIN"
          value={joinPin}
          onChange={(e) => setJoinPin(e.target.value)}
          className={styles.input}
        />
        <button onClick={handleJoinSession} className={`${styles.button} ${styles.secondary}`}>
          Join Session
        </button>
      </div>
    </div>
  )
}

export default QuizHome 