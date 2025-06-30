import { LucideBookOpen, LucideCheck, LucideCopy, LucideLightbulb, LucideWand2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { getCategoriesForVersion, getPromptsForMode } from '../config/smartPromptConfigs';
import { useVersionMode } from '../hooks/useVersionMode';
import { CollegeModeId, HighSchoolModeId, SmartPrompt } from '../types';
import styles from './SmartPrompts.module.css';

interface SmartPromptsProps {
  currentMode: HighSchoolModeId | CollegeModeId;
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

const SmartPrompts: React.FC<SmartPromptsProps> = ({
  currentMode,
  onSelectPrompt,
  disabled = false
}) => {
  const { currentVersion } = useVersionMode();
  const [selectedCategory, setSelectedCategory] = useState<string>('recommended');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [promptVariables, setPromptVariables] = useState<Record<string, string>>({});

  // Get prompts based on current mode and academic version
  const recommendedPrompts = useMemo(() => {
    return getPromptsForMode(currentMode, currentVersion);
  }, [currentMode, currentVersion]);

  // Get all available categories for current academic version
  const availableCategories = useMemo(() => {
    return getCategoriesForVersion(currentVersion);
  }, [currentVersion]);

  // Filter prompts by selected category
  const filteredPrompts = useMemo(() => {
    if (selectedCategory === 'recommended') {
      return recommendedPrompts;
    }
    
    if (selectedCategory === 'all') {
      const allPrompts: SmartPrompt[] = [];
      availableCategories.forEach(category => {
        const categoryPrompts = category.prompts.filter(prompt => 
          prompt.academic_version === currentVersion
        );
        allPrompts.push(...categoryPrompts);
      });
      return allPrompts;
    }
    
    const category = availableCategories.find(cat => cat.id === selectedCategory);
    return category ? category.prompts.filter(prompt => 
      prompt.academic_version === currentVersion
    ) : [];
  }, [selectedCategory, recommendedPrompts, availableCategories, currentVersion]);

  const handlePromptClick = (prompt: SmartPrompt) => {
    if (disabled) return;
    
    let finalPrompt = prompt.prompt_template;
    
    // Replace variables in prompt template
    if (prompt.variables && prompt.variables.length > 0) {
      prompt.variables.forEach(variable => {
        const value = promptVariables[`${prompt.id}_${variable}`] || `{${variable}}`;
        finalPrompt = finalPrompt.replace(`{${variable}}`, value);
      });
    }
    
    onSelectPrompt(finalPrompt);
  };

  const handleCopyPrompt = async (prompt: SmartPrompt) => {
    try {
      let finalPrompt = prompt.prompt_template;
      
      // Replace variables in prompt template
      if (prompt.variables && prompt.variables.length > 0) {
        prompt.variables.forEach(variable => {
          const value = promptVariables[`${prompt.id}_${variable}`] || `{${variable}}`;
          finalPrompt = finalPrompt.replace(`{${variable}}`, value);
        });
      }
      
      await navigator.clipboard.writeText(finalPrompt);
      setCopiedId(prompt.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy prompt:', error);
    }
  };

  const handleVariableChange = (promptId: string, variable: string, value: string) => {
    setPromptVariables(prev => ({
      ...prev,
      [`${promptId}_${variable}`]: value
    }));
  };

  // Create category tabs
  const categoryTabs = [
    { id: 'recommended', name: 'Recommended', icon: '⭐', count: recommendedPrompts.length },
    { id: 'all', name: 'All Prompts', icon: '📚', count: 0 },
          ...availableCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        count: cat.prompts.filter(p => p.academic_version === currentVersion).length
      }))
  ];

  return (
    <div className={styles.smartPrompts}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <LucideWand2 size={20} />
        </div>
        <div className={styles.headerContent}>
          <h3>Smart Prompts</h3>
          <p>Prompts tailored for {currentVersion === 'high_school' ? 'High School' : 'College'} {currentMode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
        </div>
      </div>

      {/* Category Navigation */}
      <div className={styles.categoryNav}>
        {categoryTabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.categoryBtn} ${selectedCategory === tab.id ? styles.active : ''}`}
            onClick={() => setSelectedCategory(tab.id)}
          >
            <span className={styles.categoryIcon}>{tab.icon}</span>
            <span className={styles.categoryName}>{tab.name}</span>
            {tab.count > 0 && (
              <span className={styles.categoryCount}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Prompts List */}
      <div className={styles.promptsList}>
        {filteredPrompts.length === 0 ? (
          <div className={styles.emptyState}>
            <LucideBookOpen size={32} className={styles.emptyIcon} />
            <p>No prompts available for this mode</p>
            <span>Try selecting a different category or AI mode</span>
          </div>
        ) : (
          filteredPrompts.map(prompt => (
            <div key={prompt.id} className={styles.promptCard}>
              <div className={styles.promptHeader}>
                <div className={styles.promptTitle}>
                  <h4>{prompt.title}</h4>
                  <div className={styles.promptMeta}>
                    <span className={styles.academicLevel}>
                      {prompt.academic_version === 'high_school' ? '🎓 HS' : '🎯 College'}
                    </span>
                    <span className={styles.targetModes}>
                      {prompt.target_modes.map(mode => mode.replace(/_/g, ' ')).join(', ')}
                    </span>
                  </div>
                </div>
                <div className={styles.promptActions}>
                  <button
                    className={styles.copyBtn}
                    onClick={() => handleCopyPrompt(prompt)}
                    title="Copy prompt"
                  >
                    {copiedId === prompt.id ? (
                      <LucideCheck size={16} className={styles.copiedIcon} />
                    ) : (
                      <LucideCopy size={16} />
                    )}
                  </button>
                </div>
              </div>

              <p className={styles.promptDescription}>{prompt.description}</p>

              {/* Variable Inputs */}
              {prompt.variables && prompt.variables.length > 0 && (
                <div className={styles.variableInputs}>
                  <div className={styles.variablesHeader}>
                    <LucideLightbulb size={14} />
                    <span>Customize this prompt:</span>
                  </div>
                  {prompt.variables.map(variable => (
                    <div key={variable} className={styles.variableInput}>
                      <label>{variable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</label>
                      <input
                        type="text"
                        placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                        value={promptVariables[`${prompt.id}_${variable}`] || ''}
                        onChange={(e) => handleVariableChange(prompt.id, variable, e.target.value)}
                        className={styles.variableField}
                      />
                    </div>
                  ))}
                  {prompt.examples && prompt.examples.length > 0 && (
                    <div className={styles.examples}>
                      <span className={styles.examplesLabel}>Examples:</span>
                      <div className={styles.exampleTags}>
                        {prompt.examples.map((example, index) => (
                          <span key={index} className={styles.exampleTag}>
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Prompt Template Preview */}
              <div className={styles.promptTemplate}>
                <div className={styles.templateHeader}>Preview:</div>
                <div className={styles.templateContent}>
                  {prompt.variables && prompt.variables.length > 0 ? (
                    (() => {
                      let previewText = prompt.prompt_template;
                      prompt.variables.forEach(variable => {
                        const value = promptVariables[`${prompt.id}_${variable}`];
                        if (value) {
                          previewText = previewText.replace(`{${variable}}`, value);
                        }
                      });
                      return previewText;
                    })()
                  ) : (
                    prompt.prompt_template
                  )}
                </div>
              </div>

              <button
                className={`${styles.usePromptBtn} ${disabled ? styles.disabled : ''}`}
                onClick={() => handlePromptClick(prompt)}
                disabled={disabled}
              >
                <LucideWand2 size={16} />
                Use This Prompt
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SmartPrompts; 