import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSpacedRepetition } from '../hooks/useSpacedRepetition';
import { Flashcard, FlashcardSet, ReviewRating } from '../types/SRSTypes';
import styles from './TestModeStudy.module.css';

interface TestModeStudyProps {
  flashcardSet: FlashcardSet;
  onComplete: (stats: StudySessionStats) => void;
  onExit: () => void;
}

interface StudySessionStats {
  totalCards: number;
  correctAnswers: number;
  totalTime: number;
  accuracy: number;
  averageResponseTime: number;
  cardResults: CardResult[];
}

interface CardResult {
  cardId: string;
  correct: boolean;
  responseTime: number;
  attempts: number;
  rating: ReviewRating;
}

interface TestQuestion {
  id: string;
  type: 'multiple_choice' | 'fill_blank' | 'true_false' | 'matching';
  question: string;
  correctAnswer: string;
  options?: string[];
  userAnswer?: string;
  timeSpent: number;
  attempts: number;
}

const TestModeStudy: React.FC<TestModeStudyProps> = ({
  flashcardSet,
  onComplete,
  onExit
}) => {
  // Note: Currently not using SRS features in test mode, but hook available for future enhancement
  const {
    submitReview,
    isLoading,
    error
  } = useSpacedRepetition([]);
  
  // Suppress unused variable warnings for now
  void submitReview;
  void isLoading; 
  void error;

  // Test state
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [testComplete, setTestComplete] = useState(false);
  const [cardResults, setCardResults] = useState<CardResult[]>([]);

  // Test configuration
  const [testConfig, setTestConfig] = useState({
    timeLimit: 30, // minutes
    questionCount: Math.min(flashcardSet.flashcards.length, 20),
    shuffleQuestions: true,
    showTimer: true,
    allowReview: false
  });

  // Generate test questions from flashcards
  const testQuestions = useMemo(() => {
    let cards = [...flashcardSet.flashcards];
    if (testConfig.shuffleQuestions) {
      cards = cards.sort(() => Math.random() - 0.5);
    }
    
    return cards.slice(0, testConfig.questionCount).map((card, index) => {
      const questionTypes = ['multiple_choice', 'fill_blank', 'true_false'];
      const type = questionTypes[Math.floor(Math.random() * questionTypes.length)] as TestQuestion['type'];
      
      let options: string[] | undefined;
      let question = card.front;
      let correctAnswer = card.back;

      if (type === 'multiple_choice') {
        // Generate distractors
        const otherCards = flashcardSet.flashcards.filter((c: Flashcard) => c.id !== card.id);
        const distractors = otherCards
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((c: Flashcard) => c.back);
        
        options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
      } else if (type === 'true_false') {
        options = ['True', 'False'];
        // For true/false, we might modify the question
        if (Math.random() > 0.5) {
          // Make it false by using wrong answer
          const wrongCard = flashcardSet.flashcards.find((c: Flashcard) => c.id !== card.id);
          if (wrongCard) {
            question = `${card.front} → ${wrongCard.back}`;
            correctAnswer = 'False';
          } else {
            correctAnswer = 'True';
          }
        } else {
          question = `${card.front} → ${card.back}`;
          correctAnswer = 'True';
        }
      }

      return {
        id: card.id,
        type,
        question,
        correctAnswer,
        options,
        timeSpent: 0,
        attempts: 1
      } as TestQuestion;
    });
  }, [flashcardSet.flashcards, testConfig]);

  const currentQuestion = testQuestions[currentQuestionIndex];

  // Timer effect
  useEffect(() => {
    if (!testStarted || testComplete || showResult) return;

    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
      
      // Check if time limit exceeded
      if (testConfig.timeLimit > 0 && timeElapsed >= testConfig.timeLimit * 60) {
        handleTestComplete();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, testComplete, showResult, timeElapsed, testConfig.timeLimit]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRemainingTime = () => {
    if (testConfig.timeLimit === 0) return null;
    const remaining = (testConfig.timeLimit * 60) - timeElapsed;
    return Math.max(0, remaining);
  };

  const handleAnswerSubmit = useCallback(() => {
    if (!currentQuestion) return;

    const questionTime = Date.now() - questionStartTime;
    const isCorrect = checkAnswer();

    // Update question with time spent
    testQuestions[currentQuestionIndex].timeSpent = questionTime / 1000;

    // Create card result
    const result: CardResult = {
      cardId: currentQuestion.id,
      correct: isCorrect,
      responseTime: questionTime / 1000,
      attempts: currentQuestion.attempts,
      rating: isCorrect ? ReviewRating.GOOD : ReviewRating.AGAIN
    };

    setCardResults(prev => [...prev, result]);
    setShowResult(true);

    // Auto-advance after showing result
    setTimeout(() => {
      if (currentQuestionIndex < testQuestions.length - 1) {
        nextQuestion();
      } else {
        handleTestComplete();
      }
    }, 2000);
  }, [currentQuestion, currentQuestionIndex, questionStartTime, userAnswer, selectedOption]);

  const checkAnswer = (): boolean => {
    if (!currentQuestion) return false;

    switch (currentQuestion.type) {
      case 'multiple_choice':
        return selectedOption !== null && 
               currentQuestion.options?.[selectedOption] === currentQuestion.correctAnswer;
      case 'fill_blank':
        return userAnswer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
      case 'true_false':
        return selectedOption !== null && 
               currentQuestion.options?.[selectedOption] === currentQuestion.correctAnswer;
      default:
        return false;
    }
  };

  const nextQuestion = () => {
    setCurrentQuestionIndex(prev => prev + 1);
    setUserAnswer('');
    setSelectedOption(null);
    setShowResult(false);
    setQuestionStartTime(Date.now());
  };

  const handleTestComplete = () => {
    setTestComplete(true);
    
    const stats: StudySessionStats = {
      totalCards: testQuestions.length,
      correctAnswers: cardResults.filter(r => r.correct).length,
      totalTime: timeElapsed,
      accuracy: cardResults.length > 0 ? cardResults.filter(r => r.correct).length / cardResults.length : 0,
      averageResponseTime: cardResults.length > 0 ? cardResults.reduce((sum, r) => sum + r.responseTime, 0) / cardResults.length : 0,
      cardResults
    };

    onComplete(stats);
  };

  const startTest = () => {
    setTestStarted(true);
    setQuestionStartTime(Date.now());
  };

  const renderConfigScreen = () => (
    <div className={styles.configScreen}>
      <div className={styles.configCard}>
        <h2>Test Configuration</h2>
        <p className={styles.setTitle}>{flashcardSet.title}</p>
        
        <div className={styles.configOptions}>
          <div className={styles.configOption}>
            <label>Time Limit (minutes, 0 = unlimited):</label>
            <input
              type="number"
              min="0"
              max="180"
              value={testConfig.timeLimit}
              onChange={(e) => setTestConfig(prev => ({
                ...prev,
                timeLimit: parseInt(e.target.value) || 0
              }))}
            />
          </div>

          <div className={styles.configOption}>
            <label>Number of Questions:</label>
            <input
              type="number"
              min="5"
              max={flashcardSet.flashcards.length}
              value={testConfig.questionCount}
              onChange={(e) => setTestConfig(prev => ({
                ...prev,
                questionCount: Math.min(parseInt(e.target.value) || 5, flashcardSet.flashcards.length)
              }))}
            />
          </div>

          <div className={styles.configOption}>
            <label>
              <input
                type="checkbox"
                checked={testConfig.shuffleQuestions}
                onChange={(e) => setTestConfig(prev => ({
                  ...prev,
                  shuffleQuestions: e.target.checked
                }))}
              />
              Shuffle Questions
            </label>
          </div>

          <div className={styles.configOption}>
            <label>
              <input
                type="checkbox"
                checked={testConfig.showTimer}
                onChange={(e) => setTestConfig(prev => ({
                  ...prev,
                  showTimer: e.target.checked
                }))}
              />
              Show Timer
            </label>
          </div>
        </div>

        <div className={styles.configActions}>
          <button className={styles.cancelButton} onClick={onExit}>
            Cancel
          </button>
          <button className={styles.startButton} onClick={startTest}>
            Start Test
          </button>
        </div>
      </div>
    </div>
  );

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    return (
      <div className={styles.questionCard}>
        <div className={styles.questionHeader}>
          <div className={styles.progress}>
            Question {currentQuestionIndex + 1} of {testQuestions.length}
          </div>
          {testConfig.showTimer && (
            <div className={styles.timer}>
              {getRemainingTime() !== null ? (
                <span className={getRemainingTime()! < 300 ? styles.timeWarning : ''}>
                  {formatTime(getRemainingTime()!)} remaining
                </span>
              ) : (
                <span>{formatTime(timeElapsed)}</span>
              )}
            </div>
          )}
        </div>

        <div className={styles.questionContent}>
          <h3>{currentQuestion.question}</h3>

          {currentQuestion.type === 'multiple_choice' && (
            <div className={styles.options}>
              {currentQuestion.options?.map((option, index) => (
                <button
                  key={index}
                  className={`${styles.option} ${selectedOption === index ? styles.selected : ''}`}
                  onClick={() => setSelectedOption(index)}
                  disabled={showResult}
                >
                  {String.fromCharCode(65 + index)}. {option}
                </button>
              ))}
            </div>
          )}

          {currentQuestion.type === 'fill_blank' && (
            <div className={styles.fillBlank}>
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer..."
                disabled={showResult}
                onKeyPress={(e) => e.key === 'Enter' && !showResult && handleAnswerSubmit()}
              />
            </div>
          )}

          {currentQuestion.type === 'true_false' && (
            <div className={styles.trueFalse}>
              {currentQuestion.options?.map((option, index) => (
                <button
                  key={index}
                  className={`${styles.tfOption} ${selectedOption === index ? styles.selected : ''}`}
                  onClick={() => setSelectedOption(index)}
                  disabled={showResult}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {showResult && (
          <div className={`${styles.result} ${checkAnswer() ? styles.correct : styles.incorrect}`}>
            <div className={styles.resultIcon}>
              {checkAnswer() ? '✓' : '✗'}
            </div>
            <div className={styles.resultText}>
              {checkAnswer() ? 'Correct!' : `Incorrect. The answer is: ${currentQuestion.correctAnswer}`}
            </div>
          </div>
        )}

        {!showResult && (
          <div className={styles.questionActions}>
            <button 
              className={styles.submitButton}
              onClick={handleAnswerSubmit}
              disabled={
                (currentQuestion.type === 'multiple_choice' && selectedOption === null) ||
                (currentQuestion.type === 'true_false' && selectedOption === null) ||
                (currentQuestion.type === 'fill_blank' && !userAnswer.trim())
              }
            >
              Submit Answer
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
    const accuracy = cardResults.length > 0 ? cardResults.filter(r => r.correct).length / cardResults.length : 0;
    const averageTime = cardResults.length > 0 ? cardResults.reduce((sum, r) => sum + r.responseTime, 0) / cardResults.length : 0;

    return (
      <div className={styles.resultsScreen}>
        <div className={styles.resultsCard}>
          <h2>Test Complete!</h2>
          
          <div className={styles.scoreSection}>
            <div className={styles.mainScore}>
              <span className={styles.percentage}>{Math.round(accuracy * 100)}%</span>
              <span className={styles.scoreLabel}>Accuracy</span>
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{cardResults.filter(r => r.correct).length}</span>
              <span className={styles.statLabel}>Correct</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{cardResults.filter(r => !r.correct).length}</span>
              <span className={styles.statLabel}>Incorrect</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{formatTime(timeElapsed)}</span>
              <span className={styles.statLabel}>Total Time</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{averageTime.toFixed(1)}s</span>
              <span className={styles.statLabel}>Avg. Time</span>
            </div>
          </div>

          <div className={styles.resultActions}>
            <button className={styles.retakeButton} onClick={() => window.location.reload()}>
              Retake Test
            </button>
            <button className={styles.finishButton} onClick={onExit}>
              Finish
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (testComplete) {
    return renderResults();
  }

  if (!testStarted) {
    return renderConfigScreen();
  }

  return (
    <div className={styles.testMode}>
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill}
          style={{ width: `${((currentQuestionIndex + 1) / testQuestions.length) * 100}%` }}
        />
      </div>
      {renderQuestion()}
    </div>
  );
};

export default TestModeStudy; 