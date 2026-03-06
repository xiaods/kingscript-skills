---
name: kingscript-plugin-dev
description: 金蝶苍穹 Kingscript 插件开发专家。当用户需要为金蝶苍穹/cosmic 平台编写 Kingscript/KS 脚本插件时使用此技能，包括但不限于：操作插件、表单插件、列表插件、转换插件、报表插件、工作流插件、调度任务等。涵盖插件生命周期、ORM 数据访问、BigDecimal 财务计算、界面交互控制、F7过滤、页面弹窗传参、消息通知、DataSet统计报表。即使用户只提到"苍穹插件"、"kingscript"、"KS脚本"、"cosmic插件"、"单据插件"、"保存校验"、"字段联动"、"下推转换"、"单据下推"、"ORM查询"、"F7过滤"、"审批流"、"定时任务"、"入库出库"、"金蝶二开"、"苍穹二开"、"苍穹脚本"、"单据联动"、"列表过滤"、"报表取数"、"金蝶低代码"、"自定义操作"、"单据校验"等关键词，也应触发此技能。
---

# Kingscript 插件开发专家

为金蝶苍穹平台 Kingscript 插件开发提供全面指导。

## 插件类型速查

| 插件类型 | 基类 | 导入路径 | 参考文档 |
|---------|------|----------|---------|
| 操作插件 | AbstractOperationServicePlugIn | @cosmic/bos-core/kd/bos/entity/plugin | [operation-plugin.md](references/operation-plugin.md) |
| 表单插件 | AbstractBillPlugIn | @cosmic/bos-core/kd/bos/bill | [form-plugin.md](references/form-plugin.md) |
| 列表插件 | AbstractListPlugin | @cosmic/bos-core/kd/bos/list/plugin | [list-plugin.md](references/list-plugin.md) |
| 转换插件 | AbstractConvertPlugIn | @cosmic/bos-core/kd/bos/entity/botp/plugin | [convert-plugin.md](references/convert-plugin.md) |
| 报表表单插件 | AbstractReportFormPlugin | @cosmic/bos-core/kd/bos/report/plugin | [report-plugin.md](references/report-plugin.md) |
| 报表查询插件 | AbstractReportListDataPlugin | @cosmic/bos-core/kd/bos/entity/report | [report-plugin.md](references/report-plugin.md) |
| 打印插件 | AbstractPrintPlugin | @cosmic/bos-core/kd/bos/print/core/plugin | [other-plugins.md](references/other-plugins.md) |
| 工作流插件 | WorkflowPlugin / IWorkflowPlugin | @cosmic/bos-core/kd/bos/workflow/engine/extitf | [other-plugins.md](references/other-plugins.md) |
| 调度任务 | AbstractTask | @cosmic/bos-core/kd/bos/schedule | [other-plugins.md](references/other-plugins.md) |
| 引入插件 | BatchImportPlugin | @cosmic/bos-core/kd/bos/form/plugin/impt | [other-plugins.md](references/other-plugins.md) |
| 引出插件 | AbstractListPlugin | @cosmic/bos-core/kd/bos/list/plugin | [other-plugins.md](references/other-plugins.md) |

**开发时先确定插件类型，再阅读对应的参考文档获取完整事件列表和示例代码。**

---

## 文件命名与结构

### 命名规范

**格式**：`{entity}_{type}_{operation}.ts`

- 实体名：小写，如 `pm_purorderbill`, `ap_paybill`
- 类型标识：`op`(操作)、`form`(表单)、`list`(列表)、`conv`(转换)、`rpt`(报表)
- 操作类型：`save`, `submit`, `audit`, `delete`

示例：`ap_paybill_op_save.ts`、`pm_purorderbill_form.ts`、`pm_to_im_conv.ts`

**文件路径**：`src/@cosmic/{MODULE}/{SUBMODULE}_ext/`

### 插件骨架

所有插件遵循相同的结构模式：

```typescript
import { 基类 } from "导入路径";

class MyPlugin extends 基类 {
  // 重写生命周期方法
  someEvent(e: any): void {
    super.someEvent(e);
    // 业务逻辑（使用局部变量）
  }
}

let plugin = new MyPlugin();
export { plugin };
```

完整模板见 [scripts/form-plugin-template.ts](scripts/form-plugin-template.ts) 和 [scripts/operation-plugin-template.ts](scripts/operation-plugin-template.ts)。

---

## 生命周期速查

### 操作插件生命周期（按执行顺序）

| 方法 | 触发时机 | 用途 | 事务状态 |
|------|---------|------|---------|
| onPreparePropertys | 最先执行 | 预加载字段 | 事务外 |
| onAddValidators | 校验前 | 添加自定义校验器 | 事务外 |
| beforeExecuteOperationTransaction | 校验后、事务前 | 数据整理/取消操作 | 事务外 |
| beginOperationTransaction | 事务已开启 | 关联数据同步（不支持跨库） | 事务内 |
| endOperationTransaction | 数据已入库 | 关联数据同步 | 事务内 |
| rollbackOperation | 事务回滚后 | 补偿处理 | 事务外 |
| afterExecuteOperationTransaction | 事务提交后 | 日志、通知 | 事务外 |

### 表单插件生命周期（按执行顺序）

| 方法 | 触发时机 | 用途 |
|------|---------|------|
| preOpenForm | 打开前 | 取消打开、修改标题 |
| initialize | 初始化 | 表单视图模型初始化 |
| registerListener | 注册监听 | 注册按钮点击、F7 过滤等 |
| afterCreateNewData | 新建后（仅新增时） | 设置默认值 |
| afterLoadData | 加载后（仅编辑时） | 控制界面状态 |
| afterBindData | 绑定后 | 修改控件属性（可见性、锁定性） |
| propertyChanged | 字段变更 | 联动计算 |
| beforeDoOperation | 操作前 | 界面级校验 |
| afterDoOperation | 操作后 | 操作结果处理 |

---

## 关键原则

### 1. 无状态设计（最重要）

插件实例被所有表单共享，界面关闭后实例会被缓存复用。因此：

- **禁止在类中定义属性**，所有数据必须使用方法内的局部变量
- 通过 `this.getModel()` / `this.getView()` 获取当前上下文

```typescript
// 错误：类属性会被所有表单实例共享，导致数据串扰
class MyPlugin extends AbstractBillPlugIn {
  private currentBillNo: string;  // 禁止
}

// 正确：使用局部变量
class MyPlugin extends AbstractBillPlugIn {
  afterLoadData(e: any): void {
    const currentBillNo = this.getModel().getValue("billno") as string;
  }
}
```

### 2. 字段预加载

操作插件中使用 `get(field)` 或 `set(field)` 前，必须在 `onPreparePropertys` 中声明字段：

```typescript
onPreparePropertys(e: any): void {
  super.onPreparePropertys(e);
  const props = e.getFieldKeys();
  props.add("billno");
  props.add("supplier");
  props.add("supplier.name");        // 基础资料关联属性
  props.add("billentry.payamount");   // 分录字段需加前缀
}
```

### 3. 查询接口选择

| 场景 | 接口 | 原因 |
|------|------|------|
| 需要修改并保存 | `BusinessDataServiceHelper.load/loadSingle` | 返回结构化可保存数据 |
| 仅查询展示 | `QueryServiceHelper.query/queryOne` | 性能更好，返回平铺数据 |
| 查询少量基础资料 | `BusinessDataServiceHelper.loadFromCache` | 走缓存，速度快 |

详见 [data-service.md](references/data-service.md)。

### 4. 事务处理

- 耗时操作（数据计算、格式转换）放在 `beforeExecuteOperationTransaction`（事务外）
- `beginOperationTransaction` 内只做数据库操作，不支持跨库
- 第三方系统同步需在 `rollbackOperation` 中做补偿
- 日志、通知放在 `afterExecuteOperationTransaction`（事务后）

### 5. 财务计算

金额、数量、单价等财务数据必须使用 `BigDecimal`，禁止使用 `number` 类型。详见 [bigdecimal.md](references/bigdecimal.md)。

---

## SDK 限流规范

| 操作 | 限制 | 说明 |
|------|------|------|
| 单次查询返回行数 | <= 50,000 行 | 超出抛异常 |
| 单次查询字段数 | <= 100 个 | 只查必要字段 |
| 事务内查询次数 | <= 150 次 | 避免循环中查询 |
| 事务内 DML 次数 | <= 100 次 | 合并批量操作 |
| 单次 DML 影响记录 | <= 1,000 条 | 大数据量分批处理 |
| 单次 load 返回行数 | <= 1,000 行 | 大量数据用 QueryServiceHelper |

**禁止直接使用 DB 或 ORM 操作数据库，必须通过 ServiceHelper。**

---

## 常用导入

```typescript
// 插件基类（按需选择一个）
import { AbstractOperationServicePlugIn } from "@cosmic/bos-core/kd/bos/entity/plugin";
import { AbstractBillPlugIn } from "@cosmic/bos-core/kd/bos/bill";
import { AbstractListPlugin } from "@cosmic/bos-core/kd/bos/list/plugin";
import { AbstractConvertPlugIn } from "@cosmic/bos-core/kd/bos/entity/botp/plugin";

// 数据类型与服务（最常用）
import { DynamicObject, DynamicObjectCollection } from "@cosmic/bos-core/kd/bos/dataentity/entity";
import { BusinessDataServiceHelper, QueryServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper";
import { SaveServiceHelper, OperationServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper/operation";
import { QFilter, QCP } from "@cosmic/bos-core/kd/bos/orm/query";
import { RequestContext } from "@cosmic/bos-core/kd/bos/context";
// BigDecimal 是内置类型，无需导入
```

完整导入列表（含校验器、控件事件、消息通知等）见 [syntax.md](references/syntax.md)。

---

## 常用 API 速查

| 功能 | API |
|-----|-----|
| 获取字段值 | `this.getModel().getValue(key, rowIndex?)` |
| 设置字段值 | `this.getModel().setValue(key, value, rowIndex?)` |
| 获取单据体行数 | `this.getModel().getEntryRowCount(entryKey)` |
| 获取单据体实体 | `this.getModel().getEntryEntity(entryKey)` |
| 批量新增行 | `this.getModel().batchCreateNewEntryRow(entryKey, count)` |
| 新增单行 | `this.getModel().createNewEntryRow(entryKey)` |
| 删除行 | `this.getModel().deleteEntryRow(entryKey, rowIndex)` |
| 获取控件 | `this.getView().getControl(key)` |
| 设置可见性 | `this.getView().setVisible(visible, fieldKey)` |
| 设置锁定性 | `this.getView().setEnable(enabled, rowIndex?, fieldKey)` |
| 执行操作 | `this.getView().invokeOperation(key, option?)` |
| 打开页面 | `this.getView().showForm(parameter)` |
| 关闭页面 | `this.getView().close()` |
| 查询数据 | `BusinessDataServiceHelper.load/loadSingle` |
| 查询平铺数据 | `QueryServiceHelper.query/queryOne` |
| 检查数据存在 | `QueryServiceHelper.exists(entityName, filters)` |
| 创建空数据包 | `BusinessDataServiceHelper.newDynamicObject(entityName)` |
| 保存数据 | `SaveServiceHelper.saveOperate` |
| 调用操作 | `OperationServiceHelper.executeOperate(opKey, entity, data, option)` |
| 获取当前用户 | `RequestContext.get().getCurrUserId()` |
| 获取当前组织 | `RequestContext.get().getOrgId()` |
| 获取页面参数 | `this.getView().getFormShowParameter().getCustomParams()` |
| 发送消息 | `MessageCenterServiceHelper.sendMessage/batchSendMessages` |
| 显示成功提示 | `this.getView().showSuccessNotification(msg)` |
| 显示错误提示 | `this.getView().showErrorNotification(msg)` |

---

## 代码质量检查清单

- 正确继承基类
- 导出 plugin 单例：`let plugin = new XxxPlugin(); export { plugin };`
- 所有重写方法调用 super
- 插件类中无类属性，只有局部变量
- 操作插件中使用的字段已在 onPreparePropertys 中预加载
- 财务计算使用 BigDecimal
- 遵守 SDK 限流规范
- 无 console.log（生产环境）
- 函数简短（< 50 行），文件聚焦（< 800 行）
- 查询接口选择正确（可保存 vs 只读）

---

## KingScript 特殊限制

- 不支持静态变量
- 不支持泛型导入（`ArrayList<String>` 需写 `ArrayList`）
- 不要使用 `$`（全局保留关键字）
- 异常信息不要包含敏感数据

---

## 参考文档索引

根据开发需求查阅对应文档：

| 需求 | 文档 | 内容 |
|------|------|------|
| 语法基础 | [syntax.md](references/syntax.md) | 模块、变量、类型、循环、完整导入列表 |
| 操作插件 | [operation-plugin.md](references/operation-plugin.md) | 完整事件详解、校验器、事务处理示例 |
| 表单插件 | [form-plugin.md](references/form-plugin.md) | 完整事件详解、F7过滤（含左树过滤）、弹窗交互、CloseCallBack 回调、字段联动 |
| 列表插件 | [list-plugin.md](references/list-plugin.md) | 过滤排序、列控制、超链接跳转、用户组织过滤、过滤面板初始化 |
| 转换插件 | [convert-plugin.md](references/convert-plugin.md) | 下推条件、源单取值、分单合单 |
| 报表插件 | [report-plugin.md](references/report-plugin.md) | 报表界面、取数逻辑、DataSet分组统计、条件样式 |
| 其他插件 | [other-plugins.md](references/other-plugins.md) | 打印、工作流（含动态审批人）、调度任务、引入引出 |
| 数据服务 | [data-service.md](references/data-service.md) | ORM 查询、保存、QFilter |
| 精确计算 | [bigdecimal.md](references/bigdecimal.md) | BigDecimal 完整用法 |
| 开发案例 | [common-examples.md](references/common-examples.md) | 页面弹窗交互、防重复操作、消息通知、完整业务场景 |

## 模块缩写对照

| 缩写 | 模块 | 缩写 | 模块 |
|------|------|------|------|
| FI | 财务 | AP | 应付 |
| AR | 应收 | GL | 总账 |
| FA | 固定资产 | PM | 采购 |
| IM | 库存 | SM | 销售 |
| SCMC | 供应链 | MFG | 生产 |
| CONM | 合同 | - | - |
