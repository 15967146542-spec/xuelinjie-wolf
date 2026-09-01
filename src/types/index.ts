export type UserRole = 'STUDENT' | 'EXTERNAL' | 'TEACHER' | 'ADMIN'

export interface TeacherStock {
  code: string
  name: string
  teacherName: string
  course: string
  department: string
  currentPrice: number
  prevClose: number
  openPrice: number
  highPrice: number
  lowPrice: number
  volume: number
  amount: number
  rating: number
  ratingCount: number
  last5AvgRating: number
  netInflow: number
  marketCap: number
  description: string
  isWatchlisted?: boolean
  recentRatings: number[]
}

export interface KLinePoint {
  date: string
  open: number
  close: number
  low: number
  high: number
  volume: number
  ma5?: number
  ma10?: number
  ma20?: number
}

export interface MacroFactor {
  id: string
  title: string
  indexValue: number
  description: string
  updatedAt: string
  alpha: number
  beta: number
  gamma: number
  sigma: number
}

export interface Order {
  id: string
  orderNo: string
  stockCode: string
  stockName: string
  side: 'BUY' | 'SELL'
  price: number
  shares: number
  amount: number
  fee: number
  status: 'FILLED' | 'CANCELLED'
  createTime: string
}

export interface PositionLot {
  lotId: string
  buyDate: string
  shares: number
  costPrice: number
  canSellToday: boolean
}

export interface Position {
  stockCode: string
  stockName: string
  totalShares: number
  availableShares: number
  costPrice: number
  currentPrice: number
  marketValue: number
  floatProfit: number
  profitRatio: number
  lots: PositionLot[]
}

export interface CourseSession {
  id: string
  courseName: string
  teacherName: string
  stockCode: string
  time: string
  room: string
  isSigned: boolean
  isEvaluated: boolean
}

export interface EvaluationItem {
  id: string
  sessionId: string
  courseName: string
  teacherName: string
  stockCode: string
  studentName: string
  rating: number
  tags: string[]
  comment: string
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DOWNWEIGHTED'
  createTime: string
  anonymous: boolean
}

export interface TaskItem {
  id: number
  title: string
  description: string
  reward: number
  type: 'DAILY' | 'SEMESTER' | 'ACHIEVEMENT'
  current: number
  target: number
  isClaimed: boolean
  icon: string
}

export interface AssetLedger {
  id: string
  title: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  category: string
  time: string
  balanceAfter: number
}

export interface RankingUser {
  rank: number
  userId: string
  username: string
  avatar: string
  userRole: UserRole
  totalAsset: number
  dailyProfitRatio: number
  weeklyProfitRatio: number
  title?: string
  topHolding?: string
}

export interface DragonTigerItem {
  rank: number
  stockCode: string
  stockName: string
  teacherName: string
  buyAmount: number
  sellAmount: number
  netAmount: number
  tag: string
}

export interface WeeklyTitle {
  id: string
  name: string
  description: string
  holder: string
  holderRole: string
  color: string
  validUntil: string
}

export interface UserProfile {
  id: string
  username: string
  studentId: string
  name: string
  department: string
  role: UserRole
  balance: number
  frozenCoins: number
  gpa: number
  monthCardActive: boolean
  monthCardExpire?: string
  battlePassLevel: number
  battlePassExp: number
  avatarFrame: string
}
