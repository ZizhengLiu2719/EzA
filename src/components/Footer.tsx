import styles from './Footer.module.css'

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>EzA</h3>
            <p className={styles.footerDescription}>
              AI驱动的学习成功系统，让每个学生都能轻松掌控学期节奏。
            </p>
          </div>
          
          <div className={styles.footerSection}>
            <h4 className={styles.sectionTitle}>产品</h4>
            <ul className={styles.footerLinks}>
              <li><a href="#features">功能特色</a></li>
              <li><a href="#pricing">定价</a></li>
              <li><a href="#demo">演示</a></li>
            </ul>
          </div>
          
          <div className={styles.footerSection}>
            <h4 className={styles.sectionTitle}>支持</h4>
            <ul className={styles.footerLinks}>
              <li><a href="#help">帮助中心</a></li>
              <li><a href="#contact">联系我们</a></li>
              <li><a href="#feedback">反馈</a></li>
            </ul>
          </div>
          
          <div className={styles.footerSection}>
            <h4 className={styles.sectionTitle}>法律</h4>
            <ul className={styles.footerLinks}>
              <li><a href="#privacy">隐私政策</a></li>
              <li><a href="#terms">服务条款</a></li>
            </ul>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <p>&copy; 2024 EzA. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer 