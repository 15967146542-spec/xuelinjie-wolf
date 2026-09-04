import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserProfile, UserRole, AssetLedger } from '@/types'
import { initialUser } from '@/mock/initialData'

export type UserFeature = 'TRADE' | 'EVALUATION_WRITE' | 'COURSES' | 'TASKS' | 'RANKINGS' | 'PROFILE' | 'RECHARGE' | 'GPA_REWARD' | 'RISK_ADMIN'

export const useUserStore = defineStore('user', () => {
  const user = ref<UserProfile>({ ...initialUser })
  const ledgers = ref<AssetLedger[]>([
    {
      id: 'ledg-01',
      title: '校内学生认证初始资金',
      amount: 10000,
      type: 'INCOME',
      category: '初始本金',
      time: '2026-09-01 08:00:00',
      balanceAfter: 10000
    }
  ])

  const roleText = computed(() => {
    switch (user.value.role) {
      case 'STUDENT': return '校内学生 (已认证)'
      case 'EXTERNAL': return '校外用户'
      case 'TEACHER': return '授课教师 (只读)'
      case 'ADMIN': return '系统风控管理员'
      default: return '普通用户'
    }
  })

  const canUse = computed(() => (feature: UserFeature) => {
    const role = user.value.role
    if (role === 'ADMIN') return true

    const permissions: Record<Exclude<UserRole, 'ADMIN'>, UserFeature[]> = {
      STUDENT: ['TRADE', 'EVALUATION_WRITE', 'COURSES', 'TASKS', 'RANKINGS', 'PROFILE', 'RECHARGE', 'GPA_REWARD'],
      EXTERNAL: ['TRADE', 'RANKINGS', 'PROFILE', 'RECHARGE'],
      TEACHER: []
    }
    return permissions[role].includes(feature)
  })

  function resetRoleBalance(amount: number, title: string) {
    user.value.balance = amount
    user.value.frozenCoins = 0
    ledgers.value = [{
      id: `ledg-role-${Date.now()}`,
      title,
      amount,
      type: 'INCOME',
      category: '身份初始资金',
      time: new Date().toLocaleTimeString(),
      balanceAfter: amount
    }]
  }

  function setRole(newRole: UserRole) {
    user.value.role = newRole
    if (newRole === 'EXTERNAL') {
      user.value.studentId = ''
      user.value.department = '社会注册投资者'
      user.value.monthCardActive = false
      user.value.monthCardExpire = undefined
      resetRoleBalance(0, '校外用户初始资金（请充值获取学币）')
    } else if (newRole === 'STUDENT') {
      user.value.studentId = '20230910408'
      user.value.department = '计算机学院 · 软件工程系'
      resetRoleBalance(10000, '校内学生认证初始资金')
    } else if (newRole === 'TEACHER') {
      user.value.studentId = ''
      user.value.department = '数理学院 · 教师席位'
      resetRoleBalance(0, '授课教师只读账户')
    } else if (newRole === 'ADMIN') {
      user.value.department = '学林街交易风控委员会'
      resetRoleBalance(10000, '管理员全功能测试资金')
    }
  }

  function addBalance(amount: number, title: string, category: string) {
    user.value.balance = Number((user.value.balance + amount).toFixed(2))
    ledgers.value.unshift({
      id: 'ledg-' + Date.now(),
      title,
      amount,
      type: amount >= 0 ? 'INCOME' : 'EXPENSE',
      category,
      time: new Date().toLocaleTimeString(),
      balanceAfter: user.value.balance
    })
  }

  function deductBalance(amount: number, title: string, category: string): boolean {
    if (user.value.balance < amount) {
      return false
    }
    user.value.balance = Number((user.value.balance - amount).toFixed(2))
    ledgers.value.unshift({
      id: 'ledg-' + Date.now(),
      title,
      amount: -amount,
      type: 'EXPENSE',
      category,
      time: new Date().toLocaleTimeString(),
      balanceAfter: user.value.balance
    })
    return true
  }

  function purchaseMonthCard(): { success: boolean; message: string } {
    if (user.value.role === 'TEACHER') {
      return { success: false, message: '授课教师为只读身份，不能开通月卡' }
    }
    user.value.monthCardActive = true
    const expire = new Date()
    expire.setMonth(expire.getMonth() + 1)
    user.value.monthCardExpire = expire.toISOString().split('T')[0]
    return { success: true, message: '月卡开通成功' }
  }

  function rechargeCoins(cny: number): { success: boolean; message: string } {
    if (!canUse.value('RECHARGE')) {
      return { success: false, message: '当前身份不可使用学币充值服务' }
    }
    if (cny <= 0) return { success: false, message: '充值金额必须大于 0' }
    const coins = cny * 100
    addBalance(coins, `校外充值 ¥${cny} -> ${coins} 学币`, '商业化充值')
    return { success: true, message: `充值成功，已到账 ${coins} 学币` }
  }

  return {
    user,
    ledgers,
    roleText,
    canUse,
    setRole,
    addBalance,
    deductBalance,
    purchaseMonthCard,
    rechargeCoins
  }
})
