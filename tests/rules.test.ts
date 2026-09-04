/**
 * 签到评教业务规则单元测试（Node 内置 test runner，无第三方依赖）：
 *   npm run test  →  node --test tests/rules.test.ts
 * Node 24 默认启用 TypeScript type-stripping，可直接运行 .ts。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  applyRatingAggregation,
  autoCompleteLoginTask,
  calcRatingFactorEarning,
  clampRating,
  EVALUATION_MAX_RATING,
  EVALUATION_MIN_RATING,
  EVALUATION_REWARD,
  NEUTRAL_RATING,
  RATING_EMA_NEW_WEIGHT,
  RATING_WINDOW,
  resetDailyTask,
  shouldResetDaily,
  SIGNIN_REWARD
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
