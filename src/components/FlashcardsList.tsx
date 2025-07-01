import React, { useEffect, useState } from 'react'
import { createFlashcard, CreateFlashcardData, deleteFlashcard, getFlashcards } from '../api/flashcards'
import { FSRSCard } from '../types/SRSTypes'
import FlashcardEditor from './FlashcardEditor'
import styles from './FlashcardsList.module.css'

interface FlashcardsListProps {
  setId: string
  setTitle: string
  onClose: () => void
}

const FlashcardsList: React.FC<FlashcardsListProps> = ({
  setId,
  setTitle,
  onClose
}) => {
  const [flashcards, setFlashcards] = useState<FSRSCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadFlashcards()
  }, [setId])

  const loadFlashcards = async () => {
    try {
      setLoading(true)
      setError(null)
      const cards = await getFlashcards(setId)
      setFlashcards(cards)
    } catch (err) {
      console.error('Error loading flashcards:', err)
      setError(err instanceof Error ? err.message : 'Failed to load flashcards')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCard = async (cardData: CreateFlashcardData) => {
    try {
      setIsCreating(true)
      await createFlashcard(cardData)
      await loadFlashcards()
    } catch (err) {
      console.error('Error creating card:', err)
      throw err
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) {
      return
    }

    try {
      await deleteFlashcard(cardId)
      setFlashcards(prev => prev.filter(card => card.id !== cardId))
    } catch (err) {
      console.error('Error deleting card:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete card')
    }
  }

  const getStateBadge = (state: number) => {
    switch (state) {
      case 0: return { label: 'New', className: styles.stateNew }
      case 1: return { label: 'Learning', className: styles.stateLearning }
      case 2: return { label: 'Review', className: styles.stateReview }
      case 3: return { label: 'Relearning', className: styles.stateRelearning }
      default: return { label: 'Unknown', className: styles.stateUnknown }
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading flashcards...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={onClose}>
            ← Back
          </button>
          <div className={styles.titleSection}>
            <h2>{setTitle}</h2>
            <p>{flashcards.length} cards</p>
          </div>
        </div>
        
        <div className={styles.headerActions}>
          <button 
            className={styles.createButton}
            onClick={() => setIsEditorOpen(true)}
          >
            + Add Card
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className={styles.cardsList}>
        {flashcards.map((card) => {
          const stateBadge = getStateBadge(card.state)
          
          return (
            <div key={card.id} className={styles.cardItem}>
              
              <div className={styles.cardContent}>
                <div className={styles.cardQuestion}>
                  {card.question}
                </div>
                <div className={styles.cardAnswer}>
                  {card.answer}
                </div>
                
                {card.hint && (
                  <div className={styles.cardHint}>
                    💡 {card.hint}
                  </div>
                )}
                
                {card.tags && card.tags.length > 0 && (
                  <div className={styles.cardTags}>
                    {card.tags.map(tag => (
                      <span key={tag} className={styles.tag}>#{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.cardStats}>
                <div className={`${styles.stateBadge} ${stateBadge.className}`}>
                  {stateBadge.label}
                </div>
                <div className={styles.cardMeta}>
                  <span>Reps: {card.reps}</span>
                  <span>Success: {Math.round(card.success_rate * 100)}%</span>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button 
                  className={styles.deleteButton}
                  onClick={() => handleDeleteCard(card.id)}
                  title="Delete card"
                >
                  🗑️
                </button>
              </div>

            </div>
          )
        })}

        {flashcards.length === 0 && !loading && (
          <div className={styles.emptyState}>
            <p>No cards in this set yet</p>
            <button 
              className={styles.createFirstCard}
              onClick={() => setIsEditorOpen(true)}
            >
              Create your first card
            </button>
          </div>
        )}

      </div>

      <FlashcardEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleCreateCard}
        setId={setId}
        isLoading={isCreating}
      />

    </div>
  )
}

export default FlashcardsList
