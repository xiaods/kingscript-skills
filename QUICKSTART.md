# Kingscript插件开发Skill - 快速开始

恭喜你成功创建了Kingscript插件开发Skill！这个Skill为你提供了完整的金蝶苍穹Kingscript开发指南和工具。

## 🎉 已完成的工作

我们已经为你创建了完整的Skill结构：

### 📁 目录结构
```
kingscript-plugin-dev/
├── SKILL.md                              # 主Skill文档（核心触发文档）
├── README.md                             # 详细使用说明
├── QUICKSTART.md                         # 快速开始指南（本文档）
├── package-skill.ps1                     # Skill打包脚本
├── references/                           # 详细参考文档
│   ├── syntax.md                         # Kingscript语法基础
│   ├── operation-plugin.md               # 操作插件详解
│   ├── data-service.md                   # ORM数据接口详解
│   ├── form-plugin.md                    # 表单插件详解
│   └── common-examples.md                # 常见开发案例
└── scripts/                              # 代码模板
    ├── form-plugin-template.ts           # 表单插件模板
    └── operation-plugin-template.ts      # 操作插件模板
```

### 📚 内容概览

- **5个参考文档**：涵盖语法、操作插件、表单插件、数据接口和常见案例
- **2个完整模板**：可直接复制使用的表单插件和操作插件模板
- **100+代码示例**：覆盖各种业务场景的开源代码
- **详细API说明**：所有核心API的使用方法和注意事项

## 🚀 如何最快开始使用

### 场景1：我要开发一个表单插件（3分钟上手）

**步骤**：

1. **复制模板**：
   ```bash
   cp scripts/form-plugin-template.ts my-form-plugin.ts
   ```

2. **修改常量**（在my-form-plugin.ts中）：
   ```typescript
   const ENTITY = {
     MAIN: "你的实体标识",      // ← 修改为实际的实体标识
     ENTRY: "你的单据体标识"
   };
   ```

3. **实现业务逻辑**：
   - 在 `afterCreateNewData()` 中添加初始化代码
   - 在 `propertyChanged()` 中添加字段联动
   - 在 `itemClick()` 中添加按钮点击处理

4. **上传到苍穹平台**：
   - VSCode：右键 → "上传至账套"
   - 在线：直接复制粘贴 → 保存

5. **在设计器中选择脚本**并预览

**参考文档**：
- `references/form-plugin.md` - 表单插件事件详解
- `references/common-examples.md` - 常见表单交互示例

---

### 场景2：我要开发一个操作插件（5分钟上手）

**步骤**：

1. **复制模板**：
   ```bash
   cp scripts/operation-plugin-template.ts my-operation.ts
   ```

2. **修改常量**：
   ```typescript
   const ENTITY = {
     MAIN: "你的实体标识",      // ← 修改为实际的实体标识
     ENTRY: "你的单据体标识"
   };
   ```

3. **实现业务逻辑**：
   - 在 `onAddValidators()` 中添加自定义校验
   - 在 `beforeExecuteOperationTransaction()` 中准备数据
   - 在 `beginOperationTransaction()` 中同步关联数据

4. **上传到苍穹平台**：
   - 在设计器中选择操作 → 插件 → 选择脚本

5. **测试操作**：
   - 在单据上执行操作，验证效果

**参考文档**：
- `references/operation-plugin.md` - 操作插件事件详解
- `references/common-examples.md` - 常见校验和同步示例

---

### 场景3：我需要查询数据（1分钟上手）

**查询单条（结构化，可修改）**：
```typescript
let data = BusinessDataServiceHelper.loadSingle(
  pkid, 
  "entity", 
  "id,billno,amount,entryentity.qty"
);
```

**查询多条（平铺，高性能，只读）**：
```typescript
let dataList = QueryServiceHelper.query(
  "entity", 
  "id,billno,entryentity.qty",
  [new QFilter("status", "=", "A")],
  "billno DESC"
);
```

**参考文档**：
- `references/data-service.md` - 完整的ORM接口指南

---

## 📖 Skill使用指南

当你需要开发Kingscript插件时，直接告诉Kimi：

```
我要开发一个Kingscript插件，实现[你的功能]
```

Kimi会自动使用这个Skill，为你提供：

1. **快速代码示例**（复制即用）
2. **完整实现方案**（复杂业务场景）
3. **API使用说明**（查询、保存、校验等）
4. **问题排查指导**（常见问题解决）

### 技能触发方式

由于Skill的description中包含：
```
用于创建单据表单插件和操作插件，支持数据校验、业务逻辑处理、数据访问和界面交互等功能。
当需要开发Kingscript脚本（.ts文件）来扩展金蝶苍穹低代码平台的业务功能时
```

**Triggers（触发关键词）**：
- "开发Kingscript插件"
- "开发苍穹插件"
- "插件开发"
- "表单插件"
- "操作插件"
- "Kingscript脚本"
- "ts文件开发"
- "单据插件"
- "低代码平台插件"

当你提到以上任何关键词时，Kimi会自动加载这个Skill来帮助你！

---

## 🎯 核心文档速查

| 需求场景 | 参考文档 | 预计用时 |
|---------|---------|---------|
| 了解整体架构 | `SKILL.md` | 15分钟 |
| 查阅API接口 | `references/data-service.md` | 随时查阅 |
| 学习表单插件 | `references/form-plugin.md` | 30分钟 |
| 学习操作插件 | `references/operation-plugin.md` | 30分钟 |
| 查找代码示例 | `references/common-examples.md` | 随时查阅 |
| 快速开始开发 | 复制模板 → 修改常量 | 3-5分钟 |

---

## 🎬 第一个插件：Hello World

让我们用5分钟创建一个最简单的表单插件：

### 步骤1：创建插件文件

创建一个文件 `hello-plugin.ts`：

```typescript
import { AbstractBillPlugIn } from "@cosmic/bos-core/kd/bos/bill";
import { EventObject } from "@cosmic/bos-script/java/util";

// 最简单的表单插件
class HelloPlugin extends AbstractBillPlugIn {

  // 新增单据时触发
  afterCreateNewData(e: EventObject): void {
    // 设置备注字段的默认值
    this.getModel().setValue("remark", "Hello, Kingscript!");
    
    console.log("✓ 插件已生效！");
    
    super.afterCreateNewData(e);
  }
}

let plugin = new HelloPlugin();
export { plugin };
```

### 步骤2：上传脚本
- VSCode：右键 → "上传至账套"
- 在线：直接保存

### 步骤3：配置到表单
1. 在苍穹设计器打开单据
2. 大纲 → 插件 → 选择脚本
3. 勾选 `hello-plugin.ts`
4. 保存

### 步骤4：预览测试
1. 点击"预览"
2. 点击"新增"
3. 查看备注字段是否显示："Hello, Kingscript!"

**如果看到了，恭喜你！你的第一个插件成功了！** 🎉

---

## 🔍 如何查找你需要的内容

### 1. 快捷键

使用Kimi时，直接询问：

```
- "如何查询单据数据？" → 自动引用data-service.md
- "如何实现字段联动？" → 自动引用form-plugin.md → propertyChanged
- "如何添加自定义校验？" → 自动引用operation-plugin.md → onAddValidators
- "如何下载附件？" → 自动引用common-examples.md → 文件下载
```

### 2. 文件结构记忆

| 目录 | 用途 |
|------|-----|
| `references/` | 详细文档，按需查阅 |
| `scripts/` | 代码模板，直接复制 |
| `SKILL.md` | 主文档，全面介绍 |
| `README.md` | 详细使用指南 |

### 3. 关键词搜索

在各文档中搜索关键词：

- **查询相关**：query、load、QFilter
- **保存相关**：save、update、saveOperate
- **校验相关**：validate、ValidationErrorInfo
- **事件相关**：beforeItemClick、propertyChanged

---

## 💡 开发技巧

### 1. 从模板开始，而不是从零开始

**好做法**：
```bash
cp scripts/form-plugin-template.ts my-plugin.ts
vim my-plugin.ts  # 修改常量和业务逻辑
```

**省时间**：模板已经包含了完整的结构和错误处理

### 2. 参考文档中的代码，复制后修改

**好做法**：
- 在 `common-examples.md` 中找到类似功能
- 复制代码到编辑器
- 修改实体标识和字段标识

**省时间**：避免重复编写常见代码，减少错误

### 3. 控制台输出调试

**好做法**：
```typescript
console.log("当前单据编号：", billno);
// ... 业务逻辑
console.log("处理完成");
```

**省时间**：快速定位问题

### 4. 使用局部变量，避免类属性

**好做法**：
```typescript
// ❌ 错误（插件实例共享）
class MyPlugin {
  private formId: string;  // 不要在插件类中定义属性
}

// ✅ 正确
class MyPlugin {
  private getFormId(): string {
    return this.getView().getFormId();  // 使用方法代替属性
  }
}
```

**避坑**：避免多个表单实例间的数据污染

---

## 🚨 常见陷阱和避免方法

| 陷阱 | 后果 | 如何避免 |
|-----|------|---------|
| 使用类属性 | 数据被其他表单覆盖 | 方法内使用局部变量 |
| QueryServiceHelper数据保存 | 报错，无法保存 | 改用BusinessDataServiceHelper查询 |
| 事务内做复杂计算 | 性能差，死锁风险 | 在beforeExecuteOperationTransaction中处理 |
| 未添加onPreparePropertys | 字段值为null | 在插件中添加所有使用的字段 |
| 循环查询单条数据 | 性能极差 | 使用批量查询 |

---

## 📞 遇到问题怎么办

### 1. 查看控制台输出
- Chrome DevTools → Console
- 查看error和log信息

### 2. 查阅SKILL文档
- 打开 `SKILL.md` → "常见问题排查"
- 查看对应的reference文档

### 3. 询问Kimi
直接描述你的问题：
```
我在开发Kingscript插件时遇到错误："Cannot read property 'get' of undefined"
这是一个表单插件，我在afterCreateNewData中访问单据体字段
```

### 4. 参考金蝶社区
- https://vip.kingdee.com
- 搜索错误信息或功能需求

### 5. 逐步排查
1. 注释掉部分代码，定位问题
2. 使用console.log打印中间结果
3. 对比模板代码，找出差异

---

## 🎯 进阶学习路径

### Level 1：初级（1-3天）
- ✅ 表单插件基础（字段赋值、值更新）
- ✅ 操作插件基础（简单校验）
- ✅ ORM查询基础（load、loadSingle、QFilter）

### Level 2：中级（1-2周）
- ✅ 表单插件进阶（控件属性控制、事件监听）
- ✅ 操作插件进阶（事务处理、关联同步）
- ✅ ORM进阶（QueryServiceHelper、性能优化）
- ✅ 常见业务场景实现（附件、F7过滤、父子页面）

### Level 3：高级（1个月+）
- ✅ 复杂业务逻辑（多插件协作）
- ✅ 性能优化（批量处理、缓存使用）
- ✅ 事务和回滚处理
- ✅ 自定义控件开发
- ✅ 集成第三方系统

---

## 📝 总结

这个Skill为你提供了：

✅ **完整开发指南**：
- 语法基础
- 表单插件
- 操作插件
- ORM接口

✅ **实战代码模板**：
- 表单插件模板（可直接使用）
- 操作插件模板（可直接使用）

✅ **丰富案例库**：
- 100+代码示例
- 覆盖常见业务场景
- 复制即用

✅ **快速导航**：
- 文档结构清晰
- 示例索引完善
- 问题排查快速

**现在，你可以开始开发你的第一个Kingscript插件了！**

---

## 🚩 下一步行动

1. **立即行动**：创建Hello World插件（见本文档"第一个插件"部分）
2. **选择需求**：确定你要开发的插件类型（表单/操作）
3. **复制模板**：从scripts目录复制对应模板
4. **修改实现**：根据业务需求修改常量和逻辑
5. **测试验证**：上传到苍穹平台，预览测试
6. **迭代优化**：根据测试结果优化代码

**开始你的Kingscript开发之旅吧！💪**
