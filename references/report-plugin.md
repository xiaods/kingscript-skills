# 报表插件开发参考

## 概述

苍穹报表插件分为两类：
- **报表表单插件**：继承 `AbstractReportFormPlugin`，控制报表界面交互
- **报表查询插件**：继承 `AbstractReportListDataPlugin`，控制报表取数逻辑

```typescript
import { AbstractReportFormPlugin } from "@cosmic/bos-core/kd/bos/report/plugin";
import { AbstractReportListDataPlugin } from "@cosmic/bos-core/kd/bos/entity/report";
```

## 报表表单插件

用于控制报表界面的交互行为，如初始化查询条件、响应按钮点击等。

### 核心事件

| 事件 | 触发时机 | 用途 |
|------|---------|------|
| afterCreateNewData | 报表界面初始化后 | 设置默认查询条件 |
| afterBindData | 数据绑定后 | 控制界面状态 |
| itemClick | 工具栏按钮点击 | 自定义按钮处理 |
| beforeDoOperation | 操作执行前 | 校验查询条件 |

### 示例：报表界面插件

```typescript
import { AbstractReportFormPlugin } from "@cosmic/bos-core/kd/bos/report/plugin";

class SalesReportFormPlugin extends AbstractReportFormPlugin {

  // 初始化默认查询条件
  afterCreateNewData(e: any): void {
    super.afterCreateNewData(e);

    // 默认查询当月数据
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    this.getModel().setValue("startdate", firstDay);
    this.getModel().setValue("enddate", now);
  }

  // 查询按钮点击前校验
  beforeDoOperation(e: any): void {
    super.beforeDoOperation(e);

    const opKey = e.getSource().getOperateKey();
    if (opKey === "query") {
      const startDate = this.getModel().getValue("startdate");
      const endDate = this.getModel().getValue("enddate");

      if (!startDate || !endDate) {
        e.setCancel(true);
        this.getView().showTipNotification("请选择查询日期范围");
      }
    }
  }

  // 控制界面状态
  afterBindData(e: any): void {
    super.afterBindData(e);
    // 根据条件隐藏/显示列等
  }
}

let plugin = new SalesReportFormPlugin();
export { plugin };
```

## 报表查询插件

用于自定义报表的数据查询逻辑，控制报表取数 SQL、数据加工等。

### 核心事件

| 事件 | 触发时机 | 用途 |
|------|---------|------|
| getSchemaFields | 获取报表字段定义时 | 动态定义报表列 |
| queryData | 查询报表数据时 | 自定义取数逻辑 |
| assembleFilterMap | 组装过滤条件时 | 处理查询参数 |

### 示例：报表取数插件（简单查询）

```typescript
import { AbstractReportListDataPlugin } from "@cosmic/bos-core/kd/bos/entity/report";
import { QueryServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper";
import { QFilter } from "@cosmic/bos-core/kd/bos/orm/query";

class SalesReportDataPlugin extends AbstractReportListDataPlugin {

  queryData(e: any): void {
    const filterMap = e.getFilterMap();
    const startDate = filterMap.get("startdate");
    const endDate = filterMap.get("enddate");

    const filters: QFilter[] = [];
    if (startDate) {
      filters.push(new QFilter("bizdate", ">=", startDate));
    }
    if (endDate) {
      filters.push(new QFilter("bizdate", "<=", endDate));
    }

    const fields = "id,billno,customer.name,totalamount,bizdate";
    const dataSet = QueryServiceHelper.query("sm_salorder", fields, filters, "bizdate desc");
    e.setDataSet(dataSet);
  }
}

let plugin = new SalesReportDataPlugin();
export { plugin };
```

### 示例：报表取数插件（分组统计 + DataSet 操作）

按产品维度统计不同月份的需求数量，最后一行显示合计。使用 `QueryServiceHelper.queryDataSet` 结合 DataSet 的 `groupBy`、`join`、`union` 等操作。

```typescript
import { AbstractReportListDataPlugin } from "@cosmic/bos-core/kd/bos/entity/report";
import { QueryServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper";
import { QFilter, QCP } from "@cosmic/bos-core/kd/bos/orm/query";

class PurchaseApplyReportPlugin extends AbstractReportListDataPlugin {

  query(reportQueryParam: any, o: any): any {
    // 从过滤面板获取产品过滤条件
    let qFilter = null;
    let filterItems = reportQueryParam.getFilter().getFilterItems();
    for (let item of filterItems) {
      if ("kdec_custombasedatafilter.id" === item.getPropName()) {
        qFilter = new QFilter("kdec_product_entryentity.kdec_product", QCP.in, item.getValue());
      }
    }

    // 查询原始数据：产品、申请日期、数量
    let dataSet = QueryServiceHelper.queryDataSet(
      this.getClass().getName(),
      "kdec_purchase_request",
      "kdec_product_entryentity.kdec_product as kdec_product, kdec_applydate, "
        + "kdec_product_entryentity.kdec_required_quantity as kdec_count",
      qFilter ? [qFilter] : null, null
    );

    // 按产品和月份分组统计
    let groupDataSet = dataSet.copy()
      .groupBy(["kdec_product", "substr(kdec_applydate,0,7) as kdec_apply_date"])
      .sum("kdec_count", "kdec_month_count")
      .finish();

    // 按产品统计年总数量
    let yearTotalDataSet = dataSet.copy()
      .groupBy(["kdec_product", "substr(kdec_applydate,0,4)"])
      .sum("kdec_count", "kdec_year_count")
      .finish();

    // join 合并月度和年度数据
    let resultDataSet = groupDataSet
      .join(yearTotalDataSet).on("kdec_product", "kdec_product")
      .select(["kdec_product", "kdec_month_count"], ["kdec_year_count"])
      .finish();

    // 合计行：union 追加一行合计数据
    let totalDataSet = resultDataSet.copy()
      .groupBy(null)
      .sum("kdec_month_count", "total_month")
      .sum("kdec_year_count", "total_year")
      .finish();

    return resultDataSet.union(totalDataSet);
  }
}

let plugin = new PurchaseApplyReportPlugin();
export { plugin };
```

### 报表表单插件：条件样式 + 合计行处理

```typescript
import { AbstractReportFormPlugin } from "@cosmic/bos-core/kd/bos/report/plugin";
import { BusinessDataServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper";

class PurchaseApplyReportFormPlugin extends AbstractReportFormPlugin {

  // 设置单元格条件样式：年总数量 > 100 时产品名称标红
  setCellStyleRules(cellStyleRules: any): void {
    super.setCellStyleRules(cellStyleRules);

    let rule = {
      fieldKey: "kdec_product",           // 应用样式的字段
      backgroundColor: "red",             // 背景色
      condition: "kdec_year > 100 && kdec_product != '合计'"  // 条件表达式
    };
    cellStyleRules.add(rule);
  }

  // 处理合计行数据：将最后一行产品名称设置为"合计"
  processRowData(gridPK: string, rowData: any, queryParam: any): void {
    if (rowData.size() > 0) {
      let totalProduct = BusinessDataServiceHelper.newDynamicObject("kdec_product_info");
      totalProduct.set("name", "合计");
      rowData.get(rowData.size() - 1).set("kdec_product", totalProduct);
    }
    super.processRowData(gridPK, rowData, queryParam);
  }
}

let plugin = new PurchaseApplyReportFormPlugin();
export { plugin };
```

## 注意事项

- 报表查询插件处理的数据量可能很大，使用 `QueryServiceHelper` 而非 `BusinessDataServiceHelper`
- 报表数据不需要保存，使用平铺查询（QueryServiceHelper）性能更好
- 复杂统计报表使用 `QueryServiceHelper.queryDataSet` 结合 DataSet 的分组、join、union 操作
- 报表界面插件和查询插件通常成对使用：取数插件注册在报表列表节点，表单插件注册在页面根节点
- `setCellStyleRules` 中的 `condition` 使用 JS 表达式语法
