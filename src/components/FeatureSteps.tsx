import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './FeatureSteps.module.css';

const steps = [
  {
    icon: '📚',
    title: 'Course Import Center',
    description: 'Upload syllabus, textbooks, lecture notes, master entire semester structure in 1 minute',
    link: '/upload'
  },
  {
    icon: '📖',
    title: 'Current Semester Course Overview',
    description: 'View and manage all uploaded courses for the current semester',
    link: '/courses'
  },
  {
    icon: '📅',
    title: 'Smart Task Engine',
    description: 'Automatically generate learning path maps, subtask breakdown, calendar sync'
  },
  {
    icon: '🤖',
    title: 'AI Learning Assistant',
    description: 'Writing guidance, STEM problem solving, reading summaries, comprehensive AI tutoring'
  },
  {
    icon: '📊',
    title: 'Weekly Feedback Coach',
    description: 'Task completion rate analysis, procrastination index, personalized recommendations'
  },
  {
    icon: '🧠',
    title: 'Review & Exam Preparation',
    description: 'Automatically generate review cards, practice questions, error tracking'
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
          <h2 className={styles.title}>EzA Core Modules</h2>
          <p className={styles.subtitle}>
            From course import to exam preparation, a comprehensive AI-powered learning solution
          </p>
        </div>
        <div className={styles.stepsGrid}>
          {steps.map((step, index) => {
            return step.link ? (
              <Link to={step.link} key={index + '-' + step.title} className={styles.step} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className={styles.stepIcon}>{step.icon}</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDescription}>{step.description}</p>
                </div>
              </Link>
            ) : (
              <div key={index + '-' + step.title} className={styles.step}>
                <div className={styles.stepIcon}>{step.icon}</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDescription}>{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  )
}

export default FeatureSteps