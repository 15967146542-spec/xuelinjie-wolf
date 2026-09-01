<script setup lang="ts">
import { useTaskStore } from '@/stores/task'
import { useUserStore } from '@/stores/user'
import {
  CheckSquare,
  GraduationCap,
  CalendarCheck,
  QrCode,
  MessageSquareText,
  TrendingUp,
  UserPlus,
  Coins,
  History,
  Sparkles
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'

const taskStore = useTaskStore()
const userStore = useUserStore()

const taskIconMap: Record<string, any> = {
  CalendarCheck,
  QrCode,
  MessageSquareText,
  TrendingUp,
  GraduationCap,
  UserPlus
}

function handleClaim(taskId: number) {
  const res = taskStore.claimTaskReward(taskId)
  if (res.success) {
    ElMessage.success(res.message)
  } else {
    ElMessage.warning(res.message)
  }
}
</script>

<template>
  <div class="task-view">
    <!-- Top Hero Banner -->
    <div class="task-hero-banner">
      <div class="banner-left">
        <div class="task-badge">
          <CheckSquare :size="15" />
          <span>学币激励中心</span>
        </div>
        <h2 class="banner-title">学习 · 评教 · 投资 · 绩点分红</h2>
        <p class="banner-desc">
          校内学生无法直接充值，通过日常到课签到、客观评教、模拟操盘与学期绩点认证获取核心投资本金。
        </p>
      </div>

      <div class="gpa-card-box">
        <div class="gpa-top">
          <GraduationCap :size="20" class="text-gold" />
          <span class="gpa-title">学期认证绩点</span>
        </div>
        <div class="gpa-number-line">
          <span class="gpa-val font-mono">{{ userStore.user.gpa.toFixed(2) }}</span>
          <span class="gpa-tier-tag">分红档位：+3,000 学币</span>
        </div>
        <div class="gpa-sub">已完成教务处系统学分认证</div>
      </div>
    </div>

    <!-- Main 2-Column Section -->
    <div class="task-main-grid">
      <!-- Left: Task Categories -->
      <div class="task-left">
        <!-- 1. Daily Tasks -->
        <div class="task-section-card">
          <div class="section-title-line">
            <div class="title-wrap">
              <CalendarCheck :size="18" class="text-blue" />
              <span class="sec-title">每日交易日常规任务</span>
            </div>
            <span class="refresh-tip">每日 00:00 自动刷新</span>
          </div>

          <div class="task-cards-list">
            <div
              v-for="task in taskStore.dailyTasks"
              :key="task.id"
              class="task-item-card"
              :class="{ completed: task.isClaimed }"
            >
              <div class="task-icon-box">
                <component :is="taskIconMap[task.icon] || CheckSquare" :size="20" />
              </div>

              <div class="task-info">
                <div class="t-name-row">
                  <strong class="t-name">{{ task.title }}</strong>
                  <span class="t-reward font-mono">+{{ task.reward }} 学币</span>
                </div>
                <p class="t-desc">{{ task.description }}</p>

                <!-- Progress Bar -->
                <div class="progress-wrap">
                  <el-progress
                    :percentage="Math.min(100, Math.floor((task.current / task.target) * 100))"
                    :status="task.isClaimed ? 'success' : ''"
                    :stroke-width="6"
                  />
                  <span class="progress-text">{{ task.current }}/{{ task.target }}</span>
                </div>
              </div>

              <div class="task-action-box">
                <button
                  v-if="!task.isClaimed && task.current >= task.target"
                  class="claim-btn active-claim"
                  @click="handleClaim(task.id)"
                >
                  领取奖励
                </button>
                <span v-else-if="task.isClaimed" class="claimed-tag">
                  已领取
                </span>
                <span v-else class="locked-tag">
                  进行中
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Semester GPA & Achievement Tasks -->
        <div class="task-section-card">
          <div class="section-title-line">
            <div class="title-wrap">
              <GraduationCap :size="18" class="text-gold" />
              <span class="sec-title">学期绩点分红与进阶成就</span>
            </div>
          </div>

          <div class="task-cards-list">
            <div
              v-for="task in [...taskStore.semesterTasks, ...taskStore.growthTasks]"
              :key="task.id"
              class="task-item-card"
              :class="{ completed: task.isClaimed }"
            >
              <div class="task-icon-box gold-icon">
                <component :is="taskIconMap[task.icon] || CheckSquare" :size="20" />
              </div>

              <div class="task-info">
                <div class="t-name-row">
                  <strong class="t-name">{{ task.title }}</strong>
                  <span class="t-reward gold font-mono">+{{ task.reward }} 学币</span>
                </div>
                <p class="t-desc">{{ task.description }}</p>

                <div class="progress-wrap">
                  <el-progress
                    :percentage="Math.min(100, Math.floor((task.current / task.target) * 100))"
                    :status="task.isClaimed ? 'success' : ''"
                    :stroke-width="6"
                  />
                  <span class="progress-text">{{ task.current }}/{{ task.target }}</span>
                </div>
              </div>

              <div class="task-action-box">
                <button
                  v-if="!task.isClaimed && task.current >= task.target"
                  class="claim-btn active-claim"
                  @click="handleClaim(task.id)"
                >
                  领取分红
                </button>
                <span v-else-if="task.isClaimed" class="claimed-tag">
                  已到账
                </span>
                <span v-else class="locked-tag">
                  待达成
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Coin Flow & Asset Ledger -->
      <div class="task-right">
        <div class="task-section-card ledger-card">
          <div class="section-title-line">
            <div class="title-wrap">
              <History :size="18" class="text-cyan" />
              <span class="sec-title">账户奖励与收支流水 (Ledger)</span>
            </div>
          </div>

          <div class="ledger-list">
            <div v-for="item in userStore.ledgers" :key="item.id" class="ledger-item">
              <div class="l-left">
                <strong class="l-title">{{ item.title }}</strong>
                <div class="l-sub">
                  <span>{{ item.category }}</span>
                  <span>{{ item.time }}</span>
                </div>
              </div>
              <div class="l-right">
                <span class="l-amount font-mono" :class="item.amount >= 0 ? 'up' : 'down'">
                  {{ item.amount >= 0 ? '+' : '' }}{{ item.amount.toLocaleString() }}
                </span>
                <small class="l-after">结余: ¥{{ item.balanceAfter.toLocaleString() }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.task-hero-banner {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 24px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  padding: 22px 28px;
}

.task-badge {
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

.gpa-card-box {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gpa-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gpa-title {
  font-size: 0.82rem;
  color: #fbbf24;
  font-weight: 700;
}

.gpa-number-line {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.gpa-val {
  font-size: 2.2rem;
  font-weight: 900;
  color: #f8fafc;
}

.gpa-tier-tag {
  font-size: 0.78rem;
  color: #34d399;
  background: rgba(52, 211, 153, 0.12);
  padding: 2px 8px;
  border-radius: 6px;
}

.gpa-sub {
  font-size: 0.72rem;
  color: #64748b;
}

.task-main-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;
}

.task-left,
.task-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.task-section-card {
  background: rgba(17, 26, 44, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  padding-bottom: 12px;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sec-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #f8fafc;
}

.refresh-tip {
  font-size: 0.74rem;
  color: #94a3b8;
}

.task-cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 14px;
  padding: 14px;
  display: grid;
  grid-template-columns: 44px 1fr 90px;
  align-items: center;
  gap: 14px;
}

.task-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-icon-box.gold-icon {
  background: rgba(251, 191, 36, 0.12);
  color: #fbbf24;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.t-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.t-name {
  font-size: 0.88rem;
  color: #f8fafc;
}

.t-reward {
  font-size: 0.84rem;
  color: #38bdf8;
  font-weight: 700;
}

.t-reward.gold {
  color: #fbbf24;
}

.t-desc {
  margin: 0;
  font-size: 0.76rem;
  color: #94a3b8;
}

.progress-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}

.progress-wrap :deep(.el-progress) {
  flex: 1;
}

.progress-text {
  font-size: 0.72rem;
  color: #64748b;
  font-family: monospace;
}

.claim-btn {
  padding: 7px 12px;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.78rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.claim-btn:hover {
  opacity: 0.9;
}

.claimed-tag {
  font-size: 0.76rem;
  color: #34d399;
  background: rgba(52, 211, 153, 0.12);
  padding: 4px 10px;
  border-radius: 6px;
}

.locked-tag {
  font-size: 0.76rem;
  color: #64748b;
  background: rgba(148, 163, 184, 0.08);
  padding: 4px 10px;
  border-radius: 6px;
}

.ledger-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ledger-item {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.08);
  border-radius: 12px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.l-title {
  font-size: 0.82rem;
  color: #f1f5f9;
}

.l-sub {
  display: flex;
  gap: 8px;
  font-size: 0.72rem;
  color: #64748b;
  margin-top: 2px;
}

.l-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.l-amount {
  font-size: 0.95rem;
  font-weight: 700;
}

.l-after {
  font-size: 0.68rem;
  color: #64748b;
}

.font-mono { font-family: monospace; }
.text-gold { color: #fbbf24; }
.text-blue { color: #38bdf8; }
.text-cyan { color: #38bdf8; }
.up { color: #f87171; }
.down { color: #34d399; }

@media (max-width: 950px) {
  .task-hero-banner { grid-template-columns: 1fr; }
  .task-main-grid { grid-template-columns: 1fr; }
}
</style>
