import BackToDashboardButton from '@/components/BackToDashboardButton'
import { useState } from 'react'
import styles from './Review.module.css'

const Review = () => {
  const [selectedCourse, setSelectedCourse] = useState('')
  const [reviewType, setReviewType] = useState('flashcards')

  const courses = [
    { id: '1', name: 'Introduction to History', progress: 75 },
    { id: '2', name: 'Advanced Mathematics', progress: 60 },
    { id: '3', name: 'Psychology Fundamentals', progress: 90 }
  ]

  const reviewTypes = [
    { id: 'flashcards', name: 'Review Cards', icon: '🧠' },
    { id: 'quiz', name: 'Practice Quiz', icon: '📝' },
    { id: 'summary', name: 'Knowledge Summary', icon: '📋' }
  ]

  const flashcards = [
    {
      id: '1',
      question: 'What is the Renaissance?',
      answer: 'The Renaissance was a cultural movement in Europe from the 14th to 17th centuries, emphasizing humanism, revival of classical culture, and artistic innovation.',
      category: 'Introduction to History'
    },
    {
      id: '2',
      question: 'What is the fundamental theorem of calculus?',
      answer: 'The fundamental theorem of calculus establishes the connection between differentiation and integration, showing that integration is the inverse operation of differentiation.',
      category: 'Advanced Mathematics'
    }
  ]

  return (
    <div className={styles.review} style={{ position: 'relative' }}>
      <BackToDashboardButton />
      <div className="container">
        <div className={styles.header}>
          <h1>Review & Exam Preparation</h1>
          <p>Intelligently generate review materials to help you prepare efficiently</p>
        </div>
        
        <div className={styles.reviewContent}>
          <div className={styles.sidebar}>
            <div className={styles.courseSection}>
              <h3>Select Course</h3>
              <div className={styles.courseList}>
                {courses.map((course) => (
                  <div 
                    key={course.id}
                    className={`${styles.courseItem} ${selectedCourse === course.id ? styles.selected : ''}`}
                    onClick={() => setSelectedCourse(course.id)}
                  >
                    <div className={styles.courseInfo}>
                      <span className={styles.courseName}>{course.name}</span>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill} 
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                      <span className={styles.progressText}>{course.progress}% Complete</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.typeSection}>
              <h3>Review Type</h3>
              <div className={styles.typeList}>
                {reviewTypes.map((type) => (
                  <div 
                    key={type.id}
                    className={`${styles.typeItem} ${reviewType === type.id ? styles.selected : ''}`}
                    onClick={() => setReviewType(type.id)}
                  >
                    <span className={styles.typeIcon}>{type.icon}</span>
                    <span className={styles.typeName}>{type.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className={styles.mainContent}>
            {reviewType === 'flashcards' && (
              <div className={styles.flashcardsView}>
                <div className={styles.flashcardsHeader}>
                  <h2>Review Cards</h2>
                  <button className="btn btn-primary">Generate New Cards</button>
                </div>
                
                <div className={styles.flashcardsGrid}>
                  {flashcards.map((card) => (
                    <div key={card.id} className={styles.flashcard}>
                      <div className={styles.cardHeader}>
                        <span className={styles.cardCategory}>{card.category}</span>
                      </div>
                      <div className={styles.cardContent}>
                        <h4 className={styles.cardQuestion}>{card.question}</h4>
                        <p className={styles.cardAnswer}>{card.answer}</p>
                      </div>
                      <div className={styles.cardActions}>
                        <button className="btn btn-secondary">Mark as Mastered</button>
                        <button className="btn btn-secondary">Need Review</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {reviewType === 'quiz' && (
              <div className={styles.quizView}>
                <h2>Practice Quiz</h2>
                <p>AI-generated personalized quiz questions</p>
                <button className="btn btn-primary">Start Quiz</button>
              </div>
            )}
            
            {reviewType === 'summary' && (
              <div className={styles.summaryView}>
                <h2>Knowledge Summary</h2>
                <p>Course key content summary</p>
                <button className="btn btn-primary">Generate Summary</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Review 