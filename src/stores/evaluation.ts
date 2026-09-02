import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ActionResult, CourseSession, EvaluationItem } from '@/types'
import { initialCourses, initialEvaluations } from '@/mock/initialData'
import { useUserStore } from './user'
import { useMarketStore } from './market'

export const useEvaluationStore = defineStore('evaluation', () => {
  const userStore = useUserStore()
  const marketStore = useMarketStore()

  const courses = ref<CourseSession[]>([...initialCourses])
  const evaluations = ref<EvaluationItem[]>([...initialEvaluations])

  // Sign in to class session
  function signInCourse(sessionId: string): ActionResult {
    const session = courses.value.find((c) => c.id === sessionId)
    if (!session) return { success: false, message: '未找到该课程安排' }
    if (session.isSigned) return { success: false, message: '您已完成本节课签到' }

    session.isSigned = true
    userStore.addBalance(100, `课堂打卡打赏: ${session.courseName}`, '课堂打卡')

    return { success: true, message: `签到成功！已获得课堂打卡奖励 +100 学币` }
  }

  // Submit course review
  function submitEvaluation(params: {
    sessionId: string
    rating: number
    tags: string[]
    comment: string
    anonymous?: boolean
  }): ActionResult {
    const session = courses.value.find((c) => c.id === params.sessionId)
    if (!session) return { success: false, message: '课程不存在' }
    if (!session.isSigned) return { success: false, message: '只有完成课堂签到的同学才能评价本课程！' }
    if (session.isEvaluated) return { success: false, message: '您已经评价过这节课了，不可重复评价' }

    const stock = marketStore.stocks.find((s) => s.code === session.stockCode)
    if (!stock) return { success: false, message: '关联标的不存在' }

    // Record evaluation
    const newEval: EvaluationItem = {
      id: 'eval-' + Date.now(),
      sessionId: session.id,
      courseName: session.courseName,
      teacherName: session.teacherName,
      stockCode: session.stockCode,
      studentName: params.anonymous !== false ? '校内匿名同学' : userStore.user.name,
      rating: params.rating,
      tags: params.tags,
      comment: params.comment,
      status: 'APPROVED',
      createTime: new Date().toLocaleString(),
      anonymous: params.anonymous !== false
    }

    evaluations.value.unshift(newEval)
    session.isEvaluated = true

    // Update stock ratings aggregation (Next day factor impact)
    stock.recentRatings.unshift(params.rating)
    if (stock.recentRatings.length > 5) {
      stock.recentRatings.pop()
    }
    const sum = stock.recentRatings.reduce((acc, r) => acc + r, 0)
    stock.last5AvgRating = Number((sum / stock.recentRatings.length).toFixed(2))
    stock.ratingCount += 1
    stock.rating = Number(((stock.rating * 0.95) + (params.rating * 0.05)).toFixed(1))

    // Give reward
    userStore.addBalance(80, `课后客观评价奖励: ${session.courseName}`, '课后评价')

    return {
      success: true,
      message: `评价已成功提交并进入聚合池！已获得 +80 学币，将在次日开盘前计入基本面因子。`
    }
  }

  function moderateEvaluation(evalId: string, status: 'APPROVED' | 'REJECTED' | 'DOWNWEIGHTED') {
    const target = evaluations.value.find((e) => e.id === evalId)
    if (target) {
      target.status = status
    }
  }

  return {
    courses,
    evaluations,
    signInCourse,
    submitEvaluation,
    moderateEvaluation
  }
})
