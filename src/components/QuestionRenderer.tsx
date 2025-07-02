/**
 * 多样化题型渲染器
 * 支持多种考试题型的答题界面渲染
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
  
  // 当外部的 `answer` prop 或 `question` 改变时，同步内部状态
  useEffect(() => {
    setCurrentAnswer(answer)
    setIsConfirmed(answer !== undefined)
  }, [answer, question.id])

  // 提交答案的逻辑
  const handleConfirmAnswer = () => {
    if (currentAnswer !== undefined) {
      console.log(
        '[QuestionRenderer] 确认答案:', 
        { 
          questionId: question.id, 
          answer: currentAnswer, 
          confidence 
        }
      );
      onAnswerChange(question.id, currentAnswer, confidence)
      setIsConfirmed(true)
    }
  }
  
  const handleSelectionChange = (newAnswer: string | string[]) => {
    if (disabled) return;
    setCurrentAnswer(newAnswer);
    setIsConfirmed(false); // 用户做出新选择，重置确认状态
  }

  // 渲染单选题
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

  // 渲染多选题
  const renderMultipleChoice = () => {
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

  // 渲染判断题
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
            <span className={styles.optionText}>{option === 'True' ? '正确' : '错误'}</span>
            {isSelected && <Check className={styles.checkIcon} />}
          </motion.button>
        )
      })}
    </div>
  )

  // 渲染简答题
  const renderShortAnswer = () => {
    const answerText = Array.isArray(currentAnswer) ? currentAnswer.join('\n') : currentAnswer || ''

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          {question.question}
        </h3>
        
        <div className="space-y-2">
          <textarea
            value={answerText}
            onChange={(e) => handleSelectionChange(e.target.value)}
            disabled={disabled}
            placeholder="请在此输入您的答案..."
            className={`${styles.textarea} w-full p-4 border-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:border-transparent ${disabled ? 'cursor-not-allowed' : ''}`}
          />
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>建议字数: 50-200字</span>
            <span>{answerText.length} 字符</span>
          </div>
        </div>
      </div>
    )
  }

  // 渲染论述题
  const renderEssay = () => {
    const answerText = Array.isArray(currentAnswer) ? currentAnswer.join('\n') : currentAnswer || ''

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          {question.question}
        </h3>
        
        {question.rubric && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              评分标准
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="text-green-700"><strong>优秀:</strong> {question.rubric.excellent}</div>
              <div className="text-blue-700"><strong>良好:</strong> {question.rubric.good}</div>
              <div className="text-yellow-700"><strong>合格:</strong> {question.rubric.satisfactory}</div>
              <div className="text-red-700"><strong>需改进:</strong> {question.rubric.needs_improvement}</div>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <textarea
            value={answerText}
            onChange={(e) => handleSelectionChange(e.target.value)}
            disabled={disabled}
            placeholder="请详细阐述您的观点，注意逻辑清晰、论证充分..."
            className={`${styles.textarea} w-full p-4 border-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:border-transparent ${disabled ? 'cursor-not-allowed' : ''}`}
          />
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>建议字数: 300-800字</span>
            <span>{answerText.length} 字符</span>
          </div>
        </div>
      </div>
    )
  }

  // 渲染填空题
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
          请填写空缺部分
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
              placeholder="请输入答案..."
            />
          </div>
        )}
      </div>
    )
  }

  // 渲染匹配题
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

  // 渲染置信度滑块
  const renderConfidenceSlider = () => {
    if (isReview || disabled) return null

    return (
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            答题置信度
          </label>
          <span className="text-sm text-gray-500">
            {confidence === 1 ? '很不确定' : 
             confidence === 2 ? '不太确定' :
             confidence === 3 ? '一般' :
             confidence === 4 ? '比较确定' : '非常确定'}
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

  // 根据题型渲染对应组件
  const renderQuestionBody = () => {
    if (!question.type) {
      return (
        <div className={styles.unsupported}>
          AI返回了无效的题目格式
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

      {/* 置信度滑块和确认按钮 */}
      {!isReview && !disabled && (
        <div className={styles.submissionControls}>
          {renderConfidenceSlider()}
          <button 
            onClick={handleConfirmAnswer} 
            disabled={isConfirmed || currentAnswer === undefined}
            className={styles.confirmButton}
          >
            {isConfirmed ? '✓ 已确认' : '确认答案'}
          </button>
        </div>
      )}

      {/* 提示和解释面板 */}
      {(showHint || showExplanation) && (
        <div className="mt-6 space-y-3">
          {/* 提示按钮 */}
          {showHint && question.hint && (
            <div>
              <button
                onClick={() => setShowHintPanel(!showHintPanel)}
                className="flex items-center gap-2 text-sm text-yellow-600 hover:text-yellow-700 font-medium"
              >
                <Lightbulb className="w-4 h-4" />
                {showHintPanel ? '隐藏提示' : '显示提示'}
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
                      <strong>提示:</strong> {question.hint}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* 解释说明 */}
          {showExplanation && question.explanation && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>解释:</strong> {question.explanation}
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