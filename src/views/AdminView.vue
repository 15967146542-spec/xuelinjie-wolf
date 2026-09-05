<script setup lang="ts">
import { ref } from 'vue'
import { useMarketStore } from '@/stores/market'
import { useEvaluationStore } from '@/stores/evaluation'
import { useTradeStore } from '@/stores/trade'
import {
  ShieldAlert,
  Sliders,
  PlayCircle,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  RefreshCw,
  Sparkles
} from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'

const marketStore = useMarketStore()
const evaluationStore = useEvaluationStore()
const tradeStore = useTradeStore()

const macroIndex = ref(marketStore.macroFactor.indexValue)
const macroTitle = ref(marketStore.macroFactor.title)
const macroDesc = ref(marketStore.macroFactor.description)

function handleSaveMacro() {
  if (marketStore.updateMacroFactor(macroIndex.value, macroTitle.value, macroDesc.value)) {
    ElMessage.success('宏观因子参数已全局生效更新！')
  }
}

function handleTriggerSettlement() {
  ElMessageBox.confirm(
    '确认执行收盘结算吗？这将把当期评教数据聚合、资金因子与宏观指数结算并生成下一交易日最新开盘指导价及日K线，同时解锁持仓T+1。',
    '收盘清算模拟 (15:30 引擎调度)',
    {
      confirmButtonText: '立即结算',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    if (!marketStore.settleNextTradingDay()) return
    tradeStore.unlockTPlusOne()
    tradeStore.syncPositionPrices()
    ElMessage.success('收盘清算完成！股价已根据基本面因子完成更新，T+1持仓已全部解锁可卖。')
  })
}

function handleAudit(evalId: string, status: 'APPROVED' | 'REJECTED' | 'DOWNWEIGHTED') {
  evaluationStore.moderateEvaluation(evalId, status)
  ElMessage.success(`评教审核状态已更新为：${status === 'APPROVED' ? '通过' : status === 'REJECTED' ? '屏蔽驳回' : '降权处理'}`)
}
</script>

<template>
  <div class="admin-view">
    <!-- Admin Hero Banner -->
    <div class="admin-hero-banner">
      <div class="banner-left">
        <div class="admin-badge">
          <ShieldAlert :size="15" />
          <span>学林街运营风控委员会 · 管理后台</span>
        </div>
        <h2 class="banner-title">宏观调控 · 行情清算引擎 · 评教审核</h2>
        <p class="banner-desc">
          调节学期大盘宏观因子，审查异常与恶意评教，执行收盘清算并验证股价波动因子的聚合落地。
        </p>
      </div>

      <div class="banner-right">
        <button class="settle-engine-btn" @click="handleTriggerSettlement">
          <PlayCircle :size="20" />
          <div>
            <strong>执行 15:30 收盘清算与次日结算</strong>
            <small>聚合星级因子 · 更新K线 · 解锁 T+1</small>
          </div>
        </button>
      </div>
    </div>

    <!-- Main Admin 2-Column Grid -->
    <div class="admin-main-grid">
      <!-- Left: Macro Factor Configuration -->
      <div class="admin-panel macro-config-card">
        <div class="p-header-line">
          <div class="t-wrap">
            <Sliders :size="18" class="text-purple" />
            <span class="p-title">宏观市场因子与敏感度配置</span>
          </div>
          <span class="p-sub">上次生效: {{ marketStore.macroFactor.updatedAt }}</span>
        </div>

        <div class="admin-form">
          <div class="f-group">
            <label>宏观行情公告标题</label>
            <el-input v-model="macroTitle" class="w-full" />
          </div>

          <div class="f-group">
            <label>宏观指数值 (标准基准 1.00)</label>
            <el-input-number v-model="macroIndex" :step="0.05" :min="0.5" :max="2.0" class="w-full" />
          </div>

          <div class="f-group">
            <label>宏观背景描述说明</label>
            <el-input v-model="macroDesc" type="textarea" :rows="3" class="w-full" />
          </div>

          <!-- Parameter matrix -->
          <div class="param-matrix">
            <div class="matrix-cell">
              <span>评教敏感度 (α)</span>
              <strong>{{ marketStore.macroFactor.alpha }}</strong>
            </div>
            <div class="matrix-cell">
              <span>资金敏感度 (β)</span>
              <strong>{{ marketStore.macroFactor.beta }}</strong>
            </div>
            <div class="matrix-cell">
              <span>宏观敏感度 (γ)</span>
              <strong>{{ marketStore.macroFactor.gamma }}</strong>
            </div>
            <div class="matrix-cell">
              <span>随机噪声标准差 (σ)</span>
              <strong>±{{ (marketStore.macroFactor.sigma * 100).toFixed(1) }}%</strong>
            </div>
          </div>

          <button class="save-macro-btn" @click="handleSaveMacro">
            保存并广播宏观因子
          </button>
        </div>
      </div>

      <!-- Right: Evaluation Audit & Moderation Queue -->
      <div class="admin-panel audit-panel-card">
        <div class="p-header-line">
          <div class="t-wrap">
            <AlertOctagon :size="18" class="text-gold" />
            <span class="p-title">学生评教审核与异常降权队列</span>
          </div>
          <span class="audit-count">共 {{ evaluationStore.evaluations.length }} 条记录</span>
        </div>

        <div class="audit-list">
          <div
            v-for="item in evaluationStore.evaluations"
            :key="item.id"
            class="audit-item"
          >
            <div class="audit-top">
              <div>
                <strong>{{ item.courseName }}</strong>
                <small class="text-soft"> · {{ item.teacherName }} ({{ item.stockCode }})</small>
              </div>
              <span class="audit-rating font-mono">★ {{ item.rating }} 星</span>
            </div>

            <div class="audit-tags">
              <span v-for="t in item.tags" :key="t" class="tag-chip">{{ t }}</span>
            </div>

            <p class="audit-comment">{{ item.comment }}</p>

            <div class="audit-actions">
              <span class="status-indicator" :class="item.status.toLowerCase()">
                状态: {{ item.status === 'APPROVED' ? '正常计入' : item.status === 'DOWNWEIGHTED' ? '已降权' : '已屏蔽' }}
              </span>

              <div class="btn-group">
                <button
                  class="act-btn approve"
                  @click="handleAudit(item.id, 'APPROVED')"
                >
                  <CheckCircle2 :size="12" /> 正常通过
                </button>
                <button
                  class="act-btn downweight"
                  @click="handleAudit(item.id, 'DOWNWEIGHTED')"
                >
                  <RefreshCw :size="12" /> 异常降权
                </button>
                <button
                  class="act-btn reject"
                  @click="handleAudit(item.id, 'REJECTED')"
                >
                  <XCircle :size="12" /> 屏蔽下架
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.admin-hero-banner {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  padding: 22px 28px;
}

.admin-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 700;
  color: #f87171;
  background: rgba(248, 113, 113, 0.12);
  border: 1px solid rgba(248, 113, 113, 0.3);
  padding: 3px 10px;
  border-radius: 12px;
  width: fit-content;
  margin-bottom: 8px;
}

.banner-title {
  margin: 0 0 8px 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: #f8fafc;
}

.banner-desc {
  margin: 0;
  font-size: 0.86rem;
  color: #94a3b8;
  line-height: 1.5;
}

.banner-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.settle-engine-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  border-radius: 14px;
  padding: 14px 20px;
  color: white;
  cursor: pointer;
  text-align: left;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
  transition: opacity 0.2s;
}

.settle-engine-btn:hover {
  opacity: 0.9;
}

.settle-engine-btn strong {
  display: block;
  font-size: 0.95rem;
}

.settle-engine-btn small {
  font-size: 0.74rem;
  opacity: 0.85;
}

.admin-main-grid {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 20px;
}

.admin-panel {
  background: rgba(17, 26, 44, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.p-header-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  padding-bottom: 12px;
}

.t-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.p-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #f8fafc;
}

.p-sub,
.audit-count {
  font-size: 0.74rem;
  color: #94a3b8;
}

.admin-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.f-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.f-group label {
  font-size: 0.78rem;
  color: #94a3b8;
}

.param-matrix {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  padding: 12px;
}

.matrix-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.matrix-cell span {
  font-size: 0.72rem;
  color: #94a3b8;
}

.matrix-cell strong {
  font-size: 0.95rem;
  color: #38bdf8;
  font-family: monospace;
}

.save-macro-btn {
  padding: 12px;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
}

.audit-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.audit-item {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.audit-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.audit-rating {
  color: #fbbf24;
  font-weight: 700;
  font-size: 0.86rem;
}

.audit-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-chip {
  font-size: 0.7rem;
  padding: 2px 6px;
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  border-radius: 4px;
}

.audit-comment {
  margin: 0;
  font-size: 0.82rem;
  color: #cbd5e1;
  line-height: 1.4;
}

.audit-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px dashed rgba(148, 163, 184, 0.12);
  padding-top: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.status-indicator {
  font-size: 0.74rem;
  font-weight: 600;
}

.status-indicator.approved { color: #34d399; }
.status-indicator.downweighted { color: #fbbf24; }
.status-indicator.rejected { color: #f87171; }

.btn-group {
  display: flex;
  gap: 6px;
}

.act-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  border-radius: 6px;
  font-size: 0.72rem;
  cursor: pointer;
  font-weight: 600;
}

.act-btn.approve { background: rgba(52, 211, 153, 0.15); color: #34d399; }
.act-btn.downweight { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
.act-btn.reject { background: rgba(248, 113, 113, 0.15); color: #f87171; }

.w-full { width: 100%; }
.text-soft { color: #94a3b8; }
.text-purple { color: #c084fc; }
.text-gold { color: #fbbf24; }
.font-mono { font-family: monospace; }

@media (max-width: 950px) {
  .admin-hero-banner { grid-template-columns: 1fr; }
  .admin-main-grid { grid-template-columns: 1fr; }
}
</style>
