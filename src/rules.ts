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
