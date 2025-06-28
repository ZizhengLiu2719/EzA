import { useUser } from '@/context/UserContext'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './Login.module.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useUser()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginHeader}>
          <Link to="/" className={styles.logo}>EzA</Link>
          <h1>Welcome Back</h1>
          <p>Sign in to your EzA account to continue your learning journey</p>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
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
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button 
            type="submit" 
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className={styles.loginFooter}>
          <p>
            Don't have an account?{' '}
            <Link to="/register" className={styles.link}>
              Sign up now
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login 