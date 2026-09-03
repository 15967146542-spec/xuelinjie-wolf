<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMarketStore } from '@/stores/market'
import type { MarketSortBy, MarketTab, SortOrder, TeacherStock } from '@/types'
import KLineChart from '@/components/KLineChart.vue'
import {
  Search,
  Star,
  Flame,
  ArrowUpRight,
  Activity,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'

const router = useRouter()
const marketStore = useMarketStore()

const searchQuery = ref('')
const activeTab = ref<MarketTab>('ALL')
const sortBy = ref<MarketSortBy>('ratio')
const sortOrder = ref<SortOrder>('desc')

const filteredStocks = computed(() => {
  let list = [...marketStore.stocks]

  if (activeTab.value === 'WATCHLIST') {
    list = list.filter((s) => s.isWatchlisted)
  } else if (activeTab.value === 'GAINERS') {
    list = list.filter((s) => s.currentPrice >= s.prevClose)
  } else if (activeTab.value === 'HIGH_RATING') {
    list = list.filter((s) => s.rating >= 4.5)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.includes(q) ||
        s.course.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q)
    )
  }

  list.sort((a, b) => {
    let diff = 0
    if (sortBy.value === 'ratio') {
      const ratioA = ((a.currentPrice - a.prevClose) / a.prevClose) * 100
      const ratioB = ((b.currentPrice - b.prevClose) / b.prevClose) * 100
      diff = ratioA - ratioB
    } else if (sortBy.value === 'price') {
      diff = a.currentPrice - b.currentPrice
    } else if (sortBy.value === 'volume') {
      diff = a.volume - b.volume
    } else if (sortBy.value === 'rating') {
      diff = a.rating - b.rating
    }
    return sortOrder.value === 'desc' ? -diff : diff
  })

  return list
})

const totalAmountWan = computed(() => {
  const totalAmount = marketStore.stocks.reduce((acc: number, s: TeacherStock) => acc + s.amount, 0)
  return (totalAmount / 10000).toFixed(1)
})

function getRatio(stock: { currentPrice: number; prevClose: number }) {
  const val = ((stock.currentPrice - stock.prevClose) / stock.prevClose) * 100
  return Number(val.toFixed(2))
}

function handleRowClick(row: TeacherStock) {
  marketStore.selectStock(row.code)
}

function goToDetail(code: string) {
  marketStore.selectStock(code)
  router.push(`/stock/${code}`)
}

function toggleFav(code: string, e: Event) {
  e.stopPropagation()
  marketStore.toggleWatchlist(code)
  ElMessage.success('自选股状态已更新')
}
</script>

<template>
  <div class="market-view">
    <!-- Macro Index & Market Banner -->
    <div class="macro-banner">
      <div class="macro-left">
        <div class="macro-badge">
          <Activity :size="15" />
          <span>宏观因子广播</span>
        </div>
        <h2 class="macro-title">{{ marketStore.macroFactor.title }}</h2>
        <p class="macro-desc">{{ marketStore.macroFactor.description }}</p>
        <div class="macro-params">
          <span>评价敏感度 (α): <strong>{{ marketStore.macroFactor.alpha }}</strong></span>
          <span>资金流敏感度 (β): <strong>{{ marketStore.macroFactor.beta }}</strong></span>
          <span>宏观敏感度 (γ): <strong>{{ marketStore.macroFactor.gamma }}</strong></span>
          <span>波动噪声 (σ): <strong>±{{ (marketStore.macroFactor.sigma * 100).toFixed(1) }}%</strong></span>
        </div>
      </div>

      <div class="macro-right">
        <div class="index-box">
          <div class="index-title">学林综合指数 (XL-INDEX)</div>
          <div class="index-number-row">
            <span class="index-num">{{ marketStore.marketIndex }}</span>
            <span class="index-delta" :class="marketStore.indexChangePct >= 0 ? 'up' : 'down'">
              <ArrowUpRight :size="18" />
              {{ marketStore.indexChangePct >= 0 ? '+' : '' }}{{ marketStore.indexChangePct }}%
            </span>
          </div>
          <div class="index-sub">今日成交总量: {{ totalAmountWan }}万学币</div>
        </div>
      </div>
    </div>

    <!-- Main Content Layout: Stock List Table + Live KLine Sidebar -->
    <div class="market-layout">
      <!-- Left: Stock List Section -->
      <div class="stock-table-card">
        <div class="table-toolbar">
          <div class="tabs-group">
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'ALL' }"
              @click="activeTab = 'ALL'"
            >
              <Layers :size="15" /> 全部标的 ({{ marketStore.stocks.length }})
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'WATCHLIST' }"
              @click="activeTab = 'WATCHLIST'"
            >
              <Star :size="15" /> 自选关注
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'GAINERS' }"
              @click="activeTab = 'GAINERS'"
            >
              <Flame :size="15" /> 领涨标的
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'HIGH_RATING' }"
              @click="activeTab = 'HIGH_RATING'"
            >
              <Sparkles :size="15" /> 五星口碑
            </button>
          </div>

          <div class="search-box">
            <el-input
              v-model="searchQuery"
              placeholder="搜索股票代码 / 教师 / 课程 / 院系..."
              clearable
              size="default"
              class="cyber-input"
            >
              <template #prefix>
                <Search :size="15" class="search-icon" />
              </template>
            </el-input>
          </div>
        </div>

        <!-- Stock Table -->
        <div class="stock-list-container">
          <table class="cyber-table">
            <thead>
              <tr>
                <th width="40">自选</th>
                <th width="140">代码 / 名称</th>
                <th>主讲课程 / 院系</th>
                <th width="110" class="text-right">最新价 (学币)</th>
                <th width="100" class="text-right">今日涨跌</th>
                <th width="100" class="text-right">涨跌幅</th>
                <th width="90" class="text-center">评教星级</th>
                <th width="120" class="text-right">当日成交额</th>
                <th width="90" class="text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="stock in filteredStocks"
                :key="stock.code"
                class="stock-row"
                :class="{ selected: stock.code === marketStore.selectedCode }"
                @click="handleRowClick(stock)"
              >
                <td class="text-center" @click="toggleFav(stock.code, $event)">
                  <Star
                    :size="16"
                    class="fav-icon"
                    :class="{ 'fav-active': stock.isWatchlisted }"
                  />
                </td>
                <td>
                  <div class="stock-main-cell">
                    <span class="code-badge">{{ stock.code }}</span>
                    <strong class="name-text">{{ stock.name }}</strong>
                  </div>
                </td>
                <td>
                  <div class="course-cell">
                    <span class="course-name">{{ stock.course }}</span>
                    <span class="teacher-tag">{{ stock.teacherName }} · {{ stock.department }}</span>
                  </div>
                </td>
                <td class="text-right font-mono font-bold">
                  ¥{{ stock.currentPrice.toFixed(2) }}
                </td>
                <td class="text-right font-mono" :class="stock.currentPrice >= stock.prevClose ? 'up' : 'down'">
                  {{ stock.currentPrice >= stock.prevClose ? '+' : '' }}{{ (stock.currentPrice - stock.prevClose).toFixed(2) }}
                </td>
                <td class="text-right font-mono" :class="getRatio(stock) >= 0 ? 'up' : 'down'">
                  <span class="ratio-pill" :class="getRatio(stock) >= 0 ? 'ratio-up' : 'ratio-down'">
                    {{ getRatio(stock) >= 0 ? '+' : '' }}{{ getRatio(stock) }}%
                  </span>
                </td>
                <td class="text-center">
                  <div class="rating-cell">
                    <span class="star-text">★ {{ stock.rating.toFixed(1) }}</span>
                    <small class="count-text">({{ stock.ratingCount }})</small>
                  </div>
                </td>
                <td class="text-right font-mono text-soft">
                  ¥{{ (stock.amount / 10000).toFixed(1) }}万
                </td>
                <td class="text-center">
                  <el-button
                    size="small"
                    type="primary"
                    link
                    @click.stop="goToDetail(stock.code)"
                  >
                    详情 <ExternalLink :size="12" class="ml-1" />
                  </el-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right: Live Selected Stock Preview Panel -->
      <div class="stock-preview-card">
        <div class="preview-header">
          <div class="preview-title-box">
            <span class="p-code">{{ marketStore.selectedStock.code }}</span>
            <h3 class="p-name">{{ marketStore.selectedStock.name }}</h3>
            <span class="p-dept">{{ marketStore.selectedStock.department }}</span>
          </div>
          <el-button
            type="primary"
            size="small"
            class="action-btn"
            @click="goToDetail(marketStore.selectedStock.code)"
          >
            进入交易与评教
          </el-button>
        </div>

        <div class="preview-stats-grid">
          <div class="stat-item">
            <span class="label">最新价</span>
            <strong class="val" :class="marketStore.selectedStock.currentPrice >= marketStore.selectedStock.prevClose ? 'up' : 'down'">
              ¥{{ marketStore.selectedStock.currentPrice.toFixed(2) }}
            </strong>
          </div>
          <div class="stat-item">
            <span class="label">今日涨跌幅</span>
            <strong class="val" :class="getRatio(marketStore.selectedStock) >= 0 ? 'up' : 'down'">
              {{ getRatio(marketStore.selectedStock) >= 0 ? '+' : '' }}{{ getRatio(marketStore.selectedStock) }}%
            </strong>
          </div>
          <div class="stat-item">
            <span class="label">近5节课评教均分</span>
            <strong class="val gold">★ {{ marketStore.selectedStock.last5AvgRating.toFixed(2) }}</strong>
          </div>
          <div class="stat-item">
            <span class="label">资金净流入</span>
            <strong class="val" :class="marketStore.selectedStock.netInflow >= 0 ? 'up' : 'down'">
              {{ marketStore.selectedStock.netInflow >= 0 ? '+' : '' }}¥{{ (marketStore.selectedStock.netInflow / 10000).toFixed(1) }}万
            </strong>
          </div>
        </div>

        <!-- ECharts K-Line Component -->
        <div class="preview-chart-box">
          <div class="chart-header-line">
            <span class="chart-tag">日K走势与成交量</span>
            <span class="chart-sub">红涨绿跌 · 包含MA5/MA10/MA20均线</span>
          </div>
          <KLineChart
            :data="marketStore.klineCache[marketStore.selectedStock.code] || []"
            :stock-name="marketStore.selectedStock.name"
          />
        </div>

        <div class="stock-intro-box">
          <div class="intro-title">教师与课程背景：</div>
          <p class="intro-text">{{ marketStore.selectedStock.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.market-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.macro-banner {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 24px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  padding: 22px 28px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.macro-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.macro-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 700;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 3px 10px;
  border-radius: 12px;
  width: fit-content;
}

.macro-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: #f8fafc;
}

.macro-desc {
  margin: 0;
  font-size: 0.88rem;
  color: #94a3b8;
  line-height: 1.5;
}

.macro-params {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 0.8rem;
  color: #cbd5e1;
  background: rgba(15, 23, 42, 0.6);
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.macro-params strong {
  color: #38bdf8;
}

.macro-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.index-box {
  width: 100%;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  padding: 18px 22px;
}

.index-title {
  font-size: 0.82rem;
  color: #94a3b8;
  font-weight: 600;
}

.index-number-row {
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin: 8px 0 4px 0;
}

.index-num {
  font-size: 2.2rem;
  font-weight: 900;
  color: #f8fafc;
  font-family: monospace;
}

.index-delta {
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 800;
}

.index-delta.up {
  color: #f87171;
}

.index-delta.down {
  color: #34d399;
}

.index-sub {
  font-size: 0.76rem;
  color: #64748b;
}

.market-layout {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 20px;
}

.stock-table-card,
.stock-preview-card {
  background: rgba(17, 26, 44, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.tabs-group {
  display: flex;
  gap: 8px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  color: #94a3b8;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #f8fafc;
  background: rgba(51, 65, 85, 0.8);
}

.tab-btn.active {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border-color: rgba(56, 189, 248, 0.4);
}

.search-box {
  width: 260px;
}

.stock-list-container {
  overflow-x: auto;
}

.cyber-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
}

.cyber-table th {
  padding: 10px 12px;
  color: #94a3b8;
  font-weight: 600;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(15, 23, 42, 0.4);
  text-align: left;
}

.cyber-table td {
  padding: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.stock-row {
  cursor: pointer;
  transition: background 0.15s;
}

.stock-row:hover {
  background: rgba(56, 189, 248, 0.05);
}

.stock-row.selected {
  background: rgba(56, 189, 248, 0.1);
  box-shadow: inset 3px 0 0 #38bdf8;
}

.fav-icon {
  color: #64748b;
  cursor: pointer;
  transition: color 0.2s;
}

.fav-icon.fav-active {
  color: #fbbf24;
  fill: #fbbf24;
}

.stock-main-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.code-badge {
  font-family: monospace;
  font-size: 0.76rem;
  padding: 2px 6px;
  background: rgba(139, 92, 246, 0.15);
  color: #c4b5fd;
  border-radius: 6px;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.name-text {
  color: #f8fafc;
  font-size: 0.92rem;
}

.course-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.course-name {
  color: #e2e8f0;
  font-weight: 500;
}

.teacher-tag {
  color: #64748b;
  font-size: 0.74rem;
}

.up {
  color: #f87171;
  font-weight: 600;
}

.down {
  color: #34d399;
  font-weight: 600;
}

.ratio-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.8rem;
}

.ratio-up {
  background: rgba(248, 113, 113, 0.15);
  color: #f87171;
}

.ratio-down {
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
}

.rating-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.star-text {
  color: #fbbf24;
  font-weight: 700;
}

.count-text {
  color: #64748b;
  font-size: 0.7rem;
}

.font-mono {
  font-family: monospace;
}

.font-bold {
  font-weight: 700;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

.text-soft {
  color: #94a3b8;
}

.ml-1 {
  margin-left: 4px;
}

/* Preview Card Styles */
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  padding-bottom: 14px;
}

.preview-title-box {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.p-code {
  font-family: monospace;
  font-size: 0.82rem;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  padding: 2px 8px;
  border-radius: 6px;
}

.p-name {
  margin: 0;
  font-size: 1.3rem;
  color: #f8fafc;
}

.p-dept {
  font-size: 0.78rem;
  color: #94a3b8;
}

.action-btn {
  border-radius: 12px !important;
  font-weight: 600 !important;
}

.preview-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-item {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 12px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item .label {
  font-size: 0.74rem;
  color: #94a3b8;
}

.stat-item .val {
  font-size: 1.15rem;
  font-family: monospace;
}

.stat-item .val.gold {
  color: #fbbf24;
}

.preview-chart-box {
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  padding: 12px;
  height: 380px;
  display: flex;
  flex-direction: column;
}

.chart-header-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.chart-tag {
  font-size: 0.82rem;
  font-weight: 700;
  color: #cbd5e1;
}

.chart-sub {
  font-size: 0.72rem;
  color: #64748b;
}

.stock-intro-box {
  background: rgba(15, 23, 42, 0.4);
  border-radius: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.08);
}

.intro-title {
  font-size: 0.78rem;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 4px;
}

.intro-text {
  margin: 0;
  font-size: 0.82rem;
  color: #cbd5e1;
  line-height: 1.5;
}

@media (max-width: 1100px) {
  .macro-banner {
    grid-template-columns: 1fr;
  }
  .market-layout {
    grid-template-columns: 1fr;
  }
}
</style>
