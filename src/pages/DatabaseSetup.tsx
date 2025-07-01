import React, { useEffect, useState } from 'react';
import {
    checkEnvironmentConfig,
    createDemoData,
    DatabaseTestResult,
    getDatabaseStats,
    testDatabaseConnection
} from '../utils/databaseTest';
import styles from './DatabaseSetup.module.css';

interface DatabaseStats {
  userCount: number;
  setCount: number;
  cardCount: number;
  sessionCount: number;
  error?: string;
}

const DatabaseSetup: React.FC = () => {
  const [connectionResult, setConnectionResult] = useState<DatabaseTestResult | null>(null);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [envConfig, setEnvConfig] = useState(checkEnvironmentConfig());

  // 测试数据库连接
  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const result = await testDatabaseConnection();
      setConnectionResult(result);
      
      if (result.connected && result.tablesExist) {
        const statsResult = await getDatabaseStats();
        setStats(statsResult);
      }
    } catch (error) {
      console.error('测试连接失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 创建演示数据
  const handleCreateDemoData = async () => {
    setLoading(true);
    try {
      const result = await createDemoData();
      if (result.success) {
        alert('演示数据创建成功！');
        // 重新获取统计信息
        const statsResult = await getDatabaseStats();
        setStats(statsResult);
      } else {
        alert(`创建演示数据失败: ${result.error}`);
      }
    } catch (error) {
      alert('创建演示数据时发生错误');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时自动检查环境变量
  useEffect(() => {
    setEnvConfig(checkEnvironmentConfig());
  }, []);

  const getStatusIcon = (success: boolean) => success ? '✅' : '❌';
  const getStatusText = (success: boolean) => success ? '正常' : '异常';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🗄️ 数据库设置中心</h1>
        <p className={styles.subtitle}>配置和测试您的 Supabase 数据库连接</p>
      </div>

      {/* 环境变量检查 */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {getStatusIcon(envConfig.configured)} 环境变量配置
        </h2>
        
        {envConfig.configured ? (
          <div className={styles.success}>
            <p>✅ 所有必需的环境变量已配置完成</p>
            <div className={styles.envValues}>
              {Object.entries(envConfig.values).map(([key, value]) => (
                <div key={key} className={styles.envItem}>
                  <code>{key}</code>: <span className={styles.envValue}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.error}>
            <p>❌ 缺少必需的环境变量:</p>
            <ul className={styles.missingList}>
              {envConfig.missing.map(varName => (
                <li key={varName}><code>{varName}</code></li>
              ))}
            </ul>
            
            <div className={styles.instructions}>
              <h3>🔧 配置步骤:</h3>
              <ol>
                <li>在项目根目录创建 <code>.env</code> 文件</li>
                <li>添加以下内容:</li>
                <pre className={styles.envExample}>
{`VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`}
                </pre>
                <li>从 Supabase 项目仪表板获取真实的 URL 和密钥</li>
                <li>重启开发服务器</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* 数据库连接测试 */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {connectionResult ? getStatusIcon(connectionResult.connected && connectionResult.tablesExist) : '🔍'} 
          数据库连接测试
        </h2>
        
        <button 
          onClick={handleTestConnection}
          disabled={loading || !envConfig.configured}
          className={styles.testButton}
        >
          {loading ? '测试中...' : '🔍 测试数据库连接'}
        </button>

        {connectionResult && (
          <div className={styles.testResults}>
            <div className={styles.resultItem}>
              <span className={styles.resultLabel}>基本连接:</span>
              <span className={`${styles.resultValue} ${connectionResult.connected ? styles.success : styles.error}`}>
                {getStatusText(connectionResult.connected)}
              </span>
            </div>

            <div className={styles.resultItem}>
              <span className={styles.resultLabel}>用户认证:</span>
              <span className={`${styles.resultValue} ${connectionResult.user ? styles.success : styles.warning}`}>
                {connectionResult.user ? `已登录 (${connectionResult.user.email})` : '未登录 (可选)'}
              </span>
            </div>

            <div className={styles.resultItem}>
              <span className={styles.resultLabel}>数据表结构:</span>
              <span className={`${styles.resultValue} ${connectionResult.tablesExist ? styles.success : styles.error}`}>
                {getStatusText(connectionResult.tablesExist)}
              </span>
            </div>

            {connectionResult.tableNames.length > 0 && (
              <div className={styles.tableList}>
                <p>已检测到的数据表:</p>
                <div className={styles.tables}>
                  {connectionResult.tableNames.map(tableName => (
                    <span key={tableName} className={styles.tableChip}>{tableName}</span>
                  ))}
                </div>
              </div>
            )}

            {connectionResult.error && (
              <div className={styles.errorMessage}>
                <p>⚠️ 错误信息: {connectionResult.error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 数据库Schema设置 */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>🏗️ 数据库Schema设置</h2>
        
        {!connectionResult?.tablesExist ? (
          <div className={styles.schemaInstructions}>
            <p>📋 需要在 Supabase 中执行数据库Schema:</p>
            <ol>
              <li>打开 Supabase 项目仪表板</li>
              <li>进入 "SQL Editor" 页面</li>
              <li>执行 <code>database/schema.sql</code> (基础表结构)</li>
              <li>执行 <code>database/flashcards_schema.sql</code> (闪卡表结构)</li>
              <li>返回此页面重新测试连接</li>
            </ol>
            
            <div className={styles.schemaFiles}>
              <div className={styles.schemaFile}>
                <h4>📄 database/schema.sql</h4>
                <p>基础用户和课程管理表</p>
              </div>
              <div className={styles.schemaFile}>
                <h4>📄 database/flashcards_schema.sql</h4>
                <p>闪卡系统和FSRS算法支持表</p>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.success}>
            <p>✅ 数据库Schema已正确设置</p>
          </div>
        )}
      </div>

      {/* 演示数据 */}
      {connectionResult?.connected && connectionResult?.tablesExist && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🎨 演示数据</h2>
          
          {stats && (
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{stats.setCount}</div>
                <div className={styles.statLabel}>闪卡集</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{stats.cardCount}</div>
                <div className={styles.statLabel}>闪卡总数</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{stats.sessionCount}</div>
                <div className={styles.statLabel}>学习会话</div>
              </div>
            </div>
          )}

          <button 
            onClick={handleCreateDemoData}
            disabled={loading}
            className={styles.demoButton}
          >
            {loading ? '创建中...' : '🎨 创建演示数据'}
          </button>
          
          <p className={styles.demoNote}>
            💡 将创建一个包含JavaScript基础概念的演示闪卡集
          </p>
        </div>
      )}

      {/* 后续步骤 */}
      {connectionResult?.connected && connectionResult?.tablesExist && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🚀 下一步</h2>
          <div className={styles.nextSteps}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <span className={styles.stepText}>前往 <strong>复习中心</strong> 查看您的闪卡集</span>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <span className={styles.stepText}>开始创建您的第一个闪卡集</span>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <span className={styles.stepText}>体验FSRS智能复习算法</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseSetup; 