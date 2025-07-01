import Lobby from './Lobby'
import PostGame from './PostGame'
import QuestionView from './QuestionView'
import QuizHome from './QuizHome'
import { useQuizStore } from './useQuizStore'

const QuizBattle = () => {
  const { status, sessionId } = useQuizStore((s) => ({ status: s.status, sessionId: s.sessionId }))

  if (!sessionId) return <QuizHome />
  if (status === 'waiting') return <Lobby />
  if (status === 'playing') return <QuestionView />
  return <PostGame />
}

export default QuizBattle 