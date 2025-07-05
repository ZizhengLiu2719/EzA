import { motion } from 'framer-motion';
import { ArrowLeft, BarChart, BookOpen, BrainCircuit, CheckCircle, Cpu, FileUp, FlaskConical, Mic, Star, Users, Zap } from 'lucide-react';
import React, { useState } from 'react';
import styles from './SubscriptionRedesign.module.css';

// Define the structure for a plan
interface Plan {
  name: string;
  price: string;
  pricePeriod: string;
  description: string;
  features: { name: string; icon: React.ElementType }[];
  usage: { name: string; limit: string; icon: React.ElementType }[];
  isPopular?: boolean;
  ctaText: string;
  theme: 'dark' | 'blue' | 'purple';
}

// Restructured and detailed subscription plans based on project knowledge
const plans: { [key: string]: Plan } = {
  free: {
    name: 'Explorer',
    price: '$0',
    pricePeriod: '/ forever',
    description: 'Get a feel for the EzA platform with basic AI assistance.',
    features: [
      { name: 'Basic AI Chat (Standard Responses)', icon: Mic },
      { name: '2 Course Uploads (PDF/DOCX/TXT)', icon: FileUp },
      { name: 'Manual Flashcard Creation', icon: BookOpen },
      { name: 'Standard Study Modes (Learn & Test)', icon: BrainCircuit },
    ],
    usage: [],
    ctaText: 'Current Plan',
    theme: 'dark',
  },
  pro: {
    name: 'Adept',
    price: '$9.99',
    pricePeriod: '/ month',
    description: 'Unlock the full suite of AI-powered learning tools for serious students.',
    isPopular: true,
    features: [
      { name: 'All Explorer features, plus:', icon: CheckCircle },
      { name: 'Advanced AI Chat (GPT-4o Streaming)', icon: Zap },
      { name: 'Full "Review & Exam Prep" Module', icon: Star },
      { name: 'AI-Powered Flashcard Generation', icon: Cpu },
      { name: '6 Advanced Study & Game Modes', icon: BrainCircuit },
      { name: 'STEM Problem Solver (Image & LaTeX)', icon: FlaskConical },
      { name: 'AI-Driven Exam Generator', icon: BarChart },
      { name: 'In-depth Learning Analytics', icon: BarChart },
    ],
    usage: [
      { name: '100 AI Conversations', limit: '/month', icon: Mic },
      { name: '20 Course Uploads', limit: '/month', icon: FileUp },
    ],
    ctaText: 'Upgrade to Adept',
    theme: 'blue',
  },
  ultimate: {
    name: 'Master',
    price: '$19.99',
    pricePeriod: '/ month',
    description: 'For power users who demand the best and want to shape the future of learning.',
    features: [
      { name: 'All Adept features, plus:', icon: CheckCircle },
      { name: 'Highest-Priority AI Processing', icon: Zap },
      { name: 'Unlimited Everything', icon: Zap },
      { name: 'Access to "Professor Mode" in Exams', icon: Users },
      { name: 'Early Access to Beta Features (e.g., Quiz Battle)', icon: FlaskConical },
    ],
    usage: [],
    ctaText: 'Upgrade to Master',
    theme: 'purple',
  },
};

// Mock usage data
const currentUsage = {
  aiConversations: 15,
  aiConversationsLimit: 50,
  courseUploads: 2,
  courseUploadsLimit: 5,
};

const SubscriptionRedesign: React.FC = () => {
  const [currentPlan] = useState<'free' | 'pro' | 'ultimate'>('free');

  const getThemeStyles = (theme: 'dark' | 'blue' | 'purple') => {
    if (theme === 'blue') return styles.blueTheme;
    if (theme === 'purple') return styles.purpleTheme;
    return styles.darkTheme;
  };

  const ProgressBar: React.FC<{ value: number; max: number; theme: 'blue' | 'purple' }> = ({ value, max, theme }) => {
    const percentage = (value / max) * 100;
    return (
      <div className={styles.progressBar}>
        <motion.div
          className={`${styles.progressFill} ${theme === 'blue' ? styles.progressFillBlue : styles.progressFillPurple}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton}>
          <ArrowLeft size={18} /> RETURN TO MAIN
        </button>
        <div className={styles.titleContainer}>
          <Zap className={styles.titleIcon} />
          <h1>Subscription Plans</h1>
        </div>
        <p className={styles.subtitle}>Unlock your full academic potential. Choose the plan that's right for you.</p>
      </header>

      {/* Current Usage Section */}
      <motion.section 
        className={styles.currentUsageSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2>This Month's Usage</h2>
        <div className={styles.usageGrid}>
          <div className={styles.usageStat}>
            <div className={styles.usageInfo}>
              <Mic size={16} />
              <span>AI Conversations</span>
            </div>
            <div className={styles.usageBar}>
              <ProgressBar value={currentUsage.aiConversations} max={currentUsage.aiConversationsLimit} theme="blue" />
            </div>
            <span className={styles.usageLimit}>{currentUsage.aiConversations} / {currentUsage.aiConversationsLimit}</span>
          </div>
          <div className={styles.usageStat}>
            <div className={styles.usageInfo}>
              <FileUp size={16} />
              <span>Course Uploads</span>
            </div>
            <div className={styles.usageBar}>
              <ProgressBar value={currentUsage.courseUploads} max={currentUsage.courseUploadsLimit} theme="purple" />
            </div>
            <span className={styles.usageLimit}>{currentUsage.courseUploads} / {currentUsage.courseUploadsLimit}</span>
          </div>
        </div>
      </motion.section>

      {/* Pricing Plans Section */}
      <main className={styles.plansGrid}>
        {Object.values(plans).map((plan, index) => (
          <motion.div
            key={plan.name}
            className={`${styles.planCard} ${getThemeStyles(plan.theme)} ${plan.isPopular ? styles.popular : ''}`}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
          >
            {plan.isPopular && (
              <div className={styles.popularBadge}>
                <Star size={14} /> MOST POPULAR
              </div>
            )}
            <div className={styles.planHeader}>
              <h3>{plan.name}</h3>
              <p className={styles.planPrice}>
                {plan.price}
                <span className={styles.planPricePeriod}>{plan.pricePeriod}</span>
              </p>
              <p className={styles.planDescription}>{plan.description}</p>
            </div>

            <div className={styles.featuresList}>
              <h4>Features</h4>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature.name}>
                    <feature.icon size={16} className={styles.featureIcon} />
                    <span>{feature.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            {plan.usage.length > 0 && (
              <div className={styles.usageList}>
                <h4>Monthly Usage</h4>
                <ul>
                  {plan.usage.map((item) => (
                    <li key={item.name}>
                       <item.icon size={16} className={styles.featureIcon} />
                      <span>{item.name}: <strong>{item.limit}</strong></span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`${styles.ctaButton} ${currentPlan === plan.name.toLowerCase() ? styles.currentCta : ''}`}
              disabled={currentPlan === plan.name.toLowerCase()}
            >
              {plan.ctaText}
            </motion.button>
          </motion.div>
        ))}
      </main>
    </div>
  );
};

export default SubscriptionRedesign; 