/**
 * 签到评教 / 任务激励 / 评教基本面因子 —— 业务规则单一来源
 *
 * 设计目的：
 * 1. 让 stores 只做状态编排，金额、聚合窗口、权重、公式等规则统一维护在此处；
 * 2. 所有函数均为无 Vue 依赖的纯函数，便于后续单元测试（Vitest / node:test）复用；
 * 3. 后续接入接口层时，页面与 store 仅关心“规则结果”，不关心规则细节。
 */

/** 到课签到打卡奖励（学币/节） */
export const SIGNIN_REWARD = 100
/** 完成课后客观评价奖励（学币/次） */
export const EVALUATION_REWARD = 80

/** 近 5 讲评分聚合窗口 */
export const RATING_WINDOW = 5
/** 评教打分区间 */
export const EVALUATION_MIN_RATING = 1
export const EVALUATION_MAX_RATING = 5
/** 中性基准分：高于看多、低于看空 */
export const NEUTRAL_RATING = 3.0
/** 基本面因子强度系数（次日生效，写死在原型文案中） */
export const RATING_FACTOR_ALPHA = 0.02

/** 整体星级指数平滑权重：新评教权重 / 历史权重 */
export const RATING_EMA_NEW_WEIGHT = 0.05
export const RATING_EMA_OLD_WEIGHT = 1 - RATING_EMA_NEW_WEIGHT

/** 参与“评教基本面因子”计算所需的标的评分结构（TeacherStock 的可计算子集） */
export interface StockRatingLike {
  recentRatings: number[]
  rating: number
  ratingCount: number
}

/** 单次新评教聚合后的评分结果 */
export interface RatingAggregation {
  recentRatings: number[]
  last5AvgRating: number
  ratingCount: number
  rating: number
}

function round(value: number, digits: number): number {
  return Number(value.toFixed(digits))
}

/** 将打分约束在合法区间内 */
export function clampRating(rating: number): number {
  if (!Number.isFinite(rating)) return NEUTRAL_RATING
  return Math.min(EVALUATION_MAX_RATING, Math.max(EVALUATION_MIN_RATING, rating))
}

/**
 * 把一条新评教聚合并入标的评分（纯函数，不修改入参）：
 * - recentRatings 前插新分并截断到 RATING_WINDOW 条；
 * - last5AvgRating 取窗口内平均（保留两位）；
 * - rating 用指数平滑更新：old * 0.95 + new * 0.05（保留一位，与原实现一致）。
 */
export function applyRatingAggregation(
  base: StockRatingLike,
  newRating: number
): RatingAggregation {
  const clamped = clampRating(newRating)
  const recentRatings = [clamped, ...base.recentRatings].slice(0, RATING_WINDOW)
  const sum = recentRatings.reduce((acc, r) => acc + r, 0)
  const last5AvgRating = round(sum / recentRatings.length, 2)
  return {
    recentRatings,
    last5AvgRating,
    ratingCount: base.ratingCount + 1,
    rating: round(base.rating * RATING_EMA_OLD_WEIGHT + clamped * RATING_EMA_NEW_WEIGHT, 1)
  }
}

/**
 * 由窗口平均分推演“次日基本面因子收益”：
 * E = ALPHA * (R̄ - 3) / 2，R̄ 为近 5 讲平均星级。
 * 该公式仅用于影响机制展示文案（原型阶段不参与真实行情计算）。
 */
export function calcRatingFactorEarning(last5Avg: number): number {
  return RATING_FACTOR_ALPHA * ((last5Avg - NEUTRAL_RATING) / 2)
}

// ---------------------------------------------------------------------------
// 每日任务结算规则（纯函数，供 stores/task.ts 使用并可被单测直接覆盖）
// ---------------------------------------------------------------------------

/** 每日任务参与结算所需的最小状态结构 */
export interface DailyTaskState {
  type: string
  trigger?: string
  current: number
  target: number
  isClaimed: boolean
}

/** 是否需要执行跨天结算：存在上次结算日期且与今日不同（首次打开不重置，保留演示数据） */
export function shouldResetDaily(lastDate: string | null, today: string): boolean {
  return !!lastDate && lastDate !== today
}

/** 返回 DAILY 任务跨天归零后的新状态（纯函数，不修改入参） */
export function resetDailyTask<T extends DailyTaskState>(task: T): T {
  return { ...task, current: 0, isClaimed: false }
}

/**
 * 每日登录任务当日自动达成：打开过应用即视为当日登录，
 * 对 DAILY + DAILY_LOGIN 且未领取的任务补满进度（不修改入参）。
 */
export function autoCompleteLoginTask<T extends DailyTaskState>(task: T): T {
  const isLogin = task.type === 'DAILY' && task.trigger === 'DAILY_LOGIN'
  if (isLogin && !task.isClaimed && task.current < task.target) {
    return { ...task, current: task.target }
  }
  return { ...task }
}

// ---------------------------------------------------------------------------
// 任务奖励领取规则（纯函数，供 stores/task.ts 使用并可被单测覆盖）
// ---------------------------------------------------------------------------

/** 任务是否已达到可领取状态：进度满且未领取 */
export function canClaimTaskReward(current: number, target: number, isClaimed: boolean): boolean {
  return !isClaimed && current >= target
}

/** 任务进度推进后应落到的值：只增不减、封顶 target（调用方自行决定是否推进） */
export function nextTaskProgress(current: number, target: number, delta: number): number {
  return Math.min(target, current + delta)
}

// ---------------------------------------------------------------------------
// 模拟交易规则（纯函数，供 stores/trade.ts 与交易下单预估复用，可被单测覆盖）
// ---------------------------------------------------------------------------

/** 交易规费费率（单边 0.1%） */
export const TRADE_FEE_RATE = 0.001
/** 月卡持有人手续费折扣（5 折：0.1% × 0.5 = 0.05%） */
export const MONTH_CARD_FEE_DISCOUNT = 0.5
/** 风控：单只标的持仓市值不得超过总资产的 30% */
export const POSITION_LIMIT_RATIO = 0.3
/** 手续费进入平台公共奖池的比例（其余销毁） */
export const FEE_POOL_RETAIN_RATIO = 0.5

/** 当前适用的手续费率（月卡半价） */
export function tradeFeeRate(monthCardActive: boolean): number {
  return TRADE_FEE_RATE * (monthCardActive ? MONTH_CARD_FEE_DISCOUNT : 1)
}

/** 成交金额 = 成交价 × 股数（保留两位） */
export function calcTradeAmount(price: number, shares: number): number {
  return round(price * shares, 2)
}

/** 手续费 = 成交金额 × 适用费率（保留两位） */
export function calcTradeFee(amount: number, monthCardActive: boolean): number {
  return round(amount * tradeFeeRate(monthCardActive), 2)
}

/** 买入应付总额 = 成交金额 + 手续费（保留两位） */
export function calcTradePayable(amount: number, fee: number): number {
  return round(amount + fee, 2)
}

/** 卖出净回笼 = 成交金额 − 手续费（保留两位） */
export function calcTradeNetReturn(amount: number, fee: number): number {
  return round(amount - fee, 2)
}

/** 风控判断：加仓后单标的持仓是否超过总资产的 POSITION_LIMIT_RATIO */
export function exceedsPositionLimit(existingValue: number, addValue: number, totalAsset: number): boolean {
  return (existingValue + addValue) / totalAsset > POSITION_LIMIT_RATIO
}

/** 风控下该标的仍可加仓的最大股数（整股、超限按 0 兜底） */
export function calcMaxAdditionalSharesToLimit(totalAsset: number, existingValue: number, price: number): number {
  return Math.max(0, Math.floor((totalAsset * POSITION_LIMIT_RATIO - existingValue) / price))
}

/** 买入加仓后的摊薄持仓成本（旧仓与新股按金额加权，保留两位） */
export function calcWeightedCostPrice(
  oldShares: number,
  oldCostPrice: number,
  addShares: number,
  addPrice: number
): number {
  const newShares = oldShares + addShares
  if (newShares <= 0) return 0
  return round((oldShares * oldCostPrice + addShares * addPrice) / newShares, 2)
}

/** T+1 批次扣减所需的最小结构（与 types.PositionLot 对齐） */
export interface SellableLotLike {
  shares: number
  canSellToday: boolean
}

/**
 * 按 FIFO 扣减可卖批次（纯函数，不修改入参）：
 * 当日买入未解锁的批次（canSellToday=false）不参与，
 * 仅按顺序扣足 sellShares，返回扣减后的批次与未能扣足的余量。
 */
export function deductSellableLots<T extends SellableLotLike>(
  lots: readonly T[],
  sellShares: number
): { lots: T[]; remaining: number } {
  let remaining = sellShares
  const next = lots.map<T>((lot) => {
    if (!lot.canSellToday || remaining <= 0) return { ...lot }
    if (lot.shares <= remaining) {
      remaining -= lot.shares
      return { ...lot, shares: 0 }
    }
    const keep = lot.shares - remaining
    remaining = 0
    return { ...lot, shares: keep }
  })
  return { lots: next.filter((lot) => lot.shares > 0), remaining }
}

// ---------------------------------------------------------------------------
// 评价审核规则（纯函数：公开可见口径 + 管理端可改状态集，供 store/视图复用）
// ---------------------------------------------------------------------------

/** 对外公开可见的评教状态：个股详情与评教中心的「已审核评价」只展示它 */
export const PUBLIC_REVIEW_STATUS = 'APPROVED' as const

/**
 * 管理端审核动作可变更到的状态集合（不含 PENDING：
 * 原型无待审队列，新评教提交即公开，故审核仅在「通过 / 降权 / 屏蔽」间流转）。
 */
export const AUDIT_STATUSES = ['APPROVED', 'DOWNWEIGHTED', 'REJECTED'] as const

/** 单个审核动作状态（由 AUDIT_STATUSES 推导） */
export type AuditStatus = (typeof AUDIT_STATUSES)[number]

/** 是否为合法的管理端审核目标状态 */
export function isAuditStatus(value: string): value is AuditStatus {
  return (AUDIT_STATUSES as readonly string[]).includes(value)
}

/** 该评价状态是否向公开列表展示（被驳回 / 降权的评价对外下架） */
export function isReviewPublic(status: string): boolean {
  return status === PUBLIC_REVIEW_STATUS
}
