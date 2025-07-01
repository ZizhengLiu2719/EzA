/**
 * 排行榜系统组件
 * 显示用户在各种学习指标上的排名和比较
 */

import { AnimatePresence, motion } from 'framer-motion'
import {
    Award,
    ChevronDown,
    ChevronUp,
    Clock,
    Crown,
    Medal,
    Minus,
    Star,
    TrendingUp,
    Trophy,
    Users,
    Zap
} from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { LeaderboardEntry } from '../types'

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId: string
  timeframe?: 'weekly' | 'monthly' | 'all_time'
  onTimeframeChange?: (timeframe: 'weekly' | 'monthly' | 'all_time') => void
  compact?: boolean
  className?: string
}

interface LeaderboardTab {
  id: string
  name: string
  icon: React.ComponentType<any>
  sortKey: keyof LeaderboardEntry
  color: string
  description: string
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  entries,
  currentUserId,
  timeframe = 'weekly',
  onTimeframeChange,
  compact = false,
  className = ''
}) => {
  const [selectedTab, setSelectedTab] = useState<string>('total_xp')
  const [showUserDetails, setShowUserDetails] = useState<string | null>(null)

  // 排行榜分类配置
  const tabs: LeaderboardTab[] = [
    {
      id: 'total_xp',
      name: '总经验',
      icon: Star,
      sortKey: 'total_xp',
      color: 'text-yellow-600',
      description: '累计获得的总经验值'
    },
    {
      id: 'level',
      name: '等级',
      icon: Crown,
      sortKey: 'level',
      color: 'text-purple-600',
      description: '当前学习等级'
    },
    {
      id: 'current_streak',
      name: '连击',
      icon: Zap,
      sortKey: 'current_streak',
      color: 'text-orange-600',
      description: '连续学习天数'
    },
    {
      id: 'achievements_count',
      name: '成就',
      icon: Trophy,
      sortKey: 'achievements_count',
      color: 'text-blue-600',
      description: '获得成就数量'
    },
    {
      id: 'weekly_xp',
      name: '本周',
      icon: TrendingUp,
      sortKey: 'weekly_xp',
      color: 'text-green-600',
      description: '本周获得经验值'
    }
  ]

  // 根据选择的标签排序条目
  const sortedEntries = useMemo(() => {
    const activeTab = tabs.find(t => t.id === selectedTab)
    if (!activeTab) return entries

    return [...entries].sort((a, b) => {
      const valueA = a[activeTab.sortKey] as number
      const valueB = b[activeTab.sortKey] as number
      return valueB - valueA
    }).map((entry, index) => ({
      ...entry,
      rank: index + 1
    }))
  }, [entries, selectedTab, tabs])

  // 获取当前用户数据
  const currentUser = sortedEntries.find(entry => entry.user_id === currentUserId)
  const currentUserRank = currentUser?.rank || sortedEntries.length + 1

  // 获取排名变化图标
  const getRankChangeIcon = (rank: number, previousRank?: number) => {
    if (!previousRank) return <Minus className="w-4 h-4 text-gray-400" />
    
    if (rank < previousRank) {
      return <ChevronUp className="w-4 h-4 text-green-500" />
    } else if (rank > previousRank) {
      return <ChevronDown className="w-4 h-4 text-red-500" />
    } else {
      return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  // 获取排名徽章
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
          <Crown className="w-5 h-5 text-white" />
        </div>
      )
    } else if (rank === 2) {
      return (
        <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center">
          <Medal className="w-5 h-5 text-white" />
        </div>
      )
    } else if (rank === 3) {
      return (
        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
          <Award className="w-5 h-5 text-white" />
        </div>
      )
    } else {
      return (
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-sm font-bold text-gray-600">#{rank}</span>
        </div>
      )
    }
  }

  // 获取当前选中标签的信息
  const activeTab = tabs.find(t => t.id === selectedTab) || tabs[0]

  // 紧凑模式渲染
  if (compact) {
    return (
      <div className={`leaderboard-compact ${className}`}>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              排行榜
            </h3>
            <span className="text-xs text-gray-500">#{currentUserRank}</span>
          </div>

          <div className="space-y-2">
            {sortedEntries.slice(0, 3).map((entry, index) => (
              <div key={entry.user_id} className="flex items-center gap-3">
                {getRankBadge(entry.rank)}
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-800">{entry.username}</div>
                                     <div className="text-xs text-gray-500">
                     Lv.{entry.level} • {entry[activeTab.sortKey]?.toLocaleString()}
                   </div>
                </div>
                {entry.user_id === currentUserId && (
                  <div className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">你</div>
                )}
              </div>
            ))}
          </div>

          {currentUserRank > 3 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-3">
                {getRankBadge(currentUserRank)}
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-800">{currentUser?.username}</div>
                                     <div className="text-xs text-gray-500">
                     Lv.{currentUser?.level} • {currentUser?.[activeTab.sortKey]?.toLocaleString?.()}
                   </div>
                </div>
                <div className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">你</div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`leaderboard ${className}`}>
      {/* 头部 */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            学习排行榜
          </h2>
          
          {/* 时间筛选 */}
          {onTimeframeChange && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {[
                { id: 'weekly', name: '本周' },
                { id: 'monthly', name: '本月' },
                { id: 'all_time', name: '总榜' }
              ].map(period => (
                <button
                  key={period.id}
                  onClick={() => onTimeframeChange(period.id as any)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                    timeframe === period.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {period.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 当前用户排名 */}
        {currentUser && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-4">
              {getRankBadge(currentUserRank)}
              <div className="flex-1">
                <div className="font-bold text-gray-800">{currentUser.username} (你)</div>
                <div className="text-sm text-gray-600">
                  Lv.{currentUser.level} • {(currentUser[activeTab.sortKey] as number)?.toLocaleString()} {activeTab.name}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">#{currentUserRank}</div>
                <div className="text-xs text-gray-500">当前排名</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 分类标签 */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap font-medium transition-all border-b-2 ${
                selectedTab === tab.id
                  ? `${tab.color} border-current bg-gray-50`
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* 排行榜列表 */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className={`font-semibold ${activeTab.color} flex items-center gap-2`}>
            <activeTab.icon className="w-5 h-5" />
            {activeTab.name}排行榜
          </h3>
          <p className="text-sm text-gray-600 mt-1">{activeTab.description}</p>
        </div>

        <div className="divide-y divide-gray-100">
          <AnimatePresence>
            {sortedEntries.slice(0, 50).map((entry, index) => (
              <motion.div
                key={entry.user_id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  entry.user_id === currentUserId ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => setShowUserDetails(
                  showUserDetails === entry.user_id ? null : entry.user_id
                )}
              >
                <div className="flex items-center gap-4">
                  {/* 排名徽章 */}
                  {getRankBadge(entry.rank)}

                  {/* 用户头像和信息 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {entry.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 flex items-center gap-2">
                          {entry.username}
                          {entry.user_id === currentUserId && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">你</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          Lv.{entry.level} • {entry.achievements_count} 个成就
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 统计数据 */}
                  <div className="text-right">
                    <div className={`text-lg font-bold ${activeTab.color}`}>
                      {(entry[activeTab.sortKey] as number)?.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {activeTab.name}
                    </div>
                  </div>

                  {/* 排名变化 */}
                  <div className="flex items-center">
                    {getRankChangeIcon(entry.rank)}
                  </div>
                </div>

                {/* 展开的用户详情 */}
                <AnimatePresence>
                  {showUserDetails === entry.user_id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                          <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                          <div className="font-bold text-yellow-700">{entry.total_xp.toLocaleString()}</div>
                          <div className="text-xs text-yellow-600">总经验</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <Crown className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                          <div className="font-bold text-purple-700">{entry.level}</div>
                          <div className="text-xs text-purple-600">等级</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <Zap className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                          <div className="font-bold text-orange-700">{entry.current_streak}</div>
                          <div className="text-xs text-orange-600">连击天数</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <Trophy className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                          <div className="font-bold text-blue-700">{entry.achievements_count}</div>
                          <div className="text-xs text-blue-600">成就数</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 底部信息 */}
        <div className="p-4 bg-gray-50 rounded-b-xl">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              共 {entries.length} 位学习者
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              实时更新
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard
