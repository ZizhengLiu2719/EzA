/**
 * 数据库连接测试工具
 * 用于验证Supabase连接和表结构
 */

import { supabase } from '../api/supabase';

export interface DatabaseTestResult {
  connected: boolean;
  user: any;
  tablesExist: boolean;
  tableNames: string[];
  error?: string;
}

/**
 * 测试数据库连接
 */
export async function testDatabaseConnection(): Promise<DatabaseTestResult> {
  const result: DatabaseTestResult = {
    connected: false,
    user: null,
    tablesExist: false,
    tableNames: []
  };

  try {
    // 测试基本连接
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError && userError.message !== 'No user found') {
      result.error = `认证错误: ${userError.message}`;
      return result;
    }

    result.user = user;
    result.connected = true;

    // 测试表是否存在 - 根据用户提供的表结构更新
    const requiredTables = [
      'users',
      'flashcard_sets', 
      'flashcards',
      'study_sessions', // 用户数据库中是 study_sessions 而不是 review_sessions
      'review_logs',
      'fsrs_parameters'
    ];

    const tableTests = await Promise.all(
      requiredTables.map(async (tableName) => {
        try {
          const { error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          return { tableName, exists: !error };
        } catch (e) {
          return { tableName, exists: false };
        }
      })
    );

    result.tableNames = tableTests.filter(t => t.exists).map(t => t.tableName);
    result.tablesExist = tableTests.every(t => t.exists);

    if (!result.tablesExist) {
      const missingTables = tableTests.filter(t => !t.exists).map(t => t.tableName);
      result.error = `缺少以下数据表: ${missingTables.join(', ')}`;
    }

  } catch (error) {
    result.error = error instanceof Error ? error.message : '未知错误';
  }

  return result;
}

/**
 * 创建演示数据
 */
export async function createDemoData(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: '用户未登录' };
    }

    // 创建演示闪卡集
    const { data: demoSet, error: setError } = await supabase
      .from('flashcard_sets')
      .insert({
        user_id: user.id,
        title: '🚀 JavaScript 基础演示',
        description: '演示闪卡集，包含 JavaScript 基础概念',
        subject: 'programming',
        difficulty: 3,
        tags: ['javascript', 'demo', 'programming'],
        visibility: 'private'
      })
      .select()
      .single();

    if (setError) {
      return { success: false, error: `创建闪卡集失败: ${setError.message}` };
    }

    // 创建演示闪卡
    const demoCards = [
      {
        set_id: demoSet.id,
        question: '什么是 JavaScript 中的闭包（Closure）？',
        answer: '闭包是指一个函数可以访问其外部作用域中的变量，即使在外部函数已经执行完毕后。闭包使得内部函数能够"记住"它被创建时的环境。',
        hint: '考虑函数作用域和变量访问',
        explanation: '闭包是 JavaScript 中的核心概念，它使得函数式编程模式成为可能，也是许多设计模式的基础。',
        card_type: 'basic',
        tags: ['closure', 'javascript', 'function']
      },
      {
        set_id: demoSet.id,
        question: '请解释 JavaScript 中的 _____ 关键字用于声明块级作用域变量。',
        answer: 'let',
        hint: 'ES6 引入的变量声明方式',
        explanation: 'let 关键字声明的变量具有块级作用域，不会发生变量提升，也不能重复声明。',
        card_type: 'cloze',
        tags: ['let', 'scope', 'es6']
      },
      {
        set_id: demoSet.id,
        question: '以下哪个方法用于添加事件监听器？',
        answer: 'addEventListener()',
        hint: '用于DOM事件处理',
        explanation: 'addEventListener() 方法用于向元素添加事件监听器，是现代 JavaScript 中处理事件的标准方式。',
        card_type: 'basic',
        tags: ['dom', 'events', 'api']
      }
    ];

    const { error: cardsError } = await supabase
      .from('flashcards')
      .insert(demoCards);

    if (cardsError) {
      return { success: false, error: `创建演示卡片失败: ${cardsError.message}` };
    }

    return { success: true };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '创建演示数据时发生未知错误' 
    };
  }
}

/**
 * 检查环境变量配置
 */
export function checkEnvironmentConfig(): { 
  configured: boolean; 
  missing: string[]; 
  values: Record<string, string | undefined> 
} {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  const missing: string[] = [];
  const values: Record<string, string | undefined> = {};

  requiredEnvVars.forEach(varName => {
    const value = import.meta.env[varName];
    values[varName] = value ? `${value.substring(0, 20)}...` : undefined;
    
    if (!value || value.includes('your_') || value === '') {
      missing.push(varName);
    }
  });

  return {
    configured: missing.length === 0,
    missing,
    values
  };
}

/**
 * 获取数据库统计信息
 */
export async function getDatabaseStats(): Promise<{
  userCount: number;
  setCount: number;
  cardCount: number;
  sessionCount: number;
  error?: string;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { userCount: 0, setCount: 0, cardCount: 0, sessionCount: 0, error: '用户未登录' };
    }

    // 使用用户实际的表结构
    const [setsResult, cardsResult, sessionsResult] = await Promise.all([
      supabase.from('flashcard_sets').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('flashcards').select('id', { count: 'exact' }),
      supabase.from('study_sessions').select('id', { count: 'exact' }).eq('user_id', user.id)
    ]);

    return {
      userCount: 1, // 当前用户
      setCount: setsResult.count || 0,
      cardCount: cardsResult.count || 0,
      sessionCount: sessionsResult.count || 0
    };

  } catch (error) {
    return {
      userCount: 0,
      setCount: 0,
      cardCount: 0,
      sessionCount: 0,
      error: error instanceof Error ? error.message : '获取统计信息失败'
    };
  }
} 