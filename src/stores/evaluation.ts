import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ActionResult, CourseSession, EvaluationItem } from '@/types'
import { initialCourses, initialEvaluations } from '@/mock/initialData'
import {
  applyRatingAggregation,
  EVALUATION_REWARD,
  SIGNIN_REWARD
} from '@/rules'
import { useUserStore } from './user'
import { useMarketStore } from './market'
import { useTaskStore } from './task'
import { matchScheduleEntry, type RawScheduleEntry } from '@/utils/scheduleImport'

export const useEvaluationStore = defineStore('evaluation', () => {
  const userStore = useUserStore()
  const marketStore = useMarketStore()
  const taskStore = useTaskStore()

  const courses = ref<CourseSession[]>([...initialCourses])
  const evaluations = ref<EvaluationItem[]>([...initialEvaluations])

  // Sign in to class session
  function signInCourse(sessionId: string): ActionResult {
    const session = courses.value.find((c) => c.id === sessionId)
    if (!session) return { success: false, message: '未找到该课程安排' }
    if (session.isSigned) return { success: false, message: '您已完成本节课签到' }

    session.isSigned = true
    userStore.addBalance(SIGNIN_REWARD, `课堂打卡打赏: ${session.courseName}`, '课堂打卡')
    taskStore.advanceTaskByTrigger('CLASS_SIGNIN')

    return { success: true, message: `签到成功！已获得课堂打卡奖励 +${SIGNIN_REWARD} 学币` }
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
    const agg = applyRatingAggregation(
      {
        recentRatings: stock.recentRatings,
        rating: stock.rating,
        ratingCount: stock.ratingCount
      },
      params.rating
    )
    stock.recentRatings = agg.recentRatings
    stock.last5AvgRating = agg.last5AvgRating
    stock.ratingCount = agg.ratingCount
    stock.rating = agg.rating

    // Give reward
    userStore.addBalance(EVALUATION_REWARD, `课后客观评价奖励: ${session.courseName}`, '课后评价')
    taskStore.advanceTaskByTrigger('COURSE_EVALUATION')

    return {
      success: true,
      message: `评价已成功提交并进入聚合池！已获得 +${EVALUATION_REWARD} 学币，将在次日开盘前计入基本面因子。`
    }
  }

  function moderateEvaluation(evalId: string, status: 'APPROVED' | 'REJECTED' | 'DOWNWEIGHTED') {
    const target = evaluations.value.find((e) => e.id === evalId)
    if (target) {
      target.status = status
    }
  }

  function importCourses(entries: RawScheduleEntry[]) {
    const imported: CourseSession[] = []
    const unmatched: string[] = []

    for (const entry of entries) {
      const stock = matchScheduleEntry(entry, marketStore.stocks)
      if (!stock) {
        unmatched.push(entry.courseName || entry.teacherName)
        continue
      }
      const exists = courses.value.some((course) =>
        course.courseName === entry.courseName && course.teacherName === entry.teacherName
      )
      if (exists) continue
      imported.push({
        id: `course-import-${Date.now()}-${imported.length}`,
        courseName: entry.courseName,
        teacherName: entry.teacherName,
        stockCode: stock.code,
        time: entry.time || '待补充',
        room: entry.room || '待补充',
        isSigned: false,
        isEvaluated: false
      })
    }

    courses.value.push(...imported)
    return { imported: imported.length, skipped: entries.length - imported.length - unmatched.length, unmatched }
  }

  return {
    courses,
    evaluations,
    signInCourse,
    submitEvaluation,
    moderateEvaluation,
    importCourses
  }
})
