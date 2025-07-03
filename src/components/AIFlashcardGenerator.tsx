import { X } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { CreateFlashcardData, createFlashcards } from '../api/flashcards';
import { flashcardAI } from '../services/flashcardAI';
import styles from './AIFlashcardGenerator.module.css';
import AlertModal from './AlertModal';

interface AIFlashcardGeneratorProps {
  setId: string;
  onClose: () => void;
  onGenerated: (count: number) => void;
}

interface GenerationConfig {
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  count: number;
  cardType: 'basic' | 'cloze' | 'mixed';
  language: 'zh' | 'en';
  includeExplanations: boolean;
  includeHints: boolean;
  focusAreas: string[];
  customPrompt: string;
  style: 'formal' | 'conversational' | 'academic';
}

interface GeneratedCard {
  id: string;
  question: string;
  answer: string;
  hint?: string;
  explanation?: string;
  tags: string[];
  card_type: 'basic' | 'cloze';
  confidence: number; // AI generation confidence
  isSelected: boolean; // Whether it is selected for saving
}

interface GenerationProgress {
  total: number;
  completed: number;
  current: string;
}

const AIFlashcardGenerator: React.FC<AIFlashcardGeneratorProps> = ({
  setId,
  onClose,
  onGenerated
}) => {
  const [config, setConfig] = useState<GenerationConfig>({
    topic: '',
    difficulty: 'intermediate',
    count: 10,
    cardType: 'mixed',
    language: 'zh',
    includeExplanations: true,
    includeHints: true,
    focusAreas: [],
    customPrompt: '',
    style: 'conversational'
  });

  const [loading, setLoading] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [step, setStep] = useState<'config' | 'generating' | 'preview' | 'saving'>('config');
  const [progress, setProgress] = useState<GenerationProgress>({ total: 0, completed: 0, current: '' });
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Preset topic expansion
  const presetTopics = useMemo(() => [
    { 
      label: 'Programming Basics', 
      value: 'programming-basics', 
      tags: ['Programming', 'Computer Science', 'Software Development'],
      focusAreas: ['Variables and Data Types', 'Control Structures', 'Functions', 'Object-Oriented Programming', 'Algorithmic Thinking']
    },
    { 
      label: 'JavaScript', 
      value: 'javascript', 
      tags: ['JavaScript', 'Web Development', 'Frontend'],
      focusAreas: ['Basic Syntax', 'Asynchronous Programming', 'DOM Manipulation', 'ES6+ Features', 'Node.js']
    },
    { 
      label: 'React', 
      value: 'react', 
      tags: ['React', 'Frontend Framework', 'JavaScript'],
      focusAreas: ['Components', 'State Management', 'Hooks', 'Lifecycle', 'Performance Optimization']
    },
    { 
      label: 'Data Structures & Algorithms', 
      value: 'algorithms', 
      tags: ['Data Structures', 'Algorithms', 'Computer Science'],
      focusAreas: ['Arrays', 'Linked Lists', 'Stacks and Queues', 'Trees', 'Graph Algorithms', 'Sorting Algorithms']
    },
    { 
      label: 'Calculus', 
      value: 'calculus', 
      tags: ['Math', 'Calculus', 'Algebra'],
      focusAreas: ['Limits', 'Derivatives', 'Integrals', 'Differential Equations', 'Series']
    },
    { 
      label: 'University Physics', 
      value: 'physics', 
      tags: ['Physics', 'Science', 'Natural Laws'],
      focusAreas: ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics', 'Quantum Physics']
    },
    { 
      label: 'Organic Chemistry', 
      value: 'organic-chemistry', 
      tags: ['Chemistry', 'Organic Compounds', 'Chemical Reactions'],
      focusAreas: ['Alkanes', 'Aromatic Compounds', 'Alcohols, Phenols, Ethers', 'Carbonyl Compounds', 'Reaction Mechanisms']
    },
    { 
      label: 'World History', 
      value: 'world-history', 
      tags: ['History', 'Culture', 'Events'],
      focusAreas: ['Ancient Civilizations', 'Middle Ages', 'Renaissance', 'Industrial Revolution', 'Modern History']
    },
    { 
      label: 'English Vocabulary', 
      value: 'english-vocabulary', 
      tags: ['English', 'Vocabulary', 'Language Learning'],
      focusAreas: ['Basic Vocabulary', 'Academic Vocabulary', 'Business English', 'Idiomatic Expressions', 'Roots and Affixes']
    },
    { 
      label: 'Psychology', 
      value: 'psychology', 
      tags: ['Psychology', 'Cognitive Science', 'Behavioral Science'],
      focusAreas: ['Cognitive Psychology', 'Developmental Psychology', 'Social Psychology', 'Abnormal Psychology', 'Research Methods']
    }
  ], []);

  // Build prompt
  const buildPrompt = useCallback((config: GenerationConfig, cardType: 'basic' | 'cloze') => {
    const selectedTopic = presetTopics.find(t => t.value === config.topic);
    const topicName = selectedTopic?.label || config.topic.replace('custom-', '');
    
    const difficultyMap = {
      beginner: 'Beginner-level (suitable for someone new to the topic)',
      intermediate: 'Intermediate-level (suitable for a college undergraduate)', 
      advanced: 'Advanced-level (suitable for graduate-level studies, requiring analysis and synthesis)'
    };

    const styleMap = {
      formal: 'formal and academic',
      conversational: 'clear, conversational, and easy to understand',
      academic: 'rigorous, academic, and professional'
    };

    let prompt = `As an expert in instructional design, please generate a single, high-quality flashcard for a university student.

**Topic:** ${topicName}
**Difficulty:** ${difficultyMap[config.difficulty]}
**Style:** ${styleMap[config.style]}
**Card Type:** ${cardType === 'basic' ? 'Question/Answer' : 'Cloze Deletion (fill-in-the-blank)'}`;

    if (config.focusAreas.length > 0) {
      prompt += `\n**Key Focus Areas:** ${config.focusAreas.join(', ')}`;
    }

    if (cardType === 'basic') {
      prompt += `

**Instructions for Question/Answer Card:**
- The question must be specific, clear, and target a core concept. Avoid overly broad questions.
- The answer must be accurate, concise, and directly address the question.`;
    } else { // Cloze
      prompt += `

**Instructions for Cloze Deletion Card:**
- Create a sentence or a short paragraph that provides strong context.
- The blank, represented by "____", must replace a single, critical keyword or a very short, essential phrase.
- The term being blanked out should be a non-obvious, core concept that requires genuine understanding to fill in.`;
    }

    if (config.includeHints) {
      prompt += `\n- **Hint:** Provide a short, clever hint to guide the student towards the answer without giving it away.`;
    }

    if (config.includeExplanations) {
      prompt += `\n- **Explanation:** Provide a detailed explanation of the answer's underlying principles or background, enhancing the learning value.`;
    }

    if (config.customPrompt) {
      prompt += `\n\n**User's Custom Instructions:** ${config.customPrompt}`;
    }

    prompt += `

**Output Format:** Please return **only** a valid JSON object with the following structure:
{
  "question": "The generated question content.",
  "answer": "The generated answer content.",
  "card_type": "${cardType}",
  ${config.includeHints ? '"hint": "The generated hint content.",' : ''}
  ${config.includeExplanations ? '"explanation": "The generated explanation content.",' : ''}
  "tags": ["Relevant_Tag1", "Relevant_Tag2"],
  "confidence": 0.95
}`;

    return prompt;
  }, [presetTopics]);

  // Generate a single card using the real AI service
  const generateSingleCard = async (cardType: 'basic' | 'cloze', index: number): Promise<GeneratedCard> => {
    const prompt = buildPrompt(config, cardType);
    
    const aiCard = await flashcardAI.generateFlashcard(prompt);
    
    return {
      ...aiCard,
      id: `card-${Date.now()}-${index}`,
      isSelected: true,
    };
  };

  const generateCards = async () => {
    if (!config.topic) {
      setError('Please choose a learning topic');
      return;
    }

    setLoading(true);
    setStep('generating');
    setError(null);
    setProgress({ total: config.count, completed: 0, current: 'Preparing to generate...' });

    try {
      const cards: GeneratedCard[] = [];
      
      for (let i = 0; i < config.count; i++) {
        setProgress(prev => ({ 
          ...prev, 
          completed: i, 
          current: `Generating card ${i + 1}...` 
        }));

        // According to configuration, decide card type
        let cardType: 'basic' | 'cloze';
        if (config.cardType === 'mixed') {
          cardType = Math.random() > 0.4 ? 'basic' : 'cloze';
        } else {
          cardType = config.cardType === 'basic' ? 'basic' : 'cloze';
        }

        const card = await generateSingleCard(cardType, i);
        cards.push(card);
      }

      setGeneratedCards(cards);
      setStep('preview');
      setProgress(prev => ({ ...prev, completed: config.count, current: 'Generation completed!' }));
    } catch (error) {
      console.error('Generation failed:', error);
      setError('AI generation failed, please check network connection and try again');
      setStep('config');
    } finally {
      setLoading(false);
    }
  };

  const saveCards = async () => {
    const selectedCards = generatedCards.filter(card => card.isSelected);
    if (selectedCards.length === 0) {
      setError("Please select at least one card to save.");
      return;
    }

    setStep('saving');
    try {
      const cardsToCreate: CreateFlashcardData[] = selectedCards.map(card => ({
        set_id: setId,
        question: card.question,
        answer: card.answer,
        hint: card.hint,
        explanation: card.explanation,
        card_type: card.card_type,
        tags: card.tags
      }));

      await createFlashcards(cardsToCreate);
      onGenerated(selectedCards.length);
      
      setSuccessMessage(`🎉 Successfully generated and saved ${selectedCards.length} flashcards!`);
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Saving failed:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred while saving.');
      setStep('preview');
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    onClose(); // Close the entire generator
  };

  const toggleCardSelection = (cardId: string) => {
    setGeneratedCards(prev => 
      prev.map(card => 
        card.id === cardId 
          ? { ...card, isSelected: !card.isSelected }
          : card
      )
    );
  };

  const toggleSelectAll = () => {
    const allSelected = generatedCards.every(card => card.isSelected);
    setGeneratedCards(prev => 
      prev.map(card => ({ ...card, isSelected: !allSelected }))
    );
  };

  const updateCard = (cardId: string, updates: Partial<GeneratedCard>) => {
    setGeneratedCards(prev => 
      prev.map(card => 
        card.id === cardId 
          ? { ...card, ...updates }
          : card
      )
    );
  };

  const regenerateCard = async (cardId: string) => {
    const cardIndex = generatedCards.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return;

    const originalCard = generatedCards[cardIndex];
    
    // Set a temporary "regenerating" state on the card
    updateCard(cardId, { question: 'Regenerating...', answer: '' });

    try {
      const newCard = await generateSingleCard(originalCard.card_type, cardIndex);
      setGeneratedCards(prev =>
        prev.map(c => c.id === cardId ? { ...newCard, id: cardId } : c)
      );
    } catch (error) {
      console.error('Error regenerating card:', error);
      // Restore original card on failure
      setGeneratedCards(prev =>
        prev.map(c => c.id === cardId ? originalCard : c)
      );
    }
  };

  const getCurrentFocusAreas = () => {
    return presetTopics.find(p => p.value === config.topic)?.focusAreas || [];
  };

  const renderConfigStep = () => (
    <div className={styles.configContainer}>
      <h2 className={styles.stepTitle}>AI Flashcard Generator</h2>
      
      {error && (
        <div className={styles.errorMessage}>
          ⚠️ {error}
        </div>
      )}
      
      <div className={styles.formGroup}>
        <label className={styles.label}>1. Choose a Topic</label>
        <div className={styles.topicGrid}>
          {presetTopics.map(p => (
            <button
              key={p.value}
              className={`${styles.topicButton} ${config.topic === p.value ? styles.selected : ''}`}
              onClick={() => setConfig(prev => ({ ...prev, topic: p.value }))}
            >
              {p.label}
            </button>
          ))}
        </div>
        <input 
          type="text" 
          className={styles.customTopicInput}
          placeholder="Or enter a custom topic..."
          onChange={(e) => setConfig(prev => ({ ...prev, topic: `custom-${e.target.value}` }))}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>2. Set Difficulty</label>
        <div className={styles.buttonGroup}>
          <button 
            className={`${styles.difficultyButton} ${config.difficulty === 'beginner' ? styles.selected : ''}`}
            onClick={() => setConfig(prev => ({ ...prev, difficulty: 'beginner' }))}
            style={{ '--accent-color': '#00ff7f' } as React.CSSProperties}
          >
            Beginner
          </button>
          <button 
            className={`${styles.difficultyButton} ${config.difficulty === 'intermediate' ? styles.selected : ''}`}
            onClick={() => setConfig(prev => ({ ...prev, difficulty: 'intermediate' }))}
            style={{ '--accent-color': '#ff9f0a' } as React.CSSProperties}
          >
            Intermediate
          </button>
          <button 
            className={`${styles.difficultyButton} ${config.difficulty === 'advanced' ? styles.selected : ''}`}
            onClick={() => setConfig(prev => ({ ...prev, difficulty: 'advanced' }))}
            style={{ '--accent-color': '#ff453a' } as React.CSSProperties}
          >
            Advanced
          </button>
        </div>
      </div>

      <div className={`${styles.formGroup} ${styles.formRow}`}>
        <div>
          <label className={styles.label}>3. Number of Cards</label>
          <input 
            type="number"
            className={styles.numberInput}
            value={config.count}
            onChange={(e) => setConfig(prev => ({ ...prev, count: Math.max(1, parseInt(e.target.value) || 1) }))}
            min="1"
            max="50"
          />
        </div>
        <div>
          <label className={styles.label}>4. Card Type</label>
          <select 
            className={styles.select}
            value={config.cardType}
            onChange={(e) => setConfig(prev => ({ ...prev, cardType: e.target.value as any }))}
          >
            <option value="mixed">Mixed</option>
            <option value="basic">Question/Answer</option>
            <option value="cloze">Cloze (Fill-in-the-blank)</option>
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>5. Focus Areas (Optional)</label>
        <div className={styles.focusAreasGrid}>
          {getCurrentFocusAreas().map(area => (
            <button
              key={area}
              className={`${styles.focusAreaButton} ${config.focusAreas.includes(area) ? styles.selected : ''}`}
              onClick={() => {
                const newFocus = config.focusAreas.includes(area)
                  ? config.focusAreas.filter(f => f !== area)
                  : [...config.focusAreas, area];
                setConfig(prev => ({ ...prev, focusAreas: newFocus }));
              }}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>6. Output Style</label>
        <div className={styles.buttonGroup}>
          <button 
            className={`${styles.styleButton} ${config.style === 'conversational' ? styles.selected : ''}`}
            onClick={() => setConfig(prev => ({ ...prev, style: 'conversational' }))}
          >
            <span>💬</span>
            <span>Conversational</span>
          </button>
          <button 
            className={`${styles.styleButton} ${config.style === 'academic' ? styles.selected : ''}`}
            onClick={() => setConfig(prev => ({ ...prev, style: 'academic' }))}
          >
            <span>🎓</span>
            <span>Academic</span>
          </button>
          <button 
            className={`${styles.styleButton} ${config.style === 'formal' ? styles.selected : ''}`}
            onClick={() => setConfig(prev => ({ ...prev, style: 'formal' }))}
          >
            <span>👔</span>
            <span>Formal</span>
          </button>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>7. Advanced Options</label>
        <div className={styles.checkboxGroup}>
          <label className={styles.checkbox}>
            <input 
              type="checkbox"
              checked={config.includeHints}
              onChange={(e) => setConfig(prev => ({ ...prev, includeHints: e.target.checked }))}
            />
            Include Hints
          </label>
          <label className={styles.checkbox}>
            <input 
              type="checkbox"
              checked={config.includeExplanations}
              onChange={(e) => setConfig(prev => ({ ...prev, includeExplanations: e.target.checked }))}
            />
            Include Explanations
          </label>
          <div>
            <label className={styles.label} style={{ marginTop: '1rem' }}>Custom Instructions (Optional)</label>
            <textarea
              className={styles.textarea}
              placeholder="e.g., 'Focus on real-world examples', 'Use simple language', 'Make questions challenging'"
              value={config.customPrompt}
              onChange={(e) => setConfig(prev => ({ ...prev, customPrompt: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.cancelButton} onClick={onClose}>Cancel</button>
        <button 
          className={styles.generateButton}
          onClick={generateCards}
          disabled={loading || !config.topic}
        >
          {loading ? 'Generating...' : `Generate ${config.count} Cards`}
        </button>
      </div>
    </div>
  );

  const renderGeneratingStep = () => (
    <div className={styles.generatingContainer}>
      <div className={styles.loadingAnimation}>
        <span className={styles.aiIcon}>✨</span>
      </div>
      <h2 className={styles.loadingText}>AI is crafting your flashcards...</h2>
      <div className={styles.progressStats}>
        <span>{progress.completed} / {progress.total}</span>
      </div>
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill}
          style={{ width: `${(progress.completed / progress.total) * 100}%` }}
        ></div>
      </div>
      <p className={styles.progressCurrent}>{progress.current}</p>

      <div className={styles.generatingTips}>
        <h3>💡 Pro Tip:</h3>
        <ul>
          <li>The more specific your topic and focus areas, the better the results.</li>
          <li>For complex subjects, start with a smaller batch of cards to check quality.</li>
          <li>You can edit, delete, or regenerate any card in the next step.</li>
        </ul>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    const selectedCount = generatedCards.filter(c => c.isSelected).length;
    return (
      <div className={styles.previewContainer}>
        <div className={styles.previewHeader}>
          <h2 className={styles.stepTitle}>Review & Refine Generated Cards</h2>
          <div className={styles.previewActions}>
            <div className={styles.previewStats}>
              <span>Total: {generatedCards.length}</span>
              <span className={styles.selectedCount}>Selected: {selectedCount}</span>
            </div>
            <button className={styles.selectAllButton} onClick={toggleSelectAll}>
              {selectedCount === generatedCards.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        {error && <p className={styles.errorMessage}>{error}</p>}
        
        <div className={styles.cardsPreview}>
          {generatedCards.map((card, index) => (
            <div 
              key={card.id} 
              className={`${styles.cardPreview} ${card.isSelected ? styles.selected : ''}`}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardIndex}>{index + 1}</div>
                <div className={styles.cardMeta}>
                  <div className={`${styles.cardType} ${styles[card.card_type]}`}>
                    {card.card_type === 'basic' ? 'Q&A' : 'Cloze'}
                  </div>
                  <div className={styles.cardConfidence} title={`AI Confidence: ${(card.confidence * 100).toFixed(0)}%`}>
                    <div className={styles.qualityIndicator} style={{ width: `${card.confidence * 100}%` }}></div>
                  </div>
                </div>
                <div className={styles.cardControls}>
                  <button 
                    className={`${styles.selectButton} ${card.isSelected ? styles.selected : ''}`}
                    onClick={() => toggleCardSelection(card.id)}
                    title={card.isSelected ? 'Deselect this card' : 'Select this card'}
                  >
                    {card.isSelected ? '✓' : '○'}
                  </button>
                  <button 
                    className={styles.regenerateButton} 
                    onClick={() => regenerateCard(card.id)}
                    title="Regenerate this card"
                  >
                    🔄
                  </button>
                </div>
              </div>
              
              <div className={styles.cardContent}>
                <div className={styles.editableField}>
                  <label>Question</label>
                  <textarea
                    value={card.question}
                    onChange={(e) => updateCard(card.id, { question: e.target.value })}
                    className={styles.editableTextarea}
                    rows={3}
                  />
                </div>
                <div className={styles.editableField}>
                  <label>Answer</label>
                  <textarea
                    value={card.answer}
                    onChange={(e) => updateCard(card.id, { answer: e.target.value })}
                    className={styles.editableTextarea}
                    rows={3}
                  />
                </div>
                {card.hint && (
                  <div className={styles.editableField}>
                    <label>Hint</label>
                    <input
                      type="text"
                      value={card.hint}
                      onChange={(e) => updateCard(card.id, { hint: e.target.value })}
                      className={styles.editableInput}
                    />
                  </div>
                )}
                {card.explanation && (
                  <div className={styles.editableField}>
                    <label>Explanation</label>
                    <textarea
                      value={card.explanation}
                      onChange={(e) => updateCard(card.id, { explanation: e.target.value })}
                      className={styles.editableTextarea}
                      rows={4}
                    />
                  </div>
                )}
                <div className={styles.tagsSection}>
                  <label>Tags</label>
                  <div className={styles.tags}>
                    {card.tags.map((tag, i) => (
                      <span key={i} className={styles.tag}>
                        {tag}
                        <button 
                          className={styles.removeTag}
                          onClick={() => {
                            const newTags = card.tags.filter((_, tagIndex) => i !== tagIndex);
                            updateCard(card.id, { tags: newTags });
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input 
                      type="text"
                      className={styles.addTagInput}
                      placeholder="Add tag..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value) {
                          const newTags = [...card.tags, e.currentTarget.value];
                          updateCard(card.id, { tags: newTags });
                          e.currentTarget.value = '';
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className={styles.actions}>
          <button className={styles.backButton} onClick={() => setStep('config')}>Back to Config</button>
          <button 
            className={styles.saveButton}
            onClick={saveCards}
            disabled={selectedCount === 0}
          >
            Save {selectedCount} Selected Cards
          </button>
        </div>
      </div>
    );
  };

  const renderSavingStep = () => (
    <div className={styles.savingContainer}>
      <div className={styles.loadingAnimation}>
        <span className={styles.saveIcon}>💾</span>
      </div>
      <h2 className={styles.loadingText}>Saving your new flashcards...</h2>
      <div className={styles.savingProgress}>
        <div className={styles.progressDots}>
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>AI-Powered Flashcard Generator</h2>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            disabled={step === 'generating' || step === 'saving'}
          >
            <X size={24} />
          </button>
        </div>
        <div className={styles.content}>
          {step === 'config' && renderConfigStep()}
          {step === 'generating' && renderGeneratingStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'saving' && renderSavingStep()}
        </div>
      </div>
      <AlertModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        title="Generation Complete"
        message={successMessage}
        buttonText="Done"
      />
    </div>
  );
};

export default AIFlashcardGenerator; 