import { Link } from 'react-router-dom'
import styles from './Navbar.module.css'

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className="container">
        <div className={styles.navContent}>
          <Link to="/" className={styles.logo}>
            EzA
          </Link>
          <div className={styles.navLinks}>
            <Link to="/login" className={styles.navLink}>
              登录
            </Link>
            <Link to="/register" className={`${styles.navLink} ${styles.cta}`}>
              立即开始
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 