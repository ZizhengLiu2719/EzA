import { AcademicVersion, CollegeModeId, HighSchoolModeId, SmartPrompt, SmartPromptCategory } from '../types';

export const SMART_PROMPT_CATEGORIES: SmartPromptCategory[] = [
  // 学习支持类 - 适用于Study Buddy, Academic Coach等
  {
    id: 'learning_support',
    name: 'Learning Support',
    icon: '🎯',
    academic_versions: ['high_school', 'college'],
    compatible_modes: ['study_buddy', 'academic_coach', 'homework_helper'],
    prompts: [
      {
        id: 'explain_concept',
        title: 'Explain This Concept',
        description: 'Get clear explanations tailored to your level',
        academic_version: 'high_school',
        target_modes: ['study_buddy', 'homework_helper'],
        prompt_template: 'Please explain {concept} in simple terms suitable for a high school student. Use examples and analogies to make it easy to understand.',
        variables: ['concept'],
        examples: ['photosynthesis', 'quadratic equations', 'World War I causes']
      },
      {
        id: 'explain_concept_college',
        title: 'Deep Concept Analysis',
        description: 'Get comprehensive explanations with academic depth',
        academic_version: 'college',
        target_modes: ['academic_coach'],
        prompt_template: 'Please provide an in-depth analysis of {concept}, including theoretical foundations, current research, and practical applications in {field}.',
        variables: ['concept', 'field'],
        examples: ['quantum mechanics', 'behavioral economics', 'postmodern literature']
      },
      {
        id: 'study_strategy',
        title: 'Study Strategy',
        description: 'Get personalized study plans and techniques',
        academic_version: 'high_school',
        target_modes: ['study_buddy', 'academic_planner'],
        prompt_template: 'Help me create a study plan for {subject} with {timeframe} available. Consider my learning style and suggest effective techniques.',
        variables: ['subject', 'timeframe'],
        examples: ['Biology exam in 2 weeks', 'SAT prep over 3 months']
      }
    ]
  },

  // 写作支持类 - 适用于Writing Mentor等
  {
    id: 'writing_support',
    name: 'Writing Support',
    icon: '✍️',
    academic_versions: ['high_school', 'college'],
    compatible_modes: ['writing_mentor', 'humanities_scholar', 'creative_guide'],
    prompts: [
      {
        id: 'essay_outline_hs',
        title: 'Essay Outline Generator',
        description: 'Create structured outlines for essays',
        academic_version: 'high_school',
        target_modes: ['writing_mentor'],
        prompt_template: 'Help me create a detailed outline for a {essay_type} essay about {topic}. Include thesis statement, main points, and supporting evidence suggestions.',
        variables: ['essay_type', 'topic'],
        examples: ['persuasive essay about climate change', 'analytical essay about Romeo and Juliet']
      },
      {
        id: 'thesis_development',
        title: 'Thesis Development',
        description: 'Develop strong thesis statements and arguments',
        academic_version: 'college',
        target_modes: ['writing_mentor', 'humanities_scholar', 'thesis_developer'],
        prompt_template: 'Help me develop a strong thesis statement for my {academic_level} paper on {topic}. Suggest argumentation strategies and potential counterarguments.',
        variables: ['academic_level', 'topic'],
        examples: ['undergraduate paper on social media impact', 'graduate research on AI ethics']
      },
      {
        id: 'writing_revision',
        title: 'Writing Revision',
        description: 'Get feedback on writing structure and style',
        academic_version: 'college',
        target_modes: ['writing_mentor', 'humanities_scholar'],
        prompt_template: 'Please review this writing excerpt and provide feedback on clarity, argument strength, and academic style. Suggest specific improvements.',
        variables: [],
        examples: []
      }
    ]
  },

  // STEM支持类 - 适用于Math Tutor, Science Guide, STEM Specialist等
  {
    id: 'stem_support',
    name: 'STEM Support',
    icon: '🧮',
    academic_versions: ['high_school', 'college'],
    compatible_modes: ['math_tutor', 'science_guide', 'stem_specialist', 'lab_mentor'],
    prompts: [
      {
        id: 'problem_breakdown',
        title: 'Problem Breakdown',
        description: 'Break down complex problems step by step',
        academic_version: 'high_school',
        target_modes: ['math_tutor', 'science_guide'],
        prompt_template: 'Help me break down this {subject} problem: "{problem}". Guide me through the solution process without giving away the answer immediately.',
        variables: ['subject', 'problem'],
        examples: ['calculus integration problem', 'chemistry balancing equation']
      },
      {
        id: 'concept_visualization',
        title: 'Concept Visualization',
        description: 'Understand concepts through visual explanations',
        academic_version: 'high_school',
        target_modes: ['math_tutor', 'science_guide'],
        prompt_template: 'Explain {concept} using visual descriptions, analogies, and real-world examples that a high school student can easily visualize.',
        variables: ['concept'],
        examples: ['electromagnetic fields', 'trigonometric functions', 'cellular respiration']
      },
      {
        id: 'research_methodology',
        title: 'Research Methodology',
        description: 'Learn scientific research methods and analysis',
        academic_version: 'college',
        target_modes: ['stem_specialist', 'lab_mentor'],
        prompt_template: 'Explain the research methodology for studying {research_topic}. Include experimental design, data collection methods, and analysis techniques.',
        variables: ['research_topic'],
        examples: ['protein folding mechanisms', 'climate change modeling', 'machine learning algorithms']
      }
    ]
  },

  // 考试准备类 - 适用于Test Prep Coach, Exam Strategist等
  {
    id: 'exam_prep',
    name: 'Exam Preparation',
    icon: '📋',
    academic_versions: ['high_school', 'college'],
    compatible_modes: ['test_prep_coach', 'exam_strategist'],
    prompts: [
      {
        id: 'practice_questions',
        title: 'Generate Practice Questions',
        description: 'Create practice questions for any topic',
        academic_version: 'high_school',
        target_modes: ['test_prep_coach'],
        prompt_template: 'Create {quantity} practice questions for {subject} at {difficulty} level. Include multiple choice, short answer, and essay questions with answer explanations.',
        variables: ['quantity', 'subject', 'difficulty'],
        examples: ['10 questions for AP Biology', '5 questions for SAT Math']
      },
      {
        id: 'exam_strategy',
        title: 'Exam Strategy',
        description: 'Develop test-taking strategies and time management',
        academic_version: 'college',
        target_modes: ['exam_strategist'],
        prompt_template: 'Help me develop a strategy for {exam_type}. Include time management, question prioritization, and stress management techniques.',
        variables: ['exam_type'],
        examples: ['MCAT', 'GRE', 'comprehensive final exams']
      },
      {
        id: 'weak_points_analysis',
        title: 'Weak Points Analysis',
        description: 'Identify and address knowledge gaps',
        academic_version: 'high_school',
        target_modes: ['test_prep_coach', 'study_buddy'],
        prompt_template: 'Based on my performance in {subject}, help me identify weak areas and create a targeted review plan for {timeframe}.',
        variables: ['subject', 'timeframe'],
        examples: ['chemistry before finals', 'math SAT prep']
      }
    ]
  },

  // 研究支持类 - 适用于Research Assistant, Research Mentor等
  {
    id: 'research_support',
    name: 'Research Support',
    icon: '🔬',
    academic_versions: ['high_school', 'college'],
    compatible_modes: ['research_assistant', 'research_mentor', 'social_science_analyst'],
    prompts: [
      {
        id: 'research_question',
        title: 'Research Question Development',
        description: 'Formulate strong research questions',
        academic_version: 'high_school',
        target_modes: ['research_assistant'],
        prompt_template: 'Help me develop a focused research question about {topic} for my {project_type}. Suggest ways to narrow the scope and make it investigable.',
        variables: ['topic', 'project_type'],
        examples: ['social media impact for science fair project', 'local history for history research paper']
      },
      {
        id: 'literature_review',
        title: 'Literature Review Guidance',
        description: 'Learn how to conduct effective literature reviews',
        academic_version: 'college',
        target_modes: ['research_mentor'],
        prompt_template: 'Guide me through conducting a literature review on {research_area}. Suggest key databases, search strategies, and organization methods.',
        variables: ['research_area'],
        examples: ['artificial intelligence ethics', 'renewable energy policy', 'cognitive psychology']
      },
      {
        id: 'source_evaluation',
        title: 'Source Evaluation',
        description: 'Learn to critically evaluate sources',
        academic_version: 'college',
        target_modes: ['research_mentor', 'social_science_analyst'],
        prompt_template: 'Help me evaluate the credibility and relevance of sources for my research on {topic}. Provide criteria for academic source assessment.',
        variables: ['topic'],
        examples: ['climate change policy', 'psychological interventions', 'economic theories']
      }
    ]
  },

  // 创意支持类 - 适用于Creative Guide等
  {
    id: 'creative_support',
    name: 'Creative Support',
    icon: '🎨',
    academic_versions: ['high_school', 'college'],
    compatible_modes: ['creative_guide', 'humanities_scholar'],
    prompts: [
      {
        id: 'creative_brainstorm',
        title: 'Creative Brainstorming',
        description: 'Generate creative ideas and concepts',
        academic_version: 'high_school',
        target_modes: ['creative_guide'],
        prompt_template: 'Help me brainstorm creative ideas for {project_type} with the theme of {theme}. Suggest unique approaches and innovative concepts.',
        variables: ['project_type', 'theme'],
        examples: ['art project about identity', 'creative writing about future society']
      },
      {
        id: 'creative_feedback',
        title: 'Creative Feedback',
        description: 'Get constructive feedback on creative work',
        academic_version: 'college',
        target_modes: ['creative_guide', 'humanities_scholar'],
        prompt_template: 'Provide constructive feedback on this creative work, focusing on {aspect}. Suggest improvements while maintaining the original vision.',
        variables: ['aspect'],
        examples: ['narrative structure', 'visual composition', 'thematic development']
      }
    ]
  }
];

// Helper function to get prompts for specific mode and academic version
export const getPromptsForMode = (
  modeId: HighSchoolModeId | CollegeModeId, 
  academicVersion: AcademicVersion
): SmartPrompt[] => {
  const relevantCategories = SMART_PROMPT_CATEGORIES.filter(category => 
    category.compatible_modes.includes(modeId) && 
    category.academic_versions.includes(academicVersion)
  );
  
  const prompts: SmartPrompt[] = [];
  relevantCategories.forEach(category => {
    const filteredPrompts = category.prompts.filter(prompt => 
      prompt.academic_version === academicVersion && 
      prompt.target_modes.includes(modeId)
    );
    prompts.push(...filteredPrompts);
  });
  
  return prompts;
};

// Helper function to get all categories for specific academic version
export const getCategoriesForVersion = (academicVersion: AcademicVersion): SmartPromptCategory[] => {
  return SMART_PROMPT_CATEGORIES.filter(category =>
    category.academic_versions.includes(academicVersion)
  );
}; 