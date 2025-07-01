/**
 * 经验值进度条组件
 * 显示用户当前等级、经验值进度和升级奖励
 */

import { AnimatePresence, motion } from 'framer-motion'
import {
    Award,
    ChevronUp,
    Crown,
    Gift,
    Sparkles,
    Star,
    TrendingUp,
    Trophy,
    Zap
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { XPSystem } from '../types'

interface XPProgressBarProps {
  xpData: XPSystem
  showDetails?: boolean
  showRecentGains?: boolean
  compact?: boolean
  onLevelUp?: (newLevel: number) => void
  className?: string
}

interface LevelInfo {
  level: number
  title: string
  color: string
  bgColor: string
  icon: React.ComponentType<any>
  perks: string[]
}

const XPProgressBar: React.FC<XPProgressBarProps> = ({
  xpData,
  showDetails = true,
  showRecentGains = true,
  compact = false,
  onLevelUp,
  className = ''
}) => {
  const [showLevelUpModal, setShowLevelUpModal] = useState(false)
  const [recentGain, setRecentGain] = useState<number | null>(null)
  const [previousLevel, setPreviousLevel] = useState(xpData.level)

  // 等级信息配置
  const getLevelInfo = (level: number): LevelInfo => {
    if (level < 5) {
      return {
        level,
        title: '学习新手',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        icon: Star,
        perks: ['基础学习功能', '闪卡制作']
      }
    } else if (level < 10) {
      return {
        level,
        title: '认真学者',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: Zap,
        perks: ['AI提示功能', '学习统计', '自定义主题']
      }
    } else if (level < 20) {
      return {
        level,
        title: '知识探索者',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        icon: Trophy,
        perks: ['高级AI模式', '学习路径规划', '成就系统']
      }
    } else if (level < 35) {
      return {
        level,
        title: '学习专家',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: Award,
        perks: ['专家AI导师', '深度分析', '个性化推荐']
      }
    } else {
      return {
        level,
        title: '学习大师',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: Crown,
        perks: ['全功能解锁', '优先支持', '专属徽章']
      }
    }
  }

  const currentLevelInfo = getLevelInfo(xpData.level)
  const nextLevelInfo = getLevelInfo(xpData.level + 1)

  // 计算进度百分比
  const progressPercentage = xpData.xp_to_next_level > 0 
    ? ((xpData.total_xp % (xpData.total_xp + xpData.xp_to_next_level)) / (xpData.total_xp + xpData.xp_to_next_level)) * 100
    : 100

  // 监听等级变化
  useEffect(() => {
    if (xpData.level > previousLevel) {
      setShowLevelUpModal(true)
      onLevelUp?.(xpData.level)
      setPreviousLevel(xpData.level)
    }
  }, [xpData.level, previousLevel, onLevelUp])

  // 显示最近获得的经验值
  useEffect(() => {
    if (xpData.recent_gains.length > 0) {
      const latestGain = xpData.recent_gains[0]
      const gainTime = new Date(latestGain.timestamp).getTime()
      const now = Date.now()
      
      // 如果是最近30秒内的经验值，显示增长动画
      if (now - gainTime < 30000) {
        setRecentGain(latestGain.amount)
        setTimeout(() => setRecentGain(null), 3000)
      }
    }
  }, [xpData.recent_gains])

  // 紧凑模式渲染
  if (compact) {
    return (
      <div className={`xp-progress-bar-compact flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full ${currentLevelInfo.bgColor} flex items-center justify-center`}>
            <currentLevelInfo.icon className={`w-4 h-4 ${currentLevelInfo.color}`} />
          </div>
          <span className="font-medium text-gray-800">Lv.{xpData.level}</span>
        </div>
        
        <div className="flex-1 max-w-32">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        <span className="text-xs text-gray-500">
          {xpData.xp_to_next_level} XP
        </span>

        {/* 经验值增长动画 */}
        <AnimatePresence>
          {recentGain && (
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.8 }}
              animate={{ opacity: 1, y: -20, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.8 }}
              className="absolute text-green-600 font-bold text-sm pointer-events-none"
            >
              +{recentGain} XP
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className={`xp-progress-bar ${className}`}>
      {/* 主进度条 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${currentLevelInfo.bgColor} flex items-center justify-center`}>
              <currentLevelInfo.icon className={`w-6 h-6 ${currentLevelInfo.color}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">等级 {xpData.level}</h3>
              <p className={`text-sm font-medium ${currentLevelInfo.color}`}>
                {currentLevelInfo.title}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-gray-800">
              {xpData.total_xp.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">总经验值</div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              距离下一级还需 {xpData.xp_to_next_level.toLocaleString()} XP
            </span>
            <span className="text-sm font-medium text-gray-700">
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
          
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden relative">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            
            {/* 闪光效果 */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                repeatDelay: 3,
                ease: "easeInOut" 
              }}
            />
          </div>
        </div>

        {/* 下一级预览 */}
        {xpData.level < 50 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ChevronUp className="w-4 h-4" />
            <span>下一级: {nextLevelInfo.title}</span>
            <div className="flex items-center gap-1 ml-auto">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className="text-xs">新功能解锁</span>
            </div>
          </div>
        )}
      </div>

      {/* 详细信息 */}
      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* 当前等级特权 */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Gift className="w-4 h-4 text-blue-500" />
              当前特权
            </h4>
            <div className="space-y-2">
              {currentLevelInfo.perks.map((perk, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  {perk}
                </div>
              ))}
            </div>
          </div>

          {/* 最近经验值获得 */}
          {showRecentGains && xpData.recent_gains.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                最近获得
              </h4>
              <div className="space-y-2 max-h-24 overflow-y-auto">
                {xpData.recent_gains.slice(0, 3).map((gain, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{gain.description}</span>
                    <span className="text-green-600 font-medium">+{gain.amount} XP</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 升级庆祝模态框 */}
      <AnimatePresence>
        {showLevelUpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowLevelUpModal(false)}
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
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 mx-auto"
                >
                  <div className={`w-full h-full rounded-full ${currentLevelInfo.bgColor} flex items-center justify-center`}>
                    <currentLevelInfo.icon className={`w-10 h-10 ${currentLevelInfo.color}`} />
                  </div>
                </motion.div>
                
                {/* 星星特效 */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="absolute"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-40px)`
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                  </motion.div>
                ))}
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">升级了！</h2>
              <p className="text-lg text-gray-600 mb-4">
                恭喜达到 <span className={`font-bold ${currentLevelInfo.color}`}>
                  等级 {xpData.level}
                </span>
              </p>
              <p className={`text-lg font-medium ${currentLevelInfo.color} mb-6`}>
                {currentLevelInfo.title}
              </p>

              {/* 新解锁功能 */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center justify-center gap-2">
                  <Gift className="w-4 h-4" />
                  新功能解锁
                </h3>
                <div className="space-y-1">
                  {nextLevelInfo.perks.slice(0, 2).map((perk, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      ✨ {perk}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowLevelUpModal(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg"
              >
                继续学习
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 经验值增长浮动提示 */}
      <AnimatePresence>
        {recentGain && !compact && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -30, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-lg font-bold shadow-lg pointer-events-none"
          >
            +{recentGain} XP
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default XPProgressBar
