import BackToDashboardButton from '@/components/BackToDashboardButton';
import BatchImportModal from '@/components/BatchImportModal';
import FlashcardEditor from '@/components/FlashcardEditor';
import FlashcardsList from '@/components/FlashcardsList';
import { useFlashcards } from '@/hooks/useFlashcards';
import React, { useState } from 'react';
import styles from './FlashcardTest.module.css';

const FlashcardTest: React.FC = () => {
  const {
    flashcardSets,
    isLoading,
    error,
    createSet,
    refreshSets,
    clearError
  } = useFlashcards();

  const [activeTab, setActiveTab] = useState<'sets' | 'editor' | 'list' | 'import'>('sets');
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const handleCreateSet = async () => {
    try {
      const newSet = await createSet({
        title: '测试卡片集',
        description: '这是一个测试卡片集',
        subject: '测试',
        difficulty: 3,
        is_public: false,
        tags: ['测试', '演示']
      });
      console.log('Created set:', newSet);
      alert('卡片集创建成功！');
    } catch (err) {
      console.error('Error creating set:', err);
      alert('创建失败，请检查控制台');
    }
  };

  const handleCardSave = async (cardData: any): Promise<void> => {
    console.log('Card saved:', cardData);
    alert('卡片保存成功！');
    setShowEditor(false);
  };

  const handleBatchImport = async (cards: any[]): Promise<void> => {
    console.log('Batch import:', cards);
    alert(`批量导入 ${cards.length} 张卡片成功！`);
    setShowBatchImport(false);
  };

  return (
    <div className={styles.container}>
      <BackToDashboardButton />
      
      <div className={styles.header}>
        <h1>闪卡功能测试</h1>
        <p>测试新实现的闪卡CRUD、批量导入和useFlashcards Hook功能</p>
      </div>

      {error && (
        <div className={styles.error}>
          <p>错误: {error}</p>
          <button onClick={clearError}>清除错误</button>
        </div>
      )}

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'sets' ? styles.active : ''}`}
          onClick={() => setActiveTab('sets')}
        >
          卡片集管理
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'editor' ? styles.active : ''}`}
          onClick={() => setActiveTab('editor')}
        >
          单卡编辑器
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'list' ? styles.active : ''}`}
          onClick={() => setActiveTab('list')}
        >
          卡片列表
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'import' ? styles.active : ''}`}
          onClick={() => setActiveTab('import')}
        >
          批量导入
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'sets' && (
          <div className={styles.setsTab}>
            <div className={styles.actions}>
              <button onClick={handleCreateSet} disabled={isLoading}>
                {isLoading ? '创建中...' : '创建测试卡片集'}
              </button>
              <button onClick={refreshSets}>刷新列表</button>
            </div>
            
            <div className={styles.setsList}>
              <h3>现有卡片集 ({flashcardSets.length})</h3>
              {flashcardSets.length === 0 ? (
                <p>暂无卡片集，点击上方按钮创建一个测试集</p>
              ) : (
                flashcardSets.map(set => (
                  <div key={set.id} className={styles.setCard}>
                    <h4>{set.title}</h4>
                    <p>{set.description}</p>
                    <div className={styles.setInfo}>
                      <span>主题: {set.subject}</span>
                      <span>难度: {set.difficulty}/5</span>
                      <span>标签: {set.tags.join(', ')}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedSetId(set.id);
                        setActiveTab('list');
                      }}
                    >
                      查看卡片
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'editor' && (
          <div className={styles.editorTab}>
            <div className={styles.editorHeader}>
              <h3>单卡编辑器测试</h3>
              <p>测试创建和编辑单张闪卡的功能</p>
            </div>
            
            {!showEditor ? (
              <button 
                className={styles.showEditorBtn}
                onClick={() => setShowEditor(true)}
              >
                打开编辑器
              </button>
            ) : (
              <FlashcardEditor
                isOpen={showEditor}
                onClose={() => setShowEditor(false)}
                onSave={handleCardSave}
                setId={selectedSetId || 'test-set-id'}
                isLoading={false}
              />
            )}
          </div>
        )}

        {activeTab === 'list' && (
          <div className={styles.listTab}>
            {selectedSetId ? (
              <FlashcardsList 
                setId={selectedSetId}
                setTitle="测试卡片集"
                onClose={() => setSelectedSetId(null)}
              />
            ) : (
              <div className={styles.noSetSelected}>
                <p>请先从"卡片集管理"标签页选择一个卡片集</p>
                <button onClick={() => setActiveTab('sets')}>
                  返回卡片集管理
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'import' && (
          <div className={styles.importTab}>
            <div className={styles.importHeader}>
              <h3>批量导入测试</h3>
              <p>测试文本、CSV、OCR和JSON导入功能</p>
            </div>
            
            {!showBatchImport ? (
              <button 
                className={styles.showImportBtn}
                onClick={() => setShowBatchImport(true)}
              >
                打开批量导入
              </button>
            ) : (
              <BatchImportModal
                isOpen={showBatchImport}
                onClose={() => setShowBatchImport(false)}
                onImport={handleBatchImport}
                setId={selectedSetId || 'test-set-id'}
              />
            )}
          </div>
        )}
      </div>

      <div className={styles.debugInfo}>
        <h3>调试信息</h3>
        <pre>{JSON.stringify({ 
          setsCount: flashcardSets.length, 
          isLoading, 
          error,
          selectedSetId,
          activeTab 
        }, null, 2)}</pre>
      </div>
    </div>
  );
};

export default FlashcardTest; 