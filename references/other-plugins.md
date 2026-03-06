# 其他插件开发参考

## 目录

- [打印插件](#打印插件) - AbstractPrintPlugin、打印前校验、自定义打印数据
- [工作流插件](#工作流插件) - WorkflowPlugin（继承式）、IWorkflowPlugin（接口式，动态审批人）
- [调度任务插件](#调度任务插件) - AbstractTask、定时检查与通知
- [引入插件](#引入插件数据导入) - BatchImportPlugin、导入校验
- [引出插件](#引出插件数据导出) - 自定义导出

---

## 打印插件

继承 `AbstractPrintPlugin`，用于控制打印格式、数据和行为。

```typescript
import { AbstractPrintPlugin } from "@cosmic/bos-core/kd/bos/print/core/plugin";
```

### 核心事件

| 事件 | 触发时机 | 用途 |
|------|---------|------|
| beforePrint | 打印前 | 修改打印参数、控制是否允许打印 |
| afterPrint | 打印后 | 记录打印日志 |
| onPreparePrintData | 准备打印数据时 | 自定义打印数据 |

### 示例

```typescript
import { AbstractPrintPlugin } from "@cosmic/bos-core/kd/bos/print/core/plugin";

class MyPrintPlugin extends AbstractPrintPlugin {

  // 打印前校验
  beforePrint(e: any): void {
    super.beforePrint(e);

    // 检查单据状态，未审核不允许打印
    const billStatus = e.getDataEntity().get("billstatus");
    if (billStatus !== "C") {
      e.setCancel(true);
      e.setCancelMessage("未审核的单据不允许打印");
    }
  }

  // 自定义打印数据
  onPreparePrintData(e: any): void {
    super.onPreparePrintData(e);

    // 修改或补充打印数据
    const printData = e.getPrintData();
    printData.set("printdate", new Date());
    printData.set("printer", RequestContext.get().getCurrUserId());
  }
}

let plugin = new MyPrintPlugin();
export { plugin };
```

---

## 工作流插件

苍穹工作流插件有两种方式：

1. **WorkflowPlugin** - 继承式，用于简单的流程节点干预
2. **IWorkflowPlugin** - 接口式，用于动态计算审批参与人和任务处理结果干预

```typescript
import { WorkflowPlugin } from "@cosmic/bos-core/kd/bos/workflow/engine/extitf";
import { IWorkflowPlugin } from "@cosmic/bos-core/kd/bos/workflow/engine/extitf";
```

### 核心事件

| 事件/方法 | 触发时机 | 用途 |
|------|---------|------|
| onNodeArrive | 流程节点到达时 | 动态指定审批人 |
| onNodeComplete | 节点完成后 | 节点完成后逻辑 |
| onProcessComplete | 流程结束后 | 整个流程结束的后处理 |
| calcUserIds | 计算审批参与人时 | 动态查询并返回审批人ID列表 |
| notify | 审批任务执行时 | 根据同意/驳回结果更新业务数据 |

### 示例1：WorkflowPlugin 继承式

```typescript
import { WorkflowPlugin } from "@cosmic/bos-core/kd/bos/workflow/engine/extitf";

class MyWorkflowPlugin extends WorkflowPlugin {

  onNodeArrive(e: any): void {
    super.onNodeArrive(e);

    const nodeName = e.getNodeName();
    if (nodeName === "manager_audit") {
      const amount = e.getDataEntity().get("totalamount") as BigDecimal;
      if (amount.compareTo(new BigDecimal("100000")) > 0) {
        e.setApproverIds(["GM_USER_ID"]);
      }
    }
  }

  onProcessComplete(e: any): void {
    super.onProcessComplete(e);
    const approved = e.isApproved();
    if (approved) {
      // 审批通过后的业务处理
    }
  }
}

let plugin = new MyWorkflowPlugin();
export { plugin };
```

### 示例2：IWorkflowPlugin 接口式（动态审批人 + 任务结果处理）

适用于审批人需要根据业务数据动态查询的场景，如"入库仓库对应的仓库管理员审批"。

```typescript
import { IWorkflowPlugin } from "@cosmic/bos-core/kd/bos/workflow/engine/extitf";
import { BusinessDataServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper";
import { SaveServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper/operation";
import { DynamicObject } from "@cosmic/bos-core/kd/bos/dataentity/entity";
import { ArrayList } from "@cosmic/bos-script/java/util";

class WarehouseWorkflowPlugin implements IWorkflowPlugin {

  // 动态计算审批参与人：根据单据的仓库字段查找对应的仓库管理员
  calcUserIds(execution: any): any {
    let userIds = new ArrayList();

    // 加载当前业务单据
    let inventoryObj = BusinessDataServiceHelper.loadSingle(
      execution.getBusinessKey(), "kdec_inventory", "kdec_warehouse"
    );

    if (inventoryObj != null) {
      // 获取仓库，再查仓库信息表获取管理员
      let warehouseObj = inventoryObj.get("kdec_warehouse") as DynamicObject;
      let warehouseInfo = BusinessDataServiceHelper.loadSingle(
        warehouseObj.get("id"), "kdec_warehouse_info"
      );

      if (warehouseInfo != null) {
        let supervisor = warehouseInfo.get("kdec_warehouse_supervisor") as DynamicObject;
        userIds.add(supervisor.getLong("id"));
      }
    }

    return userIds;
  }

  // 任务处理时执行：根据同意/驳回更新业务单据状态
  notify(execution: any): void {
    // 获取审批结果
    let result = execution.getCurrentTaskResult("auditType");

    // 加载当前单据
    let inventoryObj = BusinessDataServiceHelper.loadSingle(
      execution.getBusinessKey(), "kdec_inventory"
    );

    if (inventoryObj != null) {
      let operationType = inventoryObj.getString("kdec_type");

      if ("purchase_inventory" === operationType) {
        // 采购入库
        if ("approve" === result) {
          inventoryObj.set("billstatus", "B"); // 已入库
        } else if ("reject" === result) {
          inventoryObj.set("billstatus", "E"); // 入库失败
        }
      } else if ("sales_outbound" === operationType) {
        // 销售出库
        if ("approve" === result) {
          inventoryObj.set("billstatus", "D"); // 已出库
        } else if ("reject" === result) {
          inventoryObj.set("billstatus", "F"); // 出库失败
        }
      }

      // 保存状态更新
      SaveServiceHelper.saveOperate("kdec_inventory", [inventoryObj], OperateOption.create());
    }
  }
}

let plugin = new WarehouseWorkflowPlugin();
export { plugin };
```

**注册方式**：在工作流设计器中，审批节点 → 参与人页签 → 参与人类型选择"业务插件" → 填写插件路径。任务处理插件在节点的插件页签中注册。

---

## 调度任务插件

继承 `AbstractTask`，用于定时执行后台业务逻辑，如状态检查、数据同步、定期通知等。

```typescript
import { AbstractTask } from "@cosmic/bos-core/kd/bos/schedule";
```

### 核心方法

| 方法 | 说明 |
|------|------|
| execute | 任务执行入口，实现具体的业务逻辑 |

### 示例：定时检查供应商合同到期并通知

```typescript
import { AbstractTask } from "@cosmic/bos-core/kd/bos/schedule";
import { BusinessDataServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper";
import { SaveServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper/operation";
import { QFilter, QCP } from "@cosmic/bos-core/kd/bos/orm/query";
import { MessageInfo } from "@cosmic/bos-core/kd/bos/workflow/engine/msg/info";
import { MessageCenterServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper/workflow";
import { DynamicObject } from "@cosmic/bos-core/kd/bos/dataentity/entity";
import { ArrayList } from "@cosmic/bos-script/java/util";
import { LocaleString } from "@cosmic/bos-core/kd/bos/dataentity/entity";

class SupplierContractCheckTask extends AbstractTask {

  execute(requestContext: any, params: any): void {
    // 查询合同状态为正常且合同结束日期早于今天的供应商
    let today = new Date();
    let filters = [
      new QFilter("kdec_contract_status", QCP.equals, "Y"),
      new QFilter("kdec_contract_date.to", QCP.lt, today)
    ];

    let suppliers = BusinessDataServiceHelper.load(
      "kdec_supplier_info",
      "id,number,name,kdec_contract_status,kdec_procurement_manager",
      filters, "", 1000
    );

    let messageInfos = new ArrayList();

    for (let supplier of suppliers) {
      // 更新合同状态为失效
      supplier.set("kdec_contract_status", "N");

      // 构建通知消息
      let messageInfo = new MessageInfo();
      let supplierCode = supplier.getString("number");
      let supplierName = supplier.getString("name");

      let title = new LocaleString("供应商合同到期通知");
      messageInfo.setMessageTitle(title);

      let content = new LocaleString(
        "你所负责的供应商-" + supplierCode + "_" + supplierName + "合同已经到期，请知悉。"
      );
      messageInfo.setMessageContent(content);

      // 发送给采购负责人
      let manager = supplier.get("kdec_procurement_manager") as DynamicObject;
      if (manager != null) {
        let receiverList = new ArrayList();
        receiverList.add(manager.getLong("id"));
        messageInfo.setUserIds(receiverList);
        messageInfo.setMessageType(MessageInfo.TYPE_MESSAGE);
        messageInfos.add(messageInfo);
      }
    }

    // 批量保存状态更新
    if (suppliers.length > 0) {
      SaveServiceHelper.saveOperate("kdec_supplier_info", suppliers, OperateOption.create());
    }

    // 批量发送消息
    if (messageInfos.size() > 0) {
      MessageCenterServiceHelper.batchSendMessages(messageInfos);
    }
  }
}

let plugin = new SupplierContractCheckTask();
export { plugin };
```

**配置步骤**：编写任务类 → 配置调度执行程序 → 创建调度作业 → 创建调度计划（设置执行周期）。

---

## 引入插件（数据导入）

继承 `BatchImportPlugin`，用于定制数据导入的校验和处理逻辑。

```typescript
import { BatchImportPlugin } from "@cosmic/bos-core/kd/bos/form/plugin/impt";
```

### 核心事件

| 事件 | 触发时机 | 用途 |
|------|---------|------|
| beforeImport | 导入前 | 校验导入数据 |
| afterImport | 导入后 | 导入后处理 |
| onValidateImportData | 校验导入数据时 | 逐行校验导入数据 |

### 示例

```typescript
import { BatchImportPlugin } from "@cosmic/bos-core/kd/bos/form/plugin/impt";

class MyImportPlugin extends BatchImportPlugin {

  // 导入前校验
  beforeImport(e: any): void {
    super.beforeImport(e);

    // 校验导入文件格式或必填字段
    const importData = e.getImportData();
    if (!importData || importData.size() === 0) {
      e.setCancel(true);
      e.setCancelMessage("导入数据为空");
    }
  }

  // 逐行校验
  onValidateImportData(e: any): void {
    super.onValidateImportData(e);

    const rowData = e.getRowData();
    const qty = rowData.get("qty");

    if (qty == null || qty <= 0) {
      e.addErrorMessage("数量必须大于0");
    }
  }
}

let plugin = new MyImportPlugin();
export { plugin };
```

---

## 引出插件（数据导出）

数据导出通常使用列表插件 `AbstractListPlugin` 来定制导出行为，不需要单独的基类。

### 示例：自定义导出

```typescript
import { AbstractListPlugin } from "@cosmic/bos-core/kd/bos/list/plugin";

class MyExportPlugin extends AbstractListPlugin {

  // 通过工具栏按钮触发自定义导出
  itemClick(e: ItemClickEvent): void {
    if (e.getItemKey() === "btn_custom_export") {
      const billlist = this.getView().getControl("billlistap") as BillList;
      const selectedRows = billlist.getSelectedRows();

      if (!selectedRows || selectedRows.size() === 0) {
        this.getView().showTipNotification("请先选择要导出的数据");
        return;
      }

      // 获取选中数据的主键
      const pkIds = selectedRows.getPrimaryKeyValues();

      // 查询完整数据
      const filter = new QFilter("id", QCP.in, pkIds);
      const dataList = QueryServiceHelper.query(
        "your_entity",
        "billno,customer.name,totalamount,bizdate",
        [filter],
        "billno"
      );

      // 处理导出逻辑（如生成 Excel 等）
      this.getView().showSuccessNotification("导出完成，共" + dataList.size() + "条数据");
    }
  }
}

let plugin = new MyExportPlugin();
export { plugin };
```
