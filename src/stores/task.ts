import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TaskItem, TaskTrigger } from '@/types'
import { initialTasks } from '@/mock/initialData'
import { autoCompleteLoginTask, resetDailyTask, shouldResetDaily } from '@/rules'
import { useUserStore } from './user'

/** localStorage 中记录“每日任务最近一次结算日期”的键名 */
const DAILY_DATE_KEY = 'xuelinjie-task-daily-date'

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export const useTaskStore = defineStore('task', () => {
  const userStore = useUserStore()
  const tasks = ref<TaskItem[]>([...initialTasks])

  const dailyTasks = computed(() => tasks.value.filter((t) => t.type === 'DAILY'))
  const semesterTasks = computed(() => tasks.value.filter((t) => t.type === 'SEMESTER'))
  const growthTasks = computed(() => tasks.value.filter((t) => t.type === 'ACHIEVEMENT' || t.type === 'GROWTH'))

  const uncompletedCount = computed(() => {
    return tasks.value.filter((t) => !t.isClaimed && t.current >= t.target).length
  })

  /**
   * 每日任务当日结算（应用加载与每次任务写操作前调用，幂等）：
   * 1) 若本地记录日期已跨天，将全部 DAILY 任务进度归零并解锁领取；
   * 2) 记录/更新今日日期；
   * 3) “每日登录签到”任务视为当日达成（打开过应用即视为登录），跨天重置后立即可领。
   * 首次打开（无记录）时保留初始 Mock 数据，仅在新的一天触发重置。
   */
  function ensureFreshDay() {
    try {
      const lastDate = localStorage.getItem(DAILY_DATE_KEY)
      const today = todayKey()
      if (shouldResetDaily(lastDate, today)) {
        tasks.value = tasks.value.map((t) => (t.type === 'DAILY' ? resetDailyTask(t) : t))
      }
      localStorage.setItem(DAILY_DATE_KEY, today)
    } catch {
      // localStorage 不可用（隐私模式等）时跳过跨天结算，不阻塞功能
    }

    tasks.value = tasks.value.map(autoCompleteLoginTask)
  }

  ensureFreshDay()

  /**
   * 通过业务事件推进对应每日任务进度（由评价/签到/交易等 store 联动调用）。
   * 只推进尚未领取、且配置了相同 trigger 的 DAILY 任务。
   */
  function advanceTaskByTrigger(trigger: TaskTrigger, delta = 1) {
    ensureFreshDay()
    tasks.value.forEach((t) => {
      if (t.type === 'DAILY' && t.trigger === trigger && !t.isClaimed) {
        advanceTaskProgress(t.id, delta)
      }
    })
  }

  function claimTaskReward(taskId: number): { success: boolean; message: string } {
    ensureFreshDay()
    const task = tasks.value.find((t) => t.id === taskId)
    if (!task) return { success: false, message: '任务不存在' }
    if (task.isClaimed) return { success: false, message: '该任务奖励已领取' }
    if (task.current < task.target) return { success: false, message: '任务目标尚未完成' }

    task.isClaimed = true
    userStore.addBalance(task.reward, `领取任务奖励: ${task.title}`, '任务中心')

    return { success: true, message: `成功领取 ${task.reward} 学币奖励！` }
  }

  function advanceTaskProgress(taskId: number, delta = 1) {
    const task = tasks.value.find((t) => t.id === taskId)
    if (task && !task.isClaimed && task.current < task.target) {
      task.current = Math.min(task.target, task.current + delta)
    }
  }

  return {
    tasks,
    dailyTasks,
    semesterTasks,
    growthTasks,
    uncompletedCount,
    claimTaskReward,
    advanceTaskProgress,
    advanceTaskByTrigger,
    ensureFreshDay
  }
})
