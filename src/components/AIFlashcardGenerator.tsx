import React, { useState } from 'react';
import { CreateFlashcardData, createFlashcards } from '../api/flashcards';
import styles from './AIFlashcardGenerator.module.css';

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
}

interface GeneratedCard {
  question: string;
  answer: string;
  hint?: string;
  explanation?: string;
  tags: string[];
  card_type: 'basic' | 'cloze';
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
    focusAreas: []
  });

  const [loading, setLoading] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [step, setStep] = useState<'config' | 'generating' | 'preview' | 'saving'>('config');
  const [customPrompt, setCustomPrompt] = useState('');

  // 预设主题
  const presetTopics = [
    { label: '编程基础', value: 'programming-basics', tags: ['编程', '计算机科学', '软件开发'] },
    { label: 'JavaScript', value: 'javascript', tags: ['JavaScript', 'Web开发', '前端'] },
    { label: 'React', value: 'react', tags: ['React', '前端框架', 'JavaScript'] },
    { label: '数据结构', value: 'data-structures', tags: ['数据结构', '算法', '计算机科学'] },
    { label: '数学基础', value: 'mathematics', tags: ['数学', '微积分', '代数'] },
    { label: '物理学', value: 'physics', tags: ['物理', '科学', '自然规律'] },
    { label: '化学', value: 'chemistry', tags: ['化学', '分子', '化学反应'] },
    { label: '历史', value: 'history', tags: ['历史', '文化', '事件'] },
    { label: '地理', value: 'geography', tags: ['地理', '地球科学', '位置'] },
    { label: '英语词汇', value: 'english-vocabulary', tags: ['英语', '词汇', '语言学习'] }
  ];

  // 模拟AI生成（实际项目中这里会调用真正的AI API）
  const generateCards = async () => {
    setLoading(true);
    setStep('generating');

    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 2000));

      const cards: GeneratedCard[] = [];
      const selectedTopic = presetTopics.find(t => t.value === config.topic) || { label: config.topic, tags: [] };

      // 根据配置生成不同类型的卡片
      for (let i = 0; i < config.count; i++) {
        const isBasicCard = config.cardType === 'basic' || (config.cardType === 'mixed' && Math.random() > 0.3);
        
        if (isBasicCard) {
          cards.push(generateBasicCard(selectedTopic, i));
        } else {
          cards.push(generateClozeCard(selectedTopic, i));
        }
      }

      setGeneratedCards(cards);
      setStep('preview');
    } catch (error) {
      console.error('生成失败:', error);
      alert('AI生成失败，请重试');
      setStep('config');
    } finally {
      setLoading(false);
    }
  };

  // 生成基础卡片
  const generateBasicCard = (topic: any, index: number): GeneratedCard => {
    const templates = getTemplatesForTopic(topic.value);
    const template = templates[index % templates.length];
    
    return {
      question: template.question,
      answer: template.answer,
      hint: config.includeHints ? template.hint : undefined,
      explanation: config.includeExplanations ? template.explanation : undefined,
      tags: [...topic.tags, config.difficulty],
      card_type: 'basic'
    };
  };

  // 生成填空卡片
  const generateClozeCard = (topic: any, index: number): GeneratedCard => {
    const templates = getClozeTemplatesForTopic(topic.value);
    const template = templates[index % templates.length];
    
    return {
      question: template.question,
      answer: template.answer,
      hint: config.includeHints ? template.hint : undefined,
      explanation: config.includeExplanations ? template.explanation : undefined,
      tags: [...topic.tags, config.difficulty, '填空'],
      card_type: 'cloze'
    };
  };

  // 获取主题模板（这里是模拟数据，实际应该从AI生成）
  const getTemplatesForTopic = (topic: string) => {
    const templates: Record<string, any[]> = {
      'javascript': [
        {
          question: 'JavaScript中什么是闭包？',
          answer: '闭包是指一个函数可以访问其外部作用域中的变量，即使在外部函数已经执行完毕后。',
          hint: '考虑函数作用域和变量访问',
          explanation: '闭包是JavaScript中的核心概念，它使得内部函数能够"记住"它被创建时的环境。'
        },
        {
          question: '什么是JavaScript中的事件冒泡？',
          answer: '事件冒泡是指当一个元素上的事件被触发时，同样的事件将会在该元素的父级元素上被触发。',
          hint: '从子元素向父元素传播',
          explanation: '事件冒泡是DOM事件流的默认行为，可以使用stopPropagation()方法阻止。'
        }
      ],
      'react': [
        {
          question: 'React中什么是组件？',
          answer: '组件是React应用的基本构建块，它是一个可重用的代码片段，用于渲染用户界面的一部分。',
          hint: '可重用的UI构建块',
          explanation: '组件可以是函数组件或类组件，它们接收props并返回JSX元素。'
        }
      ],
      'programming-basics': [
        {
          question: '什么是变量？',
          answer: '变量是用于存储数据值的容器，可以在程序执行过程中改变其值。',
          hint: '存储数据的容器',
          explanation: '变量是编程中的基本概念，用于临时保存和操作数据。'
        }
      ]
    };

    return templates[topic] || templates['programming-basics'];
  };

  // 获取填空题模板
  const getClozeTemplatesForTopic = (topic: string) => {
    const templates: Record<string, any[]> = {
      'javascript': [
        {
          question: 'JavaScript中声明变量使用 _____ 关键字。',
          answer: 'var, let, const',
          hint: 'ES6引入了两个新的关键字',
          explanation: 'var是传统方式，let和const是ES6引入的块级作用域声明方式。'
        }
      ]
    };

    return templates[topic] || templates['javascript'];
  };

  // 保存生成的卡片
  const saveCards = async () => {
    setLoading(true);
    setStep('saving');

    try {
      const cardsToCreate: CreateFlashcardData[] = generatedCards.map(card => ({
        set_id: setId,
        question: card.question,
        answer: card.answer,
        hint: card.hint,
        explanation: card.explanation,
        card_type: card.card_type,
        tags: card.tags
      }));

      await createFlashcards(cardsToCreate);
      onGenerated(generatedCards.length);
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存卡片失败，请重试');
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  // 渲染配置步骤
  const renderConfigStep = () => (
    <div className={styles.configContainer}>
      <h2 className={styles.stepTitle}>🤖 AI 闪卡生成配置</h2>
      
      {/* 主题选择 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>学习主题</label>
        <div className={styles.topicGrid}>
          {presetTopics.map(topic => (
            <button
              key={topic.value}
              onClick={() => setConfig(prev => ({ ...prev, topic: topic.value }))}
              className={`${styles.topicButton} ${config.topic === topic.value ? styles.selected : ''}`}
            >
              {topic.label}
            </button>
          ))}
        </div>
        
        <input
          type="text"
          placeholder="或输入自定义主题..."
          value={config.topic.startsWith('custom-') ? config.topic.slice(7) : ''}
          onChange={(e) => setConfig(prev => ({ 
            ...prev, 
            topic: e.target.value ? `custom-${e.target.value}` : '' 
          }))}
          className={styles.customTopicInput}
        />
      </div>

      {/* 难度选择 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>难度级别</label>
        <div className={styles.buttonGroup}>
          {[
            { value: 'beginner', label: '初级', color: '#00ff7f' },
            { value: 'intermediate', label: '中级', color: '#ff9f0a' },
            { value: 'advanced', label: '高级', color: '#ff453a' }
          ].map(difficulty => (
            <button
              key={difficulty.value}
              onClick={() => setConfig(prev => ({ ...prev, difficulty: difficulty.value as any }))}
              className={`${styles.difficultyButton} ${config.difficulty === difficulty.value ? styles.selected : ''}`}
              style={{ '--accent-color': difficulty.color } as React.CSSProperties}
            >
              {difficulty.label}
            </button>
          ))}
        </div>
      </div>

      {/* 数量和类型 */}
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.label}>生成数量</label>
          <input
            type="number"
            min="1"
            max="50"
            value={config.count}
            onChange={(e) => setConfig(prev => ({ ...prev, count: parseInt(e.target.value) || 10 }))}
            className={styles.numberInput}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>卡片类型</label>
          <select
            value={config.cardType}
            onChange={(e) => setConfig(prev => ({ ...prev, cardType: e.target.value as any }))}
            className={styles.select}
          >
            <option value="mixed">混合类型</option>
            <option value="basic">基础问答</option>
            <option value="cloze">填空题</option>
          </select>
        </div>
      </div>

      {/* 高级选项 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>高级选项</label>
        <div className={styles.checkboxGroup}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={config.includeExplanations}
              onChange={(e) => setConfig(prev => ({ ...prev, includeExplanations: e.target.checked }))}
            />
            包含详细解释
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={config.includeHints}
              onChange={(e) => setConfig(prev => ({ ...prev, includeHints: e.target.checked }))}
            />
            包含提示信息
          </label>
        </div>
      </div>

      {/* 自定义提示词 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>自定义提示词（可选）</label>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="为AI提供额外的生成指导，如特定的学习重点或风格要求..."
          className={styles.textarea}
          rows={3}
        />
      </div>

      <div className={styles.actions}>
        <button onClick={onClose} className={styles.cancelButton}>
          取消
        </button>
        <button 
          onClick={generateCards}
          disabled={!config.topic || loading}
          className={styles.generateButton}
        >
          🚀 开始生成
        </button>
      </div>
    </div>
  );

  // 渲染生成中步骤
  const renderGeneratingStep = () => (
    <div className={styles.generatingContainer}>
      <div className={styles.loadingAnimation}>
        <div className={styles.aiIcon}>🤖</div>
        <div className={styles.loadingText}>AI正在为您生成闪卡...</div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill}></div>
        </div>
      </div>
      
      <div className={styles.generatingTips}>
        <h3>💡 生成原理</h3>
        <ul>
          <li>📊 分析您选择的主题和难度</li>
          <li>🎯 根据认知科学原理生成问题</li>
          <li>🧠 确保知识点覆盖全面且有逻辑</li>
          <li>✨ 优化问题表述和答案准确性</li>
        </ul>
      </div>
    </div>
  );

  // 渲染预览步骤
  const renderPreviewStep = () => (
    <div className={styles.previewContainer}>
      <h2 className={styles.stepTitle}>📝 预览生成的闪卡</h2>
      
      <div className={styles.previewStats}>
        <span>共生成 {generatedCards.length} 张闪卡</span>
        <span>{generatedCards.filter(c => c.card_type === 'basic').length} 张基础卡片</span>
        <span>{generatedCards.filter(c => c.card_type === 'cloze').length} 张填空卡片</span>
      </div>

      <div className={styles.cardsPreview}>
        {generatedCards.map((card, index) => (
          <div key={index} className={styles.cardPreview}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIndex}>#{index + 1}</span>
              <span className={`${styles.cardType} ${styles[card.card_type]}`}>
                {card.card_type === 'basic' ? '问答' : '填空'}
              </span>
            </div>
            
            <div className={styles.cardContent}>
              <div className={styles.question}>
                <strong>问题:</strong> {card.question}
              </div>
              <div className={styles.answer}>
                <strong>答案:</strong> {card.answer}
              </div>
              
              {card.hint && (
                <div className={styles.hint}>
                  <strong>提示:</strong> {card.hint}
                </div>
              )}
              
              {card.explanation && (
                <div className={styles.explanation}>
                  <strong>解释:</strong> {card.explanation}
                </div>
              )}
              
              <div className={styles.tags}>
                {card.tags.map((tag, tagIndex) => (
                  <span key={tagIndex} className={styles.tag}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button 
          onClick={() => setStep('config')} 
          className={styles.backButton}
        >
          ← 重新配置
        </button>
        <button 
          onClick={saveCards}
          disabled={loading}
          className={styles.saveButton}
        >
          💾 保存到卡片集
        </button>
      </div>
    </div>
  );

  // 渲染保存中步骤
  const renderSavingStep = () => (
    <div className={styles.savingContainer}>
      <div className={styles.loadingAnimation}>
        <div className={styles.saveIcon}>💾</div>
        <div className={styles.loadingText}>正在保存闪卡...</div>
      </div>
    </div>
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h1 className={styles.title}>AI 闪卡生成器</h1>
          <button onClick={onClose} className={styles.closeButton}>✕</button>
        </div>

        <div className={styles.content}>
          {step === 'config' && renderConfigStep()}
          {step === 'generating' && renderGeneratingStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'saving' && renderSavingStep()}
        </div>
      </div>
    </div>
  );
};

export default AIFlashcardGenerator; 