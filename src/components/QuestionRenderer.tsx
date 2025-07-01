/**
 * 多样化题型渲染器
 * 支持多种考试题型的答题界面渲染
 */

import { motion } from 'framer-motion'
import {
    AlertCircle,
    ArrowUpDown,
    BookOpen,
    Check,
    HelpCircle,
    Lightbulb,
    X
} from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import { ExamQuestion } from '../types'

interface QuestionRendererProps {
  question: ExamQuestion
  answer?: string | string[]
  onAnswerChange: (answer: string | string[], confidence?: number) => void
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
  const [currentAnswer, setCurrentAnswer] = useState<string | string[]>(answer || '')
  const [confidence, setConfidence] = useState<number>(3)
  const [showHintPanel, setShowHintPanel] = useState(false)
  
  // 当外部answer改变时同步内部状态
  useEffect(() => {
    if (answer !== undefined) {
      setCurrentAnswer(answer)
    }
  }, [answer])

  // 提交答案
  const handleAnswerSubmit = useCallback((newAnswer: string | string[], newConfidence?: number) => {
    setCurrentAnswer(newAnswer)
    onAnswerChange(newAnswer, newConfidence || confidence)
  }, [onAnswerChange, confidence])

  // 渲染多选题
  const renderMultipleChoice = () => {
    const selectedOption = Array.isArray(currentAnswer) ? currentAnswer[0] : currentAnswer

    return (
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          {question.question}
        </h3>
        
        <div className="space-y-2">
          {question.options?.map((option, index) => {
            const optionLetter = String.fromCharCode(65 + index) // A, B, C, D...
            const isSelected = selectedOption === option
            
            return (
              <motion.button
                key={index}
                onClick={() => !disabled && handleAnswerSubmit(option)}
                disabled={disabled}
                whileHover={!disabled ? { scale: 1.01 } : {}}
                whileTap={!disabled ? { scale: 0.99 } : {}}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-500 text-white' 
                      : 'border-gray-400 text-gray-600'
                  }`}>
                    {optionLetter}
                  </div>
                  <span className="flex-1">{option}</span>
                  {isSelected && <Check className="w-5 h-5 text-blue-500" />}
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  // 渲染判断题
  const renderTrueFalse = () => {
    const selectedAnswer = Array.isArray(currentAnswer) ? currentAnswer[0] : currentAnswer

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          {question.question}
        </h3>
        
        <div className="flex gap-4 justify-center">
          {['正确', '错误'].map((option, index) => {
            const value = index === 0 ? 'true' : 'false'
            const isSelected = selectedAnswer === value || selectedAnswer === option
            
            return (
              <motion.button
                key={option}
                onClick={() => !disabled && handleAnswerSubmit(value)}
                disabled={disabled}
                whileHover={!disabled ? { scale: 1.05 } : {}}
                whileTap={!disabled ? { scale: 0.95 } : {}}
                className={`px-8 py-4 rounded-xl border-2 font-medium transition-all ${
                  isSelected
                    ? index === 0
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-2">
                  {index === 0 ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                  {option}
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  // 渲染简答题
  const renderShortAnswer = () => {
    const answerText = Array.isArray(currentAnswer) ? currentAnswer.join('\n') : currentAnswer

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          {question.question}
        </h3>
        
        <div className="space-y-2">
          <textarea
            value={answerText}
            onChange={(e) => !disabled && setCurrentAnswer(e.target.value)}
            onBlur={() => handleAnswerSubmit(currentAnswer)}
            disabled={disabled}
            placeholder="请在此输入您的答案..."
            className={`w-full p-4 border-2 border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              disabled ? 'bg-gray-50 cursor-not-allowed' : ''
            }`}
            rows={4}
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
    const answerText = Array.isArray(currentAnswer) ? currentAnswer.join('\n') : currentAnswer

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
            onChange={(e) => !disabled && setCurrentAnswer(e.target.value)}
            onBlur={() => handleAnswerSubmit(currentAnswer)}
            disabled={disabled}
            placeholder="请详细阐述您的观点，注意逻辑清晰、论证充分..."
            className={`w-full p-4 border-2 border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              disabled ? 'bg-gray-50 cursor-not-allowed' : ''
            }`}
            rows={8}
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
    // 解析题目中的空格 (假设用 ___ 表示空格)
    const questionParts = question.question.split('___')
    const answers = Array.isArray(currentAnswer) ? currentAnswer : [currentAnswer]

    const handleBlankChange = (index: number, value: string) => {
      if (disabled) return
      
      const newAnswers = [...answers]
      newAnswers[index] = value
      setCurrentAnswer(newAnswers)
    }

    const handleBlankBlur = () => {
      handleAnswerSubmit(currentAnswer)
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
                  onBlur={handleBlankBlur}
                  disabled={disabled}
                  className={`inline-block mx-1 px-2 py-1 border-b-2 border-blue-400 bg-transparent focus:outline-none focus:border-blue-600 min-w-[80px] text-center ${
                    disabled ? 'bg-gray-50 cursor-not-allowed' : ''
                  }`}
                  placeholder="?"
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
              onChange={(e) => !disabled && setCurrentAnswer(e.target.value)}
              onBlur={() => handleAnswerSubmit(currentAnswer)}
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
    // 假设options包含匹配选项，correct_answer是正确的匹配关系
    const leftItems = question.options?.slice(0, Math.ceil((question.options?.length || 0) / 2)) || []
    const rightItems = question.options?.slice(Math.ceil((question.options?.length || 0) / 2)) || []
    const matches = Array.isArray(currentAnswer) ? currentAnswer : []

    const handleMatch = (leftIndex: number, rightIndex: number) => {
      if (disabled) return
      
      const matchKey = `${leftIndex}-${rightIndex}`
      const newMatches = [...matches]
      const existingIndex = newMatches.findIndex(m => m.startsWith(`${leftIndex}-`))
      
      if (existingIndex >= 0) {
        newMatches[existingIndex] = matchKey
      } else {
        newMatches.push(matchKey)
      }
      
      setCurrentAnswer(newMatches)
      handleAnswerSubmit(newMatches)
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          {question.question}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700 mb-3">左侧选项</h4>
            {leftItems.map((item, index) => (
              <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="font-medium text-blue-800">{index + 1}.</span> {item}
              </div>
            ))}
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700 mb-3">右侧选项</h4>
            {rightItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {/* 匹配逻辑需要更复杂的UI */}}
                disabled={disabled}
                className={`w-full p-3 text-left bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors ${
                  disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                }`}
              >
                <span className="font-medium text-green-800">{String.fromCharCode(65 + index)}.</span> {item}
              </button>
            ))}
          </div>
        </div>

        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <ArrowUpDown className="w-4 h-4 inline mr-2" />
          请点击右侧选项与左侧对应项目进行匹配
        </div>
      </div>
    )
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
          value={confidence}
          onChange={(e) => setConfidence(parseInt(e.target.value))}
          onMouseUp={() => handleAnswerSubmit(currentAnswer, confidence)}
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
  const renderQuestionContent = () => {
    switch (question.type) {
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
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>不支持的题型: {question.type}</p>
          </div>
        )
    }
  }

  return (
    <div className={`question-renderer ${className}`}>
      {/* 题目内容 */}
      <div className="mb-6">
        {renderQuestionContent()}
      </div>

      {/* 置信度滑块 */}
      {renderConfidenceSlider()}

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
