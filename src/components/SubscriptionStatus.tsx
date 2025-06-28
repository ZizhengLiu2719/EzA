import React from 'react'
import { Link } from 'react-router-dom'
import { SUBSCRIPTION_PLANS } from '../config/subscription'
import { SubscriptionPlan } from '../types'
import styles from './SubscriptionStatus.module.css'

interface SubscriptionStatusProps {
  currentPlan: SubscriptionPlan
  usageStats?: {
    monthly_conversations_used: number
    monthly_courses_used: number
    monthly_conversations_limit: number
    monthly_courses_limit: number
  }
  showUpgradeButton?: boolean
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  currentPlan,
  usageStats,
  showUpgradeButton = true
}) => {
  const plan = SUBSCRIPTION_PLANS[currentPlan]

  if (!plan) return null

  const isFreePlan = currentPlan === 'free'
  const hasConversationQuota = usageStats ? 
    (usageStats.monthly_conversations_limit === -1 || 
     usageStats.monthly_conversations_used < usageStats.monthly_conversations_limit) : true

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>订阅状态</h3>
        <span className={`${styles.planBadge} ${styles[currentPlan]}`}>
          {plan.name}
        </span>
      </div>

      <div className={styles.content}>
        <div className={styles.planInfo}>
          <p className={styles.planDescription}>{plan.description}</p>
          <p className={styles.planPrice}>
            {plan.price === 0 ? '免费' : `$${plan.price}/月`}
          </p>
        </div>

        {/* 使用统计 */}
        {usageStats && isFreePlan && (
          <div className={styles.usageStats}>
            <div className={styles.usageItem}>
              <span>AI对话</span>
              <span>
                {usageStats.monthly_conversations_used} / 
                {usageStats.monthly_conversations_limit === -1 ? '∞' : usageStats.monthly_conversations_limit}
              </span>
              <div className={styles.progressBar}>
                <div 
                  className={`${styles.progressFill} ${!hasConversationQuota ? styles.overLimit : ''}`}
                  style={{
                    width: `${usageStats.monthly_conversations_limit === -1 ? 0 : 
                      Math.min((usageStats.monthly_conversations_used / usageStats.monthly_conversations_limit) * 100, 100)}%`
                  }}
                />
              </div>
            </div>
            <div className={styles.usageItem}>
              <span>课程上传</span>
              <span>
                {usageStats.monthly_courses_used} / 
                {usageStats.monthly_courses_limit === -1 ? '∞' : usageStats.monthly_courses_limit}
              </span>
            </div>
          </div>
        )}

        {/* 升级按钮 */}
        {showUpgradeButton && currentPlan !== 'elite' && (
          <Link to="/subscription" className={styles.upgradeButton}>
            {currentPlan === 'free' ? '升级到Pro' : '升级到Elite'}
          </Link>
        )}

        {/* 配额不足警告 */}
        {isFreePlan && !hasConversationQuota && (
          <div className={styles.warning}>
            <span>⚠️ 本月AI对话配额已用完，请升级到Pro版继续使用</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default SubscriptionStatus 