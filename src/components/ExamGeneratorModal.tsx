/**
 * Unified Create Flashcard Set Modal Component
 * 统一的闪卡集创建模态框 - 支持多种创建方式
 */

import { AlertCircle } from 'lucide-react'
import React, { useCallback, useMemo, useState } from 'react'
import { CreateFlashcardSetData, FlashcardSetWithStats, getFlashcardsBySetIds } from '../api/flashcards'
import { examAI, ExamConfiguration, ExamQuestion, GeneratedExam } from '../services/examAI'
import ContentUploader from './ContentUploader'
import styles from './ExamGeneratorModal.module.css'

interface CreateFlashcardSetModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateFlashcardSetData) => Promise<void>
  onMethodSelected?: (method: CreationMethod, setData: CreateFlashcardSetData) => void
  isLoading?: boolean
}

// 创建方式枚举
type CreationMethod = 'manual' | 'import' | 'ai-generate'

const CREATION_METHODS = [
  {
    id: 'manual' as CreationMethod,
    title: '🖊️ Manual Creation',
    description: 'Create flashcards manually with full control',
    icon: '🖊️',
    features: ['Custom design', 'Flexible content', 'Step by step']
  },
  {
    id: 'import' as CreationMethod,
    title: '📤 Batch Import',
    description: 'Import from CSV, text, images, or JSON',
    icon: '📤',
    features: ['CSV files', 'OCR from images', 'Text parsing', 'JSON import']
  },
  {
    id: 'ai-generate' as CreationMethod,
    title: '🤖 AI Generation',
    description: 'Let AI generate flashcards from topics',
    icon: '🤖',
    features: ['Topic-based', 'Multiple types', 'Instant creation', 'Smart content']
  }
]

const SUBJECTS = [
  'Mathematics',
  'Science', 
  'History',
  'English',
  'Foreign Language',
  'Computer Science',
  'Chemistry',
  'Physics',
  'Biology',
  'Psychology',
  'Philosophy',
  'Art',
  'Music',
  'Other'
]

const DIFFICULTY_LEVELS = [
  { value: 1, label: 'Beginner', description: 'Basic concepts and vocabulary' },
  { value: 2, label: 'Elementary', description: 'Fundamental knowledge' },
  { value: 3, label: 'Intermediate', description: 'Standard academic level' },
  { value: 4, label: 'Advanced', description: 'Complex concepts and applications' },
  { value: 5, label: 'Expert', description: 'Professional and research level' }
]

interface ExamGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  flashcardSets: FlashcardSetWithStats[]
  onExamGenerated: (exam: GeneratedExam) => void
}

interface ExamSettings {
  title: string
  subject: string
  duration: number // 分钟
  question_types: {
    single_choice: number;
    multiple_choice: number
    true_false: number
    short_answer: number
    essay: number
    fill_blank: number
  }
  difficulty_focus: 'easy' | 'medium' | 'hard' | 'mixed'
  cognitive_focus: 'remember' | 'understand' | 'apply' | 'analyze' | 'mixed'
  selectedTopics: string[]
  isProfessorMode: boolean
}

const ExamGeneratorModal: React.FC<ExamGeneratorModalProps> = ({
  isOpen,
  onClose,
  flashcardSets,
  onExamGenerated
}) => {
  const [step, setStep] = useState<'settings' | 'generating' | 'error'>('settings')
  const [source, setSource] = useState<'flashcards' | 'files'>('flashcards');
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([])
  const [extractedTopics, setExtractedTopics] = useState<string[]>([]);
  const [settings, setSettings] = useState<ExamSettings>({
    title: '复习测试',
    subject: '通用',
    duration: 30,
    question_types: {
      single_choice: 0,
      multiple_choice: 5,
      true_false: 3,
      short_answer: 2,
      essay: 0,
      fill_blank: 0,
    },
    difficulty_focus: 'mixed',
    cognitive_focus: 'mixed',
    selectedTopics: ['测试知识掌握度', '巩固学习成果'],
    isProfessorMode: false,
  })
  const [newTopic, setNewTopic] = useState('')
  const [error, setError] = useState<string>('')

  const totalQuestions = Object.values(settings.question_types).reduce((sum, count) => sum + count, 0)

  const handleTopicsExtracted = (topics: string[]) => {
    setExtractedTopics(topics);
    updateSettings({
      selectedTopics: Array.from(new Set([...settings.selectedTopics, ...topics]))
    });
  };

  const handleSetSelectionChange = (setId: string) => {
    setSelectedSetIds(prev =>
      prev.includes(setId)
        ? prev.filter(id => id !== setId)
        : [...prev, setId]
    );
  };

  const selectedCardsCount = useMemo(() => {
    if (source !== 'flashcards') return 0;
    return flashcardSets
      .filter(set => selectedSetIds.includes(set.id))
      .reduce((sum, set) => sum + (set.card_count || 0), 0);
  }, [selectedSetIds, flashcardSets, source]);

  const handleClose = () => {
    if (isGenerating) return;
    setStep('settings')
    setError('')
    onClose()
  }

  const createExamConfig = useCallback((): ExamConfiguration => {
    const totalPoints = Object.values(settings.question_types).reduce((sum, count) => sum + count, 0) * 5; // Assuming 5 points per question

    const questionDistribution = Object.entries(settings.question_types)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({
        type: type as ExamQuestion['type'],
        count,
        points_per_question: 5,
      }))

    const finalTopics = settings.selectedTopics;

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
      topics: finalTopics,
      duration: settings.duration,
      total_points: totalPoints,
      question_distribution: questionDistribution,
      difficulty_distribution: difficultyDistribution,
      cognitive_distribution: cognitiveDistribution,
      learning_objectives: settings.selectedTopics,
    }
  }, [settings])

  const handleGenerateExam = useCallback(async () => {
    if (isGenerating) return

    if (source === 'flashcards' && selectedSetIds.length === 0) {
      setError('请至少选择一个闪卡集作为考试范围。')
      setStep('error')
      return
    }

    if (source === 'flashcards') {
    const availableCardsCount = selectedCardsCount;
      if (totalQuestions === 0) {
        setError('请至少设置一个题型和数量。');
        setStep('error');
        return;
      }
      if (availableCardsCount < 10 && availableCardsCount < totalQuestions) {
      setError(`所选范围内至少需要10张卡片才能生成考试，当前只有 ${availableCardsCount} 张。`)
      setStep('error')
      return
    }
    if (totalQuestions > availableCardsCount) {
      setError(`题目总数 (${totalQuestions}) 不能超过所选范围内的卡片数量 (${availableCardsCount})。`)
      setStep('error')
      return
      }
    }
    
    if (source === 'files' && totalQuestions === 0) {
      setError('请至少设置一个题型和数量。');
      setStep('error');
      return;
    }

    setIsGenerating(true)
    setStep('generating')
    setError('')

    try {
      const examConfig = createExamConfig()
      let generatedExam;
      if (source === 'flashcards') {
      const cardsForExam = await getFlashcardsBySetIds(selectedSetIds);
        generatedExam = await examAI.generateExamFromCards(cardsForExam, examConfig, settings.isProfessorMode)
      } else {
        // TODO: Implement generateExamFromContent
        // For now, we'll use a placeholder or throw an error
        setError('从文件生成考试的功能尚未实现。');
        setStep('error');
        setIsGenerating(false);
        return;
      }
      onExamGenerated(generatedExam)
    } catch (err: any) {
      console.error('Exam generation failed:', err)
      setError(err.message || '考试生成失败，请稍后重试。')
      setStep('error')
    } finally {
      setIsGenerating(false)
    }
  }, [
    isGenerating, 
    source, 
    selectedSetIds, 
    selectedCardsCount, 
    totalQuestions, 
    createExamConfig, 
    onExamGenerated, 
    settings.isProfessorMode
  ]);

  const updateSettings = (newSettings: Partial<ExamSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };
  
  const updateQuestionCount = (type: keyof ExamSettings['question_types'], delta: number) => {
    setSettings(prev => {
      const newCount = (prev.question_types[type] || 0) + delta;
      if (newCount < 0) return prev; // Don't allow negative numbers
      return {
        ...prev,
        question_types: {
          ...prev.question_types,
          [type]: newCount,
        }
      };
    });
  };

  const handleTopicSubmit = () => {
    if (newTopic.trim() && !settings.selectedTopics.includes(newTopic.trim())) {
      updateSettings({
        selectedTopics: [...settings.selectedTopics, newTopic.trim()],
      })
    }
    setNewTopic('')
  }

  const handleTopicToggle = (topic: string) => {
    updateSettings({
      selectedTopics: settings.selectedTopics.includes(topic)
      ? settings.selectedTopics.filter(t => t !== topic)
        : [...settings.selectedTopics, topic],
    })
  }

  const renderSettings = () => (
    <>
      <div className={styles.modalBody}>
        <div className={styles.mainArea}>
          {/* Left Panel: Settings */}
          <div className={styles.configPanel}>
             <div className={styles.configSection}>
                <p className={styles.sectionTitle}>基础设置</p>
                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>考试标题</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={settings.title}
                      onChange={(e) => updateSettings({ title: e.target.value })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>所属学科</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={settings.subject}
                      onChange={(e) => updateSettings({ subject: e.target.value })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>时长(分钟)</label>
                    <input
                      type="number"
                      className={styles.fieldInput}
                      value={settings.duration}
                      onChange={(e) => updateSettings({ duration: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>难度重点</label>
                    <select
                      className={styles.fieldSelect}
                      value={settings.difficulty_focus}
                      onChange={e => updateSettings({ difficulty_focus: e.target.value as any })}
                    >
                      <option value="mixed">混合</option>
                      <option value="easy">偏简单</option>
                      <option value="medium">偏中等</option>
                      <option value="hard">偏困难</option>
                    </select>
                  </div>
                </div>
              </div>

            <div className={styles.configSection}>
              <p className={styles.sectionTitle}>题型分布 (共 {totalQuestions} 题)</p>
              <div className={styles.questionTypeGrid}>
                {(Object.keys(settings.question_types) as Array<keyof typeof settings.question_types>).map(type => (
                  <div key={type} className={styles.stepperRow}>
                    <span className={styles.stepperLabel}>{type.replace(/_/g, ' ')}</span>
                    <div className={styles.stepper}>
                      <button onClick={() => updateQuestionCount(type, -1)} disabled={settings.question_types[type] <= 0}>-</button>
                      <span>{settings.question_types[type]}</span>
                      <button onClick={() => updateQuestionCount(type, 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Source Selection */}
          <div className={styles.sourcePanel}>
            <div className={styles.sourceSelector}>
              <button
                className={`${styles.sourceButton} ${source === 'flashcards' ? styles.active : ''}`}
                onClick={() => setSource('flashcards')}
              >
                从卡片集选择
              </button>
              <button
                className={`${styles.sourceButton} ${source === 'files' ? styles.active : ''}`}
                onClick={() => setSource('files')}
              >
                从文件上传
              </button>
            </div>

            {source === 'flashcards' && (
              <div className={styles.configSection}>
                <p className={styles.sectionTitle}>
                  选择卡片集
                  <span className={styles.selectionCount}>已选 {selectedSetIds.length} 套 / 共 {selectedCardsCount} 张卡片</span>
                </p>
                <div className={styles.setList}>
                  {flashcardSets.map(set => (
                    <div
                      key={set.id}
                      className={`${styles.setItem} ${selectedSetIds.includes(set.id) ? styles.selected : ''}`}
                      onClick={() => handleSetSelectionChange(set.id)}
                    >
                      <span className={styles.setName}>{set.title}</span>
                      <span className={styles.setCount}>{set.card_count} cards</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {source === 'files' && (
              <div className={styles.configSection}>
                <p className={styles.sectionTitle}>上传学习资料</p>
                <ContentUploader onTopicsExtracted={handleTopicsExtracted} />
              </div>
            )}

            <div className={styles.configSection}>
              <p className={styles.sectionTitle}>考试重点 (Topics)</p>
              <div className={styles.tagsList}>
                {settings.selectedTopics.map(topic => (
                  <span
                    key={topic}
                    className={`${styles.tag} ${styles.tagSelected}`}
                    onClick={() => handleTopicToggle(topic)}
                  >
                    {topic}
                  </span>
                ))}
              </div>
              <div className={styles.tagInputWrapper}>
                <input
                  type="text"
                  value={newTopic}
                  onChange={e => setNewTopic(e.target.value)}
                  placeholder="手动添加考点..."
                  className={styles.tagInput}
                  onKeyPress={e => e.key === 'Enter' && handleTopicSubmit()}
                />
                <button onClick={handleTopicSubmit} className={styles.tagAddButton}>添加</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.modalFooter}>
        <button onClick={handleClose} className={styles.cancelButton}>取消</button>
        <button onClick={handleGenerateExam} disabled={isGenerating} className={styles.generateButton}>
          {isGenerating ? '生成中...' : `生成 ${totalQuestions} 道题`}
        </button>
      </div>
    </>
  );

  const renderContent = () => {
    switch (step) {
      case 'settings':
        return renderSettings();
      case 'generating':
      return (
        <div className={styles.centeredContent}>
            <div className={styles.spinner}></div>
            <h3 className={styles.loadingTitle}>AI 正在为您精心组卷...</h3>
            <p className={styles.loadingText}>请稍候，这可能需要一点时间</p>
        </div>
      )
      case 'error':
        return (
          <div className={styles.centeredContent}>
            <AlertCircle size={48} className={styles.errorIcon} />
            <h3 className={styles.loadingTitle}>出错了</h3>
            <p className={styles.errorText}>{error}</p>
            <button
              type="button"
              onClick={() => setStep('settings')}
              className={styles.submitButton}
            >
              返回设置
            </button>
          </div>
        )
      default:
        return renderSettings();
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
                  <div>
            <h2>智能考试生成器</h2>
            {source === 'flashcards' 
              ? <p>基于 {selectedCardsCount} 张已选闪卡</p>
              : <p>基于上传的文档内容</p>
            }
                  </div>
          <button onClick={handleClose} className={styles.closeButton}>
            &times;
              </button>
            </div>
            {renderContent()}
            
      </div>
    </div>
  )
}

export default ExamGeneratorModal 