import { useUser } from '@/context/UserContext'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './Register.module.css'

const Register = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { signUp } = useUser()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setIsLoading(true)
    try {
      await signUp(email, password)
      setSuccess('Registration successful! Please check your email to activate your account.')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.registerPage}>
      <div className={styles.registerContainer}>
        <div className={styles.registerHeader}>
          <Link to="/" className={styles.logo}>EzA</Link>
          <h1>Create Account</h1>
          <p>Start your intelligent learning journey</p>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
        <form className={styles.registerForm} onSubmit={handleSubmit}>
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
              placeholder="Create a password"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Enter password again"
              required
            />
          </div>
          <button 
            type="submit" 
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <div className={styles.registerFooter}>
          <p>
            Already have an account?{' '}
            <Link to="/login" className={styles.link}>
              Sign in now
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register 