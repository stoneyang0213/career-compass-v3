# Career Compass v3 · Spec(任务拆解 + 文件级实施计划)

**主导专家**: PM + ARCHITECT + CODE
**Super Dev 阶段**: spec
**关联文档**: [research](./career-compass-v3-research.md) / [prd](./career-compass-v3-prd.md) / [architecture](./career-compass-v3-architecture.md) / [uiux](./career-compass-v3-uiux.md)

---

## 微观决策(spec 阶段替 stoneyang 拍板,避免来回问)

| 决策 | 选择 | 理由 |
|---|---|---|
| 包管理 | **npm** | 与 v2 一致;CF Pages build 无差别;不引入新工具 |
| Tailwind 版本 | **v3.4.x**(锁版本) | v4 是新出的有 breaking changes;MVP 不冒险 |
| Astro 版本 | **6.1.x**(锁) | v2 用 6.x,baseline 兼容 |
| React 版本 | **18.x** | Astro 6.x 推荐,生态稳 |
| TypeScript | **strict: true** | 所有新代码 strict mode |
| Node 版本 | **20 LTS** | CF Pages 默认 |
| Lockfile | 提交 `package-lock.json` | CF Pages build 依赖 |

---

## 任务拆解(共 20 张任务卡)

### Phase 1 — Scaffold(脚手架) · 预计 1.5 小时

#### T01 · 创建 GitHub repo

| 项 | 值 |
|---|---|
| 输入 | 无 |
| 输出 | `stoneyang0213/career-compass-v3` 公开 repo,带 README + LICENSE(MIT) + .gitignore |
| 验收 | `git clone https://github.com/stoneyang0213/career-compass-v3.git` 能拉下来 |
| 操作 | 浏览器 GitHub 网页 New repository,或 `gh repo create stoneyang0213/career-compass-v3 --public --description "你的 AI 时代职业罗盘 · MVP" --license MIT --gitignore Node` |
| 时长 | 5 分钟 |
| 谁做 | **stoneyang 手动**(GitHub UI 或 gh cli) |

#### T02 · 本地 git init + 拉 baseline

| 项 | 值 |
|---|---|
| 输入 | T01 完成 |
| 输出 | `D:\projects\career-compass-v3` 已 git init,first commit 含 `output/` 4 文档 + `baseline_from_v2/` |
| 验收 | `git log --oneline` 至少 1 笔 commit;`git remote -v` 指向 T01 repo |
| 操作 | `cd D:\projects\career-compass-v3 && git init && git remote add origin <T01 repo url> && git add output/ baseline_from_v2/ .super-dev/ CLAUDE.md && git commit -m "docs: v3 三文档 + 4 决策落地 + super-dev 接入"` |
| 时长 | 5 分钟 |
| 谁做 | Claude 帮跑 |

#### T03 · Astro 项目初始化

| 项 | 值 |
|---|---|
| 输入 | T02 完成 |
| 输出 | `package.json` / `astro.config.mjs` / `tsconfig.json` / `src/` 骨架(Astro 6.x + minimal template) |
| 验收 | `npm install && npm run dev` 启动,localhost:4321 显示 Astro 默认欢迎页 |
| 操作 | `npm create astro@6 -- --template minimal --typescript strict --no-git --yes`,然后改 package.json 版本锁 |
| 时长 | 10 分钟 |
| 谁做 | Claude 帮跑 |
| 依赖锁定 | `"astro": "^6.1.0"` |

#### T04 · 装依赖:React + Tailwind v3 + Lucide + CF adapter

| 项 | 值 |
|---|---|
| 输入 | T03 完成 |
| 输出 | `package.json` 含全部依赖;`tailwind.config.ts` + `postcss.config.cjs` 配好;`src/styles/globals.css` 含 `@tailwind base/components/utilities` |
| 验收 | `npm run dev`,在 index.astro 写 `<div class="text-blue-500">hi</div>` 显示蓝色;`import { Compass } from 'lucide-react'` 不报错 |
| 操作 | `npx astro add react tailwind cloudflare` + `npm i lucide-react@latest`,然后改 tailwind.config.ts 指定 content paths 与 brand 色变量 |
| 时长 | 15 分钟 |
| 谁做 | Claude 帮跑 |
| 依赖锁定 | `"tailwindcss": "^3.4.0"`、`"@astrojs/cloudflare": "^11.x"`(适配 Astro 6.x)、`"lucide-react": "^0.4xx.x"` |

#### T05 · 写 design tokens(CSS variables 落到 globals.css)

| 项 | 值 |
|---|---|
| 输入 | UIUX 文档 §设计 Token、T04 完成 |
| 输出 | `src/styles/globals.css` 含完整 `:root { --color-* / --shadow-* / --font-* }`;`tailwind.config.ts` 扩展 colors / fontFamily 引用 CSS variables |
| 验收 | 在 index.astro 写 `<div class="bg-brand text-text-primary">hi</div>` 渲染出罗盘蓝背景 + 主文字色 |
| 时长 | 15 分钟 |
| 谁做 | Claude 帮跑 |

---

### Phase 2 — 数据迁移 · 预计 30 分钟

#### T06 · 把 baseline 数据搬进 src/

| 项 | 值 |
|---|---|
| 输入 | `baseline_from_v2/questions/*.json` + `industry_data/industry_trends.json` |
| 输出 | `src/data/questions/{holland,mbti,values}.json`(直接 cp)+ `src/data/industry_trends.json`(直接 cp) |
| 验收 | `import holland from "../data/questions/holland.json"` 能拿到题目数组 |
| 时长 | 5 分钟 |
| 谁做 | Claude 帮跑 |

#### T07 · 把 v2 prompt 搬进 src/lib + 适配 v3 接口

| 项 | 值 |
|---|---|
| 输入 | `baseline_from_v2/prompts/prompt.ts`(主报告)+ `prompt-interlude.ts`(章节过渡) |
| 输出 | `src/lib/prompt.ts` + `src/lib/prompt-interlude.ts`(改 import 路径,其余完整保留) |
| 验收 | `import { buildReportPrompt } from "./lib/prompt"` 不报错;TypeScript strict mode 下无错 |
| 时长 | 15 分钟 |
| 谁做 | Claude 帮跑 |
| 备注 | `prompt-preview.ts`(试吃报告)MVP 不要,不搬 |

#### T08 · 写 types.ts 统一类型

| 项 | 值 |
|---|---|
| 输入 | architecture §API 契约、v2 的 `Dimensions` 类型 |
| 输出 | `src/lib/types.ts` 含 `Answers / Profile / Dimensions / Scores / ReportChunk` 等共享类型 |
| 验收 | TypeScript strict 下 prompt.ts / scoring.ts / generate.ts 都能 import 同一份 types |
| 时长 | 10 分钟 |
| 谁做 | Claude 帮跑 |

---

### Phase 3 — 静态 UI 骨架 · 预计 2 小时

#### T09 · 写 src/components/ 通用组件

| 项 | 值 |
|---|---|
| 输入 | UIUX §组件清单、design tokens |
| 输出 | `Nav.astro` / `Logo.astro` / `Button.astro` / `ProgressDots.astro` / `IconButton.astro` |
| 验收 | 每个组件支持 props,Storybook 不需要;插到 index.astro 视觉与 UIUX mockup 一致 |
| 时长 | 30 分钟 |
| 谁做 | Claude 帮跑 |
| 强约束 | 每个组件的图标只能用 Lucide React;**不许 emoji** |

#### T10 · 首页 index.astro

| 项 | 值 |
|---|---|
| 输入 | UIUX §首页骨架、T09 通用组件 |
| 输出 | `src/pages/index.astro`:罗盘 logo + 顶部 Nav + Hero "你的 AI 时代职业罗盘" + 副标题 + CTA + 信任三件套 + 3 张价值卡(Compass/Sparkles/Target) |
| 验收 | 浏览器打开 / 渲染与 UIUX mockup §1 视觉一致;移动端响应式正常 |
| 时长 | 30 分钟 |
| 谁做 | Claude 帮跑 |

#### T11 · 章节布局 src/pages/assess/chapter/[n].astro

| 项 | 值 |
|---|---|
| 输入 | UIUX §测评章节骨架、T09 ProgressDots |
| 输出 | `src/pages/assess/chapter/[n].astro` 动态路由,根据 n 渲染章 1-5;含进度点 + 章标题副标 + 题目容器 + 上一章/下一章 |
| 验收 | 访问 `/assess/chapter/1` 到 `/assess/chapter/5` 都能正确渲染章节框架 |
| 时长 | 30 分钟 |
| 谁做 | Claude 帮跑 |
| 备注 | 章 5 与 1-4 形态不同(纯表单 vs 选择题),用 `frameworks` 字段判断渲染分支 |

#### T12 · 报告页骨架 src/pages/report.astro

| 项 | 值 |
|---|---|
| 输入 | UIUX §报告页 streaming 设计 |
| 输出 | `src/pages/report.astro`:H1 + 用户分类摘要 + 报告元信息 + ReportStream 岛屿插槽 + 底部按钮区 |
| 验收 | 访问 `/report` 显示骨架(stream 内容由 T18 实现) |
| 时长 | 20 分钟 |
| 谁做 | Claude 帮跑 |

---

### Phase 4 — 测评交互(React 岛屿) · 预计 3 小时

#### T13 · localStorage 封装 src/lib/store.ts

| 项 | 值 |
|---|---|
| 输入 | architecture §数据流、types.ts |
| 输出 | `src/lib/store.ts` 暴露 `loadProgress / saveProgress / clearProgress / loadReport / saveReport`,带 7 天 TTL |
| 验收 | 单元测试(可选)/ 在浏览器 console 调用通过 |
| 时长 | 20 分钟 |
| 谁做 | Claude 帮跑 |

#### T14 · Likert 量表组件 QuestionLikert.tsx

| 项 | 值 |
|---|---|
| 输入 | holland.json / values.json 数据格式、T13 store |
| 输出 | `src/components/QuestionLikert.tsx` React 岛屿,props: `{ chapter, questions, onComplete }`,5 选项,选中 brand-light bg + radio 填实心,onChange 自动 store.save |
| 验收 | 在 chapter/2 渲染 Holland 题目,点选项 → localStorage 写入 → 刷新页面进度恢复 |
| 时长 | 40 分钟 |
| 谁做 | Claude 帮跑 |

#### T15 · MBTI 二选一组件 QuestionMBTI.tsx

| 项 | 值 |
|---|---|
| 输入 | mbti.json 数据格式、T13 store |
| 输出 | `src/components/QuestionMBTI.tsx`,左右两列卡片,选中态明显 |
| 验收 | 在 chapter/1 渲染 MBTI 题,点选项 → 状态保存;答完 12 题进度条满 |
| 时长 | 30 分钟 |
| 谁做 | Claude 帮跑 |

#### T16 · 章 5 三块表单 Chapter5Form.tsx

| 项 | 值 |
|---|---|
| 输入 | UIUX §章 4 basic + UIUX §章 5 dimensions、T13 store |
| 输出 | `src/components/Chapter5Form.tsx` 含三块:basic(年龄 / 教育阶段 / 工作地)+ context(可选补充 300 字)+ dimensions(择己所爱/所长/所利 3 题,**Lucide icon: Heart/Dumbbell/Wallet**,字数下限 50 each) |
| 验收 | 字数 < 50 的题"完成测评"按钮 disabled + 红字提示;全部 ≥ 50 后按钮激活;**全程不出现 emoji** |
| 时长 | 50 分钟 |
| 谁做 | Claude 帮跑 |

#### T17 · 计分逻辑 src/lib/scoring.ts

| 项 | 值 |
|---|---|
| 输入 | types.ts + v2 baseline_from_v2 里没有独立 scoring.ts(v2 在 [id].astro 内联),需要从 v2 提取 |
| 输出 | `src/lib/scoring.ts` 含 `scoreAnswers(answers): Scores` 纯函数,返回 `{ hollandCode, mbtiType, valuesTop3 }` |
| 验收 | 单元测试(用 baseline_from_v2/bench_results/kelly_real_assessment 的 input,预期输出 hollandCode="ARS" + mbtiType="INFP") |
| 时长 | 40 分钟 |
| 谁做 | Claude 帮跑 |

---

### Phase 5 — LLM streaming(CF Pages Functions) · 预计 2 小时

#### T18 · functions/api/generate.ts(SSE 流式转发)

| 项 | 值 |
|---|---|
| 输入 | architecture §API 契约、T07 prompt.ts、T17 scoring.ts |
| 输出 | `functions/api/generate.ts` Pages Function:接收 POST 答题数据 → 计分 → buildPrompt → fetch SiliconFlow `stream:true` → 把 SSE 直接 forward 给浏览器 |
| 验收 | 本地 `wrangler pages dev` curl POST 测试返回 SSE 流;cf-pages-functions log 无报错 |
| 时长 | 50 分钟 |
| 谁做 | Claude 帮跑 |
| 强约束 | env vars: `SILICONFLOW_API_KEY` / `LLM_MODEL_PRIMARY` / `LLM_MODEL_FALLBACK`,通过 `ctx.env.X` 访问,**绝不硬编码** |

#### T19 · LLM 调用封装 src/lib/llm.ts(fallback 逻辑)

| 项 | 值 |
|---|---|
| 输入 | architecture §LLM 调用方式 |
| 输出 | `src/lib/llm.ts` 暴露 `streamReportWithFallback(messages, env)`,主调 GLM-5.1,5s 无第一 chunk 切 Kimi-K2.6 |
| 验收 | 单元测试 mock SiliconFlow,验证 fallback 触发逻辑 |
| 时长 | 30 分钟 |
| 谁做 | Claude 帮跑 |

#### T20 · ReportStream.tsx(浏览器侧 SSE 接收 + markdown 渲染)

| 项 | 值 |
|---|---|
| 输入 | architecture §数据流、T12 报告页骨架 |
| 输出 | `src/components/ReportStream.tsx` React 岛屿:`useEffect` 发 POST,逐 chunk 追加到 state;用 `react-markdown` + `remark-gfm` 实时渲染;末尾 blinking cursor `▌`;`done` 事件后显示"复制全文 / 打印 PDF"按钮 |
| 验收 | 章 5 提交后 / report 页 5s 内出第一段文字;末尾报告 5000+ 中文字;"复制全文"按钮 clipboard 可用 |
| 时长 | 40 分钟 |
| 谁做 | Claude 帮跑 |
| 依赖 | `react-markdown` + `remark-gfm` + `react-copy-to-clipboard` |

---

### Phase 6 — 集成 + 部署 · 预计 1.5 小时

#### T21 · 本地端到端跑通(`.dev.vars`)

| 项 | 值 |
|---|---|
| 输入 | T01-T20 全部完成、`.dev.vars` 内含 `SILICONFLOW_API_KEY=sk-hezwc...` |
| 输出 | `wrangler pages dev .` 启动,浏览器走完整测评 → 报告页 stream 5000+ 字 |
| 验收 | **PRD §验收标准 8 条全过**(本地版本)|
| 时长 | 30 分钟 |
| 谁做 | stoneyang + Claude 联调 |

#### T22 · CF Pages 项目创建 + GitHub 自动 deploy

| 项 | 值 |
|---|---|
| 输入 | T21 通过 + GitHub push 到 main |
| 输出 | CF dashboard 新建 Pages project 连 `career-compass-v3` repo;build command `npm run build`;output `dist`;env vars 配三个 secret |
| 验收 | git push 后 CF Pages 自动 build + deploy 成功;生产 URL `career-compass-v3.pages.dev` 可访问 |
| 时长 | 20 分钟 |
| 谁做 | stoneyang 手动(CF dashboard)|

#### T23 · 生产 URL 验收

| 项 | 值 |
|---|---|
| 输入 | T22 上线 |
| 输出 | stoneyang 本人 + 至少 2 个朋友走完一次完整测评 |
| 验收 | **PRD §验收标准 8 条全过**(生产版本)+ 3 个真实用户拿到报告 + 主观评分 ≥ 7/10 |
| 时长 | 取决于朋友配合速度 |
| 谁做 | stoneyang |

---

## 时长汇总

| Phase | 任务 | 预计 |
|---|---|---|
| 1 Scaffold | T01-T05 | 1.5h |
| 2 数据迁移 | T06-T08 | 0.5h |
| 3 静态 UI | T09-T12 | 2h |
| 4 测评交互 | T13-T17 | 3h |
| 5 LLM streaming | T18-T20 | 2h |
| 6 集成部署 | T21-T23 | 1.5h |
| **合计** | | **~10.5 小时**(Claude 主跑,stoneyang 在 T01/T22/T23 主导) |

按一天工作 4-6 小时算,**2-3 天 MVP 上线**。

---

## 关键风险点(预先标识)

| 风险 | 触发条件 | 应对 |
|---|---|---|
| SiliconFlow GLM-5.1 model id 不正确 | T18 第一次 POST 返回 404 | T18 开工前先 curl SiliconFlow `/v1/models` 列表确认 |
| Astro 6.x cloudflare adapter 三处 breaking change | v2 commit `1580b68` 已踩过 | 直接抄 v2 已修好的 astro.config.mjs(memory: 锁版本) |
| CF Pages env vars 没生效 | 部署后 stream 显示 401 | dashboard 检查 Production / Preview 都加上 secrets |
| react-markdown stream 渲染卡顿 | 报告写到 3000+ 字时 React re-render 慢 | 用 `useDeferredValue` 或分段 batch 更新 |
| GLM-5.1 stream 中文乱码 | TextDecoder 默认 utf-8 但 chunk 切到 utf-8 字符中间 | 用 `TextDecoder("utf-8", { stream: true })` |

---

## Spec 质量评分自检(Super Dev 标准)

| 维度 | 评分 | 备注 |
|---|---|---|
| 任务粒度可执行 | 9/10 | 每个任务都有具体输入输出和验收 |
| 依赖关系清晰 | 9/10 | Phase 1-6 顺序明确,Phase 内可乱序 |
| 风险预识别 | 8/10 | 5 个关键风险已列 |
| 时长估算 | 7/10 | 基于 v2 类似工作量推算,可能偏乐观 20% |
| 验收标准可测 | 9/10 | PRD 8 条 + 每任务单独验收 |
| **综合** | **8.4/10** | 可进入实施阶段 |

---

**下一阶段**: frontend(T01-T05 Scaffold + T09-T12 静态 UI 骨架优先)。按 super-dev SKILL 协议,Spec 落盘后**不需要再开一次确认门**,直接进 frontend 阶段。
