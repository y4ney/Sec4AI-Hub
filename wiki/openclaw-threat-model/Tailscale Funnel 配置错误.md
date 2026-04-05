---
层级: "第4层 — 部署与基础设施"
威胁等级: "严重"
序号: "DI-002"
OpenClaw 源码路径: "src/gateway/gateway-cli.ts"
层级说明: "基础设施层面的威胁：网关暴露、代理欺骗、运行时漏洞、Docker Socket 暴露"
---

# Tailscale Funnel 配置错误

#### 威胁描述

Tailscale Funnel 模式在没有额外身份验证的情况下将网关暴露到公共互联网，为互联网上的任何人创建了直接攻击面。

#### 缓解措施

安全审计会标记 Tailscale Funnel 配置。Funnel 模式需要用户显式配置和同意。Funnel 连接强制执行身份验证。
