# Career Compass v3 · 下次开工 bootstrap

**最近一次收工**: 2026-05-26 凌晨(v3.1 vs v2-kimi 报告对比完成,v3.2 改造方案锁定)

## 🟢 v3.2 改造方案(2026-05-26 锁定,明早直接执行)

### 触发事件
stoneyang 桌面双 PDF 对比:`3你的职业罗盘报告.pdf`(v3.1 / 6109 字)vs `kimi你的职业罗盘报告.pdf`(v2 kimi / 8330 字)。结论:**v3.1 的"严谨性机制"要保留,但报告结构要恢复 v2 kimi 版的 11 段丰满骨架,字数回到 7500-9000**。

### 结构差异速查

| 章节 | v2 kimi(留)| v3.1(改)|
|---|---|---|
| 执行摘要 | ✓ 矛盾点+财务锚+首选路径 | ✗ → **加回** |
| 个人画像 | 3 节(爱/长/价值观)| 4 节(爱长需利)→ **改回 3 节** |
| 推荐路径 | 3 条 + matchScore + 6 段标准化(行业/爱长需利/职责/门槛/薪资/AI视角)| 3 条 + 一句话定位 + 3 试水 → **改回 6 段** |
| 首选路径深度剖析 | ✓ 职业轨迹 3 阶段 + 挑战 + 机会 + 试水 + 技能 + 资源 | ✗ → **加回** |
| 行动计划 | 30 天/90 天/1 年三梯度 | ✗ → **加回** |
| 结尾 | 导师寄语 → **改名**(见下)| 免责声明 |

### v3.1 唯一保留的严谨性机制(必须嵌进 v2 骨架)
1. facts 必须从 `industry_facts.json` 12 条引用,带来源 + 三限定
2. 无 facts 时标 "此处缺乏数据支撑,以下为推断"
3. 每条推荐路径结尾 "本路径真实可行性需由你自己的种子用户付费数据验证"
4. 模板层固定开篇/结尾免责(已在 `report.astro` 静态嵌入,保留)

### 改造任务清单(`src/lib/prompt-stream.ts` 大重写)

1. **prompt 结构按 v2 11 段重组**,每段在合适位置嵌严谨性 hook:
   - 执行摘要(500-700 字)→ 测评数据直引 + 首选路径预告(无 facts)
   - 个人画像 · 择己所爱 → 测评字段直引
   - 个人画像 · 择己所长 → 测评字段直引
   - 个人画像 · 价值观与生活方式偏好 → 测评字段直引
   - 推荐职业路径 1/2/3(每条 6 段标准化结构):
     - 行业分类
     - 爱-长-需-利论证(**"需" 必须引 facts,无 facts 时标推断**)
     - 核心职责
     - 入行门槛
     - 薪资范围
     - AI 时代视角(**facts 引 Stanford HAI / WEF 等**)
     - 结尾固定 "本路径真实可行性需由你自己的种子用户付费数据验证"
   - 首选路径深度剖析(**facts 引行业增长数据**):
     - 职业发展轨迹 3 阶段
     - 3 个核心挑战 + 对策
     - 3 个机会窗口
     - 可立即开始的 3 个试水步骤(**硬约束:具体到工具名/书名/网站名**)
     - 必备技能清单
     - 推荐认证/课程/资源(书籍真实可验证)
   - 行动计划(30 天/90 天/1 年)
   - **"写在最后"**(替换"导师寄语",见下)
   - 字数目标 → **7500-9000 中文字**

2. **"导师寄语"改名 — 明早 stoneyang 拍板**:
   | # | 候选 | 调性 |
   |---|---|---|
   | A | **写在最后** | 朴素,贴 v3 严谨性调性,**推荐** |
   | B | **行动备忘** | 执行向,去抒情 |
   | C | **临别一句话** | 留温度但去权威 |
   | D | **此刻的提醒** | 此时此地,去导师架子 |
   | E | **一句话提醒** | 轻量化 |
   
   *底色判断:stoneyang brand voice 是"真实+真诚+修辞以立诚",权威感反而违和;A 或 C 更合 → **默认 A**,明早可换 C/D*

3. **不动**:`generate.ts` / `types.ts` / `industry_facts.json` / `ReportStream.tsx` / `QuestionLikert.tsx` / `index.astro` / `globals.css` — 全部保留 v3.1 改动

### 端到端测试预算
Kimi 一次 ~¥0.5,v3.2 改完一次验收 = ¥0.5 投入,跑出 7500+ 字带 facts 引用即过

### v3.1 5 个旧候选(F1-F5)**作废** — 新方案直接覆盖,不再用"温度调整"思路

---

## v3.1 升级要点(2026-05-25)

stoneyang 给了完整方法论(`docs/methodology/严谨性规范.md` + pipeline.py + report_generator.py + fact_checker.py)+ 16personalities UI 参考 → 产品定位从"7000 字 MVP"升级为"事实/解读分离的可信报告"。

完成:
- ✅ 事实库 `src/data/industry_facts.json` 共 12 条(种子 3 + 扩库 9:WEF/McKinsey/HAI/LinkedIn)
- ✅ `prompt-stream.ts` 完全重写 —— 严禁编造 / 必须引用 fact id / 三版块结构 / 模板层固定免责
- ✅ `generate.ts` 加 facts 加载 + expires_at 过滤 + 告警 log
- ✅ `types.ts` 加 Fact / FactsLibrary / FactReference
- ✅ `QuestionLikert.tsx` 改 7 圆点 gradient(绿→灰→紫,16p 风)
- ✅ `index.astro` 首页 3 step 卡(STEP 1/2/3 三色)
- ✅ `ReportStream.tsx` 报告页三版块视觉强分隔(h2 加 brand 顶 border + 大留白)
- ✅ `globals.css` 加 Likert gradient tokens

待做:
- C1 独立 fact_checker (改造三) — 留 v3.2
- 事实库长期维护(每 6 个月按 expires_at 复核)— stoneyang 自己

## 🔴 v3.1 验收发现的 2 个核心问题(2026-05-25 22:00 stoneyang 浏览器实测)

**问题**:
1. **字数明显变少**(v3.0 跑 7000+ 字 → v3.1 跑出 5000- 字)
2. **可读性比 v3.0 差**(节奏断、说明文味重、温度不够)

**根因 hypothesis**(明天要 verify):
- prompt-stream.ts 把字数指令从 v3.0 的"7000+"改成"4500-6500 质重于量",LLM 真的收敛了
- "事实/解读分离"硬约束让 LLM 反复说"此处缺乏数据支撑,以下为推断"等诚实声明,情感温度被压
- ReportStream 三版块视觉强分隔(h2 加 brand 顶 border + 3em 留白)让阅读节奏被切碎
- 三版块结构(3 个 ## )比 v3.0 的 6 section 信息密度低

**明天 5 个候选修法(stoneyang 选 1-3 个组合)**:

| # | 改动 | 文件 | 风险 |
|---|---|---|---|
| F1 | prompt 字数下限调回 **总 6500-8500 中文字**;Executive Summary 300-400 → **500-700 字** | `src/lib/prompt-stream.ts` | 低,不影响严谨性 |
| F2 | prompt 加"叙事温度"指令:**避免连续说"此处缺乏数据"**,缺数据时用一次性总结;每段允许带感性连接词("更深一步看"/"换一个角度"等) | `src/lib/prompt-stream.ts` | 中,要平衡严谨与温度 |
| F3 | 三版块**视觉缓和**:h2 顶 border 改 1px dashed brand-muted;3em 留白缩到 1.5em;section 间不要"硬切" | `src/components/ReportStream.tsx` article CSS | 低,纯视觉 |
| F4 | 推荐路径"3 个试水动作"**硬约束具体到名字**(职位名/网站名/书名/工具名,不许空泛"找相关课程") | `src/lib/prompt-stream.ts` | 低,提升 actionability |
| F5 | 在三版块内加 prompt-interlude 风格的**章节过渡话**(80-120 字段落,让节奏不断) | `src/lib/prompt-stream.ts` | 中 |

**推荐组合**:F1 + F2 + F4(prompt 层 3 改,不动 UI 先试)。如果跑出来还不够丰满,再加 F3 + F5。

**端到端测试预算**:每次 Kimi ~¥0.5,F1+F2+F4 一次性改完 1 次验收 = ¥0.5 投入。

---

---

(以下为 v3.0 历史信息,保留参考)

---



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
