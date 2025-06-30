import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSpacedRepetition } from '../hooks/useSpacedRepetition';
import { Flashcard, FlashcardSet, ReviewRating } from '../types/SRSTypes';
import styles from './AITutorStudy.module.css';

interface AITutorStudyProps {
  flashcardSet: FlashcardSet;
  onComplete: (stats: TutorSessionStats) => void;
  onExit: () => void;
}

interface TutorSessionStats {
  totalCards: number;
  correctAnswers: number;
  totalTime: number;
  accuracy: number;
  messagesExchanged: number;
  conceptsMastered: string[];
  cardResults: CardResult[];
}

interface CardResult {
  cardId: string;
  correct: boolean;
  responseTime: number;
  attempts: number;
  rating: ReviewRating;
  aiAssistanceUsed: boolean;
}

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  cardId?: string;
  messageType?: 'question' | 'answer' | 'hint' | 'explanation' | 'encouragement' | 'correction';
}

interface SessionConfig {
  aiPersonality: 'encouraging' | 'professional' | 'friendly' | 'academic';
  hintLevel: 'minimal' | 'moderate' | 'generous';
  explanationDepth: 'basic' | 'detailed' | 'comprehensive';
  interactionStyle: 'guided' | 'conversational' | 'socratic';
}

interface StudyProgress {
  currentCardIndex: number;
  cardsReviewed: number;
  totalCards: number;
  currentStreak: number;
  conceptsIntroduced: string[];
  difficultyLevel: number;
}

const AITutorStudy: React.FC<AITutorStudyProps> = ({
  flashcardSet,
  onComplete,
  onExit
}) => {
  // SRS Hook
  const {
    submitReview,
    isLoading: srsLoading,
    error: srsError
  } = useSpacedRepetition([]);
  
  // Suppress unused variable warnings for now
  void submitReview;
  void srsLoading; 
  void srsError;

  // Session state
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cardResults, setCardResults] = useState<CardResult[]>([]);
  const [sessionTime, setSessionTime] = useState(0);

  // Study progress
  const [progress, setProgress] = useState<StudyProgress>({
    currentCardIndex: 0,
    cardsReviewed: 0,
    totalCards: flashcardSet.flashcards.length,
    currentStreak: 0,
    conceptsIntroduced: [],
    difficultyLevel: 1
  });

  // Configuration
  const [config, setConfig] = useState<SessionConfig>({
    aiPersonality: 'encouraging',
    hintLevel: 'moderate',
    explanationDepth: 'detailed',
    interactionStyle: 'conversational'
  });

  // Current learning state
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [awaitingAnswer, setAwaitingAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [answerAttempts, setAnswerAttempts] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Available cards
  const availableCards = useMemo(() => {
    return flashcardSet.flashcards.filter(card => 
      !cardResults.some(result => result.cardId === card.id && result.correct)
    );
  }, [flashcardSet.flashcards, cardResults]);

  // Session timer
  useEffect(() => {
    if (!sessionStarted || sessionComplete) return;

    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStarted, sessionComplete]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize session
  const startSession = useCallback(() => {
    setSessionStarted(true);
    setSessionTime(0);
    setMessages([]);
    setCardResults([]);
    setProgress(prev => ({ ...prev, currentCardIndex: 0, cardsReviewed: 0 }));

    // Welcome message
    const welcomeMessage: Message = {
      id: `msg_${Date.now()}`,
      type: 'ai',
      content: getWelcomeMessage(),
      timestamp: new Date(),
      messageType: 'system'
    };

    setMessages([welcomeMessage]);

    // Start with first card after a delay
    setTimeout(() => {
      presentNextCard();
    }, 2000);
  }, [config]);

  const getWelcomeMessage = (): string => {
    const personalityMessages = {
      encouraging: "🌟 Hello there! I'm your AI learning companion, and I'm so excited to help you master these concepts! We'll take this journey together at your own pace. Ready to begin?",
      professional: "Welcome to your personalized tutoring session. I'm here to guide you through the material systematically and ensure you achieve mastery. Let's begin with our structured learning approach.",
      friendly: "Hey! 👋 I'm your friendly AI tutor, and I can't wait to help you learn! Don't worry if you make mistakes - that's how we learn best. Let's dive in and have some fun with this!",
      academic: "Greetings. I am your academic advisor for this learning session. We will employ evidence-based pedagogical methods to ensure comprehensive understanding and retention. Shall we commence?"
    };

    return personalityMessages[config.aiPersonality];
  };

  const presentNextCard = useCallback(() => {
    if (availableCards.length === 0) {
      completeSession();
      return;
    }

    const nextCard = availableCards[progress.currentCardIndex % availableCards.length];
    setCurrentCard(nextCard);
    setAwaitingAnswer(true);
    setAnswerAttempts(0);
    setShowHint(false);
    setStartTime(new Date());

    const questionMessage: Message = {
      id: `msg_${Date.now()}`,
      type: 'ai',
      content: formatQuestion(nextCard),
      timestamp: new Date(),
      cardId: nextCard.id,
      messageType: 'question'
    };

    setMessages(prev => [...prev, questionMessage]);
  }, [availableCards, progress.currentCardIndex]);

  const formatQuestion = (card: Flashcard): string => {
    const styles = {
      guided: `Let's work on this concept: **${card.front}**\n\nTake your time and give me your best answer. If you need help, just ask!`,
      conversational: `Here's an interesting one for you: **${card.front}**\n\nWhat do you think? Share your thoughts with me!`,
      socratic: `Consider this: **${card.front}**\n\nRather than just giving an answer, tell me what you know about this concept and how you would approach it.`
    };

    return styles[config.interactionStyle];
  };

  const handleUserMessage = useCallback(async (message: string) => {
    if (!currentCard || !awaitingAnswer) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date(),
      cardId: currentCard.id
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setIsLoading(true);

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const isCorrect = checkAnswer(message, currentCard.back);
    setAnswerAttempts(prev => prev + 1);

    if (isCorrect) {
      handleCorrectAnswer();
    } else {
      handleIncorrectAnswer(message);
    }

    setIsTyping(false);
    setIsLoading(false);
  }, [currentCard, awaitingAnswer, answerAttempts]);

  const checkAnswer = (userAnswer: string, correctAnswer: string): boolean => {
    const normalize = (text: string) => text.toLowerCase().trim().replace(/[^\w\s]/g, '');
    const userNormalized = normalize(userAnswer);
    const correctNormalized = normalize(correctAnswer);

    // Exact match
    if (userNormalized === correctNormalized) return true;

    // Partial match (70% similarity)
    const similarity = calculateSimilarity(userNormalized, correctNormalized);
    return similarity >= 0.7;
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  };

  const handleCorrectAnswer = () => {
    if (!currentCard || !startTime) return;

    const responseTime = (Date.now() - startTime.getTime()) / 1000;
    const rating = answerAttempts === 1 ? ReviewRating.EASY : 
                   answerAttempts === 2 ? ReviewRating.GOOD : ReviewRating.HARD;

    // Create card result
    const result: CardResult = {
      cardId: currentCard.id,
      correct: true,
      responseTime,
      attempts: answerAttempts,
      rating,
      aiAssistanceUsed: showHint
    };

    setCardResults(prev => [...prev, result]);

    // Update progress
    setProgress(prev => ({
      ...prev,
      cardsReviewed: prev.cardsReviewed + 1,
      currentStreak: prev.currentStreak + 1,
      currentCardIndex: prev.currentCardIndex + 1
    }));

    // AI response
    const aiResponse: Message = {
      id: `msg_${Date.now()}`,
      type: 'ai',
      content: getCorrectResponseMessage(),
      timestamp: new Date(),
      cardId: currentCard.id,
      messageType: 'encouragement'
    };

    setMessages(prev => [...prev, aiResponse]);
    setAwaitingAnswer(false);

    // Move to next card
    setTimeout(() => {
      presentNextCard();
    }, 2000);
  };

  const handleIncorrectAnswer = (userAnswer: string) => {
    if (!currentCard) return;

    let aiResponse = '';

    if (answerAttempts === 1) {
      aiResponse = getFirstAttemptResponse(userAnswer);
    } else if (answerAttempts === 2) {
      aiResponse = getSecondAttemptResponse();
    } else {
      // Final attempt - show answer and move on
      aiResponse = getFinalAttemptResponse(currentCard.back);
      
      const responseTime = startTime ? (Date.now() - startTime.getTime()) / 1000 : 0;
      const result: CardResult = {
        cardId: currentCard.id,
        correct: false,
        responseTime,
        attempts: answerAttempts,
        rating: ReviewRating.AGAIN,
        aiAssistanceUsed: true
      };

      setCardResults(prev => [...prev, result]);
      setProgress(prev => ({
        ...prev,
        cardsReviewed: prev.cardsReviewed + 1,
        currentStreak: 0,
        currentCardIndex: prev.currentCardIndex + 1
      }));

      setAwaitingAnswer(false);
      setTimeout(() => {
        presentNextCard();
      }, 3000);
    }

    const responseMessage: Message = {
      id: `msg_${Date.now()}`,
      type: 'ai',
      content: aiResponse,
      timestamp: new Date(),
      cardId: currentCard.id,
      messageType: answerAttempts >= 3 ? 'correction' : 'hint'
    };

    setMessages(prev => [...prev, responseMessage]);
  };

  const getCorrectResponseMessage = (): string => {
    const responses = {
      encouraging: [
        "🎉 Excellent work! You've got it absolutely right!",
        "🌟 Fantastic! You're really getting the hang of this!",
        "👏 Perfect answer! I'm so proud of your progress!",
        "✨ Amazing! You nailed that one!"
      ],
      professional: [
        "Correct. Well done on demonstrating mastery of this concept.",
        "Accurate response. Your understanding is progressing well.",
        "Precisely right. Excellent analytical thinking.",
        "Correct answer. Your comprehension is solid."
      ],
      friendly: [
        "Yes! 🙌 You totally got that one right!",
        "Awesome sauce! 😄 That's exactly right!",
        "Boom! 💥 Nailed it perfectly!",
        "Sweet! 🎯 You're on fire today!"
      ],
      academic: [
        "Exemplary response demonstrating comprehensive understanding.",
        "Your answer reflects thorough conceptual mastery.",
        "Correct. This indicates strong analytical capabilities.",
        "Accurate. Your scholarly approach is commendable."
      ]
    };

    const personalityResponses = responses[config.aiPersonality];
    return personalityResponses[Math.floor(Math.random() * personalityResponses.length)];
  };

  const getFirstAttemptResponse = (userAnswer: string): string => {
    return `I can see you're thinking about this! Your answer "${userAnswer}" shows good reasoning, but let's refine it a bit. ${getHintMessage()}`;
  };

  const getSecondAttemptResponse = (): string => {
    setShowHint(true);
    return `Let me give you a stronger hint to guide you in the right direction: ${getHintMessage()}`;
  };

  const getFinalAttemptResponse = (correctAnswer: string): string => {
    return `No worries! The correct answer is: **${correctAnswer}**. ${getExplanationMessage()} Let's move on to the next one!`;
  };

  const getHintMessage = (): string => {
    if (!currentCard) return '';

    const hintStrategies = {
      minimal: `Think about the key concept here.`,
      moderate: `Consider the first few letters: ${currentCard.back.substring(0, 2)}...`,
      generous: `Here's a strong hint: ${currentCard.hint || `The answer starts with "${currentCard.back.charAt(0)}" and has ${currentCard.back.length} letters.`}`
    };

    return hintStrategies[config.hintLevel];
  };

  const getExplanationMessage = (): string => {
    if (!currentCard) return '';

    return currentCard.explanation || 
           "This is an important concept to remember for future reference.";
  };

  const completeSession = () => {
    setSessionComplete(true);
    setAwaitingAnswer(false);

    const accuracy = cardResults.length > 0 ? 
      cardResults.filter(r => r.correct).length / cardResults.length : 0;

    const stats: TutorSessionStats = {
      totalCards: cardResults.length,
      correctAnswers: cardResults.filter(r => r.correct).length,
      totalTime: sessionTime,
      accuracy,
      messagesExchanged: messages.length,
      conceptsMastered: cardResults.filter(r => r.correct).map(r => r.cardId),
      cardResults
    };

    onComplete(stats);
  };

  const sendMessage = () => {
    if (!currentMessage.trim() || isLoading) return;

    if (awaitingAnswer) {
      handleUserMessage(currentMessage);
    } else {
      // General conversation
      const userMessage: Message = {
        id: `msg_${Date.now()}`,
        type: 'user',
        content: currentMessage,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);

      // Simple AI response for general conversation
      setTimeout(() => {
        const aiResponse: Message = {
          id: `msg_${Date.now()}`,
          type: 'ai',
          content: "I'm here to help you learn! Feel free to ask questions or let me know when you're ready for the next concept.",
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }

    setCurrentMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderConfigScreen = () => (
    <div className={styles.configScreen}>
      <div className={styles.configCard}>
        <h2>🤖 AI Tutor Session</h2>
        <p className={styles.setTitle}>{flashcardSet.title}</p>
        
        <div className={styles.configDescription}>
          <p>Get personalized guidance from your AI tutor! Choose your learning preferences below:</p>
        </div>

        <div className={styles.configOptions}>
          <div className={styles.configGroup}>
            <h4>AI Personality</h4>
            <div className={styles.radioGroup}>
              {(['encouraging', 'professional', 'friendly', 'academic'] as const).map(personality => (
                <label key={personality} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="personality"
                    value={personality}
                    checked={config.aiPersonality === personality}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      aiPersonality: e.target.value as SessionConfig['aiPersonality']
                    }))}
                  />
                  <span>{personality.charAt(0).toUpperCase() + personality.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.configGroup}>
            <h4>Hint Level</h4>
            <select 
              value={config.hintLevel}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                hintLevel: e.target.value as SessionConfig['hintLevel']
              }))}
              className={styles.configSelect}
            >
              <option value="minimal">Minimal Hints</option>
              <option value="moderate">Moderate Hints</option>
              <option value="generous">Generous Hints</option>
            </select>
          </div>

          <div className={styles.configGroup}>
            <h4>Interaction Style</h4>
            <select 
              value={config.interactionStyle}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                interactionStyle: e.target.value as SessionConfig['interactionStyle']
              }))}
              className={styles.configSelect}
            >
              <option value="guided">Guided Learning</option>
              <option value="conversational">Conversational</option>
              <option value="socratic">Socratic Method</option>
            </select>
          </div>
        </div>

        <div className={styles.configActions}>
          <button className={styles.cancelButton} onClick={onExit}>
            Back
          </button>
          <button className={styles.startButton} onClick={startSession}>
            Start Session
          </button>
        </div>
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className={styles.progressBar}>
      <div className={styles.progressStats}>
        <span>Progress: {progress.cardsReviewed}/{progress.totalCards}</span>
        <span>Streak: {progress.currentStreak}</span>
        <span>Time: {formatTime(sessionTime)}</span>
      </div>
      <div className={styles.progressTrack}>
        <div 
          className={styles.progressFill}
          style={{ width: `${(progress.cardsReviewed / progress.totalCards) * 100}%` }}
        />
      </div>
    </div>
  );

  const renderMessage = (message: Message) => (
    <div key={message.id} className={`${styles.message} ${styles[message.type]}`}>
      <div className={styles.messageContent}>
        {message.content.split('**').map((part, index) => 
          index % 2 === 1 ? <strong key={index}>{part}</strong> : part
        )}
      </div>
      <div className={styles.messageTime}>
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );

  const renderChat = () => (
    <div className={styles.chatContainer}>
      {renderProgress()}
      
      <div className={styles.messagesContainer}>
        {messages.map(renderMessage)}
        
        {isTyping && (
          <div className={`${styles.message} ${styles.ai}`}>
            <div className={styles.typingIndicator}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputContainer}>
        <input
          ref={inputRef}
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={awaitingAnswer ? "Type your answer..." : "Ask a question or chat with your tutor..."}
          className={styles.messageInput}
          disabled={isLoading}
        />
        <button 
          onClick={sendMessage}
          disabled={!currentMessage.trim() || isLoading}
          className={styles.sendButton}
        >
          {isLoading ? '⏳' : '📤'}
        </button>
      </div>
    </div>
  );

  const renderCompletionScreen = () => {
    const accuracy = cardResults.length > 0 ? 
      Math.round((cardResults.filter(r => r.correct).length / cardResults.length) * 100) : 0;

    return (
      <div className={styles.completionScreen}>
        <div className={styles.completionCard}>
          <h2>🎉 Session Complete!</h2>
          
          <div className={styles.completionStats}>
            <div className={styles.mainStat}>
              <span className={styles.statNumber}>{accuracy}%</span>
              <span className={styles.statLabel}>Accuracy</span>
            </div>
            
            <div className={styles.statsGrid}>
              <div className={styles.stat}>
                <span>{cardResults.filter(r => r.correct).length}</span>
                <span>Concepts Mastered</span>
              </div>
              <div className={styles.stat}>
                <span>{messages.length}</span>
                <span>Messages Exchanged</span>
              </div>
              <div className={styles.stat}>
                <span>{formatTime(sessionTime)}</span>
                <span>Time Spent</span>
              </div>
              <div className={styles.stat}>
                <span>{progress.currentStreak}</span>
                <span>Best Streak</span>
              </div>
            </div>
          </div>

          <div className={styles.completionActions}>
            <button className={styles.reviewButton} onClick={startSession}>
              New Session
            </button>
            <button className={styles.finishButton} onClick={onExit}>
              Finish
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!sessionStarted) {
    return renderConfigScreen();
  }

  if (sessionComplete) {
    return renderCompletionScreen();
  }

  return (
    <div className={styles.aiTutorStudy}>
      {renderChat()}
    </div>
  );
};

export default AITutorStudy; 