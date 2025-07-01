/**
 * FlashcardIntegrationExample - 展示如何集成新建的flashcard功能
 * 这个文件展示了Task 2、3、4的完整集成方案
 */

import React, { useState } from 'react'
import { CreateFlashcardData, createFlashcards, CreateFlashcardSetData } from '../api/flashcards'
import BatchImportModal from '../components/BatchImportModal'
import CreateFlashcardSetModal from '../components/CreateFlashcardSetModal'
import FlashcardsList from '../components/FlashcardsList'
import { useFlashcards } from '../hooks/useFlashcards'

const FlashcardIntegrationExample: React.FC = () => {
  // 使用我们的Hook来管理状态
  const {
    flashcardSets,
    isLoading,
    isCreating,
    error,
    createSet,
    refreshSets,
    clearError
  } = useFlashcards()

  // 本地状态管理
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showCardsList, setShowCardsList] = useState(false)
  const [selectedSetId, setSelectedSetId] = useState<string>('')
  const [selectedSetTitle, setSelectedSetTitle] = useState<string>('')

  // 创建新的flashcard set
  const handleCreateSet = async (data: CreateFlashcardSetData) => {
    try {
      await createSet(data)
      setShowCreateModal(false)
    } catch (err) {
      console.error('Failed to create set:', err)
    }
  }

  // 批量导入卡片
  const handleBatchImport = async (cards: CreateFlashcardData[]) => {
    try {
      await createFlashcards(cards)
      setShowImportModal(false)
      // 刷新数据以显示新导入的卡片
      await refreshSets()
    } catch (err) {
      console.error('Failed to import cards:', err)
      throw err
    }
  }

  // 查看flashcard set的卡片
  const handleViewCards = (setId: string, setTitle: string) => {
    setSelectedSetId(setId)
    setSelectedSetTitle(setTitle)
    setShowCardsList(true)
  }

  // 关闭卡片列表
  const handleCloseCardsList = () => {
    setShowCardsList(false)
    setSelectedSetId('')
    setSelectedSetTitle('')
  }

  if (showCardsList && selectedSetId) {
    return (
      <FlashcardsList
        setId={selectedSetId}
        setTitle={selectedSetTitle}
        onClose={handleCloseCardsList}
      />
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#00ffff', marginBottom: '8px' }}>
          Flashcard Management System
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Complete CRUD operations + Batch Import + OCR Support
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '32px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={isCreating}
          style={{
            background: 'linear-gradient(135deg, #00ffff 0%, #0099cc 100%)',
            color: '#000000',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          🆕 Create New Set
        </button>
        
        <button
          onClick={() => setShowImportModal(true)}
          style={{
            background: 'rgba(0, 255, 255, 0.1)',
            color: '#00ffff',
            border: '1px solid #00ffff',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          📤 Batch Import
        </button>

        <button
          onClick={refreshSets}
          disabled={isLoading}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          background: 'rgba(255, 71, 87, 0.1)',
          border: '1px solid rgba(255, 71, 87, 0.3)',
          borderRadius: '8px',
          padding: '16px',
          color: '#ff4757',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{error}</span>
          <button 
            onClick={clearError}
            style={{ background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px',
          color: '#00ffff'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(0, 255, 255, 0.3)',
            borderTop: '3px solid #00ffff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '16px'
          }}></div>
          Loading flashcard sets...
        </div>
      )}

      {/* Flashcard Sets Grid */}
      {!isLoading && (
        <>
          {flashcardSets.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              <h3>No flashcard sets yet</h3>
              <p>Create your first set or import cards to get started!</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {flashcardSets.map((set) => (
                <div
                  key={set.id}
                  style={{
                    background: 'rgba(20, 25, 40, 0.6)',
                    border: '1px solid rgba(0, 255, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '24px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => handleViewCards(set.id, set.title)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.4)'
                    e.currentTarget.style.background = 'rgba(20, 25, 40, 0.8)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.2)'
                    e.currentTarget.style.background = 'rgba(20, 25, 40, 0.6)'
                  }}
                >
                  <h3 style={{ 
                    color: '#ffffff', 
                    marginBottom: '8px',
                    fontSize: '18px'
                  }}>
                    {set.title}
                  </h3>
                  
                  {set.description && (
                    <p style={{ 
                      color: 'rgba(255, 255, 255, 0.7)', 
                      marginBottom: '16px',
                      fontSize: '14px'
                    }}>
                      {set.description}
                    </p>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <span style={{ color: '#00ffff', fontSize: '14px', fontWeight: '600' }}>
                      {set.card_count} cards
                    </span>
                    <div style={{
                      background: `rgba(0, 255, 255, ${set.mastery_level / 100 * 0.3})`,
                      color: '#00ffff',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {set.mastery_level}% mastery
                    </div>
                  </div>

                  {set.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {set.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          style={{
                            background: 'rgba(0, 255, 255, 0.2)',
                            color: '#00ffff',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '500'
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                      {set.tags.length > 3 && (
                        <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px' }}>
                          +{set.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CreateFlashcardSetModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateSet}
        isLoading={isCreating}
      />

      <BatchImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleBatchImport}
        setId={selectedSetId} // 如果选择了特定set，导入到该set中
        isLoading={false}
      />

      {/* CSS Animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

export default FlashcardIntegrationExample 