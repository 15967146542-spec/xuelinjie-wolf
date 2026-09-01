<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { useTradeStore } from '@/stores/trade'
import {
  User,
  ShieldCheck,
  CreditCard,
  Sparkles,
  ShoppingBag,
  Coins,
  Award,
  Clock,
  History,
  GraduationCap
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const tradeStore = useTradeStore()

const rechargeTiers = [
  { cny: 6, coins: 600, tag: '新手体验' },
  { cny: 30, coins: 3000, tag: '超值热销' },
  { cny: 68, coins: 6800, tag: '赛季通行' },
  { cny: 128, coins: 12800, tag: '资深量化' },
  { cny: 328, coins: 32800, tag: '大户席位' },
  { cny: 648, coins: 64800, tag: '学林巨鳄' }
]

function handleRecharge(tier: { cny: number; coins: number }) {
  userStore.rechargeCoins(tier.cny)
  ElMessage.success(`模拟充值成功！已到账 +${tier.coins} 学币`)
}

function handleBuyMonthCard() {
  if (userStore.user.monthCardActive) {
    ElMessage.info('您的月卡仍在有效期内')
    return
  }
  userStore.purchaseMonthCard()
  ElMessage.success('已开通月卡！已解锁交易特权、手续费5折及每日领取权益')
}
</script>

<template>
  <div class="profile-view">
    <!-- User Profile Header Banner -->
    <div class="user-hero-banner">
      <div class="hero-left">
        <div class="avatar-box">
          <img src="https://api.dicebear.com/7.x/bottts/svg?seed=wolf07" class="avatar-img" alt="avatar" />
        </div>
        <div class="u-info">
          <div class="u-name-line">
            <h2 class="u-title">{{ userStore.user.name }}</h2>
            <span class="honor-badge">长电股神</span>
            <span class="role-badge">{{ userStore.roleText }}</span>
          </div>
          <p class="u-sub-line">
            {{ userStore.user.department }} · 学号: {{ userStore.user.studentId || '社会注册用户' }}
          </p>
          <div class="pass-exp-bar">
            <span>赛季通行证等级: <strong>Lv.{{ userStore.user.battlePassLevel }}</strong> ({{ userStore.user.battlePassExp }}/1000 EXP)</span>
          </div>
        </div>
      </div>

      <div class="hero-right">
        <div class="asset-snapshot">
          <span class="snap-label">全仓净总资产</span>
          <strong class="snap-val font-mono">¥{{ tradeStore.totalAsset.toLocaleString() }}</strong>
          <div class="snap-sub">
            可用现金: ¥{{ userStore.user.balance.toLocaleString() }} | 证券市值: ¥{{ tradeStore.totalPositionValue.toLocaleString() }}
          </div>
        </div>
      </div>
    </div>

    <!-- Main Grid: Commercialization Shop & Privileges + Verification -->
    <div class="profile-main-grid">
      <!-- Left: Month Card & External Recharge Shop -->
      <div class="profile-left">
        <!-- 1. VIP Month Card Card -->
        <div class="profile-panel vip-card-panel">
          <div class="p-header-line">
            <div class="t-wrap">
              <CreditCard :size="18" class="text-gold" />
              <span class="p-title">学林特权月卡 (¥30/月)</span>
            </div>
            <span class="status-pill" :class="userStore.user.monthCardActive ? 'active' : 'inactive'">
              {{ userStore.user.monthCardActive ? `生效中 (至 ${userStore.user.monthCardExpire})` : '未开通' }}
            </span>
          </div>

          <div class="privileges-grid">
            <div class="priv-item">
              <span class="priv-icon">🔓</span>
              <div>
                <strong>解锁交易权限</strong>
                <small>校外用户必备，开通即可模拟操盘</small>
              </div>
            </div>
            <div class="priv-item">
              <span class="priv-icon">⚡</span>
              <div>
                <strong>交易手续费5折</strong>
                <small>规费由 0.1% 降低至 0.05%</small>
              </div>
            </div>
            <div class="priv-item">
              <span class="priv-icon">🎁</span>
              <div>
                <strong>每日领100学币</strong>
                <small>每日签到额外加赠模拟本金</small>
              </div>
            </div>
            <div class="priv-item">
              <span class="priv-icon">👑</span>
              <div>
                <strong>专属荣耀头像框</strong>
                <small>社区榜单与个人主页金光微标</small>
              </div>
            </div>
          </div>

          <button
            class="month-card-action-btn"
            :class="{ disabled: userStore.user.monthCardActive }"
            @click="handleBuyMonthCard"
          >
            {{ userStore.user.monthCardActive ? '月卡权益使用中' : '立即以 ¥30 订阅月卡 (模拟)' }}
          </button>
        </div>

        <!-- 2. Coin Recharge Tiers (1 CNY = 100 Coins) -->
        <div class="profile-panel recharge-panel">
          <div class="p-header-line">
            <div class="t-wrap">
              <ShoppingBag :size="18" class="text-blue" />
              <span class="p-title">学币充值特惠档位 (比例 1元 = 100学币)</span>
            </div>
            <span class="notice-tip">学币不可提现 · 仅作模拟投资</span>
          </div>

          <div class="recharge-grid">
            <div
              v-for="tier in rechargeTiers"
              :key="tier.cny"
              class="tier-card"
              @click="handleRecharge(tier)"
            >
              <span class="tier-tag">{{ tier.tag }}</span>
              <div class="tier-cny font-mono">¥{{ tier.cny }}</div>
              <strong class="tier-coins font-mono">+{{ tier.coins }} 学币</strong>
              <button class="tier-buy-btn">模拟购买</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Campus Identity Verification & Ledger -->
      <div class="profile-right">
        <!-- Campus Student Verification -->
        <div class="profile-panel verify-panel">
          <div class="p-header-line">
            <div class="t-wrap">
              <GraduationCap :size="18" class="text-cyan" />
              <span class="p-title">校内学号身份认证</span>
            </div>
            <span class="verified-pill">已实名认证</span>
          </div>

          <div class="verify-fields">
            <div class="field-line">
              <span class="f-name">真实姓名</span>
              <strong class="f-val">{{ userStore.user.name }}</strong>
            </div>
            <div class="field-line">
              <span class="f-name">统一认证学号</span>
              <span class="f-val font-mono">{{ userStore.user.studentId || '20230910408' }}</span>
            </div>
            <div class="field-line">
              <span class="f-name">所属学院专业</span>
              <span class="f-val">{{ userStore.user.department }}</span>
            </div>
            <div class="field-line">
              <span class="f-name">学期认证 GPA</span>
              <strong class="f-val text-gold font-mono">{{ userStore.user.gpa.toFixed(2) }} (分红档 3.5~4.0)</strong>
            </div>
          </div>
        </div>

        <!-- Ledger logs summary -->
        <div class="profile-panel ledger-summary-panel">
          <div class="p-header-line">
            <div class="t-wrap">
              <History :size="18" class="text-soft" />
              <span class="p-title">最近流水明细</span>
            </div>
          </div>

          <div class="flow-list">
            <div v-for="l in userStore.ledgers.slice(0, 5)" :key="l.id" class="flow-row">
              <div class="flow-info">
                <span class="flow-name">{{ l.title }}</span>
                <small class="flow-time">{{ l.time }}</small>
              </div>
              <span class="flow-amount font-mono" :class="l.amount >= 0 ? 'up' : 'down'">
                {{ l.amount >= 0 ? '+' : '' }}{{ l.amount }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-hero-banner {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 24px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  padding: 24px 28px;
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-box {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 3px solid #fbbf24;
  overflow: hidden;
  background: #1e293b;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
}

.u-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.u-name-line {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.u-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: #f8fafc;
}

.honor-badge {
  font-size: 0.76rem;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid rgba(251, 191, 36, 0.4);
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 700;
}

.role-badge {
  font-size: 0.74rem;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  padding: 2px 8px;
  border-radius: 6px;
}

.u-sub-line {
  margin: 0;
  font-size: 0.84rem;
  color: #94a3b8;
}

.pass-exp-bar {
  font-size: 0.78rem;
  color: #cbd5e1;
}

.pass-exp-bar strong {
  color: #818cf8;
}

.hero-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.asset-snapshot {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.snap-label {
  font-size: 0.76rem;
  color: #94a3b8;
}

.snap-val {
  font-size: 2rem;
  font-weight: 900;
  color: #f8fafc;
}

.snap-sub {
  font-size: 0.72rem;
  color: #64748b;
}

.profile-main-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;
}

.profile-left,
.profile-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-panel {
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

.status-pill {
  font-size: 0.74rem;
  padding: 3px 8px;
  border-radius: 6px;
}

.status-pill.active {
  background: rgba(52, 211, 153, 0.12);
  color: #34d399;
}

.status-pill.inactive {
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
}

.privileges-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.priv-item {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.priv-icon {
  font-size: 1.2rem;
}

.priv-item strong {
  display: block;
  font-size: 0.84rem;
  color: #f1f5f9;
}

.priv-item small {
  font-size: 0.72rem;
  color: #94a3b8;
}

.month-card-action-btn {
  padding: 12px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #111827;
  font-weight: 800;
  font-size: 0.9rem;
  cursor: pointer;
}

.month-card-action-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.notice-tip {
  font-size: 0.72rem;
  color: #94a3b8;
}

.recharge-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.tier-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.tier-card:hover {
  background: rgba(56, 189, 248, 0.08);
  border-color: #38bdf8;
  transform: translateY(-2px);
}

.tier-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 0.65rem;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  padding: 1px 5px;
  border-radius: 4px;
}

.tier-cny {
  font-size: 1.3rem;
  font-weight: 900;
  color: #f8fafc;
}

.tier-coins {
  font-size: 0.88rem;
  color: #fbbf24;
}

.tier-buy-btn {
  margin-top: 4px;
  padding: 4px 10px;
  border: none;
  border-radius: 6px;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
}

.verified-pill {
  font-size: 0.74rem;
  background: rgba(52, 211, 153, 0.12);
  color: #34d399;
  padding: 2px 8px;
  border-radius: 6px;
}

.verify-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.84rem;
  border-bottom: 1px dashed rgba(148, 163, 184, 0.1);
  padding-bottom: 8px;
}

.f-name {
  color: #94a3b8;
}

.f-val {
  color: #f1f5f9;
}

.flow-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.flow-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.82rem;
}

.flow-info {
  display: flex;
  flex-direction: column;
}

.flow-name {
  color: #cbd5e1;
}

.flow-time {
  font-size: 0.7rem;
  color: #64748b;
}

.flow-amount {
  font-weight: 700;
}

.font-mono { font-family: monospace; }
.text-gold { color: #fbbf24; }
.text-blue { color: #38bdf8; }
.text-cyan { color: #38bdf8; }
.text-soft { color: #94a3b8; }
.up { color: #f87171; }
.down { color: #34d399; }

@media (max-width: 950px) {
  .user-hero-banner { grid-template-columns: 1fr; }
  .profile-main-grid { grid-template-columns: 1fr; }
}
</style>
