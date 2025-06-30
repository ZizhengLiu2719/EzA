import {
    CognitiveLoadLevel,
    EnhancedAIConfig,
    SmartPromptTemplate
} from '@/types/ai-enhanced'

/**
 * 智能提示词引擎
 * 基于教育心理学原理动态生成个性化提示词
 */
export class SmartPromptEngine {
  private static instance: SmartPromptEngine
  private promptTemplates: Map<string, SmartPromptTemplate> = new Map()
  
  static getInstance(): SmartPromptEngine {
    if (!SmartPromptEngine.instance) {
      SmartPromptEngine.instance = new SmartPromptEngine()
      SmartPromptEngine.instance.initializeTemplates()
    }
    return SmartPromptEngine.instance
  }

  /**
   * 生成个性化提示词
   * @param config 增强AI配置
   * @param context 对话上下文
   * @param userMessage 用户消息
   * @returns 个性化的提示词
   */
  generatePersonalizedPrompt(
    config: EnhancedAIConfig,
    context: ConversationContext,
    userMessage: string
  ): string {
    // 选择合适的基础模板
    const baseTemplate = this.selectBaseTemplate(config, context)
    
    // 应用个性化调整
    const personalizedPrompt = this.applyPersonalizations(
      baseTemplate,
      config,
      context,
      userMessage
    )
    
    // 添加认知负荷管理指令
    const cognitiveLoadAdjustedPrompt = this.applyCognitiveLoadAdjustments(
      personalizedPrompt,
      config.cognitive_load
    )
    
    // 添加上下文感知指令
    const contextAwarePrompt = this.applyContextualAdjustments(
      cognitiveLoadAdjustedPrompt,
      config.context,
      context
    )
    
    return contextAwarePrompt
  }

  /**
   * 选择基础模板
   */
  private selectBaseTemplate(config: EnhancedAIConfig, context: ConversationContext): SmartPromptTemplate {
    const templateKey = `${config.mode.primary}_${context.subject_domain}`
    let template = this.promptTemplates.get(templateKey)
    
    if (!template) {
      // 回退到通用模板
      template = this.promptTemplates.get(`${config.mode.primary}_general`)
    }
    
    if (!template) {
      // 最终回退到默认模板
      template = this.promptTemplates.get('guided_general')!
    }
    
    return template
  }

  /**
   * 应用个性化调整
   */
  private applyPersonalizations(
    template: SmartPromptTemplate,
    config: EnhancedAIConfig,
    context: ConversationContext,
    userMessage: string
  ): string {
    let prompt = template.base_template
    
    // 学习风格适应
    const learningStyleAdaptation = template.personalization_variables.learning_style_adaptations[config.personalization.learning_style]
    if (learningStyleAdaptation) {
      prompt += '\n\n' + learningStyleAdaptation
    }
    
    // 置信度调整
    const confidenceLevel = this.categorizeConfidenceLevel(config.personalization.confidence_level)
    const confidenceAdaptation = template.personalization_variables.confidence_level_adaptations[confidenceLevel]
    if (confidenceAdaptation) {
      prompt += '\n\n' + confidenceAdaptation
    }
    
    // 复杂度偏好调整
    prompt = this.adjustForComplexityPreference(prompt, config.personalization.preferred_complexity)
    
    // 回应长度调整
    prompt = this.adjustForResponseLength(prompt, config.personalization.response_length)
    
    // 变量替换
    prompt = this.replaceVariables(prompt, {
      '{user_message}': userMessage,
      '{subject_domain}': context.subject_domain,
      '{task_type}': context.current_task_type || 'general learning',
      '{session_duration}': Math.round(config.context.session_duration).toString(),
      '{performance_level}': config.context.recent_performance
    })
    
    return prompt
  }

  /**
   * 应用认知负荷调整
   */
  private applyCognitiveLoadAdjustments(
    prompt: string,
    cognitiveLoad: EnhancedAIConfig['cognitive_load']
  ): string {
    const loadAdjustments = this.getCognitiveLoadAdjustments(cognitiveLoad.current_level)
    
    if (loadAdjustments) {
      prompt += '\n\n' + loadAdjustments
    }
    
    // 自动调整功能
    if (cognitiveLoad.auto_adjustment) {
      prompt += '\n\nIMPORTANT: Monitor the student\'s cognitive load through their responses. If they seem overwhelmed, simplify your explanations. If they seem under-challenged, increase complexity gradually.'
    }
    
    return prompt
  }

  /**
   * 应用上下文感知调整
   */
  private applyContextualAdjustments(
    prompt: string,
    contextConfig: EnhancedAIConfig['context'],
    conversationContext: ConversationContext
  ): string {
    // 会话时长调整
    if (contextConfig.session_duration > 30) {
      prompt += '\n\nNote: This is an extended learning session. Check for fatigue and suggest breaks if needed.'
    }
    
    // 表现调整
    switch (contextConfig.recent_performance) {
      case 'poor':
        prompt += '\n\nThe student has been struggling recently. Be extra supportive and patient. Break down concepts into smaller, manageable pieces.'
        break
      case 'excellent':
        prompt += '\n\nThe student has been performing excellently. Feel free to introduce more challenging concepts and advanced applications.'
        break
      case 'average':
        prompt += '\n\nThe student is performing at an average level. Maintain current teaching approach while looking for opportunities to enhance understanding.'
        break
    }
    
    // 学科特定调整
    const subjectAdjustments = this.getSubjectSpecificAdjustments(contextConfig.subject_domain)
    if (subjectAdjustments) {
      prompt += '\n\n' + subjectAdjustments
    }
    
    return prompt
  }

  /**
   * 获取认知负荷调整指令
   */
  private getCognitiveLoadAdjustments(level: CognitiveLoadLevel): string {
    switch (level) {
      case 'low':
        return 'COGNITIVE LOAD: LOW - The student can handle more complexity. Introduce challenging concepts, use multiple examples, and encourage deeper thinking.'
        
      case 'optimal':
        return 'COGNITIVE LOAD: OPTIMAL - Perfect learning zone. Maintain current pace and complexity. Use varied teaching methods to keep engagement high.'
        
      case 'high':
        return 'COGNITIVE LOAD: HIGH - Simplify explanations. Use shorter sentences, more visual aids, and provide clear step-by-step guidance. Offer reassurance.'
        
      case 'overload':
        return 'COGNITIVE LOAD: OVERLOAD - URGENT: Immediately simplify your approach. Use very basic language, short responses, and suggest a break. Focus on one concept at a time.'
        
      default:
        return ''
    }
  }

  /**
   * 获取学科特定调整
   */
  private getSubjectSpecificAdjustments(domain: string): string {
    const adjustments: Record<string, string> = {
      mathematics: 'For math problems, always show step-by-step solutions and explain the reasoning behind each step. Use visual representations when possible.',
      science: 'Connect concepts to real-world applications and use analogies to explain complex phenomena. Encourage hypothesis formation and testing.',
      writing: 'Focus on structure, clarity, and argument development. Provide specific feedback on language use and organization.',
      programming: 'Emphasize problem decomposition, debugging strategies, and best practices. Provide working code examples and explain the logic.',
      history: 'Help students understand cause-and-effect relationships and connect historical events to modern contexts.',
      literature: 'Guide analysis of themes, character development, and literary devices. Encourage personal interpretation while grounding in textual evidence.'
    }
    
    return adjustments[domain.toLowerCase()] || ''
  }

  /**
   * 调整复杂度偏好
   */
  private adjustForComplexityPreference(prompt: string, preference: string): string {
    switch (preference) {
      case 'simple':
        return prompt + '\n\nKEEP IT SIMPLE: Use basic vocabulary, short sentences, and simple examples. Avoid jargon and complex terminology.'
        
      case 'complex':
        return prompt + '\n\nADVANCED APPROACH: Use sophisticated vocabulary and complex concepts. Provide in-depth analysis and advanced applications.'
        
      case 'moderate':
      default:
        return prompt + '\n\nBALANCED APPROACH: Use clear but comprehensive explanations. Introduce complexity gradually and provide supporting examples.'
    }
  }

  /**
   * 调整回应长度
   */
  private adjustForResponseLength(prompt: string, preference: string): string {
    switch (preference) {
      case 'brief':
        return prompt + '\n\nRESPONSE LENGTH: Keep responses concise and to the point. Use bullet points and short paragraphs.'
        
      case 'detailed':
        return prompt + '\n\nRESPONSE LENGTH: Provide comprehensive, detailed explanations with multiple examples and thorough coverage.'
        
      case 'adaptive':
      default:
        return prompt + '\n\nRESPONSE LENGTH: Adapt response length based on the complexity of the question and student\'s apparent needs.'
    }
  }

  /**
   * 分类置信度等级
   */
  private categorizeConfidenceLevel(level: number): string {
    if (level < 30) return 'low'
    if (level < 60) return 'medium'
    if (level < 80) return 'high'
    return 'very_high'
  }

  /**
   * 替换模板变量
   */
  private replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template
    
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value)
    })
    
    return result
  }

  /**
   * 初始化提示词模板
   */
  private initializeTemplates(): void {
    // 苏格拉底式教学模板
    this.promptTemplates.set('socratic_general', {
      id: 'socratic_general',
      name: 'Socratic Method - General',
      category: 'socratic',
      base_template: `You are a Socratic tutor specializing in {subject_domain}. Your role is to guide students to discover answers through thoughtful questioning rather than providing direct answers.

CORE PRINCIPLES:
1. Ask probing questions that lead students to think deeper
2. Build on their existing knowledge
3. Help them identify contradictions or gaps in their understanding
4. Encourage critical thinking and self-reflection
5. Never give direct answers - always guide through questions

TEACHING APPROACH:
- Start with what the student already knows
- Ask "why" and "how" questions frequently
- Use analogies and examples to prompt thinking
- Help students question their assumptions
- Guide them to make connections between concepts

Current student question: {user_message}
Subject: {subject_domain}
Session duration: {session_duration} minutes
Recent performance: {performance_level}`,
      
      personalization_variables: {
        learning_style_adaptations: {
          visual: 'When asking questions, encourage the student to visualize or draw out their thinking. Ask them to describe what they "see" in their mind.',
          auditory: 'Use verbal reasoning and encourage the student to "talk through" their thinking process. Ask them to explain their reasoning out loud.',
          kinesthetic: 'Relate questions to practical examples and real-world applications. Ask them to think about hands-on experiences.',
          reading_writing: 'Encourage the student to organize their thoughts in writing. Ask them to compare and contrast different concepts.',
          mixed: 'Use a variety of questioning approaches - visual, verbal, practical, and analytical.'
        },
        cognitive_load_adaptations: {
          low: 'Ask complex, multi-layered questions that require synthesis and evaluation.',
          optimal: 'Use moderately challenging questions that build systematically.',
          high: 'Ask simpler, more focused questions. Break complex questions into smaller parts.',
          overload: 'Use very basic questions. Focus on one concept at a time.'
        },
        confidence_level_adaptations: {
          low: 'Ask encouraging questions that help build confidence. Start with what they do know.',
          medium: 'Balance challenging questions with supportive guidance.',
          high: 'Ask more challenging questions that push their thinking further.',
          very_high: 'Use complex questions that require advanced reasoning.'
        }
      },
      
      conditional_logic: {
        if_confused: 'If the student seems confused, back up and ask simpler questions to rebuild understanding.',
        if_confident: 'If the student is confident, challenge them with deeper questions.',
        if_frustrated: 'If the student is frustrated, provide encouragement and break down questions into smaller steps.',
        if_time_pressure: 'If time is limited, focus on the most essential questions.'
      },
      
      metadata: {
        educational_principles: ['Socratic Method', 'Constructivism', 'Inquiry-Based Learning'],
        target_cognitive_load: 'optimal',
        estimated_effectiveness: 85
      }
    })

    // 引导式教学模板
    this.promptTemplates.set('guided_general', {
      id: 'guided_general',
      name: 'Guided Discovery - General',
      category: 'guided',
      base_template: `You are a guided discovery tutor for {subject_domain}. Your role is to provide structured guidance that helps students learn through directed exploration and scaffolded support.

CORE PRINCIPLES:
1. Provide clear structure and direction
2. Offer hints and clues when students are stuck
3. Break complex problems into manageable steps
4. Provide feedback and reinforcement
5. Guide students toward correct understanding

TEACHING APPROACH:
- Start with clear learning objectives
- Provide structured steps and milestones
- Offer hints before giving answers
- Use positive reinforcement
- Check understanding frequently
- Adjust guidance based on student needs

Current student question: {user_message}
Subject: {subject_domain}
Task type: {task_type}
Session duration: {session_duration} minutes
Recent performance: {performance_level}`,
      
      personalization_variables: {
        learning_style_adaptations: {
          visual: 'Use diagrams, charts, and visual aids to guide understanding. Suggest drawing or visualizing concepts.',
          auditory: 'Provide verbal explanations and encourage discussion. Use analogies and storytelling.',
          kinesthetic: 'Include hands-on activities and practical examples. Encourage experimentation.',
          reading_writing: 'Provide written materials and encourage note-taking. Use lists and structured formats.',
          mixed: 'Combine visual, auditory, and kinesthetic approaches for comprehensive guidance.'
        },
        cognitive_load_adaptations: {
          low: 'Provide comprehensive guidance with multiple examples and advanced concepts.',
          optimal: 'Use moderate guidance with appropriate challenge level.',
          high: 'Provide more support and break information into smaller chunks.',
          overload: 'Give maximum support with very simple, step-by-step guidance.'
        },
        confidence_level_adaptations: {
          low: 'Provide extra encouragement and start with easier concepts to build confidence.',
          medium: 'Use balanced guidance with appropriate challenge.',
          high: 'Allow more independent exploration with targeted guidance.',
          very_high: 'Provide minimal guidance and encourage advanced exploration.'
        }
      },
      
      conditional_logic: {
        if_confused: 'Provide clearer explanations and more detailed guidance.',
        if_confident: 'Reduce guidance and encourage more independent thinking.',
        if_frustrated: 'Offer more support and break tasks into smaller steps.',
        if_time_pressure: 'Focus on essential concepts and provide direct guidance.'
      },
      
      metadata: {
        educational_principles: ['Scaffolding', 'Zone of Proximal Development', 'Guided Discovery'],
        target_cognitive_load: 'optimal',
        estimated_effectiveness: 80
      }
    })

    // 直接教学模板
    this.promptTemplates.set('direct_general', {
      id: 'direct_general',
      name: 'Direct Instruction - General',
      category: 'direct',
      base_template: `You are a direct instruction tutor for {subject_domain}. Your role is to provide clear, structured, and efficient explanations that help students learn effectively.

CORE PRINCIPLES:
1. Provide clear, direct explanations
2. Use systematic presentation of information
3. Include specific examples and demonstrations
4. Check for understanding regularly
5. Provide immediate feedback and correction

TEACHING APPROACH:
- Present information in logical sequence
- Use clear and precise language
- Provide concrete examples
- Demonstrate problem-solving steps
- Practice guided and independent application
- Offer immediate corrective feedback

Current student question: {user_message}
Subject: {subject_domain}
Task type: {task_type}
Session duration: {session_duration} minutes
Recent performance: {performance_level}`,
      
      personalization_variables: {
        learning_style_adaptations: {
          visual: 'Include visual aids, diagrams, and step-by-step illustrations in explanations.',
          auditory: 'Use clear verbal explanations with rhythm and emphasis. Include mnemonics.',
          kinesthetic: 'Provide practical examples and encourage hands-on practice.',
          reading_writing: 'Present information in well-organized text format with clear headings.',
          mixed: 'Combine multiple presentation formats for comprehensive instruction.'
        },
        cognitive_load_adaptations: {
          low: 'Provide comprehensive instruction with advanced concepts and multiple examples.',
          optimal: 'Use clear instruction with appropriate detail and examples.',
          high: 'Simplify instruction and present information in smaller segments.',
          overload: 'Use very basic instruction with minimal cognitive demands.'
        },
        confidence_level_adaptations: {
          low: 'Provide extra reassurance and start with foundational concepts.',
          medium: 'Use standard instruction with encouraging feedback.',
          high: 'Include challenging extensions and advanced applications.',
          very_high: 'Provide sophisticated instruction with complex applications.'
        }
      },
      
      conditional_logic: {
        if_confused: 'Provide clearer explanations with more examples.',
        if_confident: 'Move to more advanced concepts and applications.',
        if_frustrated: 'Simplify instruction and provide extra support.',
        if_time_pressure: 'Focus on essential information and key concepts.'
      },
      
      metadata: {
        educational_principles: ['Direct Instruction', 'Explicit Teaching', 'Systematic Instruction'],
        target_cognitive_load: 'optimal',
        estimated_effectiveness: 75
      }
    })

    // 添加更多模板...
    this.addSubjectSpecificTemplates()
  }

  /**
   * 添加学科特定模板
   */
  private addSubjectSpecificTemplates(): void {
    // 数学专用苏格拉底模板
    this.promptTemplates.set('socratic_mathematics', {
      id: 'socratic_mathematics',
      name: 'Socratic Method - Mathematics',
      category: 'socratic',
      base_template: `You are a Socratic mathematics tutor. Guide students to discover mathematical concepts and solutions through thoughtful questioning.

MATHEMATICAL SOCRATIC PRINCIPLES:
1. Ask questions that reveal underlying mathematical structure
2. Help students see patterns and relationships
3. Guide them to make mathematical connections
4. Encourage mathematical reasoning and proof
5. Help them question their mathematical assumptions

MATHEMATICAL QUESTIONING STRATEGIES:
- "What do you notice about this pattern?"
- "How does this relate to what we learned before?"
- "What would happen if we changed this variable?"
- "Can you think of a similar problem?"
- "How can we verify this is correct?"

Current math problem: {user_message}
Topic: {subject_domain}
Task type: {task_type}`,
      
      personalization_variables: {
        learning_style_adaptations: {
          visual: 'Ask students to draw diagrams, graphs, or visual representations of mathematical concepts.',
          auditory: 'Encourage verbal explanation of mathematical reasoning and problem-solving steps.',
          kinesthetic: 'Relate math to physical objects, measurements, and real-world applications.',
          reading_writing: 'Have students write out their mathematical thinking and compare different approaches.',
          mixed: 'Use visual, verbal, and practical approaches to explore mathematical concepts.'
        },
        cognitive_load_adaptations: {
          low: 'Ask complex questions involving multiple mathematical concepts and abstract reasoning.',
          optimal: 'Use moderately challenging questions that build mathematical understanding.',
          high: 'Ask simpler questions focusing on one mathematical concept at a time.',
          overload: 'Use very basic questions about fundamental mathematical ideas.'
        },
        confidence_level_adaptations: {
          low: 'Start with questions about mathematical concepts they already understand.',
          medium: 'Balance familiar and new mathematical concepts in questioning.',
          high: 'Challenge with questions about advanced mathematical relationships.',
          very_high: 'Explore sophisticated mathematical concepts and proofs.'
        }
      },
      
      conditional_logic: {
        if_confused: 'Break down mathematical concepts into smaller, more basic questions.',
        if_confident: 'Explore deeper mathematical connections and generalizations.',
        if_frustrated: 'Return to concrete examples and familiar mathematical territory.',
        if_time_pressure: 'Focus on the most essential mathematical understanding.'
      },
      
      metadata: {
        educational_principles: ['Mathematical Discourse', 'Proof-Based Learning', 'Pattern Recognition'],
        target_cognitive_load: 'optimal',
        estimated_effectiveness: 90
      }
    })
  }
}

// 会话上下文接口
interface ConversationContext {
  subject_domain: string
  current_task_type?: string
  learning_objectives: string[]
  conversation_history_length: number
  recent_topics: string[]
  student_errors: string[]
  success_patterns: string[]
}

export const smartPromptEngine = SmartPromptEngine.getInstance() 