# Career Compass v3 · Architecture

**主导专家**: ARCHITECT + CODE + SECURITY
**Super Dev 阶段**: docs
**关联文档**: [research](./career-compass-v3-research.md) / [prd](./career-compass-v3-prd.md) / [uiux](./career-compass-v3-uiux.md)

---

## 技术选型(锁定决策)

| 层 | 选型 | 锁定版本 | 为什么 |
|---|---|---|---|
| 框架 | **Astro** | 6.x(锁 6.1.x) | v2 已用熟;SSR + 静态混合;Pages Functions 集成成熟。memory `feedback_tech_stack_scene_fit.md` 已验"v2 用过 ≠ 一定要用",但这里 bench 数据指明 Astro 在 CF Pages 上 working state 已存在,**复用是最低成本路径** |
| 部署 | **Cloudflare Pages** | latest | v2 5/12 已 deploy 成功过,部署面已验证 |
| 服务端运行时 | **Cloudflare Pages Functions** | latest | 5min execution 上限远超 GLM-5.1 的 250s;CF Edge 跑,从 CF 调 SiliconFlow 跨境快 |
| LLM 主 | **SiliconFlow GLM-5.1** | `zai-org/GLM-4.5` 或 SiliconFlow 当前 GLM-5.1 model id | bench parseOk ✅ + 250s + 8k tokens(性价比最优) |
| LLM 备 | **SiliconFlow Kimi-K2.6** | `Pro/moonshotai/Kimi-K2.6` | bench parseOk ✅ + 稳定备选 |
| LLM 调用方式 | **fetch + SSE stream** | OpenAI 协议兼容 | 浏览器看着报告打字效果 + 不占满 Function execution |
| UI 框架 | **Astro 原生 + 少量 React 岛屿** | Astro 6.x + React 18 | 测评页交互不复杂,Astro 原生足够;只在需要 state hooks 的地方用 React island |
| 样式 | **Tailwind CSS v4** + CSS variables | latest | v2 已用;品牌 token 走 CSS variables |
| 图标 | **Lucide React** | latest | SKILL.md 强制约束:不许 emoji,Lucide/Heroicons/Tabler 三选一,默认 Lucide |
| 字体 | **Inter + Noto Sans SC** | Google Fonts CDN | 英文 Inter 中文 Noto Sans SC,可读性优先 |
| 状态存储 | **localStorage**(纯前端) | 浏览器原生 | MVP 无后端持久化 |
| 包管理 | **pnpm** | 9.x | v2 用 npm,v3 切 pnpm(快、磁盘省、lockfile 干净) |
| 构建 | **Astro build → dist/** | — | 不引入额外 build step |
| 类型 | **TypeScript strict mode** | 5.x | 全程 ts,无 js |

---

## 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                       浏览器(用户端)                       │
│                                                              │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │  Astro 静态页   │    │  React 岛屿     │                 │
│  │ (首页/测评章节) │ ←→ │ (题目交互组件)  │                 │
│  └─────────────────┘    └─────────────────┘                 │
│                                                              │
│  ┌──────────────────────────────────────────┐               │
│  │           localStorage                    │               │
│  │  - 答题进度(章节 1-5 的答案)            │               │
│  │  - 已生成报告片段(中断恢复用,MVP 不做) │               │
│  │  - 浏览历史(7 天 TTL)                   │               │
│  └──────────────────────────────────────────┘               │
└──────────────────────────────┬──────────────────────────────┘
                               │  HTTPS
                               ↓
┌─────────────────────────────────────────────────────────────┐
│            Cloudflare Pages(全球 Edge,无服务器)          │
│                                                              │
│  ┌──────────────────┐    ┌──────────────────────────────┐   │
│  │  静态资源        │    │  Pages Functions             │   │
│  │  /              │    │                              │   │
│  │  /assess/*      │    │  /api/generate    [streaming]│   │
│  │  /report        │    │  → POST 答题数据             │   │
│  │  (Astro build)  │    │  → fetch SiliconFlow + SSE   │   │
│  └──────────────────┘    │  → ReadableStream forward    │   │
│                          │  → 浏览器收到 token-by-token │   │
│                          └──────────────────────────────┘   │
│                                       │                      │
│                          [环境变量]                          │
│                          SILICONFLOW_API_KEY                 │
│                          LLM_MODEL_PRIMARY=GLM-5.1           │
│                          LLM_MODEL_FALLBACK=Kimi-K2.6        │
└──────────────────────────────────────┬──────────────────────┘
                                       │  HTTPS
                                       ↓
┌─────────────────────────────────────────────────────────────┐
│              SiliconFlow API(国内,Edge 直连)              │
│              https://api.siliconflow.cn/v1                  │
│                                                              │
│   POST /chat/completions  { stream: true, model, messages } │
│   → Server-Sent Events stream                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 模块划分

```
career-compass-v3/
├── src/
│   ├── pages/
│   │   ├── index.astro              # 首页,介绍 + 开始测评
│   │   ├── assess/
│   │   │   ├── chapter/[n].astro    # 章 1-5 动态路由
│   │   │   └── submit.astro         # 提交答案,跳报告页
│   │   └── report.astro             # 报告页(client-side fetch /api/generate)
│   ├── components/
│   │   ├── ChapterNav.astro         # 章节导航(进度条)
│   │   ├── QuestionLikert.tsx       # Likert 量表题 (React 岛屿)
│   │   ├── QuestionMBTI.tsx         # MBTI 二选一题
│   │   ├── QuestionDimensions.tsx   # 自由文本(章 5)
│   │   ├── ReportStream.tsx         # 报告 streaming 渲染 (React 岛屿)
│   │   └── icons/                   # Lucide 图标 wrapper(避免每处 import)
│   ├── data/
│   │   ├── questions/
│   │   │   ├── holland.json         # 复用 v2 baseline
│   │   │   ├── mbti.json
│   │   │   └── values.json
│   │   └── industry_trends.json     # 复用 v2 baseline
│   ├── lib/
│   │   ├── prompt.ts                # 复用 v2 baseline(主报告)
│   │   ├── prompt-interlude.ts      # 复用 v2 baseline(章节过渡)
│   │   ├── scoring.ts               # 答题计分:holland 三字代码 / mbti / values top3
│   │   ├── llm.ts                   # SiliconFlow 调用 + fallback
│   │   └── report-parser.ts         # 复用 v2 的 parseReportJSON 容错
│   └── styles/
│       └── globals.css              # Tailwind + brand tokens
├── functions/                       # CF Pages Functions
│   └── api/
│       └── generate.ts              # POST 答题数据,返回 SSE stream
├── public/                          # 静态资源
├── astro.config.mjs                 # CF adapter 配置
├── wrangler.toml                    # CF Pages 配置(不需要 wrangler.jsonc,Pages 用 toml)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── _next_session_bootstrap.md       # 收工 bootstrap
```

**与 v2 的关键差异**:
- ❌ 不要 `src/workflows/`(CF Workflows)
- ❌ 不要 `migrations/`(D1 SQL migrations)
- ❌ 不要 `astro-integrations/inject-workflow.mjs`(adapter hack)
- ❌ 不要 `wrangler.jsonc` 里的 D1/KV/Workflows binding
- ✅ 新增 `functions/api/generate.ts`(Pages Functions 取代 Workers + Workflows)

---

## 数据流(端到端)

### 1. 用户答题(章 1-5)

```
浏览器章节页 → 用户点 Likert 选项
  → onChange → setState
  → useEffect 把 state 写 localStorage[`v3:answers:chapter-${n}`]
```

**无任何后端调用**。章节切换走 Astro client-side navigation。

### 2. 提交 → 报告生成

```
浏览器:章 5 提交 → 跳 /report?id=<uuid>  (uuid 仅作 client 标识)
浏览器:report.astro 加载 → ReportStream.tsx mount
  → POST /api/generate
    body: { answers: localStorage 全部章节答案, profile: localStorage 章 4 个人情境 }
  → 收到 SSE stream
  → 逐 token 追加到 <pre> 渲染 + react-markdown 实时解析(可选)

CF Pages Functions /api/generate:
  1. 校验 body schema(zod)
  2. lib/scoring.ts 计分: holland code / mbti type / values top3
  3. lib/prompt.ts buildPrompt(scores, profile, industry_trends)
  4. fetch SiliconFlow /v1/chat/completions { stream: true, model: GLM-5.1 }
  5. 拿到 ReadableStream
  6. 用 TransformStream 把 OpenAI SSE 格式转给浏览器(直接 forward 也行)
  7. 如 GLM-5.1 5s 内无第一 chunk → cancel + fallback Kimi-K2.6
```

### 3. 报告完成 → 留存

```
浏览器:stream 结束
  → localStorage[`v3:report:${uuid}`] = { content, generated_at, model }
  → 显示"复制全文" / "打印 PDF" 按钮
```

**全程不写后端任何持久化存储**。

---

## API 契约

### `POST /api/generate`

**Request**:
```ts
{
  answers: {
    holland: Record<string, number>;   // 题号 → 1-5 分
    mbti: Record<string, "A" | "B">;
    values: Record<string, number>;
    dimensions: { q1: string; q2: string; q3: string };  // 章 5 自由文本
  };
  profile: {
    age: number;
    educationStage: "在校探索" | "刚毕业" | "工作1-3年" | "工作3-5年" | "其他";
    targetLocation: string;              // 目标工作地,"不限" 或具体城市
    additionalContext?: string;          // 章 4 可选补充
  };
}
```

**Response**: `Content-Type: text/event-stream`

```
data: {"event":"meta","model":"GLM-5.1","scores":{...}}\n\n
data: {"event":"token","text":"Kelly，"}\n\n
data: {"event":"token","text":"18 岁，"}\n\n
...
data: {"event":"done","totalTokens":8270,"durationMs":250000}\n\n
```

**Error response**(stream 内或 HTTP 4xx/5xx):
```
data: {"event":"error","reason":"siliconflow_timeout","fallback":"kimi-k2.6"}\n\n
```

---

## 关键代码骨架(snippet 级,不是完整实现)

### `functions/api/generate.ts`

```ts
export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const body = await ctx.request.json();
  const { answers, profile } = body;

  // 1. 计分
  const scores = scoreAnswers(answers);

  // 2. 构造 prompt
  const messages = buildReportPrompt(scores, profile, industryTrends);

  // 3. fetch SiliconFlow stream
  const upstream = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ctx.env.SILICONFLOW_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ctx.env.LLM_MODEL_PRIMARY,  // "zai-org/GLM-4.5" 或 SF GLM-5.1 id
      messages,
      stream: true,
      max_tokens: 16000,
      temperature: 0.7,
    }),
  });

  // 4. forward stream
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
};
```

### `src/lib/scoring.ts`

```ts
export function scoreAnswers(answers: Answers): Scores {
  return {
    hollandCode: getHollandCode(answers.holland),  // e.g., "ARS"
    mbtiType: getMBTIType(answers.mbti),            // e.g., "INFP"
    valuesTop3: getValuesTop3(answers.values),      // e.g., [{name:"生活方式",score:18},...]
  };
}
```

---

## 安全考量(SECURITY 专家审查点)

| 风险 | 评估 | 处理 |
|---|---|---|
| LLM API key 泄漏 | 高 | 走 CF Pages env vars,**绝不**在前端或 git 里出现 |
| 用户输入直接拼 prompt(prompt 注入) | 中 | dimensions 字段做长度限制(< 500 字),其它字段都是结构化选项不存在注入风险 |
| 没有 rate limit,被刷 LLM 成本 | 中 | MVP 阶段先不上 rate limit;CF Pages 有 free tier 限额自动兜底;监控 SiliconFlow 账单 |
| XSS:报告 markdown 渲染 | 低 | 用 react-markdown 默认转义;不允许 raw HTML |
| 隐私:用户答题数据 | 低 | 不存服务器,只过一次 LLM API;CF Pages logs 默认 retention,不打印答题内容 |

memory `feedback_code_fact_source_of_truth.md` 已立规:env vars 不许在 `.env` 注释里写 fake 值导致误读,**实际值只在 wrangler secret 或 CF Pages dashboard 配**。

---

## 部署架构

### 部署面

1. **GitHub repo**: 待决定(单建 / 与 v2 同 repo 分支)
2. **CF Pages project**: `career-compass-v3`
3. **域名**:
   - 默认:`career-compass-v3.pages.dev`
   - 可选自定义:`career.stoneyang.top`(stoneyang.top 已托管 CF,加一条 CNAME)
4. **环境变量**(CF Pages dashboard 配,不走 wrangler secret):
   - `SILICONFLOW_API_KEY` = `sk-hezwc...`(v2 已有,复用)
   - `LLM_MODEL_PRIMARY` = `<GLM-5.1 model id>`(待确认 SiliconFlow 当前 model id)
   - `LLM_MODEL_FALLBACK` = `Pro/moonshotai/Kimi-K2.6`

### 部署方式

**git push 自动 deploy**(CF Pages 默认):
- 配 GitHub repo → CF Pages 创 project → 连 repo
- 每次 push 到 main 自动 build + deploy
- 不需要 wrangler CLI(避开 v2 OAuth 坑)
- 第一次部署如果需要手动:`npx wrangler pages deploy dist --project-name career-compass-v3`,**需要 Custom API Token,权限只要 Pages Edit + Account Read**(不再需要 Workflows / D1)

### CI/CD

MVP 阶段不上 CI,仅靠 CF Pages 默认 build。后期再加 GitHub Actions 跑 type-check / lint。

---

## 与 v2 部署对比(规避卡点)

| v2 卡点 | 根因 | v3 怎么避 |
|---|---|---|
| `wrangler login` OAuth 超时 | Windows + 系统代理 | git push 自动 deploy,不走 wrangler CLI |
| Workflows 权限需要重申 Token | change 2 引入 Workflows | 不引入 Workflows |
| `astro-integrations/inject-workflow.mjs` adapter hack | astro 6.x 不原生支持 | 不用 Workflows,adapter 走默认 |
| D1 migrations 维护 | change 2 加 email 表 | 不用 D1 |
| Resend 邮件 / DNS 配置 | change 2 异步链路 | 不发邮件,同步 stream |

**v3 部署面是 v2 5/12 那个 working state 的简化版**,所有 v2 卡过的坑都不存在。

---

## stoneyang 拍板结果(2026-05-24)

1. **GitHub repo 策略**: **路径 A — 单建 `career-compass-v3` repo** ✅
   - 在 GitHub 单独开 `stoneyang0213/career-compass-v3` 公开 repo
   - CF Pages 直接连这个 repo,push 即 deploy
   - v2 不动,作为 baseline 参考材料保留

2. **自定义域名**: MVP 阶段先用 `career-compass-v3.pages.dev`,上线验收通过后绑 `career.stoneyang.top`

3. **GLM-5.1 在 SiliconFlow 的当前 model id**: spec 阶段第一步 web 实查 SiliconFlow 文档定稿(候选 `zai-org/GLM-4.5` 或 `Pro/zai-org/GLM-4.5`),备选 GLM-4.5 同样能跑

---

**确认门**: 本 architecture 等 stoneyang 在 docs_confirm 门处审完三文档一并确认。
