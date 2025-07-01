import { AIModel, getAIModel, setAIModel } from '@/config/aiModel'
import React, { createContext, useContext, useEffect, useState } from 'react'

interface AIModelContextValue {
  model: AIModel
  setModel: (model: AIModel) => void
}

const AIModelContext = createContext<AIModelContextValue | undefined>(undefined)

export const AIModelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [model, setModelState] = useState<AIModel>(getAIModel())

  const updateModel = (newModel: AIModel) => {
    setModelState(newModel)
    setAIModel(newModel)
  }

  // 当 localStorage 变化时同步（多标签页场景）
  useEffect(() => {
    const handler = () => {
      const stored = getAIModel()
      if (stored !== model) setModelState(stored)
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [model])

  return (
    <AIModelContext.Provider value={{ model, setModel: updateModel }}>
      {children}
    </AIModelContext.Provider>
  )
}

export const useAIModel = () => {
  const ctx = useContext(AIModelContext)
  if (!ctx) throw new Error('useAIModel must be used within AIModelProvider')
  return ctx
} 