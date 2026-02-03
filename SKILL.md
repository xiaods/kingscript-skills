---
name: kingscript-plugin-dev
description: 金蝶苍穹Kingscript插件开发专家，支持10种插件类型开发：操作插件、表单插件、列表插件、转换插件、报表插件、打印插件、工作流插件、引入/引出插件。提供完整生命周期指导、数据访问、业务逻辑处理、界面交互、财务计算等全方位开发能力。
---

# Kingscript 插件开发专家

这个技能为金蝶苍穹平台 Kingscript 插件开发提供全面指导，涵盖10种插件类型的完整开发流程、生命周期方法、API 参考、常用模式和最佳实践。

## 何时使用此技能

当需要完成以下任务时，使用此技能：

- **创建操作插件** - 保存/提交/审核等操作的数据校验、事务处理、后续同步
- **创建表单插件** - 界面加载初始化、字段联动计算、控件状态控制、事件处理
- **创建列表插件** - 自定义过滤条件、列表数据格式化、动态列控制
- **创建转换插件** - 单据下推转换、字段映射、分单合单逻辑
- **创建报表插件** - 报表取数、报表界面交互、数据格式化
- **创建其他插件** - 打印控制、工作流审批、数据导入导出
- **使用 ORM 进行数据访问** - 查询、新增、修改、删除数据
- **财务精确计算** - 使用 BigDecimal 进行金额、数量、单价计算

---

## 插件类型速查

| 插件类型 | 基类 | 导入路径 | 用途 |
|---------|------|----------|------|
| 操作插件 | AbstractOperationServicePlugIn | @cosmic/bos-core/kd/bos/entity/plugin | 保存/提交/审核/删除等操作 |
| 表单插件 | AbstractBillPlugIn | @cosmic/bos-core/kd/bos/bill | 单据界面交互 |
| 列表插件 | AbstractListPlugin | @cosmic/bos-core/kd/bos/list/plugin | 列表过滤/展示 |
| 转换插件 | AbstractConvertPlugIn | @cosmic/bos-core/kd/bos/entity/botp/plugin | 单据下推转换 |
| 报表表单插件 | AbstractReportFormPlugin | @cosmic/bos-core/kd/bos/report/plugin | 报表界面 |
| 报表查询插件 | AbstractReportListDataPlugin | @cosmic/bos-core/kd/bos/entity/report | 报表取数 |
| 打印插件 | AbstractPrintPlugin | @cosmic/bos-core/kd/bos/print/core/plugin | 打印控制 |
| 工作流插件 | WorkflowPlugin | @cosmic/bos-core/kd/bos/workflow/engine/extitf | 流程控制 |
| 引入插件 | BatchImportPlugin | @cosmic/bos-core/kd/bos/form/plugin/impt | 数据导入 |
| 引出插件 | AbstractListPlugin | @cosmic/bos-core/kd/bos/list/plugin | 数据导出 |

---

## 核心开发流程

### 1. 文件命名规范（严格遵循）

**格式**: `{entity}_{type}_{operation}.ts`

- **实体名**：小写，如 `pm_purorderbill`, `ap_paybill`
- **类型标识**：
  - `op` - 操作插件
  - `form` - 表单插件
  - `list` - 列表插件
  - `conv` - 转换插件
  - `rpt` - 报表插件
- **操作类型**：`save`, `submit`, `audit`, `delete`

**示例**：
- `ap_paybill_op_save.ts` - 应付单保存操作插件
- `pm_purorderbill_form.ts` - 采购订单表单插件
- `im_instock_list.ts` - 入库单列表插件
- `pm_to_im_conv.ts` - 采购转入库转换插件

**文件路径**: `src/@cosmic/{MODULE}/{SUBMODULE}_ext/`

### 2. 插件基础结构模板

#### 操作插件模板

```typescript
import { AbstractOperationServicePlugIn } from "@cosmic/bos-core/kd/bos/entity/plugin";
import { DynamicObject, DynamicObjectCollection } from "@cosmic/bos-core/kd/bos/dataentity/entity";
import { QFilter, QCP } from "@cosmic/bos-core/kd/bos/orm/query";

/**
 * 应付单保存操作插件
 */
class ApPaybillOpSavePlugin extends AbstractOperationServicePlugIn {

  // 1. 预加载字段（必须先加载才能访问）
  onPreparePropertys(e: any): void {
    super.onPreparePropertys(e);
    const props = e.getFieldKeys();

    // 单据头字段
    props.add("billno");
    props.add("billstatus");
    props.add("totalamount");

    // 基础资料字段（需加载关联属性）
    props.add("supplier");
    props.add("supplier.name");

    // 分录字段（需加前缀）
    props.add("billentry.payamount");
    props.add("billentry.remark");
  }

  // 2. 添加自定义校验器
  onAddValidators(e: any): void {
    super.onAddValidators(e);
    // 添加校验逻辑
  }

  // 3. 事务前处理（校验后、事务开始前）
  beforeExecuteOperationTransaction(e: any): void {
    super.beforeExecuteOperationTransaction(e);
    const dataEntities: DynamicObject[] = e.getDataEntities();

    for (const entity of dataEntities) {
      // 数据整理、业务校验
      const totalAmount = entity.get("totalamount") as BigDecimal;
      if (totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
        e.setCancel(true);
        e.setCancelMessage("付款金额必须大于0");
        return;
      }
    }
  }

  // 4. 事务内同步（事务已开启，未入库）
  beginOperationTransaction(e: any): void {
    super.beginOperationTransaction(e);
    // 关联数据同步（必须在同一个数据库）
  }

  // 5. 事务后处理（事务提交后）
  afterExecuteOperationTransaction(e: any): void {
    super.afterExecuteOperationTransaction(e);
    // 记录日志、发送通知等非事务性操作
  }

  // 6. 事务结束清理
  endOperationTransaction(e: any): void {
    super.endOperationTransaction(e);
    // 清理缓存、释放资源
  }
}

let plugin = new ApPaybillOpSavePlugin();
export { plugin };
```

#### 表单插件模板

```typescript
import { AbstractBillPlugIn } from "@cosmic/bos-core/kd/bos/bill";
import { PropertyChangedArgs } from "@cosmic/bos-core/kd/bos/entity/datamodel/events";
import { BeforeF7SelectEvent, BeforeF7SelectListener } from "@cosmic/bos-core/kd/bos/form/control/events";
import { BasedataEdit } from "@cosmic/bos-core/kd/bos/form/control";
import { ArrayList } from "@cosmic/bos-script/java/util";
import { QFilter } from "@cosmic/bos-core/kd/bos/orm/query";

/**
 * 采购订单表单插件
 */
class PmPurorderbillFormPlugin extends AbstractBillPlugIn implements BeforeF7SelectListener {

  // 1. 打开前（可取消打开、修改标题）
  preOpenForm(e: any): void {
    super.preOpenForm(e);
  }

  // 2. 初始化
  initialize(): void {
    super.initialize();
  }

  // 3. 注册事件监听
  registerListener(e: any): void {
    super.registerListener(e);

    // 注册 F7 过滤
    const materialEdit = this.getView().getControl("material") as BasedataEdit;
    if (materialEdit) {
      materialEdit.addBeforeF7SelectListener(this);
    }
  }

  // 4. 新建后初始化默认值
  afterCreateNewData(e: any): void {
    super.afterCreateNewData(e);

    // 设置默认值
    this.getModel().setValue("billdate", new Date());
    this.getModel().setValue("billstatus", "A");

    // 设置当前用户
    const currentUserId = RequestContext.get().getCurrUserId();
    this.getModel().setValue("creator", currentUserId);
  }

  // 5. 加载数据后
  afterLoadData(e: any): void {
    super.afterLoadData(e);

    // 控制界面状态
    const billStatus = this.getModel().getValue("billstatus") as string;
    if (billStatus === "C") {
      this.getView().setEnable(false, "totalamount");
    }
  }

  // 6. 绑定数据后
  afterBindData(e: any): void {
    super.afterBindData(e);

    // 修改控件属性（可见性、锁定性）
    this.getView().setVisible(true, "remark");
  }

  // 7. 字段值变更处理
  propertyChanged(e: PropertyChangedArgs): void {
    super.propertyChanged(e);

    for (const change of e.getChangeSet()) {
      const fieldKey = change.getPropertyName();
      const rowIndex = change.getRowIndex();

      if (fieldKey === "qty" || fieldKey === "price") {
        // 数量或单价变更时重算金额
        const qty = this.getModel().getValue("qty", rowIndex) as BigDecimal;
        const price = this.getModel().getValue("price", rowIndex) as BigDecimal;

        if (qty != null && price != null) {
          const amount = qty.multiply(price).setScale(2, BigDecimal.ROUND_HALF_UP);
          this.getModel().setValue("amount", amount, rowIndex);
        }
      }
    }
  }

  // 8. 操作前校验
  beforeDoOperation(args: any): void {
    super.beforeDoOperation(args);
    const opKey = args.getOperationKey();

    if (opKey === "submit") {
      // 提交前界面级校验
      const rowCount = this.getModel().getEntryRowCount("billentry");
      if (rowCount === 0) {
        args.setCancel(true);
        this.getView().showErrorNotification("分录不能为空");
      }
    }
  }

  // 9. 操作后处理
  afterDoOperation(args: any): void {
    super.afterDoOperation(args);
    const opKey = args.getOperationKey();

    if (opKey === "save") {
      this.getView().showSuccessNotification("保存成功");
    }
  }

  // 10. F7 过滤处理
  beforeF7Select(evt: BeforeF7SelectEvent): void {
    const propertyName = evt.getProperty().getName();

    if (propertyName === "material") {
      const filters = new ArrayList();
      filters.add(new QFilter("number", "like", "001.%")); // 编码以001开头
      filters.add(new QFilter("usestatus", "=", 1)); // 只显示启用的
      evt.setCustomQFilters(filters);
    }
  }

  // 11. 关闭前
  beforeClosed(e: any): void {
    super.beforeClosed(e);
    // 返回数据给父页面
  }
}

let plugin = new PmPurorderbillFormPlugin();
export { plugin };
```

#### 列表插件模板

```typescript
import { AbstractListPlugin } from "@cosmic/bos-core/kd/bos/list/plugin";
import { SetFilterEvent } from "@cosmic/bos-core/kd/bos/form/events";
import { QFilter } from "@cosmic/bos-core/kd/bos/orm/query";

/**
 * 入库单列表插件
 */
class ImInstockListPlugin extends AbstractListPlugin {

  // 设置过滤条件和排序
  setFilter(e: SetFilterEvent): void {
    super.setFilter(e);

    // 添加自定义过滤条件
    e.addCustomQFilter(new QFilter("billstatus", "!=", "D")); // 排除已关闭

    // 设置排序
    e.setOrderBy("billdate desc, billno desc");
  }

  // 初始化过滤面板
  filterContainerInit(args: any): void {
    super.filterContainerInit(args);
    // 添加常用过滤选项
  }

  // F7 列表过滤
  filterContainerBeforeF7Select(args: any): void {
    super.filterContainerBeforeF7Select(args);
  }

  // 动态增加列
  beforeCreateListColumns(event: any): void {
    super.beforeCreateListColumns(event);
  }

  // 批量调整显示数据
  beforePackageData(e: any): void {
    super.beforePackageData(e);
    for (const row of e.getPageData()) {
      // 批量调整字段值
    }
  }

  // 单个字段格式化
  packageData(e: any): void {
    super.packageData(e);
    if ("amount" === e.getColKey()) {
      const value = e.getValue() as BigDecimal;
      if (value != null) {
        e.setFormatValue(value.toString() + " 元");
      }
    }
  }
}

let plugin = new ImInstockListPlugin();
export { plugin };
```

#### 转换插件模板

```typescript
import { AbstractConvertPlugIn } from "@cosmic/bos-core/kd/bos/entity/botp/plugin";
import { QFilter, QCP } from "@cosmic/bos-core/kd/bos/orm/query";
import { ConvertConst } from "@cosmic/bos-core/kd/bos/entity/botp";

/**
 * 采购转入库转换插件
 */
class PmToImConvPlugin extends AbstractConvertPlugIn {

  // 构建条件前添加下推筛选条件
  beforeBuildRowCondition(e: any): void {
    super.beforeBuildRowCondition(e);

    // 设置不允许下推的条件说明
    e.setCustFilterDesc("不允许下推已关闭的单据");

    // 设置条件表达式（用于脚本执行）
    e.setCustFilterExpression(" billstatus != 'D' ");

    // 设置 QFilter 条件（用于数据查询）
    const qFilter = new QFilter("billstatus", QCP.not_equals, "D");
    e.getCustQFilters().add(qFilter);
  }

  // 创建目标单后从源单取值填充
  afterCreateTarget(e: any): void {
    super.afterCreateTarget(e);

    // 获取生成的目标单
    const dataEntitySet = e.getTargetExtDataEntitySet();

    // 获取目标单分录
    const entryRows = dataEntitySet.FindByEntityKey("entryentity");

    for (const entryRow of entryRows) {
      // 获取源单行
      const srcRows = entryRow.getValue(ConvertConst.ConvExtDataKey_SourceRows);
      if (srcRows && srcRows.size() > 0) {
        // 从源单行取值
        const srcValue = e.getFldProperties().get("customfield").getValue(srcRows.get(0));
        // 设置到目标单
        entryRow.setValue("targetfield", srcValue);
      }
    }
  }

  // 字段映射后补充字段值
  afterFieldMapping(e: any): void {
    super.afterFieldMapping(e);
    // 补充字段值
  }

  // 转换完成后最终调整
  afterConvert(e: any): void {
    super.afterConvert(e);
    // 分单、合单等最终处理
  }
}

let plugin = new PmToImConvPlugin();
export { plugin };
```

---

## 生命周期方法详解

### 操作插件生命周期（按执行顺序）

| 方法 | 触发时机 | 用途 | 事务状态 |
|------|---------|------|---------|
| onPreparePropertys | 最先执行 | 预加载字段（必须先加载才能访问） | 事务外 |
| onAddValidators | 校验前 | 添加自定义校验器 | 事务外 |
| beforeExecuteOperationTransaction | 校验后、事务开始前 | 数据整理/取消操作 | 事务外 |
| beginOperationTransaction | 事务已开启，未入库 | 关联数据同步（事务内） | 事务内 |
| endOperationTransaction | 数据已入库，未提交 | 关联数据同步 | 事务内 |
| rollbackOperation | 事务回滚后 | 补偿处理（如删除第三方数据） | 事务外 |
| afterExecuteOperationTransaction | 事务提交后 | 记录日志、发送通知 | 事务外 |
| onReturnOperation | 返回前 | 结果处理/释放资源 | 事务外 |

### 表单插件生命周期（按执行顺序）

| 方法 | 触发时机 | 用途 | 典型场景 |
|------|---------|------|---------|
| preOpenForm | 打开前 | 可取消打开、修改标题 | 权限检查 |
| initialize | 初始化 | 表单视图模型初始化 | 初始化监听器 |
| registerListener | 注册监听 | 用户与界面控件交互时 | 注册按钮点击、F7过滤 |
| afterCreateNewData | 新建后 | 初始化默认值 | 仅新增时触发 |
| afterLoadData | 加载后 | 控制界面状态 | 仅编辑时触发 |
| afterBindData | 绑定后 | 修改控件属性 | 可见性、锁定性 |
| afterCopyData | 复制后 | 清除不允许复制的数据 | 复制单据时 |
| propertyChanged | 字段变更 | 联动计算 | 字段值改变时 |
| beforeDoOperation | 操作前 | 界面级校验 | 提交前检查 |
| afterDoOperation | 操作后 | 操作结果处理 | 刷新界面 |
| beforeClosed | 关闭前 | 返回数据给父页面 | 弹窗选择 |

### 列表插件生命周期

| 方法 | 触发时机 | 用途 |
|------|---------|------|
| setFilter | 设置过滤 | 自定义过滤条件和排序 |
| filterContainerInit | 过滤面板初始化 | 初始化过滤面板 |
| filterContainerBeforeF7Select | F7选择前 | 列表过滤面板F7过滤 |
| beforeCreateListColumns | 创建列前 | 动态增加列 |
| beforePackageData | 打包数据前 | 批量调整显示数据 |
| packageData | 打包数据时 | 单个字段格式化 |
| billListHyperLinkClick | 超链接点击 | 处理超链接点击事件 |

### 转换插件生命周期

| 方法 | 触发时机 | 用途 |
|------|---------|------|
| beforeBuildRowCondition | 构建条件前 | 添加下推筛选条件 |
| afterCreateTarget | 创建目标单后 | 从源单取值填充 |
| afterFieldMapping | 字段映射后 | 补充字段值 |
| afterConvert | 转换完成后 | 最终调整（分单、合单） |

---

## 常用导入汇总

```typescript
// ========== 核心插件基类 ==========
import { AbstractOperationServicePlugIn } from "@cosmic/bos-core/kd/bos/entity/plugin";
import { AbstractBillPlugIn } from "@cosmic/bos-core/kd/bos/bill";
import { AbstractListPlugin } from "@cosmic/bos-core/kd/bos/list/plugin";
import { AbstractConvertPlugIn } from "@cosmic/bos-core/kd/bos/entity/botp/plugin";
import { AbstractReportFormPlugin } from "@cosmic/bos-core/kd/bos/report/plugin";
import { AbstractReportListDataPlugin } from "@cosmic/bos-core/kd/bos/entity/report";

// ========== 数据类型 ==========
import { DynamicObject, DynamicObjectCollection } from "@cosmic/bos-core/kd/bos/dataentity/entity";
import { LocaleString } from "@cosmic/bos-core/kd/bos/dataentity/entity";

// ========== 服务帮助类 ==========
import { BusinessDataServiceHelper, QueryServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper";
import { SaveServiceHelper, DeleteServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper/operation";
import { OperationServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper/operation";

// ========== 过滤条件 ==========
import { QFilter, QCP } from "@cosmic/bos-core/kd/bos/orm/query";

// ========== 校验相关 ==========
import { AbstractValidator, ErrorLevel, ValidationErrorInfo } from "@cosmic/bos-core/kd/bos/entity/validate";

// ========== Java 集合 ==========
import { ArrayList, HashMap } from "@cosmic/bos-script/java/util";

// ========== 请求上下文 ==========
import { RequestContext } from "@cosmic/bos-core/kd/bos/context";

// ========== 消息通知 ==========
import { MessageInfo } from "@cosmic/bos-core/kd/bos/workflow/engine/msg/info";
import { MessageCenterServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper/workflow";

// ========== 表单事件 ==========
import { PropertyChangedArgs } from "@cosmic/bos-core/kd/bos/entity/datamodel/events";
import { BeforeF7SelectEvent, BeforeF7SelectListener } from "@cosmic/bos-core/kd/bos/form/control/events";

// ========== 控件 ==========
import { BasedataEdit } from "@cosmic/bos-core/kd/bos/form/control";

// ========== 转换相关 ==========
import { ConvertConst } from "@cosmic/bos-core/kd/bos/entity/botp";

// BigDecimal 是内置类型，无需导入
```

---

## 数据服务接口（ORM）

### 接口对比与选择

| 接口 | 作用 | 返回数据 | 适用场景 | 性能 |
|------|------|---------|---------|------|
| BusinessDataServiceHelper.load | 查结构化数据 | 可保存 | 需要修改并保存的数据 | 中 |
| BusinessDataServiceHelper.loadFromCache | 查缓存数据 | 可保存 | 少量基础资料查询 | 高 |
| QueryServiceHelper.query | 查平铺数据 | 不可保存 | 仅查询、展示的数据 | 高 |
| SaveServiceHelper.saveOperate | 触发校验和插件后保存 | OperateResult | 常规业务保存 | 中 |
| SaveServiceHelper.save/update | 直接保存，不走校验 | OperateResult | 数据修复等特殊场景 | 高 |
| DeleteServiceHelper.deleteOperate | 删除操作 | OperateResult | 数据删除 | 中 |
| OperationServiceHelper.executeOperate | 调用实体操作 | OperateResult | 提交、审核等操作 | 中 |

### BusinessDataServiceHelper 使用

```typescript
import { BusinessDataServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper";
import { QFilter } from "@cosmic/bos-core/kd/bos/orm/query";

// 创建新对象
const newObj = BusinessDataServiceHelper.newDynamicObject("ap_paybill");

// 按ID加载单个对象
const obj = BusinessDataServiceHelper.loadSingle(
  pkId,
  "ap_paybill",
  "id,billno,totalamount,billentry.payamount"
);

// 按条件加载单个对象
const obj2 = BusinessDataServiceHelper.loadSingle(
  "ap_paybill",
  [new QFilter("billno", "=", "PB001")]
);

// 加载多个对象
const list = BusinessDataServiceHelper.load(
  "ap_paybill",
  "id,billno,totalamount,billentry.payamount",
  [new QFilter("billstatus", "=", "A")],
  "billdate desc",
  100
);

// 从缓存加载基础资料（少量数据）
const customer = BusinessDataServiceHelper.loadFromCache(
  [customerId],
  "bd_customer",
  ["number", "name"]
);
```

### QueryServiceHelper 使用

```typescript
import { QueryServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper";
import { QFilter } from "@cosmic/bos-core/kd/bos/orm/query";

// 查询单条（平铺数据）
const obj = QueryServiceHelper.queryOne(
  "ap_paybill",
  "id,billno,totalamount",
  [new QFilter("billno", "=", "PB001")]
);

// 查询多条（平铺数据）
const list = QueryServiceHelper.query(
  "ap_paybill",
  "id,billno,totalamount",
  [new QFilter("billstatus", "=", "A")],
  "billdate desc"
);

// 使用 DataSet 查询（支持大数据量）
const dataSet = QueryServiceHelper.queryDataSet(
  "kingscript",
  "ap_paybill",
  "id,billno,totalamount",
  [new QFilter("billstatus", "=", "A")],
  "billdate desc",
  1000
);
```

### SaveServiceHelper 使用

```typescript
import { SaveServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper/operation";
import { OperateOption } from "@cosmic/bos-core/kd/bos/servicehelper";

// 完整操作（触发校验、插件）
const result = SaveServiceHelper.saveOperate(
  "ap_paybill",
  dataList,
  OperateOption.create()
);

// 检查结果
if (result.isSuccess()) {
  // 保存成功
  const savedIds = result.getSuccessPkIds();
} else {
  // 保存失败
  const errors = result.getValidateResult().getValidateErrors();
  for (const error of errors) {
    // 处理错误
  }
}

// 直接保存（不走校验，特殊场景）
SaveServiceHelper.save("ap_paybill", dataList);
SaveServiceHelper.update("ap_paybill", dataList);
```

### QFilter 过滤条件

```typescript
import { QFilter, QCP } from "@cosmic/bos-core/kd/bos/orm/query";

// 基本用法
new QFilter("field", "=", value);
new QFilter("field", QCP.equals, value);

// 常用运算符
QCP.equals          // 等于 =
QCP.not_equals      // 不等于 !=
QCP.like            // 模糊匹配 LIKE
QCP.in              // 在集合中 IN
QCP.not_in          // 不在集合中 NOT IN
QCP.gt              // 大于 >
QCP.lt              // 小于 <
QCP.ge              // 大于等于 >=
QCP.le              // 小于等于 <=
QCP.is_null         // 为空 IS NULL
QCP.is_notnull      // 不为空 IS NOT NULL

// 组合条件
const filter1 = new QFilter("billstatus", "=", "A");
const filter2 = new QFilter("totalamount", ">", 1000);
const combined = filter1.and(filter2);  // AND
const orCombined = filter1.or(filter2); // OR

// 复杂条件示例
const filters = [
  new QFilter("billstatus", QCP.in, ["A", "B", "C"]),
  new QFilter("billno", QCP.like, "%2024%"),
  new QFilter("totalamount", QCP.ge, 1000)
];
```

---

## BigDecimal 精确计算（财务必用）

```typescript
// ========== 创建 BigDecimal（必须使用字符串或整数） ==========
const amount = new BigDecimal("100.50");
const qty = new BigDecimal(10);
const zero = BigDecimal.ZERO;
const one = BigDecimal.ONE;

// ========== 四则运算 ==========
// 加法
const sum = amount.add(new BigDecimal("50"));  // 150.50

// 减法
const diff = amount.subtract(new BigDecimal("20"));  // 80.50

// 乘法
const product = amount.multiply(new BigDecimal("1.1"));  // 110.55

// 除法（必须指定精度和舍入模式）
const quotient = amount.divide(new BigDecimal("3"), 2, BigDecimal.ROUND_HALF_UP);  // 33.50

// ========== 舍入模式 ==========
BigDecimal.ROUND_UP           // 向上舍入
BigDecimal.ROUND_DOWN         // 向下舍入
BigDecimal.ROUND_CEILING      // 向正无穷舍入
BigDecimal.ROUND_FLOOR        // 向负无穷舍入
BigDecimal.ROUND_HALF_UP      // 四舍五入（推荐）
BigDecimal.ROUND_HALF_DOWN    // 五舍六入
BigDecimal.ROUND_HALF_EVEN    // 银行家舍入

// ========== 比较 ==========
if (amount.compareTo(BigDecimal.ZERO) > 0) {
  // 大于零
}
if (amount.compareTo(new BigDecimal("100")) === 0) {
  // 等于100
}

// ========== 汇总计算 ==========
let total = BigDecimal.ZERO;
for (const entry of entries) {
  const amt = entry.get("amount") as BigDecimal;
  if (amt != null) {
    total = total.add(amt);
  }
}

// ========== 设置精度 ==========
const rounded = amount.setScale(2, BigDecimal.ROUND_HALF_UP);  // 保留2位小数

// ========== 单价计算示例 ==========
const totalAmount = new BigDecimal("1000.00");
const totalQty = new BigDecimal("3");
const unitPrice = totalAmount.divide(totalQty, 6, BigDecimal.ROUND_HALF_UP);  // 保留6位小数

// ========== 税额计算示例 ==========
const taxRate = new BigDecimal("0.13");  // 13%税率
const taxAmount = amount.multiply(taxRate).setScale(2, BigDecimal.ROUND_HALF_UP);
```

**重要**：财务计算必须使用 BigDecimal，禁止使用 number 类型，避免浮点数精度问题。

**错误示例**：
```typescript
// 错误：使用 number（有精度问题）
let amount = 0.1 + 0.2;  // 0.30000000000000004

// 正确：使用 BigDecimal
let amount = new BigDecimal("0.1").add(new BigDecimal("0.2"));  // 0.3
```

---

## 常用开发模式

### 1. 分录遍历模式

```typescript
// 方式1：for 循环（推荐，可以获取索引）
const entries = entity.get("billentry") as DynamicObjectCollection;
for (let i = 0; i < entries.size(); i++) {
  const entry = entries.get(i);
  const qty = entry.get("qty") as BigDecimal;
  const price = entry.get("price") as BigDecimal;

  // 计算金额
  if (qty != null && price != null) {
    const amount = qty.multiply(price).setScale(2, BigDecimal.ROUND_HALF_UP);
    entry.set("amount", amount);
  }
}

// 方式2：for...of 循环（简洁，无法获取索引）
for (const entry of entries) {
  const amount = entry.get("amount") as BigDecimal;
  // 处理
}
```

### 2. 字段预加载模式

```typescript
onPreparePropertys(e: any): void {
  super.onPreparePropertys(e);
  const props = e.getFieldKeys();

  // 单据头字段
  props.add("billno");
  props.add("billstatus");
  props.add("totalamount");

  // 基础资料字段（需加载关联属性）
  props.add("customer");
  props.add("customer.name");
  props.add("customer.number");

  // 分录字段（需加前缀）
  props.add("billentry.material");
  props.add("billentry.material.name");
  props.add("billentry.qty");
  props.add("billentry.price");
  props.add("billentry.amount");
}
```

### 3. 数据校验模式

```typescript
import { AbstractValidator, ErrorLevel, ValidationErrorInfo } from "@cosmic/bos-core/kd/bos/entity/validate";

onAddValidators(e: any): void {
  super.onAddValidators(e);

  class MyValidator extends AbstractValidator {
    validate(): void {
      const dataentities = this.getDataEntities();

      for (const data of dataentities) {
        // 校验分录不能为空
        const entryCollection = data.get("billentry") as DynamicObjectCollection;
        if (entryCollection.size() <= 0) {
          const errorInfo = new ValidationErrorInfo(
            "",
            data.getPkValue(),
            0,
            0,
            "ERROR_EMPTY_ENTRY",
            this.getValidateContext().getOperateName(),
            "分录不能为空",
            ErrorLevel.Error
          );
          this.getValidateResult().addErrorInfo(errorInfo);
        }

        // 校验金额必须大于0
        const totalAmount = data.get("totalamount") as BigDecimal;
        if (totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
          const errorInfo = new ValidationErrorInfo(
            "totalamount",
            data.getPkValue(),
            0,
            0,
            "ERROR_INVALID_AMOUNT",
            this.getValidateContext().getOperateName(),
            "总金额必须大于0",
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

### 4. 分录行操作模式

```typescript
// 获取分录行数
const rowCount = this.getModel().getEntryRowCount("billentry");

// 批量创建分录行
const indices = this.getModel().batchCreateNewEntryRow("billentry", 3);
for (let i = 0; i < indices.length; i++) {
  this.getModel().setValue("qty", 10, indices[i]);
}

// 新增单行
this.getModel().createNewEntryRow("billentry");

// 在指定位置插入行
this.getModel().appendEntryRow("billentry", 0, 1);  // 在第0行后插入1行

// 删除分录行
this.getModel().deleteEntryRow("billentry", rowIndex);

// 删除所有分录
this.getModel().deleteEntryData("billentry");

// 遍历界面分录
for (let i = 0; i < rowCount; i++) {
  const qty = this.getModel().getValue("qty", i) as BigDecimal;
  const price = this.getModel().getValue("price", i) as BigDecimal;
  // 处理
}
```

### 5. 消息通知模式

```typescript
import { MessageInfo } from "@cosmic/bos-core/kd/bos/workflow/engine/msg/info";
import { MessageCenterServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper/workflow";
import { LocaleString } from "@cosmic/bos-core/kd/bos/dataentity/entity";
import { ArrayList } from "@cosmic/bos-script/java/util";
import { RequestContext } from "@cosmic/bos-core/kd/bos/context";

afterExecuteOperationTransaction(e: any): void {
  super.afterExecuteOperationTransaction(e);

  // 准备接收人列表
  const receiver = new ArrayList();
  receiver.add(RequestContext.get().getCurrUserId());

  // 创建消息
  const messageInfo = new MessageInfo();
  messageInfo.setMessageTitle(new LocaleString("单据已提交"));
  messageInfo.setMessageContent(new LocaleString("您的单据已提交成功，请等待审核"));
  messageInfo.setUserIds(receiver);
  messageInfo.setMessageType(MessageInfo.TYPE_MESSAGE);
  messageInfo.setSenderId(RequestContext.get().getCurrUserId());
  messageInfo.setEntityNumber("ap_paybill");
  messageInfo.setBizDataId(e.getDataEntities()[0].getPkValue());

  // 发送消息
  MessageCenterServiceHelper.sendMessage(messageInfo);
}
```

### 6. 界面控制模式

```typescript
// 设置字段值
this.getModel().setValue("billdate", new Date());
this.getModel().setValue("qty", new BigDecimal("10"), rowIndex);

// 获取字段值
const billNo = this.getModel().getValue("billno") as string;
const qty = this.getModel().getValue("qty", rowIndex) as BigDecimal;

// 控件状态
this.getView().setEnable(false, "totalamount");      // 禁用
this.getView().setVisible(false, "remark");          // 隐藏
this.getView().setMustInput(true, "customer");       // 必填

// 分录字段控制
this.getView().setEnable(false, rowIndex, "price");

// 执行操作
this.getView().invokeOperation("save");
this.getView().invokeOperation("refresh");

// 显示消息
this.getView().showMessage("普通消息");
this.getView().showTipNotification("提示");
this.getView().showWarnNotification("警告");
this.getView().showErrorNotification("错误");
this.getView().showSuccessNotification("成功");
```

### 7. 确认对话框模式

```typescript
import { ConfirmCallBackListener, MessageBoxOptions, ConfirmTypes, MessageBoxResult } from "@cosmic/bos-core/kd/bos/form";

// 显示确认框
const confirmCallBacks = new ConfirmCallBackListener("confirmId", this.getPluginName());
this.getView().showConfirm(
  "确认执行此操作？",
  MessageBoxOptions.YesNo,
  ConfirmTypes.Default,
  confirmCallBacks
);

// 处理回调
confirmCallBack(evt: any): void {
  if (evt.getCallBackId() === "confirmId") {
    if (evt.getResult() === MessageBoxResult.Yes) {
      // 用户点击确认
      this.doSomething();
    } else {
      // 用户点击取消
    }
  }
}
```

### 8. Java 集合模式

```typescript
import { ArrayList, HashMap } from "@cosmic/bos-script/java/util";

// ArrayList 使用
const list = new ArrayList();
list.add("item1");
list.add("item2");
const size = list.size();
const item = list.get(0);
const hasItem = list.contains("item1");
list.remove(0);
list.clear();

// HashMap 使用
const map = new HashMap();
map.put("key1", "value1");
map.put("key2", "value2");
const value = map.get("key1");
const hasKey = map.containsKey("key1");
const keys = map.keySet();

// 遍历 HashMap
for (const key of map.keySet()) {
  const value = map.get(key);
  // 处理
}
```

---

## 关键开发原则

### ⚠️ 插件设计原则

1. **无状态设计**
   - 表单界面在服务端是无状态的
   - 界面加载完后，表单及数据模型实例会销毁并存到缓存中
   - 下次加载时会从缓存恢复，而不是重新创建

2. **避免类属性**
   - 插件类中不要定义类属性
   - 所有字段都应该是方法内的局部变量
   - 因为插件实例被所有表单共享

3. **局部变量**
   - 插件类方法里必须定义局部变量
   - 不要依赖类成员变量传递数据

**错误示例**：
```typescript
class MyPlugin extends AbstractBillPlugIn {
  private currentBillNo: string;  // 错误：类属性会被所有表单共享

  afterLoadData(e: any): void {
    this.currentBillNo = this.getModel().getValue("billno") as string;
  }
}
```

**正确示例**：
```typescript
class MyPlugin extends AbstractBillPlugIn {
  afterLoadData(e: any): void {
    const currentBillNo = this.getModel().getValue("billno") as string;  // 正确：局部变量
    // 使用 currentBillNo
  }
}
```

### 📋 字段标识获取

1. 在表单设计器中单击对应字段
2. 在右侧「业务属性」中查看：
   - **字段标识**：用于 getValue/setValue
   - **控件标识**：用于 getControl
   - **单据体标识**：用于分录操作

### 🎯 查询接口选择

- **需要修改保存**：使用 `BusinessDataServiceHelper.load/loadSingle`
- **仅查询展示**：使用 `QueryServiceHelper.query/queryOne`（性能更好）
- **查询基础资料**：少量用 `loadFromCache`，大量用 `QueryServiceHelper`

### 🔒 事务处理

- **事务外**：beforeExecuteOperationTransaction 中进行数据整理
- **事务内**：beginOperationTransaction 中进行关联数据同步（不支持跨库）
- **事务后**：afterExecuteOperationTransaction 中进行日志、通知等非事务性操作
- **回滚补偿**：rollbackOperation 中处理第三方系统数据的补偿逻辑

### 💾 保存方式选择

- **完整操作**：使用 `SaveServiceHelper.saveOperate`（触发校验、插件）
- **直接保存**：紧急情况下使用 `SaveServiceHelper.save/update`（不走校验）

---

## SDK 限流规范（重要）

| 操作 | 限制 | 说明 |
|------|------|------|
| 单次查询返回行数 | ≤ 50,000 行 | 超出会抛出异常 |
| 单次查询字段数 | ≤ 100 个 | 只查询必要字段 |
| 事务内查询次数 | ≤ 150 次 | 避免在循环中查询 |
| 事务内 DML 次数 | ≤ 100 次 | 合并批量操作 |
| 单次 DML 影响记录 | ≤ 1,000 条 | 大数据量分批处理 |
| 单次 load 返回行数 | ≤ 1,000 行 | 使用 QueryServiceHelper |
| AppCache 大小 | ≤ 5 MB | 避免缓存大对象 |
| PageCache 大小 | ≤ 5 MB | 避免缓存大对象 |

**禁止直接使用 DB 或 ORM 操作数据库，必须通过 ServiceHelper！**

---

## 代码质量检查清单

完成代码前检查：

- [ ] 类名与文件名匹配
- [ ] 正确继承基类（表单插件用 AbstractBillPlugIn）
- [ ] 导出 `plugin` 单例：`let plugin = new XxxPlugin(); export { plugin };`
- [ ] 调用 super 方法
- [ ] 函数简短（< 50 行）
- [ ] 文件聚焦（< 800 行）
- [ ] 无深层嵌套（> 4 层）
- [ ] 正确处理错误（不吞异常）
- [ ] 无 console.log 语句（生产环境）
- [ ] 无硬编码 FormId/EntityKey
- [ ] 财务计算使用 BigDecimal
- [ ] 所有引入正常，代码无引入错误
- [ ] 遵守 SDK 限流规范
- [ ] 字段在使用前已预加载
- [ ] 插件类中无类属性，只有局部变量

---

## 编码规范

### 命名规范

```typescript
// 接口：I + 大驼峰
interface IValidator {
  validate(data: DynamicObject): boolean;
}

// 类：大驼峰
class PayBillPlugin extends AbstractOperationServicePlugIn {
  // 方法：小驼峰
  validateAmount(): boolean {
    // 局部变量：小驼峰
    const totalAmount = new BigDecimal(0);
    return true;
  }
}

// 常量：全大写
const MAX_AMOUNT = new BigDecimal("999999.99");
```

### 变量声明

```typescript
// 使用 let 声明可变变量
let message: string = "Hello";
message = "World";

// 使用 const 声明常量
const FORM_ID: string = "ap_paybill";

// 财务计算必须使用 BigDecimal
const amount = new BigDecimal("3.33");  // 正确
// const amount = 3.33;  // 错误
```

### 错误处理

```typescript
// 方式1：不拦截，让外层统一处理（推荐）
function processData(data: DynamicObject): void {
  const value = data.get("field") as string;
  if (!value) {
    throw new Error("字段值不能为空");
  }
}

// 方式2：拦截后抛出更友好的异常
function saveBill(entity: DynamicObject): void {
  try {
    // 业务逻辑
  } catch (error: any) {
    const billNo = entity.get("billno") as string;
    throw new Error(`单据 ${billNo} 保存失败: ${error.message}`);
  }
}

// 错误：捕获后只打印日志然后继续（禁止）
try {
  riskyOperation();
} catch (error) {
  console.log(error);  // 不要这样！
  return null;         // 隐藏了问题
}
```

### KingScript 特殊限制

- **不支持静态变量**
- **不支持泛型导入**（如 `ArrayList<String>` 需用 `ArrayList`）
- **不要使用 `$`**（全局保留关键字）
- **异常信息不要包含敏感数据**

---

## 常见问题排查

### ❌ 字段不存在错误

**原因**：
1. 没有在 onPreparePropertys 中添加字段
2. 查询时 selectFields 不包含该字段
3. 字段标识错误或大小写不匹配

**解决**：
- 在操作插件的 onPreparePropertys 中添加：`e.getFieldKeys().add("fieldKey")`
- 查询时确保 selectFields 包含所需字段，分录字段格式：`entryentity.field`

### ❌ 数据丢失

**原因**：
1. 使用 QueryServiceHelper 查询的数据包不能保存
2. 单据体未设置关键字段，导致代码赋值的行被清空

**解决**：
- 可修改数据必须用 BusinessDataServiceHelper 查询
- 在单据体属性中设置关键字段（如物料字段）

### ❌ 校验不生效

**原因**：使用了直接保存 save/update，不走操作校验

**解决**：
- 常规业务使用 saveOperate
- 仅在数据修复等特殊场景使用 save/update

### ❌ 事务回滚但第三方数据未回滚

**原因**：beginOperationTransaction 中调用了第三方接口，但 rollbackOperation 未做补偿

**解决**：
- 在 beginOperationTransaction 中记录需要补偿的操作
- 在 rollbackOperation 中实现补偿逻辑（删除第三方数据等）

### ❌ 性能问题

**原因**：
1. 大量数据一次性查询/保存
2. 使用缓存查询大量数据
3. 在循环中进行数据库操作

**解决**：
1. 分批处理数据
2. 大数据量查询使用 QueryServiceHelper
3. 只查询必要字段
4. 合并批量操作，避免在循环中查询/保存

---

## 快速索引

### 常用 API 速查

| 功能 | API |
|-----|-----|
| 获取字段值 | `this.getModel().getValue(key, rowIndex?)` |
| 设置字段值 | `this.getModel().setValue(key, value, rowIndex?)` |
| 获取单据体行数 | `this.getModel().getEntryRowCount(entryKey)` |
| 新增单据体行 | `this.getModel().batchCreateNewEntryRow(entryKey, count)` |
| 删除单据体行 | `this.getModel().deleteEntryRow(entryKey, rowIndex)` |
| 获取控件 | `this.getView().getControl(key)` |
| 设置可见性 | `this.getView().setVisible(visible, fieldKey)` |
| 设置锁定性 | `this.getView().setEnable(enabled, rowIndex?, fieldKey)` |
| 执行操作 | `this.getView().invokeOperation(key, option?)` |
| 查询数据 | `BusinessDataServiceHelper.load/loadSingle` |
| 查询平铺数据 | `QueryServiceHelper.query/queryOne` |
| 保存数据 | `SaveServiceHelper.saveOperate` |
| 删除数据 | `DeleteServiceHelper.deleteOperate` |
| 获取当前用户 | `RequestContext.get().getCurrUserId()` |
| 获取当前组织 | `RequestContext.get().getOrgId()` |

### 模块缩写对照

| 缩写 | 模块 | 说明 |
|------|------|------|
| FI | Finance | 财务 |
| AP | Accounts Payable | 应付 |
| AR | Accounts Receivable | 应收 |
| GL | General Ledger | 总账 |
| FA | Fixed Assets | 固定资产 |
| SCMC | Supply Chain | 供应链 |
| PM | Purchase Management | 采购 |
| IM | Inventory Management | 库存 |
| SM | Sales Management | 销售 |
| CONM | Contract Management | 合同 |
| MFG | Manufacturing | 生产 |

---

## 参考文档

根据具体开发需求，参考以下详细文档：

- **[语法基础](references/syntax.md)** - Kingscript 语言基础：模块、变量、类型、循环等
- **[操作插件开发](references/operation-plugin.md)** - 操作插件完整指南：所有事件详解、示例
- **[表单插件开发](references/form-plugin.md)** - 表单插件完整指南：所有事件详解、控件操作、示例
- **[数据服务接口](references/data-service.md)** - ORM 完整指南：查询、保存、更新、删除，接口对比
- **[常见开发案例](references/common-examples.md)** - 实际开发场景示例代码

---

## 联系与支持

- **官方社区**：https://vip.kingdee.com
- **文档查阅**：https://vip.kingdee.com/article
- **AI 能力**：Kingscript 提供 AI 能力及代码片段辅助编程
