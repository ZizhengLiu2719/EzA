import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSpacedRepetition } from '../hooks/useSpacedRepetition';
import { FlashcardSet, ReviewRating } from '../types/SRSTypes';
import styles from './GravityGameStudy.module.css';

interface GravityGameStudyProps {
  flashcardSet: FlashcardSet;
  onComplete: (stats: GameSessionStats) => void;
  onExit: () => void;
}

interface GameSessionStats {
  totalCards: number;
  correctAnswers: number;
  totalTime: number;
  accuracy: number;
  finalScore: number;
  level: number;
  wordsPerMinute: number;
  cardResults: CardResult[];
}

interface CardResult {
  cardId: string;
  correct: boolean;
  responseTime: number;
  attempts: number;
  rating: ReviewRating;
  points: number;
}

interface FallingCard {
  id: string;
  question: string;
  answer: string;
  cardId: string;
  x: number;
  y: number;
  speed: number;
  active: boolean;
  timeSpawned: number;
}

interface GameConfig {
  lives: number;
  fallSpeed: number;
  spawnRate: number;
  pointsPerCorrect: number;
  timeBonusMultiplier: number;
  speedIncrease: number;
  livesLostPerMiss: number;
}

const GravityGameStudy: React.FC<GravityGameStudyProps> = ({
  flashcardSet,
  onComplete,
  onExit
}) => {
  // SRS Hook (for future integration)
  const {
    submitReview,
    isLoading,
    error
  } = useSpacedRepetition([]);
  
  // Suppress unused variable warnings for now
  void submitReview;
  void isLoading; 
  void error;

  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [currentInput, setCurrentInput] = useState('');
  const [fallingCards, setFallingCards] = useState<FallingCard[]>([]);
  const [cardResults, setCardResults] = useState<CardResult[]>([]);
  const [gameTime, setGameTime] = useState(0);
  const [wordsTyped, setWordsTyped] = useState(0);
  const [currentCombo, setCurrentCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  // Game configuration
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    lives: 3,
    fallSpeed: 1,
    spawnRate: 2000, // milliseconds
    pointsPerCorrect: 100,
    timeBonusMultiplier: 10,
    speedIncrease: 0.1,
    livesLostPerMiss: 1
  });

  // Refs
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSpawnTime = useRef<number>(0);
  const gameLoopRef = useRef<number>();
  const animationRef = useRef<number>();

  // Available cards for spawning
  const availableCards = useMemo(() => {
    return flashcardSet.flashcards.map(card => ({
      id: card.id,
      question: card.front,
      answer: card.back.toLowerCase().trim(),
      cardId: card.id
    }));
  }, [flashcardSet.flashcards]);

  // Game area dimensions
  const gameAreaWidth = 800;
  const gameAreaHeight = 600;

  // Game timer effect
  useEffect(() => {
    if (!gameStarted || gameOver || gamePaused) return;

    const timer = setInterval(() => {
      setGameTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver, gamePaused]);

  // Level progression
  useEffect(() => {
    const newLevel = Math.floor(score / 1000) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
      // Increase difficulty
      setGameConfig(prev => ({
        ...prev,
        fallSpeed: prev.fallSpeed + prev.speedIncrease,
        spawnRate: Math.max(1000, prev.spawnRate - 100)
      }));
    }
  }, [score, level]);

  // Game over check
  useEffect(() => {
    if (lives <= 0 && !gameOver) {
      endGame();
    }
  }, [lives, gameOver]);

  // Main game loop
  const gameLoop = useCallback(() => {
    if (gameOver || gamePaused) return;

    const now = Date.now();
    
    // Spawn new cards
    if (now - lastSpawnTime.current > gameConfig.spawnRate) {
      spawnCard();
      lastSpawnTime.current = now;
    }

    // Update falling cards
    setFallingCards(prevCards => {
      return prevCards.map(card => {
        if (!card.active) return card;

        const newY = card.y + gameConfig.fallSpeed;

        // Check if card hit bottom
        if (newY > gameAreaHeight) {
          handleCardMiss(card);
          return { ...card, active: false };
        }

        return { ...card, y: newY };
      }).filter(card => card.active || card.y <= gameAreaHeight);
    });

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameOver, gamePaused, gameConfig.spawnRate, gameConfig.fallSpeed, gameAreaHeight]);

  // Start game loop
  useEffect(() => {
    if (gameStarted && !gameOver && !gamePaused) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted, gameOver, gamePaused, gameLoop]);

  const spawnCard = useCallback(() => {
    if (availableCards.length === 0) return;

    const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
    const x = Math.random() * (gameAreaWidth - 200); // Account for card width

    const newCard: FallingCard = {
      id: `falling_${Date.now()}_${Math.random()}`,
      question: randomCard.question,
      answer: randomCard.answer,
      cardId: randomCard.cardId,
      x,
      y: 0,
      speed: gameConfig.fallSpeed,
      active: true,
      timeSpawned: Date.now()
    };

    setFallingCards(prev => [...prev, newCard]);
  }, [availableCards, gameAreaWidth, gameConfig.fallSpeed]);

  const handleCardMiss = useCallback((card: FallingCard) => {
    setLives(prev => Math.max(0, prev - gameConfig.livesLostPerMiss));
    setCurrentCombo(0);

    // Create card result for miss
    const result: CardResult = {
      cardId: card.cardId,
      correct: false,
      responseTime: (Date.now() - card.timeSpawned) / 1000,
      attempts: 1,
      rating: ReviewRating.AGAIN,
      points: 0
    };

    setCardResults(prev => [...prev, result]);
  }, [gameConfig.livesLostPerMiss]);

  const handleInputSubmit = useCallback(() => {
    const input = currentInput.toLowerCase().trim();
    if (!input) return;

    // Find matching falling card
    const matchingCard = fallingCards.find(card => 
      card.active && card.answer === input
    );

    if (matchingCard) {
      // Correct answer
      const responseTime = (Date.now() - matchingCard.timeSpawned) / 1000;
      const timeBonus = Math.max(0, Math.floor((5 - responseTime) * gameConfig.timeBonusMultiplier));
      const comboBonus = currentCombo * 10;
      const points = gameConfig.pointsPerCorrect + timeBonus + comboBonus;

      setScore(prev => prev + points);
      setCurrentCombo(prev => prev + 1);
      setMaxCombo(prev => Math.max(prev, currentCombo + 1));
      setWordsTyped(prev => prev + 1);

      // Remove the card
      setFallingCards(prev => 
        prev.map(card => 
          card.id === matchingCard.id ? { ...card, active: false } : card
        )
      );

      // Create card result
      const result: CardResult = {
        cardId: matchingCard.cardId,
        correct: true,
        responseTime,
        attempts: 1,
        rating: responseTime < 3 ? ReviewRating.EASY : responseTime < 5 ? ReviewRating.GOOD : ReviewRating.HARD,
        points
      };

      setCardResults(prev => [...prev, result]);

    } else {
      // Wrong answer - just clear input, don't penalize
      setCurrentCombo(0);
    }

    setCurrentInput('');
  }, [currentInput, fallingCards, gameConfig, currentCombo]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputSubmit();
    } else if (e.key === 'Escape') {
      setGamePaused(prev => !prev);
    }
  }, [handleInputSubmit]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setLives(gameConfig.lives);
    setCurrentInput('');
    setFallingCards([]);
    setCardResults([]);
    setGameTime(0);
    setWordsTyped(0);
    setCurrentCombo(0);
    setMaxCombo(0);
    lastSpawnTime.current = Date.now();
    
    // Focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const endGame = () => {
    setGameOver(true);
    
    const accuracy = cardResults.length > 0 ? cardResults.filter(r => r.correct).length / cardResults.length : 0;
    const wpm = gameTime > 0 ? Math.round((wordsTyped / gameTime) * 60) : 0;

    const stats: GameSessionStats = {
      totalCards: cardResults.length,
      correctAnswers: cardResults.filter(r => r.correct).length,
      totalTime: gameTime,
      accuracy,
      finalScore: score,
      level,
      wordsPerMinute: wpm,
      cardResults
    };

    onComplete(stats);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderConfigScreen = () => (
    <div className={styles.configScreen}>
      <div className={styles.configCard}>
        <h2>🎮 Gravity Challenge</h2>
        <p className={styles.setTitle}>{flashcardSet.title}</p>
        
        <div className={styles.gameInstructions}>
          <h3>How to Play:</h3>
          <ul>
            <li>🃏 Cards will fall from the top</li>
            <li>⌨️ Type the correct answer quickly</li>
            <li>🎯 Hit Enter to submit your answer</li>
            <li>💙 Don't let cards hit the bottom!</li>
            <li>🔥 Build combos for bonus points</li>
            <li>⏸️ Press Escape to pause</li>
          </ul>
        </div>

        <div className={styles.configOptions}>
          <div className={styles.configOption}>
            <label>Lives:</label>
            <select 
              value={gameConfig.lives}
              onChange={(e) => setGameConfig(prev => ({
                ...prev,
                lives: parseInt(e.target.value)
              }))}
            >
              <option value={3}>3 Lives (Easy)</option>
              <option value={5}>5 Lives (Normal)</option>
              <option value={1}>1 Life (Hard)</option>
            </select>
          </div>

          <div className={styles.configOption}>
            <label>Fall Speed:</label>
            <select 
              value={gameConfig.fallSpeed}
              onChange={(e) => setGameConfig(prev => ({
                ...prev,
                fallSpeed: parseFloat(e.target.value)
              }))}
            >
              <option value={0.5}>Slow</option>
              <option value={1}>Normal</option>
              <option value={1.5}>Fast</option>
              <option value={2}>Very Fast</option>
            </select>
          </div>
        </div>

        <div className={styles.configActions}>
          <button className={styles.cancelButton} onClick={onExit}>
            Back
          </button>
          <button className={styles.startButton} onClick={startGame}>
            Start Game
          </button>
        </div>
      </div>
    </div>
  );

  const renderGameUI = () => (
    <div className={styles.gameUI}>
      <div className={styles.gameStats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Score</span>
          <span className={styles.statValue}>{score.toLocaleString()}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Level</span>
          <span className={styles.statValue}>{level}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Lives</span>
          <span className={styles.statValue}>
            {'💙'.repeat(lives)}
            {'🤍'.repeat(Math.max(0, gameConfig.lives - lives))}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Combo</span>
          <span className={styles.statValue}>
            {currentCombo > 0 ? `🔥 x${currentCombo}` : '—'}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Time</span>
          <span className={styles.statValue}>{formatTime(gameTime)}</span>
        </div>
      </div>
    </div>
  );

  const renderGameArea = () => (
    <div 
      ref={gameAreaRef}
      className={styles.gameArea}
      style={{ width: gameAreaWidth, height: gameAreaHeight }}
    >
      {fallingCards.filter(card => card.active).map(card => (
        <div
          key={card.id}
          className={styles.fallingCard}
          style={{
            left: card.x,
            top: card.y,
            transform: `translateY(${card.y}px)`
          }}
        >
          <div className={styles.cardQuestion}>{card.question}</div>
        </div>
      ))}
    </div>
  );

  const renderInputArea = () => (
    <div className={styles.inputArea}>
      <input
        ref={inputRef}
        type="text"
        value={currentInput}
        onChange={(e) => setCurrentInput(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type your answer and press Enter..."
        className={styles.gameInput}
        disabled={gamePaused || gameOver}
      />
      <button 
        className={styles.submitButton}
        onClick={handleInputSubmit}
        disabled={!currentInput.trim() || gamePaused || gameOver}
      >
        Submit
      </button>
    </div>
  );

  const renderPauseMenu = () => (
    <div className={styles.pauseMenu}>
      <div className={styles.pauseCard}>
        <h3>Game Paused</h3>
        <div className={styles.pauseStats}>
          <p>Score: {score.toLocaleString()}</p>
          <p>Level: {level}</p>
          <p>Lives: {lives}</p>
          <p>Best Combo: {maxCombo}</p>
        </div>
        <div className={styles.pauseActions}>
          <button onClick={() => setGamePaused(false)}>Resume</button>
          <button onClick={onExit}>Quit Game</button>
        </div>
      </div>
    </div>
  );

  const renderGameOverScreen = () => {
    const accuracy = cardResults.length > 0 ? cardResults.filter(r => r.correct).length / cardResults.length : 0;
    const wpm = gameTime > 0 ? Math.round((wordsTyped / gameTime) * 60) : 0;

    return (
      <div className={styles.gameOverScreen}>
        <div className={styles.gameOverCard}>
          <h2>🎮 Game Over!</h2>
          
          <div className={styles.finalScore}>
            <span className={styles.scoreNumber}>{score.toLocaleString()}</span>
            <span className={styles.scoreLabel}>Final Score</span>
          </div>

          <div className={styles.gameOverStats}>
            <div className={styles.gameOverStat}>
              <span className={styles.statNumber}>{level}</span>
              <span className={styles.statLabel}>Level Reached</span>
            </div>
            <div className={styles.gameOverStat}>
              <span className={styles.statNumber}>{Math.round(accuracy * 100)}%</span>
              <span className={styles.statLabel}>Accuracy</span>
            </div>
            <div className={styles.gameOverStat}>
              <span className={styles.statNumber}>{wpm}</span>
              <span className={styles.statLabel}>Words/Min</span>
            </div>
            <div className={styles.gameOverStat}>
              <span className={styles.statNumber}>{maxCombo}</span>
              <span className={styles.statLabel}>Best Combo</span>
            </div>
            <div className={styles.gameOverStat}>
              <span className={styles.statNumber}>{formatTime(gameTime)}</span>
              <span className={styles.statLabel}>Time Played</span>
            </div>
            <div className={styles.gameOverStat}>
              <span className={styles.statNumber}>{cardResults.filter(r => r.correct).length}</span>
              <span className={styles.statLabel}>Cards Caught</span>
            </div>
          </div>

          <div className={styles.gameOverActions}>
            <button className={styles.playAgainButton} onClick={startGame}>
              Play Again
            </button>
            <button className={styles.finishButton} onClick={onExit}>
              Finish
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!gameStarted) {
    return renderConfigScreen();
  }

  if (gameOver) {
    return renderGameOverScreen();
  }

  return (
    <div className={styles.gravityGame}>
      {renderGameUI()}
      <div className={styles.gameContainer}>
        {renderGameArea()}
        {gamePaused && renderPauseMenu()}
      </div>
      {renderInputArea()}
    </div>
  );
};

export default GravityGameStudy; 