# Kingscript 插件开发 Skill

## 简介

该Skill为金蝶苍穹平台Kingscript插件开发提供全面指导，包括：

- 表单插件开发（表单界面交互）
- 操作插件开发（服务端业务逻辑）
- ORM数据访问接口使用
- 常见业务场景实现

## 目录结构

```
kingscript-plugin-dev/
├── SKILL.md                              # 主文档（Skill描述和使用指南）
├── README.md                             # 使用说明
├── references/
│   ├── syntax.md                         # Kingscript语法基础
│   ├── operation-plugin.md               # 操作插件开发详解
│   ├── data-service.md                   # 数据服务接口详解
│   ├── form-plugin.md                    # 表单插件开发详解
│   └── common-examples.md                # 常见开发案例
└── scripts/
    ├── form-plugin-template.ts           # 表单插件模板
    └── operation-plugin-template.ts      # 操作插件模板
```

## 快速开始

### 1. 确定插件类型

**表单插件**：
- 继承 `AbstractBillPlugIn` 或 `AbstractFormPlugin`
- 处理界面交互：字段赋值、控件状态、按钮点击、值更新等
- 文件模板：`scripts/form-plugin-template.ts`

**操作插件**：
- 继承 `AbstractOperationServicePlugIn`
- 处理业务逻辑：数据校验、事务处理、关联同步、通知等
- 文件模板：`scripts/operation-plugin-template.ts`

### 2. 复制模板并修改

```bash
# 复制表单插件模板
cp scripts/form-plugin-template.ts your-plugin.ts

# 或复制操作插件模板
cp scripts/operation-plugin-template.ts your-operation.ts
```

### 3. 修改常量定义

在模板中修改以下常量：

```typescript
// 实体标识
const ENTITY = {
  MAIN: "your_bill_entity",      // 修改为实际的实体标识
  ENTRY: "your_entry_entity"     // 修改为实际的单据体标识
};

// 字段标识
const FIELD = {
  BILLNO: "billno",              // 修改为实际的字段标识
  STATUS: "billstatus",
  AMOUNT: "amountfield"
};
```

### 4. 实现业务逻辑

根据需求重写对应的方法：

**表单插件常用方法**：
- `afterCreateNewData()` - 新增时初始化
- `afterBindData()` - 界面加载后设置控件属性
- `propertyChanged()` - 字段值变更处理
- `itemClick()` - 按钮点击处理
- `registerListener()` - 注册事件监听

**操作插件常用方法**：
- `onPreparePropertys()` - 预加载字段
- `onAddValidators()` - 添加自定义校验
- `beforeExecuteOperationTransaction()` - 事务前数据准备
- `beginOperationTransaction()` - 事务内关联同步
- `afterExecuteOperationTransaction()` - 操作后通知/日志

### 5. 配置到金蝶平台

**在线编辑器**：
1. 将代码粘贴到在线编辑器
2. 点击"保存"
3. 在设计器中选择脚本

**VSCode**：
1. 安装Kingscript插件
2. 右键点击代码文件
3. 选择"上传至账套"
4. 在设计器中选择脚本

## 文档导航

### 新手入门
1. 阅读 `SKILL.md` - 了解整体架构
2. 阅读 `references/syntax.md` - 学习Kingscript语法
3. 查看 `scripts/form-plugin-template.ts` - 熟悉表单插件结构
4. 查看 `scripts/operation-plugin-template.ts` - 熟悉操作插件结构

### 按开发阶段

**学习阶段**：
- `references/syntax.md` - 语法基础
- `references/form-plugin.md` - 表单插件开发
- `references/operation-plugin.md` - 操作插件开发

**开发阶段**：
- `references/common-examples.md` - 复制粘贴常见代码
- `references/data-service.md` - 查询ORM接口参考

**问题排查**：
- `SKILL.md` - 查看常见问题
- 各reference文档的"常见问题"章节

### 按功能模块

**数据查询**：
- 简单查询 → `references/data-service.md`
- 复杂查询 → `references/common-examples.md` → "查询操作示例"

**数据保存**：
- 新增 → `references/common-examples.md` → "保存操作示例" → "新增数据"
- 修改 → `references/common-examples.md` → "保存操作示例" → "修改数据"

**业务校验**：
- 表单校验 → `references/form-plugin.md` → `beforeDoOperation`
- 操作校验 → `references/operation-plugin.md` → `onAddValidators`

**界面交互**：
- 控件控制 → `references/form-plugin.md` → 各事件详解
- 按钮点击 → `references/common-examples.md` → "控件操作示例"
- 基础资料F7 → `references/common-examples.md` → "基础资料字段操作"

## 开发最佳实践

### ✅ 应该做

1. **使用模板开始**
   - 从 `scripts/` 目录复制模板
   - 修改常量和业务逻辑

2. **遵循命名规范**
   - 实体标识：使用标准的苍穹实体标识
   - 字段标识：使用设计器中定义的标识
   - 变量名：使用驼峰式命名

3. **做好错误处理**
   ```typescript
   try {
     // 业务逻辑
   } catch (error) {
     console.error("操作失败:", error);
     this.getView().showTipNotification("操作失败：" + error.message);
   }
   ```

4. **添加业务注释**
   ```typescript
   /**
    * 计算总金额
    * 说明：汇总单据体所有分录的金额，设置到单据头
    */
   private calculateTotalAmount(): void {
     // ...
   }
   ```

5. **使用局部变量**
   - 插件类方法中使用局部变量，不要定义类属性
   - 因为插件实例是被所有表单共享的

6. **选择合适的查询接口**
   - 需要修改保存 → BusinessDataServiceHelper
   - 只读查询 → QueryServiceHelper（性能更好）
   - 基础资料少量查询 → loadFromCache

7. **事务外做耗时操作**
   - 复杂计算放在 `beforeExecuteOperationTransaction`
   - 事务内只做数据库操作

### ❌ 不应该做

1. **不要定义类属性**
   ```typescript
   // ❌ 错误
   class MyPlugin extends AbstractBillPlugIn {
     private formId: string; // 不要这样做
   }
   
   // ✅ 正确
   class MyPlugin extends AbstractBillPlugIn {
     private getFormId(): string {
       return this.getView().getFormId();
     }
   }
   ```

2. **不要QueryServiceHelper的数据包保存**
   ```typescript
   // ❌ 错误
   let data = QueryServiceHelper.queryOne(...);
   SaveServiceHelper.save([data]); // 会报错
   
   // ✅ 正确
   let data = BusinessDataServiceHelper.loadSingle(...);
   SaveServiceHelper.save([data]);
   ```

3. **不要循环查询单条数据**
   ```typescript
   // ❌ 性能差
   for (let id of idList) {
     let data = BusinessDataServiceHelper.loadSingle(id, "entity");
   }
   
   // ✅ 性能好
   let filter = new QFilter("id", QCP.in, idList);
   let dataList = BusinessDataServiceHelper.load("entity", "id", [filter], "", 100);
   ```

4. **不要在事务内做复杂计算**
   ```typescript
   // ❌ 事务被长时间占用
   beginOperationTransaction(e): void {
     for (let data of dataList) {
       let result = this.complexCalculation(data); // 耗时1秒
       data.set("result", result);
     }
     // 保存...
   }
   
   // ✅ 事务外计算
   beforeExecuteOperationTransaction(e): void {
     for (let data of e.getValidExtDataEntities()) {
       let result = this.complexCalculation(data);
       data.set("result", result);
     }
   }
   ```

5. **不要使用内部模块**
   ```typescript
   // ❌ 错误 - 内部模块，会抛出异常
   import { InternalClass } from "@cosmic/bos-internal-sdk";
   ```

## 常见问题快速解决

### Q1: 字段值获取为null或undefined？

**原因**：
1. 没有在onPreparePropertys中添加字段
2. 字段标识错误
3. 查询时没有包含该字段

**解决**：
- 在操作插件的onPreparePropertys中添加：
  ```typescript
  e.getFieldKeys().add("fieldkey");
  ```
- 查询时selectFields包含该字段：
  ```typescript
  BusinessDataServiceHelper.load("entity", "id,fieldkey", [filter], "", 100);
  ```

### Q2: 单据体字段无法保存？

**原因**：
单据体未设置关键字段，代码赋值的行被视为空行

**解决**：
在表单设计器中，选中单据体 → 右侧属性 → 关键字段 → 选择一个字段（如物料字段）

### Q3: 自定义校验未生效？

**原因**：
1. 校验器未添加到onAddValidators
2. ValidationErrorInfo的参数设置错误

**解决**：
```typescript
onAddValidators(e: AddValidatorsEventArgs): void {
  class MyValidator extends AbstractValidator {
    validate(): void {
      let info = new ValidationErrorInfo(
        "",  // 字段标识，空表示单据级
        extDataEntity.getBillPkId(),  // 单据ID
        extDataEntity.getDataEntityIndex(),  // 数据索引
        extDataEntity.getRowIndex(),  // 行索引
        "ERROR_CODE",  // 错误代码
        operateName,  // 操作名称
        "错误消息",  // 错误消息
        ErrorLevel.Error  // 错误级别
      );
      this.getValidateResult().addErrorInfo(info);
    }
  }
  e.addValidator(new MyValidator());
}
```

### Q4: 报错"Cannot read property 'xxx' of undefined"？

**原因**：
访问了null或undefined对象的属性

**解决**：
添加空值判断：
```typescript
let data = this.getModel().getValue("field");
if (data && data.get("subfield")) {
  let value = data.get("subfield").get("value");
}
```

### Q5: 如何调试Kingscript代码？

**方法**：
1. **console.log**：在关键位置打印日志
   ```typescript
   console.log("当前单据编号：", billno);
   ```

2. **debugger**：在代码中添加debugger语句
   ```typescript
   debugger; // 浏览器会在此处暂停
   ```

3. **VSCode调试**：
   - 配置launch.json
   - 设置断点
   - 启动调试

4. **苍穹平台调试**：
   - 在苍穹平台中打开"调试模式"
   - 在浏览器查看控制台输出

## 工具和资源

### 官方资源
- **金蝶苍穹官方社区**：https://vip.kingdee.com
- **开发文档**：https://vip.kingdee.com/article
- **API文档**：请参考苍穹平台内嵌文档

### 开发工具
- **VSCode**：推荐编辑器，支持Kingscript插件
- **苍穹在线编辑器**：平台内置，无需安装

### 学习路径
1. 先从简单的表单插件开始（字段赋值、值更新）
2. 学习操作插件（自定义校验）
3. 掌握ORM查询和保存
4. 研究复杂业务场景（事务处理、关联同步）

## 版本更新

当前版本：v1.0.0

## 贡献建议

如果使用过程中发现问题或有优化建议，欢迎反馈！

## 许可证

本Skill遵循Apache 2.0许可证。
