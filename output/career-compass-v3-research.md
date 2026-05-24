# Career Compass v3 · Research(双引擎)

**主导专家**: PM + ARCHITECT
**生成时间**: 2026-05-24
**工作模式**: variant(从 v2 派生,scope 精简)
**Super Dev 阶段**: research

---

## 引擎 1:本地知识发现(读 baseline_from_v2/)

### 1.1 可复用资产(已落 baseline_from_v2/)

| 资产 | 文件 | 体量 | 复用方式 |
|---|---|---|---|
| 主报告 prompt | `prompts/prompt.ts` | 315 行 | 直接复用(改写为 v3 项目相对路径) |
| 试吃报告 prompt | `prompts/prompt-preview.ts` | 110 行 | v3 MVP **可以不要**(MVP 不做试吃) |
| 章节过渡 prompt | `prompts/prompt-interlude.ts` | 131 行 | 复用(章节化测评的过渡话) |
| Holland 霍兰德兴趣量表 | `questions/holland.json` | 完整 | 直接复用 |
| MBTI 量表 | `questions/mbti.json` | 完整 | 直接复用 |
| 价值观量表 | `questions/values.json` | 完整 | 直接复用 |
| 行业趋势库 | `industry_data/industry_trends.json` | 312 行 35 行业 | 直接复用 |
| Bench 结果 | `bench_results/{kelly,stoneyang_v2_real}/` | 4 模型对比 | **作为模型选型硬证据** |

### 1.2 Bench 硬证据(模型选型)

来源:`baseline_from_v2/bench_results/kelly_real_assessment/COMPARE.md`(fixture: 真实 Kelly 测评)

| Provider | OK | 耗时 | promptTokens | completionTokens | 中文字数 | parseOk |
|---|---|---|---|---|---|---|
| claudecode | ✅ | 0 ms | — | — | 5,842 | ✅ |
| **glm-5.1** | **✅** | **250.8 s** | **9,355** | **8,270** | **7,709** | **✅** |
| kimi-k2.6 | ✅ | 330.3 s | 8,769 | 17,456 | 7,782 | ✅ |
| deepseek-v4-flash | ❌ | 1200 s | — | — | 0 | ❌ timeout |

**结论**: GLM-5.1 在 v2 真实样本上是性价比最优——比 Kimi 快 80s、completion tokens 少一半、parseOk 同样通过、报告字数同样 7700+。Kimi-K2.6 作为稳定备选(memory `feedback_llm_model_selection_bench_first.md` 已立规:bench 数据是硬证据,不许凭质量印象选)。

### 1.3 v2 部署卡点的真相(读 git log + bootstrap)

- v2 在 **2026-05-12 已经 deploy 到 CF Pages 成功过**(commit `6aaf211`),走 Custom API Token 路径。**部署能力本身验证过**。
- 卡的是 change 2 引入 **CF Workflows + astro adapter hack** 后的二次 deploy:
  - astro 6.x cloudflare adapter 不原生支持 Workflows 命名 export
  - `wrangler login` OAuth callback 被 Windows 系统代理拦截
  - Custom API Token 需要重新加 Workflows + D1 权限
- **v3 的杠杆**: 不引入 Workflows、不引入 D1、不引入异步任务,部署面回到 5/12 那个 working state,卡点自动消失。

### 1.4 v2 工程教训(memory + git log 综合)

| 教训 | 来源 | v3 怎么避 |
|---|---|---|
| GLM Coding Plan 拒绝海外 IP | memory:`reference_glm_codingplan_ip_restriction.md` | v3 走 **SiliconFlow** 的 GLM-5.1,不直连智谱 |
| GLM-5.1 默认开 reasoning | memory:`reference_glm5_disable_thinking.md` | v3 长报告反而不要关 thinking,memory 说明确长输出不要 disable |
| Astro v6 cloudflare adapter 三处 breaking change | commit `1580b68` / `65b2ad0` | v3 锁 Astro 6.x 版本,不追新 |
| wrangler OAuth 在 Windows + 系统代理超时 | bootstrap | v3 deploy **从一开始就用 Custom API Token**,不走 OAuth |
| Qwen 2.5-7B 跑深度 prompt parseOk=FALSE | bench / bootstrap | v3 直接锁 GLM-5.1,不选小模型 |

---

## 引擎 2:同类产品 + 技术栈调研

### 2.1 同类产品定位对比

| 产品 | 形态 | 收费 | 报告深度 | v3 的位置 |
|---|---|---|---|---|
| 16personalities.com | 网页问卷 + 文字结果 | 免费 + Premium | 浅(性格类型描述) | v3 报告深度 7700+ 字,远超 |
| MBTI 官方付费版 | 纸质 + 顾问 | $50-$200 | 深(顾问介入) | v3 同等深度,自助 + 0 元 |
| 国内"心理测评"小程序 | 公众号小程序 + 短报告 | 19-99 元 | 浅 + 营销话术多 | v3 长报告 + 行业落地 + AI 时代视角 |
| ChatGPT/Claude 直接问 | 对话式 | $20/月 | 视用户提问质量 | v3 结构化测评 + 行业数据 + 三段推荐 |

**v3 差异化**: 结构化测评(Holland + MBTI + 价值观三套量表)+ LLM 综合(7000+ 字深度报告)+ AI 时代视角(industry_trends 数据库)+ **同步 stream 出报告**(用户看着报告一字一字打出来,不等邮件)。

### 2.2 部署架构候选对比(关键架构决策)

| 候选 | 优势 | 风险 | 评估 |
|---|---|---|---|
| **A. Astro + CF Pages + Pages Functions(streaming)** | 复用 v2 熟悉的栈;5/12 已 deploy 成功过;CF Pages Functions 支持 5min execution;Edge 跑 LLM API 路径短 | CF Pages 在国内访问偶有抖动;Functions 上传体积有限 | **推荐主选** |
| B. Next.js + Vercel Edge + streaming | TypeScript 生态最厚;v0/Cursor 友好;一键 deploy | stoneyang 没用过 Next.js;国内访问 Vercel 慢 | 不推荐 |
| C. VPS(Hermes WSL)+ 简单 Node + caddy | 完全可控;无平台限制 | 要管证书 / 反代 / 监控;部署成本最高;违反 scope 精简 | 不推荐 |

**推荐 A**——栈熟悉、部署面已验证、卡点已知且全是被 change 2 引入,不是栈本身的问题。

### 2.3 LLM 调用方式调研

- **SiliconFlow** 是 v2 已配 key(`sk-hezwc...`),作为统一网关访问 GLM-5.1 / Kimi-K2.6 / Qwen 等多个模型。
- SiliconFlow API 兼容 OpenAI Chat Completions 协议,**支持 stream=true**。
- CF Pages Functions 可以用 `fetch + ReadableStream` 把 SiliconFlow 的 SSE 流直接 forward 给浏览器,**全程不落地、不存数据库**。

### 2.4 状态存储调研

v3 走 scope 精简 + MVP 验证型,**不需要任何持久化**:

- 用户答题进度 → 浏览器 `localStorage`(用户刷新也不丢)
- 生成的报告 → 直接 stream 到浏览器渲染,用户自己选择"复制"或"打印为 PDF"
- 后续如果要"按邮箱保存报告",再加;MVP 不做

省下:D1 / KV / R2 / Resend / email subscribers 表 / email_sends 表 / reports 表 / Workflows / async webhook。**全部不要**。

---

## Research 结论

### 三大锁定决策

1. **LLM**: SiliconFlow GLM-5.1 主 + Kimi-K2.6 备(SiliconFlow API 切换 model 字段即可)
2. **部署**: Astro 6.x + Cloudflare Pages + Pages Functions(streaming),**不引入** Workers / Workflows / D1 / KV / R2
3. **状态**: 无(localStorage only)

### 两大不变(从 v2 完整继承)

1. **测评流程**: 章节化测评(章 1:Holland → 章 2:MBTI → 章 3:价值观 → 章 4:个人情境(年龄/地区/教育背景) → 章 5:深度反思 dimensions)
2. **prompt + 题库 + industry_trends**: prompt.ts 完整复用 + 3 套量表 JSON + 35 行业趋势库

### 一个新增

**Streaming UI**: 用户提交答案 → 报告页面立刻渲染,LLM 输出一字一字打出来(SSE 流);**用户看着报告生成的体感本身就是产品价值的一部分**——比"等邮件"或"loading 转圈"都强。

### 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| GLM-5.1 中途断连(用户切走再回来) | 中 | 用户体验受损 | localStorage 存"已生成片段",回来时显示"已完成 X%,刷新继续读取" |
| CF Pages 国内访问抖动 | 低 | 部分国内用户加载慢 | MVP 阶段接受;后续如严重再考虑 Cloudfront / 阿里云镜像 |
| SiliconFlow API 限流 | 低 | 同时多人测评时排队 | MVP 阶段量不大;后续接 Kimi-K2.6 fallback |
| Custom API Token 创建复杂(v2 老坑) | 中 | 第一次部署卡顿 | v3 文档明确写出权限清单(Pages Edit / Account Read),不再需要 Workflows + D1 权限 |

---

## 下一阶段

→ PRD / Architecture / UIUX 三文档同步生成(本文档驱动)。
