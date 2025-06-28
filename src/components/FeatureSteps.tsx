import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './FeatureSteps.module.css';

const steps = [
  {
    icon: '📚',
    title: 'Course Import Center',
    description: 'Upload syllabus, textbooks, lecture notes, master entire semester structure in 1 minute',
    link: '/upload',
    level: 'LVL 1',
    xp: 100
  },
  {
    icon: '📖',
    title: 'Semester Overview',
    description: 'View and manage all uploaded courses for the current semester with real-time tracking',
    link: '/courses',
    level: 'LVL 2',
    xp: 85
  },
  {
    icon: '🎯',
    title: 'Smart Task Engine',
    description: 'Automatically generate learning path maps, subtask breakdown, calendar sync with AI precision',
    level: 'LVL 3',
    xp: 95
  },
  {
    icon: '🤖',
    title: 'AI Learning Assistant',
    description: 'Writing guidance, STEM problem solving, reading summaries, comprehensive AI tutoring',
    level: 'LVL 4',
    xp: 90
  },
  {
    icon: '📊',
    title: 'Weekly Feedback Coach',
    description: 'Task completion rate analysis, procrastination index, personalized recommendations',
    level: 'LVL 5',
    xp: 75
  },
  {
    icon: '🧠',
    title: 'Review & Exam Prep',
    description: 'Automatically generate review cards, practice questions, error tracking for exam success',
    level: 'LVL 6',
    xp: 80
  }
]

const FeatureSteps = () => {
  useEffect(() => {
    setTimeout(() => {
    }, 100);
  }, []);

  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>Core Features 🎮</h2>
          <p className={styles.subtitle}>
            From course import to exam preparation - level up your learning game with AI-powered modules!
            <br />
            Six powerful features designed to transform your academic experience 🚀
          </p>
        </div>
        <div className={styles.stepsGrid}>
          {steps.map((step, index) => {
            const stepContent = (
              <>
                {/* XP Level Indicator */}
                <div className={styles.levelIndicator}>{step.level}</div>
                
                {/* Gaming-Style Icon */}
                <div className={styles.stepIcon}>{step.icon}</div>
                
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
                
                {/* Progress Bar */}
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ transform: `translateX(-${100 - step.xp}%)` }}
                  />
                </div>
              </>
            );

            return step.link ? (
              <Link 
                to={step.link} 
                key={index + '-' + step.title} 
                className={styles.step} 
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                {stepContent}
              </Link>
            ) : (
              <div key={index + '-' + step.title} className={styles.step}>
                {stepContent}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  )
}

export default FeatureSteps