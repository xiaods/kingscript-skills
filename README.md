# Kingscript 插件开发专家 (AI Agent Skills)

<div align="center">

**为 AI 助手打造的金蝶苍穹 Kingscript 插件开发全能工具包**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-green.svg)](SKILL.md)

[核心能力](#-核心能力) • [安装指南](#-安装指南) • [快速开始](#-快速开始) • [开发规范](#-开发规范)

</div>

---

## 🎯 简介

**kingscript-plugin-dev** 是一个专为金蝶苍穹平台设计的 AI 助手增强技能（Skill）。它将复杂的开发规范、10 种插件模板、ORM 接口及财务计算经验封装为 AI 可直接理解的知识库，助力 Claude Code、OpenCode 和 Kimi 等工具秒变“苍穹专家”。

### 为什么使用？
- ⚡ **效率翻倍**：全量插件模板，一句话生成标准代码。
- 🛡️ **安全避坑**：内置 14 项代码质量检查，规避类属性滥用、ORM 误区等陷阱。
- 🧮 **财务精准**：内置 `BigDecimal` 专项指导，多出小数点后的精确保障。

---

## 🚀 核心能力

### 覆盖 10 种插件场景
| 场景 | 基类 (Base Class) | 核心用途 |
| :--- | :--- | :--- |
| **操作插件** | `AbstractOperationServicePlugIn` | [核心] 数据校验、事务处理、跨表同步 |
| **表单插件** | `AbstractBillPlugIn` | [核心] 界面联动、控件锁定、事件监听 |
| **列表插件** | `AbstractListPlugin` | 动态列、数据格式化、自定义过滤 |
| **转换插件** | `AbstractConvertPlugIn` | 单据下推、字段映射、分单逻辑 |
| **报表插件** | `AbstractReportForm/ListDataPlugin` | 报表取数与交互控制 |
| **工作流插件** | `WorkflowPlugin` | 审批流逻辑干预 |
| **打印/进出口** | `BatchImportPlugin` | 打印格式、数据导入导出校验 |

---

## 📦 安装指南

### 1. 安装到 Claude Code
```powershell
# Windows: 创建目录并复制 (PowerShell)
mkdir "$env:USERPROFILE\.claude\skills\kingscript-plugin-dev" -ErrorAction SilentlyContinue
Copy-Item -Path ".\*" -Destination "$env:USERPROFILE\.claude\skills\kingscript-plugin-dev" -Recurse
```

### 2. 安装到 OpenCode
在 `~/.opencode/config.json` 中配置：
```json
{ "skills": { "paths": ["D:/your-path/kingscript-plugin-dev"] } }
```

### 3. 验证
在 AI 助手输入 `/help skills` 或 `@skills` 即可看到 `kingscript-plugin-dev`。

---

## 🎓 快速开始

安装后，你可以直接对 AI 助手发起挑战：

> **用户：** “帮我写一个应付单保存操作插件，校验‘付款金额’必须大于 0，且如果单据状态是‘已审核’则不允许修改。”

**AI 专家将立即生成：**
1. 正确的 `onPreparePropertys` 字段预加载。
2. 符合规范的 `AbstractOperationServicePlugIn` 实现。
3. 使用 `BigDecimal` 的安全性校验逻辑。
4. 标准的脚本导出格式。

---

## 📚 文档索引

| 文档 | 说明 |
| :--- | :--- |
| [**SKILL.md**](SKILL.md) | **核心技术文档** - 包含所有基类、生命周期、API 字典及代码模式 |
| [QUICKSTART.md](QUICKSTART.md) | 3 分钟上手实战指南 |
| [references/](references/) | 专项手册：[ORM接口](references/data-service.md)、[表单交互](references/form-plugin.md)、[常见场景库](references/common-examples.md) |
| [scripts/](scripts/) | 基础模板：[表单模板](scripts/form-plugin-template.ts)、[操作模板](scripts/operation-plugin-template.ts) |

---

## 📊 版本历史
- **v2.0.0** (2024-02-03): 全新重构，支持 10 种插件类型，新增财务计算与 ORM 深度指导。
- **v1.0.0** (2024-01-15): 初始版本发布。

---

## 📄 许可证 & 支持
- 基于 [Apache License 2.0](LICENSE) 开源。
- 如需帮助请提交 [Issue](https://github.com/xiaods/kingscript-skills/issues) 或访问金蝶社区。