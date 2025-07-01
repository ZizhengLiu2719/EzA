import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './BackToDashboardButton.module.css';

const BackToDashboardButton: React.FC = () => {
  const navigate = useNavigate();
  return (
    <button className={styles.backButton} onClick={() => navigate('/dashboard')}>
      <div className={styles.iconWrapper}>
        <span className={styles.icon}>🏠</span>
      </div>
      <span className={styles.text}>Return to Main</span>
    </button>
  );
};

export default BackToDashboardButton; 