# rules 移植与后端实施清单（Phase 2–4）

> 维护：24320230（组长）｜ 制定日期：2026-10-03
> 用途：API 契约 v1.0 定稿后的后端实施手册。**10.8 海投启动前不执行**；每个 Phase 做完即是一个可讲的面试故事，随时可停。
> 纪律：Java 业务代码全部由本人手敲（脱敏原则），AI/他人只做 review；每阶段完成判据全绿才算过。

---

## A. rules.ts → Java 移植对照表

建议先建**单个类** `com.xuelinjie.rules.Rules`（常量 + 静态纯方法），与 `src/rules.ts` 逐行镜像——测试全绿后再考虑拆 `RatingRules / TradeRules / TaskRules`，第一版不拆（降低对不上口径的风险）。

### A.1 常量（14 个）

| rules.ts | Java 建议名 | 值 |
| --- | --- | --- |
| `SIGNIN_REWARD` | `SIGNIN_REWARD` | 100 |
| `EVALUATION_REWARD` | `EVALUATION_REWARD` | 80 |
| `RATING_WINDOW` | `RATING_WINDOW` | 5 |
| `EVALUATION_MIN_RATING` / `MAX` | `EVALUATION_MIN_RATING` / `MAX` | 1 / 5 |
| `NEUTRAL_RATING` | `NEUTRAL_RATING` | 3.0 |
| `RATING_FACTOR_ALPHA` | `RATING_FACTOR_ALPHA` | 0.02 |
| `RATING_EMA_NEW_WEIGHT` | `RATING_EMA_NEW_WEIGHT` | 0.05 |
| `TRADE_FEE_RATE` | `TRADE_FEE_RATE` | 0.001 |
| `MONTH_CARD_FEE_DISCOUNT` | `MONTH_CARD_FEE_DISCOUNT` | 0.5 |
| `POSITION_LIMIT_RATIO` | `POSITION_LIMIT_RATIO` | 0.3 |
| `FEE_POOL_RETAIN_RATIO` | `FEE_POOL_RETAIN_RATIO` | 0.5 |
| `PUBLIC_REVIEW_STATUS` | `PUBLIC_REVIEW_STATUS` | "APPROVED" |
| `AUDIT_STATUSES` | `AUDIT_STATUSES`（`List<String>` 或枚举） | APPROVED/DOWNWEIGHTED/REJECTED |

### A.2 方法（13 个，全部纯函数：不改入参、无副作用）

| rules.ts 函数 | Java 建议签名要点 | 注意点 |
| --- | --- | --- |
| `clampRating` | `int clampRating(double)`，NaN→返回 3.0 | NaN 语义用 `Double.isNaN` |
| `applyRatingAggregation` | 传 `StockRating` 入参 + 新分，返回聚合结果对象 | **必须构造新对象返回，不改入参**（TS 靠不可变约定，Java 靠自觉 + 单测第 6 条盯着） |
| `calcRatingFactorEarning` | `double (double)` | 无坑 |
| `shouldResetDaily` | `boolean (String lastDate, String today)` | null 与同日均 false |
| `resetDailyTask` | 泛型或直接 `TaskProgress` 类型，返回新对象 | current=0、isClaimed=false、target 不动 |
| `autoCompleteLoginTask` | `TaskProgress (TaskProgress)` | 四个分支都要（已领/非登录/非 DAILY） |
| `canClaimTaskReward` | `boolean (int, int, boolean)` | 无坑 |
| `nextTaskProgress` | `int (int, int, int)` | `Math.min` 封顶 |
| `tradeFeeRate` | `double (boolean)` | 无坑 |
| `calcTradeAmount/Fee/Payable/NetReturn` | 四个小函数，注意**保留位数语义**：TS 是 `toFixed(2)` | Java 用 `BigDecimal.setScale(2, HALF_UP)` 或先乘后除取整——推荐 BigDecimal，面试可讲浮点精度 |
| `exceedsPositionLimit` | `boolean (double, double, double)` | **恰好 30% 是 false**（`>` 不是 `>=`） |
| `calcMaxAdditionalSharesToLimit` | `int (…)` | 整股截断 `Math.floor`、负数兜底 0 |
| `calcWeightedCostPrice` | `double (…)` | 加权平均，除零返回 0 |
| `deductSellableLots` | `List<PositionLot> + int → Result{lots, remaining}` | FIFO：跳过 `canSellToday=false`；扣光的批次移出列表；**入参列表不被修改**（新 ArrayList） |

---

## B. JUnit 20 项用例清单（与 tests/rules.test.ts 一一镜像）

> 写法：`backend/src/test/java/com/xuelinjie/rules/RulesTest.java`，JUnit 5。下面每条是场景 + 期望值，**不提供 Java 实现**。全绿判据 = 20/20。

**评分聚合（7 项）**
1. 常量：签到 100 / 评教 80
2. 常量：窗口 5、中性 3.0、区间 1~5、EMA 新权重 0.05
3. `clampRating`：9→5、0→1、4→4、NaN→3.0
4. 空窗口聚合：`recentRatings=[]`, rating=4.2, count=12，提交 5 → last5Avg=5、长度 1、count=13、rating=4.2（4.2×0.95+5×0.05=4.24→留 1 位）
5. 满窗口聚合：`[5,4,5,3,4]`, rating=4.4, count=20，提交 1 → `[1,5,4,5,3]`、last5Avg=3.6、count=21
6. 纯函数：聚合后入参对象所有字段不变
7. 因子公式：E(5)=+0.02、E(3)=0、E(1)=-0.02

**任务（5 项）**
8. 跨天重置：lastDate=null→false、同日→false、跨日→true
9. 重置归零：current=0、isClaimed=false、target=3 不变、入参不被修改
10. 登录自动达成：未领未满→补满；已领→不动；MAKE_TRADE→不动；SEMESTER→不动
11. 领取资格：满+未领→true；未满→false；已领→false
12. 进度推进：1+1=2、2+1=3、0+5→封顶 3、3+1→仍 3

**交易（6 项）**
13. 费率常量：0.001 / 折扣 0.5 / 仓位 0.3 / 奖池 0.5；月卡 true→0.0005、false→0.001
14. 金额四件套：10×5=50；10000 无卡费 10、有卡 5；应付 10010；净回 9990
15. 仓位边界：恰好 30% → false；30.001% → true
16. 最大加仓：限额内 (100000,20000,10)→1000；已超限→0
17. 摊薄均价：(80×120.30+20×128.50)/100=121.94；(100×50+100×60)/200=55
18. T+1 FIFO：`[40可卖, 30锁, 60可卖]` 卖 100 → 只剩 `[30锁]`；卖 50 → `[30锁, 50可卖]`；原列表不变

**审核（2 项）**
19. 状态集：仅 APPROVED/DOWNWEIGHTED/REJECTED，含 PENDING 为非法
20. 公开口径：仅 APPROVED 对外可见，其余全部 false

---

## C. Phase 2 检查单：Spring Boot 骨架 + JWT（1–2 天，手敲）

- [ ] Spring Initializr 生成 `backend/`：Spring Boot 3 + Web + MyBatis(+PageHelper) + MySQL Driver + Lombok + Validation
- [ ] `application.yml`（可入库，用占位密码）+ `application-local.yml`（真实密码，**确认在 .gitignore 里再写**）
- [ ] 建表 SQL 手写 `schema.sql`（表结构按契约 §6；`sign_in_record` 与 `evaluation` 的 UNIQUE 键是幂等的兜底）
- [ ] 统一响应 `Result<T>` + 错误码常量类（对照契约 §2）
- [ ] `@RestControllerAdvice` 全局异常：参数校验→1001、业务异常→自定义 `BizException(code)`、兜底→5000
- [ ] 注册/登录：BCrypt 存密码；登录签发 JWT（uid/username/role/exp 12h，HS256）
- [ ] 登录拦截器：白名单 3 个（见契约 §4）；无/坏 Token→401，角色不符→403
- [ ] AOP 操作日志切面：签到/评教/领奖三个写接口打方法名+参数+耗时
- **完成判据**：Postman 集合「01-认证」三个请求全部符合期望描述（注册成功→登录存 Token→无 Token 401）

## D. Phase 3 检查单：业务接口 + JUnit（2–3 天，手敲）

- [ ] `Rules.java` 按 A 表移植（先不动 Controller）
- [ ] `RulesTest.java` 20 项全绿（B 表）——**先测试后接线**
- [ ] 行情分页 `GET /api/market/stocks`（PageHelper，服务端排序）
- [ ] 签到：幂等（业务判断 + UNIQUE 键兜底）、发奖写 `account_log`、触发任务推进
- [ ] 评教：前置校验链（已签到→未重复→comment 非空→clamp）→ 入库 → 服务端跑聚合 → 返回快照
- [ ] 领奖：达标判定 → 写流水；查询：分页 + 非管理员强制 APPROVED
- [ ] 持仓：批次汇总 sellableShares（T+1）
- **完成判据**：Postman 全集合按描述通过；重复签到返回 2001；评教后 ratingCount +1；`mvn test` 20/20

## E. Phase 4 检查单：前端接线（1–2 天，手敲）

- [ ] `evaluationTaskApi.ts` 填充 fetch 封装（baseUrl 走 Vite 代理 `/api` → `localhost:8080`）
- [ ] fetch 层统一处理：401→清登录态跳登录；`code!=0`→ElMessage 提示（R15）
- [ ] `stores/evaluation.ts`、`stores/task.ts` 切换到 API（保留 mock 回退开关）
- [ ] 角色改由登录接口 `user.role` 驱动，路由守卫对接
- **完成判据**：刷新数据不丢（R13）；四身份权限由后端驱动（R12）

---

## F. 红线（违反任何一条=停手）

1. `application-local.yml`、任何真实密码/密钥不入库；
2. Java 业务代码不粘贴 AI 生成整段实现——可以让 AI 解释概念、review 你的代码，但键入是你自己；
3. 每阶段过了完成判据才进下一阶段；`npm run build` + `mvn test` 是前后端各自门禁；
4. 10.8 之前本文件只是纸面计划，主线（笔记系统 JWT/异常/AOP）优先级永远更高。
