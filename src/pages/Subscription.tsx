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
    console.log(`升级到 ${plan} 计划`)
    alert(`即将升级到 ${SUBSCRIPTION_PLANS[plan].name}`)
  }

  const handleManageSubscription = () => {
    // 这里应该跳转到订阅管理页面
    alert('跳转到订阅管理页面')
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>加载中...</div>
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
          ← 返回主界面
        </button>
        <h1 className={styles.title}>订阅计划</h1>
      </div>

      {/* 当前订阅状态 */}
      {currentPlan && (
        <div className={styles.currentPlan}>
          <div className={styles.currentPlanHeader}>
            <h2>当前订阅</h2>
            <span className={`${styles.planBadge} ${styles[currentSubscription!.plan]}`}>
              {currentPlan.name}
            </span>
          </div>
          
          <div className={styles.currentPlanDetails}>
            <div className={styles.planInfo}>
              <p className={styles.planDescription}>{currentPlan.description}</p>
              <p className={styles.planPrice}>
                {currentPlan.price === 0 ? '免费' : `$${currentPlan.price}/月`}
              </p>
            </div>

            {/* 使用统计 */}
            {usageStats && (
              <div className={styles.usageStats}>
                <h3>本月使用情况</h3>
                <div className={styles.usageItems}>
                  <div className={styles.usageItem}>
                    <span>AI对话</span>
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
                    <span>课程上传</span>
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
              <h3>包含功能</h3>
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
                管理订阅
              </button>
            )}
          </div>
        </div>
      )}

      {/* 可用计划 */}
      <div className={styles.availablePlans}>
        <h2>可用计划</h2>
        <div className={styles.plansGrid}>
          {Object.entries(SUBSCRIPTION_PLANS).map(([planKey, plan]) => (
            <div 
              key={planKey} 
              className={`${styles.planCard} ${currentSubscription?.plan === planKey ? styles.currentPlanCard : ''}`}
            >
              <div className={styles.planHeader}>
                <h3>{plan.name}</h3>
                <div className={styles.planPrice}>
                  {plan.price === 0 ? '免费' : `$${plan.price}/月`}
                </div>
              </div>

              <div className={styles.planDescription}>
                {plan.description}
              </div>

              <div className={styles.planFeatures}>
                <h4>包含功能</h4>
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
                  <span>AI对话:</span>
                  <span>{plan.monthlyConversations === -1 ? '无限' : `${plan.monthlyConversations}次/月`}</span>
                </div>
                <div className={styles.limitItem}>
                  <span>课程上传:</span>
                  <span>{plan.monthlyCourses === -1 ? '无限' : `${plan.monthlyCourses}个/月`}</span>
                </div>
                <div className={styles.limitItem}>
                  <span>AI模型:</span>
                  <span>{plan.aiModel === 'gpt-4o' ? 'GPT-4o' : 'GPT-3.5 Turbo'}</span>
                </div>
              </div>

              <button 
                className={`${styles.upgradeButton} ${currentSubscription?.plan === planKey ? styles.currentPlanButton : ''}`}
                onClick={() => handleUpgrade(planKey as SubscriptionPlan)}
                disabled={currentSubscription?.plan === planKey}
              >
                {currentSubscription?.plan === planKey ? '当前计划' : 
                 currentSubscription?.plan === 'free' ? '升级' : '切换计划'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Subscription 