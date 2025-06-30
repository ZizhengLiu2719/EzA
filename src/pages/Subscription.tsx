import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SUBSCRIPTION_PLANS } from '../config/subscription'
import { SubscriptionPlan, UsageStats, UserSubscription } from '../types'
import styles from './Subscription.module.css'

const Subscription: React.FC = () => {
  const navigate = useNavigate()
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null)
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模拟获取用户订阅信息
    // 这里应该调用实际的API
    const mockSubscription: UserSubscription = {
      id: '1',
      user_id: 'user123',
      plan: 'free',
      status: 'active',
      current_period_start: '2024-01-01',
      current_period_end: '2024-02-01',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }

    const mockUsageStats: UsageStats = {
      monthly_conversations_used: 15,
      monthly_courses_used: 2,
      monthly_conversations_limit: 50,
      monthly_courses_limit: 5
    }

    setCurrentSubscription(mockSubscription)
    setUsageStats(mockUsageStats)
    setLoading(false)
  }, [])

  const handleUpgrade = (plan: SubscriptionPlan) => {
    // 这里应该跳转到支付页面或处理升级逻辑
    console.log(`Upgrade to ${plan} plan`)
    alert(`About to upgrade to ${SUBSCRIPTION_PLANS[plan].name}`)
  }

  const handleManageSubscription = () => {
    // 这里应该跳转到订阅管理页面
    alert('Redirect to subscription management page')
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  const currentPlan = currentSubscription ? SUBSCRIPTION_PLANS[currentSubscription.plan] : null

  return (
    <div className={styles.container}>
      {/* 返回按钮 */}
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/')}
        >
          ← Return to Main
        </button>
        <h1 className={styles.title}>Subscription Plans</h1>
      </div>

      {/* 当前订阅状态 */}
      {currentPlan && (
        <div className={styles.currentPlan}>
          <div className={styles.currentPlanHeader}>
            <h2>Current Subscription</h2>
            <span className={`${styles.planBadge} ${styles[currentSubscription!.plan]}`}>
              {currentPlan.name}
            </span>
          </div>
          
          <div className={styles.currentPlanDetails}>
            <div className={styles.planInfo}>
              <p className={styles.planDescription}>{currentPlan.description}</p>
              <p className={styles.planPrice}>
                {currentPlan.price === 0 ? 'Free' : `$${currentPlan.price}/month`}
              </p>
            </div>

            {/* 使用统计 */}
            {usageStats && (
              <div className={styles.usageStats}>
                <h3>This Month's Usage</h3>
                <div className={styles.usageItems}>
                  <div className={styles.usageItem}>
                    <span>AI Conversations</span>
                    <span>
                      {usageStats.monthly_conversations_used} / 
                      {usageStats.monthly_conversations_limit === -1 ? '∞' : usageStats.monthly_conversations_limit}
                    </span>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill}
                        style={{
                          width: `${usageStats.monthly_conversations_limit === -1 ? 0 : 
                            (usageStats.monthly_conversations_used / usageStats.monthly_conversations_limit) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className={styles.usageItem}>
                    <span>Course Uploads</span>
                    <span>
                      {usageStats.monthly_courses_used} / 
                      {usageStats.monthly_courses_limit === -1 ? '∞' : usageStats.monthly_courses_limit}
                    </span>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill}
                        style={{
                          width: `${usageStats.monthly_courses_limit === -1 ? 0 : 
                            (usageStats.monthly_courses_used / usageStats.monthly_courses_limit) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 功能列表 */}
            <div className={styles.features}>
              <h3>Included Features</h3>
              <ul className={styles.featureList}>
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className={styles.featureItem}>
                    <span className={styles.checkmark}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {currentSubscription!.plan !== 'free' && (
              <button 
                className={styles.manageButton}
                onClick={handleManageSubscription}
              >
                Manage Subscription
              </button>
            )}
          </div>
        </div>
      )}

      {/* 可用计划 */}
      <div className={styles.availablePlans}>
        <h2>Available Plans</h2>
        <div className={styles.plansGrid}>
          {Object.entries(SUBSCRIPTION_PLANS).map(([planKey, plan]) => (
            <div 
              key={planKey} 
              className={`${styles.planCard} ${currentSubscription?.plan === planKey ? styles.currentPlanCard : ''}`}
            >
              <div className={styles.planHeader}>
                <h3>{plan.name}</h3>
                <div className={styles.planPrice}>
                  {plan.price === 0 ? 'Free' : `$${plan.price}/month`}
                </div>
              </div>

              <div className={styles.planDescription}>
                {plan.description}
              </div>

              <div className={styles.planFeatures}>
                <h4>Included Features</h4>
                <ul>
                  {plan.features.map((feature, index) => (
                    <li key={index}>
                      <span className={styles.checkmark}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.planLimits}>
                <div className={styles.limitItem}>
                  <span>AI Conversations:</span>
                  <span>{plan.monthlyConversations === -1 ? 'Unlimited' : `${plan.monthlyConversations}/month`}</span>
                </div>
                <div className={styles.limitItem}>
                  <span>Course Uploads:</span>
                  <span>{plan.monthlyCourses === -1 ? 'Unlimited' : `${plan.monthlyCourses}/month`}</span>
                </div>
                <div className={styles.limitItem}>
                  <span>AI Model:</span>
                  <span>{plan.aiModel === 'gpt-4o' ? 'GPT-4o' : 'GPT-3.5 Turbo'}</span>
                </div>
              </div>

              {currentSubscription?.plan !== planKey && (
                <button 
                  className={styles.upgradeButton}
                  onClick={() => handleUpgrade(planKey as SubscriptionPlan)}
                >
                  {currentSubscription?.plan === 'free' ? 'Upgrade' : 'Switch Plan'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Subscription 