import { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './Login.module.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // TODO: 实现Supabase登录逻辑
    console.log('Login attempt:', { email, password })
    
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginHeader}>
          <Link to="/" className={styles.logo}>EzA</Link>
          <h1>欢迎回来</h1>
          <p>登录你的EzA账户，继续你的学习之旅</p>
        </div>
        
        <form className={styles.loginForm} onSubmit={handleSubmit}>
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
              placeholder="输入你的密码"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={isLoading}
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>
        
        <div className={styles.loginFooter}>
          <p>
            还没有账户？{' '}
            <Link to="/register" className={styles.link}>
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login 