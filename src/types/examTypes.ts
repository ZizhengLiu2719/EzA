/**
 * Types related to Exams, Quizzes, and Assessments
 */

export interface ExamQuestion {
  id: string
  type: 'single_choice' | 'true_false' | 'short_answer' | 'essay' | 'fill_blank' | 'matching'
  question: string
  options?: string[] // for multiple choice
  correct_answer: string | string[]
  points: number
  difficulty: number // 1-10
  estimated_time: number // 秒
  cognitive_level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'
  subject_area: string
  topic: string
  hint?: string
  explanation?: string
  rubric?: {
    excellent: string
    good: string
    satisfactory: string
    needs_improvement: string
  }
}

export interface ExamConfiguration {
  title: string
  subject: string
  topics: string[]
  duration: number // 分钟
  total_points: number
  question_distribution: {
    type: ExamQuestion['type']
    count: number
    points_per_question: number
  }[]
  difficulty_distribution: {
    difficulty_range: [number, number]
    percentage: number
  }[]
  cognitive_distribution: {
    level: ExamQuestion['cognitive_level']
    percentage: number
  }[]
  learning_objectives: string[]
  special_instructions?: string
}

export interface GeneratedExam {
  id: string
  config: ExamConfiguration
  questions: ExamQuestion[]
  metadata: {
    generated_at: Date
    total_questions: number
    estimated_completion_time: number
    difficulty_average: number
    cognitive_level_distribution: Record<string, number>
    ai_confidence: number
  }
  instructions: string
  answer_key: {
    question_id: string
    correct_answer: string | string[]
    explanation: string
    points: number
  }[]
}

export interface ExamResponse {
  question_id: string
  student_answer: string | string[]
  response_time: number // 秒
  confidence_level?: number // 1-5
  flagged_for_review?: boolean
  timestamp: Date
}

export interface ExamSession {
  id: string
  user_id: string
  exam_id: string
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned'
  start_time?: Date
  end_time?: Date
  current_question_index: number
  responses: ExamResponse[]
  time_remaining: number // 秒
  created_at: Date
}

export interface ExamResult {
  totalScore: number
  percentage: number
  analysis: {
    strengths: string[]
    weaknesses: string[]
    recommendations?: string[]
    [key: string]: any // Allow other analysis fields
  }
  feedback: string[]
  scored_questions: {
    question_id: string
    is_correct: boolean
    score: number
    feedback: string
  }[]
  grade_level?: 'A' | 'B' | 'C' | 'D' | 'F'
  [key: string]: any // Allow other top-level fields
} 