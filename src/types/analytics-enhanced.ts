// Phase 2: Advanced Learning Analytics & Adaptive Systems Types

import { LearningState } from './ai-enhanced'

// =============================================================================
// 学习分析引擎 (Learning Analytics Engine) Types
// =============================================================================

export interface LearningAnalyticsEngine {
  user_id: string
  analytics_config: AnalyticsConfig
  data_sources: DataSource[]
  analysis_models: AnalysisModel[]
  insights: LearningInsight[]
  predictions: LearningPrediction[]
}

export interface AnalyticsConfig {
  analysis_frequency: 'real_time' | 'hourly' | 'daily' | 'weekly'
  data_retention_days: number
  privacy_level: 'minimal' | 'standard' | 'comprehensive'
  predictive_modeling: boolean
  adaptive_recommendations: boolean
}

export interface DataSource {
  id: string
  type: 'interaction' | 'performance' | 'behavior' | 'assessment' | 'biometric'
  collection_method: 'automatic' | 'manual' | 'sensor'
  data_quality_score: number // 0-100
  last_updated: string
}

// =============================================================================
// 学习行为数据收集 (Learning Behavior Data Collection) Types
// =============================================================================

export interface BehaviorDataCollector {
  session_id: string
  user_id: string
  collection_start: string
  collection_end?: string
  data_points: BehaviorDataPoint[]
  aggregated_metrics: AggregatedBehaviorMetrics
}

export interface BehaviorDataPoint {
  timestamp: string
  event_type: BehaviorEventType
  event_data: Record<string, any>
  context: BehaviorContext
  significance_score: number // 0-100
}

export type BehaviorEventType = 
  | 'message_sent' | 'message_read' | 'pause_detected' | 'help_requested'
  | 'task_started' | 'task_completed' | 'task_abandoned' | 'error_made'
  | 'concept_mastered' | 'concept_struggled' | 'feedback_given' | 'feedback_received'
  | 'navigation_change' | 'focus_lost' | 'focus_regained' | 'session_pause'

export interface BehaviorContext {
  current_task?: string
  subject_domain: string
  difficulty_level: number // 1-10
  time_of_day: string
  session_duration: number // minutes
  cognitive_state: LearningState
}

export interface AggregatedBehaviorMetrics {
  engagement_score: number // 0-100
  focus_duration: number // minutes
  interaction_velocity: number // actions per minute
  help_seeking_ratio: number // 0-1
  error_recovery_time: number // seconds
  concept_transition_speed: number // concepts per hour
  preference_consistency: number // 0-100
}

// =============================================================================
// 学习模式识别算法 (Learning Pattern Recognition) Types
// =============================================================================

export interface PatternRecognitionEngine {
  algorithm_version: string
  training_data_size: number
  confidence_threshold: number
  detected_patterns: LearningPattern[]
  pattern_predictions: PatternPrediction[]
}

export interface LearningPattern {
  id: string
  pattern_type: PatternType
  description: string
  frequency: number
  confidence_score: number // 0-100
  first_detected: string
  last_observed: string
  associated_outcomes: PatternOutcome[]
  trigger_conditions: TriggerCondition[]
}

export type PatternType = 
  | 'learning_rhythm' | 'difficulty_progression' | 'concept_connection'
  | 'error_pattern' | 'engagement_cycle' | 'help_seeking' | 'mastery_pathway'
  | 'cognitive_load_pattern' | 'time_preference' | 'interaction_style'

export interface PatternOutcome {
  outcome_type: 'positive' | 'negative' | 'neutral'
  impact_score: number // 0-100
  description: string
  evidence: string[]
}

export interface TriggerCondition {
  condition_type: string
  condition_value: any
  probability: number // 0-1
}

export interface PatternPrediction {
  pattern_id: string
  next_occurrence_probability: number // 0-1
  estimated_time_to_next: number // minutes
  recommended_interventions: string[]
}

// =============================================================================
// 预测性学习路径规划 (Predictive Learning Path Planning) Types
// =============================================================================

export interface LearningPathPlanner {
  user_id: string
  current_knowledge_state: KnowledgeState
  learning_objectives: LearningObjective[]
  generated_paths: LearningPath[]
  optimization_criteria: OptimizationCriteria
  path_effectiveness_history: PathEffectiveness[]
}

export interface LearningPath {
  id: string
  name: string
  description: string
  estimated_duration: number // hours
  difficulty_progression: DifficultyProgression
  learning_modules: LearningModule[]
  prerequisite_knowledge: string[]
  predicted_outcomes: PredictedOutcome[]
  personalization_score: number // 0-100
}

export interface LearningModule {
  id: string
  title: string
  type: 'concept' | 'practice' | 'assessment' | 'project' | 'review'
  estimated_time: number // minutes
  difficulty_level: number // 1-10
  prerequisites: string[]
  learning_objectives: string[]
  adaptive_parameters: AdaptiveParameters
}

export interface AdaptiveParameters {
  min_mastery_threshold: number // 0-100
  max_attempts: number
  hint_availability: boolean
  peer_collaboration: boolean
  ai_assistance_level: 'minimal' | 'moderate' | 'high'
}

export interface DifficultyProgression {
  progression_type: 'linear' | 'exponential' | 'adaptive' | 'spiral'
  starting_difficulty: number // 1-10
  target_difficulty: number // 1-10
  adaptation_rate: number // 0-1
}

export interface PredictedOutcome {
  metric: string
  predicted_value: number
  confidence_interval: [number, number]
  timeframe: string
}

// =============================================================================
// 适应性测试系统 (Adaptive Testing System) Types
// =============================================================================

export interface AdaptiveTestingSystem {
  test_id: string
  test_configuration: TestConfiguration
  item_bank: TestItemBank
  adaptive_algorithm: AdaptiveAlgorithm
  current_session?: TestSession
  historical_sessions: TestSession[]
}

export interface TestConfiguration {
  subject_domain: string
  test_purpose: 'diagnostic' | 'formative' | 'summative' | 'placement'
  min_items: number
  max_items: number
  target_precision: number // 0-1
  stopping_criteria: StoppingCriteria
  difficulty_range: [number, number] // [min, max] difficulty
}

export interface StoppingCriteria {
  max_time_minutes?: number
  target_sem?: number // Standard Error of Measurement
  confidence_level?: number // 0-1
  min_reliability?: number // 0-1
}

export interface TestItemBank {
  total_items: number
  difficulty_distribution: Record<string, number>
  discrimination_range: [number, number]
  content_coverage: ContentArea[]
  item_response_theory_calibrated: boolean
}

export interface ContentArea {
  area_id: string
  area_name: string
  weight: number // 0-1
  item_count: number
  difficulty_levels: number[]
}

// =============================================================================
// 计算机化自适应测试 (CAT) Types
// =============================================================================

export interface CATEngine {
  irt_model: IRTModel
  item_selection_method: ItemSelectionMethod
  ability_estimation_method: AbilityEstimationMethod
  exposure_control: ExposureControl
  content_balancing: ContentBalancing
}

export interface IRTModel {
  model_type: '1PL' | '2PL' | '3PL' | 'GRM' | 'PCM'
  parameters: IRTParameters
  calibration_sample_size: number
  model_fit_statistics: ModelFitStatistics
}

export interface IRTParameters {
  difficulty?: number[] // b parameters
  discrimination?: number[] // a parameters  
  guessing?: number[] // c parameters
  [key: string]: number[] | undefined
}

export interface ModelFitStatistics {
  rmse: number
  chi_square: number
  df: number
  p_value: number
  fit_index: number
}

export type ItemSelectionMethod = 
  | 'maximum_information' | 'bayesian_expected_posterior'
  | 'kullback_leibler' | 'fisher_information' | 'progressive_restricted'

export type AbilityEstimationMethod = 
  | 'maximum_likelihood' | 'bayesian_modal' | 'expected_aposteriori'
  | 'weighted_likelihood' | 'robust_estimation'

export interface ExposureControl {
  method: 'none' | 'sympson_hetter' | 'stocking_lewis' | 'conditional_sht'
  target_exposure_rate: number // 0-1
  exposure_control_parameter: number
}

export interface ContentBalancing {
  enabled: boolean
  content_constraints: ContentConstraint[]
  balancing_method: 'shadow_test' | 'weighted_deviation' | 'constrained_selection'
}

export interface ContentConstraint {
  content_area: string
  min_items: number
  max_items: number
  weight: number
}

// =============================================================================
// 实时能力评估 (Real-time Capability Assessment) Types
// =============================================================================

export interface RealTimeAssessment {
  user_id: string
  assessment_session: AssessmentSession
  capability_estimates: CapabilityEstimate[]
  confidence_intervals: ConfidenceInterval[]
  assessment_trajectory: AssessmentPoint[]
  real_time_feedback: RealTimeFeedback[]
}

export interface AssessmentSession {
  session_id: string
  start_time: string
  current_time: string
  total_responses: number
  current_ability_estimate: number
  estimation_precision: number
  next_item_recommendation?: ItemRecommendation
}

export interface CapabilityEstimate {
  capability_domain: string
  estimated_ability: number // theta score
  standard_error: number
  confidence_level: number // 0-1
  reliability: number // 0-1
  measurement_precision: number
  estimation_method: string
  last_updated: string
}

export interface ConfidenceInterval {
  capability_domain: string
  lower_bound: number
  upper_bound: number
  confidence_level: number // 0-1
  margin_of_error: number
}

export interface AssessmentPoint {
  timestamp: string
  item_id: string
  response: any
  correct: boolean
  response_time: number // seconds
  ability_estimate_before: number
  ability_estimate_after: number
  information_gain: number
  difficulty_level: number
}

export interface RealTimeFeedback {
  timestamp: string
  feedback_type: 'immediate' | 'corrective' | 'explanatory' | 'encouraging'
  content: string
  triggers: string[]
  effectiveness_score?: number // 0-100
}

export interface ItemRecommendation {
  item_id: string
  estimated_difficulty: number
  information_value: number
  content_area: string
  rationale: string
  selection_confidence: number // 0-1
}

// =============================================================================
// 知识状态建模 (Knowledge State Modeling) Types
// =============================================================================

export interface KnowledgeStateModel {
  user_id: string
  domain: string
  knowledge_structure: KnowledgeStructure
  current_state: KnowledgeState
  state_history: KnowledgeStateSnapshot[]
  transition_probabilities: StateTransition[]
  mastery_predictions: MasteryPrediction[]
}

export interface KnowledgeStructure {
  concepts: Concept[]
  relationships: ConceptRelationship[]
  prerequisite_graph: PrerequisiteGraph
  learning_objectives_mapping: ObjectiveMapping[]
}

export interface Concept {
  concept_id: string
  name: string
  description: string
  difficulty_level: number // 1-10
  cognitive_complexity: CognitiveComplexity
  prerequisite_concepts: string[]
  related_concepts: string[]
  learning_resources: LearningResource[]
}

export interface CognitiveComplexity {
  blooms_level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'
  cognitive_load_estimate: number // 0-100
  abstract_level: 'concrete' | 'formal' | 'abstract'
}

export interface ConceptRelationship {
  from_concept: string
  to_concept: string
  relationship_type: 'prerequisite' | 'reinforces' | 'conflicts' | 'extends'
  strength: number // 0-1
  evidence_quality: number // 0-100
}

export interface PrerequisiteGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  topological_order: string[]
  critical_paths: string[][]
}

export interface GraphNode {
  concept_id: string
  depth_level: number
  importance_score: number // 0-100
  mastery_difficulty: number // 0-100
}

export interface GraphEdge {
  from_concept: string
  to_concept: string
  prerequisite_strength: number // 0-1
  learning_dependency: number // 0-1
}

export interface KnowledgeState {
  timestamp: string
  concept_masteries: ConceptMastery[]
  overall_proficiency: number // 0-100
  knowledge_gaps: KnowledgeGap[]
  strength_areas: string[]
  learning_readiness: LearningReadiness[]
}

export interface ConceptMastery {
  concept_id: string
  mastery_level: number // 0-100
  confidence_score: number // 0-1
  evidence_sources: EvidenceSource[]
  last_assessment: string
  mastery_stability: number // 0-1
  forgetting_curve_prediction: ForgettingCurve
}

export interface EvidenceSource {
  source_type: 'test' | 'practice' | 'project' | 'peer_assessment' | 'self_assessment'
  source_id: string
  evidence_weight: number // 0-1
  quality_score: number // 0-100
  timestamp: string
}

export interface ForgettingCurve {
  initial_strength: number // 0-1
  decay_rate: number
  retention_half_life: number // days
  predicted_retention: Array<{
    days_future: number
    predicted_retention: number
  }>
}

export interface KnowledgeGap {
  concept_id: string
  gap_type: 'missing_prerequisite' | 'partial_understanding' | 'misconception'
  severity: 'low' | 'medium' | 'high' | 'critical'
  recommended_interventions: string[]
  estimated_time_to_fill: number // hours
}

export interface LearningReadiness {
  concept_id: string
  readiness_score: number // 0-100
  prerequisite_satisfaction: number // 0-100
  cognitive_load_prediction: number // 0-100
  optimal_learning_time: string
}

export interface KnowledgeStateSnapshot {
  timestamp: string
  snapshot_trigger: 'time_based' | 'assessment' | 'milestone' | 'manual'
  state_data: KnowledgeState
  changes_from_previous: StateChange[]
}

export interface StateChange {
  concept_id: string
  change_type: 'mastery_increase' | 'mastery_decrease' | 'new_concept' | 'gap_identified' | 'gap_filled'
  magnitude: number
  evidence: string[]
}

export interface StateTransition {
  from_state: string
  to_state: string
  transition_probability: number // 0-1
  required_conditions: string[]
  estimated_time: number // hours
  intervention_effectiveness: Record<string, number>
}

export interface MasteryPrediction {
  concept_id: string
  current_mastery: number // 0-100
  predicted_mastery_timeline: Array<{
    timeframe: string // e.g., "1_week", "1_month"
    predicted_mastery: number
    confidence_interval: [number, number]
  }>
  factors_influencing_prediction: PredictionFactor[]
}

export interface PredictionFactor {
  factor_name: string
  impact_weight: number // 0-1
  current_value: number
  confidence: number // 0-1
}

// =============================================================================
// 综合分析结果 (Comprehensive Analysis Results) Types
// =============================================================================

export interface ComprehensiveAnalysisResult {
  user_id: string
  analysis_timestamp: string
  analysis_scope: AnalysisScope
  learning_analytics: LearningAnalyticsResult
  behavior_insights: BehaviorInsights
  pattern_analysis: PatternAnalysisResult
  path_recommendations: PathRecommendationResult
  assessment_insights: AssessmentInsights
  capability_profile: CapabilityProfile
  knowledge_model_update: KnowledgeModelUpdate
  actionable_recommendations: ActionableRecommendation[]
}

export interface AnalysisScope {
  time_period: string
  data_sources_included: string[]
  analysis_depth: 'surface' | 'moderate' | 'deep' | 'comprehensive'
  confidence_level: number // 0-1
}

export interface LearningAnalyticsResult {
  overall_learning_effectiveness: number // 0-100
  learning_velocity_trend: 'increasing' | 'stable' | 'decreasing'
  optimal_learning_conditions: OptimalConditions
  predicted_performance: PerformancePrediction[]
}

export interface OptimalConditions {
  best_time_of_day: string[]
  optimal_session_length: number // minutes
  preferred_difficulty_progression: DifficultyProgression
  most_effective_teaching_methods: string[]
}

export interface PerformancePrediction {
  metric: string
  timeframe: string
  predicted_value: number
  confidence_interval: [number, number]
  influencing_factors: string[]
}

export interface BehaviorInsights {
  dominant_behavior_patterns: string[]
  learning_efficiency_score: number // 0-100
  engagement_sustainability: number // 0-100
  adaptation_speed: 'slow' | 'medium' | 'fast'
  behavioral_change_recommendations: string[]
}

export interface PatternAnalysisResult {
  newly_discovered_patterns: LearningPattern[]
  pattern_strength_changes: Array<{
    pattern_id: string
    old_strength: number
    new_strength: number
    trend: 'strengthening' | 'weakening' | 'stable'
  }>
  pattern_based_predictions: PatternPrediction[]
}

export interface PathRecommendationResult {
  recommended_learning_paths: LearningPath[]
  path_optimization_suggestions: PathOptimization[]
  alternative_approaches: AlternativeApproach[]
}

export interface PathOptimization {
  current_path_id: string
  optimization_type: 'time_reduction' | 'effectiveness_improvement' | 'engagement_enhancement'
  suggested_changes: string[]
  expected_improvement: number // 0-100
}

export interface AlternativeApproach {
  approach_name: string
  description: string
  suitability_score: number // 0-100
  trade_offs: string[]
}

export interface AssessmentInsights {
  current_ability_levels: Record<string, number>
  assessment_reliability: number // 0-1
  growth_trajectory: GrowthTrajectory
  recommended_next_assessments: string[]
}

export interface GrowthTrajectory {
  overall_trend: 'accelerating' | 'linear' | 'plateauing' | 'declining'
  growth_rate: number // per unit time
  projected_milestones: Milestone[]
}

export interface Milestone {
  milestone_name: string
  estimated_achievement_date: string
  confidence: number // 0-1
  required_conditions: string[]
}

export interface CapabilityProfile {
  strengths: string[]
  areas_for_improvement: string[]
  capability_stability: Record<string, number>
  transfer_potential: TransferPotential[]
}

export interface TransferPotential {
  from_domain: string
  to_domain: string
  transfer_likelihood: number // 0-1
  facilitating_factors: string[]
}

export interface KnowledgeModelUpdate {
  concepts_mastered: string[]
  concepts_requiring_attention: string[]
  knowledge_structure_changes: StructureChange[]
  mastery_predictions_updated: string[]
}

export interface StructureChange {
  change_type: 'new_concept' | 'concept_relationship' | 'prerequisite_update' | 'mastery_threshold'
  description: string
  impact_assessment: string
}

export interface ActionableRecommendation {
  id: string
  category: 'immediate' | 'short_term' | 'long_term' | 'strategic'
  priority: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
  rationale: string
  expected_outcome: string
  implementation_effort: 'minimal' | 'moderate' | 'significant'
  success_metrics: string[]
  timeline: string
}

// =============================================================================
// Analysis Model Types
// =============================================================================

export interface AnalysisModel {
  model_id: string
  model_name: string
  model_type: 'statistical' | 'machine_learning' | 'deep_learning' | 'rule_based' | 'hybrid'
  version: string
  description: string
  input_features: ModelFeature[]
  output_predictions: ModelOutput[]
  performance_metrics: ModelPerformance
  training_data: TrainingDataInfo
  deployment_info: DeploymentInfo
}

export interface ModelFeature {
  feature_name: string
  feature_type: 'numerical' | 'categorical' | 'boolean' | 'text' | 'temporal'
  importance_score: number // 0-1
  description: string
}

export interface ModelOutput {
  output_name: string
  output_type: 'prediction' | 'classification' | 'ranking' | 'clustering' | 'anomaly_detection'
  confidence_measure: string
  interpretation: string
}

export interface ModelPerformance {
  accuracy?: number // 0-1
  precision?: number // 0-1
  recall?: number // 0-1
  f1_score?: number // 0-1
  auc_roc?: number // 0-1
  rmse?: number
  mae?: number
  cross_validation_score?: number // 0-1
  last_evaluated: string
}

export interface TrainingDataInfo {
  data_size: number
  data_quality_score: number // 0-100
  training_period: string
  feature_coverage: number // 0-1
  label_quality: number // 0-1
  data_freshness: string
}

export interface DeploymentInfo {
  deployment_date: string
  environment: 'development' | 'staging' | 'production'
  monitoring_enabled: boolean
  auto_retraining: boolean
  performance_threshold: number
  last_retrained?: string
}

export interface LearningInsight {
  insight_id: string
  insight_type: 'behavior' | 'performance' | 'preference' | 'pattern' | 'prediction'
  title: string
  description: string
  significance_score: number // 0-100
  confidence_level: number // 0-1
  evidence: InsightEvidence[]
  actionable_items: string[]
  generated_at: string
  expires_at?: string
}

export interface InsightEvidence {
  evidence_type: 'statistical' | 'observational' | 'comparative' | 'predictive'
  data_source: string
  evidence_strength: number // 0-1
  description: string
}

export interface LearningPrediction {
  prediction_id: string
  prediction_type: 'performance' | 'behavior' | 'outcome' | 'risk' | 'opportunity'
  target_metric: string
  predicted_value: number
  confidence_interval: [number, number]
  probability: number // 0-1
  timeframe: string
  factors: PredictionFactor[]
  uncertainty_sources: string[]
  generated_at: string
  validation_status?: 'pending' | 'confirmed' | 'rejected' | 'partially_confirmed'
}

export interface LearningObjective {
  objective_id: string
  title: string
  description: string
  objective_type: 'knowledge' | 'skill' | 'attitude' | 'behavior'
  bloom_level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'
  difficulty_level: number // 1-10
  estimated_time: number // hours
  prerequisites: string[]
  success_criteria: SuccessCriteria[]
  assessment_methods: string[]
}

export interface SuccessCriteria {
  criterion: string
  measurement_method: string
  threshold: number
  weight: number // 0-1
}

export interface OptimizationCriteria {
  primary_goal: 'time_efficiency' | 'learning_effectiveness' | 'engagement' | 'retention' | 'transfer'
  constraints: OptimizationConstraint[]
  weights: Record<string, number>
  optimization_algorithm: 'genetic' | 'gradient_descent' | 'bayesian' | 'reinforcement_learning'
}

export interface OptimizationConstraint {
  constraint_type: 'time_limit' | 'difficulty_bound' | 'resource_availability' | 'prerequisite_order'
  constraint_value: any
  flexibility: 'strict' | 'preferred' | 'flexible'
}

export interface PathEffectiveness {
  path_id: string
  user_completion_rate: number // 0-1
  average_completion_time: number // hours
  learning_outcome_achievement: number // 0-100
  user_satisfaction_score: number // 0-100
  knowledge_retention_rate: number // 0-1
  transfer_success_rate: number // 0-1
  effectiveness_trend: 'improving' | 'stable' | 'declining'
  last_evaluated: string
}

export interface TestSession {
  session_id: string
  user_id: string
  test_configuration_id: string
  start_time: string
  end_time?: string
  status: 'in_progress' | 'completed' | 'terminated' | 'paused'
  items_administered: TestItem[]
  current_ability_estimate: number
  current_standard_error: number
  stopping_reason?: 'max_items' | 'target_precision' | 'time_limit' | 'user_termination'
  final_score?: number
  reliability_estimate?: number
}

export interface TestItem {
  item_id: string
  content: string
  item_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'performance'
  difficulty_parameter: number // IRT b parameter
  discrimination_parameter?: number // IRT a parameter
  guessing_parameter?: number // IRT c parameter
  content_area: string
  cognitive_level: string
  estimated_time: number // seconds
  response?: any
  correct?: boolean
  response_time?: number // seconds
  administration_timestamp?: string
}

export interface LearningResource {
  resource_id: string
  title: string
  type: 'text' | 'video' | 'interactive' | 'simulation' | 'assessment' | 'game'
  url?: string
  difficulty_level: number // 1-10
  estimated_time: number // minutes
  effectiveness_rating: number // 0-100
  user_rating?: number // 0-5
}

export interface ObjectiveMapping {
  objective_id: string
  mapped_concepts: string[]
  coverage_percentage: number // 0-100
  alignment_strength: number // 0-1
} 