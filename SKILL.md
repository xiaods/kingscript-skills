---
name: kingscript-plugin-dev
description: 金蝶苍穹Kingscript插件开发，用于创建单据表单插件和操作插件，支持数据校验、业务逻辑处理、数据访问和界面交互等功能。当需要开发Kingscript脚本（.ts文件）来扩展金蝶苍穹低代码平台的业务功能时，使用此技能。
---

# Kingscript 插件开发

这个技能为金蝶苍穹平台Kingscript插件开发提供全面指导，包括表单插件、操作插件的完整开发流程、API参考和常见场景的解决方案。

## 何时使用此技能

当需要完成以下任务时，使用此技能：

- **创建表单插件**（继承 `AbstractBillPlugIn` 或 `AbstractFormPlugin`）
  - 界面加载和初始化处理
  - 控件属性控制（可见性、锁定性）
  - 值更新事件处理
  - 按钮点击事件处理
  - 基础资料F7过滤
  - 父子页面弹窗交互

- **创建操作插件**（继承 `AbstractOperationServicePlugin`）
  - 自定义数据校验
  - 事务前数据整理
  - 事务内关联数据同步
  - 事务后发送通知、记录日志
  - 事务回滚补偿处理

- **使用ORM进行数据访问**
  - 查询单据数据（支持缓存查询）
  - 新增、修改、删除数据
  - 使用QFilter构建查询条件

## 核心开发流程

### 1. 创建基础插件类

#### 表单插件基础结构
```typescript
import { AbstractBillPlugIn } from "@cosmic/bos-core/kd/bos/bill";
import { EventObject } from "@cosmic/bos-script/java/util";

class MyFormPlugin extends AbstractBillPlugIn {
  // 重写需要的事件处理方法
  afterCreateNewData(e: EventObject): void {
    // 新增单据时的初始化逻辑
    super.afterCreateNewData(e);
  }
  
  registerListener(e: EventObject): void {
    // 注册事件监听器
    super.registerListener(e);
  }
  
  // 必须导出插件实例
  itemClick or propertyChanged methods implementation
}

let plugin = new MyFormPlugin();
export { plugin };
```

**注意**：每种类型的插件中只有一个插件类的实例会被创建，类的方法被所有表单实例共用，类属性是所有表单共享的字段。插件类方法里必须定义局部变量，不要定义类属性。

#### 操作插件基础结构
```typescript
import { AbstractOperationServicePlugIn } from "@cosmic/bos-core/kd/bos/entity/plugin";

class MyOperationPlugin extends AbstractOperationServicePlugIn {
  // 指定需要加载的字段
  onPreparePropertys(e: PreparePropertysEventArgs): void {
    e.getFieldKeys().add("field1");
    e.getFieldKeys().add("field2");
  }
  
  // 添加自定义校验器
  onAddValidators(e: AddValidatorsEventArgs): void {
    // 添加校验逻辑
  }
  
  // 事务前处理
  beforeExecuteOperationTransaction(e: BeforeOperationArgs): void {
    // 数据整理逻辑
  }
  
  // 事务内同步
  beginOperationTransaction(e: BeginOperationTransactionArgs): void {
    // 关联数据同步
  }
  
  // 事务后处理
  afterExecuteOperationTransaction(e: AfterOperationArgs): void {
    // 记录日志、发送通知
  }
}

let plugin = new MyOperationPlugin();
export { plugin };
```

### 2. 开发环境准备

**VSCode开发**：
1. 安装Kingscript插件
2. 创建.ts文件
3. 右键单击 → "脚本上传至账套"（如果是在线编辑器，直接保存即可）

**金蝶开发平台**：
1. 找到对应单据
2. 在表单/列表设计器中单击「大纲」→「插件」
3. 选择脚本
4. 单击「确定」保存
5. 预览查看效果

### 3. 常见开发场景

#### 场景1：新增单据时设置默认值

```typescript
afterCreateNewData(e: EventObject): void {
  // 单选头字段赋值
  this.getModel().setValue("remark", "默认值");
  
  // 基础资料赋值
  let user = BusinessDataServiceHelper.loadSingle("bos_user", [new QFilter("number", "=", "admin")]);
  this.getModel().setValue("registrant", user);
  
  // 单据体赋值 - 批量新增行
  let indices = this.getModel().batchCreateNewEntryRow("entryentity", 2);
  for (let i = 0; i < indices.length; i++) {
    this.getModel().setValue("qtyfield", 10, indices[i]);
  }
  
  super.afterCreateNewData(e);
}
```

#### 场景2：字段值变更时同步处理

```typescript
propertyChanged(e: PropertyChangedArgs): void {
  if (e.getProperty().getName() == "dept") {
    // 部门变更自动带出公司
    let department = e.getChangeSet()[0].getNewValue();
    if (department) {
      let company = OrgUnitServiceHelper.getCompanyfromOrg(department.getPkValue());
      this.getModel().setValue("company", company.get("id"));
    }
  }
  super.propertyChanged(e);
}
```

#### 场景3：自定义数据校验

```typescript
onAddValidators(e: AddValidatorsEventArgs): void {
  class MyValidator extends AbstractValidator {
    validate(): void {
      let dataentities = this.getDataEntities();
      for (let data of dataentities) {
        let entryCollection = data.get("entryentity") as DynamicPropertyCollection;
        if (entryCollection.size() <= 0) {
          let errorInfo = new ValidationErrorInfo(
            "", data.getPkValue(), 0, 0,
            "ERROR_CODE",
            this.getValidateContext().getOperateName(),
            "分录不能为空",
            ErrorLevel.Error
          );
          this.getValidateResult().addErrorInfo(errorInfo);
        }
      }
    }
  }
  e.addValidator(new MyValidator());
}
```

#### 场景4：查询并修改数据

```typescript
itemClick(e: ItemClickEvent): void {
  if (e.getItemKey() == "btn_edit") {
    // 获取选中行
    let selectedRows = this.getSelectedRows();
    let pkIds = selectedRows.getPrimaryKeyValues();
    
    // 查询数据（必须用BusinessDataServiceHelper才能保存）
    let filter = new QFilter("id", QCP.in, pkIds);
    let dataList = BusinessDataServiceHelper.load("bill", "id,entryentity.qty", [filter], "", 100);
    
    // 修改数据
    for (let data of dataList) {
      let entries = data.get("entryentity") as DynamicObjectCollection;
      for (let entry of entries) {
        let qty = entry.get("qty");
        entry.set("qty", qty * 2); // 数量翻倍
      }
    }
    
    // 保存
    SaveServiceHelper.saveOperate("bill", dataList, OperateOption.create());
  }
}
```

#### 场景5：基础资料F7过滤

```typescript
// 实现BeforeF7SelectListener接口
class MyPlugin extends AbstractBillPlugIn implements BeforeF7SelectListener {
  registerListener(e: EventObject): void {
    let basedataEdit = this.getView().getControl("material") as BasedataEdit;
    basedataEdit.addBeforeF7SelectListener(this);
  }
  
  beforeF7Select(evt: BeforeF7SelectEvent): void {
    if (evt.getProperty().getName() == "material") {
      let filter = new ArrayList();
      filter.add(new QFilter("number", "like", "001.%")); // 编码以001.开头
      evt.setCustomQFilters(filter);
    }
  }
}
```

### 4. 关键开发原则

#### ⚠️ 插件设计原则
1. **无状态设计**：表单界面在服务端是无状态的。界面加载完后，表单及数据模型实例会销毁并存到缓存中；页面交互过程会从缓存中重新构建这些模型实例
2. **避免类属性**：插件类中不要定义类属性，所有字段都应该是方法内的局部变量。因为插件实例被所有表单共享
3. **局部变量**：插件类方法里必须定义局部变量

#### 📋 字段标识获取
1. 在表单设计器中单击对应字段
2. 在右侧「业务属性」中查看：
   - **字段标识**：用于getValue/setValue
   - **控件标识**：用于getControl
   - **单据体标识**：用于分录操作

#### 🎯 查询接口选择
- **需要修改保存**：使用 `BusinessDataServiceHelper.load/loadSingle`
- **仅查询展示**：使用 `QueryServiceHelper.query/queryOne`（性能更好）
- **查询基础资料**：少量用 `loadFromCache`，大量用 `QueryServiceHelper`

#### 🔒 事务处理
- **事务外**：beforeExecuteOperationTransaction中进行数据整理
- **事务内**：beginOperationTransaction中进行关联数据同步（不支持跨库）
- **事务后**：afterExecuteOperationTransaction中进行日志、通知等非事务性操作
- **回滚补偿**：rollbackOperation中处理第三方系统数据的补偿逻辑

#### 💾 保存方式选择
- **完整操作**：使用 `SaveServiceHelper.saveOperate`（触发校验、插件）
- **直接保存**：紧急情况下使用 `SaveServiceHelper.save/update`（不走校验）

## 参考文档

根据具体开发需求，参考以下详细文档：

- **[语法基础](references/syntax.md)** - Kingscript语言基础：模块、变量、类型、循环等
- **[操作插件开发](references/operation-plugin.md)** - 操作插件完整指南：所有事件详解、示例
- **[数据服务接口](references/data-service.md)** - ORM完整指南：查询、保存、更新、删除，接口对比
- **[表单插件开发](references/form-plugin.md)** - 表单插件完整指南：所有事件详解、控件操作、示例

## 常见问题排查

### ❌ 字段不存在错误
**原因**：
1. 没有在onPreparePropertys中添加字段
2. 查询时selectFields不包含该字段
3. 字段标识错误或大小写不匹配

**解决**：
- 在操作插件的onPreparePropertys中添加：`e.getFieldKeys().add("fieldKey")`
- 查询时确保selectFields包含所需字段，分录字段格式：`entryentity.field`

### ❌ 数据丢失
**原因**：
1. 使用QueryServiceHelper查询的数据包不能保存
2. 单据体未设置关键字段，导致代码赋值的行被清空

**解决**：
- 可修改数据必须用BusinessDataServiceHelper查询
- 在单据体属性中设置关键字段（如物料字段）

### ❌ 校验不生效
**原因**：使用了直接保存save/update，不走操作校验

**解决**：
- 常规业务使用saveOperate
- 仅在数据修复等特殊场景使用save/update

### ❌ 事务回滚但第三方数据未回滚
**原因**：beginOperationTransaction中调用了第三方接口，但rollbackOperation未做补偿

**解决**：
- 在beginOperationTransaction中记录需要补偿的操作
- 在rollbackOperation中实现补偿逻辑（删除第三方数据等）

### ❌ 性能问题
**原因**：
1. 大量数据一次性查询/保存
2. 使用缓存查询大量数据

**解决**：
1. 分批处理数据
2. 大数据量查询使用QueryServiceHelper
3. 只查询必要字段

## 最佳实践

### ✅ 1. 统一的错误处理
```typescript
private showErrorMessage(result: OperationResult, customMessage: string): void {
  let message = result.getMessage();
  result.getAllErrorOrValidateInfo().forEach(function(errorinfo) {
    message += errorinfo.getMessage();
  });
  this.getView().showErrMessage(message, customMessage);
}
```

### ✅ 2. 常量定义
```typescript
// 实体标识常量
const ENTITY = {
  REQ_BILL: "kdtest_reqbill",
  ORDER: "kdtest_order",
  MATERIAL: "bd_material"
};

// 字段标识常量
const FIELD = {
  BILLNO: "billno",
  QTY: "kdtest_qtyfield",
  MATERIAL: "kdtest_materielfield"
};
```

### ✅ 3. 日志记录
```typescript
console.log("操作开始: " + operationKey);
// ... 业务逻辑
debugger; // 断点调试
console.error("操作失败: " + error);
```

### ✅ 4. 代码复用
将通用逻辑抽取为独立函数，如数据查询、校验规则等，便于维护。

### ✅ 5. 注释规范
```typescript
/**
 * 功能描述
 * @param e 事件参数
 * @returns 返回值说明
 */
```

## 快速索引

### 事件触发顺序

**表单插件**：
```
preOpenForm → initialize → registerListener → 
afterCreateNewData（仅新增）/ afterLoadData（仅编辑） → 
beforeBindData → afterBindData → 
User Interaction Events → beforeClosed → destroy
```

**操作插件**：
```
onPreparePropertys → onAddValidators → 
beforeExecuteOperationTransaction → 
beginOperationTransaction → endOperationTransaction → 
afterExecuteOperationTransaction → onReturnOperation
```

### 常用API速查

| 功能 | API |
|-----|-----|
| 获取字段值 | `this.getModel().getValue(key, rowIndex?)` |
| 设置字段值 | `this.getModel().setValue(key, value, rowIndex?)` |
| 获取单据体行数 | `this.getModel().getEntryRowCount(entryKey)` |
| 新增单据体行 | `this.getModel().batchCreateNewEntryRow(entryKey, count)` |
| 获取控件 | `this.getView().getControl(key)` |
| 设置可见性 | `this.getView().setVisible(visible, fieldKey)` |
| 设置锁定性 | `this.getView().setEnable(enabled, rowIndex, fieldKey)` |
| 执行操作 | `this.getView().invokeOperation(key, option?)` |
| 查询数据 | `BusinessDataServiceHelper.load/loadSingle` |
| 查询平铺数据 | `QueryServiceHelper.query/queryOne` |
| 保存数据 | `SaveServiceHelper.saveOperate` |
| 删除数据 | `DeleteServiceHelper.deleteOperate` |
| 获取当前用户 | `RequestContext.get().getCurrUserId()` |

## 联系与支持

- **官方社区**：https://vip.kingdee.com
- **文档查阅**：https://vip.kingdee.com/article
- **AI能力**：Kingscript提供AI能力及代码片段辅助编程
