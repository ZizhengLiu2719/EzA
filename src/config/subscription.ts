import { SubscriptionConfig } from '../types'

// 订阅计划配置
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionConfig> = {
  free: {
    plan: 'free',
    name: 'Free Plan',
    price: 0,
    currency: 'USD',
    aiModel: 'gpt-4o-mini',
    monthlyConversations: 50,
    monthlyCourses: 5,
    features: [
      'Basic AI Learning Assistant',
      'Smart Task Engine',
      'Course Management',
      'Basic Feature Access'
    ],
    description: 'Suitable for new users wanting to experience EzA features'
  },
  pro: {
    plan: 'pro',
    name: 'Pro Plan',
    price: 4.99,
    currency: 'USD',
    aiModel: 'gpt-4o',
    monthlyConversations: -1, // 无限
    monthlyCourses: -1, // 无限
    features: [
      'Unlimited AI Conversations',
      'Unlimited Course Uploads',
      'All Basic Features',
      'Priority Customer Support',
      'Advanced Task Management',
      'Learning Progress Tracking'
    ],
    description: 'Suitable for serious students'
  },
  elite: {
    plan: 'elite',
    name: 'Elite Plan',
    price: 9.99,
    currency: 'USD',
    aiModel: 'gpt-4o',
    monthlyConversations: -1, // 无限
    monthlyCourses: -1, // 无限
    features: [
      'GPT-4o AI Model',
      'Unlimited AI Conversations',
      'Unlimited Course Uploads',
      'All Features + Advanced Features',
      'Priority Customer Support',
      'Personalized Learning Recommendations',
      'Advanced Analytics Reports',
      'Personalized Learning Paths'
    ],
    description: 'For elite students pursuing the best learning experience'
  }
}

// 获取订阅计划配置
export function getSubscriptionPlan(plan: string): SubscriptionConfig | null {
  return SUBSCRIPTION_PLANS[plan] || null
}

// 检查用户是否有权限使用特定AI模型
export function canUseAIModel(userPlan: string, targetModel: string): boolean {
  const plan = SUBSCRIPTION_PLANS[userPlan]
  if (!plan) return false
  
  return plan.aiModel === targetModel
}

// 检查用户是否还有对话配额
export function hasConversationQuota(userPlan: string, usedCount: number): boolean {
  const plan = SUBSCRIPTION_PLANS[userPlan]
  if (!plan) return false
  
  return plan.monthlyConversations === -1 || usedCount < plan.monthlyConversations
}

// 检查用户是否还有课程上传配额
export function hasCourseQuota(userPlan: string, usedCount: number): boolean {
  const plan = SUBSCRIPTION_PLANS[userPlan]
  if (!plan) return false
  
  return plan.monthlyCourses === -1 || usedCount < plan.monthlyCourses
}

// 获取用户可用的AI模型
export function getAvailableAIModel(userPlan: string): string {
  const plan = SUBSCRIPTION_PLANS[userPlan]
  return plan?.aiModel || 'gpt-4o-mini'
} 