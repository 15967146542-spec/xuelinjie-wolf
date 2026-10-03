/**
 * 学林街之狼 —— API 契约类型（v1.0）
 *
 * 状态说明：
 * - 契约先行：本文件定义后端接口的请求/响应结构与边界，不产生网络调用；
 * - 当前阶段 store 仍直接读写 mock（src/mock/initialData.ts）；
 * - 接入后端时：将 stores/* 内部实现替换为下方对应函数（fetch 封装），页面与组件无需改动。
 *
 * 详细约定（统一响应体、错误码、鉴权、时序、幂等语义）见：
 *   docs/24320230/API契约-评教与任务模块.md（v1.0，2026-10-03 定稿）
 */
import type { EvaluationItem, TaskTrigger, UserRole } from '@/types'

/** 评价审核状态（与 EvaluationItem.status 保持一致） */
export type EvaluationStatus = EvaluationItem['status']

// ---------------------------------------------------------------------------
// 统一响应体（契约 §2.1）
// ---------------------------------------------------------------------------

/** 后端统一返回结构：业务失败 HTTP 200 + code!=0；认证/权限失败为 HTTP 401/403 */
export interface Result<T> {
  code: number
  message: string
  data: T | null
}

// ---------------------------------------------------------------------------
// 认证（契约 §3.1 / §3.2）
// ---------------------------------------------------------------------------

export interface UserVO {
  id: number
  username: string
  nickname: string
  role: UserRole
  balance: number
}

export interface RegisterRequest {
  username: string
  nickname?: string
  password: string
}
export type RegisterResponse = UserVO

export interface LoginRequest {
  username: string
  password: string
}
export interface LoginResponse {
  /** JWT，后续请求放 Authorization: Bearer <token>，有效期 12h */
  token: string
  user: UserVO
}

// ---------------------------------------------------------------------------
// 行情标的分页（契约 §3.3，免登录）
// ---------------------------------------------------------------------------

export interface StockVO {
  code: string
  name: string
  course: string
  college: string
  price: number
  change: number
  changeRate: number
  rating: number
  ratingCount: number
  turnover: number
}
export interface StockPageQuery {
  page?: number
  pageSize?: number
  keyword?: string
  college?: string
  sortBy?: 'changeRate' | 'price' | 'rating' | 'turnover'
  order?: 'asc' | 'desc'
}
export interface StockPage {
  list: StockVO[]
  total: number
  page: number
  pageSize: number
}

// ---------------------------------------------------------------------------
// 签到（契约 §3.4）
// ---------------------------------------------------------------------------
export interface SignInRequest {
  sessionId: string
}
export interface SignInResponse {
  /** 本次到课签到发放的学币 */
  reward: number
  /** 签到后该课程新状态 */
  isSigned: boolean
}

// ---------------------------------------------------------------------------
// 提交评教（契约 §3.5）
// ---------------------------------------------------------------------------
export interface SubmitEvaluationRequest {
  sessionId: string
  rating: number // 1~5（服务端仍会 clampRating 强校验）
  tags: string[]
  comment: string
  anonymous?: boolean
}
export interface SubmitEvaluationResponse {
  reward: number
  /** 提交后标的聚合结果快照（服务端 applyRatingAggregation 的镜像计算） */
  stock: {
    code: string
    rating: number
    last5AvgRating: number
    ratingCount: number
  }
}

// ---------------------------------------------------------------------------
// 任务领奖（契约 §3.6）
// ---------------------------------------------------------------------------
export interface AdvanceTaskRequest {
  trigger: TaskTrigger
  delta?: number
}
export interface ClaimTaskRequest {
  taskId: number
}
export interface ClaimTaskResponse {
  reward: number
}

// ---------------------------------------------------------------------------
// 评价查询（契约 §3.7）
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

// ---------------------------------------------------------------------------
// 持仓与资产（契约 §3.8）
// ---------------------------------------------------------------------------
export interface PositionVO {
  code: string
  name: string
  totalShares: number
  /** T+1 批次汇总后的今日可卖股数（服务端计算） */
  sellableShares: number
  costPrice: number
  price: number
  marketValue: number
  profit: number
}
export interface PositionsResponse {
  positions: PositionVO[]
  summary: {
    totalAsset: number
    available: number
    marketValue: number
  }
}

/**
 * 契约实现点（接入后端时在此填充 fetch 封装）。
 * 当前返回 null 表示“未接入”，禁止在业务路径中直接调用。
 */
export const evaluationTaskApi = {
  register: (_req: RegisterRequest): Promise<Result<RegisterResponse>> => {
    throw new Error('evaluationTaskApi 尚未接入后端')
  },
  login: (_req: LoginRequest): Promise<Result<LoginResponse>> => {
    throw new Error('evaluationTaskApi 尚未接入后端')
  },
  queryStocks: (_query: StockPageQuery): Promise<Result<StockPage>> => {
    throw new Error('evaluationTaskApi 尚未接入后端')
  },
  signIn: (_req: SignInRequest): Promise<Result<SignInResponse>> => {
    throw new Error('evaluationTaskApi 尚未接入后端')
  },
  submitEvaluation: (_req: SubmitEvaluationRequest): Promise<Result<SubmitEvaluationResponse>> => {
    throw new Error('evaluationTaskApi 尚未接入后端')
  },
  claimTask: (_req: ClaimTaskRequest): Promise<Result<ClaimTaskResponse>> => {
    throw new Error('evaluationTaskApi 尚未接入后端')
  },
  queryEvaluations: (_query: EvaluationQuery): Promise<Result<EvaluationPage>> => {
    throw new Error('evaluationTaskApi 尚未接入后端')
  },
  queryPositions: (): Promise<Result<PositionsResponse>> => {
    throw new Error('evaluationTaskApi 尚未接入后端')
  }
}
