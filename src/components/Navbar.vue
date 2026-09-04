<script setup lang="ts">
import { computed, ref, watch, type Component } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore, type UserFeature } from '@/stores/user'
import { useMarketStore } from '@/stores/market'
import { useTradeStore } from '@/stores/trade'
import type { UserRole } from '@/types'
import {
  TrendingUp,
  LineChart,
  ArrowLeftRight,
  MessageSquareCheck,
  BookOpen,
  CheckSquare,
  Trophy,
  User,
  ShieldAlert,
  Sparkles,
  Menu,
  X
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const marketStore = useMarketStore()
const tradeStore = useTradeStore()

const currentPath = computed(() => route.path)
const mobileOpen = ref(false)

// Auto-close the mobile drawer whenever the route changes.
watch(
  () => route.path,
  () => {
    mobileOpen.value = false
  }
)

interface NavLink {
  name: string
  path: string
  icon: Component
  feature?: UserFeature
  roles?: UserRole[]
}

const navLinks: NavLink[] = [
  { name: '行情大厅', path: '/market', icon: LineChart },
  { name: '模拟交易', path: '/trade', icon: ArrowLeftRight, feature: 'TRADE' },
  { name: '评价中心', path: '/evaluation', icon: MessageSquareCheck, roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { name: '我的课程', path: '/courses', icon: BookOpen, feature: 'COURSES' },
  { name: '任务奖励', path: '/tasks', icon: CheckSquare, feature: 'TASKS' },
  { name: '风云榜单', path: '/rankings', icon: Trophy, feature: 'RANKINGS' },
  { name: '个人资产', path: '/profile', icon: User, feature: 'PROFILE' },
  { name: '风控后台', path: '/admin', icon: ShieldAlert, feature: 'RISK_ADMIN' }
]

const roleOptions: Array<{ role: UserRole; label: string }> = [
  { role: 'STUDENT', label: '校内学生' },
  { role: 'EXTERNAL', label: '校外用户' },
  { role: 'TEACHER', label: '授课教师' },
  { role: 'ADMIN', label: '管理员' }
]

const visibleNavLinks = computed(() => navLinks.filter((link) => {
  if (link.feature) return userStore.canUse(link.feature)
  return !link.roles || link.roles.includes(userStore.user.role)
}))

function isActive(path: string) {
  if (path === '/market') return route.path === '/market' || route.path.startsWith('/stock/')
  return route.path === path || route.path.startsWith(`${path}/`)
}

function handleRoleChange(role: UserRole) {
  userStore.setRole(role)
  mobileOpen.value = false

  const allowedRoles = route.meta.roles as UserRole[] | undefined
  if (allowedRoles && !allowedRoles.includes(role)) router.replace('/market')
}
</script>

<template>
  <header class="app-navbar">
    <div class="nav-left">
      <div class="brand" @click="router.push('/market')">
        <div class="logo-symbol">
          <TrendingUp class="logo-icon" :size="24" />
        </div>
        <div class="brand-text">
          <div class="brand-title">
            学林街之狼
            <span class="brand-badge">PRO</span>
          </div>
          <div class="brand-slogan">人人皆自然 · 校园模拟投资与评教平台</div>
        </div>
      </div>

      <!-- Live Market Index Pill -->
      <div class="index-ticker" @click="router.push('/market')">
        <span class="ticker-label">学林综指</span>
        <span class="ticker-val">{{ marketStore.marketIndex }}</span>
        <span class="ticker-change" :class="marketStore.indexChangePct >= 0 ? 'up' : 'down'">
          {{ marketStore.indexChangePct >= 0 ? '+' : '' }}{{ marketStore.indexChangePct }}%
        </span>
      </div>
    </div>

    <!-- Main Navigation Items (desktop) -->
    <nav class="nav-links">
      <router-link
        v-for="link in visibleNavLinks"
        :key="link.path"
        :to="link.path"
        class="nav-item"
        :class="{ active: isActive(link.path) }"
      >
        <component :is="link.icon" :size="17" class="nav-icon" />
        <span>{{ link.name }}</span>
      </router-link>
    </nav>

    <!-- Nav Right: Role Switcher + User Info Capsule + Mobile Toggle -->
    <div class="nav-right">
      <!-- Role Switcher for simulation testing -->
      <el-dropdown trigger="click" @command="handleRoleChange">
        <el-button size="small" class="role-btn">
          <Sparkles :size="14" class="mr-1" />
          <span>{{ userStore.roleText }}</span>
          <i class="el-icon-arrow-down el-icon--right"></i>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="STUDENT">切换为：校内学生 (全功能+初始1万)</el-dropdown-item>
            <el-dropdown-item command="EXTERNAL">切换为：校外用户 (付费/充值机制)</el-dropdown-item>
            <el-dropdown-item command="TEACHER">切换为：授课教师 (只读行情与评教)</el-dropdown-item>
            <el-dropdown-item command="ADMIN">切换为：管理员 (风控与宏观因子)</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- Balance & Asset Capsule -->
      <div v-if="userStore.canUse('PROFILE')" class="user-capsule" @click="router.push('/profile')">
        <div class="avatar-ring">
          <img src="https://api.dicebear.com/7.x/bottts/svg?seed=wolf07" alt="avatar" />
        </div>
        <div class="asset-info">
          <div class="user-name-line">
            <span class="name">{{ userStore.user.name }}</span>
            <el-tag size="small" effect="dark" type="warning" class="title-tag">杭电股神</el-tag>
          </div>
          <div class="coins-line">
            可用: <strong class="gold-text">¥{{ userStore.user.balance.toLocaleString() }}</strong>
            <span class="divider">|</span>
            总资: <strong class="cyan-text">¥{{ tradeStore.totalAsset.toLocaleString() }}</strong>
          </div>
        </div>
      </div>

      <!-- Mobile menu toggle -->
      <button
        class="menu-toggle"
        :aria-expanded="mobileOpen"
        aria-label="切换导航菜单"
        @click="mobileOpen = !mobileOpen"
      >
        <X v-if="mobileOpen" :size="22" />
        <Menu v-else :size="22" />
      </button>
    </div>

    <!-- Mobile navigation drawer -->
    <transition name="drop">
      <div v-if="mobileOpen" class="mobile-menu">
        <nav class="mobile-links">
          <router-link
            v-for="link in visibleNavLinks"
            :key="link.path"
            :to="link.path"
            class="mobile-link"
            :class="{ active: isActive(link.path) }"
          >
            <component :is="link.icon" :size="18" class="mobile-link-icon" />
            <span>{{ link.name }}</span>
          </router-link>
        </nav>

        <div class="mobile-roles">
          <div class="mobile-section-label">切换身份</div>
          <div class="mobile-role-list">
            <button
              v-for="opt in roleOptions"
              :key="opt.role"
              class="mobile-role-btn"
              :class="{ active: userStore.user.role === opt.role }"
              @click="handleRoleChange(opt.role)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </header>
</template>

<style scoped>
.app-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: rgba(13, 20, 36, 0.92);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.logo-symbol {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
}

.logo-icon {
  color: #fff;
}

.brand-title {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.3px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #f8fafc;
}

.brand-badge {
  font-size: 0.68rem;
  padding: 2px 6px;
  border-radius: 6px;
  background: linear-gradient(90deg, #ec4899, #8b5cf6);
  color: white;
  font-weight: 700;
}

.brand-slogan {
  font-size: 0.72rem;
  color: #94a3b8;
}

.index-ticker {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
}

.index-ticker:hover {
  background: rgba(51, 65, 85, 0.9);
  border-color: #60a5fa;
}

.ticker-label {
  color: #94a3b8;
  font-weight: 500;
}

.ticker-val {
  font-weight: 700;
  color: #f1f5f9;
}

.ticker-change.up {
  color: #f87171; /* A-share standard: Red is UP */
  font-weight: 700;
}

.ticker-change.down {
  color: #34d399; /* A-share standard: Green is DOWN */
  font-weight: 700;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border-radius: 10px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-item:hover {
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.05);
}

.nav-item.active {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.12);
  border: 1px solid rgba(96, 165, 250, 0.3);
  font-weight: 600;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.role-btn {
  background: rgba(30, 41, 59, 0.8) !important;
  border: 1px solid rgba(148, 163, 184, 0.25) !important;
  color: #cbd5e1 !important;
  border-radius: 20px !important;
  font-size: 0.78rem !important;
}

.user-capsule {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 12px 5px 6px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.2s;
}

.user-capsule:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: #38bdf8;
}

.avatar-ring {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 2px solid #fbbf24;
  overflow: hidden;
  background: #1e293b;
}

.avatar-ring img {
  width: 100%;
  height: 100%;
}

.asset-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-name-line .name {
  font-size: 0.82rem;
  font-weight: 700;
  color: #f8fafc;
}

.title-tag {
  height: 18px !important;
  padding: 0 5px !important;
  font-size: 0.65rem !important;
  line-height: 16px !important;
}

.coins-line {
  font-size: 0.72rem;
  color: #94a3b8;
}

.gold-text {
  color: #fbbf24;
}

.cyan-text {
  color: #38bdf8;
}

.divider {
  margin: 0 4px;
  color: #475569;
}

.mr-1 {
  margin-right: 4px;
}

/* ---- Mobile toggle button ---- */
.menu-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.22);
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.menu-toggle:hover {
  background: rgba(51, 65, 85, 0.9);
  border-color: #60a5fa;
  color: #60a5fa;
}

/* ---- Mobile drawer ---- */
.mobile-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(13, 20, 36, 0.98);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  padding: 14px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
}

.mobile-links {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.mobile-link {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 14px;
  border-radius: 12px;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid transparent;
  transition: all 0.18s;
}

.mobile-link:hover {
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.06);
}

.mobile-link.active {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.12);
  border-color: rgba(96, 165, 250, 0.3);
}

.mobile-link-icon {
  flex-shrink: 0;
}

.mobile-roles {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-section-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: #64748b;
  text-transform: uppercase;
}

.mobile-role-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.mobile-role-btn {
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #cbd5e1;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.18s;
}

.mobile-role-btn:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: #38bdf8;
}

.mobile-role-btn.active {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.12);
  border-color: rgba(96, 165, 250, 0.35);
  font-weight: 600;
}

.drop-enter-active,
.drop-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ---- Responsive breakpoints ---- */
@media (max-width: 1180px) {
  .nav-links,
  .index-ticker {
    display: none;
  }

  .menu-toggle {
    display: flex;
  }
}

@media (max-width: 640px) {
  .app-navbar {
    padding: 10px 14px;
  }

  .brand-slogan,
  .coins-line,
  .title-tag {
    display: none;
  }

  .logo-symbol {
    width: 36px;
    height: 36px;
  }

  .brand-title {
    font-size: 1.02rem;
  }

  .role-btn span {
    max-width: 72px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .user-capsule {
    padding-right: 8px;
  }

  .nav-right {
    gap: 8px;
  }

  .mobile-links,
  .mobile-role-list {
    grid-template-columns: 1fr;
  }
}
</style>
