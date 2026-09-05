<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEvaluationStore } from '@/stores/evaluation'
import { useUserStore } from '@/stores/user'
import { useMarketStore } from '@/stores/market'
import {
  calcRatingFactorEarning,
  EVALUATION_REWARD,
  NEUTRAL_RATING,
  RATING_FACTOR_ALPHA,
  RATING_WINDOW,
  SIGNIN_REWARD
} from '@/rules'
import {
  MessageSquareCheck,
  QrCode,
  Sparkles,
  Clock,
  MapPin,
  CheckCircle2,
  Info,
  Lock
} from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const evaluationStore = useEvaluationStore()
const userStore = useUserStore()
const marketStore = useMarketStore()

const requestedSessionId = route.query.session as string | undefined
const selectedSessionId = ref<string>(
  evaluationStore.courses.some((c) => c.id === requestedSessionId)
    ? (requestedSessionId as string)
    : (evaluationStore.courses[0]?.id || '')
)

// 行情 store 已异步化：stocks 需经 bootstrapMarket 填充后才可用于
// 提交评教时的标的聚合与推演卡片；进入评教页即确保就绪（幂等，行情页已加载则跳过）。
onMounted(() => {
  marketStore.bootstrapMarket()
})
const rating = ref<number>(5)
const hoverRating = ref<number>(0)
const selectedTags = ref<string[]>(['板书天花板', '讲题通透'])
const comment = ref<string>('')
const isAnonymous = ref<boolean>(true)
const isSubmitting = ref(false)

const availablePresetTags = [
  '板书天花板',
  '讲题通透',
  '互动热烈',
  '考研重点',
  '大厂真题',
  '给分友好',
  '硬核推导',
  '作业量大',
  '点名严格',
  '节奏适中'
]

const currentSession = computed(() => {
  return evaluationStore.courses.find((c) => c.id === selectedSessionId.value) || evaluationStore.courses[0]
})

// 选中课程的实时因子推演：读取其关联标的的真实近 RATING_WINDOW 讲均值，
// 按 E = α × (R̄ − NEUTRAL) / 2 计算次日基本面因子收益，替代写死的机制文案
const factorPreview = computed(() => {
  const session = currentSession.value
  if (!session) return null
  const stock = marketStore.stocks.find((s) => s.code === session.stockCode)
  if (!stock) return null
  return {
    courseName: session.courseName,
    teacherName: session.teacherName,
    last5Avg: stock.last5AvgRating,
    ratingCount: stock.ratingCount,
    earningPct: calcRatingFactorEarning(stock.last5AvgRating) * 100
  }
})

function toggleTag(tag: string) {
  if (selectedTags.value.includes(tag)) {
    selectedTags.value = selectedTags.value.filter((t) => t !== tag)
  } else {
    selectedTags.value.push(tag)
  }
}

function handleSignIn(sessionId: string) {
  ElMessageBox.confirm(
    `将完成「${evaluationStore.courses.find((c) => c.id === sessionId)?.courseName || '本课'}」的模拟课堂扫码打卡，确认签到？签到成功可获 +${SIGNIN_REWARD} 学币，并推进每日任务进度。`,
    '模拟课堂扫码签到',
    {
      confirmButtonText: '确认签到',
      cancelButtonText: '再想想',
      type: 'info'
    }
  )
    .then(() => {
      const res = evaluationStore.signInCourse(sessionId)
      if (res.success) {
        ElMessage.success(res.message)
      } else {
        ElMessage.warning(res.message)
      }
    })
    .catch(() => {
      // 用户取消签到，不做任何处理
    })
}

async function handleSubmitEvaluation() {
  if (userStore.user.role === 'EXTERNAL') {
    ElMessage.warning('校外用户不可参与校内课堂评教，仅校内认证学生可提交')
    return
  }

  if (!currentSession.value) return

  if (!currentSession.value.isSigned) {
    ElMessage.error('您尚未完成本节课签到打卡，无法提交评教')
    return
  }

  if (!comment.value.trim()) {
    ElMessage.warning('请填写至少一句客观评价内容')
    return
  }

  isSubmitting.value = true
  try {
    // 模拟请求延迟；接入 evaluationTaskApi 后替换为真实异步调用
    await new Promise((resolve) => setTimeout(resolve, 500))

    const res = evaluationStore.submitEvaluation({
      sessionId: currentSession.value.id,
      rating: rating.value,
      tags: selectedTags.value,
      comment: comment.value,
      anonymous: isAnonymous.value
    })

    if (res.success) {
      ElMessage.success(res.message)
      comment.value = ''
    } else {
      ElMessage.error(res.message)
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="evaluation-view">
    <!-- Top Concept Banner -->
    <div class="eval-hero-banner">
      <div class="banner-left">
        <div class="badge-pill">
          <MessageSquareCheck :size="15" />
          <span>学生评教与股价基本面系统</span>
        </div>
        <h2 class="banner-title">客观评价 · 聚合入市 · 次日生效</h2>
        <p class="banner-desc">
          只有完成到课签到的真实学生方可评价。所有星级与标签均经算法聚合处理，匿名影响教师标的次日股价因子，防止即时恶意砸盘。
        </p>
      </div>
      <div class="banner-right">
        <div class="reward-rule-box">
          <div class="rule-title">评教激励机制</div>
          <div class="rule-line"><span>到课签到打卡：</span><strong>+{{ SIGNIN_REWARD }} 学币/节</strong></div>
          <div class="rule-line"><span>完成客观评教：</span><strong>+{{ EVALUATION_REWARD }} 学币/次</strong></div>
          <div class="rule-line"><span>评价因子权重：</span><strong class="text-blue">α = 0.02 (次日生效)</strong></div>
        </div>
      </div>
    </div>

    <!-- Main Grid: Course List & Evaluation Form -->
    <div class="eval-main-grid">
      <!-- Left: Course Sessions Checklist -->
      <div class="eval-panel course-sessions-card">
        <div class="panel-header-line">
          <span class="p-title">今日与近期待评课程</span>
          <span class="sub-text">点击选中课程进行评教</span>
        </div>

        <div class="session-list">
          <div v-if="evaluationStore.courses.length === 0" class="empty-tip">
            暂无可评教的课程安排，导入课程后即可签到评教
          </div>
          <div
            v-for="session in evaluationStore.courses"
            :key="session.id"
            class="session-card"
            :class="{ active: session.id === selectedSessionId }"
            @click="selectedSessionId = session.id"
          >
            <div class="session-top">
              <span class="stock-code-tag">{{ session.stockCode }}</span>
              <strong class="session-course-name">{{ session.courseName }}</strong>
            </div>

            <div class="session-meta">
              <span><Clock :size="13" /> {{ session.time }}</span>
              <span><MapPin :size="13" /> {{ session.room }}</span>
              <span>教师: {{ session.teacherName }}</span>
            </div>

            <div class="session-actions">
              <!-- Sign-in status -->
              <div v-if="session.isSigned" class="status-tag signed">
                <CheckCircle2 :size="14" /> 已签到打卡
              </div>
              <button
                v-else
                class="signin-action-btn"
                @click.stop="handleSignIn(session.id)"
              >
                <QrCode :size="14" /> 模拟课堂扫码签到 (+{{ SIGNIN_REWARD }})
              </button>

              <!-- Evaluation status -->
              <div v-if="session.isEvaluated" class="status-tag evaluated">
                <Sparkles :size="14" /> 已完成评教 (+{{ EVALUATION_REWARD }})
              </div>
              <div v-else class="status-tag pending">
                待评教
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Evaluation Form & Impact Preview -->
      <div class="eval-panel form-panel-card">
        <div class="panel-header-line">
          <span class="p-title">填写客观评教</span>
          <span v-if="currentSession" class="target-course-name">
            当前标的：{{ currentSession.courseName }} ({{ currentSession.teacherName }})
          </span>
        </div>

        <!-- Role check warning if External User -->
        <div v-if="userStore.user.role === 'EXTERNAL'" class="role-warning-banner">
          <Lock :size="16" />
          <span>您当前处于【校外用户】模式，无法参与校内课程评教。可顶部切换为【校内学生】进行测试。</span>
        </div>

        <div v-else-if="!currentSession.isSigned" class="not-signed-notice">
          <Info :size="16" />
          <span>请先在左侧完成本节课的【签到打卡】，方可激活评教打分表单。</span>
        </div>

        <div v-else-if="currentSession.isEvaluated" class="evaluated-notice">
          <CheckCircle2 :size="18" />
          <span>您已完成本节课的评教打分，奖励已发放到账户，星级将在次日开盘前参与聚合计算。</span>
        </div>

        <!-- Form content -->
        <div v-else class="eval-form-box">
          <!-- 1. Star Rating -->
          <div class="form-group">
            <label class="form-label">
              <span>课程星级打分 (1~5星)</span>
              <span class="rating-hint">{{ rating }} 星 · {{ rating >= 4 ? '看多基本面' : rating === 3 ? '中性评价' : '看空基本面' }}</span>
            </label>
            <div class="star-picker">
              <button
                v-for="s in 5"
                :key="s"
                class="star-pick-btn"
                :class="{ active: (hoverRating || rating) >= s }"
                @mouseenter="hoverRating = s"
                @mouseleave="hoverRating = 0"
                @click="rating = s"
              >
                ★
              </button>
            </div>
          </div>

          <!-- 2. Preset Tags -->
          <div class="form-group">
            <label class="form-label">选择评价标签 (可多选)</label>
            <div class="tag-selector-grid">
              <button
                v-for="tag in availablePresetTags"
                :key="tag"
                class="tag-select-btn"
                :class="{ selected: selectedTags.includes(tag) }"
                @click="toggleTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
          </div>

          <!-- 3. Text Comment -->
          <div class="form-group">
            <label class="form-label">文字评价 (默认匿名入库与审核)</label>
            <el-input
              v-model="comment"
              type="textarea"
              :rows="4"
              placeholder="请针对本堂课的教学节奏、板书、重难点剖析等进行客观叙述（严禁人身攻击与恶意刷分）..."
              class="w-full"
            />
          </div>

          <!-- 4. Anonymous switch & Submit -->
          <div class="form-footer">
            <el-checkbox v-model="isAnonymous" label="匿名提交 (推荐)" size="large" />
            <el-button
              type="primary"
              size="large"
              class="submit-eval-btn"
              :loading="isSubmitting"
              :disabled="isSubmitting"
              @click="handleSubmitEvaluation"
            >
              提交客观评价 (+{{ EVALUATION_REWARD }}学币)
            </el-button>
          </div>
        </div>

        <!-- Dynamic Factor Impact preview -->
        <div class="impact-preview-card">
          <div class="impact-title">
            <Sparkles :size="15" class="text-gold" />
            <span>评教数据对次日股价影响机制推演</span>
          </div>
          <p v-if="factorPreview" class="impact-desc">
            「{{ factorPreview.courseName }}（{{ factorPreview.teacherName }}）」近 {{ RATING_WINDOW }} 讲平均星级
            <strong class="text-gold">{{ factorPreview.last5Avg.toFixed(2) }} ★</strong>
            （共 {{ factorPreview.ratingCount }} 次评价入库）。按公式 E = {{ RATING_FACTOR_ALPHA }} × (R̄ − {{ NEUTRAL_RATING }}) / 2 推演，
            下一交易日开盘前预计为该标的贡献约
            <strong class="text-blue">{{ factorPreview.earningPct >= 0 ? '+' : '' }}{{ factorPreview.earningPct.toFixed(2) }}%</strong>
            基本面因子收益{{ factorPreview.earningPct >= 0 ? '（看多）' : '（看空）' }}。
            现在提交一条高星评价将抬升该均值，并在次日收盘结算时计入开盘价。
          </p>
          <p v-else class="impact-desc">
            当前课程未匹配到关联教学标的，暂无法推演因子影响；切换左侧课程后将在此展示实时推演。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.evaluation-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.eval-hero-banner {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  padding: 22px 28px;
}

.badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 700;
  color: #34d399;
  background: rgba(52, 211, 153, 0.12);
  border: 1px solid rgba(52, 211, 153, 0.3);
  padding: 3px 10px;
  border-radius: 12px;
  width: fit-content;
  margin-bottom: 8px;
}

.banner-title {
  margin: 0 0 8px 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: #f8fafc;
}

.banner-desc {
  margin: 0;
  font-size: 0.86rem;
  color: #94a3b8;
  line-height: 1.5;
}

.reward-rule-box {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 14px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rule-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #fbbf24;
  margin-bottom: 2px;
}

.rule-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: #cbd5e1;
}

.eval-main-grid {
  display: grid;
  grid-template-columns: 1fr 1.35fr;
  gap: 20px;
}

.eval-panel {
  background: rgba(17, 26, 44, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-header-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  padding-bottom: 12px;
}

.p-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #f8fafc;
}

.sub-text {
  font-size: 0.74rem;
  color: #94a3b8;
}

.empty-tip {
  padding: 18px 0;
  text-align: center;
  font-size: 0.78rem;
  color: #64748b;
  border: 1px dashed rgba(148, 163, 184, 0.2);
  border-radius: 10px;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.session-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.session-card:hover {
  background: rgba(56, 189, 248, 0.05);
  border-color: rgba(56, 189, 248, 0.3);
}

.session-card.active {
  background: rgba(56, 189, 248, 0.1);
  border-color: #38bdf8;
  box-shadow: 0 4px 14px rgba(56, 189, 248, 0.15);
}

.session-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stock-code-tag {
  font-family: monospace;
  font-size: 0.72rem;
  padding: 2px 6px;
  background: rgba(139, 92, 246, 0.15);
  color: #c4b5fd;
  border-radius: 4px;
}

.session-course-name {
  font-size: 0.92rem;
  color: #f8fafc;
}

.session-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.76rem;
  color: #94a3b8;
}

.session-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.session-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.signin-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(52, 211, 153, 0.15);
  border: 1px solid rgba(52, 211, 153, 0.3);
  border-radius: 8px;
  color: #34d399;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.status-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.76rem;
  padding: 4px 8px;
  border-radius: 6px;
}

.status-tag.signed {
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
}

.status-tag.evaluated {
  background: rgba(251, 191, 36, 0.12);
  color: #fbbf24;
}

.status-tag.pending {
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
}

.target-course-name {
  font-size: 0.8rem;
  color: #38bdf8;
}

.role-warning-banner,
.not-signed-notice,
.evaluated-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 0.84rem;
}

.role-warning-banner {
  background: rgba(248, 113, 113, 0.12);
  border: 1px solid rgba(248, 113, 113, 0.3);
  color: #f87171;
}

.not-signed-notice {
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
}

.evaluated-notice {
  background: rgba(52, 211, 153, 0.12);
  border: 1px solid rgba(52, 211, 153, 0.3);
  color: #34d399;
}

.eval-form-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.82rem;
  color: #cbd5e1;
  font-weight: 600;
}

.rating-hint {
  font-size: 0.78rem;
  color: #fbbf24;
}

.star-picker {
  display: flex;
  gap: 10px;
}

.star-pick-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #64748b;
  font-size: 1.4rem;
  cursor: pointer;
  transition: all 0.15s;
}

.star-pick-btn.active {
  background: rgba(251, 191, 36, 0.15);
  border-color: rgba(251, 191, 36, 0.5);
  color: #fbbf24;
  transform: scale(1.05);
}

.tag-selector-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-select-btn {
  padding: 6px 12px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 0.8rem;
  cursor: pointer;
}

.tag-select-btn.selected {
  background: rgba(56, 189, 248, 0.15);
  border-color: #38bdf8;
  color: #38bdf8;
  font-weight: 600;
}

.form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.submit-eval-btn {
  border-radius: 12px !important;
  font-weight: 700 !important;
}

.impact-preview-card {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.impact-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #f8fafc;
}

.impact-desc {
  margin: 0;
  font-size: 0.78rem;
  color: #94a3b8;
  line-height: 1.45;
}

.w-full { width: 100%; }
.text-gold { color: #fbbf24; }
.text-blue { color: #38bdf8; }

@media (max-width: 950px) {
  .eval-hero-banner { grid-template-columns: 1fr; }
  .eval-main-grid { grid-template-columns: 1fr; }
}
</style>
