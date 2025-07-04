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
    const totalQuestionsRequired = config.question_distribution.reduce((sum, dist) => sum + dist.count, 0);
    let generatedQuestions: ExamQuestion[] = [];
    let attempts = 0;
    const maxAttempts = 3;

    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);

    while (generatedQuestions.length < totalQuestionsRequired && attempts < maxAttempts) {
        attempts++;
        const questionsNeeded = totalQuestionsRequired - generatedQuestions.length;

        const currentConfig = {
            ...config,
            question_distribution: this.calculateRemainingDistribution(config.question_distribution, generatedQuestions, questionsNeeded),
        };
        
    const professorModeInstruction = isProfessorMode 
      ? `**Style Instruction (Professor Mode):** 
Please adopt the style of a top-tier university professor when creating questions. Avoid simple recall-based questions and focus on assessing the student's ability to analyze, evaluate, and apply knowledge. The questions should be profound and challenging, possibly requiring the integration of multiple concepts.`
      : '';

    const prompt = `
As an expert in exam design, generate a highly personalized exam based on the provided flashcard data and FSRS spaced repetition algorithm information. You must generate exactly the number of questions specified in the distribution.
Attempt ${attempts}/${maxAttempts}. You need to generate ${questionsNeeded} more questions.
${ generatedQuestions.length > 0 ? `AVOID REPEATING: You have already generated ${generatedQuestions.length} questions. Do not generate questions similar to these existing ones.` : '' }
**CRITICAL JSON FORMAT REQUIREMENTS:**
- Return ONLY valid JSON without any markdown formatting or code blocks
- Use double quotes for all strings
- Avoid control characters (newlines, tabs, etc.) within string values
- Use proper JSON escaping for quotes within strings
- No trailing commas
- All property names must be quoted
**Required JSON Structure:**
{
  "title": "Exam Title",
  "subject": "Subject Name",
  "duration": "Duration in minutes",
  "totalPoints": 100,
  "questions": [
    {
      "id": "q_1",
      "type": "single_choice",
      "question": "Question text without control characters",
      "options": [
        {"option": "A", "text": "Option A text"},
        {"option": "B", "text": "Option B text"},
        {"option": "C", "text": "Option C text"},
        {"option": "D", "text": "Option D text"}
      ],
      "correctAnswer": "A",
      "points": 5,
      "difficulty": 5,
      "cognitiveLevel": "understand",
      "hint": "Helpful hint text"
    }
  ]
}
**Creativity & Variety Mandate:**
You MUST ensure a high degree of novelty in the generated questions. AVOID rephrasing or slightly modifying questions from the source flashcards. Instead, generate questions that test the underlying concepts in NEW and UNEXPECTED ways. Each question should be distinct from the source material and any other questions in this exam.
**Rule for Multiple Choice Questions:**
- All questions of type 'single_choice' MUST have exactly 4 options.
Exam Configuration:
- Title: ${currentConfig.title}
- Subject: ${currentConfig.subject}
- Duration: ${currentConfig.duration} minutes
- Total Points: ${currentConfig.total_points}
- Topics: ${currentConfig.topics.join(', ')}
Question Distribution Requirements:
${currentConfig.question_distribution.map(dist => 
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
${shuffledCards.slice(0, 150).map((card, index) => {
  const isDue = new Date(card.due) <= new Date();
  return `${index + 1}. Question: ${card.question.substring(0, 100)}...
   Answer: ${card.answer.substring(0, 100)}...
   FSRS Data: stability=${card.stability.toFixed(2)}, lapses=${card.lapses}, due=${new Date(card.due).toLocaleDateString()}, is_due=${isDue ? 'YES' : 'NO'}`
}).join('\n')}
${cards.length > 150 ? `\n... and ${cards.length - 150} other cards` : ''}
Learning Objectives:
${config.learning_objectives.join('\n')}
Generate a complete exam with:
1. A diverse mix of question types
2. Conformance to the specified difficulty and cognitive distributions
3. Clear question wording WITHOUT control characters
4. Accurate answers and grading criteria
5. Helpful hints and explanations
6. Clean, parseable JSON format
Return the complete exam structure in the exact JSON format specified above.
`
    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.7 + attempts * 0.1,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      })

      const parsedExam = this.parseGeneratedExam(response, config);
      const newQuestions = parsedExam.questions.filter(newQ => 
          !generatedQuestions.some(existingQ => existingQ.question === newQ.question)
      );
      generatedQuestions.push(...newQuestions);

    } catch (error) {
          console.error(`Exam generation attempt ${attempts} failed:`, error);
          if (attempts >= maxAttempts) {
             if (generatedQuestions.length > 0) {
                 break; 
             }
             throw new Error(`Failed to generate any questions after ${maxAttempts} attempts.`);
          }
        }
    }
    
    if (generatedQuestions.length < totalQuestionsRequired) {
        console.warn(`AI only generated ${generatedQuestions.length}/${totalQuestionsRequired} questions after ${maxAttempts} attempts. Proceeding with a partial exam.`);
    }

    const finalQuestions = generatedQuestions.slice(0, totalQuestionsRequired);
    const finalExam: GeneratedExam = {
        id: `exam_${Date.now()}`,
        config: {
            ...config,
            total_points: finalQuestions.reduce((sum, q) => sum + q.points, 0),
        },
        questions: finalQuestions,
        metadata: {
          generated_at: new Date(),
          total_questions: finalQuestions.length,
          estimated_completion_time: finalQuestions.reduce((sum, q) => sum + (q.estimated_time || 60), 0),
          difficulty_average: finalQuestions.reduce((sum, q) => sum + q.difficulty, 0) / (finalQuestions.length || 1),
          cognitive_level_distribution: {},
          ai_confidence: 0.85 
        },
        instructions: "Please answer the following questions to the best of your ability.",
        answer_key: [],
    };

    return finalExam;
  }

  /**
   * Generates an exam from raw text content.
   */
  async generateExamFromContent(
    content: string,
    config: ExamConfiguration,
    isProfessorMode: boolean = false
  ): Promise<GeneratedExam> {
    const totalQuestionsRequired = config.question_distribution.reduce((sum, dist) => sum + dist.count, 0);

    const professorModeInstruction = isProfessorMode 
      ? `**Style Instruction (Professor Mode):** 
Please adopt the style of a top-tier university professor when creating questions. Avoid simple recall-based questions and focus on assessing the student's ability to analyze, evaluate, and apply knowledge. The questions should be profound and challenging, possibly requiring the integration of multiple concepts.`
      : '';

    const prompt = `
As an expert in exam design, generate a high-quality exam based on the provided document content. You must generate exactly the number of questions specified in the distribution.
**CRITICAL JSON FORMAT REQUIREMENTS:**
- Return ONLY valid JSON without any markdown formatting or code blocks.
- Use double quotes for all strings and property names.
- No trailing commas.
**Required JSON Structure:**
{
  "title": "Exam Title",
  "subject": "Subject Name",
  "duration": "Duration in minutes",
  "questions": [
    {
      "id": "q_1",
      "type": "single_choice",
      "question": "Question text...",
      "options": [
        {"option": "A", "text": "Option A"},
        {"option": "B", "text": "Option B"},
        {"option": "C", "text": "Option C"},
        {"option": "D", "text": "Option D"}
      ],
      "correctAnswer": "A",
      "points": 5
    }
  ]
}
**Creativity & Variety Mandate:**
You MUST ensure a high degree of novelty in the generated questions. AVOID rephrasing or slightly modifying sentences from the source document. Instead, generate questions that test the underlying concepts in NEW and UNEXPECTED ways.
**Rule for Multiple Choice Questions:**
- All questions of type 'single_choice' MUST have exactly 4 options.
**Exam Configuration:**
- Title: ${config.title}
- Subject: ${config.subject}
- Duration: ${config.duration} minutes
- Total Points: ${config.total_points}
- Topics to Focus On: ${config.topics.join(', ')}
**Question Distribution Requirements:**
${config.question_distribution.map(dist => 
  `- ${dist.type}: ${dist.count} questions, ${dist.points_per_question} points each`
).join('\n')}
**Source Document Content (first 15000 chars):**
---
${content.substring(0, 15000)}
---
Generate a complete exam based on the provided configuration and document content. Return the complete exam structure in the exact JSON format specified above.
`;

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      });
      return this.parseGeneratedExam(response, config);
    } catch (error) {
      console.error('Exam generation from content failed:', error);
      throw new Error(`Failed to generate exam from content: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Helper to calculate remaining question distribution for retries.
  */
  private calculateRemainingDistribution(
      originalDistribution: ExamConfiguration['question_distribution'], 
      generatedQuestions: ExamQuestion[],
      questionsNeeded: number
  ): ExamConfiguration['question_distribution'] {
      const generatedCounts: { [key: string]: number } = {};
      generatedQuestions.forEach(q => {
          generatedCounts[q.type] = (generatedCounts[q.type] || 0) + 1;
      });

      let remainingDistribution = originalDistribution.map(dist => ({
          ...dist,
          count: Math.max(0, dist.count - (generatedCounts[dist.type] || 0))
      })).filter(dist => dist.count > 0);
      
      if (remainingDistribution.length === 0 && questionsNeeded > 0) {
          return [{ type: 'single_choice', count: questionsNeeded, points_per_question: 5 }];
      }

      return remainingDistribution;
  }

  /**
   * Smart Scoring and Analysis
   */
  async scoreExam(
    exam: GeneratedExam,
    responses: ExamResponse[]
  ): Promise<ExamResult> {
    // 1. Calculate total time spent from responses
    const totalTimeTaken = responses.reduce((sum, r) => sum + r.response_time, 0);

    // 2. Perform objective scoring first, preserving response time
    const scoredQuestions: any[] = responses.map(response => {
      const question = exam.questions.find(q => q.id === response.question_id);
      if (!question) return null;

      let score = 0;
      let is_correct = false;
      const objectiveTypes = ['single_choice', 'true_false', 'multiple_choice'];

      if (objectiveTypes.includes(question.type)) {
        const getAnswerKey = (str: unknown): string => {
            const s = String(str).toLowerCase().trim();
            if (s === 'true' || s === 'false') return s;
            const match = s.match(/^[a-z](?=[). ]|$)/);
            return match ? match[0] : s;
        };

        const correctAnswerKey = getAnswerKey(question.correct_answer);
        const studentAnswerKey = getAnswerKey(response.student_answer);
        
        if (studentAnswerKey.startsWith(correctAnswerKey)) {
            score = question.points;
            is_correct = true;
        }
      }

      return {
        question_id: response.question_id,
        is_correct,
        score: parseFloat(score.toFixed(2)),
        feedback: is_correct ? 'Correct.' : `The correct answer is ${question.correct_answer}.`,
        response_time: response.response_time
      };
    }).filter(q => q !== null);

    // 3. Get rich AI-driven analysis for the entire exam performance
    const analysis = await this.getAIAnalysis(exam, scoredQuestions);

    // 4. Calculate final scores
    const totalScore = scoredQuestions.reduce((sum, q) => sum + q.score, 0);
    const totalPossiblePoints = exam.config.total_points > 0 ? exam.config.total_points : exam.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = totalPossiblePoints > 0 ? (totalScore / totalPossiblePoints) * 100 : 0;
    
    let finalGrade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    if (percentage >= 90) finalGrade = 'A';
    else if (percentage >= 80) finalGrade = 'B';
    else if (percentage >= 70) finalGrade = 'C';
    else if (percentage >= 60) finalGrade = 'D';

    // 5. Populate the final result object
    return {
      totalScore: parseFloat(totalScore.toFixed(2)),
      percentage: parseFloat(percentage.toFixed(2)),
      grade_level: finalGrade,
      scored_questions: scoredQuestions,
      analysis: {
        ...analysis, // Rich analysis from the new AI call
        time_analysis: {
          total_time: totalTimeTaken,
          average_time_per_question: totalTimeTaken / (exam.questions.length || 1),
          rushed_questions: [], // These could be populated by AI in the future
          over_time_questions: [], // These could be populated by AI in the future
        },
      },
      feedback: ["Exam scoring and analysis complete."]
    };
  }

  /**
   * Generates a rich, AI-driven analysis of the entire exam performance.
   */
  private async getAIAnalysis(
    exam: GeneratedExam,
    scoredQuestions: any[]
  ): Promise<{
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    topic_analysis: { topic: string; performance: number; question_count: number }[];
  }> {
    const prompt = `
You are an expert educational diagnostician. Analyze the provided exam results to identify student's strengths, weaknesses, and actionable recommendations. Go beyond simple right/wrong counts and identify underlying patterns.

**CRITICAL INSTRUCTIONS:**
- Provide insightful, personalized feedback. Avoid generic statements.
- Base your analysis on all available data: topics, question text, correctness, and response times.
- The output MUST be a valid JSON object.

**JSON OUTPUT STRUCTURE:**
{
  "strengths": ["Identified Strength 1", "Identified Strength 2"],
  "weaknesses": ["Identified Weakness 1 (e.g., 'Struggles with questions requiring mathematical calculation')", "Identified Weakness 2 (e.g., 'Consistently misses questions related to Topic X')"],
  "recommendations": ["Actionable Recommendation 1", "Actionable Recommendation 2"],
  "topic_analysis": [
    {"topic": "Topic A", "performance": 0.8, "question_count": 5},
    {"topic": "Topic B", "performance": 0.4, "question_count": 5}
  ]
}

---
### EXAM DATA FOR ANALYSIS

**Exam Configuration:**
- Subject: ${exam.config.subject}
- Topics: ${exam.config.topics.join(', ')}

**Student Performance Data:**
${scoredQuestions.map(sq => {
  const question = exam.questions.find(q => q.id === sq.question_id);
  return `
- Question: "${question?.question}"
  - Topic: ${question?.topic || 'N/A'}
  - Correct: ${sq.is_correct}
  - Points: ${sq.score}/${question?.points}
  - Response Time: ${sq.response_time.toFixed(1)}s
`;
}).join('')}
---

Provide your expert analysis in the specified JSON format.
`;

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });
      // Use robust parsing just in case
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI analysis response did not contain a valid JSON object.");
      }
      return this.parseRobustJSON(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to get AI analysis:', error);
      // Fallback to a simple analysis if AI fails
      return {
        strengths: ["Completed all questions."],
        weaknesses: ["AI analysis service failed. Please review your answers manually."],
        recommendations: ["Retry the analysis later."],
        topic_analysis: []
      };
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
    const performanceGap = student_learning_profile.goal_performance - exam_result.percentage
    
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
      
      const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error("AI response did not contain a valid JSON object or array:", response);
        throw new Error("AI response did not contain a valid JSON object or array.");
      }
      
      const jsonString = jsonMatch[0];
      const parsed = JSON.parse(jsonString);

      let topics: string[] = [];

      if (Array.isArray(parsed)) {
        topics = parsed;
      } else if (parsed && typeof parsed === 'object') {
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
        ...options,
      })
    })

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("OpenAI API Error:", response.status, errorBody);
      throw new Error(`OpenAI API error: ${response.statusText} - ${errorBody}`);
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
      
      let parsed = this.parseRobustJSON(jsonMatch[0]);

      if (parsed.exam && parsed.exam.questions) {
        parsed = parsed.exam;
      }

      const questionsFromAI = parsed.questions;

      if (!Array.isArray(questionsFromAI) || questionsFromAI.length === 0) {
        throw new Error('AI response did not contain any valid questions.');
      }

      const sanitizedQuestions: ExamQuestion[] = questionsFromAI
        .map((q: any, index: number): ExamQuestion | null => {
          const openEndedTypes = ['essay', 'short_answer', 'fill_in_the_blank', 'fill_blank'];
          
          const correctAnswer = q.correct_answer || q.answer || q.correctAnswer;
          const questionType = q.type === 'fill_blank' ? 'fill_in_the_blank' : q.type;

          if (!q.question || !questionType || (!correctAnswer && !openEndedTypes.includes(questionType))) {
            console.warn(`Filtering out invalid question due to missing fields: ${JSON.stringify(q)}`);
            return null;
          }
          
          return {
            id: q.id || `q_${Date.now()}_${index}`,
            type: questionType,
            question: q.question,
            options: q.options || [],
            correct_answer: correctAnswer,
            points: q.points || 10,
            difficulty: q.difficulty || 5,
            topic: q.topic || config.subject || 'General',
            cognitive_level: q.cognitive_level || 'remember',
            hint: q.hint,
            explanation: q.explanation || q.rationale,
            estimated_time: q.estimated_time || 60,
            subject_area: q.subject_area || config.subject,
          };
        })
        .filter((q): q is ExamQuestion => q !== null);

      if (sanitizedQuestions.length === 0) {
        throw new Error('AI response did not contain any valid questions after sanitization.');
      }

      const finalExam: GeneratedExam = {
        id: `exam_${Date.now()}`,
        config: {
            ...config,
            title: parsed.title || config.title,
            subject: parsed.subject || config.subject,
            duration: parseInt(String(parsed.duration || config.duration), 10) || config.duration,
            total_points: parsed.total_points || config.total_points,
            topics: parsed.topics || config.topics,
        },
        questions: sanitizedQuestions,
        metadata: {
          generated_at: new Date(),
          total_questions: sanitizedQuestions.length,
          estimated_completion_time: sanitizedQuestions.reduce((sum, q) => sum + (q.estimated_time || 60), 0),
          difficulty_average: sanitizedQuestions.reduce((sum, q) => sum + q.difficulty, 0) / (sanitizedQuestions.length || 1),
          cognitive_level_distribution: {},
          ai_confidence: 0.85
        },
        instructions: "Please answer the following questions to the best of your ability.",
        answer_key: [],
      };

      return finalExam;

    } catch (error: any) {
      console.error('Failed to parse generated exam from AI:', error, 'Raw response:', response);
      throw new Error(`AI failed to return a valid exam structure. ${error.message}`);
    }
  }

  private parseRobustJSON(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('Initial JSON parse failed, attempting to fix common issues:', error);
      
      try {
        let cleaned = jsonString
          .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
          .replace(/,(\s*[}\]])/g, '$1');
        return JSON.parse(cleaned);
      } catch (secondError) {
        console.error('Robust JSON parsing failed:', secondError);
        throw new Error(`Unable to parse JSON after multiple attempts: ${secondError instanceof Error ? secondError.message : String(secondError)}`);
      }
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
      return this.getFallbackStudyRecommendations({} as any, {} as any);
    }
  }

  private getFallbackExam(cards: FSRSCard[], config: ExamConfiguration): GeneratedExam {
    console.warn("AI exam generation failed. Using fallback exam.");
    
    const fallbackQuestions: ExamQuestion[] = cards.slice(0, 10).map((card, index) => ({
      id: `fallback_q_${index + 1}`,
      type: 'short_answer',
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
      questions: fallbackQuestions,
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
    const totalScore = responses.reduce((sum, r) => sum + (r.confidence_level || 3) * 2, 0);
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
          is_correct: (r.confidence_level || 0) > 2,
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
        difficulty_analysis: {},
        cognitive_analysis: {},
        topic_analysis: [],
      },
      feedback: ['Overall performance is good, but some details need attention (fallback analysis).'],
    };
  }

  private getFallbackAdaptiveSelection(ability: number, questions: ExamQuestion[]): any {
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
      immediate_actions: ['Review incorrect questions', 'Identify weak areas', 'Create study plan'],
      short_term_plan: {
        duration: '1-2 weeks',
        daily_tasks: [`Study for ${profile.time_availability} minutes daily`],
        focus_areas: result.analysis.weaknesses.slice(0, 3),
        practice_suggestions: ['Do more practice exercises']
      },
      long_term_strategy: {
        duration: '1-2 months',
        milestones: ['Improve score by 10 points', 'Achieve overall score target'],
        skill_development: ['Improve analytical thinking skills'],
        assessment_schedule: ['Self-test once a week', 'Mock exam every two weeks']
      },
      personalized_tips: ['Maintain a regular study rhythm'],
      resource_recommendations: []
    }
  }
}

export const examAI = new ExamAI()
export default examAI