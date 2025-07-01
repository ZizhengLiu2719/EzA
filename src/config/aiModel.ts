export type AIModel = 'gpt-4o-mini' | 'o4-mini-high' | 'gpt-4o'

let currentModel: AIModel = (localStorage.getItem('ai_model') as AIModel) || 'gpt-4o-mini'

export function getAIModel(): AIModel {
  return currentModel
}

export function setAIModel(model: AIModel) {
  currentModel = model
  localStorage.setItem('ai_model', model)
} 