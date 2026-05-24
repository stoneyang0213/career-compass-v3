# Career Compass v3 · 下次开工 bootstrap

**最近一次收工**: 2026-05-24 晚(单日推进密度极高)

## 一句话状态

**v3 走完 super-dev [1-5/9] + T01-T18 全部完成**,Astro build 通过 6 个静态页 + `/api/generate` server route。**只差 T19 fallback + T20 ReportStream + T21-T23 端到端 deploy**,大概 3-4 小时 MVP 上线。

🟢 全部 5 章 UI 可走通(浏览器实测)
🟢 `/api/generate` server route 已写,buildPrompt+GLM-5.1+SiliconFlow 链路接通,**未在浏览器实跑过**
🟡 `.dev.vars` 已写本地(挡远端);GitHub 已 push 到 commit `e0d6bf1+`
🔵 T19 ReportStream / T20 fallback / T21-T23 deploy 待跑

## 今天做了什么(2026-05-24)

### 上午
- `/codebase-to-course super-dev` → super-dev 拆课程 6 模块,193KB HTML(`D:\projects\super-dev-course\`)
- `uv tool install super-dev` 装好 2.4.0

### 下午
- v3 设计:**variant 工作模式 + scope 精简**
  - 拍板 3 决策:新建空目录 / 保留 v2 prompt+题库+bench / MVP 验证型
  - 走完 super-dev [1-4/9] research → docs → docs_confirm → spec
  - 4 个开放问题拍完:GitHub 单建 / 罗盘蓝 / hero 产品名锚定 / 章 5 dimensions 全保留
- T01-T04 Scaffold:GitHub repo + git init + push + Astro 6.3.7 + 通用组件
- **敏感数据审计**:`bench_results/stoneyang_v2_real/` + `kelly_real_assessment/` 含 PII,从 commit 移除 + .gitignore 永久挡

### 晚
- T05-T08 数据迁移:`src/data/questions/*.json` + `industry_trends.json` + `src/lib/{scoring,prompt,prompt-interlude,chapters,types,store}.ts`
- T09-T12 测评章节交互:`chapter/[n].astro` 动态路由 + `QuestionLikert.tsx`(三 framework 共用)
- T16 `Chapter5Form.tsx`:basic + context + dimensions 三段单页表单(emoji→Lucide React)
- T18 `/api/generate` Astro API Route:接 SiliconFlow GLM-5.1 stream,在头部注入 meta 事件(model + scores)
- 装 `@cloudflare/workers-types` 解 `cloudflare:workers` 类型识别问题

### 关键事实落地
- **GLM-5.1 在 SiliconFlow 的真实 model id = `Pro/zai-org/GLM-5.1`**(curl /v1/models 实查)
- **Kimi-K2.6 = `Pro/moonshotai/Kimi-K2.6`**(备选)
- **v2 实际用 Astro API Routes(`src/pages/api/*.ts`)而非裸 CF Pages Functions**(`functions/api/`)— v3 已矫正
- **v2 MBTI 实际是 Likert 5 分量表不是二选一** — v3 用同一个 QuestionLikert 组件处理 mbti/holland/values

### 在 docs_confirm 门被 stoneyang 抓到一次编造数字
- 我说"章 5 dimensions +1500 字"——bench 无对照组,编造。已修正 PRD 为定性描述。
- **memory:`feedback_code_fact_source_of_truth.md` 立规生效中**(版本号/默认值/数字必须 Read 源)

## 下次开工:从这里继续

### 立刻可做的 3 件事(顺序 / 并行均可)

#### 1️⃣ samples/ 4 张 PNG 决策(2 分钟,stoneyang 待办)

`baseline_from_v2/samples/` 4 张 PNG 文件管理器双击点开看:
- 中性 UI 截图 → "samples 保留" → Claude 加回 commit
- 含真实测评数据 → "samples 也删" → 保持现状(本地留,远端永挡)

#### 2️⃣ T19 ReportStream + LLM fallback(预计 1 小时)

写 `src/components/ReportStream.tsx` React 岛屿:
- mount 时 POST `/api/generate` 带完整 profile(从 store.load() 取)
- 用 fetch + ReadableStream 接 SSE,逐 chunk 解析:
  - `event:"meta"` → 设置摘要 state(用户分类 / model / scores)
  - `data: {choices:[{delta:{content:"..."}}]}` (OpenAI 格式)→ 追加到 reportText
  - `data: [DONE]` → 结束 stream
- 用 `react-markdown` + `remark-gfm` 实时渲染 reportText
- 末尾闪烁光标 `▌`
- 完成后显示"复制全文 / 打印为 PDF"按钮

写 `src/pages/report.astro`:
- 用 `<ReportStream client:load />` 替换原占位

可选:`src/lib/llm.ts` fallback 逻辑(GLM-5.1 5s 无第一 token → 切 Kimi-K2.6)— **T19 第一版可以先跳过,等真跑出问题再加**。

#### 3️⃣ T21-T23 端到端验证 + 部署(预计 1.5 小时)

**T21 本地端到端**:
```bash
cd D:\projects\career-compass-v3
npx wrangler pages dev . --compatibility-date=2024-09-23
# 注:不要 npm run dev,wrangler pages dev 才会读 .dev.vars 的 secrets
# 浏览器走 http://localhost:8788 完整测评 → /report 看 stream
```

**T22 CF Pages 部署**:
- 浏览器 https://dash.cloudflare.com → Workers & Pages → Create application → Pages → Connect to Git
- 选 `stoneyang0213/career-compass-v3` repo
- Build settings: `npm run build` / output `dist`
- Env vars(3 个,生产):
  - `SILICONFLOW_API_KEY` = `sk-hezwc...`(从本地 .dev.vars 复制)
  - `LLM_MODEL_PRIMARY` = `Pro/zai-org/GLM-5.1`
  - `LLM_MODEL_FALLBACK` = `Pro/moonshotai/Kimi-K2.6`
- Save and Deploy

**T23 生产验收**:8 条 checklist(见 PRD `output/career-compass-v3-prd.md` §验收标准)

## 关键路径速查

### 项目
- 路径:`D:\projects\career-compass-v3`
- 当前分支:`main`,最新 commit `e0d6bf1+`(T18 落地后还没 commit)
- GitHub:https://github.com/stoneyang0213/career-compass-v3
- 还没建 CF Pages 项目(T22 时建)

### 启动命令
```bash
cd D:\projects\career-compass-v3
npm run dev               # 浏览器开 http://localhost:4321/   (静态部分能看,但 /api/generate 不会读 .dev.vars)
npx wrangler pages dev .  # 推荐,完整 CF Pages 模拟,读 .dev.vars,http://localhost:8788
npm run build             # 生产构建,生成 dist/
```

### 锁定的版本(全部沿用 v2 已验证)
- Node 22.22.1 / npm 11.9.0
- Astro 6.3.7
- React 19.2.5 + Tailwind v4.2.4
- @astrojs/cloudflare 13.2.2 + wrangler 4.86+
- @cloudflare/workers-types 4.20260524.1(新装)
- lucide-react 0.469+ + react-markdown 9.0.1 + remark-gfm 4.0.0

### 锁定的产品决策
- GitHub:单建 repo
- brand:罗盘蓝 #2D5F8B + 赭石 #C97A4A(accent)
- hero:"你的 AI 时代职业罗盘"
- 章 5:dimensions 3 题全保留(Heart/Dumbbell/Wallet icon)
- LLM:**SiliconFlow `Pro/zai-org/GLM-5.1` 主 / `Pro/moonshotai/Kimi-K2.6` 备**
- 部署:CF Pages auto-deploy(git push 触发,不走 wrangler login)
- 状态:localStorage only

### 已配凭据
- 本地 `.dev.vars` 含 SILICONFLOW_API_KEY + LLM_MODEL_PRIMARY + LLM_MODEL_FALLBACK(挡在 .gitignore)
- 生产:待 T22 在 CF Pages dashboard 配同样 3 个 env vars

## 不要重复踩的坑

- **Windows + 系统代理下 curl localhost = 502** → 加 `--noproxy '*'` 或绕过命令行直接浏览器测
- **wrangler login OAuth + Windows 系统代理 = callback timeout** → v3 走 git push auto-deploy 完全绕开
- **tsconfig "**/*" 把 baseline_from_v2 拉进 tsc 编译** → 已 exclude
- **首次启动 Astro dev server 30s+**(Vite optimize deps)→ 第二次启动 4s 内
- **`cloudflare:workers` 模块 ts 找不到** → 已装 @cloudflare/workers-types + tsconfig types 加上
- **基础事实必须 Read source-of-truth** → version 号、SiliconFlow model id 都 curl 实查过(`Pro/zai-org/GLM-5.1`)
- **不要编造 bench 数字** — "+1500 字"是编造的,已修正 PRD
- **v2 是 Astro API Routes 不是裸 CF Functions** → v3 已矫正为 `src/pages/api/`

## 一行启动

下次会话:

```
/super-dev 继续当前流程
```

或:

```
继续 v3,从 T19 ReportStream 起步;samples [保留/也删];首页/章节页 [OK/这里要改]
```
