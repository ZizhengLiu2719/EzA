import styles from './QuizBattle.module.css'
import { useQuizStore } from './useQuizStore'

const PostGame = () => {
  const { participants } = useQuizStore()
  const sorted = [...participants].sort((a, b) => b.score - a.score)

  return (
    <div className={styles.centered}>
      <h2>Game Over</h2>
      <h3>Rankings</h3>
      <ol style={{ textAlign: 'left', maxWidth: 400, margin: '1rem auto', padding: 0 }}>
        {sorted.map((p, idx) => (
          <li key={p.id} className={styles.participantItem}>
            <span>#{idx + 1}</span>
            <span>{p.nickname}</span>
            <span>{p.score} pts</span>
          </li>
        ))}
      </ol>
      {/* TODO: call review import */}
    </div>
  )
}

export default PostGame 