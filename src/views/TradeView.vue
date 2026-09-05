<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMarketStore } from '@/stores/market'
import { useTradeStore } from '@/stores/trade'
import { useUserStore } from '@/stores/user'
import {
  ArrowLeftRight,
  ShieldCheck,
  Coins,
  History,
  Briefcase,
  AlertTriangle,
  Flame,
  CheckCircle2
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { calcTradeAmount, calcTradeFee, calcTradeNetReturn, calcTradePayable } from '@/rules'

const marketStore = useMarketStore()
const tradeStore = useTradeStore()
const userStore = useUserStore()

const selectedCode = ref(marketStore.selectedCode || '1005')
const side = ref<'BUY' | 'SELL'>('BUY')
const shares = ref<number>(20)
const activeTab = ref<'POSITIONS' | 'ORDERS'>('POSITIONS')

const currentStock = computed(() => {
  return marketStore.stocks.find((s) => s.code === selectedCode.value) || marketStore.stocks[0]
})

const currentHolding = computed(() => {
  return tradeStore.positions.find((p) => p.stockCode === selectedCode.value)
})

// 下单预估价：与 trade store 成交结算共用同一套手续费/回笼规则（月卡 5 折生效）
const previewAmount = computed(() => calcTradeAmount(currentStock.value.currentPrice, shares.value))
const previewFee = computed(() => calcTradeFee(previewAmount.value, userStore.user.monthCardActive))
const previewSettlement = computed(() => {
  const amount = previewAmount.value
  const fee = previewFee.value
  return side.value === 'BUY' ? calcTradePayable(amount, fee) : calcTradeNetReturn(amount, fee)
})

const maxAffordableShares = computed(() => {
  if (side.value === 'BUY') {
    return Math.floor(userStore.user.balance / currentStock.value.currentPrice)
  } else {
    return currentHolding.value ? currentHolding.value.availableShares : 0
  }
})

// Simulated Orderbook depth
const simulatedOrderbook = computed(() => {
  const p = currentStock.value.currentPrice
  return {
    asks: [
      { price: (p + 0.3).toFixed(2), volume: 120 },
      { price: (p + 0.2).toFixed(2), volume: 340 },
      { price: (p + 0.1).toFixed(2), volume: 560 }
    ],
    bids: [
      { price: (p - 0.1).toFixed(2), volume: 620 },
      { price: (p - 0.2).toFixed(2), volume: 480 },
      { price: (p - 0.3).toFixed(2), volume: 210 }
    ]
  }
})

function setPercentage(pct: number) {
  shares.value = Math.max(1, Math.floor(maxAffordableShares.value * (pct / 100)))
}

function handleTrade() {
  if (!shares.value || shares.value <= 0) {
    ElMessage.warning('请输入有效的交易股数')
    return
  }

  if (side.value === 'BUY') {
    const res = tradeStore.executeBuy(selectedCode.value, Number(shares.value))
    if (res.success) {
      ElMessage.success(res.message)
    } else {
      ElMessage.error(res.message)
    }
  } else {
    const res = tradeStore.executeSell(selectedCode.value, Number(shares.value))
    if (res.success) {
      ElMessage.success(res.message)
    } else {
      ElMessage.error(res.message)
    }
  }
}

function quickSellPosition(stockCode: string, availShares: number) {
  selectedCode.value = stockCode
  side.value = 'SELL'
  shares.value = availShares
  if (availShares <= 0) {
    ElMessage.warning('该持仓属于今日买入，T+1锁定中，不可卖出')
    return
  }
  const res = tradeStore.executeSell(stockCode, availShares)
  if (res.success) {
    ElMessage.success(res.message)
  } else {
    ElMessage.error(res.message)
  }
}
</script>

<template>
  <div class="trade-view">
    <!-- Top Asset & Risk Bar -->
    <div class="asset-banner">
      <div class="asset-card-main">
        <div class="asset-header">
          <span class="label">模拟账户总资产</span>
          <span class="safe-badge">
            <ShieldCheck :size="14" /> 30% 持仓限额风控运行中
          </span>
        </div>
        <div class="asset-number-line">
          <span class="asset-total font-mono">¥{{ tradeStore.totalAsset.toLocaleString() }}</span>
          <div class="profit-chip" :class="tradeStore.totalFloatProfit >= 0 ? 'up' : 'down'">
            <span>累计浮动盈亏：</span>
            <strong>
              {{ tradeStore.totalFloatProfit >= 0 ? '+' : '' }}¥{{ tradeStore.totalFloatProfit.toFixed(2) }}
              ({{ tradeStore.totalProfitRatio >= 0 ? '+' : '' }}{{ tradeStore.totalProfitRatio }}%)
            </strong>
          </div>
        </div>
      </div>

      <div class="asset-sub-stats">
        <div class="sub-stat-box">
          <span class="s-label">可用学币现金</span>
          <strong class="s-val gold font-mono">¥{{ userStore.user.balance.toLocaleString() }}</strong>
        </div>
        <div class="sub-stat-box">
          <span class="s-label">持仓证券市值</span>
          <strong class="s-val blue font-mono">¥{{ tradeStore.totalPositionValue.toLocaleString() }}</strong>
        </div>
        <div class="sub-stat-box">
          <span class="s-label">平台公共奖池 (50%手续费)</span>
          <strong class="s-val cyan font-mono">¥{{ tradeStore.platformFeePool.toLocaleString() }}</strong>
        </div>
      </div>
    </div>

    <!-- Main Terminal Grid: Left Order Ticket | Right Portfolio & Logs -->
    <div class="trade-terminal-grid">
      <!-- Left: Order Placement Desk -->
      <div class="terminal-card order-desk-card">
        <div class="card-title-bar">
          <div class="t-left">
            <ArrowLeftRight :size="18" class="text-blue" />
            <span class="t-text">交易委托柜台</span>
          </div>
          <span class="rule-tip">市价委托 · T+1 交割</span>
        </div>

        <!-- Stock Selector -->
        <div class="stock-select-row">
          <span class="f-label">标的代码 / 名称</span>
          <el-select v-model="selectedCode" size="large" class="w-full">
            <el-option
              v-for="s in marketStore.stocks"
              :key="s.code"
              :label="`${s.code} ${s.name} (¥${s.currentPrice.toFixed(2)})`"
              :value="s.code"
            />
          </el-select>
        </div>

        <!-- Side Selector -->
        <div class="desk-side-tabs">
          <button
            class="d-tab buy"
            :class="{ active: side === 'BUY' }"
            @click="side = 'BUY'"
          >
            买入 (看多)
          </button>
          <button
            class="d-tab sell"
            :class="{ active: side === 'SELL' }"
            @click="side = 'SELL'"
          >
            卖出 (减仓)
          </button>
        </div>

        <!-- Orderbook Depth Preview -->
        <div class="depth-box">
          <div class="depth-title">五档模拟深度 (盘口参考)</div>
          <div class="depth-rows">
            <div v-for="(ask, i) in simulatedOrderbook.asks.slice().reverse()" :key="'ask'+i" class="depth-row ask">
              <span>卖 {{ 3 - i }}</span>
              <span class="font-mono">¥{{ ask.price }}</span>
              <span class="vol">{{ ask.volume }}股</span>
            </div>
            <div class="current-price-row">
              <span>最新成交价</span>
              <strong class="font-mono text-xl" :class="currentStock.currentPrice >= currentStock.prevClose ? 'up' : 'down'">
                ¥{{ currentStock.currentPrice.toFixed(2) }}
              </strong>
            </div>
            <div v-for="(bid, i) in simulatedOrderbook.bids" :key="'bid'+i" class="depth-row bid">
              <span>买 {{ i + 1 }}</span>
              <span class="font-mono">¥{{ bid.price }}</span>
              <span class="vol">{{ bid.volume }}股</span>
            </div>
          </div>
        </div>

        <!-- Shares Input & Sliders -->
        <div class="shares-input-section">
          <div class="section-top">
            <span class="f-label">委托股数</span>
            <span class="f-limit">最多可{{ side === 'BUY' ? '买' : '卖' }}: <strong>{{ maxAffordableShares }} 股</strong></span>
          </div>

          <el-input-number
            v-model="shares"
            :min="1"
            :max="maxAffordableShares > 0 ? maxAffordableShares : 9999"
            class="w-full mb-2"
          />

          <div class="pct-btn-group">
            <button class="pct-chip" @click="setPercentage(25)">25%</button>
            <button class="pct-chip" @click="setPercentage(50)">50%</button>
            <button class="pct-chip" @click="setPercentage(75)">75%</button>
            <button class="pct-chip" @click="setPercentage(100)">全仓</button>
          </div>
        </div>

        <!-- Cost & Fee Details -->
        <div class="ticket-cost-summary">
          <div class="summary-line">
            <span>预估发生金额</span>
            <strong class="font-mono">¥{{ previewAmount.toFixed(2) }}</strong>
          </div>
          <div class="summary-line">
            <span>交易规费 (0.1%{{ userStore.user.monthCardActive ? ' ·月卡5折' : '' }})</span>
            <span class="font-mono">¥{{ previewFee.toFixed(2) }}</span>
          </div>
          <div class="summary-line total-line">
            <span>{{ side === 'BUY' ? '实付学币' : '实收学币' }}</span>
            <strong class="font-mono text-lg" :class="side === 'BUY' ? 'up' : 'down'">
              ¥{{ previewSettlement.toFixed(2) }}
            </strong>
          </div>
        </div>

        <!-- Action Button -->
        <button
          class="submit-trade-action-btn"
          :class="side === 'BUY' ? 'buy-action' : 'sell-action'"
          @click="handleTrade"
        >
          立即{{ side === 'BUY' ? '买入' : '卖出' }} {{ currentStock.name }}
        </button>
      </div>

      <!-- Right: Portfolio Position Table + Order History -->
      <div class="terminal-card portfolio-desk-card">
        <div class="card-title-bar">
          <div class="terminal-tabs">
            <button
              class="terminal-tab"
              :class="{ active: activeTab === 'POSITIONS' }"
              @click="activeTab = 'POSITIONS'"
            >
              <Briefcase :size="16" /> 我的持仓组合 ({{ tradeStore.positions.length }})
            </button>
            <button
              class="terminal-tab"
              :class="{ active: activeTab === 'ORDERS' }"
              @click="activeTab = 'ORDERS'"
            >
              <History :size="16" /> 历史成交记录 ({{ tradeStore.orders.length }})
            </button>
          </div>
        </div>

        <!-- Positions Table -->
        <div v-if="activeTab === 'POSITIONS'" class="tab-table-wrapper">
          <div v-if="tradeStore.positions.length === 0" class="empty-state">
            <Coins :size="40" class="text-soft mb-2" />
            <p>当前暂无持仓，在左侧选择标的并下单建仓</p>
          </div>
          <table v-else class="trade-table">
            <thead>
              <tr>
                <th>标的代码 / 教师</th>
                <th class="text-right">持仓总数</th>
                <th class="text-right">可卖数量(T+1)</th>
                <th class="text-right">成本均价</th>
                <th class="text-right">最新市价</th>
                <th class="text-right">持仓市值</th>
                <th class="text-right">浮动盈亏</th>
                <th class="text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pos in tradeStore.positions" :key="pos.stockCode">
                <td>
                  <div class="pos-stock-name">
                    <span class="code-badge">{{ pos.stockCode }}</span>
                    <strong>{{ pos.stockName }}</strong>
                  </div>
                </td>
                <td class="text-right font-mono font-bold">{{ pos.totalShares }} 股</td>
                <td class="text-right font-mono" :class="pos.availableShares > 0 ? 'text-blue' : 'text-soft'">
                  {{ pos.availableShares }} 股
                </td>
                <td class="text-right font-mono">¥{{ pos.costPrice.toFixed(2) }}</td>
                <td class="text-right font-mono">¥{{ pos.currentPrice.toFixed(2) }}</td>
                <td class="text-right font-mono">¥{{ pos.marketValue.toFixed(2) }}</td>
                <td class="text-right font-mono" :class="pos.floatProfit >= 0 ? 'up' : 'down'">
                  <div>{{ pos.floatProfit >= 0 ? '+' : '' }}¥{{ pos.floatProfit.toFixed(2) }}</div>
                  <small>({{ pos.profitRatio >= 0 ? '+' : '' }}{{ pos.profitRatio }}%)</small>
                </td>
                <td class="text-center">
                  <el-button
                    size="small"
                    type="danger"
                    plain
                    :disabled="pos.availableShares <= 0"
                    @click="quickSellPosition(pos.stockCode, pos.availableShares)"
                  >
                    {{ pos.availableShares > 0 ? '平仓' : 'T+1锁定' }}
                  </el-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Orders Table -->
        <div v-if="activeTab === 'ORDERS'" class="tab-table-wrapper">
          <table class="trade-table">
            <thead>
              <tr>
                <th>订单编号</th>
                <th>标的</th>
                <th class="text-center">方向</th>
                <th class="text-right">成交价</th>
                <th class="text-right">成交股数</th>
                <th class="text-right">总金额</th>
                <th class="text-right">手续费</th>
                <th class="text-center">状态</th>
                <th class="text-right">成交时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ord in tradeStore.orders" :key="ord.id">
                <td class="font-mono text-soft">{{ ord.orderNo }}</td>
                <td>
                  <strong>{{ ord.stockName }}</strong>
                  <small class="code-text"> ({{ ord.stockCode }})</small>
                </td>
                <td class="text-center">
                  <span class="side-badge" :class="ord.side === 'BUY' ? 'side-buy' : 'side-sell'">
                    {{ ord.side === 'BUY' ? '买入' : '卖出' }}
                  </span>
                </td>
                <td class="text-right font-mono">¥{{ ord.price.toFixed(2) }}</td>
                <td class="text-right font-mono">{{ ord.shares }} 股</td>
                <td class="text-right font-mono">¥{{ ord.amount.toFixed(2) }}</td>
                <td class="text-right font-mono text-soft">¥{{ ord.fee.toFixed(2) }}</td>
                <td class="text-center">
                  <el-tag size="small" type="success" effect="plain">全部成交</el-tag>
                </td>
                <td class="text-right font-mono text-soft">{{ ord.createTime }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trade-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.asset-banner {
  display: grid;
  grid-template-columns: 1.4fr 1.6fr;
  gap: 20px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  padding: 20px 24px;
}

.asset-card-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.asset-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.asset-header .label {
  font-size: 0.82rem;
  color: #94a3b8;
  font-weight: 600;
}

.safe-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  padding: 2px 8px;
  border-radius: 6px;
}

.asset-number-line {
  display: flex;
  align-items: baseline;
  gap: 16px;
  flex-wrap: wrap;
}

.asset-total {
  font-size: 2.2rem;
  font-weight: 900;
  color: #f8fafc;
}

.profit-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.86rem;
}

.profit-chip.up {
  background: rgba(248, 113, 113, 0.15);
  color: #f87171;
}

.profit-chip.down {
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
}

.asset-sub-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.sub-stat-box {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.s-label {
  font-size: 0.72rem;
  color: #94a3b8;
}

.s-val {
  font-size: 1.15rem;
  font-weight: 700;
}

.s-val.gold { color: #fbbf24; }
.s-val.blue { color: #60a5fa; }
.s-val.cyan { color: #38bdf8; }

.trade-terminal-grid {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 20px;
}

.terminal-card {
  background: rgba(17, 26, 44, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  padding-bottom: 12px;
}

.t-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.t-text {
  font-size: 1.05rem;
  font-weight: 700;
  color: #f8fafc;
}

.rule-tip {
  font-size: 0.72rem;
  color: #94a3b8;
}

.stock-select-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.f-label {
  font-size: 0.78rem;
  color: #94a3b8;
}

.desk-side-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  background: rgba(15, 23, 42, 0.6);
  padding: 4px;
  border-radius: 12px;
}

.d-tab {
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.88rem;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
}

.d-tab.buy.active {
  background: #f87171;
  color: white;
}

.d-tab.sell.active {
  background: #34d399;
  color: #111827;
}

.depth-box {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.depth-title {
  font-size: 0.72rem;
  color: #64748b;
  font-weight: 600;
}

.depth-rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.depth-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.76rem;
}

.depth-row.ask { color: #34d399; }
.depth-row.bid { color: #f87171; }
.depth-row .vol { color: #64748b; }

.current-price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px dashed rgba(148, 163, 184, 0.15);
  border-bottom: 1px dashed rgba(148, 163, 184, 0.15);
  padding: 4px 0;
  font-size: 0.8rem;
  color: #94a3b8;
}

.shares-input-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-top {
  display: flex;
  justify-content: space-between;
  font-size: 0.76rem;
}

.f-limit strong {
  color: #38bdf8;
}

.pct-btn-group {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.pct-chip {
  padding: 6px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 8px;
  color: #cbd5e1;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}

.pct-chip:hover {
  background: rgba(51, 65, 85, 0.8);
}

.ticket-cost-summary {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.82rem;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  color: #94a3b8;
}

.summary-line.total-line {
  border-top: 1px dashed rgba(148, 163, 184, 0.2);
  padding-top: 6px;
  font-weight: 700;
  color: #f8fafc;
}

.submit-trade-action-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 0.96rem;
  font-weight: 800;
  cursor: pointer;
  transition: opacity 0.2s;
}

.submit-trade-action-btn.buy-action {
  background: linear-gradient(135deg, #f87171, #ef4444);
  color: white;
}

.submit-trade-action-btn.sell-action {
  background: linear-gradient(135deg, #34d399, #10b981);
  color: #0f172a;
}

/* Portfolio Table Styles */
.terminal-tabs {
  display: flex;
  gap: 12px;
}

.terminal-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #94a3b8;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
}

.terminal-tab.active {
  color: #38bdf8;
  border-bottom-color: #38bdf8;
}

.tab-table-wrapper {
  overflow-x: auto;
}

.trade-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
}

.trade-table th {
  padding: 10px 12px;
  color: #94a3b8;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(15, 23, 42, 0.4);
  text-align: left;
}

.trade-table td {
  padding: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.pos-stock-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.code-badge {
  font-family: monospace;
  font-size: 0.74rem;
  padding: 2px 6px;
  background: rgba(139, 92, 246, 0.15);
  color: #c4b5fd;
  border-radius: 6px;
}

.code-text {
  font-family: monospace;
  color: #64748b;
}

.side-badge {
  font-size: 0.74rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
}

.side-badge.side-buy {
  background: rgba(248, 113, 113, 0.15);
  color: #f87171;
}

.side-badge.side-sell {
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  color: #94a3b8;
}

.w-full { width: 100%; }
.mb-2 { margin-bottom: 8px; }
.text-right { text-align: right; }
.text-center { text-align: center; }
.text-blue { color: #38bdf8; }
.text-soft { color: #94a3b8; }
.font-mono { font-family: monospace; }
.font-bold { font-weight: 700; }
.up { color: #f87171; }
.down { color: #34d399; }
.text-xl { font-size: 1.2rem; }
.text-lg { font-size: 1.05rem; }

@media (max-width: 1050px) {
  .asset-banner { grid-template-columns: 1fr; }
  .trade-terminal-grid { grid-template-columns: 1fr; }
}
</style>
