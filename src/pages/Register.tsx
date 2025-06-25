import { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './Register.module.css'

const Register = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // TODO: 实现Supabase注册逻辑
    console.log('Register attempt:', { email, password })
    
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className={styles.registerPage}>
      <div className={styles.registerContainer}>
        <div className={styles.registerHeader}>
          <Link to="/" className={styles.logo}>EzA</Link>
          <h1>创建账户</h1>
          <p>开始你的智能学习之旅</p>
        </div>
        
        <form className={styles.registerForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email">邮箱地址</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="创建密码"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">确认密码</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={isLoading}
          >
            {isLoading ? '创建账户中...' : '创建账户'}
          </button>
        </form>
        
        <div className={styles.registerFooter}>
          <p>
            已有账户？{' '}
            <Link to="/login" className={styles.link}>
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register 