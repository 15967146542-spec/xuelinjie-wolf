import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/market'
  },
  {
    path: '/market',
    name: 'Market',
    component: () => import('@/views/MarketView.vue'),
    meta: { title: '行情大厅 · 学林街之狼' }
  },
  {
    path: '/stock/:code',
    name: 'StockDetail',
    component: () => import('@/views/StockDetailView.vue'),
    meta: { title: '个股详情与评教 · 学林街之狼' }
  },
  {
    path: '/trade',
    name: 'Trade',
    component: () => import('@/views/TradeView.vue'),
    meta: { title: '模拟交易终端 · 学林街之狼' }
  },
  {
    path: '/evaluation',
    name: 'Evaluation',
    component: () => import('@/views/EvaluationView.vue'),
    meta: { title: '评教中心 · 学林街之狼' }
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: () => import('@/views/TaskView.vue'),
    meta: { title: '任务与奖励中心 · 学林街之狼' }
  },
  {
    path: '/rankings',
    name: 'Rankings',
    component: () => import('@/views/RankingView.vue'),
    meta: { title: '风云排行榜 · 学林街之狼' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { title: '个人资产与特权 · 学林街之狼' }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { title: '风控后台 · 学林街之狼' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to, _from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
  next()
})

export default router
