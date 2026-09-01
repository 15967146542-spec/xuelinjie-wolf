import type {
  TeacherStock,
  KLinePoint,
  MacroFactor,
  CourseSession,
  EvaluationItem,
  TaskItem,
  RankingUser,
  DragonTigerItem,
  WeeklyTitle,
  UserProfile,
  Order,
  Position
} from '@/types'

export const initialMacroFactor: MacroFactor = {
  id: 'macro-2026-09',
  title: '开学选课季·宏观稳健指数',
  indexValue: 1.08,
  description: '学期初大盘流动性充裕，选课热度高涨，宏观因子保持温和正向贡献（+0.54%）。',
  updatedAt: '2026-09-01 09:30:00',
  alpha: 0.02,   // 评价因子敏感系数
  beta: 0.10,    // 资金流向敏感系数
  gamma: 0.005,  // 宏观因子敏感系数
  sigma: 0.015   // 随机扰动标准差
}

export const initialStocks: TeacherStock[] = [
  {
    code: '1001',
    name: '高数张',
    teacherName: '张建国 教授',
    course: '高等数学 (上/下)',
    department: '数理学院',
    currentPrice: 106.80,
    prevClose: 102.40,
    openPrice: 103.00,
    highPrice: 108.50,
    lowPrice: 102.10,
    volume: 184500,
    amount: 19520100,
    rating: 4.8,
    ratingCount: 342,
    last5AvgRating: 4.85,
    netInflow: 423000,
    marketCap: 10680000,
    description: '讲课风趣生动，板书极其工整，期末押题精准度高，素有“考研数学定海神针”之称。',
    isWatchlisted: true,
    recentRatings: [4.9, 4.8, 4.7, 4.9, 4.9]
  },
  {
    code: '1002',
    name: '线代李',
    teacherName: '李明华 副教授',
    course: '线性代数与矩阵论',
    department: '数理学院',
    currentPrice: 95.40,
    prevClose: 98.20,
    openPrice: 97.50,
    highPrice: 98.00,
    lowPrice: 94.20,
    volume: 112000,
    amount: 10729600,
    rating: 4.2,
    ratingCount: 210,
    last5AvgRating: 4.05,
    netInflow: -186000,
    marketCap: 9540000,
    description: '推导严密硬核，几何直观解释清晰，不过平时作业量偏大，点名率较高。',
    isWatchlisted: false,
    recentRatings: [4.1, 4.0, 4.3, 3.9, 4.0]
  },
  {
    code: '1003',
    name: '英语陈',
    teacherName: '陈雅婷 讲师',
    course: '大学综合英语 III',
    department: '外国语学院',
    currentPrice: 114.20,
    prevClose: 108.60,
    openPrice: 109.20,
    highPrice: 115.00,
    lowPrice: 108.80,
    volume: 246000,
    amount: 27552000,
    rating: 4.9,
    ratingCount: 512,
    last5AvgRating: 4.92,
    netInflow: 852000,
    marketCap: 11420000,
    description: '发音地道纯正，课堂互动丰富，给分极其包容，学生口碑极佳的热门标的。',
    isWatchlisted: true,
    recentRatings: [5.0, 4.9, 4.8, 5.0, 4.9]
  },
  {
    code: '1004',
    name: '物化王',
    teacherName: '王崇德 教授',
    course: '大学物理 (A)',
    department: '数理学院',
    currentPrice: 88.60,
    prevClose: 91.00,
    openPrice: 90.50,
    highPrice: 91.20,
    lowPrice: 87.80,
    volume: 87000,
    amount: 7751700,
    rating: 3.8,
    ratingCount: 178,
    last5AvgRating: 3.75,
    netInflow: -294000,
    marketCap: 8860000,
    description: '学术造诣高深，公式定理节奏极快，挂科率偏高，短期基本面承压。',
    isWatchlisted: false,
    recentRatings: [3.8, 3.6, 3.9, 3.7, 3.7]
  },
  {
    code: '1005',
    name: '计网赵',
    teacherName: '赵梓涵 教授',
    course: '数据结构与算法',
    department: '计算机学院',
    currentPrice: 128.50,
    prevClose: 120.30,
    openPrice: 121.00,
    highPrice: 130.00,
    lowPrice: 120.50,
    volume: 382000,
    amount: 48514000,
    rating: 4.9,
    ratingCount: 680,
    last5AvgRating: 4.95,
    netInflow: 1350000,
    marketCap: 12850000,
    description: '全校金课代表，手把手带写LeetCode高频题，校招大厂上岸率极高，明星龙头股。',
    isWatchlisted: true,
    recentRatings: [5.0, 5.0, 4.9, 4.9, 5.0]
  },
  {
    code: '1006',
    name: '经管钱',
    teacherName: '钱文博 副教授',
    course: '宏观经济学与金融学导论',
    department: '经济管理学院',
    currentPrice: 104.30,
    prevClose: 103.50,
    openPrice: 104.00,
    highPrice: 106.20,
    lowPrice: 103.10,
    volume: 132000,
    amount: 13807200,
    rating: 4.5,
    ratingCount: 290,
    last5AvgRating: 4.52,
    netInflow: 114000,
    marketCap: 10430000,
    description: '擅长结合真实财经大事件推演，案例鲜活，深受跨专业选课学生欢迎。',
    isWatchlisted: false,
    recentRatings: [4.6, 4.5, 4.4, 4.5, 4.6]
  },
  {
    code: '1007',
    name: '系统孙',
    teacherName: '孙立群 教授',
    course: '操作系统原理与实训',
    department: '计算机学院',
    currentPrice: 99.20,
    prevClose: 101.40,
    openPrice: 100.80,
    highPrice: 102.00,
    lowPrice: 98.60,
    volume: 154000,
    amount: 15415400,
    rating: 4.3,
    ratingCount: 245,
    last5AvgRating: 4.30,
    netInflow: -42000,
    marketCap: 9920000,
    description: '实验环节内核编写难度大，但学成后收获极大，波动率相对较低。',
    isWatchlisted: false,
    recentRatings: [4.4, 4.2, 4.3, 4.3, 4.3]
  },
  {
    code: '1008',
    name: 'AI 周',
    teacherName: '周逸轩 助理教授',
    course: '深度学习与大模型前沿',
    department: '人工智能学院',
    currentPrice: 135.60,
    prevClose: 124.00,
    openPrice: 125.00,
    highPrice: 136.40,
    lowPrice: 124.50,
    volume: 420000,
    amount: 55476000,
    rating: 4.9,
    ratingCount: 430,
    last5AvgRating: 4.96,
    netInflow: 1680000,
    marketCap: 13560000,
    description: '紧跟前沿论文与开源生态，GPU算力充足，资金关注度极高，近期持续涨停。',
    isWatchlisted: true,
    recentRatings: [5.0, 5.0, 4.9, 5.0, 4.9]
  }
]

export function generateKLineData(basePrice: number, days = 30): KLinePoint[] {
  const points: KLinePoint[] = []
  let currentClose = basePrice * 0.85
  const startDate = new Date(2026, 7, 2) // August 2, 2026

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    // skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue

    const changePct = (Math.sin(i * 0.7) * 0.03) + ((Math.random() - 0.46) * 0.05)
    const open = Number((currentClose * (1 + (Math.random() - 0.5) * 0.015)).toFixed(2))
    const close = Number((open * (1 + changePct)).toFixed(2))
    const high = Number((Math.max(open, close) * (1 + Math.random() * 0.025)).toFixed(2))
    const low = Number((Math.min(open, close) * (1 - Math.random() * 0.025)).toFixed(2))
    const volume = Math.floor(80000 + Math.random() * 250000)

    currentClose = close
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    points.push({
      date: dateStr,
      open,
      close,
      low,
      high,
      volume
    })
  }

  // Calculate Moving Averages (MA5, MA10, MA20)
  for (let i = 0; i < points.length; i++) {
    if (i >= 4) {
      const sum5 = points.slice(i - 4, i + 1).reduce((acc, p) => acc + p.close, 0)
      points[i].ma5 = Number((sum5 / 5).toFixed(2))
    }
    if (i >= 9) {
      const sum10 = points.slice(i - 9, i + 1).reduce((acc, p) => acc + p.close, 0)
      points[i].ma10 = Number((sum10 / 10).toFixed(2))
    }
    if (i >= 19) {
      const sum20 = points.slice(i - 19, i + 1).reduce((acc, p) => acc + p.close, 0)
      points[i].ma20 = Number((sum20 / 20).toFixed(2))
    }
  }

  return points
}

export const initialUser: UserProfile = {
  id: 'usr-student-001',
  username: '林予 (Wolf-07)',
  studentId: '20230910408',
  name: '林予',
  department: '计算机学院 · 软件工程系',
  role: 'STUDENT',
  balance: 14680,
  frozenCoins: 650,
  gpa: 3.92,
  monthCardActive: true,
  monthCardExpire: '2026-10-01',
  battlePassLevel: 14,
  battlePassExp: 840,
  avatarFrame: '荣耀先锋·金框'
}

export const initialCourses: CourseSession[] = [
  {
    id: 'cs-01',
    courseName: '数据结构与算法 (第3讲: 树与二叉树)',
    teacherName: '赵梓涵 教授',
    stockCode: '1005',
    time: '今日 10:00 - 11:40',
    room: '信息楼 204',
    isSigned: true,
    isEvaluated: false
  },
  {
    id: 'cs-02',
    courseName: '高等数学 (第5讲: 微积分基本定理)',
    teacherName: '张建国 教授',
    stockCode: '1001',
    time: '今日 14:00 - 15:40',
    room: '一教 301',
    isSigned: true,
    isEvaluated: true
  },
  {
    id: 'cs-03',
    courseName: '深度学习与大模型前沿 (第1讲: Transformer原理解析)',
    teacherName: '周逸轩 助理教授',
    stockCode: '1008',
    time: '明日 08:00 - 09:40',
    room: '图西报告厅',
    isSigned: false,
    isEvaluated: false
  },
  {
    id: 'cs-04',
    courseName: '大学物理 (第2讲: 刚体转动定律)',
    teacherName: '王崇德 教授',
    stockCode: '1004',
    time: '昨日 15:50 - 17:30',
    room: '物理楼 108',
    isSigned: true,
    isEvaluated: false
  }
]

export const initialEvaluations: EvaluationItem[] = [
  {
    id: 'eval-01',
    sessionId: 'cs-02',
    courseName: '高等数学',
    teacherName: '张建国 教授',
    stockCode: '1001',
    studentName: '校内匿名同学',
    rating: 5,
    tags: ['板书天花板', '讲题通透', '互动热烈'],
    comment: '张老师讲微积分非常透彻，不仅推导扎实，还会联系物理背景，极力看多！',
    status: 'APPROVED',
    createTime: '2026-09-01 16:10:00',
    anonymous: true
  },
  {
    id: 'eval-02',
    sessionId: 'cs-old-01',
    courseName: '数据结构与算法',
    teacherName: '赵梓涵 教授',
    stockCode: '1005',
    studentName: '校内匿名同学',
    rating: 5,
    tags: ['大厂真题', '干货满满', '给分友好'],
    comment: '红黑树手写实战，讲完立马写出AC代码，龙头股实至名归。',
    status: 'APPROVED',
    createTime: '2026-08-31 11:50:00',
    anonymous: true
  },
  {
    id: 'eval-03',
    sessionId: 'cs-old-02',
    courseName: '大学物理',
    teacherName: '王崇德 教授',
    stockCode: '1004',
    studentName: '校内匿名同学',
    rating: 3,
    tags: ['节奏太快', '作业量大'],
    comment: '公式推导有些跳步，课后需要花大量时间复习，希望能适当放慢节奏。',
    status: 'APPROVED',
    createTime: '2026-08-31 17:45:00',
    anonymous: true
  }
]

export const initialTasks: TaskItem[] = [
  {
    id: 1,
    title: '每日登录签到',
    description: '开启学林街交易日，打卡领取基础学币',
    reward: 50,
    type: 'DAILY',
    current: 1,
    target: 1,
    isClaimed: true,
    icon: 'CalendarCheck'
  },
  {
    id: 2,
    title: '课堂扫码打卡',
    description: '完成今日任意一节课程的到课签到 (+100/节)',
    reward: 100,
    type: 'DAILY',
    current: 2,
    target: 1,
    isClaimed: false,
    icon: 'QrCode'
  },
  {
    id: 3,
    title: '完成课后客观评价',
    description: '为已签到课程提交客观评价，参与次日股价基本面聚合',
    reward: 80,
    type: 'DAILY',
    current: 1,
    target: 1,
    isClaimed: false,
    icon: 'MessageSquareText'
  },
  {
    id: 4,
    title: '完成一笔模拟交易',
    description: '在模拟交易盘中下单买入或卖出任意教师股票 1 笔',
    reward: 30,
    type: 'DAILY',
    current: 1,
    target: 1,
    isClaimed: false,
    icon: 'TrendingUp'
  },
  {
    id: 5,
    title: '学期学分绩点分红 (3.5 ≤ GPA < 4.0)',
    description: '凭借认证学期绩点 3.92 领取高额绩点学币分红',
    reward: 3000,
    type: 'SEMESTER',
    current: 1,
    target: 1,
    isClaimed: true,
    icon: 'GraduationCap'
  },
  {
    id: 6,
    title: '邀请校友入驻',
    description: '邀请好友完成学号认证注册 (+20/人)',
    reward: 20,
    type: 'GROWTH',
    current: 3,
    target: 5,
    isClaimed: false,
    icon: 'UserPlus'
  }
]

export const initialRankings: RankingUser[] = [
  {
    rank: 1,
    userId: 'usr-001',
    username: '林予 (Wolf-07)',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=wolf07',
    userRole: 'STUDENT',
    totalAsset: 38450,
    dailyProfitRatio: 6.84,
    weeklyProfitRatio: 24.50,
    title: '长电股神',
    topHolding: '计网赵 (1005)'
  },
  {
    rank: 2,
    userId: 'usr-002',
    username: '阿七炒股不回本',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=a7',
    userRole: 'STUDENT',
    totalAsset: 34200,
    dailyProfitRatio: 4.20,
    weeklyProfitRatio: 18.20,
    title: 'K线之王',
    topHolding: 'AI 周 (1008)'
  },
  {
    rank: 3,
    userId: 'usr-003',
    username: '叶沉潜修中',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=yechen',
    userRole: 'STUDENT',
    totalAsset: 31800,
    dailyProfitRatio: 2.10,
    weeklyProfitRatio: 15.60,
    title: '波段鬼才',
    topHolding: '高数张 (1001)'
  },
  {
    rank: 4,
    userId: 'usr-004',
    username: '校外资深量化·张总',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=quantzhang',
    userRole: 'EXTERNAL',
    totalAsset: 29500,
    dailyProfitRatio: -1.20,
    weeklyProfitRatio: 12.30,
    title: '激进多头',
    topHolding: 'AI 周 (1008)'
  },
  {
    rank: 5,
    userId: 'usr-005',
    username: '下沙巴菲特',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=buffett',
    userRole: 'STUDENT',
    totalAsset: 27100,
    dailyProfitRatio: 5.12,
    weeklyProfitRatio: 11.40,
    topHolding: '英语陈 (1003)'
  },
  {
    rank: 6,
    userId: 'usr-006',
    username: '风口小韭菜',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=leek',
    userRole: 'EXTERNAL',
    totalAsset: 24800,
    dailyProfitRatio: 0.85,
    weeklyProfitRatio: 8.90,
    topHolding: '经管钱 (1006)'
  }
]

export const initialDragonTiger: DragonTigerItem[] = [
  {
    rank: 1,
    stockCode: '1008',
    stockName: 'AI 周',
    teacherName: '周逸轩 助理教授',
    buyAmount: 1840000,
    sellAmount: 160000,
    netAmount: 1680000,
    tag: '多头主升浪'
  },
  {
    rank: 2,
    stockCode: '1005',
    stockName: '计网赵',
    teacherName: '赵梓涵 教授',
    buyAmount: 1520000,
    sellAmount: 170000,
    netAmount: 1350000,
    tag: '机构持续加仓'
  },
  {
    rank: 3,
    stockCode: '1003',
    stockName: '英语陈',
    teacherName: '陈雅婷 讲师',
    buyAmount: 980000,
    sellAmount: 128000,
    netAmount: 852000,
    tag: '口碑放量突破'
  },
  {
    rank: 4,
    stockCode: '1004',
    stockName: '物化王',
    teacherName: '王崇德 教授',
    buyAmount: 82000,
    sellAmount: 376000,
    netAmount: -294000,
    tag: '恐慌空头离场'
  }
]

export const initialWeeklyTitles: WeeklyTitle[] = [
  {
    id: 'title-1',
    name: '长电股神',
    description: '周结算校内总资产排行榜第 1 名专属荣耀',
    holder: '林予 (Wolf-07)',
    holderRole: '校内学生',
    color: '#fbbf24',
    validUntil: '2026-09-06 18:00'
  },
  {
    id: 'title-2',
    name: 'K线之王',
    description: '周结算校内总资产排行榜第 2 名专属称号',
    holder: '阿七炒股不回本',
    holderRole: '校内学生',
    color: '#818cf8',
    validUntil: '2026-09-06 18:00'
  },
  {
    id: 'title-3',
    name: '波段鬼才',
    description: '周结算校内总资产排行榜第 3 名专属称号',
    holder: '叶沉潜修中',
    holderRole: '校内学生',
    color: '#34d399',
    validUntil: '2026-09-06 18:00'
  },
  {
    id: 'title-4',
    name: '激进多头',
    description: '龙虎榜单日净买入冠军专属称号',
    holder: '校外资深量化·张总',
    holderRole: '校外持卡用户',
    color: '#f87171',
    validUntil: '2026-09-06 18:00'
  },
  {
    id: 'title-5',
    name: '恐慌空头',
    description: '龙虎榜单日净卖出冠军专属称号',
    holder: '空仓观望客',
    holderRole: '校外用户',
    color: '#38bdf8',
    validUntil: '2026-09-06 18:00'
  }
]

export const initialOrders: Order[] = [
  {
    id: 'ord-01',
    orderNo: 'ORD20260901001',
    stockCode: '1005',
    stockName: '计网赵',
    side: 'BUY',
    price: 120.30,
    shares: 80,
    amount: 9624.00,
    fee: 9.62,
    status: 'FILLED',
    createTime: '2026-09-01 09:35:12'
  },
  {
    id: 'ord-02',
    orderNo: 'ORD20260901002',
    stockCode: '1008',
    stockName: 'AI 周',
    side: 'BUY',
    price: 124.00,
    shares: 50,
    amount: 6200.00,
    fee: 6.20,
    status: 'FILLED',
    createTime: '2026-09-01 10:12:44'
  },
  {
    id: 'ord-03',
    orderNo: 'ORD20260831003',
    stockCode: '1001',
    stockName: '高数张',
    side: 'BUY',
    price: 98.50,
    shares: 60,
    amount: 5910.00,
    fee: 5.91,
    status: 'FILLED',
    createTime: '2026-08-31 14:20:00'
  }
]

export const initialPositions: Position[] = [
  {
    stockCode: '1005',
    stockName: '计网赵',
    totalShares: 80,
    availableShares: 0, // Bought today, T+1 locked
    costPrice: 120.30,
    currentPrice: 128.50,
    marketValue: 10280.00,
    floatProfit: 656.00,
    profitRatio: 6.82,
    lots: [
      {
        lotId: 'lot-01',
        buyDate: '2026-09-01',
        shares: 80,
        costPrice: 120.30,
        canSellToday: false
      }
    ]
  },
  {
    stockCode: '1008',
    stockName: 'AI 周',
    totalShares: 50,
    availableShares: 0, // Bought today, T+1 locked
    costPrice: 124.00,
    currentPrice: 135.60,
    marketValue: 6780.00,
    floatProfit: 580.00,
    profitRatio: 9.35,
    lots: [
      {
        lotId: 'lot-02',
        buyDate: '2026-09-01',
        shares: 50,
        costPrice: 124.00,
        canSellToday: false
      }
    ]
  },
  {
    stockCode: '1001',
    stockName: '高数张',
    totalShares: 60,
    availableShares: 60, // Bought yesterday, can sell today
    costPrice: 98.50,
    currentPrice: 106.80,
    marketValue: 6408.00,
    floatProfit: 498.00,
    profitRatio: 8.43,
    lots: [
      {
        lotId: 'lot-03',
        buyDate: '2026-08-31',
        shares: 60,
        costPrice: 98.50,
        canSellToday: true
      }
    ]
  }
]
