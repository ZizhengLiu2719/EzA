import { AIAssistantConfig } from '@/types'

// AI 模式配置
export const AI_MODES = {
  bullet_tutor: {
    name: 'Guided Tutor',
    description: 'Help students think through guided questions',
    icon: '🎯',
    color: '#3b82f6'
  },
  socratic_bot: {
    name: 'Socratic Method',
    description: 'Guide students to discover answers through questions',
    icon: '🤔',
    color: '#8b5cf6'
  },
  quick_fix: {
    name: 'Quick Fix',
    description: 'Provide direct and specific solutions',
    icon: '⚡',
    color: '#f59e0b'
  },
  diagram_ai: {
    name: 'Visual Assistant',
    description: 'Help understanding through charts and diagrams',
    icon: '📊',
    color: '#10b981'
  }
} as const

// 写作风格配置
export const WRITING_STYLES = {
  academic: {
    name: 'Academic Writing',
    description: 'Formal academic paper style',
    features: ['Citation Format', 'Logical Structure', 'Academic Language']
  },
  creative: {
    name: 'Creative Writing',
    description: 'Creative and expressive approach',
    features: ['Vivid Description', 'Emotional Expression', 'Innovative Thinking']
  },
  technical: {
    name: 'Technical Writing',
    description: 'Clear and accurate technical documentation',
    features: ['Precise Description', 'Step-by-step Instructions', 'Professional Terminology']
  }
} as const

// 引用格式配置
export const CITATION_FORMATS = {
  mla: {
    name: 'MLA',
    description: 'Modern Language Association format',
    example: 'Smith, John. "Title." Journal, vol. 1, no. 1, 2024, pp. 1-10.'
  },
  apa: {
    name: 'APA',
    description: 'American Psychological Association format',
    example: 'Smith, J. (2024). Title. Journal, 1(1), 1-10.'
  },
  chicago: {
    name: 'Chicago',
    description: 'Chicago format',
    example: 'Smith, John. "Title." Journal 1, no. 1 (2024): 1-10.'
  }
} as const

// 难度级别配置
export const DIFFICULTY_LEVELS = {
  beginner: {
    name: 'Beginner',
    description: 'Basic concepts and simple applications',
    color: '#10b981'
  },
  intermediate: {
    name: 'Intermediate',
    description: 'Advanced concepts and complex applications',
    color: '#f59e0b'
  },
  advanced: {
    name: 'Advanced',
    description: 'Advanced concepts and professional applications',
    color: '#ef4444'
  }
} as const

// AI 提示词模板
export const PROMPT_TEMPLATES = {
  // 写作任务提示词
  writing: {
    outline: `Please create a detailed outline for the following writing task:

Task Title: {title}
Task Description: {description}
Writing Style: {style}
Citation Format: {citation}

Please provide:
1. Main arguments
2. Supporting evidence
3. Paragraph structure
4. Introduction and conclusion suggestions`,

    revision: `Please review the following article and provide improvement suggestions:

Article Content: {content}
Writing Style: {style}
Target Audience: {audience}

Please focus on:
1. Logical structure
2. Language expression
3. Argument strength
4. Format standards`,

    citation: `Please add {format} format citations to the following content:

Content: {content}
Information to cite: {info}

Please provide:
1. In-text citations
2. Reference list
3. Citation format explanation`
  },

  // STEM 任务提示词
  stem: {
    problem_analysis: `Please analyze the following {subject} problem:

Problem: {problem}
Known Conditions: {conditions}
Goal: {goal}

Please provide:
1. Problem type identification
2. Related concept explanation
3. Solution approach
4. Key step hints`,

    step_by_step: `Please provide step-by-step guidance for the following {subject} problem:

Problem: {problem}
Student's Current Understanding: {understanding}

Please:
1. Confirm student understanding
2. Provide next step hints
3. Guide student thinking
4. Don't give the answer directly`,

    concept_explanation: `Please explain the following {subject} concept:

Concept: {concept}
Student Background: {background}
Application Context: {context}

Please provide:
1. Concept definition
2. Related examples
3. Practical applications
4. Common misconceptions`
  },

  // 阅读任务提示词
  reading: {
    summary: `Please generate a summary for the following reading material:

Material Title: {title}
Material Content: {content}
Focus Requirements: {focus}

Please provide:
1. Main arguments
2. Key concepts
3. Important details
4. Reading suggestions`,

    analysis: `Please analyze the following reading material:

Material: {content}
Analysis Perspective: {perspective}
Depth Requirements: {depth}

Please focus on:
1. Author's intent
2. Argumentation methods
3. Evidence support
4. Logical structure`,

    vocabulary: `Please explain the key terms in the following reading material:

Material: {content}
Term List: {terms}
Context: {context}

Please provide:
1. Term definitions
2. Contextual explanations`
  }
}

// AI 配置验证
export function validateAIConfig(config: AIAssistantConfig): boolean {
  if (!config.mode || !Object.keys(AI_MODES).includes(config.mode)) {
    return false
  }

  if (config.writing_style && !Object.keys(WRITING_STYLES).includes(config.writing_style)) {
    return false
  }

  if (config.citation_format && !Object.keys(CITATION_FORMATS).includes(config.citation_format)) {
    return false
  }

  if (config.difficulty_level && !Object.keys(DIFFICULTY_LEVELS).includes(config.difficulty_level)) {
    return false
  }

  return true
}

// 生成 AI 配置描述
export function getAIConfigDescription(config: AIAssistantConfig): string {
  const mode = AI_MODES[config.mode]?.name || 'Default Mode'
  const model = config.model ? `, ${config.model.toUpperCase()}` : ', GPT-3.5 Turbo'
  const style = config.writing_style ? `, ${WRITING_STYLES[config.writing_style].name} Style` : ''
  const citation = config.citation_format ? `, ${CITATION_FORMATS[config.citation_format].name} Citation Format` : ''
  const difficulty = config.difficulty_level ? `, ${DIFFICULTY_LEVELS[config.difficulty_level].name} Level` : ''

  return `${mode}${model}${style}${citation}${difficulty}`
}

// 获取 AI 模式图标
export function getAIModeIcon(mode: string): string {
  return AI_MODES[mode as keyof typeof AI_MODES]?.icon || '🤖'
}

// 获取 AI 模式颜色
export function getAIModeColor(mode: string): string {
  return AI_MODES[mode as keyof typeof AI_MODES]?.color || '#6b7280'
}

// 格式化 AI 回复
export function formatAIResponse(response: string): string {
  // 移除多余的换行符
  return response.replace(/\n{3,}/g, '\n\n').trim()
}

// 检查 AI 回复质量
export function checkResponseQuality(response: string): {
  score: number
  issues: string[]
} {
  const issues: string[] = []
  let score = 100

  // 检查回复长度
  if (response.length < 50) {
    issues.push('Reply too short')
    score -= 20
  }

  // 检查是否包含具体建议
  if (!response.includes('Suggestion') && !response.includes('Can') && !response.includes('Should')) {
    issues.push('Missing specific suggestions')
    score -= 15
  }

  // 检查是否包含引导性问题
  if (!response.includes('?') && !response.includes('?')) {
    issues.push('Missing guiding questions')
    score -= 10
  }

  // 检查是否过于简单
  if (response.split('.').length < 3) {
    issues.push('Content too simple')
    score -= 15
  }

  return {
    score: Math.max(score, 0),
    issues
  }
}

// 生成 AI 使用统计
export function generateAIUsageStats(conversations: any[]): {
  totalConversations: number
  totalMessages: number
  averageMessagesPerConversation: number
  mostUsedMode: string
  mostUsedType: string
} {
  const stats = {
    totalConversations: conversations.length,
    totalMessages: 0,
    averageMessagesPerConversation: 0,
    mostUsedMode: 'bullet_tutor',
    mostUsedType: 'writing'
  }

  const modeCount: Record<string, number> = {}
  const typeCount: Record<string, number> = {}

  conversations.forEach(conv => {
    if (conv.messages) {
      stats.totalMessages += conv.messages.length
    }
    
    modeCount[conv.mode || 'bullet_tutor'] = (modeCount[conv.mode || 'bullet_tutor'] || 0) + 1
    typeCount[conv.assistant_type] = (typeCount[conv.assistant_type] || 0) + 1
  })

  stats.averageMessagesPerConversation = stats.totalConversations > 0 
    ? Math.round(stats.totalMessages / stats.totalConversations) 
    : 0

  stats.mostUsedMode = Object.keys(modeCount).reduce((a, b) => 
    modeCount[a] > modeCount[b] ? a : b, 'bullet_tutor'
  )

  stats.mostUsedType = Object.keys(typeCount).reduce((a, b) => 
    typeCount[a] > typeCount[b] ? a : b, 'writing'
  )

  return stats
} 