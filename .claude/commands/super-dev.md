# /super-dev (claude-code)

在当前项目触发 Super Dev 的流水线式开发编排。

## 输入
- 需求描述: `$ARGUMENTS`
- 如果未提供参数，先要求用户补全需求后再执行。

## Super Dev Runtime Contract
- Super Dev 是当前项目里的本地 Python 工具 + 宿主规则/Skill 协议，不是独立模型平台。
- 宿主负责推理、联网、编码、运行终端与修改文件。
- 当用户触发 `/super-dev` 时，你要把它视为“进入 Super Dev 流水线”，而不是普通聊天命令。
- 需要生成文档、Spec、质量报告、交付产物时，优先调用本地 `super-dev` CLI。
- 需要研究、设计、编码、运行、修复时，优先使用宿主自身的 browse/search/terminal/edit 能力。

## Local Knowledge Contract
- 优先读取当前项目 `knowledge/` 目录里与需求相关的知识文件。
- 若存在 `output/knowledge-cache/*-knowledge-bundle.json`，必须读取其中命中的 `local_knowledge`、`web_knowledge` 与 `research_summary`。
- 本地知识命中的规范、检查清单、反模式、场景包默认是当前项目的硬约束，后续三文档、Spec 与实现都要继承。

## 首轮响应契约（首次触发必须执行）
- 当用户通过宿主支持的 Super Dev 入口触发（例如 `/super-dev ...`、`$super-dev`、`super-dev: ...`、`super-dev：...`、`/super-dev-seeai ...`、`$super-dev-seeai`、`super-dev-seeai: ...` 或 `super-dev-seeai：...`）后，第一轮回复必须明确：已进入对应的 Super Dev 流水线，而不是普通聊天。
- 如果仓库里已经存在 `super-dev.yaml`、`.super-dev/WORKFLOW.md`、`output/*`、`.super-dev/review-state/*` 或未完成的 run state，新会话里的第一次自然语言需求也必须默认继续 Super Dev 流程，而不是退回普通聊天。
- 第一轮回复前，优先读取 `.super-dev/WORKFLOW.md` 与 `output/*-bootstrap.md`（若存在），把其中的初始化契约视为当前仓库的显式 bootstrap 规则。
- 第一轮回复必须明确当前阶段是 `research`，会先读取 `knowledge/` 与 `output/knowledge-cache/*-knowledge-bundle.json`（若存在），再用宿主原生联网研究同类产品。
- 标准模式的后续顺序是：research -> 三份核心文档 -> 等待用户确认 -> Spec / tasks -> 前端优先并运行验证 -> 后端 / 测试 / 交付。
- SEEAI 模式的后续顺序是：research -> 比赛短版三文档 -> 等待用户确认 -> compact Spec -> full-stack sprint -> polish / handoff。
- 两种模式都必须明确承诺：三份核心文档完成后会暂停并等待用户确认；未经确认不会创建 Spec，也不会开始编码。

## 强制执行顺序（不可跳步）
1. 先使用宿主原生联网 / browse / search 能力研究同类产品，并先产出：
   - `output/*-research.md`
   - 至少包含 3-5 个对标产品、共性功能、关键流程、信息架构、交互模式、差异化方向
2. 再生成三份核心文档，再进入编码阶段：
   - `output/*-prd.md`
   - `output/*-architecture.md`
   - `output/*-uiux.md`
3. 三份核心文档完成后，必须先暂停并向用户汇报文档路径、摘要与待确认事项；未经用户明确确认，不得进入 Spec 或编码。
4. 用户确认后，再创建 Spec 变更与任务清单：
   - `.super-dev/changes/*/proposal.md`
   - `.super-dev/changes/*/tasks.md`
5. 先按 `tasks.md` 实现并运行前端，确保前端可演示、可审查、无明显错误。
6. 再实现后端、联调、测试、质量门禁与可审计交付清单。

## 宿主执行方式（优先）
- `/super-dev` 触发后，直接留在宿主里继续当前流程，不要把正常开发再转发成 `super-dev pipeline`。
- 需要恢复时，优先使用 `/super-dev-run resume` 或等价的非 slash 文本入口。
- 只有安装、升级、卸载或宿主注入故障时，才回终端运行 `super-dev`、`super-dev update`、`super-dev uninstall`。

## 实现阶段要求
- 如果宿主具备联网能力，必须优先在宿主中完成同类产品研究，不能跳过 research 阶段直接编码。
- 研究结论必须回填到 `output/*-research.md`，并用于约束 PRD / 架构 / UIUX。
- 编码前必须先读取 `output/*-prd.md`、`output/*-architecture.md`、`output/*-uiux.md`，并完成用户确认门。
- 如果用户要求修改文档，只允许回到文档阶段修订，不能绕过确认门直接建 Spec 或开工。
- UI 必须遵循 UI/UX 文档，禁止直接输出模板化、同质化页面。
- 默认避免宿主自动滑向“AI 感”设计：紫/粉渐变主视觉、emoji 充当功能图标、默认系统字体直出；只有用户或品牌明确要求时才可采用，并写清理由。
- 开始任何 UI 实现前，必须先声明图标库；功能图标只能来自 Lucide / Heroicons / Tabler / 官方组件图标。
- 非对话式 AI 产品默认避免复刻 Claude / ChatGPT 式侧栏聊天壳层、窄中栏对话布局和同款中性色配色；若业务确实需要则必须写明适配理由。
- 编码前必须先明确视觉方向、字体系统、颜色 token、间距 token、栅格系统、组件状态矩阵。
- 页面必须提供可访问交互：可见 `focus` 态、合理 hover/active、兼容 reduced-motion。
- 严禁在三文档与 Spec 缺失时直接宣称“已完成”。

## 汇报格式（每次回复都要包含）
- 当前阶段（文档 / Spec / 实现 / 质量 / 交付）
- 本次变更文件路径
- 下一步动作

## 说明
- 宿主负责调用自身模型、工具与实际编码；Super Dev 只提供治理协议。
- Super Dev 不提供模型能力；编码能力来自当前宿主。
- 在宿主会话中执行本流程，确保上下文连续与结果可审计。

## Super Dev System Flow Contract
- SUPER_DEV_FLOW_CONTRACT_V1
- PHASE_CHAIN: research>docs>docs_confirm>spec>frontend>preview_confirm>backend>quality>delivery
- DOC_CONFIRM_GATE: required
- PREVIEW_CONFIRM_GATE: required
- HOST_PARITY: required
