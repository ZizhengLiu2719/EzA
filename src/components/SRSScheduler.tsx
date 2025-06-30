/**
 * SRS 调度器 UI 组件
 * 用于管理间隔重复学习设置和显示学习统计
 */

import React, { useCallback, useState } from 'react'
import {
    DEFAULT_FSRS_PARAMETERS,
    DEFAULT_SRS_CONFIG,
    FSRSCard,
    FSRSParameters,
    FSRSState,
    LearningStats,
    ReviewSession,
    SRSSchedulerConfig
} from '../types/SRSTypes'
import {
    analyzeDifficultyDistribution,
    formatDuration,
    getNextReviewText,
    getRelativeTime,
    predictCompletionTime
} from '../utils/srsCalculator'
import styles from './SRSScheduler.module.css'

interface SRSSchedulerProps {
  cards: FSRSCard[]
  learningStats: LearningStats
  parameters: FSRSParameters
  config: SRSSchedulerConfig
  onParametersChange: (params: Partial<FSRSParameters>) => void
  onConfigChange: (config: Partial<SRSSchedulerConfig>) => void
  onStartStudy?: (mode: ReviewSession['mode']) => void
  sessionHistory?: ReviewSession[]
  className?: string
}

const SRSScheduler: React.FC<SRSSchedulerProps> = ({
  cards,
  learningStats,
  parameters,
  config,
  onParametersChange,
  onConfigChange,
  onStartStudy,
  sessionHistory = [],
  className
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'advanced'>('overview')
  const [showAdvancedParams, setShowAdvancedParams] = useState(false)

  // 计算统计数据
  const dueCards = cards.filter(card => card.due <= new Date())
  const newCards = cards.filter(card => card.state === FSRSState.NEW)
  const reviewCards = cards.filter(card => card.state === FSRSState.REVIEW)
  const learningCards = cards.filter(card => 
    card.state === FSRSState.LEARNING || card.state === FSRSState.RELEARNING
  )

  // 预测数据
  const completionPrediction = predictCompletionTime(cards, config.daily_review_cards)
  const difficultyDistribution = analyzeDifficultyDistribution(cards)

  // 获取下次复习时间最近的卡片
  const nextReviewCards = cards
    .filter(card => card.due > new Date())
    .sort((a, b) => a.due.getTime() - b.due.getTime())
    .slice(0, 3)

  // 处理参数更新
  const handleParameterChange = useCallback((key: keyof FSRSParameters, value: number) => {
    onParametersChange({ [key]: value })
  }, [onParametersChange])

  // 处理配置更新
  const handleConfigChange = useCallback((key: keyof SRSSchedulerConfig, value: any) => {
    onConfigChange({ [key]: value })
  }, [onConfigChange])

  // 重置为默认参数
  const resetToDefaults = useCallback(() => {
    onParametersChange(DEFAULT_FSRS_PARAMETERS)
    onConfigChange(DEFAULT_SRS_CONFIG)
  }, [onParametersChange, onConfigChange])

  return (
    <div className={`${styles.srsScheduler} ${className || ''}`}>
      {/* 标签页导航 */}
      <div className={styles.tabNav}>
        {(['overview', 'settings', 'advanced'] as const).map(tab => (
          <button
            key={tab}
            className={`${styles.tabButton} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' && '📊 概览'}
            {tab === 'settings' && '⚙️ 设置'}
            {tab === 'advanced' && '🔬 高级'}
          </button>
        ))}
      </div>

      {/* 概览标签页 */}
      {activeTab === 'overview' && (
        <div className={styles.overviewTab}>
          {/* 学习统计卡片 */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🃏</div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{cards.length}</div>
                <div className={styles.statLabel}>总卡片数</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>⏰</div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{dueCards.length}</div>
                <div className={styles.statLabel}>待复习</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>✨</div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{newCards.length}</div>
                <div className={styles.statLabel}>新卡片</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>🎯</div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{Math.round(learningStats.average_success_rate * 100)}%</div>
                <div className={styles.statLabel}>掌握率</div>
              </div>
            </div>
          </div>

          {/* 学习进度 */}
          <div className={styles.progressSection}>
            <h3>📈 学习进度</h3>
            <div className={styles.progressBars}>
              <div className={styles.progressItem}>
                <div className={styles.progressLabel}>
                  <span>新卡片</span>
                  <span>{newCards.length}/{cards.length}</span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${cards.length > 0 ? (newCards.length / cards.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className={styles.progressItem}>
                <div className={styles.progressLabel}>
                  <span>学习中</span>
                  <span>{learningCards.length}/{cards.length}</span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${cards.length > 0 ? (learningCards.length / cards.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className={styles.progressItem}>
                <div className={styles.progressLabel}>
                  <span>已掌握</span>
                  <span>{reviewCards.length}/{cards.length}</span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${cards.length > 0 ? (reviewCards.length / cards.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 即将到期的卡片 */}
          {nextReviewCards.length > 0 && (
            <div className={styles.upcomingSection}>
              <h3>⏳ 即将复习</h3>
              <div className={styles.upcomingCards}>
                {nextReviewCards.map(card => (
                  <div key={card.id} className={styles.upcomingCard}>
                    <div className={styles.cardQuestion}>{card.question}</div>
                    <div className={styles.cardDue}>{getNextReviewText(card.due)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 预测信息 */}
          <div className={styles.predictionSection}>
            <h3>🔮 学习预测</h3>
            <div className={styles.predictionGrid}>
              <div className={styles.predictionItem}>
                <div className={styles.predictionLabel}>预计完成新卡片</div>
                <div className={styles.predictionValue}>
                  {completionPrediction.newCardsCompletionDays} 天
                </div>
              </div>
              <div className={styles.predictionItem}>
                <div className={styles.predictionLabel}>清空复习积压</div>
                <div className={styles.predictionValue}>
                  {completionPrediction.reviewBacklogDays} 天
                </div>
              </div>
              <div className={styles.predictionItem}>
                <div className={styles.predictionLabel}>总完成时间</div>
                <div className={styles.predictionValue}>
                  {completionPrediction.totalCompletionDays} 天
                </div>
              </div>
            </div>
          </div>

          {/* 快速学习按钮 */}
          {onStartStudy && dueCards.length > 0 && (
            <div className={styles.quickStudySection}>
              <h3>🚀 开始学习</h3>
              <div className={styles.studyButtons}>
                <button 
                  className={styles.studyButton}
                  onClick={() => onStartStudy('flashcard')}
                >
                  🃏 卡片学习 ({dueCards.length})
                </button>
                <button 
                  className={styles.studyButton}
                  onClick={() => onStartStudy('learn')}
                >
                  🧠 适应学习
                </button>
                <button 
                  className={styles.studyButton}
                  onClick={() => onStartStudy('test')}
                >
                  📝 测试模式
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 设置标签页 */}
      {activeTab === 'settings' && (
        <div className={styles.settingsTab}>
          <h3>⚙️ 学习设置</h3>
          
          {/* 每日限制 */}
          <div className={styles.settingGroup}>
            <h4>📅 每日限制</h4>
            <div className={styles.settingItem}>
              <label>每日新卡片数量</label>
              <input
                type="number"
                min="1"
                max="100"
                value={config.daily_new_cards}
                onChange={(e) => handleConfigChange('daily_new_cards', parseInt(e.target.value))}
                className={styles.numberInput}
              />
            </div>
            <div className={styles.settingItem}>
              <label>每日复习卡片数量</label>
              <input
                type="number"
                min="10"
                max="1000"
                value={config.daily_review_cards}
                onChange={(e) => handleConfigChange('daily_review_cards', parseInt(e.target.value))}
                className={styles.numberInput}
              />
            </div>
          </div>

          {/* 学习行为 */}
          <div className={styles.settingGroup}>
            <h4>🎯 学习行为</h4>
            <div className={styles.settingItem}>
              <label>
                <input
                  type="checkbox"
                  checked={config.auto_advance}
                  onChange={(e) => handleConfigChange('auto_advance', e.target.checked)}
                />
                自动推进到下一张卡片
              </label>
            </div>
            <div className={styles.settingItem}>
              <label>
                <input
                  type="checkbox"
                  checked={config.show_answer_timer}
                  onChange={(e) => handleConfigChange('show_answer_timer', e.target.checked)}
                />
                显示答题计时器
              </label>
            </div>
            <div className={styles.settingItem}>
              <label>
                <input
                  type="checkbox"
                  checked={config.bury_related}
                  onChange={(e) => handleConfigChange('bury_related', e.target.checked)}
                />
                埋葬相关卡片
              </label>
            </div>
          </div>

          {/* 记忆目标 */}
          <div className={styles.settingGroup}>
            <h4>🧠 记忆目标</h4>
            <div className={styles.settingItem}>
              <label>目标记忆保持率</label>
              <input
                type="range"
                min="0.8"
                max="0.95"
                step="0.01"
                value={parameters.requestRetention}
                onChange={(e) => handleParameterChange('requestRetention', parseFloat(e.target.value))}
                className={styles.rangeInput}
              />
              <span className={styles.rangeValue}>
                {Math.round(parameters.requestRetention * 100)}%
              </span>
            </div>
            <div className={styles.settingItem}>
              <label>最大复习间隔 (天)</label>
              <input
                type="number"
                min="30"
                max="36500"
                value={parameters.maximumInterval}
                onChange={(e) => handleParameterChange('maximumInterval', parseInt(e.target.value))}
                className={styles.numberInput}
              />
            </div>
          </div>

          {/* 学习步骤 */}
          <div className={styles.settingGroup}>
            <h4>📚 学习步骤 (分钟)</h4>
            <div className={styles.settingItem}>
              <label>学习步骤</label>
              <input
                type="text"
                value={parameters.learningSteps.join(', ')}
                onChange={(e) => {
                  const steps = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
                  handleParameterChange('learningSteps', steps as any)
                }}
                placeholder="1, 10, 1440"
                className={styles.textInput}
              />
            </div>
            <div className={styles.settingItem}>
              <label>重新学习步骤</label>
              <input
                type="text"
                value={parameters.relearningSteps.join(', ')}
                onChange={(e) => {
                  const steps = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
                  handleParameterChange('relearningSteps', steps as any)
                }}
                placeholder="10, 1440"
                className={styles.textInput}
              />
            </div>
          </div>

          {/* 重置按钮 */}
          <div className={styles.resetSection}>
            <button onClick={resetToDefaults} className={styles.resetButton}>
              🔄 重置为默认设置
            </button>
          </div>
        </div>
      )}

      {/* 高级标签页 */}
      {activeTab === 'advanced' && (
        <div className={styles.advancedTab}>
          <h3>🔬 高级设置</h3>
          
          {/* 难度分布 */}
          <div className={styles.difficultySection}>
            <h4>📊 难度分布</h4>
            <div className={styles.difficultyChart}>
              <div className={styles.difficultyBar}>
                <div className={styles.difficultyLabel}>简单 (1-3)</div>
                <div className={styles.difficultyProgress}>
                  <div 
                    className={`${styles.difficultyFill} ${styles.easy}`}
                    style={{ width: `${difficultyDistribution.easy}%` }}
                  />
                </div>
                <div className={styles.difficultyValue}>{difficultyDistribution.easy}%</div>
              </div>
              <div className={styles.difficultyBar}>
                <div className={styles.difficultyLabel}>中等 (4-6)</div>
                <div className={styles.difficultyProgress}>
                  <div 
                    className={`${styles.difficultyFill} ${styles.medium}`}
                    style={{ width: `${difficultyDistribution.medium}%` }}
                  />
                </div>
                <div className={styles.difficultyValue}>{difficultyDistribution.medium}%</div>
              </div>
              <div className={styles.difficultyBar}>
                <div className={styles.difficultyLabel}>困难 (7-10)</div>
                <div className={styles.difficultyProgress}>
                  <div 
                    className={`${styles.difficultyFill} ${styles.hard}`}
                    style={{ width: `${difficultyDistribution.hard}%` }}
                  />
                </div>
                <div className={styles.difficultyValue}>{difficultyDistribution.hard}%</div>
              </div>
            </div>
            <div className={styles.averageDifficulty}>
              平均难度: {difficultyDistribution.average}
            </div>
          </div>

          {/* FSRS-5 参数调优 */}
          <div className={styles.parametersSection}>
            <div className={styles.parametersHeader}>
              <h4>🎛️ FSRS-5 算法参数</h4>
              <button 
                onClick={() => setShowAdvancedParams(!showAdvancedParams)}
                className={styles.toggleButton}
              >
                {showAdvancedParams ? '隐藏' : '显示'} 高级参数
              </button>
            </div>
            
            {showAdvancedParams && (
              <div className={styles.advancedParameters}>
                <div className={styles.paramWarning}>
                  ⚠️ 修改这些参数可能会影响学习效果，请谨慎操作
                </div>
                
                {/* 核心参数 */}
                <div className={styles.paramGroup}>
                  <h5>核心参数</h5>
                  {(['w0', 'w1', 'w2', 'w3'] as const).map(param => (
                    <div key={param} className={styles.paramItem}>
                      <label>{param.toUpperCase()}</label>
                      <input
                        type="number"
                        step="0.001"
                        value={parameters[param]}
                        onChange={(e) => handleParameterChange(param, parseFloat(e.target.value))}
                        className={styles.paramInput}
                      />
                    </div>
                  ))}
                </div>

                {/* 辅助参数 */}
                <div className={styles.paramGroup}>
                  <h5>辅助参数</h5>
                  {(['easyBonus', 'hardInterval'] as const).map(param => (
                    <div key={param} className={styles.paramItem}>
                      <label>{param}</label>
                      <input
                        type="number"
                        step="0.1"
                        value={parameters[param]}
                        onChange={(e) => handleParameterChange(param, parseFloat(e.target.value))}
                        className={styles.paramInput}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 学习会话历史 */}
          {sessionHistory.length > 0 && (
            <div className={styles.historySection}>
              <h4>📈 最近学习记录</h4>
              <div className={styles.sessionHistory}>
                {sessionHistory.slice(-5).map(session => (
                  <div key={session.id} className={styles.sessionItem}>
                    <div className={styles.sessionInfo}>
                      <div className={styles.sessionMode}>{session.mode}</div>
                      <div className={styles.sessionDate}>
                        {getRelativeTime(session.created_at)}
                      </div>
                    </div>
                    <div className={styles.sessionStats}>
                      <span>🃏 {session.cards_reviewed}</span>
                      <span>⏱️ {formatDuration(session.total_time * 1000)}</span>
                      <span>🎯 {Math.round(session.accuracy * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SRSScheduler 