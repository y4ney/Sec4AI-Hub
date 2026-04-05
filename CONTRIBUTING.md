# 贡献指南

感谢你对 MAESTRO 威胁模型项目的关注！我们欢迎并感激所有形式的贡献。

## 如何贡献

### 报告问题

- 使用 [GitHub Issues](../../issues) 提交 Bug 报告或功能建议
- 请使用提供的 Issue 模板
- 一个 Issue 只报告一个问题

### 提交代码

1. **Fork** 本仓库
2. 基于 `main` 创建功能分支：`git checkout -b feature/your-feature`
3. 进行修改并确保：
   - `npm run lint` 通过（TypeScript 类型检查）
   - 新增威胁条目遵循 [模板格式](#威胁条目格式)
   - UI 变更在不同浏览器/设备上测试通过
4. 提交 commit，使用清晰的提交信息
5. 推送到你的 Fork 并创建 **Pull Request**

### 威胁条目格式

在 `wiki/` 目录下创建新文件夹和 Markdown 文件：

```
wiki/<威胁名称>/<威胁名称>.md
```

文件必须包含以下 Frontmatter 字段：

```yaml
---
层级: "第X层 — 层级名称"
威胁等级: "严重|高危|中危|低危"
序号: "XX-NNN"        # 层级前缀-序号，如 AE-006
OpenClaw 源码路径: "src/path"  # 或多行 YAML 数组
层级说明: "层级简要描述"
---
```

正文结构：

```markdown
# 威胁标题

- [威胁描述](#威胁描述)
- [缓解措施](#缓解措施)

#### 威胁描述

详细描述威胁场景、攻击方式、影响范围...

#### 缓解措施

描述防御方案、代码修复建议、配置建议...
```

完成后运行 `node gen-index.mjs` 更新索引。

### 层级 ID 对照

| 层级 | 前缀 | 示例 |
|------|------|------|
| 第1层 — 基础模型 | LM | LM-001 |
| 第2层 — 数据操作 | DO | DO-001 |
| 第3层 — 智能体框架 | AF | AF-001 |
| 第4层 — 部署与基础设施 | DI | DI-001 |
| 第5层 — 评估与可观测性 | EO | EO-001 |
| 第6层 — 安全与合规 | SC | SC-001 |
| 第7层 — 智能体生态系统 | AE | AE-001 |

## 开发设置

```bash
# 安装依赖
npm install

# 生成索引
node gen-index.mjs

# 启动开发服务器
npm run dev

# 类型检查
npm run lint

# 构建
npm run build
```

## 行为准则

请参阅 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。参与本项目即表示你同意遵守其条款。

## 许可证

通过向本项目贡献代码，你同意你的贡献将在 [Apache License 2.0](LICENSE) 下授权。
