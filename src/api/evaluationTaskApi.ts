/**
 * 评教与任务模块 —— API 契约（草案 v0.1）
 *
 * 状态说明：
 * - 契约先行：本文件仅定义未来后端接口的请求/响应结构与边界，不产生网络调用；
 * - 当前阶段 store 仍直接读写 mock（src/mock/initialData.ts）；
 * - 接入后端时：将 stores/evaluation.ts 的 signInCourse/submitEvaluation、
 *   stores/task.ts 的 claimTaskReward/advanceTaskByTrigger 内部实现替换为
 *   下方对应函数（fetch 封装），页面与组件无需改动。
 *
 * 详细约定（字段口径、时序、幂等语义）见：
 *   docs/24320230/API契约-评教与任务模块.md
 */
import type { EvaluationItem, TaskTrigger } from '@/types'

/** 评价审核状态（与 EvaluationItem.status 保持一致） */
export type EvaluationStatus = EvaluationItem['status']

// ---------------------------------------------------------------------------
// 签到
// ---------------------------------------------------------------------------
export interface SignInRequest {
  sessionId: string
}
export interface SignInResponse {
  success: boolean
  message: string
  /** 本次到课签到发放的学币 */
  reward: number
  /** 签到后该课程新状态 */
  isSigned: boolean
}

// ---------------------------------------------------------------------------
// 提交评教
// ---------------------------------------------------------------------------
export interface SubmitEvaluationRequest {
  sessionId: string
  rating: number // 1~5（由 rules.clampRating 保证）
  tags: string[]
  comment: string
  anonymous?: boolean
}
export interface SubmitEvaluationResponse {
  success: boolean
  message: string
  reward: number
  /** 提交后标的聚合结果快照（供次日因子展示） */
  stock: {
    code: string
    rating: number
    last5AvgRating: number
    ratingCount: number
  }
}

// ---------------------------------------------------------------------------
// 任务进度上报与领奖
// ---------------------------------------------------------------------------
export interface AdvanceTaskRequest {
  trigger: TaskTrigger
  delta?: number
}
export interface ClaimTaskRequest {
  taskId: number
}
export interface ClaimTaskResponse {
  success: boolean
  message: string
  reward: number
}

// ---------------------------------------------------------------------------
// 评价查询（我的/课程维度，供详情页与评教中心展示）
// ---------------------------------------------------------------------------
export interface EvaluationQuery {
  sessionId?: string
  stockCode?: string
  status?: EvaluationStatus
  page?: number
  pageSize?: number
}
export interface EvaluationPage {
  list: EvaluationItem[]
  total: number
  page: number
  pageSize: number
}

/**
 * 契约实现点（接入后端时在此填充 fetch 封装）。
 * 当前返回 null 表示“未接入”，禁止在业务路径中直接调用。
 */
export const evaluationTaskApi = {
  signIn: (_req: SignInRequest): Promise<SignInResponse> => {
    throw new Error('evaluationTaskApi 尚未接入后端')
  },
  submitEvaluation: (_req: SubmitEvaluationRequest): Promise<SubmitEvaluationResponse> => {
    throw new Error('evaluationTaskApi 尚未接入后端')
  },
  claimTask: (_req: ClaimTaskRequest): Promise<ClaimTaskResponse> => {
    throw new Error('evaluationTaskApi 尚未接入后端')
  },
  queryEvaluations: (_query: EvaluationQuery): Promise<EvaluationPage> => {
    throw new Error('evaluationTaskApi 尚未接入后端')
  }
}
