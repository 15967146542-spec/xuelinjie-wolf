# API 契约 —— 评教与任务模块（草案 v0.1）

> 维护：24320218（评教与任务激励模块）
> 状态：**契约先行**，尚未接入后端。类型与函数骨架见 `src/api/evaluationTaskApi.ts`。
> 目标：让 store 与页面在未来切换到真实接口时，字段口径、时序与语义不返工。

## 1. 设计原则

- **页面不直接调 API**：`EvaluationView / TaskView` 只消费 store；
- **store 是替换点**：接入后端时替换 `stores/evaluation.ts`（`signInCourse`/`submitEvaluation`）与 `stores/task.ts`（`claimTaskReward`）内部实现为 `src/api/evaluationTaskApi.*`，页面零改动；
- **字段口径以本模块类型为准**：星级 `rating: 1~5`、金额单位学币（整数）、时间 `ISO 8601` 或现有 `YYYY-MM-DD HH:mm:ss`；
- **业务规则只存在于 `src/rules.ts`**：奖励金额、聚合窗口、因子公式等后端须与前端保持一致（评审时以 `rules.ts` 为基准）。

## 2. 端点清单

### 2.1 POST /api/evaluation/sign-in（到课签到）
请求：`SignInRequest { sessionId }`
响应：`SignInResponse { success, message, reward, isSigned }`
语义：
- 幂等：同一 `sessionId` 重复签到返回 `success:false`（"已完成本节课签到"），不重复发奖；
- 成功发放 `SIGNIN_REWARD`（100），并触发服务端任务进度事件 `CLASS_SIGNIN`；
- 仅校内认证学生（`STUDENT`）可签到；`EXTERNAL` 拒签（如产品放开再调整）。

### 2.2 POST /api/evaluation/submit（提交评教）
请求：`SubmitEvaluationRequest { sessionId, rating, tags, comment, anonymous? }`
响应：`SubmitEvaluationResponse { success, message, reward, stock{...} }`
语义：
- 前置校验（服务端强校验，前端仅提示）：已签到、未重复评、`EXTERNAL` 拒评、comment 非空；
- 幂等：重复提交同一课程返回 `success:false`；
- 成功发放 `EVALUATION_REWARD`（80）并推进 `COURSE_EVALUATION` 任务；
- 聚合结果（`stock.rating/last5AvgRating/ratingCount`）由服务端按 `rules.applyRatingAggregation` 计算并返回快照；
- 入库默认可匿名（`anonymous !== false` 时 `studentName` 脱敏为"校内匿名同学"）。

### 2.3 POST /api/task/advance（任务进度上报）
请求：`AdvanceTaskRequest { trigger: TaskTrigger, delta? }`
说明：由服务端在业务动作（签到/评教/交易/登录）成功时**内部触发**，不建议客户端直接上报，防作弊；前端仅在演示/兜底时调用。

### 2.4 POST /api/task/claim（领取奖励）
请求：`ClaimTaskRequest { taskId }`
响应：`ClaimTaskResponse { success, message, reward }`
语义：仅当 `!isClaimed && current >= target` 可领；领后写流水（category=任务中心）；跨天时服务端先执行每日结算（DAILY 归零）。

### 2.5 GET /api/evaluations（评价查询）
请求：`EvaluationQuery { sessionId?, stockCode?, status?, page?, pageSize? }`
响应：`EvaluationPage { list, total, page, pageSize }`
用途：评教中心/个股详情/管理端审核共用；`status` 过滤支持 `APPROVED/PENDING/REJECTED/DOWNWEIGHTED`。

## 3. 每日任务结算时序（服务端）

每日 00:00（或以"最近结算日期"惰性判定，与前端 `stores/task.ts ensureFreshDay` 对齐）：
1. 全部 `DAILY` 任务 `current=0, isClaimed=false`；
2. `DAILY_LOGIN` 任务当日自动达成（当天登录过）；
3. 业务事件按 `trigger` 推进进度（`advanceTaskByTrigger`）。

## 4. 接入清单（ToDo）

- [ ] 组长确认 API 路由前缀与鉴权方案（JWT/学号会话）后，将本文件升级为 v1.0；
- [ ] `src/api/evaluationTaskApi.ts` 内填充 fetch 封装；
- [ ] store 内替换 mock 读写，保留 mock 作为开发回退；
- [ ] 服务端实现 `rules.ts` 对应规则并补契约测试。

## 5. 相关文件

- `src/rules.ts` —— 金额/窗口/权重/公式（前后端共同基准）
- `src/stores/evaluation.ts`、`src/stores/task.ts` —— 待替换点
- `tests/rules.test.ts` —— 规则单测（服务端应镜像）
