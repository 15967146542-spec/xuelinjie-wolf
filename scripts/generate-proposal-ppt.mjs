import pptxgen from 'pptxgenjs'

const pptx = new pptxgen()
pptx.layout = 'LAYOUT_WIDE'
pptx.author = '学林街之狼项目组'
pptx.subject = '项目立项答辩'
pptx.title = '学林街之狼项目立项答辩'
pptx.company = '学林街之狼项目组'
pptx.lang = 'zh-CN'
pptx.theme = {
  headFontFace: 'Microsoft YaHei',
  bodyFontFace: 'Microsoft YaHei',
  lang: 'zh-CN'
}
pptx.defineLayout({ name: 'LAYOUT_WIDE', width: 13.333, height: 7.5 })
pptx.defineSlideMaster({
  title: 'MASTER',
  background: { color: 'F7F5EF' },
  objects: [
    { rect: { x: 0, y: 0, w: 13.333, h: 0.14, fill: { color: 'E05A33' }, line: { color: 'E05A33' } } },
    { rect: { x: 0.55, y: 6.92, w: 12.23, h: 0.01, fill: { color: 'C9C3B8' }, line: { color: 'C9C3B8' } } },
    { text: { text: '学林街之狼 | 项目立项答辩', options: { x: 0.55, y: 7.02, w: 5, h: 0.2, fontFace: 'Microsoft YaHei', fontSize: 8, color: '5E665E', margin: 0 } } },
    { text: { text: '校园教学评价与模拟投资激励平台', options: { x: 8.4, y: 7.02, w: 4.35, h: 0.2, fontFace: 'Microsoft YaHei', fontSize: 8, color: '5E665E', align: 'right', margin: 0 } } }
  ],
  slideNumber: { x: 12.75, y: 7.02, color: '5E665E', fontFace: 'Microsoft YaHei', fontSize: 8 }
})

const C = { ink: '19241F', muted: '5E665E', orange: 'E05A33', green: '1D6B57', cream: 'F7F5EF', sand: 'EDE8DC', white: 'FFFFFF', line: 'D7D0C4' }
const addText = (slide, text, x, y, w, h, options = {}) => slide.addText(text, {
  x, y, w, h, margin: 0, breakLine: false, fontFace: 'Microsoft YaHei', fontSize: 18, color: C.ink,
  fit: 'shrink', valign: 'mid', ...options
})
const title = (slide, kicker, heading, subheading = '') => {
  addText(slide, kicker.toUpperCase(), 0.65, 0.47, 3.4, 0.22, { fontSize: 9, bold: true, color: C.orange, charSpacing: 1.2 })
  addText(slide, heading, 0.65, 0.76, 11.9, 0.55, { fontSize: 28, bold: true, color: C.ink })
  if (subheading) addText(slide, subheading, 0.67, 1.42, 11.6, 0.32, { fontSize: 11.5, color: C.muted })
}
const card = (slide, x, y, w, h, heading, body, accent = C.green) => {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.06, fill: { color: C.white }, line: { color: C.line, width: 0.7 } })
  slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.08, h, fill: { color: accent }, line: { color: accent } })
  addText(slide, heading, x + 0.28, y + 0.25, w - 0.5, 0.28, { fontSize: 14, bold: true })
  addText(slide, body, x + 0.28, y + 0.68, w - 0.52, h - 0.9, { fontSize: 11.2, color: C.muted, breakLine: true, valign: 'top', bullet: { indent: 12 } })
}
const bulletLines = (lines) => lines.map((text) => ({ text, options: { bullet: { indent: 12 } } }))

{
  const slide = pptx.addSlide('MASTER')
  slide.background = { color: '1D2A24' }
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: '1D2A24' }, line: { color: '1D2A24' } })
  slide.addShape(pptx.ShapeType.arc, { x: 8.5, y: -1.1, w: 5.8, h: 5.8, adjustPoint: 0.3, line: { color: 'E05A33', width: 3, transparency: 20 }, adjustPoint: 0.6 })
  slide.addShape(pptx.ShapeType.arc, { x: 9.35, y: -0.25, w: 4.25, h: 4.25, adjustPoint: 0.3, line: { color: 'D9B44A', width: 1.5, transparency: 20 }, adjustPoint: 0.6 })
  addText(slide, 'PROJECT PROPOSAL', 0.72, 0.8, 3.5, 0.28, { fontSize: 12, bold: true, color: 'F0C46A', charSpacing: 2 })
  addText(slide, '学林街之狼', 0.68, 1.35, 7.2, 0.75, { fontSize: 40, bold: true, color: C.cream })
  addText(slide, '校园教学评价与模拟投资激励平台', 0.72, 2.28, 7.6, 0.38, { fontSize: 18, color: 'DCE5D9' })
  slide.addShape(pptx.ShapeType.line, { x: 0.72, y: 3.08, w: 2.15, h: 0, line: { color: C.orange, width: 2 } })
  addText(slide, '项目立项答辩', 0.72, 3.35, 2.2, 0.3, { fontSize: 14, color: 'DCE5D9' })
  addText(slide, '四人协作开发 | 前端原型项目', 0.72, 5.72, 4.7, 0.3, { fontSize: 12, color: 'BFCBBC' })
  addText(slide, '2026 年 9 月', 0.72, 6.12, 3, 0.25, { fontSize: 10, color: 'BFCBBC' })
}

{
  const slide = pptx.addSlide('MASTER')
  title(slide, '01 / Background', '项目背景与痛点', '让课程反馈从分散、滞后的信息，变成可理解、可参与的校园体验。')
  card(slide, 0.7, 2.05, 3.82, 3.85, '学生侧', bulletLines(['选课信息与学习反馈分散', '难以快速理解课程特点', '参与评价的动力不足']), C.orange)
  card(slide, 4.76, 2.05, 3.82, 3.85, '教师与管理侧', bulletLines(['评价反馈难以直观汇总', '缺少审核和处理入口', '教学趋势不易追踪']), C.green)
  card(slide, 8.82, 2.05, 3.82, 3.85, '项目切入点', bulletLines(['行情看板式信息组织', '任务与积分激励参与', '可视化展示评价变化']), 'D9A441')
}

{
  const slide = pptx.addSlide('MASTER')
  title(slide, '02 / Vision', '项目定位与目标', '以虚拟积分和模拟数据构建教学互动原型，不提供真实金融服务。')
  slide.addShape(pptx.ShapeType.roundRect, { x: 0.7, y: 2.05, w: 5.25, h: 3.85, rectRadius: 0.06, fill: { color: '21352C' }, line: { color: '21352C' } })
  addText(slide, '“评价可看见，参与有反馈”', 1.05, 2.52, 4.5, 0.7, { fontSize: 25, bold: true, color: C.cream, breakLine: true })
  addText(slide, '将课程评价、任务成长和模拟资产统一到一个可视化平台。', 1.05, 3.55, 4.3, 0.7, { fontSize: 13, color: 'DCE5D9', breakLine: true, valign: 'top' })
  card(slide, 6.28, 2.05, 2.0, 3.85, '目标一', bulletLines(['覆盖核心校园互动场景', '完成可演示原型']), C.orange)
  card(slide, 8.5, 2.05, 2.0, 3.85, '目标二', bulletLines(['统一状态与数据模型', '实现模块数据联动']), C.green)
  card(slide, 10.72, 2.05, 2.0, 3.85, '目标三', bulletLines(['预留 API 与权限边界', '支持持续迭代']), 'D9A441')
}

{
  const slide = pptx.addSlide('MASTER')
  title(slide, '03 / Scope', '核心功能范围', '围绕“浏览 - 参与 - 激励 - 管理”构建完整原型闭环。')
  const data = [
    ['行情与详情', '课程标的、评分、热度、K 线与评教趋势'],
    ['模拟交易', '买卖、持仓、手续费、仓位上限与 T+1'],
    ['评价与任务', '签到、匿名评教、审核状态、奖励发放'],
    ['排行榜与个人中心', '资产、权益、称号与参与成果'],
    ['管理端', '宏观因子、评教审核、收盘结算模拟']
  ]
  data.forEach(([head, body], index) => {
    const y = 1.98 + index * 0.88
    slide.addShape(pptx.ShapeType.ellipse, { x: 0.83, y: y + 0.12, w: 0.34, h: 0.34, fill: { color: index % 2 ? C.green : C.orange }, line: { color: index % 2 ? C.green : C.orange } })
    addText(slide, String(index + 1), 0.83, y + 0.15, 0.34, 0.18, { fontSize: 8.5, bold: true, color: C.white, align: 'center' })
    addText(slide, head, 1.38, y, 2.65, 0.45, { fontSize: 15, bold: true })
    addText(slide, body, 4.05, y + 0.04, 7.9, 0.34, { fontSize: 12, color: C.muted })
    slide.addShape(pptx.ShapeType.line, { x: 1.38, y: y + 0.62, w: 10.55, h: 0, line: { color: C.line, width: 0.6 } })
  })
}

{
  const slide = pptx.addSlide('MASTER')
  title(slide, '04 / Architecture', '技术方案与系统架构', '组件化页面、集中状态管理和 Mock 数据源，兼顾快速验证与后续扩展。')
  const boxes = [
    ['用户角色', '学生 / 管理员', 0.7, 2.75, 'E05A33'],
    ['Vue 页面', 'views + router', 3.25, 2.75, '1D6B57'],
    ['业务状态', 'Pinia stores', 5.8, 2.75, 'D9A441'],
    ['数据模型', 'types + mock', 8.35, 2.75, 'E05A33'],
    ['后续扩展', 'API / 权限 / 数据库', 10.9, 2.75, '1D6B57']
  ]
  boxes.forEach(([head, body, x, y, color]) => {
    slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 1.75, h: 1.32, rectRadius: 0.05, fill: { color: C.white }, line: { color, width: 1.1 } })
    addText(slide, head, x + 0.13, y + 0.26, 1.5, 0.25, { fontSize: 12.2, bold: true, align: 'center' })
    addText(slide, body, x + 0.13, y + 0.7, 1.5, 0.22, { fontSize: 9.3, color: C.muted, align: 'center' })
  })
  for (let index = 0; index < 4; index++) slide.addShape(pptx.ShapeType.chevron, { x: 2.63 + index * 2.55, y: 3.22, w: 0.38, h: 0.35, fill: { color: C.line }, line: { color: C.line } })
  addText(slide, '前端原型阶段：业务数据由 Pinia store 统一管理，刷新后恢复初始 Mock 数据。', 1.35, 5.2, 10.7, 0.35, { fontSize: 13, color: C.muted, align: 'center' })
}

{
  const slide = pptx.addSlide('MASTER')
  title(slide, '05 / Experience', '用户流程设计', '学生完成从发现课程到评价反馈的闭环，管理员保障内容质量。')
  const flow = [['浏览行情', '发现课程与热度'], ['查看详情', '了解评分与趋势'], ['模拟交易', '形成虚拟持仓'], ['签到评教', '提交匿名反馈'], ['领取奖励', '完成任务成长']]
  flow.forEach(([head, body], index) => {
    const x = 0.68 + index * 2.53
    slide.addShape(pptx.ShapeType.roundRect, { x, y: 2.35, w: 1.92, h: 1.6, rectRadius: 0.05, fill: { color: index % 2 ? 'E5EEE8' : 'FDE9E2' }, line: { color: index % 2 ? 'B8D0C4' : 'F0B5A2' } })
    addText(slide, `0${index + 1}`, x + 0.18, 2.62, 0.4, 0.22, { fontSize: 10, bold: true, color: index % 2 ? C.green : C.orange })
    addText(slide, head, x + 0.18, 3.0, 1.55, 0.28, { fontSize: 13, bold: true })
    addText(slide, body, x + 0.18, 3.44, 1.55, 0.26, { fontSize: 9.5, color: C.muted, align: 'left' })
    if (index < 4) slide.addShape(pptx.ShapeType.chevron, { x: x + 2.02, y: 2.97, w: 0.28, h: 0.32, fill: { color: C.line }, line: { color: C.line } })
  })
  card(slide, 2.35, 4.8, 8.65, 0.95, '管理闭环', '管理员审核评价、处理异常内容，并通过模拟结算展示数据变化。', C.green)
}

{
  const slide = pptx.addSlide('MASTER')
  title(slide, '06 / Team', '团队分工与协作机制', '按页面和业务状态边界分工，用 Git 分支与 Pull Request 进行协作。')
  const members = [
    ['成员 A', '行情与标的详情', 'Market / StockDetail / KLine'],
    ['成员 B', '模拟交易与个人资产', 'Trade / Profile / trade store'],
    ['成员 C', '评教、任务与排行榜', 'Evaluation / Task / Ranking'],
    ['成员 D', '管理端与项目集成', 'Admin / Router / Types / QA']
  ]
  members.forEach(([person, scope, files], index) => {
    const x = 0.7 + (index % 2) * 6.1
    const y = 2.05 + Math.floor(index / 2) * 1.85
    slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.53, h: 1.42, rectRadius: 0.05, fill: { color: C.white }, line: { color: C.line, width: 0.7 } })
    slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.28, y: y + 0.37, w: 0.68, h: 0.68, fill: { color: index % 2 ? C.green : C.orange }, line: { color: index % 2 ? C.green : C.orange } })
    addText(slide, String.fromCharCode(65 + index), x + 0.28, y + 0.58, 0.68, 0.18, { fontSize: 11, bold: true, color: C.white, align: 'center' })
    addText(slide, person, x + 1.18, y + 0.26, 1.0, 0.25, { fontSize: 13, bold: true })
    addText(slide, scope, x + 2.18, y + 0.26, 2.85, 0.25, { fontSize: 13, bold: true })
    addText(slide, files, x + 1.18, y + 0.76, 3.95, 0.22, { fontSize: 9.7, color: C.muted })
  })
  addText(slide, '协作规则：功能分支开发 -> 构建验证 -> Pull Request -> 至少一人审查 -> 合并 main', 1.0, 5.72, 11.2, 0.28, { fontSize: 12, color: C.muted, align: 'center' })
}

{
  const slide = pptx.addSlide('MASTER')
  title(slide, '07 / Plan', '实施计划与阶段交付', '建议周期为 6 周，每周都有清晰的可检查成果。')
  const phases = [
    ['第 1 周', '需求与设计', '需求清单、页面结构、分工表'],
    ['第 2-3 周', '核心开发', '行情、交易、评价、任务流程'],
    ['第 4 周', '管理与联调', '管理端、个人中心、全流程原型'],
    ['第 5 周', '测试与优化', '构建检查、规则测试、问题修复'],
    ['第 6 周', '交付与答辩', '文档、PPT、演示脚本与项目包']
  ]
  slide.addShape(pptx.ShapeType.line, { x: 1.05, y: 3.52, w: 11.18, h: 0, line: { color: C.line, width: 2 } })
  phases.forEach(([week, head, result], index) => {
    const x = 0.72 + index * 2.5
    slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.72, y: 3.17, w: 0.7, h: 0.7, fill: { color: index % 2 ? C.green : C.orange }, line: { color: index % 2 ? C.green : C.orange } })
    addText(slide, String(index + 1), x + 0.72, 3.39, 0.7, 0.18, { fontSize: 10, bold: true, color: C.white, align: 'center' })
    addText(slide, week, x, 2.22, 2.15, 0.27, { fontSize: 12, bold: true, color: index % 2 ? C.green : C.orange, align: 'center' })
    addText(slide, head, x, 2.62, 2.15, 0.3, { fontSize: 13, bold: true, align: 'center' })
    addText(slide, result, x, 4.18, 2.15, 0.55, { fontSize: 10, color: C.muted, align: 'center', breakLine: true, valign: 'top' })
  })
}

{
  const slide = pptx.addSlide('MASTER')
  title(slide, '08 / Governance', '风险、隐私与伦理控制', '将产品趣味性限制在教学场景内，把数据与评价治理作为前置条件。')
  card(slide, 0.7, 2.05, 3.82, 3.65, '数据与隐私', bulletLines(['原型仅使用虚构数据', '后续遵循最小化采集原则', '真实数据须脱敏并取得授权']), C.green)
  card(slide, 4.76, 2.05, 3.82, 3.65, '评价治理', bulletLines(['支持审核、驳回和降权', '防范攻击性与失实内容', '避免评价结果被不当传播']), C.orange)
  card(slide, 8.82, 2.05, 3.82, 3.65, '合规边界', bulletLines(['虚拟积分不具备货币属性', '不涉及交易、支付或收益承诺', '不提供投资建议']), 'D9A441')
}

{
  const slide = pptx.addSlide('MASTER')
  title(slide, '09 / Acceptance', '验收标准与预期成果', '以“能运行、可演示、可协作、可迭代”为本期交付标准。')
  const standards = [
    '可完成依赖安装、开发启动和生产构建',
    '八类核心页面均可正常访问与演示',
    '交易、审核、任务奖励等状态正确联动',
    '共享类型与 Pinia 状态管理支撑页面数据流',
    'README、立项书和答辩 PPT 完整可用'
  ]
  standards.forEach((item, index) => {
    const y = 2.0 + index * 0.7
    slide.addShape(pptx.ShapeType.ellipse, { x: 1.02, y: y + 0.03, w: 0.29, h: 0.29, fill: { color: C.green }, line: { color: C.green } })
    addText(slide, '✓', 1.02, y + 0.08, 0.29, 0.15, { fontSize: 9, bold: true, color: C.white, align: 'center' })
    addText(slide, item, 1.65, y, 8.5, 0.33, { fontSize: 14 })
  })
  slide.addShape(pptx.ShapeType.roundRect, { x: 9.8, y: 2.02, w: 2.5, h: 3.58, rectRadius: 0.05, fill: { color: '21352C' }, line: { color: '21352C' } })
  addText(slide, '预期成果', 10.08, 2.35, 1.9, 0.3, { fontSize: 16, bold: true, color: C.cream, align: 'center' })
  addText(slide, '可运行前端原型\n\n源码仓库与协作规范\n\n立项书与答辩材料\n\n后续迭代路线', 10.15, 3.0, 1.78, 1.9, { fontSize: 11.5, color: 'DCE5D9', align: 'center', breakLine: true, valign: 'mid' })
}

{
  const slide = pptx.addSlide('MASTER')
  slide.background = { color: '1D2A24' }
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: '1D2A24' }, line: { color: '1D2A24' } })
  slide.addShape(pptx.ShapeType.arc, { x: -1.2, y: 3.7, w: 4.8, h: 4.8, adjustPoint: 0.3, line: { color: 'E05A33', width: 2, transparency: 20 }, adjustPoint: 0.6 })
  addText(slide, 'THANK YOU', 0.72, 1.38, 3, 0.28, { fontSize: 12, bold: true, color: 'F0C46A', charSpacing: 2 })
  addText(slide, '谢谢聆听', 0.68, 1.92, 5, 0.7, { fontSize: 37, bold: true, color: C.cream })
  addText(slide, '以数据化反馈连接学习、教学与参与。', 0.72, 2.9, 6.2, 0.35, { fontSize: 16, color: 'DCE5D9' })
  addText(slide, '学林街之狼项目组', 0.72, 5.98, 3.8, 0.28, { fontSize: 12, color: 'BFCBBC' })
}

await pptx.writeFile({ fileName: '学林街之狼项目立项答辩PPT.pptx' })
