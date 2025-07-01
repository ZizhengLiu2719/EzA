/**
 * 测试数据 - 用于验证核心学习流程
 */

import { FSRSCard, FSRSState } from '../types/SRSTypes';

// 创建演示闪卡集数据
export const createDemoFlashcardSets = () => {
  return [
    {
      id: 'calculus-bc-demo',
      title: 'Calculus BC - Derivatives & Integrals',
      description: 'Advanced calculus concepts for AP Calculus BC',
      subject: 'Mathematics',
      cardCount: 45,
      difficulty: 4 as const,
      isPublic: false,
      author: 'Demo User',
      lastStudied: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      masteryLevel: 78,
      estimatedStudyTime: 25,
      tags: ['calculus', 'derivatives', 'integrals', 'ap-exam'],
      dueForReview: true,
      nextReview: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
    },
    {
      id: 'organic-chemistry-demo',
      title: 'Organic Chemistry - Reaction Mechanisms',
      description: 'Key organic chemistry reaction mechanisms and pathways',
      subject: 'Chemistry',
      cardCount: 32,
      difficulty: 5 as const,
      isPublic: false,
      author: 'Demo User',
      lastStudied: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      masteryLevel: 65,
      estimatedStudyTime: 40,
      tags: ['organic', 'reactions', 'mechanisms', 'chemistry'],
      dueForReview: true,
      nextReview: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
    },
    {
      id: 'us-history-demo',
      title: 'US History - Civil War Era (1850-1870)',
      description: 'American Civil War and Reconstruction period',
      subject: 'History',
      cardCount: 28,
      difficulty: 3 as const,
      isPublic: false,
      author: 'Demo User',
      lastStudied: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      masteryLevel: 92,
      estimatedStudyTime: 15,
      tags: ['civil-war', 'reconstruction', 'american-history'],
      dueForReview: false,
      nextReview: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
    },
    {
      id: 'javascript-basics-demo',
      title: '🚀 JavaScript 基础概念',
      description: 'JavaScript核心概念和语法',
      subject: 'Programming',
      cardCount: 22,
      difficulty: 2 as const,
      isPublic: false,
      author: 'Demo User',
      lastStudied: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      masteryLevel: 84,
      estimatedStudyTime: 18,
      tags: ['javascript', 'programming', 'web-development'],
      dueForReview: true,
      nextReview: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
    }
  ];
};

// 创建演示卡片数据 - 用于学习模式测试
export const createDemoCards = (setId: string): FSRSCard[] => {
  const cardTemplates = {
    'calculus-bc-demo': [
      {
        question: '求 f(x) = x³ + 2x² - 5x + 1 的导数',
        answer: "f'(x) = 3x² + 4x - 5",
        hint: '使用幂法则：d/dx[xⁿ] = nx^(n-1)',
        explanation: '对每一项分别求导：d/dx[x³] = 3x²，d/dx[2x²] = 4x，d/dx[-5x] = -5，常数项导数为0',
        tags: ['derivatives', 'polynomial', 'power-rule']
      },
      {
        question: '计算定积分 ∫₀² (x² + 1) dx',
        answer: '14/3',
        hint: '先求不定积分，再计算定积分',
        explanation: '∫(x² + 1)dx = x³/3 + x + C，计算 [x³/3 + x]₀² = (8/3 + 2) - 0 = 14/3',
        tags: ['integrals', 'definite-integral', 'polynomial']
      },
      {
        question: '什么是链式法则（Chain Rule）？',
        answer: '复合函数的导数等于外函数导数乘以内函数导数：d/dx[f(g(x))] = f\'(g(x)) · g\'(x)',
        hint: '用于求复合函数的导数',
        explanation: '链式法则是微积分中的基本规则，当我们有嵌套函数时使用',
        tags: ['chain-rule', 'derivatives', 'composite-functions']
      },
      {
        question: '计算 lim(x→0) (sin x)/x 的值',
        answer: '1',
        hint: '这是一个重要的三角极限',
        explanation: '这是微积分中的基本极限之一，可以通过洛必达法则或几何方法证明',
        tags: ['limits', 'trigonometric', 'fundamental-limit']
      }
    ],
    'organic-chemistry-demo': [
      {
        question: 'SN1反应的机理是什么？',
        answer: '两步机理：1) 离去基团离开形成碳正离子中间体，2) 亲核试剂攻击碳正离子',
        hint: '考虑反应速率和立体化学',
        explanation: 'SN1（单分子亲核取代）反应速率只依赖于底物浓度，通常发生在三级碳上',
        tags: ['sn1', 'nucleophilic-substitution', 'carbocation']
      },
      {
        question: 'E2消除反应需要什么条件？',
        answer: '强碱、反式共平面构象、通常在二级碳上发生',
        hint: '考虑立体化学要求',
        explanation: 'E2是双分子消除反应，要求β-氢和离去基团处于反式共平面位置',
        tags: ['e2', 'elimination', 'stereochemistry']
      }
    ],
    'us-history-demo': [
      {
        question: '南北战争开始于哪一年？',
        answer: '1861年',
        hint: '在萨姆特堡事件之后',
        explanation: '1861年4月12日，南方军队炮轰萨姆特堡，标志着南北战争的开始',
        tags: ['civil-war', 'dates', '1861']
      },
      {
        question: '《解放黑奴宣言》是什么时候颁布的？',
        answer: '1863年1月1日',
        hint: '战争进行到中期',
        explanation: '林肯总统在1863年1月1日正式颁布解放黑奴宣言，解放叛乱州的奴隶',
        tags: ['emancipation-proclamation', 'lincoln', '1863']
      }
    ],
    'javascript-basics-demo': [
      {
        question: 'JavaScript中什么是闭包（Closure）？',
        answer: '闭包是指一个函数可以访问其外部作用域中的变量，即使在外部函数已经执行完毕后',
        hint: '考虑函数作用域和变量访问',
        explanation: '闭包是JavaScript中的核心概念，它使得内部函数能够"记住"它被创建时的环境',
        tags: ['closure', 'scope', 'functions']
      },
      {
        question: 'let、const和var的区别是什么？',
        answer: 'var有函数作用域和变量提升；let和const有块级作用域，const声明的变量不能重新赋值',
        hint: '考虑作用域和变量提升',
        explanation: 'ES6引入了let和const来解决var的一些问题，提供了更好的作用域控制',
        tags: ['variables', 'scope', 'es6']
      }
    ]
  };

  const templates = cardTemplates[setId as keyof typeof cardTemplates] || cardTemplates['javascript-basics-demo'];
  
  return templates.map((template, index) => ({
    id: `${setId}-card-${index + 1}`,
    question: template.question,
    answer: template.answer,
    hint: template.hint,
    explanation: template.explanation,
    tags: template.tags,
    state: Math.random() > 0.7 ? FSRSState.NEW : FSRSState.REVIEW,
    due: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random time in past 24h
    stability: Math.random() * 10 + 1,
    difficulty: Math.random() * 8 + 2,
    elapsed_days: Math.floor(Math.random() * 30),
    scheduled_days: Math.floor(Math.random() * 10) + 1,
    reps: Math.floor(Math.random() * 5),
    lapses: Math.floor(Math.random() * 2),
    last_review: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    total_time: Math.floor(Math.random() * 300) + 30, // 30-330 seconds total time
    average_time: Math.floor(Math.random() * 60) + 10, // 10-70 seconds average time
    success_rate: Math.random() * 0.4 + 0.6, // 60-100% success rate
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    updated_at: new Date(),
    subject: 'Demo Subject'
  }));
};

// 模拟获取待复习卡片
export const getMockDueCards = (setId: string): FSRSCard[] => {
  const allCards = createDemoCards(setId);
  // 返回需要复习的卡片（随机选择一些）
  return allCards.filter(() => Math.random() > 0.4); // 60%的卡片需要复习
};

// 计算统计数据
export const calculateMockStats = () => {
  const sets = createDemoFlashcardSets();
  return {
    totalSets: sets.length,
    totalCards: sets.reduce((sum, set) => sum + set.cardCount, 0),
    averageMastery: Math.round(sets.reduce((sum, set) => sum + set.masteryLevel, 0) / sets.length),
    streak: 7,
    dueForReview: sets.filter(set => set.dueForReview).length
  };
}; 