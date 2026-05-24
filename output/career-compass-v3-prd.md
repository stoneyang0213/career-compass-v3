# Career Compass v3 · PRD

**主导专家**: PM
**Super Dev 阶段**: docs
**关联文档**: [research](./career-compass-v3-research.md) / [architecture](./career-compass-v3-architecture.md) / [uiux](./career-compass-v3-uiux.md)

---

## 目标用户

**首要用户**: 18-30 岁的 AI 时代职业探索者 — 在校大学生、刚毕业 1-3 年正在做职业选择、或工作 3-5 年想转方向的人。

**用户画像样本**(来自 v2 真实测评 Kelly):
- 18 岁,惠顿大学艺术与计算机双学位在读
- 当前处于"在校探索"阶段
- 需要回答"我的复合背景在 AI 时代该往哪个方向走"

**次要用户**: stoneyang 本人(产品验证 + 个人复盘 + 内容素材)

**非目标用户**: 找下一份 job 具体岗位(LinkedIn/智联);找心理咨询(壹心理/简单心理);找 MBTI 性格类型科普(壹心理免费版)。

---

## 核心功能(MVP 范围)

### MUST(必须有)

1. **章节化测评流程**(5 章,完整复用 v2 5/12 上线的版本)
   - 章 1:Holland 霍兰德职业兴趣量表
   - 章 2:MBTI 性格类型量表
   - 章 3:Super 舒伯职业价值观量表
   - 章 4:个人情境补全(年龄 / 教育阶段 / 目标工作地)
   - 章 5:深度反思 dimensions(自由文本输入,3 题)

2. **同步 streaming 报告生成**
   - 用户提交后立刻进入报告页
   - 报告内容通过 LLM stream 一字一字渲染
   - 7000+ 字深度报告,包含:Executive Summary / 三条推荐职业路径(含 matchScore)/ 每条路径的 next step

3. **报告留存**
   - 用户可以"复制全文"或"打印为 PDF"(浏览器原生 Ctrl+P)
   - 不存数据库;localStorage 保留 7 天浏览历史(用户刷新可重新看,但不能从服务器恢复)

### SHOULD(应该有,如果时间允许)

4. **试吃报告**(章 3 完成后给个简短预览,激励用户完成后续章节)
   - 复用 v2 的 prompt-preview.ts
   - **MVP 阶段先不做**,留作 v3.1

### COULD(可以有)

5. 报告分享给朋友(生成短链 + 摘要图)
6. 不同模型对比(让用户选 GLM-5.1 / Kimi-K2.6)

### 章 5 "深度反思"细节(stoneyang 已拍板:3 题全保留)

章 5 是 5 章中唯一的自由文本章节,3 道开放题,**每题字数下限 50 字**,合计下限 150 字:

| # | 题目(label) | 提示语 | icon(v3 强制 Lucide,**禁 emoji**) |
|---|---|---|---|
| 1 | 择己所爱(兴趣与热情) | 什么活动/主题让你感到有内驱力、能进入心流?说说你最想做、做了不嫌累的事... | `Heart` |
| 2 | 择己所长(技能与优势) | 你最强的硬技能与软技能是什么?举一个具体成就案例(项目/作品/事件)... | `Dumbbell` |
| 3 | 择己所利(个人与财务目标) | 你对收入、生活方式、职业发展有什么期待?理想的工作日常 / 五年后的画像 / 不愿妥协的底线... | `Wallet` |

**为什么留这一章**:前 4 章 AI 拿到的都是结构化分数(holland=ARS、mbti=INFP、values top3)。dimensions 是用户用自己的话告诉 AI"我想做什么/擅长什么/在意什么"——AI 把原话直接拼到 prompt 里,生成的报告才能从"INFP 通常..."的模板话,升级为"Kelly 想用艺术让世界温柔一点"这种贴脸描述。

**bench 数据可证 vs 不可证**:
- 可证:含 dimensions 的完整 prompt 跑出来 7700+ 中文字报告(GLM-5.1 7,709 / Kimi-K2.6 7,782)
- 不可证:dimensions 单独贡献多少字数——bench 没有"砍掉 dimensions 再跑一次"的对照组数据
- 决定保留是基于"个性化定性效果"而非"+X 字数"

### WON'T(本期不做)

- 邮件订阅 / 邮件发送报告
- 用户账号系统 / 登录
- 付费功能
- 历史报告云端保存
- 多人协作 / 团队功能
- 多语言

---

## 成功指标(北极星)

**唯一一级指标**: **能上线 + 至少 3 个真实用户(stoneyang 本人 + 2 个朋友)能在浏览器里走完一次完整测评并拿到有用的报告**。

**辅助二级指标**:
- 报告生成成功率 ≥ 95%(失败定义:stream 中断或 parseOk=false)
- 端到端耗时 ≤ 5 分钟(章 1 开始到报告页生成完毕)
- 报告字数 ≥ 5000 中文字
- stoneyang 主观评分 ≥ 7/10(参考 bench COMPARE.md 的评分维度:行业洞察 / 四维贴合 / 推荐具体性 / 中文流畅)

**不追求的指标**:
- DAU / MAU(MVP 阶段不重要)
- 完成率(MVP 阶段允许中途放弃,不强 retention)
- 商业化 / 付费转化(本期完全不考虑)

---

## 验收标准

部署上线后,**stoneyang 在浏览器里(从生产 URL 开始)**:

1. 进入首页 → 看到"开始测评"按钮
2. 点击 → 进入章 1 Holland,正常答完
3. 顺序走完章 2-5(每章过渡话由 prompt-interlude.ts 生成)
4. 提交章 5 → 进入报告页
5. 报告开始 stream 输出(5 秒内看到第一段)
6. 4 分钟内报告写完(总字数 ≥ 5000)
7. 报告结构包含:Executive Summary + 3 条推荐路径(含 matchScore)+ 每条路径的具体下一步
8. 点击"复制全文" → 文本到剪贴板;按 Ctrl+P → 看到打印预览

**全部 8 条过 → 验收通过 → MVP 上线。**

---

## 非功能需求

| 维度 | 要求 | 备注 |
|---|---|---|
| 性能 | 章节切换 < 500ms;LLM 第一 token < 5s;报告完成 < 5min | CF Edge + SiliconFlow GLM-5.1 |
| 可用性 | MVP 阶段不做高可用;CF Pages 默认就够 | 不上 LB 不做多 region |
| 安全 | LLM API key 走 CF Pages env vars;不硬编码;前端不暴露 key | memory `feedback_code_fact_source_of_truth.md` |
| 隐私 | 用户答题不存服务器;localStorage 本地存 7 天 | 无 GDPR 顾虑 |
| 兼容性 | Chrome / Edge / Safari 最新版;移动端响应式 | 不考虑 IE 不考虑古老 Android |
| 国际化 | 仅中文 | 不做 i18n |
| 可观测性 | CF Pages 默认 logs 就够;MVP 不上 sentry | 后期再加 |

---

## 边界与失败场景

### 失败场景 1:LLM API 调用失败
- 表现:用户在报告页等了 10s 看不到任何字
- 处理:5s 没第一 token → 显示"模型响应慢,正在重试...";15s 仍无 → 切换到 Kimi-K2.6 fallback;30s 仍无 → 显示完整错误,给"重试"按钮 + 一句"如多次失败请联系开发者:微信 Excellent_We"

### 失败场景 2:Stream 中途断连
- 表现:报告写到一半停了
- 处理:localStorage 存已生成片段;前端检测 stream 静默 > 20s → 显示"中断,点击恢复" → 重新发请求(prompt 里附"接着上次的进度续写")
- MVP 简化:**不做断点续传**;直接显示"中断,请重新提交答案",答案在 localStorage 里可一键填回

### 失败场景 3:用户中途关闭浏览器
- 表现:用户答到章 3 关掉
- 处理:localStorage 自动存进度;下次打开看到"继续上次测评(章 3)/ 重新开始" 二选一

### 失败场景 4:CF Pages Functions 超时
- 表现:5min execution 限制被触及
- 处理:GLM-5.1 实测 250s,远小于 5min,不会触发;但要监控,如果生产实测超过 4min,加 prompt 的 max_tokens 限制把报告字数压到 6000

### 失败场景 5:测评数据格式错误(JSON parseOk=false)
- 表现:LLM 输出不是合法 JSON,无法结构化渲染
- 处理:用 v2 已经验证过的 `parseReportJSON` 容错函数(允许 markdown 包裹 / 单引号 / trailing comma);**如果 parseOk 仍 false,降级为纯 markdown 渲染**(用户看到完整文本,只是没结构化卡片)

---

## 商业模式(完全不在 MVP 范围)

明确说明:**v3 不考虑任何商业化**。MVP 是技术 + 产品验证 — 看这条路线能不能跑通、用户能不能拿到有用的报告。商业化是 v4 的事。

可能的 v4 方向(仅作记录,本期不实施):
- 用户付费按次生成深度报告(¥9.9 / 次,LLM 成本 ¥0.3-0.5)
- B2B2C 授权给职业教练 / 教师 / KOL,带白标
- 关联 OPC 跨境电商方向(stoneyang AI 教育象限)

---

## 项目目录命名

- 项目名: `career-compass-v3`
- 路径: `D:\projects\career-compass-v3`
- 部署 URL(初定): `career-compass-v3.pages.dev`(后续可绑 `career.stoneyang.top` 子域名)
- GitHub repo: 待 stoneyang 决定是否单独建 repo(可与 v2 同 repo 不同分支,也可单独建 `stoneyang0213/career-compass-v3`)

---

**确认门**: 本 PRD 等 stoneyang 在 docs_confirm 门处审完三文档一并确认。
