import { AIAssistantConfig } from '@/types'

// AI 模式配置
export const AI_MODES = {
  bullet_tutor: {
    name: '引导式导师',
    description: '通过引导式问题帮助学生思考',
    icon: '🎯',
    color: '#3b82f6'
  },
  socratic_bot: {
    name: '苏格拉底式',
    description: '通过提问引导学生发现答案',
    icon: '🤔',
    color: '#8b5cf6'
  },
  quick_fix: {
    name: '快速修复',
    description: '直接提供具体的解决方案',
    icon: '⚡',
    color: '#f59e0b'
  },
  diagram_ai: {
    name: '视觉化助手',
    description: '通过图表和图示帮助理解',
    icon: '📊',
    color: '#10b981'
  }
} as const

// 写作风格配置
export const WRITING_STYLES = {
  academic: {
    name: '学术写作',
    description: '正式的学术论文风格',
    features: ['引用格式', '逻辑结构', '学术语言']
  },
  creative: {
    name: '创意写作',
    description: '富有创意的表达方式',
    features: ['生动描述', '情感表达', '创新思维']
  },
  technical: {
    name: '技术写作',
    description: '清晰准确的技术文档',
    features: ['精确描述', '步骤说明', '专业术语']
  }
} as const

// 引用格式配置
export const CITATION_FORMATS = {
  mla: {
    name: 'MLA',
    description: '现代语言协会格式',
    example: 'Smith, John. "Title." Journal, vol. 1, no. 1, 2024, pp. 1-10.'
  },
  apa: {
    name: 'APA',
    description: '美国心理学协会格式',
    example: 'Smith, J. (2024). Title. Journal, 1(1), 1-10.'
  },
  chicago: {
    name: 'Chicago',
    description: '芝加哥格式',
    example: 'Smith, John. "Title." Journal 1, no. 1 (2024): 1-10.'
  }
} as const

// 难度级别配置
export const DIFFICULTY_LEVELS = {
  beginner: {
    name: '初学者',
    description: '基础概念和简单应用',
    color: '#10b981'
  },
  intermediate: {
    name: '中级',
    description: '进阶概念和复杂应用',
    color: '#f59e0b'
  },
  advanced: {
    name: '高级',
    description: '高级概念和专业应用',
    color: '#ef4444'
  }
} as const

// AI 提示词模板
export const PROMPT_TEMPLATES = {
  // 写作任务提示词
  writing: {
    outline: `请为以下写作任务创建详细大纲：

任务标题：{title}
任务描述：{description}
写作风格：{style}
引用格式：{citation}

请提供：
1. 主要论点
2. 支持论据
3. 段落结构
4. 引言和结论建议`,

    revision: `请审查以下文章并提供改进建议：

文章内容：{content}
写作风格：{style}
目标读者：{audience}

请关注：
1. 逻辑结构
2. 语言表达
3. 论证强度
4. 格式规范`,

    citation: `请为以下内容添加{format}格式的引用：

内容：{content}
需要引用的信息：{info}

请提供：
1. 内文引用
2. 参考文献列表
3. 引用格式说明`
  },

  // STEM 任务提示词
  stem: {
    problem_analysis: `请分析以下{subject}问题：

问题：{problem}
已知条件：{conditions}
目标：{goal}

请提供：
1. 问题类型识别
2. 相关概念解释
3. 解题思路
4. 关键步骤提示`,

    step_by_step: `请为以下{subject}问题提供分步解答：

问题：{problem}
学生当前理解：{understanding}

请：
1. 确认学生理解
2. 提供下一步提示
3. 引导学生思考
4. 不要直接给出答案`,

    concept_explanation: `请解释以下{subject}概念：

概念：{concept}
学生背景：{background}
应用场景：{context}

请提供：
1. 概念定义
2. 相关例子
3. 实际应用
4. 常见误区`
  },

  // 阅读任务提示词
  reading: {
    summary: `请为以下阅读材料生成摘要：

材料标题：{title}
材料内容：{content}
重点要求：{focus}

请提供：
1. 主要论点
2. 关键概念
3. 重要细节
4. 阅读建议`,

    analysis: `请分析以下阅读材料：

材料：{content}
分析角度：{perspective}
深度要求：{depth}

请关注：
1. 作者意图
2. 论证方法
3. 证据支持
4. 逻辑结构`,

    vocabulary: `请解释以下阅读材料中的关键术语：

材料：{content}
术语列表：{terms}
上下文：{context}

请提供：
1. 术语定义
2. 上下文解释
3. 相关概念
4. 记忆技巧`
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
  const mode = AI_MODES[config.mode]?.name || '默认模式'
  const model = config.model ? `，${config.model.toUpperCase()}` : '，GPT-3.5 Turbo'
  const style = config.writing_style ? `，${WRITING_STYLES[config.writing_style].name}风格` : ''
  const citation = config.citation_format ? `，${CITATION_FORMATS[config.citation_format].name}引用格式` : ''
  const difficulty = config.difficulty_level ? `，${DIFFICULTY_LEVELS[config.difficulty_level].name}级别` : ''

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
    issues.push('回复过短')
    score -= 20
  }

  // 检查是否包含具体建议
  if (!response.includes('建议') && !response.includes('可以') && !response.includes('应该')) {
    issues.push('缺少具体建议')
    score -= 15
  }

  // 检查是否包含引导性问题
  if (!response.includes('？') && !response.includes('?')) {
    issues.push('缺少引导性问题')
    score -= 10
  }

  // 检查是否过于简单
  if (response.split('。').length < 3) {
    issues.push('内容过于简单')
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