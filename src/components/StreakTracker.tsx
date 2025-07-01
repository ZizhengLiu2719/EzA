/**
 * 连续学习追踪组件
 * 显示学习连续天数、里程碑和激励信息
 */

import { AnimatePresence, motion } from 'framer-motion'
import {
    Award,
    CheckCircle,
    Clock,
    Flame,
    Gift,
    Star,
    Target,
    TrendingUp,
    Trophy
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { StudyStreak } from '../types'

interface StreakTrackerProps {
  streakData: StudyStreak
  onMilestoneReward?: (milestone: number) => void
  compact?: boolean
  showHistory?: boolean
  className?: string
}

interface StreakMilestone {
  days: number
  title: string
  description: string
  reward: string
  icon: React.ComponentType<any>
  color: string
  bgColor: string
}

const StreakTracker: React.FC<StreakTrackerProps> = ({
  streakData,
  onMilestoneReward,
  compact = false,
  showHistory = true,
  className = ''
}) => {
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [recentMilestone, setRecentMilestone] = useState<StreakMilestone | null>(null)
  const [todayStudied, setTodayStudied] = useState(false)

  // 连击里程碑配置
  const milestones: StreakMilestone[] = [
    {
      days: 3,
      title: '初露锋芒',
      description: '连续学习3天',
      reward: '+50 XP',
      icon: Flame,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100'
    },
    {
      days: 7,
      title: '坚持不懈',
      description: '连续学习一周',
      reward: '+100 XP + 学习徽章',
      icon: Award,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100'
    },
    {
      days: 14,
      title: '学习专家',
      description: '连续学习两周',
      reward: '+200 XP + 专家称号',
      icon: Star,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100'
    },
    {
      days: 30,
      title: '月度冠军',
      description: '连续学习一个月',
      reward: '+500 XP + 特殊徽章',
      icon: Trophy,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100'
    },
    {
      days: 60,
      title: '学习大师',
      description: '连续学习两个月',
      reward: '+1000 XP + 大师称号',
      icon: Crown,
      color: 'text-green-500',
      bgColor: 'bg-green-100'
    },
    {
      days: 100,
      title: '百日传奇',
      description: '连续学习100天',
      reward: '+2000 XP + 传奇徽章',
      icon: TrendingUp,
      color: 'text-red-500',
      bgColor: 'bg-red-100'
    }
  ]

  // 检查是否今天已学习
  useEffect(() => {
    const today = new Date()
    const lastStudyDate = new Date(streakData.last_study_date)
    
    // 检查最后学习日期是否是今天
    const isToday = today.toDateString() === lastStudyDate.toDateString()
    setTodayStudied(isToday)
  }, [streakData.last_study_date])

  // 检查里程碑奖励
  useEffect(() => {
    const unclaimedMilestone = streakData.streak_milestones.find(
      m => m.days <= streakData.current_streak && !m.reward_claimed
    )
    
    if (unclaimedMilestone) {
      const milestone = milestones.find(m => m.days === unclaimedMilestone.days)
      if (milestone) {
        setRecentMilestone(milestone)
        setShowMilestoneModal(true)
      }
    }
  }, [streakData.current_streak, streakData.streak_milestones])

  // 获取下一个里程碑
  const getNextMilestone = () => {
    return milestones.find(m => m.days > streakData.current_streak)
  }

  // 获取连击状态颜色
  const getStreakColor = (streak: number) => {
    if (streak === 0) return 'text-gray-500'
    if (streak < 7) return 'text-orange-500'
    if (streak < 30) return 'text-blue-500'
    if (streak < 100) return 'text-purple-500'
    return 'text-yellow-500'
  }

  // 获取连击火焰强度
  const getFlameIntensity = (streak: number) => {
    if (streak === 0) return 0
    if (streak < 7) return 1
    if (streak < 30) return 2
    if (streak < 100) return 3
    return 4
  }

  // 处理里程碑奖励领取
  const handleClaimMilestone = () => {
    if (recentMilestone) {
      onMilestoneReward?.(recentMilestone.days)
      setShowMilestoneModal(false)
      setRecentMilestone(null)
    }
  }

  const nextMilestone = getNextMilestone()
  const flameIntensity = getFlameIntensity(streakData.current_streak)
  const streakColor = getStreakColor(streakData.current_streak)

  // 紧凑模式渲染
  if (compact) {
    return (
      <div className={`streak-tracker-compact flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          <motion.div
            animate={todayStudied ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Flame className={`w-5 h-5 ${streakColor}`} />
          </motion.div>
          <span className="font-bold text-gray-800">{streakData.current_streak}</span>
          <span className="text-sm text-gray-500">天</span>
        </div>

        {nextMilestone && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Target className="w-3 h-3" />
            {nextMilestone.days - streakData.current_streak} 天后达成
          </div>
        )}

        {/* 状态指示器 */}
        <div className={`w-2 h-2 rounded-full ${
          todayStudied ? 'bg-green-500' : 'bg-gray-300'
        }`} />
      </div>
    )
  }

  return (
    <div className={`streak-tracker ${className}`}>
      {/* 主连击显示 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">学习连击</h3>
          <div className="flex items-center gap-2">
            {todayStudied ? (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                今日已学习
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-500 text-sm">
                <Clock className="w-4 h-4" />
                今日待学习
              </div>
            )}
          </div>
        </div>

        {/* 连击数显示 */}
        <div className="text-center mb-6">
          <motion.div
            animate={todayStudied ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative inline-block"
          >
            {/* 火焰图标 */}
            <div className="relative">
              <Flame className={`w-16 h-16 mx-auto ${streakColor}`} />
              
              {/* 强度效果 */}
              {flameIntensity > 1 && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0"
                >
                  <Flame className={`w-16 h-16 ${streakColor} opacity-50`} />
                </motion.div>
              )}
              
              {flameIntensity > 2 && (
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0"
                >
                  <Flame className={`w-16 h-16 ${streakColor} opacity-30`} />
                </motion.div>
              )}
            </div>

            {/* 连击数字 */}
            <div className="mt-2">
              <div className={`text-4xl font-bold ${streakColor}`}>
                {streakData.current_streak}
              </div>
              <div className="text-gray-600">连续天数</div>
            </div>
          </motion.div>

          {/* 最佳记录 */}
          {streakData.longest_streak > streakData.current_streak && (
            <div className="mt-3 text-sm text-gray-500">
              个人最佳: {streakData.longest_streak} 天
            </div>
          )}
        </div>

        {/* 下一个里程碑 */}
        {nextMilestone && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">下一个里程碑</span>
              <span className="text-xs text-gray-500">
                还需 {nextMilestone.days - streakData.current_streak} 天
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${nextMilestone.bgColor} flex items-center justify-center`}>
                <nextMilestone.icon className={`w-5 h-5 ${nextMilestone.color}`} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">{nextMilestone.title}</div>
                <div className="text-sm text-gray-600">{nextMilestone.description}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800">{nextMilestone.reward}</div>
              </div>
            </div>

            {/* 进度条 */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500">进度</span>
                <span className="text-xs text-gray-500">
                  {((streakData.current_streak / nextMilestone.days) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(streakData.current_streak / nextMilestone.days) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 已获得的里程碑 */}
        {showHistory && streakData.streak_milestones.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              已达成里程碑
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {streakData.streak_milestones
                .sort((a, b) => b.days - a.days)
                .slice(0, 6)
                .map((milestone, index) => {
                  const milestoneInfo = milestones.find(m => m.days === milestone.days)
                  if (!milestoneInfo) return null

                  return (
                    <motion.div
                      key={milestone.days}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative p-3 rounded-lg border-2 ${
                        milestone.reward_claimed
                          ? `${milestoneInfo.bgColor} border-transparent`
                          : 'bg-yellow-50 border-yellow-300 border-dashed'
                      }`}
                    >
                      <div className="text-center">
                        <milestoneInfo.icon className={`w-6 h-6 mx-auto mb-1 ${milestoneInfo.color}`} />
                        <div className="text-xs font-medium text-gray-800">
                          {milestone.days}天
                        </div>
                        <div className="text-xs text-gray-600">
                          {milestoneInfo.title}
                        </div>
                      </div>

                      {/* 已领取标记 */}
                      {milestone.reward_claimed && (
                        <div className="absolute -top-1 -right-1">
                          <CheckCircle className="w-4 h-4 text-green-500 bg-white rounded-full" />
                        </div>
                      )}

                      {/* 待领取闪烁效果 */}
                      {!milestone.reward_claimed && (
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute inset-0 bg-yellow-200 rounded-lg pointer-events-none"
                        />
                      )}
                    </motion.div>
                  )
                })}
            </div>
          </div>
        )}
      </div>

      {/* 里程碑奖励模态框 */}
      <AnimatePresence>
        {showMilestoneModal && recentMilestone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowMilestoneModal(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 庆祝动画 */}
              <div className="relative mb-6">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 mx-auto"
                >
                  <div className={`w-full h-full rounded-full ${recentMilestone.bgColor} flex items-center justify-center`}>
                    <recentMilestone.icon className={`w-10 h-10 ${recentMilestone.color}`} />
                  </div>
                </motion.div>
                
                {/* 粒子效果 */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1, 0], 
                      opacity: [0, 1, 0],
                      x: Math.cos(i * 45 * Math.PI / 180) * 40,
                      y: Math.sin(i * 45 * Math.PI / 180) * 40
                    }}
                    transition={{ 
                      duration: 2, 
                      delay: i * 0.1, 
                      repeat: Infinity,
                      repeatDelay: 2
                    }}
                    className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full"
                  />
                ))}
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">里程碑达成！</h2>
              <p className={`text-lg font-medium ${recentMilestone.color} mb-4`}>
                {recentMilestone.title}
              </p>
              <p className="text-gray-600 mb-6">
                {recentMilestone.description}
              </p>

              {/* 奖励展示 */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center justify-center gap-2">
                  <Gift className="w-4 h-4" />
                  奖励
                </h3>
                <div className="text-lg font-medium text-orange-600">
                  {recentMilestone.reward}
                </div>
              </div>

              <button
                onClick={handleClaimMilestone}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium rounded-lg"
              >
                领取奖励
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// 缺少的 Crown 图标组件导入
import { Crown } from 'lucide-react'

export default StreakTracker
