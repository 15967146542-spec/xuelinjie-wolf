import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TaskItem } from '@/types'
import { initialTasks } from '@/mock/initialData'
import { useUserStore } from './user'

export const useTaskStore = defineStore('task', () => {
  const userStore = useUserStore()
  const tasks = ref<TaskItem[]>([...initialTasks])

  const dailyTasks = computed(() => tasks.value.filter((t) => t.type === 'DAILY'))
  const semesterTasks = computed(() => tasks.value.filter((t) => t.type === 'SEMESTER'))
  const growthTasks = computed(() => tasks.value.filter((t) => t.type === 'ACHIEVEMENT' || t.type === 'GROWTH'))

  const uncompletedCount = computed(() => {
    return tasks.value.filter((t) => !t.isClaimed && t.current >= t.target).length
  })

  function claimTaskReward(taskId: number): { success: boolean; message: string } {
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
    if (task && task.current < task.target) {
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
    advanceTaskProgress
  }
})
