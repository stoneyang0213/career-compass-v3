# Career Compass v3 · 下次开工 bootstrap

**最近一次收工**: 2026-05-24(周日下午)

## 一句话状态

**v3 走完 super-dev 流水线 [5/9] spec + T01-T04 已落地推送到 GitHub**(`stoneyang0213/career-compass-v3`),本机 `npm run dev` 浏览器可见完整首页(Logo + Nav + Hero + 3 价值卡 + footer)。下次从 **T05(数据迁移)+ T06-T08** 起步,接 T09 章节布局。

🟢 super-dev research / docs / docs_confirm / spec / T01-T04 完成
🟡 samples/ 4 张 PNG 待 stoneyang 看完决定保留/删除
🔵 T05-T23 待跑

## 今天做了什么(2026-05-24)

### 上午:Super Dev 学习 + 接入
- 完成 `/codebase-to-course super-dev`:把 shangyankeji/super-dev 拆成 6 模块交互式课程 → `D:\projects\super-dev-course\index.html`,193KB / 2670 行,6 模块 / 6 quizzes / 3 data flow / 2 group chat
- `uv tool install super-dev` 装好 `super-dev 2.4.0` → `C:\Users\33625\.local\bin\super-dev.exe`
- 把 super-dev 装到 `D:\projects\career-compass-v2`(实验性,backup 了 CLAUDE.md)

### 下午:v3 项目从 0 到首页跑通
- 用产品经理模式拍板 3 根本决策:
  - 路径:新建 `D:\projects\career-compass-v3` 空目录
  - 范围:保留 v2 prompt/题库/bench / 推翻 CF Workers + 邮件链路
  - 北极星:**MVP 验证 — 能上线 + 至少 3 个真实用户走完测评**
- 迁移 v2 可复用资产 912K 到 `baseline_from_v2/`(prompts / questions / industry / bench / samples)
- 装 super-dev 接入面到 v3 项目级
- **走完 super-dev [1-4/9] 阶段**:research → docs(三文档)→ docs_confirm 门通过 → spec(23 张任务卡)
- 4 个开放问题全部拍板:
  - GitHub repo:**单建 stoneyang0213/career-compass-v3**
  - brand 主色:**罗盘蓝 #2D5F8B**
  - hero 文案:**"你的 AI 时代职业罗盘"**(产品名锚定型)
  - 章 5 dimensions:**3 题全保留**(择己所爱/所长/所利,字数下限 50/题)
- 修正 spec 微观决策(我曾凭推断说"Tailwind v3 / React 18",改读 v2 真实 package.json 后改为 **React 19.2.5 / Tailwind v4.2.4** 完全沿用 v2 跑通版本)
- T01 GitHub repo 创建:`gh repo create` → https://github.com/stoneyang0213/career-compass-v3
- T02 本地 git init + push:**敏感数据审计**——发现 `bench_results/stoneyang_v2_real/` 和 `kelly_real_assessment/` 含 PII,从 commit 移除 + `.gitignore` 永久挡远端,**本地保留**;samples 待 stoneyang 看完决定
- T03 Astro scaffold:`package.json` + npm install 439 包 / 3min + `astro.config.mjs` + `tsconfig.json` + `globals.css`(罗盘蓝 design tokens)+ `BaseLayout.astro` → dev server HTTP 200
- T04 通用组件:`Icon.astro`(inline Lucide SVG,无 lucide-react 依赖)+ `Logo.astro` + `Nav.astro` + `Button.astro` + `ProgressDots.astro` + `ValueCard.astro`,index.astro 升级为真正首页

### 在 docs_confirm 门被 stoneyang 抓到一次编造数字
- 我说"章 5 dimensions 让报告 +1500 字"——bench 没对照组数据,**编造的**。已在 PRD 修正,改为定性描述。

## 下次开工:从这里继续

### 关键事:samples/ 4 张 PNG(stoneyang 待办)

`baseline_from_v2/samples/` 下 4 张 PNG 文件管理器双击点开看:
- 如果是中性 UI 截图 → 告诉 Claude"samples 保留",Claude 从 `.gitignore` 移除 samples 那行 + `git add -f` + commit + push
- 如果含真实测评数据 → 告诉 Claude"samples 也删",保持现状(本地留远端永挡)

### 立刻可继续的 T05-T08(数据迁移,30 分钟)

1. **T05** `cp baseline_from_v2/questions/*.json` → `src/data/questions/`(3 套量表)
2. **T05** `cp baseline_from_v2/industry_data/industry_trends.json` → `src/data/industry_trends.json`
3. **T06** `cp baseline_from_v2/prompts/prompt.ts + prompt-interlude.ts` → `src/lib/`,改 import 路径让它们能被 src 引用
4. **T07** 写 `src/lib/types.ts`(Answers / Profile / Dimensions / Scores 共享类型)
5. **T08** 写 `src/lib/scoring.ts`(holland code / mbti type / values top3 纯函数)— 从 v2 提取或重写
6. **T08 验收**:`scoring(bench_results/kelly_real_assessment 的 input)` 应返回 `hollandCode="ARS"` + `mbtiType="INFP"`

### 接 T09-T12(章节页 + 报告页,2 小时)

- T09 章节布局 `src/pages/assess/chapter/[n].astro`
- T10 报告页骨架 `src/pages/report.astro`
- T11 localStorage 封装 `src/lib/store.ts`
- T12 Likert / MBTI / Dimensions 三个 React 岛屿组件

### 然后 T13-T20(LLM streaming + 集成 + 部署,3-4 小时)

详见 `output/career-compass-v3-spec.md`。

## 关键路径速查

### 项目
- 路径:`D:\projects\career-compass-v3`
- 当前分支:`main`,最新 commit `6dd4405 docs: v3 三文档 + spec + 4 决策落地 + super-dev 接入`
- GitHub:https://github.com/stoneyang0213/career-compass-v3
- 还没建 CF Pages 项目(T22 时建)

### 启动命令
```bash
cd D:\projects\career-compass-v3
npm run dev      # 浏览器开 http://localhost:4321/
```

### 锁定的技术栈版本(全部沿用 v2)
- Node 22.22.1 / npm 11.9.0
- Astro 6.3.7(spec 锁 `^6.1.10`,实际 npm 装到了 6.3.7,minor 兼容)
- React 19.2.5
- Tailwind 4.2.4(via `@tailwindcss/vite`)
- @astrojs/cloudflare 13.2.2
- wrangler 4.86.0
- lucide-react 0.469+(目前用 Astro inline SVG,React 岛屿要用时再 import)
- react-markdown 9.0.1 + remark-gfm 4.0.0

### 锁定的产品决策
- GitHub:单建 repo
- brand:罗盘蓝 #2D5F8B + 赭石 #C97A4A(accent)
- hero:"你的 AI 时代职业罗盘"
- 章 5:dimensions 3 题全保留(Heart/Dumbbell/Wallet icon)
- LLM:GLM-5.1 主 / Kimi-K2.6 备(via SiliconFlow,bench parseOk ✅)
- 部署:CF Pages + Pages Functions streaming(不要 Workers / Workflows / D1)
- 状态:localStorage only(MVP 完全无服务端持久化)

### 已配凭据 / 待配凭据
- 本地待配(T18 跑 LLM stream 时):`.dev.vars` 含 `SILICONFLOW_API_KEY=sk-hezwc...`(从 v2 .dev.vars 复制)
- 生产待配(T22 deploy 时):CF Pages dashboard 配 3 个 env vars
  - `SILICONFLOW_API_KEY`
  - `LLM_MODEL_PRIMARY=<SiliconFlow GLM-5.1 model id,T18 开工前 curl /v1/models 实查>`
  - `LLM_MODEL_FALLBACK=Pro/moonshotai/Kimi-K2.6`

## 不要重复踩的坑

- **Windows + 系统代理下 curl localhost = 502** → 加 `--noproxy '*'` flag,浏览器访问不受影响
- **wrangler login OAuth + Windows 系统代理 = callback timeout** → 用 Custom API Token 路径,**v3 走 GitHub push auto-deploy 完全绕开 wrangler login**
- **tsconfig "**/*" 把 baseline_from_v2 拉进 tsc 编译** → 已 exclude;后续 T06 把 prompt.ts 搬到 src/lib/ 时记得 import 路径要从相对路径改对
- **首次启动 Astro dev server 30s+**(Vite optimize deps)→ 第二次启动 4s 内,正常
- **GLM Coding Plan 拒绝海外 IP** → v3 走 SiliconFlow,不直连智谱
- **基础事实必须 Read source-of-truth** → 我曾凭"v2 用 React 18"的推断写 spec,实际 v2 是 React 19。memory `feedback_code_fact_source_of_truth.md` 已立规
- **不要编造 bench 数字** → 我曾说"dimensions +1500 字"但 bench 无对照组,已修正为定性描述

## 一行启动

下次会话开始,在 Claude Code 项目目录里直接说一句:

```
/super-dev 继续当前流程
```

或者更明确:

```
继续 v3,从 T05 数据迁移起步;samples 我看完了:[保留 / 也删]
```

Claude 读这份 bootstrap + `output/career-compass-v3-spec.md` 即可立刻接上,无需重新解释。
