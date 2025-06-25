import { useState } from 'react'
import styles from './Review.module.css'

const Review = () => {
  const [selectedCourse, setSelectedCourse] = useState('')
  const [reviewType, setReviewType] = useState('flashcards')

  const courses = [
    { id: '1', name: '历史学概论', progress: 75 },
    { id: '2', name: '高等数学', progress: 60 },
    { id: '3', name: '心理学基础', progress: 90 }
  ]

  const reviewTypes = [
    { id: 'flashcards', name: '复习卡片', icon: '🧠' },
    { id: 'quiz', name: '模拟测验', icon: '📝' },
    { id: 'summary', name: '知识总结', icon: '📋' }
  ]

  const flashcards = [
    {
      id: '1',
      question: '什么是文艺复兴？',
      answer: '文艺复兴是14-17世纪欧洲的一场文化运动，强调人文主义、古典文化的复兴和艺术创新。',
      category: '历史学概论'
    },
    {
      id: '2',
      question: '微积分的基本定理是什么？',
      answer: '微积分基本定理建立了微分和积分之间的联系，表明积分是微分的逆运算。',
      category: '高等数学'
    }
  ]

  return (
    <div className={styles.review}>
      <div className="container">
        <div className={styles.header}>
          <h1>复习与考试准备</h1>
          <p>智能生成复习材料，助你高效备考</p>
        </div>
        
        <div className={styles.reviewContent}>
          <div className={styles.sidebar}>
            <div className={styles.courseSection}>
              <h3>选择课程</h3>
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
                      <span className={styles.progressText}>{course.progress}% 完成</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.typeSection}>
              <h3>复习类型</h3>
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
                  <h2>复习卡片</h2>
                  <button className="btn btn-primary">生成新卡片</button>
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
                        <button className="btn btn-secondary">标记已掌握</button>
                        <button className="btn btn-secondary">需要复习</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {reviewType === 'quiz' && (
              <div className={styles.quizView}>
                <h2>模拟测验</h2>
                <p>AI生成的个性化测验题目</p>
                <button className="btn btn-primary">开始测验</button>
              </div>
            )}
            
            {reviewType === 'summary' && (
              <div className={styles.summaryView}>
                <h2>知识总结</h2>
                <p>课程重点内容汇总</p>
                <button className="btn btn-primary">生成总结</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Review 