---
层级: "第4层 — 部署与基础设施"
威胁等级: "高危"
序号: "DI-006"
OpenClaw 源码路径: "src/config/config.sandbox-docker.test.ts"
层级说明: "基础设施层面的威胁：网关暴露、代理欺骗、运行时漏洞、Docker Socket 暴露"
---

# Docker Socket 暴露

#### 威胁描述

拥有 Docker Socket 访问权限`/var/run/docker.sock`的沙箱容器可以逃脱隔离并控制宿主机的 Docker 守护进程，从而实现容器逃逸和集群入侵。

#### 缓解措施

安全审计会标记 Docker Socket 挂载。容器绝不应获得 Socket 访问权限。配置验证机制会拒绝已知的危险模式。
