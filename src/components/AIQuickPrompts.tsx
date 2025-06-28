import { LucideCheck, LucideCopy, LucideLightbulb } from 'lucide-react'
import { useState } from 'react'
import styles from './AIQuickPrompts.module.css'

interface QuickPrompt {
  id: string
  title: string
  description: string
  prompt: string
  category: 'writing' | 'stem' | 'reading' | 'programming' | 'general'
  icon: string
}

const QUICK_PROMPTS: QuickPrompt[] = [
  // 写作类提示
  {
    id: 'writing-outline',
    title: 'Generate Writing Outline',
    description: 'Create detailed outline for your paper',
    prompt: 'Please generate a detailed outline for my paper, including main arguments, supporting evidence, and paragraph structure.',
    category: 'writing',
    icon: '📝'
  },
  {
    id: 'writing-revision',
    title: 'Essay Revision Suggestions',
    description: 'Get professional revision advice',
    prompt: 'Please help me review this essay and provide improvement suggestions on logical structure, language expression, and argument strength.',
    category: 'writing',
    icon: '✏️'
  },
  {
    id: 'writing-citation',
    title: 'Citation Format Help',
    description: 'Format citations correctly',
    prompt: 'Please help me format these references according to the correct citation style.',
    category: 'writing',
    icon: '📚'
  },

  // STEM类提示
  {
    id: 'stem-problem-analysis',
    title: 'Problem Analysis',
    description: 'Analyze math or science problems',
    prompt: 'Please help me analyze this problem, identify the problem type, known conditions, and solution approach.',
    category: 'stem',
    icon: '🔍'
  },
  {
    id: 'stem-step-by-step',
    title: 'Step-by-Step Guidance',
    description: 'Get step-by-step solution hints',
    prompt: 'Please provide step-by-step solution guidance, but don\'t give the answer directly, let me think for myself.',
    category: 'stem',
    icon: '📊'
  },
  {
    id: 'stem-concept-explanation',
    title: 'Concept Explanation',
    description: 'Understand complex concepts',
    prompt: 'Please explain this concept in simple terms and provide practical application examples.',
    category: 'stem',
    icon: '💡'
  },

  // 阅读类提示
  {
    id: 'reading-summary',
    title: 'Generate Summary',
    description: 'Summarize reading material key points',
    prompt: 'Please generate a concise summary for this reading material, highlighting main arguments and key concepts.',
    category: 'reading',
    icon: '📖'
  },
  {
    id: 'reading-analysis',
    title: 'Deep Analysis',
    description: 'Analyze article structure and arguments',
    prompt: 'Please analyze this article\'s argumentation methods, evidence support, and logical structure.',
    category: 'reading',
    icon: '🔬'
  },
  {
    id: 'reading-vocabulary',
    title: 'Vocabulary Explanation',
    description: 'Understand technical terms',
    prompt: 'Please explain the meaning of these technical terms and provide memory techniques.',
    category: 'reading',
    icon: '📝'
  },

  // 编程类提示
  {
    id: 'programming-algorithm',
    title: 'Algorithm Design',
    description: 'Design algorithm solutions',
    prompt: 'Please help me design an algorithm to solve this problem, considering time complexity and space complexity.',
    category: 'programming',
    icon: '⚙️'
  },
  {
    id: 'programming-debug',
    title: 'Code Debugging',
    description: 'Find issues in code',
    prompt: 'Please help me check this code and identify possible errors and improvement suggestions.',
    category: 'programming',
    icon: '🐛'
  },
  {
    id: 'programming-optimization',
    title: 'Code Optimization',
    description: 'Optimize code performance',
    prompt: 'Please help me optimize this code to improve execution efficiency and readability.',
    category: 'programming',
    icon: '🚀'
  },

  // 通用提示
  {
    id: 'general-study-plan',
    title: 'Study Plan',
    description: 'Create personalized study plan',
    prompt: 'Please help me create a personalized study plan for this topic, including time arrangement and study methods.',
    category: 'general',
    icon: '📅'
  },
  {
    id: 'general-memory-techniques',
    title: 'Memory Techniques',
    description: 'Learn memory methods',
    prompt: 'Please recommend some effective memory techniques to help me better remember these knowledge points.',
    category: 'general',
    icon: '🧠'
  },
  {
    id: 'general-exam-prep',
    title: 'Exam Preparation',
    description: 'Create exam review strategy',
    prompt: 'Please help me create an exam review strategy, including key content, review methods, and time arrangement.',
    category: 'general',
    icon: '📋'
  }
]

interface AIQuickPromptsProps {
  onSelectPrompt: (prompt: string) => void
  currentCategory?: string
  disabled?: boolean
}

const AIQuickPrompts: React.FC<AIQuickPromptsProps> = ({
  onSelectPrompt,
  currentCategory,
  disabled = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(currentCategory || 'all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const categories = [
    { id: 'all', name: 'All', icon: '🌟' },
    { id: 'writing', name: 'Writing', icon: '✍️' },
    { id: 'stem', name: 'STEM', icon: '🧮' },
    { id: 'reading', name: 'Reading', icon: '📚' },
    { id: 'programming', name: 'Programming', icon: '💻' },
    { id: 'general', name: 'General', icon: '🎯' }
  ]

  const filteredPrompts = selectedCategory === 'all' 
    ? QUICK_PROMPTS 
    : QUICK_PROMPTS.filter(prompt => prompt.category === selectedCategory)

  const handlePromptClick = (prompt: QuickPrompt) => {
    if (disabled) return
    onSelectPrompt(prompt.prompt)
  }

  const handleCopyPrompt = async (prompt: QuickPrompt) => {
    try {
      await navigator.clipboard.writeText(prompt.prompt)
      setCopiedId(prompt.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy prompt:', error)
    }
  }

  return (
    <div className={styles.quickPrompts}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <LucideLightbulb size={20} />
        </div>
        <div className={styles.headerContent}>
          <h3>Quick Prompts</h3>
          <p>Select common prompt templates to start conversations quickly</p>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className={styles.categoryFilter}>
        {categories.map((category) => (
          <button
            key={category.id}
            className={`${styles.categoryBtn} ${selectedCategory === category.id ? styles.active : ''}`}
            onClick={() => setSelectedCategory(category.id)}
            disabled={disabled}
          >
            <span className={styles.categoryIcon}>{category.icon}</span>
            <span className={styles.categoryName}>{category.name}</span>
          </button>
        ))}
      </div>

      {/* 提示列表 */}
      <div className={styles.promptsList}>
        {filteredPrompts.map((prompt) => (
          <div 
            key={prompt.id}
            className={`${styles.promptItem} ${disabled ? styles.disabled : ''}`}
            onClick={() => handlePromptClick(prompt)}
          >
            <div className={styles.promptHeader}>
              <div className={styles.promptIcon}>{prompt.icon}</div>
              <div className={styles.promptInfo}>
                <h4 className={styles.promptTitle}>{prompt.title}</h4>
                <p className={styles.promptDesc}>{prompt.description}</p>
              </div>
              <button
                className={styles.copyBtn}
                onClick={(e) => {
                  e.stopPropagation()
                  handleCopyPrompt(prompt)
                }}
                disabled={disabled}
              >
                {copiedId === prompt.id ? (
                  <LucideCheck size={16} />
                ) : (
                  <LucideCopy size={16} />
                )}
              </button>
            </div>
            <div className={styles.promptText}>
              {prompt.prompt}
            </div>
          </div>
        ))}
      </div>

      {filteredPrompts.length === 0 && (
        <div className={styles.emptyState}>
          <p>No prompt templates in this category</p>
        </div>
      )}
    </div>
  )
}

export default AIQuickPrompts 