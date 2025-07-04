/**
 * Diverse Question Type Renderer
 * Supports rendering of answer interfaces for various exam question types
 */

import { motion } from 'framer-motion'
import {
    BookOpen,
    Check,
    HelpCircle,
    Lightbulb
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import type { ExamQuestion } from '../types/examTypes'
import styles from './QuestionRenderer.module.css'

interface QuestionRendererProps {
  question: ExamQuestion
  answer: string | string[] | undefined
  onAnswerChange: (questionId: string, answer: string | string[], confidence?: number) => void
  showHint?: boolean
  disabled?: boolean
  showExplanation?: boolean
  isReview?: boolean
  className?: string
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  answer,
  onAnswerChange,
  showHint = false,
  disabled = false,
  showExplanation = false,
  isReview = false,
  className = ''
}) => {
  const [currentAnswer, setCurrentAnswer] = useState<string | string[] | undefined>(answer)
  const [confidence, setConfidence] = useState<number>(3) // Default confidence
  const [isConfirmed, setIsConfirmed] = useState<boolean>(answer !== undefined)
  const [showHintPanel, setShowHintPanel] = useState(false)
  
  // When the external `answer` prop or `question` changes, synchronize the internal state
  useEffect(() => {
    setCurrentAnswer(answer)
    setIsConfirmed(answer !== undefined)
  }, [answer, question.id])

  // Logic for submitting an answer
  const handleConfirmAnswer = () => {
    if (currentAnswer !== undefined) {
      onAnswerChange(question.id, currentAnswer, confidence)
      setIsConfirmed(true)
    }
  }
  
  const handleSelectionChange = (newAnswer: string | string[]) => {
    if (disabled) return;
    setCurrentAnswer(newAnswer);
    setIsConfirmed(false); // User makes a new selection, reset confirmation state
  }

  // Render single choice question
  const renderSingleChoice = () => (
    <div className={styles.optionsContainer}>
      {question?.options?.map((option, index) => {
        const isSelected = currentAnswer === option

        return (
          <motion.button
            key={index}
            onClick={() => handleSelectionChange(option)}
            className={`${styles.optionButton} ${isSelected ? styles.selected : ''}`}
            whileHover={!disabled ? { scale: 1.03 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            disabled={disabled}
          >
            <span className={styles.optionLetter}>{String.fromCharCode(65 + index)}</span>
            <span className={styles.optionText}>{option}</span>
            {isSelected && <Check className={styles.checkIcon} />}
          </motion.button>
        )
      })}
    </div>
  )

  // Render multiple choice question
  const renderMultipleChoice = () => {
    // Defensive check to ensure options is an array before mapping
    if (!Array.isArray(question?.options)) {
      return <div className={styles.errorText}>This multiple-choice question has no options available.</div>;
    }
    const currentAnswers = Array.isArray(currentAnswer) ? currentAnswer : []
    const handleSelect = (option: string) => {
      const newAnswers = currentAnswers.includes(option)
        ? currentAnswers.filter(a => a !== option)
        : [...currentAnswers, option]
      handleSelectionChange(newAnswers)
    }

    return (
      <div className={styles.optionsContainer}>
        {question?.options?.map((option, index) => {
          const isSelected = currentAnswers.includes(option)

          return (
            <motion.button
              key={index}
              onClick={() => handleSelect(option)}
              className={`${styles.optionButton} ${isSelected ? styles.selected : ''}`}
              whileHover={!disabled ? { scale: 1.03 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
              disabled={disabled}
            >
              <span className={styles.optionLetter}>{String.fromCharCode(65 + index)}</span>
              <span className={styles.optionText}>{option}</span>
              {isSelected && <Check className={styles.checkIcon} />}
            </motion.button>
          )
        })}
      </div>
    )
  }

  // Render true/false question
  const renderTrueFalse = () => (
    <div className={styles.optionsContainer}>
      {['True', 'False'].map((option, index) => {
        const isSelected = currentAnswer === option
        return (
          <motion.button
            key={index}
            onClick={() => handleSelectionChange(option)}
            className={`${styles.optionButton} ${isSelected ? styles.selected : ''}`}
            whileHover={!disabled ? { scale: 1.03 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            disabled={disabled}
          >
            <span className={styles.optionText}>{option === 'True' ? 'True' : 'False'}</span>
            {isSelected && <Check className={styles.checkIcon} />}
          </motion.button>
        )
      })}
    </div>
  )

  // Render short answer question
  const renderShortAnswer = () => {
    return (
      <textarea
        className={styles.shortAnswerInput}
        value={(currentAnswer as string) || ''}
        onChange={(e) => handleSelectionChange(e.target.value)}
        placeholder="Type your answer here..."
        rows={5}
      />
    );
  }

  // Render essay question
  const renderEssay = () => {
    return (
      <textarea
        className={styles.essayInput}
        value={(currentAnswer as string) || ''}
        onChange={(e) => handleSelectionChange(e.target.value)}
        placeholder="Compose your essay here..."
        rows={10}
      />
    );
  }

  // Render fill-in-the-blank question
  const renderFillBlank = () => {
    const questionParts = question.question.split('___')
    const answers = Array.isArray(currentAnswer) ? currentAnswer : (currentAnswer ? [currentAnswer] : [])
    
    const handleBlankChange = (index: number, value: string) => {
      if (disabled) return
      
      const newAnswers = [...answers]
      newAnswers[index] = value
      handleSelectionChange(newAnswers)
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Please fill in the blank parts
        </h3>
        
        <div className="text-lg leading-relaxed">
          {questionParts.map((part, index) => (
            <span key={index}>
              {part}
              {index < questionParts.length - 1 && (
                <input
                  type="text"
                  value={answers[index] || ''}
                  onChange={(e) => handleBlankChange(index, e.target.value)}
                  disabled={disabled}
                  className={`${styles.fillBlankInput} inline-block mx-1 px-2 py-1 border-b-2 bg-transparent focus:outline-none min-w-[80px] text-center ${disabled ? 'cursor-not-allowed' : ''}`}
                />
              )}
            </span>
          ))}
        </div>

        {questionParts.length === 1 && (
          <div className="mt-4">
            <input
              type="text"
              value={Array.isArray(currentAnswer) ? currentAnswer[0] || '' : currentAnswer}
              onChange={(e) => handleSelectionChange(e.target.value)}
              disabled={disabled}
              className={`w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                disabled ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
              placeholder="Please enter the answer..."
            />
          </div>
        )}
      </div>
    )
  }

  // Render matching question
  const renderMatching = () => {
    const handleDrop = (event: React.DragEvent<HTMLDivElement>, targetItemId: string) => {
      const sourceItemId = event.dataTransfer.getData('text/plain')
      
      const currentMap: { [key: string]: string } = 
        (Array.isArray(currentAnswer) ? Object.fromEntries(currentAnswer.map((v, i) => [i, v])) : (typeof currentAnswer === 'object' ? currentAnswer : {})) || {}

      const newAnswerMap = {
        ...currentMap,
        [sourceItemId]: targetItemId
      }
      
      const newAnswer = Object.entries(newAnswerMap).flat()
      if (newAnswer) {
        handleSelectionChange(newAnswer)
      }
    }

    return (
      <div className="text-white">Matching questions UI not fully implemented yet.</div>
    );
  }

  // Render confidence slider
  const renderConfidenceSlider = () => {
    if (isReview || disabled) return null

    return (
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Confidence Level
          </label>
          <span className="text-sm text-gray-500">
            {confidence === 1 ? 'Very Unsure' : 
             confidence === 2 ? 'Unsure' :
             confidence === 3 ? 'Neutral' :
             confidence === 4 ? 'Confident' : 'Very Confident'}
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="5"
          value={confidence || 3}
          onChange={(e) => setConfidence(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
        </div>
      </div>
    )
  }

  // Render the corresponding component based on the question type
  const renderQuestionBody = () => {
    if (!question.type) {
      return (
        <div className={styles.unsupported}>
          AI returned an invalid question format
        </div>
      )
    }

    switch (question.type) {
      case 'single_choice':
        return renderSingleChoice()
      case 'multiple_choice':
        return renderMultipleChoice()
      case 'true_false':
        return renderTrueFalse()
      case 'short_answer':
        return renderShortAnswer()
      case 'essay':
        return renderEssay()
      case 'fill_blank':
        return renderFillBlank()
      case 'matching':
        return renderMatching()
      default:
        return (
          <div className={styles.unsupported}>
            Unsupported question type: {question.type}
          </div>
        )
    }
  }

  return (
    <div className={`${styles.questionRendererContainer} ${className}`}>
      <div className={styles.questionHeader}>
        <h3 className={styles.questionText}>{question.question}</h3>
      </div>
      
      <div className={styles.questionBody}>
        {renderQuestionBody()}
      </div>

      {/* Confidence slider and confirm button */}
      {!isReview && !disabled && (
        <div className={styles.submissionControls}>
          {renderConfidenceSlider()}
          <button 
            onClick={handleConfirmAnswer} 
            disabled={isConfirmed || currentAnswer === undefined}
            className={styles.confirmButton}
          >
            {isConfirmed ? '✓ Confirmed' : 'Confirm Answer'}
          </button>
        </div>
      )}

      {/* Hint and explanation panel */}
      {(showHint || showExplanation) && (
        <div className="mt-6 space-y-3">
          {/* Hint button */}
          {showHint && question.hint && (
            <div>
              <button
                onClick={() => setShowHintPanel(!showHintPanel)}
                className="flex items-center gap-2 text-sm text-yellow-600 hover:text-yellow-700 font-medium"
              >
                <Lightbulb className="w-4 h-4" />
                {showHintPanel ? 'Hide Hint' : 'Show Hint'}
              </button>
              
              {showHintPanel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <strong>Hint:</strong> {question.hint}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Explanation */}
          {showExplanation && question.explanation && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>Explanation:</strong> {question.explanation}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default QuestionRenderer