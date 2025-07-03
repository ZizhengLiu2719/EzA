/**
 * AI Exam Generator Service
 * Intelligently generates personalized exams, provides automated scoring, and in-depth analysis.
 */

import mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';
import { getAIModel } from '../config/aiModel';
import type { ExamConfiguration, ExamQuestion, ExamResponse, ExamResult, GeneratedExam } from '../types/examTypes';
import { FSRSCard } from '../types/SRSTypes';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export type { ExamConfiguration, ExamQuestion, ExamResponse, ExamResult, GeneratedExam };

export interface AdaptiveExamSettings {
  initial_difficulty: number
  adaptation_rate: number // Adaptation sensitivity
  minimum_questions: number
  maximum_questions: number
  termination_criteria: {
    confidence_threshold: number // Confidence level of the ability estimate
    standard_error_threshold: number
    time_limit?: number
  }
  ability_estimation_method: 'irt' | 'cat' | 'hybrid'
}

class ExamAI {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY
    this.baseUrl = 'https://api.openai.com/v1'
  }

  /**
   * Generates a personalized exam based on flashcards.
   */
  async generateExamFromCards(
    cards: FSRSCard[],
    config: ExamConfiguration,
    isProfessorMode: boolean = false
  ): Promise<GeneratedExam> {
    const professorModeInstruction = isProfessorMode 
      ? `**Style Instruction (Professor Mode):** 
Please adopt the style of a top-tier university professor when creating questions. Avoid simple recall-based questions and focus on assessing the student's ability to analyze, evaluate, and apply knowledge. The questions should be profound and challenging, possibly requiring the integration of multiple concepts.`
      : '';

    const prompt = `
As an expert in exam design, generate a highly personalized exam based on the provided flashcard data and FSRS spaced repetition algorithm information.

**Question Selection Strategy:**
Prioritize assessing the student's weaker areas. When selecting questions, focus on cards with **low stability**, **high lapses (error count)**, or **due dates that have passed**, as these indicate potential weaknesses. Use this data intelligently to select questions that maximize the review efficiency of this exam.

${professorModeInstruction}

Exam Configuration:
- Title: ${config.title}
- Subject: ${config.subject}
- Duration: ${config.duration} minutes
- Total Points: ${config.total_points}
- Topics: ${config.topics.join(', ')}

Question Distribution Requirements:
${config.question_distribution.map(dist => 
  `- ${dist.type}: ${dist.count} questions, ${dist.points_per_question} points each`
).join('\n')}

Difficulty Distribution:
${config.difficulty_distribution.map(dist => 
  `- Difficulty ${dist.difficulty_range[0]}-${dist.difficulty_range[1]}: ${dist.percentage}%`
).join('\n')}

Cognitive Level Distribution:
${config.cognitive_distribution.map(dist => 
  `- ${dist.level}: ${dist.percentage}%`
).join('\n')}

Available Flashcards (${cards.length}) - FSRS Data:
${cards.slice(0, 150).map((card, index) => {
  const isDue = new Date(card.due) <= new Date();
  return `${index + 1}. Question: ${card.question.substring(0, 100)}...
   Answer: ${card.answer.substring(0, 100)}...
   FSRS Data: stability=${card.stability.toFixed(2)}, lapses=${card.lapses}, due=${new Date(card.due).toLocaleDateString()}, is_due=${isDue ? 'YES' : 'NO'}`
}).join('\n')}
${cards.length > 150 ? `\n... and ${cards.length - 150} other cards` : ''}

Learning Objectives:
${config.learning_objectives.join('\n')}

Please generate a complete exam including the following:
1. A diverse mix of question types
2. Conformance to the specified difficulty and cognitive distributions
3. Clear question wording
4. Accurate answers and grading criteria
5. Helpful hints and explanations
6. Detailed answer rationales

Output the complete exam structure in JSON format.
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.5,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      })

      return this.parseGeneratedExam(response, config)
    } catch (error) {
      console.error('Exam generation failed:', error)
      return this.getFallbackExam(cards, config)
    }
  }

  /**
   * Smart Scoring and Analysis
   */
  async scoreExam(
    exam: GeneratedExam,
    responses: ExamResponse[]
  ): Promise<ExamResult> {
    const prompt = `
As an experienced AI educational analyst, please conduct a rigorous, detailed scoring and in-depth diagnostic analysis of the following exam session.

### Critical Task Requirements

1.  **Mandatory Per-Question Scoring**:
    -   You **must** evaluate every student answer.
    -   Based on the provided correct answers, assign an \`is_correct\` (true/false) and a specific \`score\` for each question.
    -   For subjective questions, award reasonable partial credit based on the quality and completeness of the answer.
    -   Provide brief, targeted \`feedback\` for each question.

2.  **In-depth Diagnostic Analysis**:
    -   **Strengths**: Summarize what the student did well.
    -   **Weaknesses & Error Patterns**: **This is the most critical part.** Deeply analyze the student's error patterns. Don't just say "Question 5 was wrong." Explain **why** it was wrong. For example: "The student appears to confuse the concepts of 'mutation' and 'side effect', leading to errors in all related React Hooks questions." Pinpoint the fundamental gaps in their knowledge structure.
    -   **Overall Feedback**: Provide actionable, global recommendations for improvement.

3.  **Calculate Totals and Grade**:
    -   Sum up all scores to calculate \`totalScore\` and \`percentage\`.
    -   Assign a \`grade_level\` (A, B, C, D, F) based on the percentage: A (90-100%), B (80-89%), C (70-79%), D (60-69%), F (<60%).

### **Strict Output Format (JSON)**

You **must** strictly adhere to the JSON structure below. **No fields can be omitted**, especially the \`scored_questions\` and \`grade_level\` fields.

\`\`\`json
{
  "totalScore": 100,
  "percentage": 85.5,
  "grade_level": "B",
  "analysis": {
    "strengths": ["Demonstrates a solid understanding of core concept A."],
    "weaknesses": ["Shows confusion when applying knowledge point B."]
  },
  "feedback": ["Overall performance is good. Recommend more practice on type C problems."],
  "scored_questions": [
    {
      "question_id": "q_12345",
      "is_correct": true,
      "score": 10,
      "feedback": "Correct answer with in-depth analysis."
    }
  ]
}
\`\`\`

---
### Exam Data

**Exam Information:**
- Title: ${exam.config.title}
- Total Points: ${exam.config.total_points}

**Questions & Correct Answers:**
${exam.questions.map(q => `
- Question ID: ${q.id}
  - Question: ${q.question}
  - Correct Answer: ${Array.isArray(q.correct_answer) ? q.correct_answer.join(', ') : q.correct_answer}
  - Points: ${q.points}
  - Type: ${q.type}
  - Topic: ${q.topic}
`).join('')}

**Student Answers:**
${responses.map(r => `
- Question ID: ${r.question_id}
  - Student Answer: ${Array.isArray(r.student_answer) ? r.student_answer.join(', ') : r.student_answer}
`).join('')}
---
Now, please provide the complete analysis in the specified JSON format.
`

    const response = await this.callOpenAI(prompt, {
      temperature: 0.2, // Lower temperature for more deterministic scoring
      max_tokens: 4000,
      response_format: { type: "json_object" },
    })

    try {
      // Use robust JSON parsing
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI response did not contain a valid JSON object.");
      }
      let parsed = JSON.parse(jsonMatch[0]);

      // Handle cases where the response is nested under a key like "ExamResult"
      if (parsed.ExamResult) {
        parsed = parsed.ExamResult;
      }

      // Stricter validation based on the ExamResult type
      if (
        !parsed.analysis ||
        !parsed.grade_level ||
        !Array.isArray(parsed.analysis.strengths) ||
        !Array.isArray(parsed.analysis.weaknesses) ||
        !Array.isArray(parsed.scored_questions)
      ) {
        throw new Error(
          "AI response is missing required fields for exam scoring (analysis, grade_level, scored_questions)."
        )
      }
      return parsed as ExamResult
    } catch (error: any) {
      console.error('Failed to parse scored exam from AI:', error, 'Raw response:', response);
      throw new Error(`AI failed to return a valid scored exam. ${error.message}`);
    }
  }

  /**
   * Adaptive Exam Engine
   */
  async generateAdaptiveQuestion(
    current_ability_estimate: number,
    previous_responses: ExamResponse[],
    available_questions: ExamQuestion[],
    settings: AdaptiveExamSettings
  ): Promise<{
    next_question: ExamQuestion
    reasoning: string
    confidence: number
    estimated_ability_range: [number, number]
    continue_exam: boolean
  }> {
    const prompt = `
As an adaptive testing expert, select the optimal next question based on the student's current performance:

**Student's Current State:**
- Estimated Ability (Theta): ${current_ability_estimate.toFixed(3)}
- Performance History (${previous_responses.length} questions answered):
${previous_responses.map(r => `  - Q-ID ${r.question_id}: Answered: "${Array.isArray(r.student_answer) ? r.student_answer.join(', ') : r.student_answer}", Confidence: ${r.confidence_level || 'N/A'}`).join('\n')}

**Available Question Bank (${available_questions.length} questions):**
- Questions are characterized by difficulty, discrimination, and guessing parameters (IRT model).
- The goal is to choose a question that provides the maximum information about the student's true ability level.
- Priority should be given to questions where the student's current ability level has the highest probability of being answered correctly (around 50-70% for maximum information gain), i.e., question difficulty is close to the student's ability.

**Adaptive Settings:**
- Adaptation Rate: ${settings.adaptation_rate} (how aggressively the difficulty adapts)
- Termination Criteria: Stop when confidence > ${settings.termination_criteria.confidence_threshold} or SE < ${settings.termination_criteria.standard_error_threshold}

**Your Task:**
1.  **Select the Next Question:** Choose the single best question from the available bank.
2.  **Provide Reasoning:** Explain *why* you chose this question. (e.g., "This question's difficulty (0.6) is closest to the student's estimated ability (0.55), maximizing information gain.")
3.  **Estimate Confidence:** Provide your confidence level in the current ability estimate.
4.  **Determine Continuation:** Decide if the exam should continue based on the termination criteria.

**Output Format (JSON):**
\`\`\`json
{
  "next_question_id": "q_id_from_bank",
  "reasoning": "Detailed explanation for selecting this question.",
  "confidence": 0.85,
  "estimated_ability_range": [0.45, 0.65],
  "continue_exam": true
}
\`\`\`

**Question Bank Data:**
${available_questions.slice(0, 100).map(q => `- ID: ${q.id}, Difficulty: ${q.difficulty}, Topic: ${q.topic}, Type: ${q.type}`).join('\n')}

Select the next question and provide the analysis in the specified JSON format.
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.3,
        max_tokens: 400
      })

      return this.parseAdaptiveSelection(response, available_questions)
    } catch (error) {
      console.error('Adaptive question selection failed:', error)
      return this.getFallbackAdaptiveSelection(current_ability_estimate, available_questions)
    }
  }

  /**
   * Generates post-exam study recommendations.
   */
  async generateStudyRecommendations(
    exam_result: ExamResult,
    student_learning_profile: {
      learning_style: string
      difficulty_preference: number
      time_availability: number // Daily study time available in minutes
      goal_performance: number // Target score percentage
    }
  ): Promise<{
    immediate_actions: string[]
    short_term_plan: {
      duration: string
      daily_tasks: string[]
      focus_areas: string[]
      practice_suggestions: string[]
    }
    long_term_strategy: {
      duration: string
      milestones: string[]
      skill_development: string[]
      assessment_schedule: string[]
    }
    personalized_tips: string[]
    resource_recommendations: {
      type: 'reading' | 'practice' | 'video' | 'interactive'
      title: string
      description: string
      estimated_time: number
      priority: 'high' | 'medium' | 'low'
    }[]
  }> {
    const performanceGap = student_learning_profile.goal_performance - exam_result.scoring.percentage
    
    const prompt = `
As an expert AI learning coach, create a highly personalized and actionable study plan based on the student's exam results and learning profile.

**Student's Exam Performance:**
- Score: ${exam_result.percentage}%
- Strengths: ${exam_result.analysis.strengths.join(', ')}
- Weaknesses: ${exam_result.analysis.weaknesses.join(', ')}
- Question-specific Feedback:
${exam_result.scored_questions.map(q => `  - Q-ID ${q.question_id}: Score ${q.score}, Feedback: ${q.feedback}`).join('\n')}

**Student's Learning Profile:**
- Learning Style: ${student_learning_profile.learning_style}
- Difficulty Preference: ${student_learning_profile.difficulty_preference}/10
- Daily Study Time: ${student_learning_profile.time_availability} minutes
- Performance Goal: Achieve ${student_learning_profile.goal_performance}%

**Your Task:**
Generate a comprehensive study plan with the following components. The plan must be encouraging, clear, and structured.

1.  **Immediate Actions (Quick Wins):** Suggest 2-3 immediate, simple actions the student can take right now to address the most critical errors from the exam.
2.  **Short-Term Plan (Next 1-2 weeks):**
    -   Define key **focus areas** based on weaknesses.
    -   Create a list of concrete **daily tasks**.
    -   Suggest specific **practice problems** or question types.
3.  **Long-Term Strategy (Beyond 2 weeks):**
    -   Outline major **milestones**.
    -   Suggest skills to develop (e.g., "critical thinking", "problem decomposition").
    -   Propose a schedule for future assessments.
4.  **Personalized Tips:** Provide advice tailored to their learning style and preferences.
5.  **Resource Recommendations:** Recommend a prioritized list of different types of resources (readings, videos, interactive exercises). For each, provide a title, description, estimated time, and priority.

**Output Format (JSON):**
You must return the plan in a valid JSON format.

\`\`\`json
{
  "immediate_actions": ["Review concept X by re-reading chapter 3.", "Redo questions 5 and 8 from the exam."],
  "short_term_plan": {
    "duration": "1 Week",
    "daily_tasks": ["Spend 20 mins on topic Y.", "Complete 5 practice problems on topic Z."],
    "focus_areas": ["Topic Y", "Topic Z"],
    "practice_suggestions": ["Focus on multiple-choice questions involving calculations."]
  },
  "long_term_strategy": {
    "duration": "1 Month",
    "milestones": ["Achieve 85% on the next practice test.", "Master all core concepts of Topic Y."],
    "skill_development": ["Improving problem-solving speed.", "Enhancing analytical skills."],
    "assessment_schedule": ["Take a practice quiz in 2 weeks.", "Full mock exam in 1 month."]
  },
  "personalized_tips": ["Since you prefer visual learning, watch videos on topic Y.", "Try using the Pomodoro technique to manage your study time effectively."],
  "resource_recommendations": [
    {
      "type": "video",
      "title": "Introduction to Topic Y by Khan Academy",
      "description": "A 10-minute video explaining the fundamentals of Topic Y.",
      "estimated_time": 10,
      "priority": "high"
    }
  ]
}
\`\`\`

Now, generate the complete, personalized study plan in JSON format.
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.5,
        max_tokens: 800
      })

      return this.parseStudyRecommendations(response)
    } catch (error) {
      console.error('Study recommendation generation failed:', error)
      return this.getFallbackStudyRecommendations(exam_result, student_learning_profile)
    }
  }

  /**
   * Extracts key topics from a document (PDF, DOCX) to bootstrap exam creation.
   *
   * @param file The document file.
   * @returns A promise that resolves to an array of extracted topic strings.
   */
  async extractTopicsFromDocument(file: File): Promise<string[]> {
    let textContent = '';
    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument(arrayBuffer).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => 'str' in item ? item.str : '').join(' ');
      }
      textContent = text;
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      textContent = result.value;
    } else {
      textContent = await file.text();
    }

    const prompt = `
Analyze the following text from a user's document. Your task is to identify and extract the main topics or key concepts. 
These topics will be used to help the user create a relevant study exam.

**Instructions:**
1.  Read the entire text carefully.
2.  Identify the most important and recurring themes, subjects, or ideas.
3.  List them as a clear, concise list of strings.
4.  Do not invent topics not present in the text.
5.  Return the output as a JSON array of strings.

**Example:**
If the text is about React, you might return: ["React Components", "State and Props", "React Hooks", "Conditional Rendering", "Lifecycle Methods"]

**Text for Analysis:**
---
${textContent.substring(0, 15000)}
---

Now, provide the list of key topics in a JSON array format.
`;

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: "json_object" },
      });
      
      // The response can be a JSON object `{"topics": [...]}` or a raw JSON array `[...]`.
      // It might also be wrapped in markdown.
      const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error("AI response did not contain a valid JSON object or array:", response);
        throw new Error("AI response did not contain a valid JSON object or array.");
      }
      
      const jsonString = jsonMatch[0];
      const parsed = JSON.parse(jsonString);

      let topics: string[] = [];

      if (Array.isArray(parsed)) {
        // Handle case where the AI returns a raw array
        topics = parsed;
      } else if (parsed && typeof parsed === 'object') {
        // Handle case where the AI returns an object like {"topics": [...] }
        topics = parsed.topics || parsed.result || parsed.keywords || [];
      }

      if (Array.isArray(topics) && topics.every(t => typeof t === 'string')) {
        return topics;
      } else {
        console.error("AI response did not match expected format:", parsed);
        throw new Error("AI failed to extract topics in the correct format.");
      }
    } catch (error) {
      console.error('Failed to extract topics from document:', error);
      // Fallback to a simpler keyword extraction if the structured approach fails
      return textContent.split(/\s+/).filter(word => word.length > 5).slice(0, 10);
    }
  }

  // === Private helper methods ===

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
        temperature: options.temperature || 0.6,
        max_tokens: options.max_tokens || 800
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    if (data.error) {
      throw new Error(data.error.message)
    }
    return data.choices[0].message.content
  }

  private parseGeneratedExam(response: string, config: ExamConfiguration): GeneratedExam {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI response did not contain a valid JSON object.");
      }
      let parsed = JSON.parse(jsonMatch[0]);

      // Handle cases where the response is wrapped in an "exam" object
      if (parsed.exam) {
        parsed = parsed.exam;
      }

      let allQuestions: ExamQuestion[] = [];

      if (Array.isArray(parsed.questions)) {
        // Handles the case where "questions" is a flat array
        allQuestions = parsed.questions;
      } else if (typeof parsed.questions === 'object' && parsed.questions !== null) {
        // Handles the case where "questions" is an object grouping questions by type
        for (const type in parsed.questions) {
          if (Object.prototype.hasOwnProperty.call(parsed.questions, type)) {
            const questionsOfType = parsed.questions[type as keyof typeof parsed.questions];
            if (Array.isArray(questionsOfType)) {
              const questionsWithTypes = questionsOfType.map((q: any) => ({
                ...q,
                type: type 
              }));
              allQuestions.push(...questionsWithTypes);
            }
          }
        }
      }
      
      const validQuestions = allQuestions
        .filter(q => 
          q && q.type && q.question && q.correct_answer
        )
        .map((q, index) => ({
          ...q,
          id: q.id || `gen_q_${Date.now()}_${index}` 
        }));

      if (validQuestions.length === 0) {
        console.error('Could not extract any valid questions from the AI response:', parsed);
        throw new Error("AI response did not contain any valid questions.");
      }

      const generatedExam: GeneratedExam = {
        id: parsed.id || `exam_${Date.now()}`,
        config: config,
        questions: validQuestions,
        metadata: parsed.metadata || {},
        instructions: parsed.instructions || "Please review the questions carefully and answer to the best of your ability.",
        answer_key: parsed.answer_key || [],
      };

      return generatedExam;
    } catch (error: any) {
      console.error('Failed to parse generated exam from AI:', error, 'Raw response:', response);
      throw new Error(`AI failed to return a valid exam structure. ${error.message}`);
    }
  }

  private parseAdaptiveSelection(response: string, questions: ExamQuestion[]): any {
    try {
      const parsed = JSON.parse(response)
      const selectedQuestion = questions.find(q => q.id === parsed.next_question_id) || questions[0]
      
      return {
        next_question: selectedQuestion,
        reasoning: parsed.reasoning || 'Selection based on current ability estimate.',
        confidence: parsed.confidence || 0.7,
        estimated_ability_range: parsed.estimated_ability_range || [4, 6],
        continue_exam: parsed.continue_exam !== false
      }
    } catch (error) {
      return this.getFallbackAdaptiveSelection(5, questions)
    }
  }

  private parseStudyRecommendations(response: string): any {
    try {
      return JSON.parse(response)
    } catch (error) {
      return {
        immediate_actions: ['Review weak areas', 'Create a study plan'],
        short_term_plan: {
          duration: '1-2 weeks',
          daily_tasks: ['Review for 30 minutes daily'],
          focus_areas: ['Basic concepts'],
          practice_suggestions: ['Do practice problems']
        },
        long_term_strategy: {
          duration: '1-2 months',
          milestones: ['Improve score by 10 points'],
          skill_development: ['Analytical skills'],
          assessment_schedule: ['Weekly quiz']
        },
        personalized_tips: ['Maintain a regular study schedule'],
        resource_recommendations: []
      }
    }
  }

  // Fallback methods
  private getFallbackExam(cards: FSRSCard[], config: ExamConfiguration): GeneratedExam {
    console.warn("AI exam generation failed. Using fallback exam.");
    
    // Create a basic exam structure from cards as a fallback
    const fallbackQuestions: ExamQuestion[] = cards.slice(0, 10).map((card, index) => ({
      id: `fallback_q_${index + 1}`,
      type: 'short_answer', // Ensure this type is always valid
      question: card.question || "Missing question content",
      correct_answer: card.answer || "Missing answer content",
      points: 10,
      difficulty: card.difficulty || 5,
      estimated_time: 60,
      cognitive_level: 'remember',
      subject_area: config.subject,
      topic: config.topics[0] || 'General',
      explanation: card.answer,
    }));

    return {
      id: `fallback_exam_${Date.now()}`,
      config: config,
      questions: fallbackQuestions, // Ensure questions is always an array
      metadata: {
        generated_at: new Date(),
        total_questions: fallbackQuestions.length,
        estimated_completion_time: fallbackQuestions.length * 60,
        difficulty_average: fallbackQuestions.reduce((acc, q) => acc + q.difficulty, 0) / (fallbackQuestions.length || 1),
        cognitive_level_distribution: { remember: fallbackQuestions.length },
        ai_confidence: 0.1
      },
      instructions: "This is a fallback exam due to a generation error. It contains up to 10 questions based on your flashcards.",
      answer_key: fallbackQuestions.map(q => ({
        question_id: q.id,
        correct_answer: q.correct_answer,
        explanation: q.explanation || "",
        points: q.points
      }))
    };
  }

  private getFallbackExamResult(exam: GeneratedExam, responses: ExamResponse[]): ExamResult {
    const totalScore = responses.reduce((sum, r) => sum + (r.confidence_level || 3) * 2, 0); // Simple scoring based on confidence
    const maxScore = exam.config.total_points;
    const total_time_secs = responses.reduce((sum, r) => sum + r.response_time, 0);

    return {
      totalScore,
      percentage: (totalScore / maxScore) * 100,
      grade_level: 'B',

      scored_questions: responses.map(r => {
        const question = exam.questions.find(q => q.id === r.question_id);
        return {
          question_id: r.question_id,
          is_correct: (r.confidence_level || 0) > 2, // Assume high confidence is correct
          score: (r.confidence_level || 3) * 2,
          feedback: 'AI scoring service is unavailable, this is a fallback feedback.',
        };
      }),

      analysis: {
        strengths: ['Good grasp of basic concepts'],
        weaknesses: ['Application skills need improvement (fallback analysis)'],
        recommendations: ['Do more practice problems related to real-world applications (fallback analysis)'],
        time_analysis: {
          total_time: total_time_secs,
          average_time_per_question: total_time_secs / (responses.length || 1),
          rushed_questions: [],
          over_time_questions: [],
        },
        difficulty_analysis: {
          easy_questions_performance: 0.9,
          medium_questions_performance: 0.8,
          hard_questions_performance: 0.7,
        },
        cognitive_analysis: {
          remember_performance: 0.85,
          understand_performance: 0.8,
          apply_performance: 0.75,
        },
        topic_analysis: exam.config.topics.map(topic => ({
          topic,
          performance: 0.8,
          question_count: Math.floor(exam.questions.length / (exam.config.topics.length || 1)),
        })),
      },

      feedback: [
        'Overall performance is good, but some details need attention (fallback analysis).',
        'AI scoring service is temporarily unavailable, some advanced analysis may be inaccurate.'
      ],
    };
  }

  private getFallbackAdaptiveSelection(ability: number, questions: ExamQuestion[]): any {
    // Simple fallback: pick a question with difficulty closest to the current ability estimate
    const sorted = [...questions].sort((a, b) => 
      Math.abs((a.difficulty || 5) - ability) - Math.abs((b.difficulty || 5) - ability)
    );
    const next_question = sorted[0] || questions[0];
    return {
      next_question_id: next_question?.id,
      reasoning: "Fallback logic: Selected question with difficulty closest to the estimated ability.",
      confidence: 0.5,
      estimated_ability_range: [ability - 0.5, ability + 0.5],
      continue_exam: questions.length > 1
    };
  }

  private getFallbackStudyRecommendations(result: ExamResult, profile: any): any {
    return {
      immediate_actions: [
        'Review incorrect questions from the exam',
        'Identify main areas of weakness',
        'Create a targeted study plan'
      ],
      short_term_plan: {
        duration: '1-2 weeks',
        daily_tasks: [
          `Study for ${profile.time_availability} minutes daily`,
          'Focus on reviewing weak knowledge points',
          'Complete relevant practice problems'
        ],
        focus_areas: result.analysis.weaknesses.slice(0, 3),
        practice_suggestions: [
          'Do more exercises of similar question types',
          'Use spaced repetition for review',
          'Seek help from teachers or classmates'
        ]
      },
      long_term_strategy: {
        duration: '1-2 months',
        milestones: [
          'Improve score in weak areas by 10 points',
          'Achieve overall score target',
          'Establish stable study habits'
        ],
        skill_development: [
          'Improve analytical thinking skills',
          'Enhance problem-solving abilities',
          'Develop critical thinking'
        ],
        assessment_schedule: [
          'Self-test once a week',
          'Mock exam every two weeks',
          'Comprehensive assessment once a month'
        ]
      },
      personalized_tips: [
        `Methods suitable for your ${profile.learning_style} learning style`,
        'Maintain a regular study rhythm',
        'Review promptly to avoid forgetting'
      ],
      resource_recommendations: [
        {
          type: 'practice' as const,
          title: 'Targeted Practice Set',
          description: 'Practice exercises focused on weak areas',
          estimated_time: 30,
          priority: 'high' as const
        },
        {
          type: 'reading' as const,
          title: 'Basic Concepts Review Materials',
          description: 'Consolidate foundational knowledge',
          estimated_time: 20,
          priority: 'medium' as const
        }
      ]
    }
  }
}

export const examAI = new ExamAI()
export default examAI 