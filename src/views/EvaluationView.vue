<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Info, Lock, MessageSquareText, Search, Sparkles, Star } from 'lucide-vue-next'
import { useEvaluationStore } from '@/stores/evaluation'
import { useMarketStore } from '@/stores/market'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const evaluationStore = useEvaluationStore()
const marketStore = useMarketStore()
const userStore = useUserStore()
const requestedSessionId = typeof route.query.session === 'string' ? route.query.session : ''
const requestedTeacherCode = typeof route.query.teacher === 'string' ? route.query.teacher : ''
const requestedCourse = evaluationStore.courses.find((course) => course.id === requestedSessionId)
const initialCode = requestedCourse?.stockCode || requestedTeacherCode || marketStore.stocks[0]?.code || ''
const selectedCode = ref(initialCode)
const expandedCode = ref(initialCode)
const searchQuery = ref('')
const currentPage = ref(1)
const rating = ref(5)
const comment = ref('')
const isAnonymous = ref(true)
const pageSize = 15

const rankedTeachers = computed(() => [...marketStore.stocks].sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount || a.name.localeCompare(b.name)))
const filteredTeachers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return rankedTeachers.value
  return rankedTeachers.value.filter((teacher) => [teacher.name, teacher.teacherName, teacher.course, teacher.department, teacher.code].some((value) => value.toLowerCase().includes(query)))
})
const visibleTeachers = computed(() => filteredTeachers.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize))
watch(searchQuery, () => { currentPage.value = 1 })

// 行情 store 已异步化：教师榜/提交评教依赖 marketStore.stocks，
// 进入页面即确保就绪（幂等；行情页已加载则跳过）。
onMounted(() => {
  marketStore.bootstrapMarket()
})

function reviewsFor(code: string) { return evaluationStore.evaluations.filter((review) => review.stockCode === code && review.status === 'APPROVED') }
function latestReviewFor(code: string) { return reviewsFor(code)[0] }
function courseFor(code: string) { return evaluationStore.courses.find((course) => course.stockCode === code) }
function selectTeacher(code: string) { selectedCode.value = code; expandedCode.value = expandedCode.value === code ? '' : code }
function enterMyCourses() { router.push('/courses') }
function submitEvaluation(code: string) {
  const course = courseFor(code)
  if (!course) return ElMessage.warning('未匹配到课程信息，请先在“我的课程”完成签到')
  if (userStore.user.role === 'EXTERNAL') return ElMessage.warning('校外用户仅可查看评分与评价，不能提交评教')
  if (!course.isSigned) return ElMessage.warning('请先在“我的课程”完成签到，再进行评分')
  if (course.isEvaluated) return ElMessage.info('本节课程已经完成评价')
  if (!comment.value.trim()) return ElMessage.warning('请填写一句客观评价')
  const result = evaluationStore.submitEvaluation({ sessionId: course.id, rating: rating.value, tags: [], comment: comment.value, anonymous: isAnonymous.value })
  if (result.success) { ElMessage.success(result.message); comment.value = '' } else ElMessage.error(result.message)
}
</script>

<template>
  <main class="evaluation-view">
    <section class="board panel">
      <header class="board-header">
        <div>
          <p class="eyebrow"><Sparkles :size="15" /> 教师评价</p>
          <h2>教师评分榜</h2>
          <p class="board-copy">查看全站教师星级和最新评价；点击一项展开全部已审核评论。</p>
        </div>
        <div class="board-actions">
          <el-button type="primary" @click="enterMyCourses">我的课程与评教</el-button>
          <el-input v-model="searchQuery" clearable :prefix-icon="Search" placeholder="搜索教师、课程、院系或工号" />
        </div>
      </header>
      <div class="board-meta"><span>{{ searchQuery ? `找到 ${filteredTeachers.length} 位教师` : `共 ${marketStore.stocks.length} 位教师` }}</span><span>每页 {{ pageSize }} 位 · 仅展开一项</span></div>

      <div v-if="visibleTeachers.length" class="teacher-list">
        <article v-for="(teacher, index) in visibleTeachers" :key="teacher.code" class="teacher-item">
          <button class="teacher-row" :class="{ active: expandedCode === teacher.code }" :aria-expanded="expandedCode === teacher.code" @click="selectTeacher(teacher.code)">
            <span class="rank">{{ (currentPage - 1) * pageSize + index + 1 }}</span>
            <span class="teacher-avatar" aria-hidden="true">{{ teacher.name.slice(0, 1) }}</span>
            <span class="teacher-main"><span class="teacher-name">{{ teacher.name }}</span><span class="teacher-course">{{ teacher.course || '课程信息待补充' }} · {{ teacher.department }}</span><span class="latest-review">{{ latestReviewFor(teacher.code)?.comment || '暂未收录已审核评价' }}</span></span>
            <span class="teacher-rating"><span><Star :size="16" fill="currentColor" /> {{ teacher.rating.toFixed(1) }}</span><small>{{ teacher.ratingCount }} 人评</small></span>
            <span class="expand-label">{{ expandedCode === teacher.code ? '收起' : '查看评价' }}</span>
          </button>

          <section v-if="expandedCode === teacher.code" class="review-drawer">
            <header class="drawer-header"><div><h3>{{ teacher.name }} 的评价</h3><p>{{ teacher.teacherName }} · {{ teacher.course || '课程信息待补充' }}</p></div><span class="drawer-rating"><Star :size="16" fill="currentColor" /> {{ teacher.rating.toFixed(1) }} · {{ teacher.ratingCount }} 人评</span></header>
            <div class="course-evaluation">
              <template v-if="courseFor(teacher.code) && userStore.user.role !== 'EXTERNAL'">
                <div v-if="!courseFor(teacher.code)?.isSigned" class="notice"><Info :size="17" /> 请先到“我的课程”完成签到，再为该课程评分。</div>
                <div v-else-if="courseFor(teacher.code)?.isEvaluated" class="notice success"><Sparkles :size="17" /> 你已完成本课程的评价，评分已进入聚合池。</div>
                <div v-else class="rating-form"><strong>为本节课程打分</strong><div class="stars" aria-label="课程星级"><button v-for="star in 5" :key="star" :class="{ chosen: rating >= star }" :aria-label="`${star} 星`" @click="rating = star">★</button></div><el-input v-model="comment" type="textarea" :rows="2" placeholder="写一句客观评价…" /><div class="form-actions"><el-checkbox v-model="isAnonymous" label="匿名提交" /><el-button type="primary" @click="submitEvaluation(teacher.code)">提交评价</el-button></div></div>
              </template>
              <div v-else class="notice"><Lock :size="17" /> 公开页面可查看评分与评价；课程签到、导入和提交评教请从“我的课程与评教”进入。</div>
            </div>
            <div class="reviews"><p class="review-title"><MessageSquareText :size="17" /> 全部评价 · {{ reviewsFor(teacher.code).length }} 条</p><div v-if="reviewsFor(teacher.code).length === 0" class="empty-review">暂未收录已审核评价。</div><article v-for="review in reviewsFor(teacher.code)" :key="review.id" class="review-card"><div><strong>{{ review.studentName }}</strong><time>{{ review.createTime }}</time></div><span class="review-stars">★ {{ review.rating }}.0</span><p>{{ review.comment }}</p></article></div>
          </section>
        </article>
      </div>
      <div v-else class="empty">没有找到匹配的教师。</div>
      <div v-if="filteredTeachers.length > pageSize" class="pagination"><el-pagination v-model:current-page="currentPage" background layout="prev, pager, next" :page-size="pageSize" :total="filteredTeachers.length" /></div>
    </section>
  </main>
</template>

<style scoped>
.evaluation-view{max-width:1180px;margin:0 auto}.panel{background:rgba(17,26,44,.95);border:1px solid rgba(148,163,184,.18);border-radius:20px;padding:24px}.board-header{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding-bottom:18px;border-bottom:1px solid rgba(148,163,184,.14)}.eyebrow{display:flex;align-items:center;gap:6px;margin:0 0 8px;color:#fbbf24;font-size:.82rem;font-weight:700}.board-header h2{margin:0;color:#f8fafc;font-size:1.55rem}.board-copy{margin:8px 0 0;color:#94a3b8;font-size:.9rem}.board-actions{display:flex;gap:10px;min-width:430px}.board-actions .el-input{width:230px}.board-meta{display:flex;justify-content:space-between;margin:14px 0;color:#94a3b8;font-size:.82rem}.teacher-list{display:flex;flex-direction:column;gap:8px}.teacher-item{border:1px solid rgba(148,163,184,.12);border-radius:14px;overflow:hidden;background:rgba(15,23,42,.45)}.teacher-row{display:grid;grid-template-columns:32px 40px minmax(220px,1fr) 98px 68px;align-items:center;gap:12px;width:100%;padding:12px 14px;border:0;background:transparent;color:inherit;text-align:left;cursor:pointer}.teacher-row:hover,.teacher-row.active{background:rgba(56,189,248,.08)}.teacher-row:focus-visible{outline:3px solid #38bdf8;outline-offset:-3px}.rank{color:#64748b;font:700 .85rem ui-monospace,monospace;text-align:center}.teacher-avatar{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:rgba(56,189,248,.16);color:#7dd3fc;font-weight:800}.teacher-main{display:grid;gap:3px;min-width:0}.teacher-name{color:#f8fafc;font-size:1rem;font-weight:750;white-space:nowrap}.teacher-course,.latest-review{overflow:hidden;color:#94a3b8;font-size:.78rem;text-overflow:ellipsis;white-space:nowrap}.latest-review{color:#cbd5e1}.teacher-rating{display:grid;gap:3px;color:#fbbf24;font-weight:800}.teacher-rating>span,.drawer-rating{display:flex;align-items:center;gap:4px}.teacher-rating small{color:#64748b;font-weight:500}.expand-label{color:#38bdf8;font-size:.8rem;white-space:nowrap}.review-drawer{padding:20px;border-top:1px solid rgba(56,189,248,.24);background:rgba(2,6,23,.38)}.drawer-header{display:flex;justify-content:space-between;gap:16px}.drawer-header h3{margin:0;color:#f8fafc}.drawer-header p{margin:5px 0 0;color:#94a3b8;font-size:.84rem}.drawer-rating,.review-stars{color:#fbbf24;font-weight:800}.course-evaluation{margin:16px 0}.notice{display:flex;align-items:center;gap:8px;padding:12px;border-radius:10px;background:rgba(56,189,248,.1);color:#bae6fd;font-size:.85rem}.notice.success{background:rgba(52,211,153,.1);color:#6ee7b7}.rating-form{display:grid;gap:10px;padding:14px;border-radius:12px;background:rgba(30,41,59,.65);color:#e2e8f0}.stars{display:flex;gap:4px}.stars button{border:0;background:transparent;color:#475569;cursor:pointer;font-size:1.5rem}.stars button.chosen{color:#fbbf24}.form-actions{display:flex;justify-content:space-between;align-items:center}.reviews{display:grid;gap:10px}.review-title{display:flex;align-items:center;gap:7px;margin:0;color:#e2e8f0;font-weight:750}.review-card{position:relative;padding:12px 14px;border-left:3px solid rgba(56,189,248,.55);border-radius:0 10px 10px 0;background:rgba(30,41,59,.52)}.review-card>div{display:flex;gap:10px}.review-card strong{color:#e2e8f0}.review-card time{color:#64748b;font-size:.75rem}.review-card p{margin:8px 0 0;color:#cbd5e1;font-size:.88rem;line-height:1.55}.review-stars{position:absolute;right:14px;top:12px}.empty-review,.empty{padding:20px;color:#94a3b8;text-align:center}.pagination{display:flex;justify-content:center;margin-top:20px}@media(max-width:760px){.panel{padding:16px}.board-header,.board-actions{flex-direction:column}.board-actions{min-width:0;width:100%}.board-actions .el-input{width:100%}.board-meta{gap:8px;flex-direction:column}.teacher-row{grid-template-columns:28px 38px minmax(0,1fr) 58px;gap:8px;padding:11px}.expand-label{display:none}.teacher-rating small,.teacher-course{display:none}.drawer-header{flex-direction:column}.review-stars{position:static;display:block;margin-top:6px}.form-actions{gap:10px;flex-wrap:wrap}}
</style>