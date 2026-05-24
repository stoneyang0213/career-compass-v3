# Host Onboard Smoke Guide

- Generated At: 2026-05-24T04:48:37.724384+00:00
- Project: D:\projects\career-compass-v3
- Install Scope: project surfaces only
- Status: ok

## Claude Code

- Status: ready
- Standard Flow First Prompt: `/super-dev 你的需求`
- Competition Flow First Prompt: `/super-dev-seeai 比赛需求`
- Install Scope: project surfaces only

### Start Playbook
- 起手建议: 优先在当前 Claude Code 会话里直接用 /super-dev，不要先退回普通聊天交代背景。
- 避免动作: 不要先手写一串 spec / quality / release 命令来替代宿主入口。

### Post-Onboard Self-Check
- Claude Code 接入后先确认入口可用: /super-dev 你的需求 / /super-dev-seeai 比赛需求
- Claude Code 接入后再确认 SEEAI 项目补充面已写入: .claude/commands/super-dev-seeai.md / .claude/skills/super-dev-seeai/SKILL.md
- Claude Code 接入后再确认 SEEAI 用户级补充面已写入: ~/.claude/skills/super-dev-seeai/SKILL.md

### Official Workflow Checks
- 确认 Claude Code 按 official-skill 官方协议面真实加载 Super Dev，而不是只检测到文件存在。
- 确认官方接入面真实生效: 项目侧 CLAUDE.md / .claude/CLAUDE.md / .claude/skills/super-dev/SKILL.md；用户侧 ~/.claude/skills/super-dev/SKILL.md / ~/.claude/agents/super-dev.md
- 如启用当前增强接入面，再确认: 项目侧 .claude/settings.json / .claude/settings.local.json；用户侧 ~/.claude/CLAUDE.md / ~/.claude/settings.json
- 确认 SEEAI 项目补充面真实生效: .claude/commands/super-dev-seeai.md / .claude/skills/super-dev-seeai/SKILL.md
- 确认 SEEAI 用户级补充面真实生效: ~/.claude/skills/super-dev-seeai/SKILL.md
- 确认当前 Claude Code 会话真实读取 CLAUDE.md、.claude/CLAUDE.md、可选 .claude/settings*.json、.claude/skills 与 .claude/agents，而不是只把文件写进仓库。

### Official Pass Criteria
- Claude Code 官方工作流面、入口链、恢复链与 SEEAI 补充面均已真人验收通过。
- 确认 Claude Code 按 official-skill 官方协议面真实加载 Super Dev，而不是只检测到文件存在。
- 确认官方接入面真实生效: 项目侧 CLAUDE.md / .claude/CLAUDE.md / .claude/skills/super-dev/SKILL.md；用户侧 ~/.claude/skills/super-dev/SKILL.md / ~/.claude/agents/super-dev.md
- 如启用当前增强接入面，再确认: 项目侧 .claude/settings.json / .claude/settings.local.json；用户侧 ~/.claude/CLAUDE.md / ~/.claude/settings.json

### Resume Guidance
- 优先入口: /super-dev 你的需求 / /super-dev-seeai 比赛需求
- 原生恢复: /super-dev 继续当前流程 / 回当前 Claude Code 会话继续
- 优先沿用当前宿主会话恢复，不要先走新的普通聊天入口。

### Repair Playbook
-

### SEEAI Project Supplements
- `.claude/commands/super-dev-seeai.md`
- `.claude/skills/super-dev-seeai/SKILL.md`
- `plugins/super-dev-claude/skills/super-dev-seeai/SKILL.md`

### SEEAI User Supplements
- `~/.claude/skills/super-dev-seeai/SKILL.md`

### Written Surfaces
- `D:\projects\career-compass-v3\.claude-plugin\marketplace.json`
- `D:\projects\career-compass-v3\.claude\CLAUDE.md`
- `D:\projects\career-compass-v3\.claude\agents\super-dev.md`
- `D:\projects\career-compass-v3\.claude\commands\super-dev-seeai.md`
- `D:\projects\career-compass-v3\.claude\commands\super-dev.md`
- `D:\projects\career-compass-v3\.claude\settings.local.json`
- `D:\projects\career-compass-v3\.claude\skills\super-dev-seeai\SKILL.md`
- `D:\projects\career-compass-v3\.claude\skills\super-dev\SKILL.md`
- `D:\projects\career-compass-v3\CLAUDE.md`
- `D:\projects\career-compass-v3\plugins\super-dev-claude\.claude-plugin\plugin.json`
- `D:\projects\career-compass-v3\plugins\super-dev-claude\README.md`
- `D:\projects\career-compass-v3\plugins\super-dev-claude\skills\super-dev-seeai\SKILL.md`
- `D:\projects\career-compass-v3\plugins\super-dev-claude\skills\super-dev\SKILL.md`
