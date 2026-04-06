<p align="center">
  <img src="public/favicon.svg" alt="Sec4AI Hub" width="80" height="80" />
</p>

<h1 align="center">Sec4AI Hub</h1>

<p align="center">
  Interactive AI Security Threat Knowledge Base — Full-Chain Threat Modeling & Defense for Agentic AI Systems<br/>
  Aggregating <strong>OpenClaw MAESTRO</strong> Threat Model &amp; <strong>AI Agent</strong> Threat Model
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
  <a href="#quick-start">Quick Start</a> &bull;
  <a href="#docker-deployment">Docker</a> &bull;
  <a href="#project-structure">Structure</a> &bull;
  <a href="#threat-models">Threat Models</a> &bull;
  <a href="#contributing">Contributing</a> &bull;
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="README.md">中文</a> | <strong>English</strong>
</p>

---

## Overview

Sec4AI Hub is an interactive AI security threat knowledge base that integrates two major threat models:

### OpenClaw MAESTRO Threat Model

Based on the [OpenClaw](https://github.com/openclaw/openclaw) open-source project and the MAESTRO 7-layer defense framework, it systematically catalogs **39 security threats** spanning from foundation models to agent ecosystems.

| Layer | Name | Threats |
|:---:|------|:---:|
| L1 | Foundation Model | 5 |
| L2 | Data Operations | 6 |
| L3 | Agent Framework | 6 |
| L4 | Deployment & Infrastructure | 6 |
| L5 | Evaluation & Observability | 5 |
| L6 | Security & Compliance | 6 |
| L7 | Agent Ecosystem | 5 |

### AI Agent Threat Model

A security threat model for AI agent systems, categorized by assessment steps, covering **17 threats** and **6 defense playbooks** across dimensions including autonomous reasoning, memory systems, tool abuse, authentication, human interaction, and multi-agent collaboration.

| Playbook | Defense Direction |
|:---:|------|
| P1 | Prevent AI Agent reasoning manipulation |
| P2 | Prevent memory poisoning & knowledge tampering |
| P3 | Secure tool execution & supply chain defense |
| P4 | Strengthen authentication & access control |
| P5 | Protect human oversight systems |
| P6 | Secure multi-agent communication & trust mechanisms |

## Features

- **Dual Knowledge Base** — OpenClaw (39 threats) + AI Agent (17 threats + 6 playbooks)
- **Interactive Browsing** — Filter by severity/category, timeline-style attack scenarios
- **Global Search** — Cross-model keyword search with in-content matching & highlight preview
- **Defense Playbooks** — Each playbook covers proactive defense, passive response, and detection monitoring
- **Deep Navigation** — Prev/next paging between threats/playbooks, breadcrumb navigation
- **Dark Theme** — Terminal/Hacker style interface
- **SPA Routing** — Deep linking with browser back/forward support
- **Docker Deployment** — CIS Benchmark compliant, one-click containerization

## Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9

### Install & Run

```bash
# Clone
git clone https://github.com/y4ney/Sec4AI-Hub.git
cd Sec4AI-Hub

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

One-click containerized deployment following **Docker CIS Benchmark** security best practices.

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
Sec4AI-Hub/
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

Describe the threat in detail...

#### 缓解措施

Describe mitigation strategies...
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
防护剧本名称:
  - "剧本N：剧本名称"
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

## Acknowledgments

- [OpenClaw](https://github.com/openclaw/openclaw) — Source of the MAESTRO threat model analysis
- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/) — Threat categorization reference
- [Anthropic](https://www.anthropic.com/) & [OpenAI](https://openai.com/) — Research on AI agent deceptive behaviors and safety
- Built with [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/), and [marked](https://marked.js.org/)

## License

This project is licensed under the [Apache License 2.0](LICENSE).
