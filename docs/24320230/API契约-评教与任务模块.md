# API 契约 —— 学林街之狼前后端接口（v1.0）

> 维护：24320230（组长）
> 状态：**v1.0 定稿**。鉴权方案已确认为 JWT（原 v0.1 遗留的「组长确认鉴权方案」事项闭环）；后端实施位于 `backend/`（Spring Boot 3 + MyBatis + MySQL），实施检查单见 `rules移植与实施清单.md`。
> 历史：v0.1（2026-09-05）仅覆盖评教与任务模块；v1.0（2026-10-03）补认证、行情、持仓三组接口，增加统一响应体、错误码表与数据库表草案。
> 目标：让 store 与页面在切换到真实接口时，字段口径、时序与语义不返工。

## 1. 设计原则

- **页面不直接调 API**：视图只消费 store；接入后端时替换 `stores/*` 内部实现为 `src/api/evaluationTaskApi.*` 的 fetch 封装，页面零改动；
- **字段口径以 `src/api/evaluationTaskApi.ts` 类型为准**：星级 `rating: 1~5`、金额单位学币（整数）、时间 `ISO 8601` 或现有 `YYYY-MM-DD HH:mm:ss`；
- **业务规则只存在于 `src/rules.ts`（前端）与其 Java 镜像（后端）**：奖励金额、聚合窗口、因子公式等以 `rules.ts` 为基准镜像实现，两边测试用例一一对应（见移植清单）；
- **鉴权**：JWT Bearer Token；除 `/api/auth/*` 与 `GET /api/market/stocks` 外全部接口需登录。

## 2. 统一响应体与错误码

### 2.1 响应体 `Result<T>`

```json
{ "code": 0, "message": "ok", "data": { } }
```

- 业务失败（幂等拒绝、未达标等）：HTTP 200 + `code != 0`，`data` 为 `null`；
- 认证/权限失败：直接返回对应 HTTP 状态码（401/403），响应体同为 `Result`（`data: null`）；
- 服务端异常：`@RestControllerAdvice` 兜底为 HTTP 200 + `code=5000`（不向前端暴露堆栈）。

### 2.2 错误码表

| code | HTTP | 语义 | 触发场景 |
| --- | --- | --- | --- |
| 0 | 200 | 成功 | — |
| 401 | 401 | 未登录 / Token 缺失或过期 | 拦截器直接返回，不进 Controller |
| 403 | 403 | 已登录但角色无权限 | 如 EXTERNAL 调签到、非 ADMIN 调管理端 |
| 1001 | 200 | 参数校验失败 | rating 越界、comment 为空、用户名格式不符 |
| 1002 | 200 | 用户名已存在 | 注册 |
| 1003 | 200 | 用户名或密码错误 | 登录 |
| 2001 | 200 | 重复签到（幂等拒绝） | 同一 sessionId 再次签到 |
| 2002 | 200 | 未到签到时间 | 课程未开课/已结束 |
| 2003 | 200 | 未签到，不允许评教 | 评教前置校验 |
| 2004 | 200 | 重复评教（幂等拒绝） | 同一课程已有本人评价 |
| 2005 | 200 | 校外用户无评教权限 | EXTERNAL 提交评教 |
| 3001 | 200 | 任务进度未达标 | current < target 时领取 |
| 3002 | 200 | 任务奖励已领取 | isClaimed = true |
| 5000 | 200 | 服务器内部错误 | 兜底 |

## 3. 端点清单（8 组客户端接口 + 1 组内部接口）

### 3.1 POST /api/auth/register（注册，免登录）

请求：`RegisterRequest { username, nickname?, password }`
响应：`Result<RegisterResponse { id, username, nickname, role, balance }>`

- 用户名 2–16 位中文/字母/数字（同线上演示口径）；密码 ≥ 6 位，BCrypt 存储，明文不落库不出库；
- 新用户默认 `role = STUDENT`、`balance = 10000`；
- 重名返回 `code=1002`。

### 3.2 POST /api/auth/login（登录，免登录）

请求：`LoginRequest { username, password }`
响应：`Result<LoginResponse { token, user: UserVO }>`

- 签发 JWT：claims 含 `uid`、`username`、`role`、`exp`（12 小时），HS256，密钥放 `application-local.yml`（不入库）；
- 失败返回 `code=1003`，不区分「用户不存在/密码错误」。

### 3.3 GET /api/market/stocks（行情标的分页，免登录）

请求：query `page=1&pageSize=20&keyword?&college?&sortBy=changeRate&order=desc`
响应：`Result<StockPage { list: StockVO[], total, page, pageSize }>`

- 对应行情大厅表格；`keyword` 匹配教师名/课程名/代码；`sortBy` 支持 `changeRate|price|rating|turnover`；
- `StockVO` 字段与前端 `types` 中标的行口径一致（code、name、course、college、price、change、changeRate、rating、ratingCount、turnover）；
- 服务端排序，前端只渲染。

### 3.4 POST /api/evaluation/sign-in（到课签到，需登录 STUDENT）

请求：`SignInRequest { sessionId }`
响应：`Result<SignInResponse { reward, isSigned }>`

- 幂等：同一用户同一 `sessionId` 重复签到返回 `code=2001`，不重复发奖；
- 成功发放 `SIGNIN_REWARD`（100），并触发服务端任务进度事件 `CLASS_SIGNIN`；
- `EXTERNAL` 调用返回 403；未到签到时间返回 `code=2002`。

### 3.5 POST /api/evaluation/submit（提交评教，需登录 STUDENT）

请求：`SubmitEvaluationRequest { sessionId, rating, tags, comment, anonymous? }`
响应：`Result<SubmitEvaluationResponse { reward, stock: { code, rating, last5AvgRating, ratingCount } }>`

- 服务端强校验（前端仅提示）：已签到、未重复评、comment 非空、`rating` 先 `clampRating`；
- 幂等：重复提交同一课程返回 `code=2004`；
- 成功发放 `EVALUATION_REWARD`（80）并推进 `COURSE_EVALUATION` 任务；
- 聚合结果（`applyRatingAggregation` 的 Java 镜像）由服务端计算并返回快照；
- `anonymous !== false` 时 `studentName` 落库为「校内匿名同学」。

### 3.6 POST /api/task/claim（领取奖励，需登录）

请求：`ClaimTaskRequest { taskId }`
响应：`Result<ClaimTaskResponse { reward }>`

- 仅当 `!isClaimed && current >= target` 可领，否则 `code=3001/3002`；
- 领取成功写账本流水（category=任务中心）；
- 跨天时服务端先执行每日结算（DAILY 归零）再判定。

### 3.7 GET /api/evaluations（评价查询，需登录）

请求：query `sessionId?&stockCode?&status?&page=1&pageSize=10`
响应：`Result<EvaluationPage { list: EvaluationItem[], total, page, pageSize }>`

- 评教中心/个股详情/管理端审核共用；`status` 过滤 `APPROVED/PENDING/REJECTED/DOWNWEIGHTED`；
- 非管理员请求自动追加「仅 APPROVED」过滤（公开口径 `isReviewPublic` 由服务端保证）。

### 3.8 GET /api/trade/positions（持仓与资产，需登录）

响应：`Result<PositionsResponse { positions: PositionVO[], summary: { totalAsset, available, marketValue } }>`

- `PositionVO` 对应持仓表行（code、name、totalShares、sellableShares、costPrice、price、marketValue、profit）；
- `sellableShares` 由服务端按 T+1 批次（`canSellToday`）汇总——`deductSellableLots`/批次语义的 Java 镜像；
- 交易下单接口（买入/卖出）属 Phase 3 之后的扩展，暂不在 v1.0 范围（前端交易页先保留本地模拟）。

### 3.9 POST /api/task/advance（任务进度上报——内部接口）

请求：`AdvanceTaskRequest { trigger, delta? }`
说明：由服务端在业务动作（签到/评教/交易/登录）成功时**内部触发**，不对客户端开放（防作弊）；前端仅演示兜底可用，生产口径下网关层禁用。

## 4. JWT 与鉴权约定

- 请求头：`Authorization: Bearer <token>`；
- 拦截器白名单：`POST /api/auth/register`、`POST /api/auth/login`、`GET /api/market/stocks`；
- Token 缺失/过期/伪造 → HTTP 401（`Result{code:401}`）；角色不符 → HTTP 403；
- 前端处理：fetch 封装统一拦截 401 清空本地登录态并跳登录页；403 弹权限提示（对应 R15）。

## 5. 每日任务结算时序（服务端）

每日 00:00（或以「最近结算日期」惰性判定，与前端 `stores/task.ts ensureFreshDay` 对齐）：
1. 全部 `DAILY` 任务 `current=0, isClaimed=false`；
2. `DAILY_LOGIN` 任务当日自动达成（当天登录过）；
3. 业务事件按 `trigger` 推进进度（`advanceTaskByTrigger`）。

## 6. 数据库表草案（MySQL 8，utf8mb4）

| 表 | 关键列 | 说明 |
| --- | --- | --- |
| `user` | id, username, nickname, password(BCrypt), role, balance, created_at | 注册/登录/JWT |
| `course_session` | id, stock_code, name, college, teacher_name, class_date, start_time, end_time | 课程场次日程 |
| `sign_in_record` | id, user_id, session_id, signed_at；UNIQUE(user_id, session_id) | 幂等签到靠唯一键兜底 |
| `evaluation` | id, user_id, session_id, stock_code, rating, tags, comment, anonymous, status, created_at；UNIQUE(user_id, session_id) | 评教与审核状态 |
| `stock` | code, name, course, college, price, change, change_rate, rating, last5_avg_rating, rating_count, turnover, recent_ratings(JSON) | 标的行情与聚合快照 |
| `task` / `task_progress` | 任务定义；user_id, task_id, current, is_claimed, last_settle_date | 进度只增不减 |
| `account_log` | id, user_id, category, amount, remark, created_at | 学币流水（签到/评教/任务/交易） |
| `position_lot` | id, user_id, stock_code, shares, cost_price, buy_date, can_sell_today | T+1 批次持仓 |

> 建表 SQL 由用户在 Phase 2 手写（`backend/src/main/resources/schema.sql`），本表为口径基准非直接可执行脚本。

## 7. 接入清单（ToDo）

- [x] 组长确认 API 路由前缀（`/api`）与鉴权方案（JWT）——v1.0 定稿（2026-10-03）
- [ ] `src/api/evaluationTaskApi.ts` 内填充 fetch 封装（类型已随 v1.0 补齐）
- [ ] store 内替换 mock 读写，保留 mock 作为开发回退
- [ ] 服务端实现 `rules.ts` 对应规则并补契约测试（JUnit 用例清单见 `rules移植与实施清单.md`）

## 8. 相关文件

- `src/rules.ts` —— 金额/窗口/权重/公式（前后端共同基准）
- `src/api/evaluationTaskApi.ts` —— 请求/响应类型（本契约的类型化表达）
- `tests/rules.test.ts` —— 规则单测（服务端 JUnit 镜像）
- `rules移植与实施清单.md` —— Phase 2–4 实施检查单与 20 项用例清单
- `postman-xuelinjie-v1.json` —— Postman 集合（登录自动保存 Token）
