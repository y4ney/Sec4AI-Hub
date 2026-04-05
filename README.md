<p align="center">
  <img src="public/favicon.svg" alt="Sec4AI Hub" width="80" height="80" />
</p>

<h1 align="center">Sec4AI Hub</h1>

<p align="center">
  AI 安全威胁知识库平台 — 覆盖 Agentic AI 系统全链路安全威胁建模与防护<br/>
  汇聚 <strong>OpenClaw MAESTRO</strong> 威胁模型 &amp; <strong>AI Agent</strong> 威胁模型
</p>

<p align="center">
  <img alt="License" src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img alt="OpenClaw Threats" src="https://img.shields.io/badge/OpenClaw_Threats-39-critical?color=ff0040" />
  <img alt="AI Agent Threats" src="https://img.shields.io/badge/AI_Agent_Threats-17-critical?color=f472b6" />
  <img alt="Playbooks" src="https://img.shields.io/badge/Playbooks-6-success?color=4ade80" />
  <img alt="Docker" src="https://img.shields.io/badge/Docker-CIS_Benchmark-2496ED?logo=docker&logoColor=white" />
</p>

<p align="center">
  <a href="#quick-start">快速开始</a> •
  <a href="#docker-deployment">Docker</a> •
  <a href="#project-structure">项目结构</a> •
  <a href="#threat-models">威胁模型</a> •
  <a href="#contributing">贡献指南</a> •
  <a href="#license">许可证</a>
</p>

---

## Overview

Sec4AI Hub 是一个交互式的 AI 安全威胁知识库，涵盖两大威胁模型：

### OpenClaw MAESTRO Threat Model

基于 [OpenClaw](https://github.com/openclaw/openclaw) 开源项目，参考 MAESTRO 七层防御框架，系统性地梳理了 **39 个安全威胁**，覆盖从基础模型到智能体生态系统的完整安全分析。

| 层级 | 名称 | 威胁数 |
|:---:|------|:---:|
| L1 | 基础模型 Foundation Model | 5 |
| L2 | 数据操作 Data Operations | 6 |
| L3 | 智能体框架 Agent Framework | 6 |
| L4 | 部署与基础设施 Deployment & Infra | 6 |
| L5 | 评估与可观测性 Evaluation & Observability | 5 |
| L6 | 安全与合规 Security & Compliance | 6 |
| L7 | 智能体生态系统 Agent Ecosystem | 5 |

### AI Agent Threat Model

面向 AI 智能体系统的安全威胁模型，按评估步骤分类，覆盖 **17 个威胁** 和 **6 个防护剧本**，涉及自主推理、记忆系统、工具滥用、身份验证、人类交互、多智能体协作等维度。

| 剧本 | 防护方向 |
|:---:|------|
| P1 | 防范 AI Agent 推理操纵 |
| P2 | 防范记忆投毒与知识篡改 |
| P3 | 保障工具执行安全与供应链防护 |
| P4 | 强化身份验证与权限控制 |
| P5 | 防护人类介入管控体系 |
| P6 | 保障多智能体通信安全与信任机制 |

## Features

- **双模型知识库** — OpenClaw (39 threats) + AI Agent (17 threats + 6 playbooks)
- **交互式浏览** — 按严重等级 / 威胁类别筛选、时间轴式攻击场景展示
- **全局搜索** — 跨模型关键词搜索，正文匹配 + 高亮预览
- **防护剧本** — 每个剧本包含主动防护、被动响应、检测监控三层措施
- **深度导航** — 威胁 / 剧本间前后翻页，面包屑导航
- **深色主题** — Terminal / Hacker 风格界面
- **SPA 路由** — 支持深度链接和浏览器前进 / 后退
- **Docker 部署** — CIS Benchmark 合规，一键容器化

## Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9

### Install & Run

```bash
# Clone
git clone https://github.com/y4ney/maestro-threat-model.git
cd maestro-threat-model

# One-click start (install + index + dev server)
bash start.sh

# Or manually
npm install
node gen-index.mjs
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

## Docker Deployment

一键容器化部署，遵循 **Docker CIS Benchmark** 安全最佳实践。

```bash
# Build & run
docker compose up --build

# Run in background
docker compose up -d --build

# Stop
docker compose down
```

Access: http://localhost:8080

### CIS Benchmark Compliance

| Practice | Description |
|----------|-------------|
| Multi-stage build | Build tools excluded from final image |
| Minimal base image | `nginx-unprivileged:alpine` (~7MB) |
| Non-root | Runs as UID 101 |
| Read-only filesystem | `--read-only` + tmpfs mounts |
| Capability drop | `--cap-drop ALL` |
| No privilege escalation | `--security-opt no-new-privileges` |
| Resource limits | CPU 0.5 / Memory 64MB |
| Health check | Built-in HEALTHCHECK |
| No version leak | `server_tokens off` |
| Security headers | CSP / X-Frame-Options / nosniff |

## Project Structure

```
maestro-threat-model/
├── .github/
│   ├── workflows/ci.yml        # CI/CD (build + GitHub Pages deploy)
│   ├── ISSUE_TEMPLATE/          # Issue templates
│   └── PULL_REQUEST_TEMPLATE.md
├── wiki/                        # Threat entries (Markdown + Frontmatter)
│   ├── openclaw-threat-model/   # 33 files (39 threats + CLI commands)
│   └── ai-agent-threat-model/
│       ├── theat-database/      # 17 threat files
│       └── protect-playbook/    # 6 playbook files
├── src/
│   ├── app.ts                   # Top-level router & event dispatch
│   ├── landing.ts               # Landing page + typewriter effect
│   ├── main.ts                  # Entry point
│   ├── style.css                # Global styles (dark theme)
│   ├── ai-agent/
│   │   ├── app.ts               # AI Agent pages & search
│   │   └── data.ts              # AI Agent data loading & search logic
│   ├── openclaw/
│   │   ├── app.ts               # OpenClaw pages & search
│   │   └── data.ts              # OpenClaw data loading & search logic
│   └── shared/
│       ├── footer.ts            # Footer component
│       ├── markdown.ts          # Markdown parse & section extraction
│       ├── navbar.ts            # Navbar with Threat Model dropdown
│       ├── render-helpers.ts    # Shared search rendering & highlight
│       └── router.ts            # SPA routing (History API)
├── gen-index.mjs                # Index generator (JSON from frontmatter)
├── start.sh                     # One-click dev script
├── index.html                   # HTML entry with SEO meta
├── package.json
└── tsconfig.json
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Vite 8](https://vitejs.dev/) | Build tool & dev server |
| [TypeScript 5.9](https://www.typescriptlang.org/) | Type safety |
| [marked](https://marked.js.org/) | Markdown → HTML rendering |
| Vanilla JS | Zero framework, direct DOM |
| History API | SPA routing |

## Adding New Threats

### OpenClaw Threat

Create a Markdown file in `wiki/openclaw-threat-model/`:

```markdown
---
层级: "第X层 — 层级名称"
威胁等级: "严重|高危|中危|低危"
序号: "XX-NNN"
OpenClaw 源码路径: "src/path/to/file"
层级说明: "层级描述"
---

# 威胁标题

#### 威胁描述

详细描述威胁内容...

#### 缓解措施

描述缓解方案...
```

### AI Agent Threat

Create a Markdown file in `wiki/ai-agent-threat-model/theat-database/`:

```markdown
---
title: "威胁名称"
威胁序号: T18
Threat Name: "English Threat Name"
威胁评估步骤: "步骤 X：评估问题？"
威胁类别: "威胁类别"
防护剧本名称: "剧本N：剧本名称"
---

# 威胁描述

...

# 攻击场景

## 场景1：场景名称

...

# 缓解方法

...
```

### Generate Index

```bash
node gen-index.mjs
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Security Vulnerabilities

Please **do not** report security vulnerabilities in public Issues. See [SECURITY.md](SECURITY.md).

## License

This project is licensed under the [Apache License 2.0](LICENSE).
