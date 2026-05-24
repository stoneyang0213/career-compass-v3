---
name: super-dev-seeai
description: Super Dev SEEAI competition mode for fast, high-quality showcase delivery under tight time limits
when-to-use: Use when the user says /super-dev-seeai, super-dev-seeai:, or super-dev-seeai： followed by a requirement. Activate the competition fast mode.
allowed-tools: Read, Edit, Write, Bash
user-invocable: true
version: 2.4.0
argument-hint: requirement description
hooks:
  PreToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: "python3 -c \"import sys,re,json;d=json.loads(sys.stdin.read());c=d.get('tool_input',{}).get('content','')or d.get('tool_input',{}).get('new_string','')or'';p=d.get('tool_input',{}).get('file_path','');e=p.rsplit('.',1)[-1]if '.' in p else'';print(json.dumps({'decision':'block','reason':'Super Dev: emoji detected in '+e+' file, use icon library'}if e in('tsx','ts','jsx','js','vue','svelte')and bool(re.search(r'[\\u2600-\\u27BF\\U0001F300-\\U0001FAFF]',c))else{}))\""
          timeout: 5
---
# Super Dev SEEAI - 赛事极速版

## 关键约束提醒（每次操作前必读）

以下规则在整个开发过程中始终有效，不得以任何理由违反：

1. **图标系统**: 功能图标只能来自 Lucide / Heroicons / Tabler 图标库。绝对禁止使用 emoji 表情 作为功能图标、装饰图标或临时占位。如果你发现自己即将输出包含 emoji 的 UI 代码，停下来，改用图标库组件。

2. **AI 模板化禁令**: 禁止紫/粉渐变主色调、禁止 emoji 图标、禁止无信息层级的卡片墙、禁止默认系统字体直出。

3. **代码即交付**: 不允许“先用 emoji 顶上后面再换”。图标库必须在第一行 UI 代码前就锁定。

4. **自检规则**: 在向用户展示任何 UI 代码或预览前，必须自检源码中不存在任何 emoji 字符（Unicode range U+2600-U+27BF, U+1F300-U+1FAFF）。发现后先替换为正式图标库再继续。

## 触发方式与命令路由（强制）

用户在宿主内使用比赛专用入口：`/super-dev-seeai <需求>` 或 `super-dev-seeai: <需求>` / `super-dev-seeai：<需求>`。
该入口进入 Super Dev SEEAI 赛事极速版，而不是标准 Super Dev 长流程。

### SEEAI 模式行为
- 保留 research / 三文档 / docs confirm / spec。
- 文档必须压缩成比赛短版，不走标准重治理模板。
- Spec 确认后直接进入前后端一体化快速开发，不再拆 preview confirm。
- 最终必须给出一个可演示、可讲解、视觉完成度够高的作品。
- 默认目标不是“工程最完整”，而是“在评审时间内最好看、最好讲、最容易演示”。


## Runtime Contract（强制）

- Super Dev SEEAI 是比赛专用的快速工作版，目标是在极短时间内交付高完成度展示作品。
- 当前宿主负责调用模型、联网、终端、编辑器与实际代码修改。
- 需要研究、设计、编码、运行、调试时，优先使用宿主自身能力。
- 文档与 Spec 仍然保留，但必须压缩，避免标准模式的重流程拖慢节奏。
- 研究和文档不是为了治理完美，而是为了锁定作品类型、wow 点、实现边界和时间盒取舍。
- 默认遵循一个简单优先级：先保住可演示主路径，再做 wow 点，最后才做额外工程深度。


## 首轮响应契约（强制）

- 首次触发时第一轮回复必须说明：Super Dev SEEAI 赛事模式已激活，当前阶段是 `research`。
- 先快速理解需求，再做极短顺位思考：作品类型、评委 wow 点、必须完成项、主动放弃项。
- 如果用户需求模糊，最多只补 1 个关键问题；能合理假设时直接给出假设并推进，不展开长澄清。
- 先完成 fast research，再写 compact research / PRD / architecture / UIUX。
- 文档确认后创建 compact Spec，然后直接进入 full-stack sprint。
- 不要在 SEEAI 模式里重新切回标准 Super Dev 的 preview confirm / 长质量闭环。
- 若会落盘 workflow state，必须把 `flow_variant = seeai` 一起写入。


## 首轮输出模板（强制）

SEEAI 首轮回复不要展开成长讨论。优先用极短结构锁定范围，然后立即进入 research：

- `作品类型`：官网类 / 小游戏类 / 工具类，三选一。
- `评委 wow 点`：本次成品最值得被记住的一个亮点。
- `P0 主路径`：半小时内必须真正跑通的一条演示路径。
- `主动放弃项`：本轮明确不做的部分，避免范围失控。
- `关键假设`：只有在用户没说清时才写，最多 1 到 2 条。

- `评委 wow 点` 要聚焦一个能被截图、讲解或实际操作看到的瞬间。
- 锁定 `作品类型` 后，必须立刻选 1 套比赛设计包，不允许自由混搭到页面变丑。
如果需求不缺关键信息，就不要反问。直接按这个模板给出判断，然后开始 fast research 和 compact 文档。

## SEEAI 顺位思考与联网研究协议（强制）

比赛里 research 不是写长分析，而是用最短时间做出正确决策。顺位思考和联网搜索必须直接服务于范围压缩和稳定交付。

### Research 优先级
- 先判断题型和复杂度，不先讨论实现细节。
- 联网搜索优先找 3 类信息：视觉参考、交互参考、技术风险参考。
- 研究结论必须收敛到 wow 点、P0 主路径、主动放弃项、回退栈四个决策。
- 不做长竞品报告；研究的目标是帮助 10 分钟内定方向，而不是堆资料。

### 联网搜索默认方向
- 同类题目的高完成度展示案例
- 当前题型最容易打动评委的首屏/核心交互
- 目标技术栈在 30 分钟内最常见的初始化或运行风险

research 结束前，至少要回答清楚：这题属于什么题型/复杂度、wow 点是什么、P0 主路径是什么、主动放弃什么、回退栈是什么。

## 比赛短文档模板（强制）

SEEAI 的文档必须真实落盘到 `output/*`，但只保留比赛需要的信息：

- `research.md`：题目理解、参考风格、Wow 点、主动放弃项。
- `prd.md`：作品目标、P0 主路径、P1 Wow 点、P2 可选项、非目标。
- `architecture.md`：主循环、技术栈、数据流、最小后端、降级方案。
- `uiux.md`：视觉方向、首屏/主界面、关键交互、动效重点、设计 Token。
- `spec`：只保留一个 sprint 清单，按 `P0 -> P1 -> polish` 排序。

### 推荐标题骨架
- `research.md`：`# 题目理解` `# 参考风格` `# Wow 点` `# 主动放弃项`
- `prd.md`：`# 作品目标` `# P0 主路径` `# P1 Wow 点` `# P2 可选项` `# 非目标`
- `architecture.md`：`# 主循环` `# 技术栈` `# 数据流` `# 最小后端` `# 降级方案`
- `uiux.md`：`# 视觉方向` `# 首屏/主界面` `# 关键交互` `# 动效重点` `# 设计 Token`
- `spec`：`# Sprint Checklist` 下只列 `P0`、`P1`、`Polish`

不要把文档写成长方案、长竞品分析或完整工程规划。文档存在的目的，是帮你更快做出更像成品的作品。

## SEEAI 比赛设计系统（强制）

SEEAI 不是自由发挥式 UI。进入比赛模式后，必须先选 1 套视觉包，再推进文档和实现。

### 统一视觉守卫
- 先选题型，再选设计包，再冻结 Hero、卡片、按钮、动效层级。
- 禁止把多个设计包混着用，导致页面脏乱或像临时拼装。
- 禁止默认紫粉渐变、默认系统字体、通用 AI 模板 Hero。
- 首屏必须能截图当宣传图，结果页或结束态必须能截图当演示亮点。

### Arena Neon
- 适用：比赛海报气质、强科技展示页、海洋/竞技题、抓眼 Hero
- 字体：Rajdhani + Manrope，标题高对比、正文紧凑，避免默认系统字。
- 色彩：黑底 + 深海绿 + 电光青 + 少量热红点缀，不用紫粉渐变。
- 动效：强入场光束、数字跳变、重点 hover glow，控制在 2-3 个记忆点。
- 组件方向：大 Hero、硬朗卡片、数据 HUD、发光 CTA、清晰分区层级。
- 守卫：不要把整页都做成霓虹夜店风，只允许 Hero 和关键模块承担高强度效果。

### Clean Product
- 适用：工具类、企业官网、效率产品、评委需要快速读懂价值的场景
- 字体：Space Grotesk + Inter，标题简洁，正文强调秩序和可读性。
- 色彩：暖白/浅灰底 + 碳黑文本 + 冷蓝或湖青强调，干净但不寡淡。
- 动效：短位移动画、数字递进、结果区 reveal，少而准。
- 组件方向：强网格、留白、结果卡、对比模块、主 CTA 和证据信任区。
- 守卫：不能退化成普通 SaaS 模板，必须保留一个高辨识 Hero 或结果展示。

### Playful Motion
- 适用：小游戏、互动作品、轻娱乐 demo、带反馈的趣味工具
- 字体：Sora + DM Sans，标题圆润，正文轻快，适合高反馈界面。
- 色彩：墨黑或奶油底 + 青绿/橙黄对比，强调可玩反馈，不用粉紫套路。
- 动效：弹性反馈、粒子/积分飞字、胜负动画、按钮按压回弹。
- 组件方向：大按钮、状态 HUD、胜负态、反馈层和复玩入口要清楚。
- 守卫：动效不能喧宾夺主，主循环必须先稳，再补趣味反馈。


## SEEAI 执行守卫（强制）

比赛里最致命的问题不是功能少，而是项目起不来、主路径跑不通、卡死在初始化。SEEAI 必须先防错，再求炫。

### 快而稳的执行铁律
- 先选最稳的已知技术栈，不为了炫技引入初始化重、配置重、调试重的方案。
- 默认优先零配置或成熟脚手架，依赖数量越少越好，能不用就不用。
- 12 分钟内必须跑出第一个可见、可点击、可截图的运行界面，不能一直停留在初始化。
- 先打通主路径，再补 wow 点；主路径没跑通前，不做长尾功能和高级工程化。
- 外部 API、数据库、鉴权、支付、上传不是评审主轴时，一律降级为 mock 或本地状态。

### 模块真实生效规则
- 比赛模式默认只保留 1 到 3 个真正参与演示的核心模块，模块越少越容易做实。
- 每个保留下来的模块都必须真实启动、真实渲染、真实可交互，并进入主演示路径。
- 禁止保留只有壳子、点不开、没有数据、没有调用链的假模块或占位模块。
- 20 分钟前仍未接入主路径的模块，默认降级或删除，不允许拖到最后阶段。
- 结果页、结束态、弹窗、排行榜、设置页这类附加模块，只有真实服务主路径时才保留。

### 失败优先回退协议
- 初始化失败一次后，立刻切到更轻的备选栈，不在原栈上死磕。
- 如果构建链卡住，优先回退到 Vite、CDN、Canvas 或静态数据方案，先把作品跑起来。
- 任何功能连续两次调试不过，就立刻降级复杂度，保住演示闭环。
- 最后 5 分钟只允许修阻断演示的问题，不再新增功能。


## SEEAI 复杂题压缩规则（强制）

比赛题目不可能被提前穷举。SEEAI 不应该依赖题库，而要依赖通用压缩原则：先识别复杂度，再把需求压成 30 分钟能交付的 demo slice。

### 通用压缩原则
- 如果需求像完整操作系统、完整社交平台、完整电商、完整游戏宇宙，先压成 1 个可讲解的主演示切片，不做全量复刻。
- 如果用户要复刻老系统或大产品，先做最有记忆点的 1 个主界面 + 1 到 2 个真实可交互核心动作。
- 如果需求天然跨前端、后端、数据、AI、多终端，先收成单终端单主流程，再决定是否补最小后端。
- 比赛模式默认做 demo slice，不做 production scope；范围大的题必须主动写出放弃项。

### 常见复杂度模式
- 模式：系统/桌面/操作系统/IDE/复杂软件复刻
  压缩方式：压成一个高辨识主界面 + 1 到 2 个真实可交互核心动作 + 一个结束态或彩蛋。
  原因：这类题初始化和状态管理过重，比赛里只能做最有记忆点的交互切片。
- 模式：平台/社区/电商/门户型大产品
  压缩方式：压成一个最核心的用户主路径 + 一个互动亮点 + 一个可信结果页/详情页。
  原因：这类题页面和角色太多，比赛里要优先保住最值钱的一段用户旅程。
- 模式：3D/开放世界/重模拟/多系统游戏
  压缩方式：压成一个单场景 demo：进入场景、一个核心交互、一个结算/彩蛋/反馈高潮。
  原因：这类题内容量和初始化成本都过大，必须收成单场景体验。
- 模式：多角色协作/多 Agent/全链路企业系统
  压缩方式：压成一个主角色主流程，只保留 1 个关键协作点做演示，不做全角色全权限。
  原因：角色、权限、后端链路过长，比赛里应该只展示最有说服力的主流程。

如果遇到未见过的新题，仍按这个顺序处理：识别题型 -> 识别复杂度 -> 砍成主演示切片 -> 锁回退栈 -> 立即开做。

## 技术栈快速决策矩阵（核心）

收到题目后，根据作品类型**立刻**选择技术栈。不纠结，不混搭。

### 决策树

```
题目类型？
|-- 小游戏 / 互动动画
|   |-- 纯2D休闲 -> HTML Canvas + Vanilla JS（零依赖，开箱即用）
|   |-- 复杂2D游戏 -> Phaser.js（场景管理、物理引擎、精灵动画一体化）
|   `-- 3D/沉浸感 -> Three.js + React Three Fiber（如果用React）
|
|-- 官网 / 展示页 / 落地页
|   |-- 纯静态展示 -> HTML + Tailwind CDN + GSAP/Framer Motion
|   |-- 需要路由/多页 -> React + Vite + Tailwind + Framer Motion
|   `-- 需要SSR/SEO -> Next.js + Tailwind + Framer Motion
|
|-- 工具 / 应用
|   |-- 纯前端工具 -> React + Vite + Tailwind + Zustand
|   |-- 需要后端API -> React前端 + Express/Fastify后端
|   `-- 实时协作 -> React + Socket.io / WebSocket
|
`-- 数据看板 / 可视化
    |-- 简单图表 -> React + Recharts / Chart.js
    |-- 复杂交互 -> React + D3.js
    `-- 实时数据 -> React + ECharts + WebSocket
```

### 赛事推荐组合（已验证能30分钟内交付）

| 组合 | 适用场景 | CDN快速启动 | 需要构建 |
|------|---------|------------|---------|
| **HTML+Tailwind CDN+GSAP** | 展示页/官网 | 是 | 否 |
| **React+Vite+Tailwind+Framer** | 工具/应用/多页 | 否 | 是 |
| **HTML Canvas+Vanilla JS** | 2D小游戏/互动 | 是 | 否 |
| **Phaser.js** | 复杂2D游戏 | 是 | 否 |
| **Three.js** | 3D展示/沉浸 | 是 | 否 |

**赛事铁律**: 能用 CDN 零构建的优先用 CDN，省掉构建和配置时间。


## 小游戏开发模板库（核心）

### 模板1: HTML Canvas 游戏骨架
适用于所有 2D 休闲游戏（贪吃蛇、打砖块、弹球、飞机大战等）。
骨架包含：Canvas 初始化、游戏主循环、HUD、菜单/结束 Overlay、localStorage 最高分。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GAME_TITLE</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a0a; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: 'Inter', sans-serif; }
    #gameContainer { position: relative; }
    canvas { display: block; border-radius: 12px; box-shadow: 0 0 40px rgba(59,130,246,0.3); }
    #hud { position: absolute; top: 0; left: 0; right: 0; padding: 16px 24px; display: flex; justify-content: space-between; color: #fff; font-size: 14px; font-weight: 600; pointer-events: none; z-index: 10; }
    #overlay { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; background: rgba(0,0,0,0.8); border-radius: 12px; z-index: 20; transition: opacity 0.3s; }
    #overlay.hidden { opacity: 0; pointer-events: none; }
    #overlay h1 { color: #fff; font-size: 36px; margin-bottom: 8px; }
    #overlay p { color: #94a3b8; margin-bottom: 24px; }
    #overlay button { padding: 12px 32px; border: none; border-radius: 8px; background: #3b82f6; color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; transition: transform 0.15s, background 0.15s; }
    #overlay button:hover { transform: scale(1.05); background: #2563eb; }
    .score-display { background: rgba(255,255,255,0.1); padding: 6px 16px; border-radius: 20px; backdrop-filter: blur(8px); }
  </style>
</head>
<body>
  <div id="gameContainer">
    <canvas id="gameCanvas"></canvas>
    <div id="hud">
      <div class="score-display">Score: <span id="score">0</span></div>
      <div class="score-display">Level: <span id="level">1</span></div>
      <div class="score-display">Best: <span id="best">0</span></div>
    </div>
    <div id="overlay">
      <h1>GAME_TITLE</h1>
      <p>游戏描述</p>
      <button id="startBtn">Start Game</button>
    </div>
  </div>
  <script>
    const CONFIG = { width: 800, height: 600, bgColor: '#0a0a0a', accentColor: '#3b82f6', fps: 60 };
    const STATE = { MENU: 0, PLAYING: 1, PAUSED: 2, OVER: 3 };
    let gameState = STATE.MENU, score = 0, level = 1;
    let bestScore = parseInt(localStorage.getItem('game_best') || '0');
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = CONFIG.width; canvas.height = CONFIG.height;
    const keys = {};
    document.addEventListener('keydown', e => { keys[e.key] = true; e.preventDefault(); });
    document.addEventListener('keyup', e => { keys[e.key] = false; });
    let lastTime = 0;
    function gameLoop(timestamp) {
      const dt = (timestamp - lastTime) / 1000; lastTime = timestamp;
      ctx.fillStyle = CONFIG.bgColor;
      ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
      if (gameState === STATE.PLAYING) { update(dt); draw(); }
      requestAnimationFrame(gameLoop);
    }
    function update(dt) { /* game logic */ }
    function draw() { /* render */ }
    function addScore(pts) {
      score += pts;
      document.getElementById('score').textContent = score;
      if (score > bestScore) {
        bestScore = score; localStorage.setItem('game_best', bestScore);
        document.getElementById('best').textContent = bestScore;
      }
    }
    function startGame() {
      score = 0; level = 1; gameState = STATE.PLAYING;
      document.getElementById('overlay').classList.add('hidden');
    }
    function gameOver() {
      gameState = STATE.OVER;
      const o = document.getElementById('overlay');
      o.classList.remove('hidden');
      o.querySelector('h1').textContent = 'Game Over';
      o.querySelector('p').textContent = 'Final Score: ' + score;
      o.querySelector('button').textContent = 'Play Again';
    }
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('best').textContent = bestScore;
    requestAnimationFrame(gameLoop);
  </script>
</body>
</html>
```

### 模板2: 碰撞检测工具箱

```javascript
// 矩形碰撞
function rectCollision(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
// 圆形碰撞
function circleCollision(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return dx*dx + dy*dy < (a.r + b.r) * (a.r + b.r);
}
// 粒子效果
class Particle {
  constructor(x, y, color) {
    this.x=x; this.y=y; this.vx=(Math.random()-0.5)*8; this.vy=(Math.random()-0.5)*8;
    this.life=1; this.decay=0.02+Math.random()*0.03; this.size=2+Math.random()*4; this.color=color;
  }
  update() { this.x+=this.vx; this.y+=this.vy; this.life-=this.decay; this.vy+=0.1; }
  draw(ctx) {
    ctx.globalAlpha=this.life; ctx.fillStyle=this.color;
    ctx.fillRect(this.x-this.size/2, this.y-this.size/2, this.size, this.size);
    ctx.globalAlpha=1;
  }
  get dead() { return this.life <= 0; }
}
```

### 模板3: 常见游戏模式速查

| 游戏类型 | 核心循环 | 关键对象 | 反馈重点 |
|---------|---------|---------|---------|
| 贪吃蛇 | 移动->吃食->变长->碰撞检测 | 蛇身数组、食物坐标 | 吃到食物闪烁、蛇身渐变色 |
| 打砖块 | 发球->挡板->砖块碰撞 | 挡板、球、砖块网格 | 砖块破碎粒子、连击特效 |
| 飞机大战 | 移动->射击->躲避->Boss | 玩家飞机、敌机数组、子弹数组 | 爆炸粒子、屏幕震动 |
| 消除游戏 | 选择->匹配->消除->下落 | 网格数组、选中状态、动画队列 | 消除爆炸、连锁得分飞字 |
| 跑酷 | 跳跃->障碍->加速->距离 | 角色、障碍物队列、地面 | 跳跃拉伸、落地压缩、速度线 |

### 模板4: 游戏HUD/UI组件

```javascript
// 屏幕震动
function screenShake(intensity=5, duration=200) {
  const c = document.getElementById('gameContainer');
  const start = Date.now();
  function shake() {
    const elapsed = Date.now() - start;
    if (elapsed < duration) {
      const f = 1 - elapsed/duration;
      c.style.transform = `translate(${(Math.random()-0.5)*intensity*f}px,${(Math.random()-0.5)*intensity*f}px)`;
      requestAnimationFrame(shake);
    } else { c.style.transform = ''; }
  }
  shake();
}
// 得分飞字
function floatingText(x, y, text, color='#fbbf24') {
  const el = document.createElement('div');
  el.textContent = text;
  Object.assign(el.style, { position:'absolute', left:x+'px', top:y+'px', color, fontSize:'20px', fontWeight:'bold', pointerEvents:'none', transition:'all 0.8s ease-out', zIndex:'30' });
  document.getElementById('gameContainer').appendChild(el);
  requestAnimationFrame(() => { el.style.top=(y-60)+'px'; el.style.opacity='0'; });
  setTimeout(() => el.remove(), 800);
}
```

### 游戏开发铁律
- 核心玩法循环必须完整：开始->游玩->结束->再来一次
- 反馈感 > 真实物理：夸张的视觉反馈比物理精确更重要
- 操作延迟 < 50ms：任何卡顿都会毁掉游戏体验
- 分数/进度必须实时可见


## 精美页面模板库（核心）

### 设计Token预设（6套赛事验证主题）

#### 主题A: 暗夜科技（适合科技/AI/数据类）
```css
:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #111827;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --accent: #3b82f6;
  --accent-glow: rgba(59,130,246,0.4);
  --gradient-hero: linear-gradient(135deg, #0a0a0f 0%, #1e1b4b 50%, #0a0a0f 100%);
  --card-bg: rgba(17,24,39,0.8);
  --card-border: rgba(59,130,246,0.15);
}
```

#### 主题B: 日出暖橙（适合教育/社交/正能量）
```css
:root {
  --bg-primary: #fffbf5; --bg-secondary: #fef3e2;
  --text-primary: #1c1917; --text-secondary: #78716c;
  --accent: #f97316; --accent-glow: rgba(249,115,22,0.3);
  --gradient-hero: linear-gradient(135deg, #fffbf5 0%, #fed7aa 100%);
  --card-bg: rgba(255,251,245,0.9); --card-border: rgba(249,115,22,0.15);
}
```

#### 主题C: 翡翠绿意（适合环保/健康/生活）
```css
:root {
  --bg-primary: #f0fdf4; --bg-secondary: #dcfce7;
  --text-primary: #14532d; --text-secondary: #4d7c0f;
  --accent: #16a34a; --accent-glow: rgba(22,163,74,0.3);
  --gradient-hero: linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 100%);
  --card-bg: rgba(240,253,244,0.9); --card-border: rgba(22,163,74,0.15);
}
```

#### 主题D: 极简黑白（适合工具/效率/专业）
```css
:root {
  --bg-primary: #fafafa; --bg-secondary: #f4f4f5;
  --text-primary: #18181b; --text-secondary: #71717a;
  --accent: #18181b; --accent-glow: rgba(24,24,27,0.1);
  --gradient-hero: linear-gradient(180deg, #fafafa 0%, #e4e4e7 100%);
  --card-bg: #ffffff; --card-border: rgba(24,24,27,0.08);
}
```

#### 主题E: 深海蓝绿（适合海洋/探索/游戏）
```css
:root {
  --bg-primary: #042f2e; --bg-secondary: #134e4a;
  --text-primary: #ccfbf1; --text-secondary: #5eead4;
  --accent: #14b8a6; --accent-glow: rgba(20,184,166,0.4);
  --gradient-hero: linear-gradient(135deg, #042f2e 0%, #0f766e 50%, #042f2e 100%);
  --card-bg: rgba(19,78,74,0.6); --card-border: rgba(20,184,166,0.2);
}
```

#### 主题F: 赛博朋克（适合潮流/音乐/创意）
```css
:root {
  --bg-primary: #0c0015; --bg-secondary: #1a002e;
  --text-primary: #f0e6ff; --text-secondary: #c084fc;
  --accent: #e879f9; --accent-secondary: #06ffa5;
  --accent-glow: rgba(232,121,249,0.4);
  --gradient-hero: linear-gradient(135deg, #0c0015 0%, #2d1b69 50%, #0c0015 100%);
  --card-bg: rgba(26,0,46,0.8); --card-border: rgba(232,121,249,0.2);
}
```

**禁止使用**: 紫粉渐变、默认蓝色模板感配色。

### 动效预设工具箱

```javascript
// 1. 滚动渐入（Intersection Observer）
function setupScrollReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting) { e.target.classList.add('revealed'); observer.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
// CSS: .reveal { opacity:0; transform:translateY(30px); transition:all 0.6s cubic-bezier(0.16,1,0.3,1); }
// .reveal.revealed { opacity:1; transform:translateY(0); }

// 2. 数字滚动动画
function animateNumber(el, target, duration=1500) {
  const start = parseInt(el.textContent)||0; const t0 = performance.now();
  function update(now) {
    const p = Math.min((now-t0)/duration, 1);
    const eased = 1 - Math.pow(1-p, 3);
    el.textContent = Math.round(start + (target-start)*eased).toLocaleString();
    if(p<1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// 3. 鼠标跟随光晕
function setupCursorGlow(container) {
  const glow = document.createElement('div');
  Object.assign(glow.style, { position:'absolute', width:'400px', height:'400px',
    borderRadius:'50%', pointerEvents:'none',
    background:'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
    transform:'translate(-50%,-50%)', zIndex:'0', opacity:'0.6' });
  container.style.position = 'relative';
  container.appendChild(glow);
  container.addEventListener('mousemove', e => {
    const r = container.getBoundingClientRect();
    glow.style.left = (e.clientX-r.left)+'px';
    glow.style.top = (e.clientY-r.top)+'px';
  });
}

// 4. 打字机效果
function typeWriter(el, text, speed=60) {
  let i = 0; el.textContent = '';
  function type() { if(i<text.length) { el.textContent += text.charAt(i++); setTimeout(type, speed); } }
  type();
}

// 5. 卡片3D倾斜
function setupTiltCard(card, intensity=15) {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX-r.left)/r.width - 0.5;
    const y = (e.clientY-r.top)/r.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x*intensity}deg) rotateX(${-y*intensity}deg) scale(1.02)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
}
```

### Hero区域模板（3种高转化布局）

#### Hero A: 大标题+CTA+背景动画（通用）
```html
<section style="min-height:100vh;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;background:var(--bg-primary)">
  <div style="position:absolute;inset:0;opacity:0.5;background:var(--gradient-hero)"></div>
  <div style="position:relative;z-index:10;text-align:center;max-width:800px;padding:0 24px">
    <div style="display:inline-block;padding:6px 16px;border-radius:20px;background:var(--accent);color:#fff;font-size:13px;font-weight:600;margin-bottom:24px">Tagline</div>
    <h1 style="font-size:clamp(36px,6vw,72px);font-weight:800;color:var(--text-primary);line-height:1.1;margin-bottom:16px">主标题 <span style="color:var(--accent)">关键词高亮</span></h1>
    <p style="font-size:18px;color:var(--text-secondary);margin-bottom:32px;max-width:600px;margin-left:auto;margin-right:auto">副标题</p>
    <div style="display:flex;gap:12px;justify-content:center">
      <a href="#cta" style="padding:14px 32px;border-radius:8px;background:var(--accent);color:#fff;text-decoration:none;font-weight:600">Primary CTA</a>
    </div>
  </div>
</section>
```

#### Hero B: 左文右图（产品/工具类）
```html
<section style="min-height:100vh;display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:48px;padding:80px 48px;background:var(--bg-primary)">
  <div>
    <h1 style="font-size:48px;font-weight:800;color:var(--text-primary)">标题</h1>
    <p style="font-size:18px;color:var(--text-secondary);margin-bottom:24px">描述</p>
    <button style="padding:12px 28px;border-radius:8px;background:var(--accent);color:#fff;border:none;font-weight:600;cursor:pointer">Get Started</button>
  </div>
  <div style="aspect-ratio:4/3;border-radius:16px;background:var(--card-bg);border:1px solid var(--card-border)"></div>
</section>
```

#### Hero C: 全屏动态背景+居中标题（展示类）
```html
<section style="height:100vh;display:flex;align-items:center;justify-content:center;position:relative">
  <div style="position:absolute;inset:0;background:var(--gradient-hero);z-index:1"></div>
  <div style="position:relative;z-index:10;text-align:center;color:#fff">
    <h1 style="font-size:clamp(40px,8vw,80px);font-weight:900;text-shadow:0 2px 20px rgba(0,0,0,0.3)">主标题</h1>
    <p style="font-size:20px;max-width:600px;margin:16px auto 0;opacity:0.85">副标题</p>
  </div>
</section>
```

### 页面开发铁律
- 首屏3秒内传达核心价值，不允许普通模板感
- 至少一个让人记住的动效瞬间（鼠标跟随/数字滚动/粒子背景）
- 所有颜色使用 CSS 变量，不硬编码 hex
- 移动端至少可用，桌面端完美


## 赛事文档模板库（核心）

比赛不只看代码，**文档和演示决定最终名次**。以下模板在 Spec 确认后立即生成。

### 模板1: 参赛项目 README

```markdown
# PROJECT_NAME

> 一句话描述项目核心价值（评委3秒内能理解）

## 项目亮点
- 亮点1（技术实现/设计/创新）
- 亮点2
- 亮点3

## 技术栈

| 层级 | 技术 | 选型理由 |
|------|------|----------|
| 前端 | XXX | 快速/美观/生态 |
| 后端 | XXX（如无则写"纯前端"） | 必要性 |
| 数据 | XXX | 轻量/够用 |
| 部署 | XXX | 一键/零配置 |

## 快速开始
```bash
npm install && npm run dev
```

## 功能演示路径
1. 打开首页 -> 看到XXX
2. 点击XXX -> 触发XXX
3. 完成XXX -> 看到结果
```

### 模板2: 技术亮点文档

```markdown
## 1. 创新点：XXX
**问题**: 为什么要做这个
**方案**: 具体怎么实现的
**效果**: 数据/截图/对比

## 2. 技术难点突破：XXX
**挑战**: 遇到什么问题
**解决**: 怎么解决的
**收获**: 学到了什么
```

### 模板3: 演示脚本（30秒版 + 2分钟版）

```markdown
## 30秒电梯演讲
大家好，我们是TEAM_NAME。我们做了PROJECT_NAME。
它解决的核心问题是【痛点】。我们的方案是【一句话方案】。
最大的亮点是【wow点】。谢谢！

## 2分钟完整演示
### 开场（15秒）：我们注意到一个问题... 切到首页展示痛点场景
### 核心演示（60秒）：按功能顺序走一条完整主路径
### 亮点展示（30秒）：展示技术亮点/创新设计
### 总结（15秒）：一句话总结核心价值 + 未来展望

## 演示注意
- 准备备用演示路径（主路径出问题时的Plan B）
- 数据预填充，不要现场输入
- 不依赖网络，本地运行
```

### 模板4: 答辩准备卡

```markdown
## 必答题
1. 技术方案为什么这样选？ -> 性能/生态/时间权衡
2. 再给一周时间优先做什么？ -> 核心体验/用户反馈
3. 最大的技术挑战？ -> 具体问题+解决方案
4. 和竞品相比核心差异？ -> 创新点+用户价值
5. 用户体验有什么特别设计？ -> 细节+数据支撑

## 加分回答（主动提及）
- 我们不只做了功能，还关注了XXX细节
- 我们在有限时间内做了降级方案确保演示稳定

## 减分避免
- 不要说"时间不够所以没做完"
- 不要说"这个功能比较简单"
- 不要说"AI帮我们写的"（改说"我们利用AI辅助提升了开发效率"）
```

### 赛事文档铁律
- 文档必须落盘到 output/* 和项目根目录 README.md
- 技术亮点不能空泛，必须有具体的方案描述
- 演示脚本必须提前演练一遍，确保路径完整无断点
- 答辩回答不要说"时间不够"或"AI写的"


## 作品类型决策模板

进入 SEEAI 后，优先先判断当前更像哪一类题，再决定研究和实现重心：

- 官网类：优先 主视觉、信息密度、滚动节奏、首屏转化。
  默认技术栈：React/Vite 或 Next.js + Tailwind + Framer Motion。
  默认 sprint：Hero/首屏 -> 亮点区/品牌叙事 -> CTA/滚动动效 -> 最终 polish。
  默认设计包：arena_neon / clean_product。
  Hero 策略：首屏必须在 3 秒内说清作品主题、价值和主亮点，优先做强主 KV。
  wow 模式：一个高记忆点 Hero + 一段能被截图传播的中段亮点模块。
  运行检查点：12 分钟内至少跑出可滚动 Hero、一个亮点模块和 CTA。
  回退栈：HTML + Tailwind CDN + GSAP，先做单页强展示，再决定是否补框架。
- 小游戏类：优先 玩法闭环、反馈感、积分胜负、再次游玩。
  默认技术栈：HTML Canvas + Vanilla JS；复杂玩法再上 Phaser。
  默认 sprint：主循环可玩 -> 积分/胜负反馈 -> 特效/音效 -> 复玩和 polish。
  默认设计包：playful_motion / arena_neon。
  Hero 策略：开场 1 步就能进入玩法，开始态和结束态都要能截图。
  wow 模式：一处强反馈动作或结算画面，让评委记住玩法节奏。
  运行检查点：12 分钟内至少跑出开始态、主循环和结束态，能玩一局。
  回退栈：HTML Canvas + Vanilla JS，先保住玩法闭环，再考虑 Phaser。
- 工具类：优先 高价值主流程、输入输出清晰、结果页直观。
  默认技术栈：React + Vite + Tailwind；必要时补最小 Express/Fastify 后端。
  默认 sprint：输入页/主流程 -> 结果页 -> 分享/导出 -> 最终 polish。
  默认设计包：clean_product / arena_neon。
  Hero 策略：首屏必须让评委立刻理解输入什么、得到什么、为什么值得看。
  wow 模式：一个可信且有质感的结果页，结果比输入页更需要打磨。
  运行检查点：12 分钟内至少跑出输入页到结果页的一条闭环。
  回退栈：React + Vite + 本地状态 + mock 数据，后端只在主轴依赖时才加。

如果需求跨多类，默认选最容易形成强演示效果的那一类做主轴，其余只做辅助。

## 题型识别提示

在首轮判断时，优先用需求关键词快速归类，不要犹豫太久：

- 如果需求强调品牌、官网、落地页、活动宣传、首屏 -> 官网类
- 如果需求强调玩法、得分、胜负、闯关、点击反馈 -> 小游戏类
- 如果需求强调生成、分析、查询、输入输出、结果页、效率提升 -> 工具类
- 如果用户同时提到官网 + 交互玩法，先判断评审更容易记住哪一面，把那一面作为主轴。


## 比赛质量底线

即使在半小时里，也必须守住这些底线：

- 3 秒内必须让评委看懂主题和亮点，首屏不能有普通模板感。
- 30 秒内必须能完整走完一条主演示路径，不允许关键步骤断掉。
- 至少保住一个 wow 点，而且 wow 点必须真实可见，不是只写在文案里。
- 时间不够时优先删功能，不要删完成度、动效记忆点和演示闭环。
- 必须能在比赛现场直接讲解与演示，结果页或结束态要有完成感。

### 评委视角自检
- 3 秒第一印象够不够强，是否一眼看懂主题。
- 30 秒主演示路径是否闭环，评委不用猜下一步。
- wow 点是否真实出现，而不是停留在计划里。
- 是否还残留默认组件、默认配色、占位文案或丑的细节。
- 还能不能再砍一个次要功能，换更强的完成度和视觉统一性。


## 赛事专用能力

### 评委视角优化
- 每个作品必须有一个2分钟能讲完的完整演示故事线
- 标题/首屏/Hero区域在3秒内传达核心价值
- 结果页/完成页让评委有完成感，而不是半成品感
- 动效不在于多，在于有1-2个让人记住的瞬间

### 降级策略
- 后端来不及 -> 用 localStorage / mock API，但要标注demo数据
- 多页面来不及 -> 做好单页的完整体验，胜过5个半成品页面
- 复杂交互来不及 -> 简化流程，但保留核心闭环
- 响应式来不及 -> 保证桌面端完美，移动端可用

### 演示准备
- 准备一段30秒的口头介绍：这是什么 + 给谁用 + 核心价值 + wow点
- 准备一条完整的主流程演示路径（从开始到结束无断点）
- 准备一个备选路径（如果主路径出了问题）
- 确保首屏截图就能当宣传图用


## 会话连续性契约（强制）

- 若存在 `.super-dev/SESSION_BRIEF.md`，每次继续前必须先读取。
- 用户在 SEEAI 模式里说"改一下 / 再炫一点 / 补个功能 / 继续做"等，属于当前比赛流程内动作。
- 文档确认前，任何修改都先落在 compact research / PRD / architecture / UIUX 上。
- Spec 之后，任何修改默认回到当前 full-stack sprint，不额外拆出新的长门禁。


## 实现闭环契约（强制）

- 每轮修改后先做最小 diff review 再汇报完成。
- 运行 build / type-check / test / runtime smoke。
- 新增代码必须接入真实调用链；未接入则删除，禁止留 unused code。
- 新增日志/告警/埋点必须验证会在真实路径触发。

## Never do this

- Never skip research, the three compact core documents, or Spec entirely.
- Never expand SEEAI mode back into the full standard Super Dev long chain unless the user explicitly asks to switch modes.
- Never stop after frontend to wait for a separate preview gate in SEEAI mode.
- Never sacrifice baseline polish and demoability just to move fast.


## Super Dev SEEAI Flow Contract

- SUPER_DEV_SEEAI_FLOW_CONTRACT_V1
- PHASE_CHAIN: research>docs>docs_confirm>spec>build_fullstack>polish>handoff
- DOC_CONFIRM_GATE: required
- PREVIEW_CONFIRM_GATE: omitted
- QUALITY_STYLE: speed_with_showcase_quality
