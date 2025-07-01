import { LucideBrain, LucideGraduationCap, LucideSettings, LucideSparkles, LucideTarget } from 'lucide-react';
import React, { useState } from 'react';
import { useVersionMode } from '../hooks/useVersionMode';
import { CollegeModeId, EnhancedAIConfig, HighSchoolModeId } from '../types';
import styles from './SmartAIConfig.module.css';

interface SmartAIConfigProps {
  currentMode: HighSchoolModeId | CollegeModeId;
  onConfigChange: (config: Partial<EnhancedAIConfig>) => void;
  currentConfig: EnhancedAIConfig;
}

const SmartAIConfig: React.FC<SmartAIConfigProps> = ({
  currentMode,
  onConfigChange,
  currentConfig
}) => {
  const { currentVersion: academicVersion } = useVersionMode();
  const [activeTab, setActiveTab] = useState<'smart' | 'advanced'>('smart');

  // 根据当前AI模式和学术等级推荐配置
  const getRecommendedConfig = (): Partial<EnhancedAIConfig> => {
    const isHighSchool = academicVersion === 'high_school';
    
    // 基于AI模式的推荐配置
    const modeBasedConfig: Record<string, Partial<EnhancedAIConfig>> = {
      // High School Modes
      'study_buddy': {
        mode_specific_config: {
          response_length: 'detailed',
          interaction_style: 'conversational',
          feedback_frequency: 'extensive'
        }
      },
      'math_tutor': {
        mode_specific_config: {
          response_length: 'detailed',
          interaction_style: 'tutorial',
          feedback_frequency: 'extensive'
        }
      },
      'writing_mentor': {
        writing_style: 'academic',
        mode_specific_config: {
          response_length: 'comprehensive',
          interaction_style: 'professional',
          feedback_frequency: 'moderate'
        }
      },
      
      // College Modes
      'academic_coach': {
        mode_specific_config: {
          response_length: 'comprehensive',
          interaction_style: 'professional',
          feedback_frequency: 'moderate'
        }
      },
      'research_mentor': {
        writing_style: 'academic',
        citation_format: 'apa',
        mode_specific_config: {
          response_length: 'comprehensive',
          interaction_style: 'professional',
          feedback_frequency: 'minimal'
        }
      },
      'stem_specialist': {
        mode_specific_config: {
          response_length: 'detailed',
          interaction_style: 'tutorial',
          feedback_frequency: 'moderate'
        }
      }
    };

    return {
      auto_adjust_difficulty: true,
      adaptive_language: true,
      academic_level_config: {
        high_school: {
          max_complexity: isHighSchool ? 'intermediate' : 'basic',
          preferred_explanation_style: 'step_by_step',
          vocabulary_level: 'grade_appropriate'
        },
        college: {
          max_complexity: !isHighSchool ? 'advanced' : 'intermediate',
          preferred_explanation_style: 'analytical',
          vocabulary_level: 'academic'
        }
      },
      ...modeBasedConfig[currentMode] || {}
    };
  };

  const handleApplyRecommended = () => {
    const recommended = getRecommendedConfig();
    onConfigChange(recommended);
  };

  const tabs = [
    { id: 'smart', name: 'Smart Config', icon: <LucideSparkles size={16} /> },
    { id: 'advanced', name: 'Advanced', icon: <LucideSettings size={16} /> }
  ];

  return (
    <div className={styles.smartConfig}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <LucideBrain size={20} />
        </div>
        <div className={styles.headerContent}>
          <h3>AI Configuration</h3>
          <p>Optimize AI behavior for your current study mode</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNav}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tabBtn} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      {/* Smart Config Tab */}
      {activeTab === 'smart' && (
        <div className={styles.tabContent}>
          {/* Current Context Display */}
          <div className={styles.contextDisplay}>
            <div className={styles.contextItem}>
              <LucideGraduationCap size={16} />
              <span>Academic Level: {academicVersion === 'high_school' ? 'High School' : 'College'}</span>
            </div>
            <div className={styles.contextItem}>
              <LucideTarget size={16} />
              <span>AI Mode: {currentMode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
            </div>
          </div>

          {/* Quick Toggles */}
          <div className={styles.quickToggles}>
            <div className={styles.toggleGroup}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={currentConfig.auto_adjust_difficulty}
                  onChange={(e) => onConfigChange({ auto_adjust_difficulty: e.target.checked })}
                />
                <span className={styles.toggleSlider}></span>
                <div className={styles.toggleContent}>
                  <span className={styles.toggleTitle}>Auto-Adjust Difficulty</span>
                  <span className={styles.toggleDesc}>Automatically match content complexity to your level</span>
                </div>
              </label>
            </div>

            <div className={styles.toggleGroup}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={currentConfig.adaptive_language}
                  onChange={(e) => onConfigChange({ adaptive_language: e.target.checked })}
                />
                <span className={styles.toggleSlider}></span>
                <div className={styles.toggleContent}>
                  <span className={styles.toggleTitle}>Adaptive Language</span>
                  <span className={styles.toggleDesc}>Adjust communication style based on AI mode</span>
                </div>
              </label>
            </div>
          </div>

          {/* Mode-Specific Settings */}
          <div className={styles.modeSettings}>
            <h4>Response Preferences</h4>
            
            <div className={styles.settingGroup}>
              <label>Response Length</label>
              <select
                value={currentConfig.mode_specific_config?.response_length || 'detailed'}
                onChange={(e) => onConfigChange({
                  mode_specific_config: {
                    ...currentConfig.mode_specific_config,
                    response_length: e.target.value as any
                  }
                })}
                className={styles.select}
              >
                <option value="concise">Concise (Quick answers)</option>
                <option value="detailed">Detailed (Thorough explanations)</option>
                <option value="comprehensive">Comprehensive (In-depth analysis)</option>
              </select>
            </div>

            <div className={styles.settingGroup}>
              <label>Interaction Style</label>
              <select
                value={currentConfig.mode_specific_config?.interaction_style || 'conversational'}
                onChange={(e) => onConfigChange({
                  mode_specific_config: {
                    ...currentConfig.mode_specific_config,
                    interaction_style: e.target.value as any
                  }
                })}
                className={styles.select}
              >
                <option value="tutorial">Tutorial (Step-by-step guidance)</option>
                <option value="conversational">Conversational (Friendly chat)</option>
                <option value="professional">Professional (Formal tone)</option>
              </select>
            </div>

            <div className={styles.settingGroup}>
              <label>Feedback Frequency</label>
              <select
                value={currentConfig.mode_specific_config?.feedback_frequency || 'moderate'}
                onChange={(e) => onConfigChange({
                  mode_specific_config: {
                    ...currentConfig.mode_specific_config,
                    feedback_frequency: e.target.value as any
                  }
                })}
                className={styles.select}
              >
                <option value="minimal">Minimal (Only when asked)</option>
                <option value="moderate">Moderate (Regular check-ins)</option>
                <option value="extensive">Extensive (Frequent feedback)</option>
              </select>
            </div>
          </div>

          {/* Recommended Settings */}
          <div className={styles.recommendedSection}>
            <button
              className={styles.recommendedBtn}
              onClick={handleApplyRecommended}
            >
              <LucideSparkles size={16} />
              Apply Recommended Settings
            </button>
            <p className={styles.recommendedDesc}>
              Optimized for {academicVersion === 'high_school' ? 'high school' : 'college'} level {currentMode.replace(/_/g, ' ')} mode
            </p>
          </div>
        </div>
      )}

      {/* Advanced Config Tab */}
      {activeTab === 'advanced' && (
        <div className={styles.tabContent}>
          <div className={styles.advancedSettings}>
            <div className={styles.settingGroup}>
              <label>Writing Style</label>
              <select
                value={currentConfig.writing_style || 'academic'}
                onChange={(e) => onConfigChange({ writing_style: e.target.value as any })}
                className={styles.select}
              >
                <option value="academic">Academic</option>
                <option value="creative">Creative</option>
                <option value="technical">Technical</option>
              </select>
            </div>

            <div className={styles.settingGroup}>
              <label>Citation Format</label>
              <select
                value={currentConfig.citation_format || 'apa'}
                onChange={(e) => onConfigChange({ citation_format: e.target.value as any })}
                className={styles.select}
              >
                <option value="apa">APA</option>
                <option value="mla">MLA</option>
                <option value="chicago">Chicago</option>
              </select>
            </div>

            <div className={styles.settingGroup}>
              <label>AI Model</label>
              <select
                value={currentConfig.model || 'gpt-4o-mini'}
                onChange={(e) => onConfigChange({ model: e.target.value as any })}
                className={styles.select}
              >
                <option value="gpt-4o-mini">GPT-4o mini (Fast)</option>
                <option value="o4-mini-high">o4-mini-high (Balanced)</option>
                <option value="gpt-4o">GPT-4o (Best Quality)</option>
              </select>
            </div>

            {/* Academic Level Specific Settings */}
            <div className={styles.levelSettings}>
              <h4>{academicVersion === 'high_school' ? 'High School' : 'College'} Settings</h4>
              
              <div className={styles.settingGroup}>
                <label>Explanation Style</label>
                <select
                  value={
                    academicVersion === 'high_school' 
                      ? currentConfig.academic_level_config?.high_school?.preferred_explanation_style || 'step_by_step'
                      : currentConfig.academic_level_config?.college?.preferred_explanation_style || 'analytical'
                  }
                  onChange={(e) => {
                    const newConfig = { ...currentConfig };
                    if (academicVersion === 'high_school') {
                      newConfig.academic_level_config = {
                        ...newConfig.academic_level_config,
                        high_school: {
                          ...newConfig.academic_level_config?.high_school,
                          preferred_explanation_style: e.target.value as any
                        }
                      };
                    } else {
                      newConfig.academic_level_config = {
                        ...newConfig.academic_level_config,
                        college: {
                          ...newConfig.academic_level_config?.college,
                          preferred_explanation_style: e.target.value as any
                        }
                      };
                    }
                    onConfigChange(newConfig);
                  }}
                  className={styles.select}
                >
                  {academicVersion === 'high_school' ? (
                    <>
                      <option value="step_by_step">Step by Step</option>
                      <option value="visual">Visual Examples</option>
                      <option value="analogy">Analogies & Metaphors</option>
                    </>
                  ) : (
                    <>
                      <option value="analytical">Analytical</option>
                      <option value="research_based">Research-Based</option>
                      <option value="theoretical">Theoretical</option>
                    </>
                  )}
                </select>
              </div>

              <div className={styles.settingGroup}>
                <label>Vocabulary Level</label>
                <select
                  value={
                    academicVersion === 'high_school'
                      ? currentConfig.academic_level_config?.high_school?.vocabulary_level || 'grade_appropriate'
                      : currentConfig.academic_level_config?.college?.vocabulary_level || 'academic'
                  }
                  onChange={(e) => {
                    const newConfig = { ...currentConfig };
                    if (academicVersion === 'high_school') {
                      newConfig.academic_level_config = {
                        ...newConfig.academic_level_config,
                        high_school: {
                          ...newConfig.academic_level_config?.high_school,
                          vocabulary_level: e.target.value as any
                        }
                      };
                    } else {
                      newConfig.academic_level_config = {
                        ...newConfig.academic_level_config,
                        college: {
                          ...newConfig.academic_level_config?.college,
                          vocabulary_level: e.target.value as any
                        }
                      };
                    }
                    onConfigChange(newConfig);
                  }}
                  className={styles.select}
                >
                  {academicVersion === 'high_school' ? (
                    <>
                      <option value="grade_appropriate">Grade Appropriate</option>
                      <option value="advanced">Advanced</option>
                    </>
                  ) : (
                    <>
                      <option value="academic">Academic</option>
                      <option value="professional">Professional</option>
                      <option value="technical">Technical</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartAIConfig; 