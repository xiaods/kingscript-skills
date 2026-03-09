# 列表插件开发参考

## 概述

列表插件继承 `AbstractListPlugin`，用于定制列表页面的数据过滤、显示格式化、列控制等功能。

```typescript
import { AbstractListPlugin } from "@cosmic/bos-core/kd/bos/list/plugin";
```

## 核心事件

| 事件 | 触发时机 | 用途 |
|------|---------|------|
| setFilter | 查询数据前 | 自定义过滤条件和排序 |
| filterContainerInit | 过滤面板初始化时 | 添加常用过滤选项 |
| filterContainerBeforeF7Select | 过滤面板 F7 选择前 | 过滤面板中基础资料的数据过滤 |
| beforeCreateListColumns | 创建列前 | 动态增加/隐藏列 |
| beforePackageData | 打包数据前 | 批量调整显示数据 |
| packageData | 打包单个字段时 | 单个字段格式化 |
| billListHyperLinkClick | 超链接点击时 | 处理列表超链接点击 |

## 事件详解

### setFilter - 自定义过滤和排序

最常用的列表插件事件，用于添加查询条件和排序规则。

```typescript
import { AbstractListPlugin } from "@cosmic/bos-core/kd/bos/list/plugin";
import { SetFilterEvent } from "@cosmic/bos-core/kd/bos/form/events";
import { QFilter } from "@cosmic/bos-core/kd/bos/orm/query";

class MyListPlugin extends AbstractListPlugin {

  setFilter(e: SetFilterEvent): void {
    super.setFilter(e);

    // 添加固定过滤条件
    e.addCustomQFilter(new QFilter("billstatus", "!=", "D")); // 排除已关闭

    // 根据用户权限动态过滤
    const orgId = RequestContext.get().getOrgId();
    e.addCustomQFilter(new QFilter("org", "=", orgId));

    // 设置排序
    e.setOrderBy("billdate desc, billno desc");
  }
}

let plugin = new MyListPlugin();
export { plugin };
```

### beforeCreateListColumns - 动态列控制

```typescript
beforeCreateListColumns(event: any): void {
  super.beforeCreateListColumns(event);

  // 获取列集合
  const columns = event.getColumns();

  // 隐藏某列
  for (const col of columns) {
    if (col.getKey() === "remark") {
      col.setVisible(false);
    }
  }

  // 也可以动态新增列（较少使用）
}
```

### beforePackageData - 批量数据格式化

在数据发送到前端前批量修改显示值。

```typescript
beforePackageData(e: any): void {
  super.beforePackageData(e);

  for (const row of e.getPageData()) {
    // 根据状态显示中文
    const status = row.get("billstatus");
    if (status === "A") {
      row.put("billstatus", "暂存");
    } else if (status === "B") {
      row.put("billstatus", "已提交");
    } else if (status === "C") {
      row.put("billstatus", "已审核");
    }
  }
}
```

### packageData - 单字段格式化

逐行逐字段触发，适合对单个字段做格式化。

```typescript
packageData(e: any): void {
  super.packageData(e);

  if ("amount" === e.getColKey()) {
    const value = e.getValue() as BigDecimal;
    if (value != null) {
      e.setFormatValue(value.toString() + " 元");
    }
  }

  if ("billdate" === e.getColKey()) {
    const dateValue = e.getValue();
    if (dateValue != null) {
      // 自定义日期格式化
      e.setFormatValue(dateValue.toString().substring(0, 10));
    }
  }
}
```

### billListHyperLinkClick - 超链接点击

列表字段需先在设计器中开启"显示为超链接"。默认点击超链接会打开当前单据详情页，如需跳转到其他单据详情，需要取消默认行为并自行打开目标页面。

> 点击单据列表时同时会触发 `listRowClick` 方法。标准单据列表视图已注册了相关监听器，所以不需要手动注册。

```typescript
import { BillShowParameter } from "@cosmic/bos-core/kd/bos/bill";
import { ShowType, OperationStatus } from "@cosmic/bos-core/kd/bos/form";

billListHyperLinkClick(args: any): void {
  super.billListHyperLinkClick(args);

  const fieldKey = args.getHyperLinkClickEvent().getFieldName();
  if (fieldKey === "kdec_product_name") {
    // 取消默认的当前单据详情跳转
    args.setCancel(true);

    let rowIndex = args.getRowIndex();
    let bl = this.getView().getControl("billlistap") as BillList;
    let allRows = bl.getCurrentListAllRowCollection();
    let row = allRows.get(rowIndex);

    // 获取点击行数据
    let pkValue = row.getPrimaryKeyValue();
    let formID = row.getFormID();

    // 打开单据详情
    let bsp = new BillShowParameter();
    bsp.setFormId(formID);
    bsp.setPkId(pkValue);
    bsp.getOpenStyle().setShowType(ShowType.Modal);
    bsp.setStatus(OperationStatus.EDIT);
    this.getView().showForm(bsp);
  }
}
```

### setFilter - 按用户负责组织过滤

```typescript
import { UserServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper/user";

setFilter(e: SetFilterEvent): void {
  super.setFilter(e);

  // 获取当前用户负责的组织列表
  let userId = RequestContext.get().getCurrUserId();
  let inchargeOrgs = UserServiceHelper.getInchargeOrgs(userId);

  if (inchargeOrgs != null && inchargeOrgs.size() > 0) {
    let orgFilter = null;
    for (let org of inchargeOrgs) {
      let f = new QFilter("org", "=", org.getLong("id"));
      orgFilter = orgFilter ? orgFilter.or(f) : f;
    }
    e.addCustomQFilter(orgFilter);
  }
}
```

### filterContainerInit - 过滤面板初始化

设置过滤面板的默认筛选值。

```typescript
filterContainerInit(e: any): void {
  super.filterContainerInit(e);

  // 设置常用过滤方案的默认值
  let filterItems = e.getFilterItems();
  for (let item of filterItems) {
    if ("billdate" === item.getPropName()) {
      // 默认显示最近30天
      let endDate = new Date();
      let startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      item.setValue([startDate, endDate]);
    }
  }
}
```

### filterContainerBeforeF7Select - 过滤面板F7过滤

过滤面板中基础资料字段的数据过滤。

```typescript
filterContainerBeforeF7Select(e: any): void {
  super.filterContainerBeforeF7Select(e);

  if ("material" === e.getFieldName()) {
    let filter = new ArrayList();
    filter.add(new QFilter("usestatus", QCP.equals, 1)); // 仅显示启用的物料
    e.setCustomQFilters(filter);
  }
}
```

---

## 列表获取选中行

```typescript
// 方式1：通过列表控件获取
let billlist = this.getView().getControl("billlistap") as BillList;
let selectedRows = billlist.getSelectedRows();

// 方式2：列表插件自带接口（AbstractListPlugin 实例方法）
let selectedRows2 = this.getSelectedRows();

// 获取选中行的主键值
let pkIds = selectedRows.getPrimaryKeyValues();
```

## 报表数据获取

在报表表单插件中获取报表数据：

```typescript
// 获取报表控件
let reportList = this.getView().getControl("reportlistap") as ReportList;

// 获取指定行数据（行号从1开始）
let rowData = reportList.getReportModel().getRowData(1);
// 第一行第一列数据
let cellValue = reportList.getReportModel().getRowData(1).get(0);
// 通过字段标识取值
let fieldValue = reportList.getReportModel().getValue(1, "kdtest_field");

// 获取选中行数据
let selectedRowIndexes = reportList.getEntryState().getSelectedRows(); // int[]
for (let index of selectedRowIndexes) {
  let row = reportList.getReportModel().getRowData(index);
}

// 获取所有行数据
let rowCount = reportList.getReportModel().getRowCount();
for (let i = 1; i <= rowCount; i++) {
  let row = reportList.getReportModel().getRowData(i);
}
```

---

## 列表工具栏操作

列表页面的按钮点击通过 `itemClick` 处理：

```typescript
itemClick(e: ItemClickEvent): void {
  if (e.getItemKey() === "btn_export") {
    // 获取选中行
    const billlist = this.getView().getControl("billlistap") as BillList;
    const selectedRows = billlist.getSelectedRows();

    if (selectedRows == null || selectedRows.size() === 0) {
      this.getView().showMessage("请先选择数据");
      return;
    }

    const pkIds = selectedRows.getPrimaryKeyValues();
    // 处理选中的数据...
  }
}
```

## 完整示例

### 带过滤和格式化的列表插件

```typescript
import { AbstractListPlugin } from "@cosmic/bos-core/kd/bos/list/plugin";
import { SetFilterEvent } from "@cosmic/bos-core/kd/bos/form/events";
import { QFilter } from "@cosmic/bos-core/kd/bos/orm/query";
import { RequestContext } from "@cosmic/bos-core/kd/bos/context";

class OrderListPlugin extends AbstractListPlugin {

  // 过滤：只显示当前组织的未关闭单据
  setFilter(e: SetFilterEvent): void {
    super.setFilter(e);

    const orgId = RequestContext.get().getOrgId();
    e.addCustomQFilter(new QFilter("org", "=", orgId));
    e.addCustomQFilter(new QFilter("billstatus", "!=", "D"));
    e.setOrderBy("billdate desc");
  }

  // 格式化金额字段
  packageData(e: any): void {
    super.packageData(e);

    if ("totalamount" === e.getColKey()) {
      const value = e.getValue() as BigDecimal;
      if (value != null && value.compareTo(new BigDecimal("10000")) >= 0) {
        e.setFormatValue(value.toString() + " (大额)");
      }
    }
  }

  // 工具栏按钮
  itemClick(e: ItemClickEvent): void {
    if (e.getItemKey() === "btn_batch_audit") {
      const billlist = this.getView().getControl("billlistap") as BillList;
      const selectedRows = billlist.getSelectedRows();

      if (!selectedRows || selectedRows.size() === 0) {
        this.getView().showTipNotification("请先选择要审核的单据");
        return;
      }

      // 批量审核逻辑...
    }
  }
}

let plugin = new OrderListPlugin();
export { plugin };
```
