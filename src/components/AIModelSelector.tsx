import { AIModel } from '@/config/aiModel'
import { useAIModel } from '@/context/AIModelContext'
import React from 'react'
import styles from './AIModelSelector.module.css'

const AIModelSelector: React.FC = () => {
  const { model, setModel } = useAIModel()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setModel(e.target.value as AIModel)
  }

  return (
    <select className={styles.selector} value={model} onChange={handleChange}>
      <option value="gpt-4o-mini">GPT-4o mini (Fast)</option>
      <option value="gpt-4o">GPT-4o (Best Quality)</option>
    </select>
  )
}

export default AIModelSelector 