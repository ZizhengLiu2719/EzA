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
    title: '生成写作大纲',
    description: '为你的论文创建详细大纲',
    prompt: '请为我的论文生成一个详细的大纲，包括主要论点、支持论据和段落结构。',
    category: 'writing',
    icon: '📝'
  },
  {
    id: 'writing-revision',
    title: '文章修改建议',
    description: '获得专业的修改建议',
    prompt: '请帮我检查这篇文章，提供关于逻辑结构、语言表达和论证强度的改进建议。',
    category: 'writing',
    icon: '✏️'
  },
  {
    id: 'writing-citation',
    title: '引用格式帮助',
    description: '正确格式化引用',
    prompt: '请帮我按照正确的引用格式整理这些参考文献。',
    category: 'writing',
    icon: '📚'
  },

  // STEM类提示
  {
    id: 'stem-problem-analysis',
    title: '问题分析',
    description: '分析数学或科学问题',
    prompt: '请帮我分析这个问题，识别问题类型、已知条件和解题思路。',
    category: 'stem',
    icon: '🔍'
  },
  {
    id: 'stem-step-by-step',
    title: '分步解题指导',
    description: '获得解题步骤提示',
    prompt: '请为我提供分步解题指导，但不要直接给出答案，让我自己思考。',
    category: 'stem',
    icon: '📊'
  },
  {
    id: 'stem-concept-explanation',
    title: '概念解释',
    description: '理解复杂概念',
    prompt: '请用简单易懂的方式解释这个概念，并提供实际应用的例子。',
    category: 'stem',
    icon: '💡'
  },

  // 阅读类提示
  {
    id: 'reading-summary',
    title: '生成摘要',
    description: '总结阅读材料要点',
    prompt: '请为这篇阅读材料生成一个简洁的摘要，突出主要论点和关键概念。',
    category: 'reading',
    icon: '📖'
  },
  {
    id: 'reading-analysis',
    title: '深度分析',
    description: '分析文章结构和论证',
    prompt: '请分析这篇文章的论证方法、证据支持和逻辑结构。',
    category: 'reading',
    icon: '🔬'
  },
  {
    id: 'reading-vocabulary',
    title: '词汇解释',
    description: '理解专业术语',
    prompt: '请解释这些专业术语的含义，并提供记忆技巧。',
    category: 'reading',
    icon: '📝'
  },

  // 编程类提示
  {
    id: 'programming-algorithm',
    title: '算法设计',
    description: '设计算法解决方案',
    prompt: '请帮我设计一个算法来解决这个问题，考虑时间复杂度和空间复杂度。',
    category: 'programming',
    icon: '⚙️'
  },
  {
    id: 'programming-debug',
    title: '代码调试',
    description: '找出代码中的问题',
    prompt: '请帮我检查这段代码，找出可能的错误和改进建议。',
    category: 'programming',
    icon: '🐛'
  },
  {
    id: 'programming-optimization',
    title: '代码优化',
    description: '优化代码性能',
    prompt: '请帮我优化这段代码，提高执行效率和可读性。',
    category: 'programming',
    icon: '🚀'
  },

  // 通用提示
  {
    id: 'general-study-plan',
    title: '学习计划',
    description: '制定个性化学习计划',
    prompt: '请帮我制定一个针对这个主题的个性化学习计划，包括时间安排和学习方法。',
    category: 'general',
    icon: '📅'
  },
  {
    id: 'general-memory-techniques',
    title: '记忆技巧',
    description: '学习记忆方法',
    prompt: '请推荐一些有效的记忆技巧，帮助我更好地记住这些知识点。',
    category: 'general',
    icon: '🧠'
  },
  {
    id: 'general-exam-prep',
    title: '考试准备',
    description: '制定考试复习策略',
    prompt: '请帮我制定一个考试复习策略，包括重点内容、复习方法和时间安排。',
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
    { id: 'all', name: '全部', icon: '🌟' },
    { id: 'writing', name: '写作', icon: '✍️' },
    { id: 'stem', name: 'STEM', icon: '🧮' },
    { id: 'reading', name: '阅读', icon: '📚' },
    { id: 'programming', name: '编程', icon: '💻' },
    { id: 'general', name: '通用', icon: '🎯' }
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
          <h3>快速提示</h3>
          <p>选择常用提示模板，快速开始对话</p>
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
          <p>该分类下暂无提示模板</p>
        </div>
      )}
    </div>
  )
}

export default AIQuickPrompts 