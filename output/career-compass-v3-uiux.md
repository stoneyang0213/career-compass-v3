# Career Compass v3 · UIUX

**主导专家**: UI + UX
**Super Dev 阶段**: docs
**关联文档**: [research](./career-compass-v3-research.md) / [prd](./career-compass-v3-prd.md) / [architecture](./career-compass-v3-architecture.md)

---

## 设计基调

### 心智锚:不是"心理测评 H5",不是"AI 工具落地页"

参考对象:**16personalities.com** 的版式克制 + **Stripe Atlas** 的工程师审美 + 国内**蓝湖/MasterGo** 的细节质感。**绝对不是**:紫粉渐变 SaaS 着陆页、emoji 满天飞的 H5、AI 模板感的卡片墙。

### 三个不要(memory + super-dev SKILL 强制)

1. **不要 emoji 当图标** — 仅用 Lucide React 图标库(memory `feedback_visual_review_batch.md`)
2. **不要紫粉渐变** — 主色单色稳重
3. **不要默认系统字体** — 中文 Noto Sans SC,英文 Inter,代码 JetBrains Mono

---

## 设计 Token

### 配色(单色稳重,不渐变)

```css
:root {
  /* Brand */
  --color-brand: #2D5F8B;         /* 罗盘蓝(深一档,职业感) */
  --color-brand-hover: #1F4A6F;
  --color-brand-light: #E8F0F7;
  --color-brand-muted: #5A85A8;

  /* Surface */
  --color-bg: #FAFAF7;            /* 暖白(略带米色,不是纯白) */
  --color-surface: #FFFFFF;
  --color-surface-warm: #F4F2EC;  /* 章节卡背景 */

  /* Text */
  --color-text-primary: #1C2128;
  --color-text-secondary: #4D5560;
  --color-text-muted: #8B939E;

  /* Accent(强调,仅用于报告页 matchScore badge / 推荐高亮) */
  --color-accent: #C97A4A;        /* 赭石橙(克制) */

  /* Semantic */
  --color-success: #2D7D5F;
  --color-warning: #B88A2C;
  --color-error: #9B3838;

  /* Border + Shadow */
  --color-border: #E5E3DC;
  --shadow-sm: 0 1px 2px rgba(28,33,40,0.04);
  --shadow-md: 0 4px 12px rgba(28,33,40,0.08);
  --shadow-lg: 0 12px 32px rgba(28,33,40,0.12);
}
```

**为什么不用 v2 的配色**: v2 配色 stoneyang 没看过最终上线版本(被 change 2 中断),v3 直接重新定 token,避免被 v2 半成品的视觉污染。

### 字体

```css
--font-display: "Inter", "Noto Sans SC", -apple-system, sans-serif;
--font-body: "Noto Sans SC", "Inter", -apple-system, sans-serif;
--font-mono: "JetBrains Mono", "SF Mono", Consolas, monospace;
```

**字号(中文优先)**:
- 大标题(H1):2.5rem / 700 weight / line-height 1.2
- 章节标题(H2):1.75rem / 600 / 1.3
- 题目(H3):1.25rem / 500 / 1.5
- 选项 / 正文:1rem / 400 / 1.6
- 辅助说明:0.875rem / 400 / 1.5

### 间距

8px 基线,Tailwind 默认 `space-1` 到 `space-12` 全用。卡片内边距统一 `space-6`(24px)。卡片间距 `space-4` 到 `space-6`。

### 图标

- 库:**Lucide React**(`lucide-react` npm package)
- 用法:`import { Compass, Sparkles, ArrowRight, Check } from 'lucide-react'`
- 大小:行内 16px,按钮 18px,标题旁 24px
- **首页 logo 唯一例外**:可以是 Compass(罗盘)图标 + brand 色,作为产品视觉锚

### 圆角

- 输入框 / 按钮:`rounded-md`(6px)
- 卡片:`rounded-lg`(8px)
- 大区块:`rounded-xl`(12px)

### 阴影

- 静态卡片:`shadow-sm`
- hover 卡片:`shadow-md` + `translateY(-2px)`
- 模态 / 报告主体:`shadow-lg`

---

## 页面骨架

### 1. 首页(/)

```
┌────────────────────────────────────────────────┐
│  [Compass icon] Career Compass             [→] │  ← 顶部 nav,极简
├────────────────────────────────────────────────┤
│                                                 │
│              你的 AI 时代职业罗盘                │  ← H1
│         15 分钟测评,7000 字深度报告            │  ← 副标
│                                                 │
│              [ 开始测评 →  ]                    │  ← brand 色实心按钮
│                                                 │
│         不需要登录·不存数据·全程免费            │  ← 信任 3 件套
│                                                 │
├────────────────────────────────────────────────┤
│   这份报告会回答的 3 个问题:                    │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│   │ Compass  │ │ Sparkles │ │ Target   │      │
│   │ 我适合干 │ │ AI 时代  │ │ 下一步   │      │
│   │ 什么?    │ │ 怎么不被 │ │ 该做什么 │      │
│   │          │ │ 替代?   │ │  ?       │      │
│   └──────────┘ └──────────┘ └──────────┘      │
├────────────────────────────────────────────────┤
│   测评工具:Holland · MBTI · Super 价值观        │
│   报告模型:GLM-5.1 (备选 Kimi-K2.6)            │
│   报告字数:7000+ 中文字                        │
└────────────────────────────────────────────────┘
```

**关键 UX 决策**:
- 首屏只放 1 个 CTA "开始测评",**不放二级链接** — MVP 阶段不分散注意力
- "不需要登录·不存数据·全程免费"必须在首屏 — 解决初次访问者的隐私担忧
- 3 个 icon-card 解释报告价值,不是"卖测评工具",是"卖结果"

### 2. 测评章节(/assess/chapter/[1-5])

通用骨架:

```
┌────────────────────────────────────────────────┐
│  [Compass icon] Career Compass     退出 [X]    │
├────────────────────────────────────────────────┤
│  ●●●○○                          章 3 / 5       │  ← 进度条 + 章号
│                                                 │
│           价值观测评                            │  ← 章标题(H2)
│  Super 职业价值观量表 · 15 题 · 预计 5 分钟    │  ← 章副标
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 1. 你期望在工作中拥有自由安排时间的能力。  │ │
│  │                                            │ │
│  │ ○ 完全不重要  ○ 较不重要  ● 一般           │ │
│  │ ○ 较重要      ○ 非常重要                  │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 2. ...                                     │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [ ← 上一章 ]              [ 下一章 →  ]       │
└────────────────────────────────────────────────┘
```

**关键 UX 决策**:
- 进度条用 5 个圆点(已完成实心、当前空心 brand 色、未开始灰色),**不要百分比** — 测评是离散的章节,不是 loading
- 题目卡片 hover 显示 box-shadow,选中后整卡片浅 brand-light 背景
- "下一章"按钮在所有题答完后才激活;没答完按下显示"还有 X 题未作答"红色提示
- 章节切换时 fade-in 不要 slide,**克制** — 测评不是游戏
- 答题状态自动存 localStorage,**不显示"已保存"提示**(干扰)— 但顶部偶尔(每 5 题)给个一闪即过的"进度已自动保存"

### 章 4(个人情境)特殊处理

```
┌───────────────────────────────────────────────┐
│  把你的现状告诉我                              │
│                                                 │
│  年龄:        [ 24 ▼ ]                         │
│  教育阶段:    [ 在校探索 ▼ ]                   │
│                ↓ 选项:在校探索 / 刚毕业 / ...  │
│  目标工作地:  [ 不限 / 输入城市 ]              │
│                                                 │
│  还有什么想让我知道的吗?(选填,300字以内)    │
│  ┌─────────────────────────────────────────┐   │
│  │ 我想转去做产品经理,但担心年龄...        │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### 章 5(深度反思 dimensions)

```
3 个开放题,每题字数下限 50,自由文本输入,placeholder 给提示。
```

### 3. 报告页(/report)

**这是 v3 的核心创新页面 — streaming 体验**。

```
┌────────────────────────────────────────────────┐
│  [Compass icon] Career Compass                 │
├────────────────────────────────────────────────┤
│                                                 │
│  你的职业罗盘报告                              │  ← H1
│  基于 Holland (ARS) · MBTI (INFP) · 价值观 ... │  ← 用户分类摘要
│  生成于 2026-05-24 12:00 · 模型 GLM-5.1        │  ← 报告元信息
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Executive Summary                        │   │
│  │                                          │   │
│  │ Kelly,18 岁,惠顿大学艺术与计算机双学 │   │  ← stream 出来的文字,
│  │ 位在读,目前处于「在校探索」阶段——这是│   │     一字一字打出来
│  │ 一份在专业广度与个人偏好上都相当清晰、 │   │
│  │ 但商业方向尚未定型的复合画像。MBTI 为   │   │
│  │ INFP(内倾、直觉、情感、感知,各维度...│   │
│  │ ▌                                       │   │  ← 光标闪烁
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [Loading 等其它 section 写完]                  │
│                                                 │
│  [ 复制全文 ]  [ 打印为 PDF ]   生成中...      │
└─────────────────────────────────────────────────┘
```

**streaming 渲染关键设计**:

- 第一个 chunk 到达前(< 5s):显示 skeleton + 一句"正在为你生成深度报告,大约需要 4-5 分钟,期间可以离开页面再回来"
- 第一个 chunk 到达后:文字逐 token 显示,**带 markdown 实时解析**(react-markdown);blinking cursor `▌` 在末尾
- 每生成完一个 section(`## ` 标题):section 卡片 fade-in border + shadow
- 报告完成(收到 `event:"done"`):cursor 消失,底部按钮从"生成中..."变"复制全文 / 打印为 PDF / 重新生成"

**降级体验**(parseOk 失败时):
- 失败定义:LLM 输出无法解析为预期结构,但**文字本身完整**
- 处理:仍显示完整文字流,只是没有结构化卡片切分,纯 markdown 长文档
- 不显示错误 — 用户感知不到降级

**断点恢复**(MVP 不做,留 v3.1):
- localStorage 存"已生成片段"
- 5 分钟内回到 /report 页可继续看历史
- 如果 stream 中断 > 20s,显示"中断,请重新提交答案"按钮

---

## 组件清单

| 组件 | 类型 | 文件 | 用途 |
|---|---|---|---|
| `Logo` | Astro 静态 | `components/Logo.astro` | 顶部 brand 锚 |
| `Nav` | Astro 静态 | `components/Nav.astro` | 顶部 nav,极简 |
| `ProgressDots` | Astro 静态 | `components/ProgressDots.astro` | 章节进度 5 点 |
| `Button` | Astro 静态 | `components/Button.astro` | 复用 brand / ghost / disabled 三态 |
| `QuestionLikert` | React 岛屿 | `components/QuestionLikert.tsx` | 5 选项 Likert(holland / values 用) |
| `QuestionMBTI` | React 岛屿 | `components/QuestionMBTI.tsx` | 二选一(mbti 用) |
| `QuestionDimensions` | React 岛屿 | `components/QuestionDimensions.tsx` | 自由文本 + 字数提示(章 5) |
| `ProfileForm` | React 岛屿 | `components/ProfileForm.tsx` | 章 4 个人情境表单 |
| `ReportStream` | React 岛屿 | `components/ReportStream.tsx` | streaming 渲染 |
| `IconButton` | Astro 静态 | `components/IconButton.astro` | Lucide icon + label 复用 |

---

## 交互状态(必须覆盖)

| 状态 | 设计 |
|---|---|
| 空状态 — 章节未答 | "还有 X 题未作答" 灰提示,"下一章"按钮 disabled |
| 加载态 — 章节切换 | fade-in 100ms,**不放 loading spinner**(切换太快没意义) |
| 加载态 — 报告生成 | 第一 token 前 skeleton + 一句话提示;之后 streaming + cursor |
| 错误态 — 网络中断 | toast 提示"网络中断,自动重试中"3 秒后自动 retry 一次;仍失败显示完整错误 modal |
| 错误态 — LLM 失败 | report 页显示 "模型响应失败,正在切换备用模型 Kimi-K2.6..."(显式告诉用户) |
| 成功态 — 报告完成 | 顶部 banner "报告已完成,共 7800 字,模型 GLM-5.1,耗时 4 分 12 秒" |
| 禁用态 — 按钮 | opacity 0.4 + cursor not-allowed,不要 grey-out 看不见 |
| Hover 态 | border-color 变 brand,box-shadow 加深,**不要变形 scale** |

---

## 响应式

- 移动端断点:< 768px
- 平板:768-1024px
- 桌面:> 1024px

**移动端关键调整**:
- 章节卡片满宽(去掉左右 margin)
- 题目选项变上下排列(不是横排 5 个)
- 报告页 stream 字号 0.95rem(密度更高方便手机看)
- 顶部 nav 简化,只留 logo + 章节进度

---

## A11y(无障碍)

MVP 最少要做的:

- 所有按钮 + 链接键盘可达(`Tab` 顺序合理)
- 颜色对比度 ≥ AA(brand 蓝 #2D5F8B on 白:对比度 7.5:1 ✅)
- 题目选项加 `aria-label`,radio group 用语义化 `<input type="radio">`
- 报告 stream 区域 `role="status"` + `aria-live="polite"` — 屏幕阅读器读出来

**不做**:full WCAG AAA 审计 / 屏幕阅读器全程测试 / 手语视频。MVP 验证型先不上。

---

## 设计参考资源(给 stoneyang 视觉对齐用)

- **版式克制**: https://www.16personalities.com/cn
- **工程师审美**: https://stripe.com/atlas
- **报告页 streaming 体验**: ChatGPT / Claude 的对话流(报告页就模仿这个,但不是对话框,是单页长报告)
- **罗盘 / 测评的视觉锚**: Compass icon from Lucide,brand 色单色,**不要拟物罗盘 SVG 那种 H5 味**

---

## 与 v2 UI 的差异点

| 维度 | v2 实际 | v3 决策 |
|---|---|---|
| 配色 | 多色尝试(未最终上线) | 单 brand 蓝 + 1 accent 赭石,克制 |
| 进度条 | 章节顶部进度条(% 或文字) | 5 圆点(离散感) |
| 报告交付 | 异步邮件(change 2)/ 同步 stream(change 1) | 完全只走同步 stream |
| 章节过渡 | 有 prompt-interlude(过渡话) | 保留(复用 v2 prompt-interlude.ts) |
| 报告页 | 渲染完整 markdown(静态) | streaming 一字一字渲染(动态) |
| 字体 | 默认系统字体 | Inter + Noto Sans SC + JetBrains Mono |

---

## stoneyang 拍板结果(2026-05-24)

1. **brand 主色**: 罗盘蓝 `#2D5F8B` ✅
2. **首页 hero 文案**: "你的 AI 时代职业罗盘"(产品名锚定型) ✅
   - 副标题:"15 分钟测评 7000+ 字报告"
   - 信任 3 件套:"不需要登录·不存数据·免费"
3. **章 5 dimensions**: 3 题全保留 ✅
   - 题 1:择己所爱(兴趣与热情) — 字数下限 50
   - 题 2:择己所长(技能与优势) — 字数下限 50
   - 题 3:择己所利(个人与财务目标) — 字数下限 50
   - 合计字数下限 150 字
   - icon 替换:v2 用了 emoji(💖💪💰),v3 强制走 Lucide React(`Heart` / `Dumbbell` / `Wallet`)
4. **报告页"重新生成"按钮**: MVP 不提供,如果用户反馈强再加(保持 v2 决策)

---

**确认门**: 本 UIUX 等 stoneyang 在 docs_confirm 门处审完三文档一并确认。
