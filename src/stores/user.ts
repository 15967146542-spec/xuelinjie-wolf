import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserProfile, UserRole, AssetLedger } from '@/types'
import { initialUser } from '@/mock/initialData'

export const useUserStore = defineStore('user', () => {
  const user = ref<UserProfile>({ ...initialUser })
  const ledgers = ref<AssetLedger[]>([
    {
      id: 'ledg-01',
      title: '学期绩点奖励分红 (GPA 3.92)',
      amount: 3000,
      type: 'INCOME',
      category: 'GPA奖励',
      time: '2026-09-01 08:30:00',
      balanceAfter: 14680
    },
    {
      id: 'ledg-02',
      title: '每日登录签到奖励',
      amount: 50,
      type: 'INCOME',
      category: '每日任务',
      time: '2026-09-01 08:35:00',
      balanceAfter: 11680
    },
    {
      id: 'ledg-03',
      title: '买入 计网赵 80股 (市价成交)',
      amount: -9633.62,
      type: 'EXPENSE',
      category: '证券交易',
      time: '2026-09-01 09:35:12',
      balanceAfter: 11630
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

  function setRole(newRole: UserRole) {
    user.value.role = newRole
    if (newRole === 'EXTERNAL') {
      user.value.studentId = ''
      user.value.department = '社会注册投资者'
    } else if (newRole === 'STUDENT') {
      user.value.studentId = '20230910408'
      user.value.department = '计算机学院 · 软件工程系'
    } else if (newRole === 'TEACHER') {
      user.value.department = '数理学院 · 教师席位'
    } else if (newRole === 'ADMIN') {
      user.value.department = '学林街交易风控委员会'
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

  function purchaseMonthCard() {
    user.value.monthCardActive = true
    const expire = new Date()
    expire.setMonth(expire.getMonth() + 1)
    user.value.monthCardExpire = expire.toISOString().split('T')[0]
  }

  function rechargeCoins(cny: number) {
    const coins = cny * 100
    addBalance(coins, `校外充值 ¥${cny} -> ${coins} 学币`, '商业化充值')
  }

  return {
    user,
    ledgers,
    roleText,
    setRole,
    addBalance,
    deductBalance,
    purchaseMonthCard,
    rechargeCoins
  }
})
