<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMarketStore } from '@/stores/market'
import { useTradeStore } from '@/stores/trade'
import { useUserStore } from '@/stores/user'
import { useEvaluationStore } from '@/stores/evaluation'
import KLineChart from '@/components/KLineChart.vue'
import RatingTrendChart from '@/components/RatingTrendChart.vue'
import {
  ArrowLeft,
  Star,
  TrendingUp,
  Sliders,
  ShieldCheck,
  MessageSquare,
  HelpCircle,
  Sparkles,
  Lock,
  Coins
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const marketStore = useMarketStore()
const tradeStore = useTradeStore()
const userStore = useUserStore()
const evaluationStore = useEvaluationStore()

const stockCode = computed(() => (route.params.code as string) || marketStore.selectedCode)
const stock = computed(() => marketStore.stocks.find((s) => s.code === stockCode.value) || marketStore.stocks[0])

const quickTradeSide = ref<'BUY' | 'SELL'>('BUY')
const tradeShares = ref<number>(10)
const isSubmitting = ref(false)

// Factor calculation breakdown
const projection = computed(() => marketStore.calculateNextDayProjection(stock.value))

// Existing audited reviews for this stock
const stockReviews = computed(() => {
  return evaluationStore.evaluations.filter(
    (e) => e.stockCode === stock.value.code && e.status === 'APPROVED'
  )
})

// Current user holding of this stock
const userHolding = computed(() => {
  return tradeStore.positions.find((p) => p.stockCode === stock.value.code)
})

function getRatio() {
  const val = ((stock.value.currentPrice - stock.value.prevClose) / stock.value.prevClose) * 100
  return Number(val.toFixed(2))
}

function handleTrade() {
  if (!tradeShares.value || tradeShares.value <= 0) {
    ElMessage.warning('请输入有效交易股数')
    return
  }

  isSubmitting.value = true
  if (quickTradeSide.value === 'BUY') {
    const res = tradeStore.executeBuy(stock.value.code, Number(tradeShares.value))
    if (res.success) {
      ElMessage.success(res.message)
    } else {
      ElMessage.error(res.message)
    }
  } else {
    const res = tradeStore.executeSell(stock.value.code, Number(tradeShares.value))
    if (res.success) {
      ElMessage.success(res.message)
    } else {
      ElMessage.error(res.message)
    }
  }
  isSubmitting.value = false
}

function setPresetPercent(pct: number) {
  if (quickTradeSide.value === 'BUY') {
    const maxAffordable = Math.floor(userStore.user.balance / stock.value.currentPrice)
    tradeShares.value = Math.max(1, Math.floor(maxAffordable * (pct / 100)))
  } else {
    const available = userHolding.value ? userHolding.value.availableShares : 0
    tradeShares.value = Math.max(1, Math.floor(available * (pct / 100)))
  }
}

onMounted(() => {
  if (stock.value) {
    marketStore.selectStock(stock.value.code)
  }
})
</script>

<template>
  <div class="stock-detail-view">
    <!-- Top Back Bar & Header -->
    <div class="header-card">
      <div class="header-top">
        <button class="back-btn" @click="router.push('/market')">
          <ArrowLeft :size="16" /> 返回行情大厅
        </button>
        <div class="header-actions">
          <el-button
            size="small"
            :type="stock.isWatchlisted ? 'warning' : 'info'"
            plain
            @click="marketStore.toggleWatchlist(stock.code)"
          >
            <Star :size="14" class="mr-1" />
            {{ stock.isWatchlisted ? '已在自选' : '加入自选' }}
          </el-button>
          <el-button size="small" type="primary" @click="router.push('/evaluation')">
            去评价这门课
          </el-button>
        </div>
      </div>

      <div class="stock-hero">
        <div class="hero-left">
          <div class="hero-title-row">
            <span class="stock-code-pill">{{ stock.code }}</span>
            <h1 class="stock-hero-name">{{ stock.name }}</h1>
            <span class="teacher-dept-pill">{{ stock.teacherName }} · {{ stock.department }}</span>
          </div>
          <div class="hero-course-sub">主讲课程：<strong>{{ stock.course }}</strong></div>
        </div>

        <div class="hero-price-box">
          <div class="price-val" :class="stock.currentPrice >= stock.prevClose ? 'up' : 'down'">
            ¥{{ stock.currentPrice.toFixed(2) }}
          </div>
          <div class="price-change-row" :class="getRatio() >= 0 ? 'up' : 'down'">
            <span>{{ stock.currentPrice >= stock.prevClose ? '+' : '' }}{{ (stock.currentPrice - stock.prevClose).toFixed(2) }}</span>
            <span>({{ getRatio() >= 0 ? '+' : '' }}{{ getRatio() }}%)</span>
            <span class="price-tag">涨跌幅限制 ±10%</span>
          </div>
        </div>
      </div>

      <!-- Quick Metrics Ribbon -->
      <div class="metrics-ribbon">
        <div class="metric-cell">
          <span class="m-label">今开盘</span>
          <span class="m-val">¥{{ stock.openPrice.toFixed(2) }}</span>
        </div>
        <div class="metric-cell">
          <span class="m-label">最高价</span>
          <span class="m-val up">¥{{ stock.highPrice.toFixed(2) }}</span>
        </div>
        <div class="metric-cell">
          <span class="m-label">最低价</span>
          <span class="m-val down">¥{{ stock.lowPrice.toFixed(2) }}</span>
        </div>
        <div class="metric-cell">
          <span class="m-label">昨收盘</span>
          <span class="m-val">¥{{ stock.prevClose.toFixed(2) }}</span>
        </div>
        <div class="metric-cell">
          <span class="m-label">成交量</span>
          <span class="m-val">{{ (stock.volume / 1000).toFixed(1) }}k 股</span>
        </div>
        <div class="metric-cell">
          <span class="m-label">流通市值</span>
          <span class="m-val">¥{{ (stock.marketCap / 10000).toFixed(1) }}万</span>
        </div>
        <div class="metric-cell">
          <span class="m-label">近5讲均分</span>
          <span class="m-val gold">★ {{ stock.last5AvgRating.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- Main 2-Column Section -->
    <div class="detail-grid">
      <!-- Left Column: Big K-Line + Factors + Ratings -->
      <div class="detail-left">
        <!-- 1. Candlestick Chart Card -->
        <div class="panel-card chart-panel">
          <div class="panel-title-bar">
            <div class="title-with-icon">
              <TrendingUp :size="18" class="text-blue" />
              <span class="title-text">K 线行情与均线系统</span>
            </div>
            <div class="chart-period-tabs">
              <span class="tab-chip active">日K线</span>
              <span class="tab-chip">周K线</span>
              <span class="tab-chip">分时图</span>
            </div>
          </div>
          <div class="kline-wrapper">
            <KLineChart
              :data="marketStore.klineCache[stock.code] || []"
              :stock-name="stock.name"
            />
          </div>
        </div>

        <!-- 2. Next-Day Price Factor Model Breakdown -->
        <div class="panel-card factor-model-card">
          <div class="panel-title-bar">
            <div class="title-with-icon">
              <Sliders :size="18" class="text-purple" />
              <span class="title-text">次日股价基本面因子分解 (次日开盘生效)</span>
            </div>
            <span class="badge-neutral">模型 α=0.02, β=0.10, γ=0.005</span>
          </div>

          <p class="model-intro">
            每日 15:30 收盘后，系统将当期评教星级聚合、资金净流入与宏观指数输入算法，计算下一交易日指导价。
          </p>

          <div class="factors-grid">
            <div class="factor-box">
              <div class="f-name">1. 评价因子 (E)</div>
              <div class="f-val" :class="projection.evalFactor >= 0 ? 'up' : 'down'">
                {{ projection.evalFactor >= 0 ? '+' : '' }}{{ projection.evalFactor }}%
              </div>
              <div class="f-calc">
                α × ({{ stock.last5AvgRating.toFixed(2) }} - 3.0) / 2
              </div>
            </div>

            <div class="factor-box">
              <div class="f-name">2. 资金因子 (F)</div>
              <div class="f-val" :class="projection.fundFactor >= 0 ? 'up' : 'down'">
                {{ projection.fundFactor >= 0 ? '+' : '' }}{{ projection.fundFactor }}%
              </div>
              <div class="f-calc">
                β × (净流入/总市值)
              </div>
            </div>

            <div class="factor-box">
              <div class="f-name">3. 宏观指数 (M)</div>
              <div class="f-val" :class="projection.macroImpact >= 0 ? 'up' : 'down'">
                {{ projection.macroImpact >= 0 ? '+' : '' }}{{ projection.macroImpact }}%
              </div>
              <div class="f-calc">
                γ × (宏观指数-1.0)
              </div>
            </div>

            <div class="factor-box">
              <div class="f-name">4. 随机扰动 (N)</div>
              <div class="f-val text-soft">
                {{ projection.noise >= 0 ? '+' : '' }}{{ projection.noise }}%
              </div>
              <div class="f-calc">
                random(-1.5%, +1.5%)
              </div>
            </div>
          </div>

          <!-- Final Simulation Summary Bar -->
          <div class="proj-summary-bar">
            <div>
              <span class="sub">次日预估涨跌幅</span>
              <strong class="highlight" :class="projection.deltaPct >= 0 ? 'up' : 'down'">
                {{ projection.deltaPct >= 0 ? '+' : '' }}{{ projection.deltaPct }}%
              </strong>
            </div>
            <div>
              <span class="sub">次日预估开盘价</span>
              <strong class="highlight font-mono">¥{{ projection.nextPrice.toFixed(2) }}</strong>
            </div>
            <div>
              <span class="sub">单日涨跌熔断限额</span>
              <span class="clamp-pill">[-10.0%, +10.0%]</span>
            </div>
          </div>
        </div>

        <!-- 3. Teacher Rating Trend Chart & Audited Reviews -->
        <div class="panel-card reviews-card">
          <div class="panel-title-bar">
            <div class="title-with-icon">
              <MessageSquare :size="18" class="text-gold" />
              <span class="title-text">教学基本面：近5讲评分趋势与审核评价</span>
            </div>
            <span class="gold-badge">综合星级 ★ {{ stock.rating.toFixed(1) }} ({{ stock.ratingCount }}人评)</span>
          </div>

          <div class="trend-chart-box">
            <RatingTrendChart :ratings="stock.recentRatings" :last5-avg="stock.last5AvgRating" />
          </div>

          <!-- Audited Comments Stream -->
          <div class="comment-stream">
            <div class="stream-title">已审核客观评价 (仅展示脱敏内容)</div>
            <div v-if="stockReviews.length === 0" class="empty-reviews">
              暂无已审核评价，去评价中心打卡签到后提交第一条评教！
            </div>
            <div v-for="rev in stockReviews" :key="rev.id" class="review-item">
              <div class="rev-header">
                <div class="rev-user">
                  <span class="rev-name">{{ rev.studentName }}</span>
                  <span class="rev-time">{{ rev.createTime }}</span>
                </div>
                <div class="rev-stars">★ {{ rev.rating }} 星</div>
              </div>
              <div class="rev-tags">
                <span v-for="tag in rev.tags" :key="tag" class="tag-chip">{{ tag }}</span>
              </div>
              <p class="rev-text">{{ rev.comment }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Quick Trading Order Ticket & Current Holding -->
      <div class="detail-right">
        <!-- 1. Order Ticket Card -->
        <div class="panel-card trade-ticket-card">
          <div class="panel-title-bar">
            <span class="title-text">模拟下单委托 (市价单)</span>
            <span class="sub-tip">交易时间 09:30 - 15:00</span>
          </div>

          <!-- Buy / Sell Side Switcher -->
          <div class="side-selector">
            <button
              class="side-btn buy"
              :class="{ active: quickTradeSide === 'BUY' }"
              @click="quickTradeSide = 'BUY'"
            >
              市价买入 (看多)
            </button>
            <button
              class="side-btn sell"
              :class="{ active: quickTradeSide === 'SELL' }"
              @click="quickTradeSide = 'SELL'"
            >
              市价卖出 (减仓)
            </button>
          </div>

          <div class="trade-form-content">
            <div class="form-row">
              <span class="f-label">委托价格</span>
              <div class="f-input-box market-price-box">
                <span class="fixed-price">¥{{ stock.currentPrice.toFixed(2) }}</span>
                <span class="price-type">市价即时成交</span>
              </div>
            </div>

            <div class="form-row">
              <span class="f-label">交易股数</span>
              <el-input-number
                v-model="tradeShares"
                :min="1"
                :step="10"
                class="shares-number-input"
              />
            </div>

            <!-- Percent quick buttons -->
            <div class="percent-buttons">
              <button class="pct-btn" @click="setPresetPercent(25)">25%</button>
              <button class="pct-btn" @click="setPresetPercent(50)">50%</button>
              <button class="pct-btn" @click="setPresetPercent(75)">75%</button>
              <button class="pct-btn" @click="setPresetPercent(100)">全仓/全卖</button>
            </div>

            <!-- Trade Cost & Fee Details -->
            <div class="cost-breakdown">
              <div class="cost-line">
                <span>预估成交额</span>
                <strong class="font-mono">¥{{ (stock.currentPrice * tradeShares).toFixed(2) }}</strong>
              </div>
              <div class="cost-line">
                <span>交易手续费 (0.1% {{ userStore.user.monthCardActive ? '·月卡5折' : '' }})</span>
                <span class="font-mono">¥{{ (stock.currentPrice * tradeShares * (userStore.user.monthCardActive ? 0.0005 : 0.001)).toFixed(2) }}</span>
              </div>
              <div class="cost-line total">
                <span>{{ quickTradeSide === 'BUY' ? '预计支付' : '预计回笼' }}</span>
                <strong class="font-mono" :class="quickTradeSide === 'BUY' ? 'up' : 'down'">
                  ¥{{ (stock.currentPrice * tradeShares * (quickTradeSide === 'BUY' ? 1.001 : 0.999)).toFixed(2) }}
                </strong>
              </div>
            </div>

            <!-- Risk Reminder -->
            <div class="risk-pill">
              <ShieldCheck :size="14" />
              <span>持仓风控：单只股票市值 ≤ 总资产 30% | 实行 T+1 交易规则</span>
            </div>

            <!-- Submit Button -->
            <button
              class="trade-submit-btn"
              :class="quickTradeSide === 'BUY' ? 'btn-buy' : 'btn-sell'"
              :disabled="isSubmitting"
              @click="handleTrade"
            >
              {{ quickTradeSide === 'BUY' ? `以 ¥${stock.currentPrice.toFixed(2)} 买入 ${stock.name}` : `以 ¥${stock.currentPrice.toFixed(2)} 卖出 ${stock.name}` }}
            </button>
          </div>
        </div>

        <!-- 2. Current Holding Card -->
        <div class="panel-card holding-card">
          <div class="panel-title-bar">
            <span class="title-text">我的当前持仓</span>
            <span v-if="userHolding" class="holding-badge">持有中</span>
            <span v-else class="text-soft">未持仓</span>
          </div>

          <div v-if="userHolding" class="holding-details">
            <div class="holding-metric-row">
              <div class="h-metric">
                <span class="h-label">持仓总量</span>
                <strong class="h-val font-mono">{{ userHolding.totalShares }} 股</strong>
              </div>
              <div class="h-metric">
                <span class="h-label">今日可卖 (T+1)</span>
                <strong class="h-val font-mono" :class="userHolding.availableShares > 0 ? 'text-blue' : 'text-soft'">
                  {{ userHolding.availableShares }} 股
                </strong>
              </div>
            </div>

            <div class="holding-metric-row">
              <div class="h-metric">
                <span class="h-label">持仓成本</span>
                <span class="h-val font-mono">¥{{ userHolding.costPrice.toFixed(2) }}</span>
              </div>
              <div class="h-metric">
                <span class="h-label">持仓市值</span>
                <span class="h-val font-mono">¥{{ (userHolding.totalShares * stock.currentPrice).toFixed(2) }}</span>
              </div>
            </div>

            <div class="profit-bar" :class="userHolding.floatProfit >= 0 ? 'p-up' : 'p-down'">
              <span>浮动盈亏：</span>
              <strong>
                {{ userHolding.floatProfit >= 0 ? '+' : '' }}¥{{ userHolding.floatProfit.toFixed(2) }}
                ({{ userHolding.profitRatio >= 0 ? '+' : '' }}{{ userHolding.profitRatio }}%)
              </strong>
            </div>

            <!-- Lots Details -->
            <div class="lots-list">
              <div class="lots-title">持仓批次 (T+1 状态)</div>
              <div v-for="lot in userHolding.lots" :key="lot.lotId" class="lot-row">
                <span>买入日: {{ lot.buyDate }}</span>
                <span>{{ lot.shares }}股 @ ¥{{ lot.costPrice.toFixed(2) }}</span>
                <span class="lot-status" :class="lot.canSellToday ? 'can-sell' : 'locked'">
                  {{ lot.canSellToday ? '可卖出' : 'T+1 锁定中' }}
                </span>
              </div>
            </div>
          </div>

          <div v-else class="empty-holding">
            <Coins :size="32" class="text-soft mb-2" />
            <p>您当前未持有 {{ stock.name }}，可上方下单建仓！</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stock-detail-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-card {
  background: rgba(17, 26, 44, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #38bdf8;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stock-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.hero-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stock-code-pill {
  font-family: monospace;
  font-size: 0.88rem;
  font-weight: 700;
  padding: 3px 10px;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.stock-hero-name {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
  color: #f8fafc;
}

.teacher-dept-pill {
  font-size: 0.84rem;
  color: #94a3b8;
  background: rgba(30, 41, 59, 0.6);
  padding: 4px 10px;
  border-radius: 8px;
}

.hero-course-sub {
  margin-top: 6px;
  font-size: 0.9rem;
  color: #cbd5e1;
}

.hero-price-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.price-val {
  font-size: 2.2rem;
  font-weight: 900;
  font-family: monospace;
}

.price-change-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 0.95rem;
}

.price-tag {
  font-size: 0.72rem;
  color: #94a3b8;
  background: rgba(30, 41, 59, 0.6);
  padding: 2px 6px;
  border-radius: 4px;
}

.metrics-ribbon {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
}

.metric-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.m-label {
  font-size: 0.72rem;
  color: #94a3b8;
}

.m-val {
  font-size: 0.96rem;
  font-weight: 700;
  font-family: monospace;
}

.m-val.gold {
  color: #fbbf24;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 20px;
}

.detail-left,
.detail-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel-card {
  background: rgba(17, 26, 44, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  padding-bottom: 12px;
}

.title-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  font-size: 1.05rem;
  font-weight: 700;
  color: #f8fafc;
}

.chart-period-tabs {
  display: flex;
  gap: 6px;
}

.tab-chip {
  font-size: 0.78rem;
  padding: 3px 8px;
  border-radius: 6px;
  color: #94a3b8;
  background: rgba(30, 41, 59, 0.6);
  cursor: pointer;
}

.tab-chip.active {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  font-weight: 600;
}

.kline-wrapper {
  height: 420px;
}

.factor-model-card .model-intro {
  margin: 0;
  font-size: 0.84rem;
  color: #94a3b8;
  line-height: 1.5;
}

.factors-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.factor-box {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.f-name {
  font-size: 0.76rem;
  color: #94a3b8;
  font-weight: 600;
}

.f-val {
  font-size: 1.25rem;
  font-weight: 800;
  font-family: monospace;
}

.f-calc {
  font-size: 0.68rem;
  color: #64748b;
  margin-top: 2px;
}

.proj-summary-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 12px;
  padding: 14px 18px;
}

.proj-summary-bar .sub {
  display: block;
  font-size: 0.72rem;
  color: #94a3b8;
  margin-bottom: 2px;
}

.proj-summary-bar .highlight {
  font-size: 1.35rem;
}

.clamp-pill {
  font-size: 0.84rem;
  font-family: monospace;
  background: rgba(15, 23, 42, 0.8);
  padding: 4px 8px;
  border-radius: 6px;
  color: #cbd5e1;
}

.trend-chart-box {
  background: rgba(15, 23, 42, 0.4);
  border-radius: 12px;
  padding: 8px;
  border: 1px solid rgba(148, 163, 184, 0.08);
}

.comment-stream {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stream-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: #e2e8f0;
}

.empty-reviews {
  font-size: 0.84rem;
  color: #64748b;
  text-align: center;
  padding: 20px;
}

.review-item {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rev-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rev-name {
  font-size: 0.84rem;
  font-weight: 600;
  color: #f1f5f9;
}

.rev-time {
  margin-left: 8px;
  font-size: 0.72rem;
  color: #64748b;
}

.rev-stars {
  color: #fbbf24;
  font-weight: 700;
  font-size: 0.84rem;
}

.rev-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-chip {
  font-size: 0.72rem;
  padding: 2px 6px;
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  border-radius: 4px;
}

.rev-text {
  margin: 0;
  font-size: 0.84rem;
  color: #cbd5e1;
  line-height: 1.45;
}

/* Trading Ticket Styles */
.side-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  background: rgba(15, 23, 42, 0.6);
  padding: 4px;
  border-radius: 12px;
}

.side-btn {
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.88rem;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.side-btn.buy.active {
  background: #f87171;
  color: white;
}

.side-btn.sell.active {
  background: #34d399;
  color: #111827;
}

.trade-form-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.f-label {
  font-size: 0.78rem;
  color: #94a3b8;
  font-weight: 500;
}

.market-price-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  padding: 10px 14px;
}

.fixed-price {
  font-size: 1.1rem;
  font-weight: 800;
  font-family: monospace;
  color: #f8fafc;
}

.price-type {
  font-size: 0.74rem;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  padding: 2px 6px;
  border-radius: 4px;
}

.percent-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.pct-btn {
  padding: 6px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #cbd5e1;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}

.pct-btn:hover {
  background: rgba(51, 65, 85, 0.8);
  color: #f8fafc;
}

.cost-breakdown {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.82rem;
}

.cost-line {
  display: flex;
  justify-content: space-between;
  color: #94a3b8;
}

.cost-line.total {
  border-top: 1px dashed rgba(148, 163, 184, 0.2);
  padding-top: 6px;
  font-size: 0.9rem;
  color: #f8fafc;
}

.risk-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: #94a3b8;
  background: rgba(30, 41, 59, 0.4);
  padding: 6px 10px;
  border-radius: 8px;
}

.trade-submit-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 0.96rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}

.trade-submit-btn.btn-buy {
  background: linear-gradient(135deg, #f87171, #ef4444);
  color: white;
}

.trade-submit-btn.btn-sell {
  background: linear-gradient(135deg, #34d399, #10b981);
  color: #0f172a;
}

.trade-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Holding Card Styles */
.holding-badge {
  font-size: 0.72rem;
  padding: 2px 6px;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border-radius: 4px;
}

.holding-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.holding-metric-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.h-metric {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 10px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.h-label {
  font-size: 0.72rem;
  color: #94a3b8;
}

.h-val {
  font-size: 0.95rem;
  font-weight: 700;
}

.profit-bar {
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  font-size: 0.84rem;
}

.p-up {
  background: rgba(248, 113, 113, 0.15);
  color: #f87171;
}

.p-down {
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
}

.lots-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lots-title {
  font-size: 0.76rem;
  color: #94a3b8;
  font-weight: 600;
}

.lot-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.76rem;
  font-family: monospace;
  background: rgba(15, 23, 42, 0.4);
  padding: 6px 8px;
  border-radius: 6px;
  color: #cbd5e1;
}

.lot-status.can-sell {
  color: #38bdf8;
}

.lot-status.locked {
  color: #f59e0b;
}

.empty-holding {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 10px;
  color: #94a3b8;
  font-size: 0.84rem;
  text-align: center;
}

.up { color: #f87171; }
.down { color: #34d399; }
.gold { color: #fbbf24; }
.text-blue { color: #38bdf8; }
.text-purple { color: #c084fc; }
.text-gold { color: #fbbf24; }
.text-soft { color: #94a3b8; }
.font-mono { font-family: monospace; }
.mr-1 { margin-right: 4px; }
.mb-2 { margin-bottom: 8px; }

@media (max-width: 1000px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .metrics-ribbon {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
