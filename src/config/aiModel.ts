export type AIModel = 'gpt-4o-mini' | 'gpt-4o'

// 兼容旧存储值 (o4-mini / o4-mini-high)
const rawStored = localStorage.getItem('ai_model') as string | null
const normalize = (val: string | null): AIModel => {
  switch (val) {
    case 'o4-mini':
      return 'gpt-4o-mini'
    case 'o4-mini-high':
      return 'gpt-4o'
    case 'gpt-4o-mini':
    case 'gpt-4o':
      return val as AIModel
    default:
      return 'gpt-4o-mini'
  }
}

let currentModel: AIModel = normalize(rawStored)

export function getAIModel(): AIModel {
  return currentModel
}

export function setAIModel(model: AIModel) {
  currentModel = model
  localStorage.setItem('ai_model', model)
} 