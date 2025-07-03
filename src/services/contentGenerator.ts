/**
 * AI content generation service
 * Intelligent generates learning questions, explanations, hints, and related learning materials
 */

import { getAIModel } from '@/config/aiModel'
import { FSRSCard } from '../types/SRSTypes'

export interface GeneratedQuestion {
  id: string
  question: string
  answer: string
  hint?: string
  explanation?: string
  difficulty: number // 1-10
  question_type: 'definition' | 'application' | 'analysis' | 'synthesis' | 'evaluation'
  cognitive_level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'
  estimated_time: number // seconds
  tags: string[]
  source_material?: string
  confidence: number // 0-1, AI's confidence in the quality of the generated content
}

export interface ContentGenerationOptions {
  subject: string
  topic: string
  difficulty_range: [number, number] // [min, max]
  question_count: number
  question_types?: GeneratedQuestion['question_type'][]
  cognitive_levels?: GeneratedQuestion['cognitive_level'][]
  learning_objectives?: string[]
  target_audience: 'high_school' | 'college' | 'graduate'
  time_constraint?: number // Total time limit in minutes
  language_style: 'formal' | 'conversational' | 'technical'
  include_multimedia?: boolean
}

export interface StudyMaterialPackage {
  title: string
  description: string
  learning_objectives: string[]
  prerequisite_knowledge: string[]
  estimated_study_time: number // minutes
  difficulty_progression: number[] // Difficulty for each stage
  content_sections: {
    type: 'introduction' | 'concept' | 'example' | 'practice' | 'assessment'
    title: string
    content: string
    questions: GeneratedQuestion[]
    interactive_elements?: {
      type: 'quiz' | 'simulation' | 'diagram' | 'video'
      description: string
      implementation_hint: string
    }[]
  }[]
  summary: string
  further_reading: string[]
}

export interface ExplanationEnhancement {
  original_explanation: string
  enhanced_explanation: string
  improvement_type: 'clarity' | 'depth' | 'examples' | 'analogies' | 'visual_aids'
  additional_examples: string[]
  analogies: string[]
  common_misconceptions: string[]
  practice_suggestions: string[]
  related_concepts: string[]
}

class ContentGenerator {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY
    this.baseUrl = 'https://api.openai.com/v1'
  }

  /**
   * Intelligently generates learning questions based on a topic.
   */
  async generateQuestions(
    topic: string,
    source_material: string,
    options: ContentGenerationOptions
  ): Promise<GeneratedQuestion[]> {
    const prompt = `
As an expert in educational content, generate high-quality learning questions based on the following materials:

Topic: ${topic}
Subject: ${options.subject}
Target Audience: ${options.target_audience}
Difficulty Range: ${options.difficulty_range[0]}-${options.difficulty_range[1]}
Number of Questions: ${options.question_count}

Source Material:
${source_material}

Learning Objectives:
${options.learning_objectives?.join('\n') || 'Master core concepts and their applications'}

Please generate questions covering different cognitive levels:
1. Remember - Basic facts and concepts
2. Understand - Explanations and summaries
3. Apply - Use knowledge in new situations
4. Analyze - Break down and connect ideas
5. Evaluate - Judge and critique
6. Create - Synthesize new ideas

Each question should include:
- A clear question statement
- An accurate answer
- A helpful hint
- A detailed explanation
- A difficulty rating (1-10)
- The cognitive level classification
- Estimated time to answer
- Relevant tags

Output all questions in a JSON array format.
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.7,
        max_tokens: 1000
      })

      return this.parseGeneratedQuestions(response)
    } catch (error) {
      console.error('Question generation failed:', error)
      return this.getFallbackQuestions(topic, options)
    }
  }

  /**
   * Generates similar questions based on an existing card.
   */
  async generateSimilarQuestions(
    base_card: FSRSCard,
    variation_count: number = 3,
    difficulty_adjustment: number = 0 // -2 to +2
  ): Promise<GeneratedQuestion[]> {
    const prompt = `
Based on this flashcard, generate ${variation_count} similar but different question variations:

Original Card:
Question: ${base_card.question}
Answer: ${base_card.answer}
${base_card.hint ? `Hint: ${base_card.hint}` : ''}
${base_card.explanation ? `Explanation: ${base_card.explanation}` : ''}
Current Difficulty: ${base_card.difficulty}

Variation Requirements:
- Keep the core concept the same.
- Adjust difficulty: ${difficulty_adjustment > 0 ? `Increase by ${difficulty_adjustment}` : difficulty_adjustment < 0 ? `Decrease by ${Math.abs(difficulty_adjustment)}` : 'Keep the same'}
- Use different phrasing.
- Provide new application scenarios.
- Ensure each variation has unique value.

Each variation should include:
1. A rephrased question
2. The corresponding accurate answer
3. An appropriate hint
4. A clear explanation
5. The adjusted difficulty value

Output all variations in a JSON array format.
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.8,
        max_tokens: 800
      })

      return this.parseGeneratedQuestions(response)
    } catch (error) {
      console.error('Similar question generation failed:', error)
      return this.getFallbackSimilarQuestions(base_card, variation_count)
    }
  }

  /**
   * Enhances an existing explanation.
   */
  async enhanceExplanation(
    question: string,
    answer: string,
    current_explanation: string,
    enhancement_focus: ExplanationEnhancement['improvement_type'][]
  ): Promise<ExplanationEnhancement> {
    const prompt = `
As an educational expert, enhance the quality of the explanation for the following learning material:

Question: ${question}
Answer: ${answer}
Current Explanation: ${current_explanation}

Enhancement Focus: ${enhancement_focus.join(', ')}

Please provide:
1. An improved explanation (clearer, more comprehensive)
2. A description of the specific improvement type
3. 2-3 relevant examples
4. 1-2 vivid analogies
5. Clarification of common misconceptions
6. Practice suggestions
7. Connections to related concepts

Ensure the enhanced content is:
- Easier to understand
- Includes concrete examples
- Uses appropriate analogies
- Prevents common errors
- Promotes deep learning

Output the enhanced result in JSON format.
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.6,
        max_tokens: 600
      })

      return this.parseExplanationEnhancement(response, current_explanation)
    } catch (error) {
      console.error('Explanation enhancement failed:', error)
      return this.getFallbackExplanationEnhancement(current_explanation, enhancement_focus)
    }
  }

  /**
   * Generates a complete study material package.
   */
  async generateStudyMaterialPackage(
    topic: string,
    learning_objectives: string[],
    target_duration: number, // minutes
    options: Partial<ContentGenerationOptions>
  ): Promise<StudyMaterialPackage> {
    const prompt = `
Create a complete study material package on "${topic}":

Learning Objectives:
${learning_objectives.join('\n')}

Target Study Time: ${target_duration} minutes
Target Audience: ${options.target_audience || 'college'}
Style: ${options.language_style || 'conversational'}

Your task is to structure a comprehensive learning module. It should include:
1.  **Title & Description:** An engaging title and a brief overview.
2.  **Prerequisites:** What the learner should know beforehand.
3.  **Content Sections:** Break down the topic into logical sections (e.g., Intro, Core Concept, Examples, Practice). For each section, provide content and generate 2-3 relevant questions.
4.  **Interactive Elements:** Suggest ideas for quizzes, simulations, or diagrams.
5.  **Summary:** A concise summary of the key takeaways.
6.  **Further Reading:** A list of resources for deeper study.

The entire package should be cohesive and structured to fit the target study time.
Output the result in a single JSON object.
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.7,
        max_tokens: 3000
      })

      return this.parseStudyMaterialPackage(response, topic)
    } catch (error) {
      console.error('Study material package generation failed:', error)
      return this.getFallbackStudyMaterialPackage(topic, learning_objectives, target_duration)
    }
  }

  /**
   * Fills in missing information for an incomplete flashcard.
   */
  async fillMissingCardInfo(
    incomplete_card: Partial<FSRSCard>,
    context: {
      subject: string
      topic?: string
      difficulty_hint?: number
    }
  ): Promise<{
    suggested_question?: string
    suggested_answer?: string
    suggested_hint?: string
    suggested_explanation?: string
    suggested_tags?: string[]
    confidence: number
  }> {
    const { subject, topic, difficulty_hint } = context;
    const { question, answer, hint, explanation } = incomplete_card;

    const prompt = `
As an AI-powered subject matter expert for ${subject}, complete the following flashcard based on the provided information.

**Context:**
- Subject: ${subject}
- Topic: ${topic || 'General'}
- Target Difficulty: ${difficulty_hint || 'Not specified'}

**Provided Information (some fields may be empty):**
- Question: ${question || ''}
- Answer: ${answer || ''}
- Hint: ${hint || ''}
- Explanation: ${explanation || ''}

**Your Task:**
- If a field is empty, intelligently fill it in based on the other provided fields.
- If 'question' is missing, generate a relevant question based on the answer.
- If 'answer' is missing, provide a concise and accurate answer to the question.
- If 'hint' is missing, create one that guides the user without giving away the answer.
- If 'explanation' is missing, provide a clear and detailed explanation.
- Suggest relevant tags for categorization.
- Provide a confidence score (0-1) for the completed card.

Output the result in a JSON object with the suggested fields.
`
    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.5,
        max_tokens: 500
      })
      return this.parseCardCompletion(response)
    } catch (error) {
      console.error('Card completion failed:', error)
      return this.getFallbackCardCompletion(incomplete_card, context)
    }
  }

  // === 私有辅助方法 ===

  private async callOpenAI(prompt: string, options: any = {}): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: getAIModel(),
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 600
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }

  private parseGeneratedQuestions(response: string): GeneratedQuestion[] {
    try {
      const questions = JSON.parse(response)
      return Array.isArray(questions) ? questions.map((q: any, index: number) => ({
        id: `generated_${Date.now()}_${index}`,
        question: q.question || '',
        answer: q.answer || '',
        hint: q.hint,
        explanation: q.explanation,
        difficulty: q.difficulty || 5,
        question_type: q.question_type || 'definition',
        cognitive_level: q.cognitive_level || 'understand',
        estimated_time: q.estimated_time || 30,
        tags: Array.isArray(q.tags) ? q.tags : [],
        confidence: q.confidence || 0.8
      })) : []
    } catch (error) {
      console.error('问题解析失败:', error)
      return []
    }
  }

  private parseExplanationEnhancement(response: string, original: string): ExplanationEnhancement {
    try {
      const parsed = JSON.parse(response)
      return {
        original_explanation: original,
        enhanced_explanation: parsed.enhanced_explanation || original,
        improvement_type: parsed.improvement_type || 'clarity',
        additional_examples: parsed.additional_examples || [],
        analogies: parsed.analogies || [],
        common_misconceptions: parsed.common_misconceptions || [],
        practice_suggestions: parsed.practice_suggestions || [],
        related_concepts: parsed.related_concepts || []
      }
    } catch (error) {
      return this.getFallbackExplanationEnhancement(original, ['clarity'])
    }
  }

  private parseStudyMaterialPackage(response: string, topic: string): StudyMaterialPackage {
    try {
      const parsed = JSON.parse(response)
      return {
        title: parsed.title || `${topic} - Study Guide`,
        description: parsed.description || `Comprehensive study guide for ${topic}`,
        learning_objectives: parsed.learning_objectives || [],
        prerequisite_knowledge: parsed.prerequisite_knowledge || [],
        estimated_study_time: parsed.estimated_study_time || 60,
        difficulty_progression: parsed.difficulty_progression || [3, 5, 7],
        content_sections: parsed.content_sections || [],
        summary: parsed.summary || '',
        further_reading: parsed.further_reading || []
      }
    } catch (error) {
      return this.getFallbackStudyMaterialPackage(topic, [], 60)
    }
  }

  private parseCardCompletion(response: string): any {
    try {
      return JSON.parse(response)
    } catch (error) {
      return {
        confidence: 0.5
      }
    }
  }

  // 回退方法
  private getFallbackQuestions(topic: string, options: ContentGenerationOptions): GeneratedQuestion[] {
    return Array.from({ length: options.question_count }, (_, i) => ({
      id: `fallback_q_${i}`,
      question: `What is a key concept in ${topic}? (Fallback)`,
      answer: 'This is a fallback answer. Please verify.',
      difficulty: 5,
      question_type: 'definition',
      cognitive_level: 'remember',
      estimated_time: 60,
      tags: [topic],
      confidence: 0.3
    }));
  }

  private getFallbackSimilarQuestions(card: FSRSCard, count: number): GeneratedQuestion[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `fallback_sim_${card.id}_${i}`,
      question: `What is another way to ask about '${card.question.substring(0, 20)}...'?`,
      answer: card.answer,
      difficulty: card.difficulty,
      question_type: 'definition',
      cognitive_level: 'understand',
      estimated_time: 60,
      tags: card.tags || [],
      confidence: 0.3
    }));
  }

  private getFallbackExplanationEnhancement(
    original: string,
    focus: ExplanationEnhancement['improvement_type'][]
  ): ExplanationEnhancement {
    return {
      original_explanation: original,
      enhanced_explanation: `${original}\n\n[Fallback] This explanation could be improved by adding more examples and analogies, focusing on ${focus.join(', ')}.`,
      improvement_type: focus[0] || 'clarity',
      additional_examples: ['Example: Fallback example.'],
      analogies: ['Analogy: This is like... (fallback).'],
      common_misconceptions: ['A common mistake is... (fallback).'],
      practice_suggestions: ['Try to apply this concept to a new problem.'],
      related_concepts: ['This is related to... (fallback).']
    };
  }

  private getFallbackStudyMaterialPackage(
    topic: string,
    objectives: string[],
    duration: number
  ): StudyMaterialPackage {
    return {
      title: `${topic} - Study Guide (Fallback)`,
      description: 'A basic study guide generated as a fallback.',
      learning_objectives: objectives,
      prerequisite_knowledge: ['Basic understanding of the subject.'],
      estimated_study_time: duration,
      difficulty_progression: [3, 5, 7],
      content_sections: [{
        type: 'concept',
        title: `Introduction to ${topic}`,
        content: 'This is the core content for the topic. (Fallback)',
        questions: this.getFallbackQuestions(topic, { topic, question_count: 2, subject: 'any', difficulty_range: [3, 7], target_audience: 'college', language_style: 'formal' })
      }],
      summary: 'This is a summary of the topic. (Fallback)',
      further_reading: ['Search for this topic on a reliable educational website.']
    };
  }

  private getFallbackCardCompletion(card: Partial<FSRSCard>, context: any): any {
    return {
      suggested_question: card.question || 'What is the key idea? (Fallback)',
      suggested_answer: card.answer || 'Provide the answer here. (Fallback)',
      suggested_hint: 'Think about the context. (Fallback)',
      suggested_explanation: 'This requires a detailed explanation. (Fallback)',
      suggested_tags: ['fallback'],
      confidence: 0.2
    };
  }
}

export const contentGenerator = new ContentGenerator()
export default contentGenerator 