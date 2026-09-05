/**
 * 签到评教业务规则单元测试（Node 内置 test runner，无第三方依赖）：
 *   npm run test  →  node --test tests/rules.test.ts
 * Node 24 默认启用 TypeScript type-stripping，可直接运行 .ts。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  applyRatingAggregation,
  AUDIT_STATUSES,
  autoCompleteLoginTask,
  calcMaxAdditionalSharesToLimit,
  calcRatingFactorEarning,
  calcTradeAmount,
  calcTradeFee,
  calcTradeNetReturn,
  calcTradePayable,
  calcWeightedCostPrice,
  canClaimTaskReward,
  clampRating,
  deductSellableLots,
  EVALUATION_MAX_RATING,
  EVALUATION_MIN_RATING,
  EVALUATION_REWARD,
  exceedsPositionLimit,
  FEE_POOL_RETAIN_RATIO,
  isAuditStatus,
  isReviewPublic,
  MONTH_CARD_FEE_DISCOUNT,
  NEUTRAL_RATING,
  nextTaskProgress,
  POSITION_LIMIT_RATIO,
  PUBLIC_REVIEW_STATUS,
  RATING_EMA_NEW_WEIGHT,
  RATING_WINDOW,
  resetDailyTask,
  shouldResetDaily,
  SIGNIN_REWARD,
  TRADE_FEE_RATE,
  tradeFeeRate
} from '../src/rules.ts'

test('奖励常量：签到 +100 / 评教 +80', () => {
  assert.equal(SIGNIN_REWARD, 100)
  assert.equal(EVALUATION_REWARD, 80)
})

test('聚合窗口与中性基准常量', () => {
  assert.equal(RATING_WINDOW, 5)
  assert.equal(NEUTRAL_RATING, 3.0)
  assert.equal(EVALUATION_MIN_RATING, 1)
  assert.equal(EVALUATION_MAX_RATING, 5)
  assert.ok(Math.abs(RATING_EMA_NEW_WEIGHT - 0.05) < 1e-9)
})

test('clampRating 将打分约束在 1~5', () => {
  assert.equal(clampRating(9), 5)
  assert.equal(clampRating(0), 1)
  assert.equal(clampRating(4), 4)
  assert.equal(clampRating(NaN), NEUTRAL_RATING)
})

test('空窗口聚合：首条记录直接成为 last5Avg，EMA 平滑到 1 位', () => {
  const base = { recentRatings: [] as number[], rating: 4.2, ratingCount: 12 }
  const agg = applyRatingAggregation(base, 5)
  assert.equal(agg.last5AvgRating, 5)
  assert.equal(agg.recentRatings.length, 1)
  assert.equal(agg.ratingCount, 13)
  // 4.2 * 0.95 + 5 * 0.05 = 4.24 → 保留 1 位 = 4.2
  assert.equal(agg.rating, 4.2)
})

test('满窗口聚合：前插最新分并截断到 RATING_WINDOW', () => {
  const base = { recentRatings: [5, 4, 5, 3, 4], rating: 4.4, ratingCount: 20 }
  const agg = applyRatingAggregation(base, 1)
  assert.equal(agg.recentRatings.length, RATING_WINDOW)
  assert.deepEqual(agg.recentRatings, [1, 5, 4, 5, 3])
  assert.equal(agg.last5AvgRating, 3.6) // (1+5+4+5+3)/5 = 3.6
  assert.equal(agg.ratingCount, 21)
})

test('聚合为纯函数：不修改入参对象', () => {
  const base = { recentRatings: [5, 4, 5, 3, 4], rating: 4.4, ratingCount: 20 }
  applyRatingAggregation(base, 1)
  assert.deepEqual(base.recentRatings, [5, 4, 5, 3, 4])
  assert.equal(base.rating, 4.4)
  assert.equal(base.ratingCount, 20)
})

test('因子推演公式 E = α × (R̄ − 3) / 2', () => {
  assert.ok(Math.abs(calcRatingFactorEarning(5) - 0.02) < 1e-9) // 5★ → +2%
  assert.equal(calcRatingFactorEarning(3), 0)                    // 中性 → 0
  assert.ok(Math.abs(calcRatingFactorEarning(1) + 0.02) < 1e-9) // 1★ → -2%
})

// ---------------------------------------------------------------------------
// 每日任务结算规则
// ---------------------------------------------------------------------------

test('每日结算：仅当存在上次日期且跨天时才重置（首次打开保留演示数据）', () => {
  assert.equal(shouldResetDaily(null, '2026-9-3'), false)
  assert.equal(shouldResetDaily('2026-9-2', '2026-9-2'), false)
  assert.equal(shouldResetDaily('2026-9-2', '2026-9-3'), true)
})

test('每日结算：DAILY 任务归零且不修改入参', () => {
  const t = { type: 'DAILY', trigger: 'CLASS_SIGNIN', current: 2, target: 3, isClaimed: false }
  const r = resetDailyTask(t)
  assert.equal(r.current, 0)
  assert.equal(r.isClaimed, false)
  assert.equal(r.target, 3) // 目标不变
  assert.equal(t.current, 2) // 入参未被修改
})

test('每日结算：DAILY_LOGIN 任务当日自动达成（仅未领取且未达标时）', () => {
  const login = { type: 'DAILY', trigger: 'DAILY_LOGIN', current: 0, target: 1, isClaimed: false }
  assert.equal(autoCompleteLoginTask(login).current, 1)

  const claimed = { ...login, isClaimed: true }
  assert.equal(autoCompleteLoginTask(claimed).current, 0) // 已领取不再补

  const other = { type: 'DAILY', trigger: 'MAKE_TRADE', current: 0, target: 1, isClaimed: false }
  assert.equal(autoCompleteLoginTask(other).current, 0) // 非登录任务不受影响

  const semester = { type: 'SEMESTER', trigger: undefined, current: 0, target: 1, isClaimed: false }
  assert.equal(autoCompleteLoginTask(semester).current, 0) // 非 DAILY 不受影响
})

// ---------------------------------------------------------------------------
// 任务奖励领取规则
// ---------------------------------------------------------------------------

test('任务领奖资格：仅当进度达标且未领取', () => {
  assert.equal(canClaimTaskReward(3, 3, false), true)   // 满进度未领 → 可领
  assert.equal(canClaimTaskReward(2, 3, false), false)  // 未达标 → 不可领
  assert.equal(canClaimTaskReward(3, 3, true), false)   // 已领取 → 不可重复领
})

test('任务进度推进：只增不减且封顶 target', () => {
  assert.equal(nextTaskProgress(1, 3, 1), 2)
  assert.equal(nextTaskProgress(2, 3, 1), 3)  // 达标
  assert.equal(nextTaskProgress(0, 3, 5), 3)  // 大步长不越界
  assert.equal(nextTaskProgress(3, 3, 1), 3)  // 已达标不溢出
})

// ---------------------------------------------------------------------------
// 模拟交易规则
// ---------------------------------------------------------------------------

test('交易费率常量：规费 0.1%，月卡 5 折后 0.05%，奖池留存 50%，仓位上限 30%', () => {
  assert.equal(TRADE_FEE_RATE, 0.001)
  assert.equal(MONTH_CARD_FEE_DISCOUNT, 0.5)
  assert.equal(POSITION_LIMIT_RATIO, 0.3)
  assert.equal(FEE_POOL_RETAIN_RATIO, 0.5)
  assert.equal(tradeFeeRate(false), 0.001)
  assert.equal(tradeFeeRate(true), 0.0005)
})

test('成交额 / 手续费 / 应付与净回笼（含月卡半价）', () => {
  assert.equal(calcTradeAmount(10, 5), 50)
  assert.equal(calcTradeFee(10000, false), 10) // 0.1%
  assert.equal(calcTradeFee(10000, true), 5)   // 月卡 5 折
  assert.equal(calcTradePayable(10000, 10), 10010)   // 买入应付 = 金额 + 手续费
  assert.equal(calcTradeNetReturn(10000, 10), 9990)  // 卖出净回笼 = 金额 − 手续费
})

test('单标的 30% 仓位风控：恰好 30% 不触发、超出触发', () => {
  assert.equal(exceedsPositionLimit(20000, 10000, 100000), false) // (20000+10000)/100000 = 0.30
  assert.equal(exceedsPositionLimit(20000, 10001, 100000), true)  // 0.30001 > 0.30
})

test('风控下最大可加仓股数：整股截断、预算不足归零', () => {
  assert.equal(calcMaxAdditionalSharesToLimit(100000, 20000, 10), 1000) // (30000-20000)/10
  assert.equal(calcMaxAdditionalSharesToLimit(100000, 40000, 10), 0)    // 已超限 → 0
})

test('加仓摊薄均价：按持仓金额加权并保留两位', () => {
  // (80 × 120.30 + 20 × 128.50) / 100 = 121.94
  assert.equal(calcWeightedCostPrice(80, 120.3, 20, 128.5), 121.94)
  assert.equal(calcWeightedCostPrice(100, 50, 100, 60), 55)
})

test('T+1 批次扣减：仅可卖批次按 FIFO 扣足，未解锁批次保留且不修改入参', () => {
  const lots = [
    { lotId: 'a', shares: 40, canSellToday: true },
    { lotId: 'b', shares: 30, canSellToday: false }, // 当日买入未解锁
    { lotId: 'c', shares: 60, canSellToday: true }
  ]

  // 全部可卖批次扣光
  const r1 = deductSellableLots(lots, 100)
  assert.equal(r1.remaining, 0)
  assert.deepEqual(r1.lots, [{ lotId: 'b', shares: 30, canSellToday: false }])

  // 部分扣减：第一笔 40 扣光后，锁定批次跳过，第三笔剩余 50
  const r2 = deductSellableLots(lots, 50)
  assert.equal(r2.remaining, 0)
  assert.deepEqual(r2.lots, [
    { lotId: 'b', shares: 30, canSellToday: false },
    { lotId: 'c', shares: 50, canSellToday: true }
  ])

  // 纯函数：入参批次未被修改
  assert.equal(lots[0].shares, 40)
  assert.equal(lots[2].shares, 60)
})

// ---------------------------------------------------------------------------
// 评价审核规则
// ---------------------------------------------------------------------------

test('评价审核状态集：仅「通过 / 降权 / 屏蔽」，不含 PENDING 待审', () => {
  assert.deepEqual([...AUDIT_STATUSES], ['APPROVED', 'DOWNWEIGHTED', 'REJECTED'])
  assert.equal(isAuditStatus('APPROVED'), true)
  assert.equal(isAuditStatus('DOWNWEIGHTED'), true)
  assert.equal(isAuditStatus('REJECTED'), true)
  assert.equal(isAuditStatus('PENDING'), false) // 原型无待审队列，不允许审核改到 PENDING
})

test('公开可见口径：仅 APPROVED 展示，驳回 / 降权对外下架', () => {
  assert.equal(PUBLIC_REVIEW_STATUS, 'APPROVED')
  assert.equal(isReviewPublic('APPROVED'), true)
  assert.equal(isReviewPublic('DOWNWEIGHTED'), false)
  assert.equal(isReviewPublic('REJECTED'), false)
  assert.equal(isReviewPublic('PENDING'), false)
})
