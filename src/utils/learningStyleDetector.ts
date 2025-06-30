import { EnhancedAIMessage, LearningBehaviorData, LearningStyle } from '@/types/ai-enhanced'

/**
 * 学习风格检测器
 * 基于VARK学习风格模型和交互行为分析
 */
export class LearningStyleDetector {
  private static instance: LearningStyleDetector
  
  static getInstance(): LearningStyleDetector {
    if (!LearningStyleDetector.instance) {
      LearningStyleDetector.instance = new LearningStyleDetector()
    }
    return LearningStyleDetector.instance
  }

  /**
   * 分析学习风格
   * @param behaviorData 学习行为数据
   * @param messageHistory 消息历史
   * @returns 检测到的学习风格和置信度
   */
  analyzeLearningstyle(
    behaviorData: LearningBehaviorData,
    messageHistory: EnhancedAIMessage[]
  ): {
    detected_style: LearningStyle
    confidence_score: number
    style_distribution: Record<LearningStyle, number>
    evidence: string[]
  } {
    const indicators = this.extractLearningIndicators(behaviorData, messageHistory)
    const scores = this.calculateStyleScores(indicators)
    const dominantStyle = this.determineDominantStyle(scores)
    
    return {
      detected_style: dominantStyle.style,
      confidence_score: dominantStyle.confidence,
      style_distribution: scores,
      evidence: this.generateEvidence(indicators, dominantStyle.style)
    }
  }

  /**
   * 提取学习风格指标
   */
  private extractLearningIndicators(
    behaviorData: LearningBehaviorData,
    messageHistory: EnhancedAIMessage[]
  ): LearningStyleIndicators {
    return {
      // 视觉学习指标
      visual_indicators: {
        diagram_requests: this.countDiagramRequests(messageHistory),
        visual_explanation_preference: this.analyzeVisualPreference(messageHistory),
        spatial_reasoning_questions: this.countSpatialQuestions(messageHistory),
        chart_table_requests: this.countChartRequests(messageHistory)
      },
      
      // 听觉学习指标
      auditory_indicators: {
        discussion_engagement: this.analyzeDiscussionEngagement(messageHistory),
        verbal_explanation_preference: this.analyzeVerbalPreference(messageHistory),
        question_asking_frequency: behaviorData.interaction_patterns.question_asking_frequency,
        dialogue_pattern: this.analyzeDialoguePattern(messageHistory)
      },
      
      // 动觉学习指标
      kinesthetic_indicators: {
        hands_on_requests: this.countHandsOnRequests(messageHistory),
        example_preference: this.analyzeExamplePreference(messageHistory),
        trial_error_pattern: this.analyzeTrialErrorPattern(messageHistory),
        practical_application_focus: this.analyzePracticalFocus(messageHistory)
      },
      
      // 读写学习指标
      reading_writing_indicators: {
        detailed_text_preference: this.analyzeTextPreference(messageHistory),
        note_taking_behavior: this.analyzeNoteTaking(messageHistory),
        text_length_preference: behaviorData.interaction_patterns.message_length_preference,
        written_reflection_frequency: this.analyzeReflectionFrequency(messageHistory)
      },
      
      // 综合指标
      general_indicators: {
        response_time: behaviorData.interaction_patterns.average_response_time,
        help_seeking_pattern: behaviorData.interaction_patterns.help_seeking_pattern,
        preferred_explanation_style: behaviorData.preferences.preferred_explanation_style,
        task_completion_rate: behaviorData.performance_metrics.task_completion_rate
      }
    }
  }

  /**
   * 计算各学习风格得分
   */
  private calculateStyleScores(indicators: LearningStyleIndicators): Record<LearningStyle, number> {
    const scores: Record<LearningStyle, number> = {
      visual: 0,
      auditory: 0,
      kinesthetic: 0,
      reading_writing: 0,
      mixed: 0
    }

    // 视觉学习得分计算
    scores.visual += indicators.visual_indicators.diagram_requests * 15
    scores.visual += indicators.visual_indicators.visual_explanation_preference * 20
    scores.visual += indicators.visual_indicators.spatial_reasoning_questions * 10
    scores.visual += indicators.visual_indicators.chart_table_requests * 15
    
    // 听觉学习得分计算
    scores.auditory += indicators.auditory_indicators.discussion_engagement * 20
    scores.auditory += indicators.auditory_indicators.verbal_explanation_preference * 25
    scores.auditory += Math.min(indicators.auditory_indicators.question_asking_frequency * 5, 20)
    scores.auditory += indicators.auditory_indicators.dialogue_pattern * 15
    
    // 动觉学习得分计算
    scores.kinesthetic += indicators.kinesthetic_indicators.hands_on_requests * 20
    scores.kinesthetic += indicators.kinesthetic_indicators.example_preference * 15
    scores.kinesthetic += indicators.kinesthetic_indicators.trial_error_pattern * 10
    scores.kinesthetic += indicators.kinesthetic_indicators.practical_application_focus * 25
    
    // 读写学习得分计算
    scores.reading_writing += indicators.reading_writing_indicators.detailed_text_preference * 25
    scores.reading_writing += indicators.reading_writing_indicators.note_taking_behavior * 15
    scores.reading_writing += Math.min(indicators.reading_writing_indicators.text_length_preference * 2, 20)
    scores.reading_writing += indicators.reading_writing_indicators.written_reflection_frequency * 10

    // 混合型学习检测
    const sortedScores = Object.values(scores).sort((a, b) => b - a)
    const topScore = sortedScores[0]
    const secondScore = sortedScores[1]
    
    if (topScore > 0 && secondScore > 0 && (topScore - secondScore) < 15) {
      scores.mixed = (topScore + secondScore) * 0.6
    }

    // 标准化分数 (0-100)
    const maxScore = Math.max(...Object.values(scores))
    if (maxScore > 0) {
      Object.keys(scores).forEach(style => {
        scores[style as LearningStyle] = Math.round((scores[style as LearningStyle] / maxScore) * 100)
      })
    }

    return scores
  }

  /**
   * 确定主导学习风格
   */
  private determineDominantStyle(scores: Record<LearningStyle, number>): {
    style: LearningStyle
    confidence: number
  } {
    const sortedEntries = Object.entries(scores).sort(([,a], [,b]) => b - a)
    const [dominantStyle, dominantScore] = sortedEntries[0]
    const [, secondScore] = sortedEntries[1] || ['', 0]
    
    // 计算置信度
    const scoreDifference = dominantScore - secondScore
    const confidence = Math.min(Math.round(dominantScore + scoreDifference * 0.5), 100)
    
    return {
      style: dominantStyle as LearningStyle,
      confidence: Math.max(confidence, 30) // 最低30%置信度
    }
  }

  /**
   * 生成证据说明
   */
  private generateEvidence(indicators: LearningStyleIndicators, style: LearningStyle): string[] {
    const evidence: string[] = []
    
    switch (style) {
      case 'visual':
        if (indicators.visual_indicators.diagram_requests > 2) {
          evidence.push('经常请求图表和图解')
        }
        if (indicators.visual_indicators.visual_explanation_preference > 0.7) {
          evidence.push('偏好视觉化解释')
        }
        if (indicators.visual_indicators.spatial_reasoning_questions > 1) {
          evidence.push('擅长空间推理问题')
        }
        break
        
      case 'auditory':
        if (indicators.auditory_indicators.discussion_engagement > 0.8) {
          evidence.push('积极参与讨论互动')
        }
        if (indicators.auditory_indicators.question_asking_frequency > 5) {
          evidence.push('经常提问和寻求口头解释')
        }
        break
        
      case 'kinesthetic':
        if (indicators.kinesthetic_indicators.hands_on_requests > 3) {
          evidence.push('经常要求实际操作示例')
        }
        if (indicators.kinesthetic_indicators.practical_application_focus > 0.8) {
          evidence.push('注重实际应用和练习')
        }
        break
        
      case 'reading_writing':
        if (indicators.reading_writing_indicators.detailed_text_preference > 0.8) {
          evidence.push('偏好详细的文字说明')
        }
        if (indicators.reading_writing_indicators.text_length_preference > 100) {
          evidence.push('喜欢长篇深入的文字内容')
        }
        break
        
      case 'mixed':
        evidence.push('展现多种学习风格特征')
        evidence.push('能够适应不同的教学方法')
        break
    }
    
    return evidence.length > 0 ? evidence : ['基于综合行为模式分析']
  }

  // 辅助分析方法
  private countDiagramRequests(messages: EnhancedAIMessage[]): number {
    return messages.filter(msg => 
      msg.role === 'user' && 
      (msg.content.toLowerCase().includes('diagram') ||
       msg.content.toLowerCase().includes('chart') ||
       msg.content.toLowerCase().includes('visual') ||
       msg.content.includes('图'))
    ).length
  }

  private analyzeVisualPreference(messages: EnhancedAIMessage[]): number {
    const visualKeywords = ['show', 'draw', 'picture', 'image', 'visual', '画', '图', '看']
    const totalUserMessages = messages.filter(msg => msg.role === 'user').length
    const visualMessages = messages.filter(msg => 
      msg.role === 'user' && 
      visualKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    ).length
    
    return totalUserMessages > 0 ? visualMessages / totalUserMessages : 0
  }

  private countSpatialQuestions(messages: EnhancedAIMessage[]): number {
    const spatialKeywords = ['position', 'location', 'direction', 'spatial', 'geometry', '位置', '方向']
    return messages.filter(msg => 
      msg.role === 'user' && 
      spatialKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    ).length
  }

  private countChartRequests(messages: EnhancedAIMessage[]): number {
    return messages.filter(msg => 
      msg.role === 'user' && 
      (msg.content.toLowerCase().includes('chart') ||
       msg.content.toLowerCase().includes('table') ||
       msg.content.toLowerCase().includes('graph') ||
       msg.content.includes('表格') ||
       msg.content.includes('图表'))
    ).length
  }

  private analyzeDiscussionEngagement(messages: EnhancedAIMessage[]): number {
    const conversationalKeywords = ['discuss', 'talk', 'explain', 'tell me', '讨论', '说明', '解释']
    const totalUserMessages = messages.filter(msg => msg.role === 'user').length
    const conversationalMessages = messages.filter(msg => 
      msg.role === 'user' && 
      conversationalKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    ).length
    
    return totalUserMessages > 0 ? conversationalMessages / totalUserMessages : 0
  }

  private analyzeVerbalPreference(messages: EnhancedAIMessage[]): number {
    const verbalKeywords = ['explain verbally', 'tell me about', 'describe', '口头', '说明', '描述']
    const totalUserMessages = messages.filter(msg => msg.role === 'user').length
    const verbalMessages = messages.filter(msg => 
      msg.role === 'user' && 
      verbalKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    ).length
    
    return totalUserMessages > 0 ? verbalMessages / totalUserMessages : 0
  }

  private analyzeDialoguePattern(messages: EnhancedAIMessage[]): number {
    // 分析对话的互动性 - 短消息频率高表示更偏向对话式学习
    const userMessages = messages.filter(msg => msg.role === 'user')
    const shortMessages = userMessages.filter(msg => msg.content.length < 50)
    
    return userMessages.length > 0 ? shortMessages.length / userMessages.length : 0
  }

  private countHandsOnRequests(messages: EnhancedAIMessage[]): number {
    const handsOnKeywords = ['example', 'practice', 'demo', 'try', 'hands-on', '练习', '示例', '演示']
    return messages.filter(msg => 
      msg.role === 'user' && 
      handsOnKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    ).length
  }

  private analyzeExamplePreference(messages: EnhancedAIMessage[]): number {
    const exampleKeywords = ['example', 'for instance', 'show me how', '例子', '举例', '示例']
    const totalUserMessages = messages.filter(msg => msg.role === 'user').length
    const exampleMessages = messages.filter(msg => 
      msg.role === 'user' && 
      exampleKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    ).length
    
    return totalUserMessages > 0 ? exampleMessages / totalUserMessages : 0
  }

  private analyzeTrialErrorPattern(messages: EnhancedAIMessage[]): number {
    // 分析是否有试错学习模式 - 通过错误反馈的频率判断
    const errorKeywords = ['wrong', 'mistake', 'error', 'incorrect', '错误', '不对', '错了']
    const totalMessages = messages.length
    const errorMessages = messages.filter(msg => 
      errorKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    ).length
    
    return totalMessages > 0 ? errorMessages / totalMessages : 0
  }

  private analyzePracticalFocus(messages: EnhancedAIMessage[]): number {
    const practicalKeywords = ['practical', 'real-world', 'application', 'use case', '实际', '应用', '实用']
    const totalUserMessages = messages.filter(msg => msg.role === 'user').length
    const practicalMessages = messages.filter(msg => 
      msg.role === 'user' && 
      practicalKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    ).length
    
    return totalUserMessages > 0 ? practicalMessages / totalUserMessages : 0
  }

  private analyzeTextPreference(messages: EnhancedAIMessage[]): number {
    const textKeywords = ['detailed', 'comprehensive', 'thorough', 'written', '详细', '全面', '文字']
    const totalUserMessages = messages.filter(msg => msg.role === 'user').length
    const textMessages = messages.filter(msg => 
      msg.role === 'user' && 
      textKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    ).length
    
    return totalUserMessages > 0 ? textMessages / totalUserMessages : 0
  }

  private analyzeNoteTaking(messages: EnhancedAIMessage[]): number {
    const noteKeywords = ['notes', 'summary', 'write down', 'record', '笔记', '总结', '记录']
    const totalUserMessages = messages.filter(msg => msg.role === 'user').length
    const noteMessages = messages.filter(msg => 
      msg.role === 'user' && 
      noteKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    ).length
    
    return totalUserMessages > 0 ? noteMessages / totalUserMessages : 0
  }

  private analyzeReflectionFrequency(messages: EnhancedAIMessage[]): number {
    const reflectionKeywords = ['think about', 'reflect', 'consider', 'ponder', '思考', '反思', '考虑']
    const totalUserMessages = messages.filter(msg => msg.role === 'user').length
    const reflectionMessages = messages.filter(msg => 
      msg.role === 'user' && 
      reflectionKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    ).length
    
    return totalUserMessages > 0 ? reflectionMessages / totalUserMessages : 0
  }
}

// 学习风格指标接口
interface LearningStyleIndicators {
  visual_indicators: {
    diagram_requests: number
    visual_explanation_preference: number
    spatial_reasoning_questions: number
    chart_table_requests: number
  }
  
  auditory_indicators: {
    discussion_engagement: number
    verbal_explanation_preference: number
    question_asking_frequency: number
    dialogue_pattern: number
  }
  
  kinesthetic_indicators: {
    hands_on_requests: number
    example_preference: number
    trial_error_pattern: number
    practical_application_focus: number
  }
  
  reading_writing_indicators: {
    detailed_text_preference: number
    note_taking_behavior: number
    text_length_preference: number
    written_reflection_frequency: number
  }
  
  general_indicators: {
    response_time: number
    help_seeking_pattern: string
    preferred_explanation_style: string
    task_completion_rate: number
  }
}

export const learningStyleDetector = LearningStyleDetector.getInstance() 