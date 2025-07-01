/**
 * 成就徽章系统组件
 * 显示用户已获得和待解锁的成就，支持分类筛选和进度追踪
 */

import { AnimatePresence, motion } from 'framer-motion'
import {
    BookOpen,
    Brain,
    Calendar,
    CheckCircle,
    Crown,
    Gift,
    Lock,
    Search,
    Target,
    Trophy,
    Users,
    Zap
} from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { Achievement, UserAchievement } from '../types'

interface AchievementSystemProps {
  achievements: Achievement[]
  userAchievements: UserAchievement[]
  onClaimReward?: (achievementId: string) => void
  compact?: boolean
  showProgress?: boolean
  className?: string
}

interface CategoryInfo {
  id: string
  name: string
  icon: React.ComponentType<any>
  color: string
  bgColor: string
}

const AchievementSystem: React.FC<AchievementSystemProps> = ({
  achievements,
  userAchievements,
  onClaimReward,
  compact = false,
  showProgress = true,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [showModal, setShowModal] = useState(false)

  // 成就分类配置
  const categories: CategoryInfo[] = [
    {
      id: 'all',
      name: '全部',
      icon: Trophy,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    {
      id: 'study',
      name: '学习成就',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: 'exam',
      name: '考试成就',
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      id: 'streak',
      name: '连击成就',
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      id: 'mastery',
      name: '精通成就',
      icon: Brain,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      id: 'social',
      name: '社交成就',
      icon: Users,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
    },
    {
      id: 'milestone',
      name: '里程碑',
      icon: Crown,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    }
  ]

  // 获取用户成就状态
  const getUserAchievementStatus = (achievementId: string) => {
    return userAchievements.find(ua => ua.achievement_id === achievementId)
  }

  // 根据等级获取徽章颜色
  const getTierColor = (tier: Achievement['tier']) => {
    switch (tier) {
      case 'bronze':
        return {
          border: 'border-orange-400',
          bg: 'bg-orange-50',
          text: 'text-orange-700',
          glow: 'shadow-orange-200'
        }
      case 'silver':
        return {
          border: 'border-gray-400',
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          glow: 'shadow-gray-200'
        }
      case 'gold':
        return {
          border: 'border-yellow-400',
          bg: 'bg-yellow-50',
          text: 'text-yellow-700',
          glow: 'shadow-yellow-200'
        }
      case 'platinum':
        return {
          border: 'border-blue-400',
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          glow: 'shadow-blue-200'
        }
      case 'legendary':
        return {
          border: 'border-purple-400',
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          glow: 'shadow-purple-200'
        }
      default:
        return {
          border: 'border-gray-300',
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          glow: 'shadow-gray-100'
        }
    }
  }

  // 筛选成就
  const filteredAchievements = useMemo(() => {
    let filtered = achievements

    // 按分类筛选
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory)
    }

    // 按搜索查询筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query)
      )
    }

    // 排序：已解锁的在前，然后按等级排序
    return filtered.sort((a, b) => {
      const statusA = getUserAchievementStatus(a.id)
      const statusB = getUserAchievementStatus(b.id)
      
      // 已解锁的在前
      if (statusA && !statusB) return -1
      if (!statusA && statusB) return 1
      
      // 按等级排序
      const tierOrder = ['legendary', 'platinum', 'gold', 'silver', 'bronze']
      const tierIndexA = tierOrder.indexOf(a.tier)
      const tierIndexB = tierOrder.indexOf(b.tier)
      
      return tierIndexA - tierIndexB
    })
  }, [achievements, selectedCategory, searchQuery, userAchievements])

  // 统计数据
  const stats = useMemo(() => {
    const total = achievements.length
    const unlocked = userAchievements.filter(ua => ua.progress >= 1).length
    const inProgress = userAchievements.filter(ua => ua.progress > 0 && ua.progress < 1).length
    
    return { total, unlocked, inProgress }
  }, [achievements, userAchievements])

  // 成就卡片组件
  const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
    const userStatus = getUserAchievementStatus(achievement.id)
    const isUnlocked = userStatus && userStatus.progress >= 1
    const progress = userStatus?.progress || 0
    const tierColors = getTierColor(achievement.tier)
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ scale: 1.02 }}
        onClick={() => {
          setSelectedAchievement(achievement)
          setShowModal(true)
        }}
        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
          isUnlocked 
            ? `${tierColors.border} ${tierColors.bg} ${tierColors.glow} shadow-lg`
            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
        }`}
      >
        {/* 成就图标 */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`relative w-12 h-12 rounded-full flex items-center justify-center ${
            isUnlocked ? tierColors.bg : 'bg-gray-100'
          }`}>
            {/* 图标 */}
            <div className="text-2xl">
              {achievement.icon}
            </div>
            
            {/* 等级徽章 */}
            <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
              isUnlocked ? tierColors.bg : 'bg-gray-200'
            } ${isUnlocked ? tierColors.text : 'text-gray-500'} border-2 border-white`}>
              {achievement.tier === 'bronze' ? 'B' :
               achievement.tier === 'silver' ? 'S' :
               achievement.tier === 'gold' ? 'G' :
               achievement.tier === 'platinum' ? 'P' : 'L'}
            </div>

            {/* 未解锁遮罩 */}
            {!isUnlocked && (
              <div className="absolute inset-0 bg-gray-300 bg-opacity-60 rounded-full flex items-center justify-center">
                <Lock className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h3 className={`font-bold text-sm ${isUnlocked ? tierColors.text : 'text-gray-600'}`}>
              {achievement.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {achievement.description}
            </p>
          </div>

          {/* 奖励显示 */}
          <div className="text-right">
            <div className={`text-sm font-bold ${isUnlocked ? tierColors.text : 'text-gray-500'}`}>
              {achievement.points} XP
            </div>
            {isUnlocked && (
              <CheckCircle className="w-4 h-4 text-green-500 ml-auto mt-1" />
            )}
          </div>
        </div>

        {/* 进度条 */}
        {showProgress && progress > 0 && progress < 1 && (
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">进度</span>
              <span className="text-xs text-gray-500">{(progress * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* 解锁时间 */}
        {isUnlocked && userStatus && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            {new Date(userStatus.unlocked_at).toLocaleDateString()}
          </div>
        )}

        {/* 闪光效果（传奇成就） */}
        {isUnlocked && achievement.tier === 'legendary' && (
          <motion.div
            animate={{ 
              opacity: [0, 0.3, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              repeatDelay: 3
            }}
            className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 rounded-xl opacity-20 pointer-events-none"
          />
        )}
      </motion.div>
    )
  }

  // 紧凑模式渲染
  if (compact) {
    return (
      <div className={`achievement-system-compact ${className}`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-medium text-gray-800">{stats.unlocked}/{stats.total}</span>
          </div>
          
          <div className="flex-1 max-w-32">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                style={{ width: `${(stats.unlocked / stats.total) * 100}%` }}
              />
            </div>
          </div>

          <span className="text-xs text-gray-500">
            {((stats.unlocked / stats.total) * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`achievement-system ${className}`}>
      {/* 头部统计 */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">成就系统</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Trophy className="w-4 h-4" />
            完成度: {((stats.unlocked / stats.total) * 100).toFixed(1)}%
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.unlocked}</div>
            <div className="text-sm text-green-700">已解锁</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-sm text-blue-700">进行中</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
            <div className="text-sm text-gray-700">总数</div>
          </div>
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
        {/* 分类筛选 */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === category.id
                  ? `${category.bgColor} ${category.color}`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <category.icon className="w-4 h-4" />
              {category.name}
            </button>
          ))}
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索成就..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 成就网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredAchievements.map(achievement => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </AnimatePresence>
      </div>

      {/* 成就详情模态框 */}
      <AnimatePresence>
        {showModal && selectedAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const userStatus = getUserAchievementStatus(selectedAchievement.id)
                const isUnlocked = userStatus && userStatus.progress >= 1
                const tierColors = getTierColor(selectedAchievement.tier)

                return (
                  <>
                    {/* 成就图标和名称 */}
                    <div className="text-center mb-6">
                      <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 ${
                        isUnlocked ? tierColors.bg : 'bg-gray-100'
                      }`}>
                        {selectedAchievement.icon}
                      </div>
                      <h2 className={`text-xl font-bold mb-2 ${isUnlocked ? tierColors.text : 'text-gray-600'}`}>
                        {selectedAchievement.name}
                      </h2>
                      <p className="text-gray-600">
                        {selectedAchievement.description}
                      </p>
                    </div>

                    {/* 成就详情 */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">等级</span>
                        <span className={`font-medium capitalize ${tierColors.text}`}>
                          {selectedAchievement.tier}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">奖励</span>
                        <span className="font-medium text-gray-800">
                          {selectedAchievement.points} XP
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">类型</span>
                        <span className="font-medium text-gray-800 capitalize">
                          {selectedAchievement.category}
                        </span>
                      </div>

                      {/* 进度显示 */}
                      {userStatus && (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">进度</span>
                            <span className="font-medium text-gray-800">
                              {(userStatus.progress * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                              style={{ width: `${userStatus.progress * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* 解锁时间 */}
                      {isUnlocked && userStatus && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">解锁时间</span>
                          <span className="font-medium text-gray-800">
                            {new Date(userStatus.unlocked_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setShowModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        关闭
                      </button>
                      {isUnlocked && onClaimReward && (
                        <button
                          onClick={() => {
                            onClaimReward(selectedAchievement.id)
                            setShowModal(false)
                          }}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg flex items-center justify-center gap-2"
                        >
                          <Gift className="w-4 h-4" />
                          领取奖励
                        </button>
                      )}
                    </div>
                  </>
                )
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AchievementSystem
