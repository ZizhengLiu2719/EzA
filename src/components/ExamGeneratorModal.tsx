/**
 * Unified Create Flashcard Set Modal Component
 * 统一的闪卡集创建模态框 - 支持多种创建方式
 */

import { AlertCircle, BrainCircuit } from 'lucide-react'
import * as mammoth from 'mammoth'
import * as pdfjsLib from 'pdfjs-dist'
import React, { useCallback, useMemo, useState } from 'react'
import { FlashcardSetWithStats, getFlashcardsBySetIds } from '../api/flashcards'
import { examAI, ExamConfiguration, GeneratedExam } from '../services/examAI'
import { FSRSCard } from '../types/SRSTypes'
import styles from './ExamGeneratorModal.module.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface ExamGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  flashcardSets: FlashcardSetWithStats[]
  onExamGenerated: (exam: GeneratedExam) => void
}

interface ExamSettings {
  title: string
  subject: string
  duration: number
  total_points: number
  question_types: {
    multiple_choice: number
    true_false: number
    short_answer: number
    essay: number
    fill_blank: number
    matching: number
  }
  difficulty_focus: 'easy' | 'medium' | 'hard' | 'mixed'
  cognitive_focus: 'remember' | 'understand' | 'apply' | 'analyze' | 'mixed'
  learning_objectives: string[]
}

const ExamGeneratorModal: React.FC<ExamGeneratorModalProps> = ({
  isOpen,
  onClose,
  flashcardSets,
  onExamGenerated
}) => {
  const [step, setStep] = useState<'settings' | 'generating' | 'error'>('settings')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isProfessorMode, setIsProfessorMode] = useState(false)
  const [selectedSetIds, setSelectedSetIds] = useState<Set<string>>(new Set())
  const [isSetSelectionOpen, setIsSetSelectionOpen] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);

  const [settings, setSettings] = useState<ExamSettings>({
    title: 'Review Test',
    subject: 'General',
    duration: 30,
    total_points: 100,
    question_types: {
      multiple_choice: 5,
      true_false: 3,
      short_answer: 2,
      essay: 0,
      fill_blank: 0,
      matching: 0,
    },
    difficulty_focus: 'mixed',
    cognitive_focus: 'mixed',
    learning_objectives: ['Test knowledge mastery', 'Reinforce learning outcomes'],
  })
  const [newObjective, setNewObjective] = useState('')
  const [error, setError] = useState<string>('')

  const selectedSets = useMemo(() => flashcardSets.filter(set => selectedSetIds.has(set.id)), [flashcardSets, selectedSetIds]);
  const totalCardsInSelectedSets = useMemo(() => selectedSets.reduce((sum, set) => sum + (set.card_count || 0), 0), [selectedSets]);
  const totalQuestions = Object.values(settings.question_types).reduce((sum, count) => sum + count, 0)

  const handleClose = () => {
    if (isGenerating || isFileUploading) return;
    setStep('settings')
    setError('')
    onClose()
  }

  const handleFileUpload = async (file: File) => {
    setIsFileUploading(true);
    setError('');
    try {
      let textContent = '';
      if (file.type === 'application/pdf') {
        const doc = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          textContent += content.items.map((item: any) => item.str).join(' ');
        }
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        textContent = result.value;
      } else {
        textContent = await file.text();
      }
      const extractedTopics = await examAI.extractTopicsFromDocument(textContent);
      if (extractedTopics.length > 0) {
        updateSettings({
          learning_objectives: [...new Set([...settings.learning_objectives, ...extractedTopics])]
        });
      }
    } catch (e) {
      console.error("File processing error:", e);
      setError("Failed to process the uploaded file.");
    } finally {
      setIsFileUploading(false);
    }
  };

  const createExamConfig = useCallback((cards: FSRSCard[]): ExamConfiguration => {
    const questionDistribution = Object.entries(settings.question_types)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({
        type: type as ExamConfiguration['question_distribution'][0]['type'],
        count,
        points_per_question: Math.floor(settings.total_points / (totalQuestions || 1)),
      }));

    const difficultyDistribution =
      settings.difficulty_focus === 'mixed'
        ? [
            { difficulty_range: [1, 4] as [number, number], percentage: 30 },
            { difficulty_range: [4, 7] as [number, number], percentage: 50 },
            { difficulty_range: [7, 10] as [number, number], percentage: 20 },
          ]
        : [
            {
              difficulty_range:
                settings.difficulty_focus === 'easy'
                  ? ([1, 4] as [number, number])
                  : settings.difficulty_focus === 'medium'
                  ? ([4, 7] as [number, number])
                  : ([7, 10] as [number, number]),
              percentage: 100,
            },
          ]

    const cognitiveDistribution =
      settings.cognitive_focus === 'mixed'
        ? [
            { level: 'remember' as const, percentage: 25 },
            { level: 'understand' as const, percentage: 30 },
            { level: 'apply' as const, percentage: 25 },
            { level: 'analyze' as const, percentage: 20 },
          ]
        : [{ level: settings.cognitive_focus as any, percentage: 100 }]

    return {
      title: settings.title,
      subject: settings.subject,
      topics: Array.from(new Set(cards.map(card => (card.tags || []).flat()).flat())).filter(Boolean),
      duration: settings.duration,
      total_points: settings.total_points,
      question_distribution: questionDistribution,
      difficulty_distribution: difficultyDistribution,
      cognitive_distribution: cognitiveDistribution,
      learning_objectives: settings.learning_objectives,
    } as ExamConfiguration;
  }, [settings, totalQuestions]);

  const handleGenerateExam = useCallback(async () => {
    if (isGenerating) return
    if (selectedSetIds.size === 0) {
      setError('Please select at least one flashcard set to generate the exam from.');
      setStep('error');
      return;
    }
    
    const relevantCards = await getFlashcardsBySetIds(Array.from(selectedSetIds));

    if (relevantCards.length < 10) {
      setError(`At least 10 cards are needed to generate an exam, but the selected sets only contain ${relevantCards.length}.`);
      setStep('error');
      return;
    }
    if (totalQuestions === 0) {
      setError('Please select at least one question type.');
      setStep('error');
      return;
    }
    if (totalQuestions > relevantCards.length) {
      setError(`Total questions (${totalQuestions}) cannot exceed the number of available cards in selected sets (${relevantCards.length}).`);
      setStep('error');
      return;
    }

    setIsGenerating(true)
    setStep('generating')
    setError('')

    try {
      const examConfig = createExamConfig(relevantCards)
      const exam = await examAI.generateExamFromCards(relevantCards, examConfig, isProfessorMode)
      onExamGenerated(exam)
    } catch (err) {
      console.error('❌ Exam Generation Failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred. Please try again later.'
      setError(`Exam Generation Failed: ${errorMessage}`)
      setStep('error')
    } finally {
      setIsGenerating(false)
    }
  }, [isGenerating, selectedSetIds, totalQuestions, createExamConfig, onExamGenerated, isProfessorMode]);
  
  const toggleSetId = (setId: string) => {
    setSelectedSetIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(setId)) {
            newSet.delete(setId);
        } else {
            newSet.add(setId);
        }
        return newSet;
    });
  };

  const updateSettings = useCallback((updates: Partial<ExamSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }, [])

  const updateQuestionType = useCallback(
    (type: keyof ExamSettings['question_types'], count: number) => {
      setSettings(prev => ({
        ...prev,
        question_types: {
          ...prev.question_types,
          [type]: Math.max(0, count),
        },
      }))
    },
    []
  )

  const handleObjectiveSubmit = () => {
    if (newObjective.trim() && !settings.learning_objectives.includes(newObjective.trim())) {
      updateSettings({
        learning_objectives: [...settings.learning_objectives, newObjective.trim()],
      })
    }
    setNewObjective('')
  }

  const removeLearningObjective = useCallback(
    (index: number) => {
      updateSettings({
        learning_objectives: settings.learning_objectives.filter((_, i) => i !== index),
      })
    },
    [settings.learning_objectives, updateSettings]
  )
  
  if (!isOpen) return null

  const renderContent = () => {
    if (step === 'generating') {
      return (
        <div className={styles.centeredMessage}>
            <div className={styles.spinner} />
            <p className={styles.loadingMessage}>The AI is crafting your exam...</p>
            <p className={styles.loadingSubMessage}>Analyzing weaknesses and selecting questions.</p>
        </div>
      )
    }

    if (step === 'error') {
        return (
          <div className={styles.centeredMessage}>
            <AlertCircle className={styles.errorIcon} />
            <p className={styles.errorMessageHeader}>Generation Failed</p>
            <p className={styles.errorMessageText}>{error}</p>
            <button onClick={() => { setStep('settings'); setError(''); }} className={styles.actionButton}>
              Back to Settings
            </button>
          </div>
        )
      }

    return (
        <form className={styles.modalForm} onSubmit={(e) => { e.preventDefault(); handleGenerateExam(); }}>
            <div className={styles.formGrid}>
                {/* Left Column */}
                <div className={styles.formColumn}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>基本设置</label>
                        <div className={styles.inputRow}>
                            <label htmlFor="title" className={styles.inlineLabel}>考试标题</label>
                            <input
                                type="text"
                                id="title"
                                className={styles.fieldInput}
                                value={settings.title}
                                onChange={e => updateSettings({ title: e.target.value })}
                                placeholder="e.g., 期中复习"
                            />
                        </div>
                        <div className={styles.inputRow}>
                             <label htmlFor="subject" className={styles.inlineLabel}>学科</label>
                            <input
                                type="text"
                                id="subject"
                                className={styles.fieldInput}
                                value={settings.subject}
                                onChange={e => updateSettings({ subject: e.target.value })}
                                placeholder="e.g., 计算机科学"
                            />
                        </div>
                         <div className={styles.inputRow}>
                             <label htmlFor="duration" className={styles.inlineLabel}>时长(分钟)</label>
                            <input
                                type="number"
                                id="duration"
                                className={styles.fieldInput}
                                value={settings.duration}
                                onChange={e => updateSettings({ duration: parseInt(e.target.value, 10) || 0 })}
                            />
                        </div>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>难度重点</label>
                         <select
                            className={styles.fieldSelect}
                            value={settings.difficulty_focus}
                            onChange={e => updateSettings({ difficulty_focus: e.target.value as any })}
                        >
                            <option value="mixed">混合难度</option>
                            <option value="easy">侧重简单</option>
                            <option value="medium">侧重中等</option>
                            <option value="hard">侧重困难</option>
                        </select>
                    </div>
                     <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>学习目标</label>
                        <div className={styles.tagContainer}>
                            <div className={styles.tagsList}>
                                {settings.learning_objectives.map((obj, index) => (
                                <div key={index} className={styles.tag}>
                                    {obj}
                                    <button type="button" className={styles.tagRemove} onClick={() => removeLearningObjective(index)}>✕</button>
                                </div>
                                ))}
                            </div>
                            <div className={styles.tagInputWrapper}>
                                <input
                                type="text"
                                className={styles.tagInput}
                                value={newObjective}
                                onChange={e => setNewObjective(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleObjectiveSubmit();
                                    }
                                }}
                                placeholder="添加一个学习目标..."
                                />
                                <button type="button" className={styles.tagAddButton} onClick={handleObjectiveSubmit}>添加</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className={styles.formColumn}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>题型分布 (共 {totalQuestions} 题)</label>
                        <div className={styles.questionTypeGrid}>
                           <div className={styles.questionTypeRow}>
                                <span className={styles.questionTypeLabel}>选择题</span>
                                <div className={styles.stepper}>
                                    <button type="button" onClick={() => updateQuestionType('multiple_choice', settings.question_types['multiple_choice'] - 1)}>-</button>
                                    <span>{settings.question_types['multiple_choice']}</span>
                                    <button type="button" onClick={() => updateQuestionType('multiple_choice', settings.question_types['multiple_choice'] + 1)}>+</button>
                                </div>
                            </div>
                             <div className={styles.questionTypeRow}>
                                <span className={styles.questionTypeLabel}>判断题</span>
                                <div className={styles.stepper}>
                                    <button type="button" onClick={() => updateQuestionType('true_false', settings.question_types['true_false'] - 1)}>-</button>
                                    <span>{settings.question_types['true_false']}</span>
                                    <button type="button" onClick={() => updateQuestionType('true_false', settings.question_types['true_false'] + 1)}>+</button>
                                </div>
                            </div>
                            <div className={styles.questionTypeRow}>
                                <span className={styles.questionTypeLabel}>填空题</span>
                                <div className={styles.stepper}>
                                    <button type="button" onClick={() => updateQuestionType('fill_blank', settings.question_types['fill_blank'] - 1)}>-</button>
                                    <span>{settings.question_types['fill_blank']}</span>
                                    <button type="button" onClick={() => updateQuestionType('fill_blank', settings.question_types['fill_blank'] + 1)}>+</button>
                                </div>
                            </div>
                             <div className={styles.questionTypeRow}>
                                <span className={styles.questionTypeLabel}>简答题</span>
                                <div className={styles.stepper}>
                                    <button type="button" onClick={() => updateQuestionType('short_answer', settings.question_types['short_answer'] - 1)}>-</button>
                                    <span>{settings.question_types['short_answer']}</span>
                                    <button type="button" onClick={() => updateQuestionType('short_answer', settings.question_types['short_answer'] + 1)}>+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={handleClose}>
                取消
                </button>
                <button type="submit" className={styles.submitButton} disabled={isGenerating}>
                {isGenerating ? '生成中...' : '开始生成考试'}
                </button>
            </div>
        </form>
    )
  }

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.headerContent}>
                <BrainCircuit size={24} />
                <div>
                  <h2 className={styles.modalTitle}>智能考试生成器</h2>
                  <p className={styles.modalSubtitle}>基于 {totalCardsInSelectedSets} 张闪卡</p>
                </div>
              </div>
              <button className={styles.closeButton} onClick={handleClose}>
                ✕
              </button>
            </div>
            {renderContent()}
      </div>
    </div>
  )
}

export default ExamGeneratorModal 