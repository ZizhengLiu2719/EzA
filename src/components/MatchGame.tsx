import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './MatchGame.module.css'

interface Card {
  id: string
  text: string
  type: 'term' | 'definition'
  matchId: string
  isMatched: boolean
  position: { x: number; y: number }
}

interface MatchGameProps {
  cards: Array<{
    id: string
    question: string
    answer: string
    subject: string
  }>
}

const MatchGame: React.FC<MatchGameProps> = ({ cards }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const gameAreaRef = useRef<HTMLDivElement>(null)
  
  const [gameCards, setGameCards] = useState<Card[]>([])
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [matches, setMatches] = useState<number>(0)
  const [timer, setTimer] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [personalBest, setPersonalBest] = useState<number | null>(null)
  const [streak, setStreak] = useState(0)
  const [wrongAttempts, setWrongAttempts] = useState(0)

  // Initialize game
  useEffect(() => {
    if (cards.length === 0) return

    // Create term and definition cards
    const newCards: Card[] = []
    cards.slice(0, 6).forEach((card, index) => { // Limit to 6 pairs for now
      // Term card
      newCards.push({
        id: `term-${card.id}`,
        text: card.question,
        type: 'term',
        matchId: card.id,
        isMatched: false,
        position: { x: 0, y: 0 }
      })
      
      // Definition card
      newCards.push({
        id: `def-${card.id}`,
        text: card.answer,
        type: 'definition',
        matchId: card.id,
        isMatched: false,
        position: { x: 0, y: 0 }
      })
    })

    // Shuffle cards
    const shuffledCards = [...newCards].sort(() => Math.random() - 0.5)
    
    // Set random positions
    shuffledCards.forEach((card, index) => {
      const row = Math.floor(index / 4)
      const col = index % 4
      card.position = {
        x: col * 200 + Math.random() * 50,
        y: row * 150 + Math.random() * 50
      }
    })

    setGameCards(shuffledCards)
    setIsPlaying(true)
  }, [cards])

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && !gameCompleted) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, gameCompleted])

  // Check for game completion
  useEffect(() => {
    if (gameCards.length > 0 && gameCards.every(card => card.isMatched)) {
      setGameCompleted(true)
      setIsPlaying(false)
      
      // Update personal best
      const currentTime = timer
      if (!personalBest || currentTime < personalBest) {
        setPersonalBest(currentTime)
        localStorage.setItem('matchGameBest', currentTime.toString())
      }
    }
  }, [gameCards, timer, personalBest])

  // Load personal best from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('matchGameBest')
    if (saved) {
      setPersonalBest(parseInt(saved))
    }
  }, [])

  const handleCardClick = (card: Card) => {
    if (card.isMatched) return

    if (!selectedCard) {
      setSelectedCard(card)
    } else if (selectedCard.id === card.id) {
      // Deselect same card
      setSelectedCard(null)
    } else if (selectedCard.matchId === card.matchId) {
      // Correct match!
      setGameCards(prev => prev.map(c => 
        c.matchId === card.matchId 
          ? { ...c, isMatched: true }
          : c
      ))
      setSelectedCard(null)
      setMatches(prev => prev + 1)
      setStreak(prev => prev + 1)
      
      // Add celebration animation
      const matchedCards = gameCards.filter(c => c.matchId === card.matchId)
      matchedCards.forEach(c => {
        const element = document.getElementById(c.id)
        if (element) {
          element.classList.add(styles.matchSuccess)
        }
      })
    } else {
      // Wrong match
      setSelectedCard(card)
      setWrongAttempts(prev => prev + 1)
      setStreak(0)
      
      // Add shake animation to wrong selection
      const element = document.getElementById(selectedCard.id)
      if (element) {
        element.classList.add(styles.wrongShake)
        setTimeout(() => {
          element.classList.remove(styles.wrongShake)
        }, 500)
      }
    }
  }

  const resetGame = () => {
    setGameCards([])
    setSelectedCard(null)
    setMatches(0)
    setTimer(0)
    setIsPlaying(false)
    setGameCompleted(false)
    setStreak(0)
    setWrongAttempts(0)
    
    // Reinitialize
    setTimeout(() => {
      const newCards: Card[] = []
      cards.slice(0, 6).forEach((card) => {
        newCards.push({
          id: `term-${card.id}`,
          text: card.question,
          type: 'term',
          matchId: card.id,
          isMatched: false,
          position: { x: 0, y: 0 }
        })
        
        newCards.push({
          id: `def-${card.id}`,
          text: card.answer,
          type: 'definition',
          matchId: card.id,
          isMatched: false,
          position: { x: 0, y: 0 }
        })
      })

      const shuffledCards = [...newCards].sort(() => Math.random() - 0.5)
      
      shuffledCards.forEach((card, index) => {
        const row = Math.floor(index / 4)
        const col = index % 4
        card.position = {
          x: col * 200 + Math.random() * 50,
          y: row * 150 + Math.random() * 50
        }
      })

      setGameCards(shuffledCards)
      setIsPlaying(true)
    }, 100)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getAccuracy = () => {
    const totalAttempts = matches + wrongAttempts
    return totalAttempts > 0 ? Math.round((matches / totalAttempts) * 100) : 100
  }

  if (gameCompleted) {
    return (
      <div className={styles.completionScreen}>
        <div className={styles.completionCard}>
          <div className={styles.celebrationIcon}>🎉</div>
          <h2>Excellent Work!</h2>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{formatTime(timer)}</span>
              <span className={styles.statLabel}>Final Time</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{getAccuracy()}%</span>
              <span className={styles.statLabel}>Accuracy</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{matches}</span>
              <span className={styles.statLabel}>Matches</span>
            </div>
            {personalBest && (
              <div className={styles.statItem}>
                <span className={styles.statValue}>{formatTime(personalBest)}</span>
                <span className={styles.statLabel}>Personal Best</span>
              </div>
            )}
          </div>
          
          <div className={styles.actions}>
            <button className={styles.playAgainBtn} onClick={resetGame}>
              <span className={styles.actionIcon}>🔄</span>
              Play Again
            </button>
            <button className={styles.backBtn} onClick={() => navigate(-1)}>
              <span className={styles.actionIcon}>←</span>
              Back to Study
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.matchGame}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.gameInfo}>
          <h1>Match Game</h1>
          <p>Click on matching terms and definitions</p>
        </div>
        
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{formatTime(timer)}</span>
            <span className={styles.statLabel}>Time</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{matches}/{cards.slice(0, 6).length}</span>
            <span className={styles.statLabel}>Matches</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{getAccuracy()}%</span>
            <span className={styles.statLabel}>Accuracy</span>
          </div>
          {streak > 0 && (
            <div className={styles.statCard + ' ' + styles.streakCard}>
              <span className={styles.statValue}>{streak}</span>
              <span className={styles.statLabel}>Streak 🔥</span>
            </div>
          )}
        </div>

        <div className={styles.controls}>
          <button className={styles.controlBtn} onClick={resetGame}>
            <span className={styles.controlIcon}>🔄</span>
            Reset
          </button>
          <button className={styles.controlBtn} onClick={() => navigate(-1)}>
            <span className={styles.controlIcon}>✕</span>
            Exit
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div className={styles.gameArea} ref={gameAreaRef}>
        {gameCards.map(card => (
          <div
            key={card.id}
            id={card.id}
            className={`
              ${styles.gameCard} 
              ${card.type === 'term' ? styles.termCard : styles.defCard}
              ${selectedCard?.id === card.id ? styles.selected : ''}
              ${card.isMatched ? styles.matched : ''}
            `}
            style={{
              left: card.position.x,
              top: card.position.y,
            }}
            onClick={() => handleCardClick(card)}
          >
            <div className={styles.cardContent}>
              <div className={styles.cardType}>
                {card.type === 'term' ? '📝' : '💡'}
              </div>
              <div className={styles.cardText}>{card.text}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className={styles.instructions}>
        <div className={styles.instructionItem}>
          <span className={styles.instructionIcon}>📝</span>
          <span>Terms (questions)</span>
        </div>
        <div className={styles.instructionItem}>
          <span className={styles.instructionIcon}>💡</span>
          <span>Definitions (answers)</span>
        </div>
        <div className={styles.instructionItem}>
          <span className={styles.instructionIcon}>🎯</span>
          <span>Click matching pairs to eliminate them</span>
        </div>
      </div>
    </div>
  )
}

export default MatchGame 