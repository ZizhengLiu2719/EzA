/**
 * Phase 2: 高级学习分析系统集成示例
 * 展示所有Phase 2功能的完整使用示例
 */

import React, { useEffect, useState } from 'react'
import { useAdvancedLearningAnalytics } from '../hooks/useAdvancedLearningAnalytics'

/**
 * Phase 2 集成演示组件
 */
export const Phase2IntegratedExample: React.FC = () => {
  const [userId] = useState('demo_user_phase2')
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'analytics' | 'patterns' | 'paths' | 'knowledge' | 'testing'>('dashboard')

  // 使用高级学习分析系统
  const analytics = useAdvancedLearningAnalytics(userId, {
    analysis_frequency: 'real_time',
    auto_pattern_detection: true,
    path_optimization_enabled: true,
    adaptive_testing_enabled: true,
    knowledge_modeling_enabled: true,
    analysis_depth: 'deep',
    privacy_level: 'standard'
  })

  // 自动触发初始分析
  useEffect(() => {
    analytics.triggerAnalysis()
  }, [])

  return (
    <div className="phase2-integrated-example">
      <div className="header">
        <h1>🧠 EzA Phase 2: 高级学习分析系统</h1>
        <div className="system-status">
          <div className={`status-indicator ${analytics.is_analyzing ? 'analyzing' : 'ready'}`}>
            {analytics.is_analyzing ? '🔄 分析中...' : '✅ 就绪'}
          </div>
          <div className="confidence-score">
            置信度: {analytics.analysis_confidence}%
          </div>
          <div className="last-update">
            更新时间: {new Date(analytics.last_update).toLocaleString()}
          </div>
        </div>
      </div>

      {/* 导航标签 */}
      <div className="navigation-tabs">
        {[
          { key: 'dashboard', label: '📊 综合仪表板', icon: '📊' },
          { key: 'analytics', label: '📈 学习分析', icon: '📈' },
          { key: 'patterns', label: '🔍 模式识别', icon: '🔍' },
          { key: 'paths', label: '🛤️ 学习路径', icon: '🛤️' },
          { key: 'knowledge', label: '🧠 知识建模', icon: '🧠' },
          { key: 'testing', label: '🎯 自适应测试', icon: '🎯' }
        ].map(tab => (
          <button
            key={tab.key}
            className={`tab ${selectedTab === tab.key ? 'active' : ''}`}
            onClick={() => setSelectedTab(tab.key as any)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="content-area">
        {selectedTab === 'dashboard' && <DashboardView analytics={analytics} />}
        {selectedTab === 'analytics' && <AnalyticsView analytics={analytics} />}
        {selectedTab === 'patterns' && <PatternsView analytics={analytics} />}
        {selectedTab === 'paths' && <PathsView analytics={analytics} />}
        {selectedTab === 'knowledge' && <KnowledgeView analytics={analytics} />}
        {selectedTab === 'testing' && <TestingView analytics={analytics} />}
      </div>

      {/* 控制面板 */}
      <div className="control-panel">
        <button
          onClick={() => analytics.triggerAnalysis()}
          disabled={analytics.is_analyzing}
          className="btn-primary"
        >
          🔄 触发分析
        </button>
        <button
          onClick={() => {
            const report = analytics.exportAnalysisReport()
            console.log('分析报告:', report)
            alert('分析报告已导出到控制台')
          }}
          className="btn-secondary"
        >
          📤 导出报告
        </button>
        <button
          onClick={analytics.resetAnalysis}
          className="btn-warning"
        >
          🗑️ 重置分析
        </button>
      </div>
    </div>
  )
}

/**
 * 综合仪表板视图
 */
const DashboardView: React.FC<{ analytics: any }> = ({ analytics }) => {
  return (
    <div className="dashboard-view">
      <div className="metrics-grid">
        {/* 整体进度 */}
        <div className="metric-card progress-card">
          <h3>📈 整体学习进度</h3>
          <div className="progress-circle">
            <div 
              className="progress-fill" 
              style={{ '--progress': `${analytics.comprehensive_analysis.overall_progress}%` } as any}
            >
              <span className="progress-text">{analytics.comprehensive_analysis.overall_progress}%</span>
            </div>
          </div>
          <p>综合学习表现评估</p>
        </div>

        {/* 学习速度 */}
        <div className="metric-card velocity-card">
          <h3>⚡ 学习速度</h3>
          <div className="velocity-meter">
            <div className="velocity-value">{analytics.comprehensive_analysis.learning_velocity}</div>
            <div className="velocity-label">概念/周</div>
          </div>
          <div className="velocity-trend">
            {analytics.comprehensive_analysis.learning_velocity > 50 ? '📈 快速' : '📊 稳定'}
          </div>
        </div>

        {/* 效率评分 */}
        <div className="metric-card efficiency-card">
          <h3>🎯 学习效率</h3>
          <div className="efficiency-score">
            {analytics.comprehensive_analysis.efficiency_score}
            <span className="score-suffix">/100</span>
          </div>
          <div className="efficiency-factors">
            {analytics.analytics.efficiency_analysis.efficiency_factors?.slice(0, 2).map((factor: any, index: number) => (
              <div key={index} className="factor">
                <span className="factor-name">{factor.factor}</span>
                <div className="factor-bar">
                  <div 
                    className="factor-fill" 
                    style={{ width: `${factor.impact}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 知识状态 */}
        <div className="metric-card knowledge-card">
          <h3>🧠 知识状态</h3>
          <div className="knowledge-summary">
            {analytics.knowledge_state.current_state ? (
              <>
                <div className="proficiency">
                  熟练度: {analytics.knowledge_state.current_state.overall_proficiency}%
                </div>
                <div className="gaps">
                  知识缺口: {analytics.knowledge_state.current_state.knowledge_gaps.length}个
                </div>
                <div className="strengths">
                  优势领域: {analytics.knowledge_state.current_state.strength_areas.length}个
                </div>
              </>
            ) : (
              <div className="no-data">暂无知识状态数据</div>
            )}
          </div>
        </div>
      </div>

      {/* 下一步行动 */}
      <div className="next-actions">
        <h3>🎯 下一步行动</h3>
        <div className="milestones">
          {analytics.comprehensive_analysis.next_milestones.slice(0, 3).map((milestone: any, index: number) => (
            <div key={index} className={`milestone priority-${milestone.priority}`}>
              <div className="milestone-header">
                <span className="milestone-type">{milestone.type}</span>
                <span className="milestone-priority">{milestone.priority}</span>
              </div>
              <div className="milestone-title">{milestone.title}</div>
              <div className="milestone-description">{milestone.description}</div>
              <div className="milestone-time">预计时间: {milestone.estimated_time}小时</div>
            </div>
          ))}
        </div>
      </div>

      {/* 战略建议 */}
      <div className="strategic-recommendations">
        <h3>💡 战略建议</h3>
        <div className="recommendations-list">
          {analytics.comprehensive_analysis.strategic_recommendations.map((rec: string, index: number) => (
            <div key={index} className="recommendation-item">
              <span className="rec-icon">💡</span>
              <span className="rec-text">{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * 学习分析视图
 */
const AnalyticsView: React.FC<{ analytics: any }> = ({ analytics }) => {
  return (
    <div className="analytics-view">
      <div className="section">
        <h3>📊 学习洞察</h3>
        <div className="insights-grid">
          {analytics.analytics.insights.map((insight: any, index: number) => (
            <div key={index} className={`insight-card ${insight.insight_type}`}>
              <div className="insight-header">
                <span className="insight-type">{insight.insight_type}</span>
                <span className="significance">{insight.significance_score}%</span>
              </div>
              <div className="insight-title">{insight.title}</div>
              <div className="insight-description">{insight.description}</div>
              <div className="insight-actions">
                {insight.actionable_items?.map((action: string, i: number) => (
                  <span key={i} className="action-tag">{action}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h3>🔮 学习预测</h3>
        <div className="predictions-list">
          {analytics.analytics.predictions.map((prediction: any, index: number) => (
            <div key={index} className="prediction-item">
              <div className="prediction-header">
                <span className="prediction-type">{prediction.prediction_type}</span>
                <span className="confidence">置信度: {Math.round(prediction.confidence_level * 100)}%</span>
              </div>
              <div className="prediction-metric">{prediction.target_metric}</div>
              <div className="prediction-value">预测值: {prediction.predicted_value}</div>
              <div className="prediction-timeframe">时间范围: {prediction.timeframe}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h3>⚡ 效率分析</h3>
        <div className="efficiency-details">
          <div className="overall-efficiency">
            <h4>整体效率: {analytics.analytics.efficiency_analysis.overall_efficiency}%</h4>
          </div>
          <div className="efficiency-factors">
            {analytics.analytics.efficiency_analysis.efficiency_factors?.map((factor: any, index: number) => (
              <div key={index} className="factor-detail">
                <div className="factor-header">
                  <span className="factor-name">{factor.factor}</span>
                  <span className="factor-impact">{Math.round(factor.impact)}%</span>
                </div>
                <div className="factor-suggestion">{factor.suggestion}</div>
                <div className="factor-bar">
                  <div 
                    className="factor-progress" 
                    style={{ width: `${factor.impact}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="optimization-potential">
            <h4>优化潜力: {analytics.analytics.efficiency_analysis.optimization_potential}%</h4>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 模式识别视图
 */
const PatternsView: React.FC<{ analytics: any }> = ({ analytics }) => {
  return (
    <div className="patterns-view">
      <div className="section">
        <h3>🔍 识别的学习模式</h3>
        <div className="patterns-grid">
          {analytics.patterns.detected_patterns.map((pattern: any, index: number) => (
            <div key={index} className="pattern-card">
              <div className="pattern-header">
                <span className="pattern-type">{pattern.pattern_type}</span>
                <span className="confidence">{pattern.confidence_score}%</span>
              </div>
              <div className="pattern-description">{pattern.description}</div>
              <div className="pattern-stats">
                <div className="stat">
                  <label>强度:</label>
                  <span>{pattern.strength_score}%</span>
                </div>
                <div className="stat">
                  <label>预测力:</label>
                  <span>{pattern.predictive_power}%</span>
                </div>
                <div className="stat">
                  <label>频率:</label>
                  <span>{pattern.frequency}</span>
                </div>
              </div>
              <div className="pattern-outcomes">
                {pattern.associated_outcomes?.map((outcome: any, i: number) => (
                  <div key={i} className={`outcome ${outcome.outcome_type}`}>
                    <span className="outcome-type">{outcome.outcome_type}</span>
                    <span className="outcome-description">{outcome.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h3>🔮 模式预测</h3>
        <div className="predictions-timeline">
          {analytics.patterns.pattern_predictions.map((prediction: any, index: number) => (
            <div key={index} className="prediction-timeline-item">
              <div className="prediction-time">
                {prediction.estimated_time_to_next}分钟后
              </div>
              <div className="prediction-content">
                <div className="prediction-pattern">{prediction.pattern_id}</div>
                <div className="prediction-probability">
                  出现概率: {Math.round(prediction.next_occurrence_probability * 100)}%
                </div>
                <div className="prediction-intensity">
                  预测强度: {prediction.predicted_intensity}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h3>📈 模式统计</h3>
        <div className="pattern-statistics">
          <div className="stat-card">
            <h4>总模式数</h4>
            <div className="stat-value">{analytics.patterns.pattern_statistics.total_patterns}</div>
          </div>
          <div className="stat-card">
            <h4>高置信度模式</h4>
            <div className="stat-value">{analytics.patterns.pattern_statistics.high_confidence_patterns}</div>
          </div>
          <div className="stat-card">
            <h4>强模式</h4>
            <div className="stat-value">{analytics.patterns.pattern_statistics.strong_patterns}</div>
          </div>
          <div className="stat-card">
            <h4>预测性模式</h4>
            <div className="stat-value">{analytics.patterns.pattern_statistics.predictive_patterns}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 学习路径视图
 */
const PathsView: React.FC<{ analytics: any }> = ({ analytics }) => {
  return (
    <div className="paths-view">
      <div className="section">
        <h3>🛤️ 推荐学习路径</h3>
        <div className="paths-grid">
          {analytics.learning_paths.recommended_paths.map((path: any, index: number) => (
            <div key={index} className="path-card">
              <div className="path-header">
                <h4>{path.name}</h4>
                <div className="path-score">匹配度: {path.personalization_score}%</div>
              </div>
              <div className="path-description">{path.description}</div>
              <div className="path-stats">
                <div className="stat">
                  <label>预计时长:</label>
                  <span>{path.estimated_duration}小时</span>
                </div>
                <div className="stat">
                  <label>成功概率:</label>
                  <span>{Math.round(path.success_probability * 100)}%</span>
                </div>
                <div className="stat">
                  <label>模块数:</label>
                  <span>{path.learning_modules.length}</span>
                </div>
              </div>
              <div className="path-modules">
                <h5>学习模块:</h5>
                {path.learning_modules.slice(0, 3).map((module: any, i: number) => (
                  <div key={i} className="module-item">
                    <span className="module-type">{module.type}</span>
                    <span className="module-title">{module.title}</span>
                    <span className="module-time">{module.estimated_time}分钟</span>
                  </div>
                ))}
                {path.learning_modules.length > 3 && (
                  <div className="more-modules">...还有{path.learning_modules.length - 3}个模块</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h3>💡 路径推荐</h3>
        <div className="path-recommendations">
          {analytics.learning_paths.path_recommendations.map((rec: any, index: number) => (
            <div key={index} className="recommendation-card">
              <div className="rec-header">
                <h4>路径建议</h4>
                <div className="suitability">适合度: {rec.suitability_score}%</div>
              </div>
              <div className="rec-reason">{rec.recommendation_reason}</div>
              <div className="rec-details">
                <div className="challenge-level">挑战等级: {rec.challenge_level}</div>
                <div className="completion-time">完成时间: {rec.estimated_completion_time}小时</div>
              </div>
              <div className="resource-requirements">
                <h5>资源需求:</h5>
                {rec.resource_requirements?.map((req: any, i: number) => (
                  <div key={i} className="requirement-item">
                    <span className="req-type">{req.resource_type}</span>
                    <span className="req-desc">{req.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h3>🔀 替代方案</h3>
        <div className="alternative-approaches">
          {analytics.learning_paths.alternative_approaches.map((approach: any, index: number) => (
            <div key={index} className="approach-card">
              <div className="approach-header">
                <h4>{approach.approach_name}</h4>
                <div className="suitability">适合度: {approach.suitability_score}%</div>
              </div>
              <div className="approach-description">{approach.description}</div>
              <div className="trade-offs">
                <h5>权衡考虑:</h5>
                {approach.trade_offs.map((tradeOff: string, i: number) => (
                  <div key={i} className="trade-off-item">{tradeOff}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * 知识状态视图
 */
const KnowledgeView: React.FC<{ analytics: any }> = ({ analytics }) => {
  const knowledgeState = analytics.knowledge_state.current_state

  return (
    <div className="knowledge-view">
      {knowledgeState ? (
        <>
          <div className="section">
            <h3>🧠 当前知识状态</h3>
            <div className="knowledge-overview">
              <div className="overview-card">
                <h4>整体熟练度</h4>
                <div className="proficiency-circle">
                  <span className="proficiency-value">{knowledgeState.overall_proficiency}%</span>
                </div>
              </div>
              <div className="overview-card">
                <h4>状态置信度</h4>
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill" 
                    style={{ width: `${knowledgeState.state_confidence * 100}%` }}
                  />
                  <span className="confidence-text">{Math.round(knowledgeState.state_confidence * 100)}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="section">
            <h3>📚 概念掌握度</h3>
            <div className="concept-masteries">
              {knowledgeState.concept_masteries.map((mastery: any, index: number) => (
                <div key={index} className="mastery-card">
                  <div className="mastery-header">
                    <h4>{mastery.concept_id}</h4>
                    <div className="mastery-level">{mastery.mastery_level}%</div>
                  </div>
                  <div className="mastery-details">
                    <div className="detail">
                      <label>置信度:</label>
                      <span>{Math.round(mastery.confidence_score * 100)}%</span>
                    </div>
                    <div className="detail">
                      <label>稳定性:</label>
                      <span>{Math.round(mastery.mastery_stability * 100)}%</span>
                    </div>
                    <div className="detail">
                      <label>证据数:</label>
                      <span>{mastery.evidence_count}</span>
                    </div>
                  </div>
                  <div className="forgetting-curve">
                    <h5>遗忘曲线预测:</h5>
                    <div className="retention-predictions">
                      {mastery.forgetting_curve.predicted_retention.slice(0, 3).map((pred: any, i: number) => (
                        <div key={i} className="retention-item">
                          <span className="days">{pred.days_future}天后:</span>
                          <span className="retention">{Math.round(pred.predicted_retention * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <h3>⚠️ 知识缺口</h3>
            <div className="knowledge-gaps">
              {knowledgeState.knowledge_gaps.map((gap: any, index: number) => (
                <div key={index} className={`gap-card severity-${gap.severity}`}>
                  <div className="gap-header">
                    <h4>{gap.concept_id}</h4>
                    <div className="gap-severity">{gap.severity}</div>
                  </div>
                  <div className="gap-type">类型: {gap.gap_type}</div>
                  <div className="gap-impact">影响评分: {gap.impact_score}%</div>
                  <div className="gap-time">预计填补时间: {gap.estimated_time_to_fill}小时</div>
                  <div className="gap-interventions">
                    <h5>建议干预:</h5>
                    {gap.recommended_interventions.map((intervention: string, i: number) => (
                      <div key={i} className="intervention-item">{intervention}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <h3>✅ 学习准备度</h3>
            <div className="learning-readiness">
              {knowledgeState.learning_readiness.slice(0, 5).map((readiness: any, index: number) => (
                <div key={index} className="readiness-card">
                  <div className="readiness-header">
                    <h4>{readiness.concept_id}</h4>
                    <div className="readiness-score">{readiness.readiness_score}%</div>
                  </div>
                  <div className="readiness-details">
                    <div className="detail">
                      <label>先决条件满足:</label>
                      <span>{readiness.prerequisite_satisfaction}%</span>
                    </div>
                    <div className="detail">
                      <label>认知负荷预测:</label>
                      <span>{readiness.cognitive_load_prediction}%</span>
                    </div>
                    <div className="detail">
                      <label>最佳学习时间:</label>
                      <span>{readiness.optimal_learning_time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <h3>💪 优势领域</h3>
            <div className="strength-areas">
              {knowledgeState.strength_areas.map((area: string, index: number) => (
                <div key={index} className="strength-tag">{area}</div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="no-knowledge-state">
          <h3>🔍 等待知识状态分析</h3>
          <p>请先进行一些学习活动以建立知识状态模型</p>
        </div>
      )}
    </div>
  )
}

/**
 * 自适应测试视图
 */
const TestingView: React.FC<{ analytics: any }> = ({ analytics }) => {
  return (
    <div className="testing-view">
      <div className="section">
        <h3>🎯 自适应测试系统</h3>
        <div className="testing-overview">
          <div className="test-stats">
            <div className="stat-card">
              <h4>可用测试</h4>
              <div className="stat-value">{analytics.adaptive_testing.available_tests.length}</div>
            </div>
            <div className="stat-card">
              <h4>完成测试</h4>
              <div className="stat-value">{analytics.adaptive_testing.test_results.length}</div>
            </div>
            <div className="stat-card">
              <h4>能力评估</h4>
              <div className="stat-value">{analytics.adaptive_testing.capability_assessments.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <h3>📊 能力评估结果</h3>
        <div className="capability-assessments">
          {analytics.adaptive_testing.capability_assessments.map((assessment: any, index: number) => (
            <div key={index} className="assessment-card">
              <div className="assessment-header">
                <h4>{assessment.subject_domain}</h4>
                <div className="ability-estimate">{assessment.ability_estimate.toFixed(2)}</div>
              </div>
              <div className="assessment-details">
                <div className="detail">
                  <label>标准误差:</label>
                  <span>{assessment.standard_error.toFixed(3)}</span>
                </div>
                <div className="detail">
                  <label>可靠性:</label>
                  <span>{Math.round(assessment.reliability * 100)}%</span>
                </div>
                <div className="detail">
                  <label>百分位排名:</label>
                  <span>{assessment.percentile_rank}%</span>
                </div>
                <div className="detail">
                  <label>熟练程度:</label>
                  <span>{assessment.proficiency_level}</span>
                </div>
              </div>
              <div className="assessment-insights">
                <div className="strengths">
                  <h5>优势:</h5>
                  {assessment.strengths.map((strength: string, i: number) => (
                    <div key={i} className="strength-item">{strength}</div>
                  ))}
                </div>
                <div className="improvements">
                  <h5>改进领域:</h5>
                  {assessment.areas_for_improvement.map((area: string, i: number) => (
                    <div key={i} className="improvement-item">{area}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {analytics.adaptive_testing.current_session && (
        <div className="section">
          <h3>🔄 当前测试会话</h3>
          <div className="current-session">
            <div className="session-info">
              <h4>会话ID: {analytics.adaptive_testing.current_session.session_id}</h4>
              <div className="session-stats">
                <div className="stat">
                  <label>当前能力估计:</label>
                  <span>{analytics.adaptive_testing.current_session.current_ability_estimate.toFixed(2)}</span>
                </div>
                <div className="stat">
                  <label>标准误差:</label>
                  <span>{analytics.adaptive_testing.current_session.current_standard_error.toFixed(3)}</span>
                </div>
                <div className="stat">
                  <label>已完成项目:</label>
                  <span>{analytics.adaptive_testing.current_session.items_administered.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="section">
        <h3>🚀 测试功能</h3>
        <div className="testing-actions">
          <button className="btn-primary">开始诊断测试</button>
          <button className="btn-secondary">查看测试历史</button>
          <button className="btn-secondary">生成测试报告</button>
        </div>
      </div>
    </div>
  )
}

export default Phase2IntegratedExample 