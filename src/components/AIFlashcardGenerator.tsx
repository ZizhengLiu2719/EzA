import React, { useCallback, useMemo, useState } from 'react';
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
  confidence: number; // AI生成置信度
  isSelected: boolean; // 是否选中保存
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

  // 预设主题扩展
  const presetTopics = useMemo(() => [
    { 
      label: '编程基础', 
      value: 'programming-basics', 
      tags: ['编程', '计算机科学', '软件开发'],
      focusAreas: ['变量和数据类型', '控制结构', '函数', '面向对象', '算法思维']
    },
    { 
      label: 'JavaScript', 
      value: 'javascript', 
      tags: ['JavaScript', 'Web开发', '前端'],
      focusAreas: ['语法基础', '异步编程', 'DOM操作', 'ES6+特性', 'Node.js']
    },
    { 
      label: 'React', 
      value: 'react', 
      tags: ['React', '前端框架', 'JavaScript'],
      focusAreas: ['组件', '状态管理', 'Hooks', '生命周期', '性能优化']
    },
    { 
      label: '数据结构与算法', 
      value: 'algorithms', 
      tags: ['数据结构', '算法', '计算机科学'],
      focusAreas: ['数组', '链表', '栈和队列', '树', '图算法', '排序算法']
    },
    { 
      label: '高等数学', 
      value: 'calculus', 
      tags: ['数学', '微积分', '代数'],
      focusAreas: ['极限', '导数', '积分', '微分方程', '级数']
    },
    { 
      label: '大学物理', 
      value: 'physics', 
      tags: ['物理', '科学', '自然规律'],
      focusAreas: ['力学', '热学', '电磁学', '光学', '量子物理']
    },
    { 
      label: '有机化学', 
      value: 'organic-chemistry', 
      tags: ['化学', '有机化合物', '化学反应'],
      focusAreas: ['烷烃', '芳香化合物', '醇酚醚', '羰基化合物', '反应机理']
    },
    { 
      label: '世界历史', 
      value: 'world-history', 
      tags: ['历史', '文化', '事件'],
      focusAreas: ['古代文明', '中世纪', '文艺复兴', '工业革命', '现代史']
    },
    { 
      label: '英语词汇', 
      value: 'english-vocabulary', 
      tags: ['英语', '词汇', '语言学习'],
      focusAreas: ['基础词汇', '学术词汇', '商务英语', '习语表达', '词根词缀']
    },
    { 
      label: '心理学', 
      value: 'psychology', 
      tags: ['心理学', '认知科学', '行为科学'],
      focusAreas: ['认知心理学', '发展心理学', '社会心理学', '异常心理学', '研究方法']
    }
  ], []);

  // 生成提示词
  const buildPrompt = useCallback((config: GenerationConfig, cardType: 'basic' | 'cloze', index: number) => {
    const selectedTopic = presetTopics.find(t => t.value === config.topic);
    const topicName = selectedTopic?.label || config.topic.replace('custom-', '');
    
    const difficultyMap = {
      beginner: '初级',
      intermediate: '中级', 
      advanced: '高级'
    };

    const styleMap = {
      formal: '正式严谨的',
      conversational: '对话式通俗易懂的',
      academic: '学术性专业的'
    };

    let prompt = `请生成一张${difficultyMap[config.difficulty]}难度的${topicName}学习闪卡。

要求：
- 语言：${config.language === 'zh' ? '中文' : '英文'}
- 风格：${styleMap[config.style]}
- 卡片类型：${cardType === 'basic' ? '问答题' : '填空题'}`;

    if (config.focusAreas.length > 0) {
      prompt += `\n- 重点关注：${config.focusAreas.join('、')}`;
    }

    if (cardType === 'basic') {
      prompt += `\n\n格式要求：
- 问题要具体明确，避免过于宽泛
- 答案要准确完整，包含关键要点
- 问题应该测试核心概念的理解`;
    } else {
      prompt += `\n\n格式要求：
- 用"____"表示需要填空的部分
- 填空应该是关键概念或术语
- 题目要有足够的上下文信息`;
    }

    if (config.includeHints) {
      prompt += `\n- 提供简短的提示，引导思考方向`;
    }

    if (config.includeExplanations) {
      prompt += `\n- 提供详细解释，说明答案的原理或背景`;
    }

    if (config.customPrompt) {
      prompt += `\n\n用户特殊要求：${config.customPrompt}`;
    }

    prompt += `\n\n请返回JSON格式：
{
  "question": "问题内容",
  "answer": "答案内容",
  ${config.includeHints ? '"hint": "提示内容",' : ''}
  ${config.includeExplanations ? '"explanation": "解释内容",' : ''}
  "tags": ["标签1", "标签2"],
  "confidence": 0.95
}`;

    return prompt;
  }, [presetTopics]);

  // 模拟AI生成（实际项目中替换为真正的AI API调用）
  const generateSingleCard = async (cardType: 'basic' | 'cloze', index: number): Promise<GeneratedCard> => {
    const prompt = buildPrompt(config, cardType, index);
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    // 模拟AI生成（这里应该替换为真实的AI API调用）
    const mockCard = generateMockCard(config, cardType, index);
    
    return {
      ...mockCard,
      id: `card-${Date.now()}-${index}`,
      isSelected: true,
      confidence: 0.85 + Math.random() * 0.15 // 模拟置信度
    };
  };

  // 改进的模拟生成函数（用更好的算法）
  const generateMockCard = (config: GenerationConfig, cardType: 'basic' | 'cloze', index: number): Omit<GeneratedCard, 'id' | 'isSelected' | 'confidence'> => {
    const selectedTopic = presetTopics.find(t => t.value === config.topic);
    const topicName = selectedTopic?.label || config.topic.replace('custom-', '');
    
    // 使用更智能的模板生成系统
    const templates = getEnhancedTemplates(config.topic, config.difficulty, cardType);
    const template = templates[index % templates.length];
    
    // 根据配置调整内容
    let question = template.question.replace('{topic}', topicName);
    let answer = template.answer;
    
    // 根据难度调整复杂度
    if (config.difficulty === 'advanced') {
      question = question.replace('什么是', '详细分析') + '，并说明其应用场景。';
    } else if (config.difficulty === 'beginner') {
      question = '简单说明：' + question;
    }

    return {
      question,
      answer,
      hint: config.includeHints ? template.hint : undefined,
      explanation: config.includeExplanations ? template.explanation : undefined,
      tags: [...(selectedTopic?.tags || [topicName]), config.difficulty, ...(config.focusAreas.slice(0, 2))],
      card_type: cardType
    };
  };

  // 增强的模板系统
  const getEnhancedTemplates = (topic: string, difficulty: string, cardType: 'basic' | 'cloze') => {
    const baseTemplates = {
      'javascript': {
        basic: [
          {
            question: 'JavaScript中什么是闭包？请举例说明',
            answer: '闭包是指一个函数可以访问其外部作用域中的变量，即使在外部函数已经执行完毕后。例如：function outer() { let x = 1; return function inner() { console.log(x); }; }',
            hint: '考虑函数作用域和变量访问',
            explanation: '闭包是JavaScript中的核心概念，它使得内部函数能够"记住"它被创建时的环境，常用于数据封装和模块模式。'
          },
          {
            question: '解释JavaScript中的原型链机制',
            answer: '原型链是JavaScript对象继承的机制。每个对象都有一个__proto__属性指向其原型对象，形成链式结构，直到Object.prototype。',
            hint: '对象如何继承属性和方法',
            explanation: '原型链允许对象继承其原型的属性和方法，是JavaScript面向对象编程的基础。'
          }
        ],
        cloze: [
          {
            question: 'JavaScript中使用 ____ 关键字可以声明块级作用域变量',
            answer: 'let',
            hint: 'ES6引入的新特性',
            explanation: 'let声明的变量具有块级作用域，不同于var的函数作用域。'
          }
        ]
      }
      // 可以扩展更多主题...
    };

    const fallbackTemplates = {
      basic: [
        {
          question: '{topic}的基本概念是什么？',
          answer: '这是一个关于{topic}的基础知识点，需要理解其核心原理和应用场景。',
          hint: '从定义和特点入手',
          explanation: '理解基础概念是学习任何学科的第一步。'
        }
      ],
      cloze: [
        {
          question: '{topic}中的关键术语是 ____',
          answer: '核心概念',
          hint: '考虑最重要的术语',
          explanation: '掌握关键术语有助于深入理解学科内容。'
        }
      ]
    };

    return baseTemplates[topic as keyof typeof baseTemplates]?.[cardType] || fallbackTemplates[cardType];
  };

  // 生成卡片的主函数
  const generateCards = async () => {
    if (!config.topic) {
      setError('请选择一个学习主题');
      return;
    }

    setLoading(true);
    setStep('generating');
    setError(null);
    setProgress({ total: config.count, completed: 0, current: '准备生成...' });

    try {
      const cards: GeneratedCard[] = [];
      
      for (let i = 0; i < config.count; i++) {
        setProgress(prev => ({ 
          ...prev, 
          completed: i, 
          current: `正在生成第 ${i + 1} 张卡片...` 
        }));

        // 根据配置决定卡片类型
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
      setProgress(prev => ({ ...prev, completed: config.count, current: '生成完成！' }));
    } catch (error) {
      console.error('生成失败:', error);
      setError('AI生成失败，请检查网络连接后重试');
      setStep('config');
    } finally {
      setLoading(false);
    }
  };

  // 保存选中的卡片
  const saveCards = async () => {
    const selectedCards = generatedCards.filter(card => card.isSelected);
    
    if (selectedCards.length === 0) {
      setError('请至少选择一张卡片保存');
      return;
    }

    setLoading(true);
    setStep('saving');
    setError(null);

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
    } catch (error) {
      console.error('保存失败:', error);
      setError('保存卡片失败，请重试');
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  // 切换卡片选中状态
  const toggleCardSelection = (cardId: string) => {
    setGeneratedCards(prev => 
      prev.map(card => 
        card.id === cardId 
          ? { ...card, isSelected: !card.isSelected }
          : card
      )
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    const allSelected = generatedCards.every(card => card.isSelected);
    setGeneratedCards(prev => 
      prev.map(card => ({ ...card, isSelected: !allSelected }))
    );
  };

  // 编辑卡片内容
  const updateCard = (cardId: string, updates: Partial<GeneratedCard>) => {
    setGeneratedCards(prev => 
      prev.map(card => 
        card.id === cardId 
          ? { ...card, ...updates }
          : card
      )
    );
  };

  // 重新生成单张卡片
  const regenerateCard = async (cardId: string) => {
    const cardIndex = generatedCards.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return;

    setLoading(true);
    try {
      const existingCard = generatedCards[cardIndex];
      const newCard = await generateSingleCard(existingCard.card_type, cardIndex);
      
      setGeneratedCards(prev => 
        prev.map(card => 
          card.id === cardId 
            ? { ...newCard, id: cardId, isSelected: card.isSelected }
            : card
        )
      );
    } catch (error) {
      console.error('重新生成失败:', error);
      setError('重新生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取当前选中主题的焦点区域
  const getCurrentFocusAreas = () => {
    const selectedTopic = presetTopics.find(t => t.value === config.topic);
    return selectedTopic?.focusAreas || [];
  };

  // 渲染配置步骤（增强版）
  const renderConfigStep = () => (
    <div className={styles.configContainer}>
      <h2 className={styles.stepTitle}>🤖 AI 闪卡生成配置</h2>
      
      {error && (
        <div className={styles.errorMessage}>
          ⚠️ {error}
        </div>
      )}
      
      {/* 主题选择 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>学习主题</label>
        <div className={styles.topicGrid}>
          {presetTopics.map(topic => (
            <button
              key={topic.value}
              onClick={() => {
                setConfig(prev => ({ 
                  ...prev, 
                  topic: topic.value,
                  focusAreas: [] // 重置焦点区域
                }));
              }}
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
            topic: e.target.value ? `custom-${e.target.value}` : '',
            focusAreas: [] // 重置焦点区域
          }))}
          className={styles.customTopicInput}
        />
      </div>

      {/* 焦点区域选择 */}
      {getCurrentFocusAreas().length > 0 && (
        <div className={styles.formGroup}>
          <label className={styles.label}>重点关注领域（可多选）</label>
          <div className={styles.focusAreasGrid}>
            {getCurrentFocusAreas().map(area => (
              <button
                key={area}
                onClick={() => {
                  setConfig(prev => ({
                    ...prev,
                    focusAreas: prev.focusAreas.includes(area)
                      ? prev.focusAreas.filter(item => item !== area)
                      : [...prev.focusAreas, area]
                  }));
                }}
                className={`${styles.focusAreaButton} ${config.focusAreas.includes(area) ? styles.selected : ''}`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 难度和风格 */}
      <div className={styles.formRow}>
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

        <div className={styles.formGroup}>
          <label className={styles.label}>生成风格</label>
          <div className={styles.buttonGroup}>
            {[
              { value: 'conversational', label: '对话式', icon: '💬' },
              { value: 'formal', label: '正式', icon: '📋' },
              { value: 'academic', label: '学术', icon: '🎓' }
            ].map(style => (
              <button
                key={style.value}
                onClick={() => setConfig(prev => ({ ...prev, style: style.value as any }))}
                className={`${styles.styleButton} ${config.style === style.value ? styles.selected : ''}`}
              >
                <span>{style.icon}</span>
                <span>{style.label}</span>
              </button>
            ))}
          </div>
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
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={config.language === 'en'}
              onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.checked ? 'en' : 'zh' }))}
            />
            使用英文生成
          </label>
        </div>
      </div>

      {/* 自定义提示词 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>自定义提示词（可选）</label>
        <textarea
          value={config.customPrompt}
          onChange={(e) => setConfig(prev => ({ ...prev, customPrompt: e.target.value }))}
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

  // 渲染生成中步骤（增强版）
  const renderGeneratingStep = () => (
    <div className={styles.generatingContainer}>
      <div className={styles.loadingAnimation}>
        <div className={styles.aiIcon}>🤖</div>
        <div className={styles.loadingText}>{progress.current}</div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${(progress.completed / progress.total) * 100}%` }}
          ></div>
        </div>
        <div className={styles.progressStats}>
          {progress.completed} / {progress.total} 张卡片
        </div>
      </div>
      
      <div className={styles.generatingTips}>
        <h3>💡 AI生成过程</h3>
        <ul>
          <li>📊 分析您的主题和难度设置</li>
          <li>🎯 根据焦点区域优化问题方向</li>
          <li>🧠 应用认知科学原理构造问题</li>
          <li>✨ 根据您选择的风格调整表述</li>
          <li>🔍 确保答案准确性和完整性</li>
        </ul>
      </div>
    </div>
  );

  // 渲染预览步骤
  const renderPreviewStep = () => {
    const selectedCards = generatedCards.filter(card => card.isSelected);
    const allSelected = generatedCards.every(card => card.isSelected);
    
    return (
      <div className={styles.previewContainer}>
        <h2 className={styles.stepTitle}>📝 预览生成的闪卡</h2>
        
        {error && (
          <div className={styles.errorMessage}>
            ⚠️ {error}
          </div>
        )}
        
        <div className={styles.previewHeader}>
          <div className={styles.previewStats}>
            <span>共生成 {generatedCards.length} 张闪卡</span>
            <span>{generatedCards.filter(c => c.card_type === 'basic').length} 张问答</span>
            <span>{generatedCards.filter(c => c.card_type === 'cloze').length} 张填空</span>
            <span>已选择 {selectedCards.length} 张</span>
          </div>
          
          <div className={styles.previewActions}>
            <button 
              onClick={toggleSelectAll}
              className={styles.selectAllButton}
            >
              {allSelected ? '取消全选' : '全选'}
            </button>
            <span className={styles.qualityIndicator}>
              平均质量: {(generatedCards.reduce((sum, card) => sum + card.confidence, 0) / generatedCards.length * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className={styles.cardsPreview}>
          {generatedCards.map((card, index) => (
            <div key={card.id} className={`${styles.cardPreview} ${card.isSelected ? styles.selected : ''}`}>
              <div className={styles.cardHeader}>
                <div className={styles.cardMeta}>
                  <span className={styles.cardIndex}>#{index + 1}</span>
                  <span className={`${styles.cardType} ${styles[card.card_type]}`}>
                    {card.card_type === 'basic' ? '问答' : '填空'}
                  </span>
                  <span className={styles.cardConfidence}>
                    质量: {(card.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                
                <div className={styles.cardControls}>
                  <button
                    onClick={() => toggleCardSelection(card.id)}
                    className={`${styles.selectButton} ${card.isSelected ? styles.selected : ''}`}
                    title={card.isSelected ? '取消选择' : '选择此卡片'}
                  >
                    {card.isSelected ? '✓' : '○'}
                  </button>
                  <button
                    onClick={() => regenerateCard(card.id)}
                    className={styles.regenerateButton}
                    disabled={loading}
                    title="重新生成此卡片"
                  >
                    🔄
                  </button>
                </div>
              </div>
              
              <div className={styles.cardContent}>
                <div className={styles.editableField}>
                  <label><strong>问题:</strong></label>
                  <textarea
                    value={card.question}
                    onChange={(e) => updateCard(card.id, { question: e.target.value })}
                    className={styles.editableTextarea}
                    rows={2}
                  />
                </div>
                
                <div className={styles.editableField}>
                  <label><strong>答案:</strong></label>
                  <textarea
                    value={card.answer}
                    onChange={(e) => updateCard(card.id, { answer: e.target.value })}
                    className={styles.editableTextarea}
                    rows={2}
                  />
                </div>
                
                {card.hint && (
                  <div className={styles.editableField}>
                    <label><strong>提示:</strong></label>
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
                    <label><strong>解释:</strong></label>
                    <textarea
                      value={card.explanation}
                      onChange={(e) => updateCard(card.id, { explanation: e.target.value })}
                      className={styles.editableTextarea}
                      rows={2}
                    />
                  </div>
                )}
                
                <div className={styles.tagsSection}>
                  <label><strong>标签:</strong></label>
                  <div className={styles.tags}>
                    {card.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className={styles.tag}>
                        {tag}
                        <button
                          onClick={() => {
                            const newTags = card.tags.filter((_, i) => i !== tagIndex);
                            updateCard(card.id, { tags: newTags });
                          }}
                          className={styles.removeTag}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                                         <input
                       type="text"
                       placeholder="添加标签..."
                       className={styles.addTagInput}
                       onKeyPress={(e) => {
                         if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                           const newTag = (e.target as HTMLInputElement).value.trim();
                           if (!card.tags.includes(newTag)) {
                             updateCard(card.id, { tags: [...card.tags, newTag] });
                           }
                           (e.target as HTMLInputElement).value = '';
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
          <button 
            onClick={() => setStep('config')} 
            className={styles.backButton}
          >
            ← 重新配置
          </button>
          <button 
            onClick={saveCards}
            disabled={loading || selectedCards.length === 0}
            className={styles.saveButton}
          >
            💾 保存选中的卡片 ({selectedCards.length})
          </button>
        </div>
      </div>
    );
  };

  // 渲染保存中步骤
  const renderSavingStep = () => (
    <div className={styles.savingContainer}>
      <div className={styles.loadingAnimation}>
        <div className={styles.saveIcon}>💾</div>
        <div className={styles.loadingText}>正在保存闪卡到卡片集...</div>
        <div className={styles.savingProgress}>
          <div className={styles.progressDots}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
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