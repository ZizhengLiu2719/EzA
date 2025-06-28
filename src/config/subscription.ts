import { SubscriptionConfig } from '../types'

// 订阅计划配置
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionConfig> = {
  free: {
    plan: 'free',
    name: '免费版',
    price: 0,
    currency: 'USD',
    aiModel: 'gpt-3.5-turbo',
    monthlyConversations: 50,
    monthlyCourses: 5,
    features: [
      '基础AI学习助理',
      '智能任务引擎',
      '课程管理',
      '基础功能访问'
    ],
    description: '适合想要体验EzA功能的新用户'
  },
  pro: {
    plan: 'pro',
    name: 'Pro版',
    price: 4.99,
    currency: 'USD',
    aiModel: 'gpt-3.5-turbo',
    monthlyConversations: -1, // 无限
    monthlyCourses: -1, // 无限
    features: [
      '无限AI对话',
      '无限课程上传',
      '所有基础功能',
      '优先客服支持',
      '高级任务管理',
      '学习进度追踪'
    ],
    description: '适合认真学习的学生'
  },
  elite: {
    plan: 'elite',
    name: 'Elite版',
    price: 9.99,
    currency: 'USD',
    aiModel: 'gpt-4o',
    monthlyConversations: -1, // 无限
    monthlyCourses: -1, // 无限
    features: [
      'GPT-4o AI模型',
      '无限AI对话',
      '无限课程上传',
      '所有功能 + 高级功能',
      '优先客服支持',
      '专属学习建议',
      '高级分析报告',
      '个性化学习路径'
    ],
    description: '追求最佳学习体验的精英学生'
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
  return plan?.aiModel || 'gpt-3.5-turbo'
} 