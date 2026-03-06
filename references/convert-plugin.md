# 转换插件开发参考

## 概述

转换插件继承 `AbstractConvertPlugIn`，用于定制单据下推（转换）过程中的数据映射、过滤、分单合单等逻辑。

```typescript
import { AbstractConvertPlugIn } from "@cosmic/bos-core/kd/bos/entity/botp/plugin";
```

**典型场景**：采购订单下推生成入库单、销售订单下推生成发货单等。

## 核心事件

| 事件 | 触发时机 | 用途 |
|------|---------|------|
| beforeBuildRowCondition | 构建下推条件前 | 添加/修改下推筛选条件 |
| afterCreateTarget | 创建目标单后 | 从源单取值填充目标单 |
| afterFieldMapping | 字段映射后 | 补充或修改已映射的字段值 |
| afterConvert | 转换完成后 | 分单、合单、最终调整 |

## 事件详解

### beforeBuildRowCondition - 下推筛选条件

控制哪些源单数据可以被下推。

```typescript
import { AbstractConvertPlugIn } from "@cosmic/bos-core/kd/bos/entity/botp/plugin";
import { QFilter, QCP } from "@cosmic/bos-core/kd/bos/orm/query";

class MyConvertPlugin extends AbstractConvertPlugIn {

  beforeBuildRowCondition(e: any): void {
    super.beforeBuildRowCondition(e);

    // 设置不允许下推的条件说明（用户看到的提示）
    e.setCustFilterDesc("不允许下推已关闭或数量为0的单据");

    // 设置条件表达式（用于脚本执行判断）
    e.setCustFilterExpression(" billstatus != 'D' && qty > 0 ");

    // 设置 QFilter 条件（用于数据库查询过滤）
    const filters = e.getCustQFilters();
    filters.add(new QFilter("billstatus", QCP.not_equals, "D"));
    filters.add(new QFilter("qty", QCP.gt, 0));
  }
}
```

**三种条件的关系**：
- `CustFilterDesc`：纯文字说明，不影响逻辑，只用于提示用户
- `CustFilterExpression`：脚本表达式，用于对已加载的数据做二次判断
- `CustQFilters`：QFilter 条件，用于数据库层面过滤

### afterCreateTarget - 填充目标单

目标单创建后，从源单行取值填充目标单字段。适用于需要从源单带出但无法通过标准字段映射实现的场景。

```typescript
import { ConvertConst } from "@cosmic/bos-core/kd/bos/entity/botp";

afterCreateTarget(e: any): void {
  super.afterCreateTarget(e);

  // 获取目标单数据集
  const dataEntitySet = e.getTargetExtDataEntitySet();

  // 获取目标单分录行
  const entryRows = dataEntitySet.FindByEntityKey("entryentity");

  for (const entryRow of entryRows) {
    // 获取当前目标行对应的源单行
    const srcRows = entryRow.getValue(ConvertConst.ConvExtDataKey_SourceRows);

    if (srcRows && srcRows.size() > 0) {
      const srcRow = srcRows.get(0);

      // 从源单行取值
      const srcRemark = e.getFldProperties().get("remark").getValue(srcRow);
      const srcCustomField = e.getFldProperties().get("customfield").getValue(srcRow);

      // 设置到目标单
      entryRow.setValue("targetremark", srcRemark);
      entryRow.setValue("targetcustomfield", srcCustomField);
    }
  }
}
```

### afterFieldMapping - 补充映射

标准字段映射完成后，补充或修改字段值。

```typescript
afterFieldMapping(e: any): void {
  super.afterFieldMapping(e);

  // 获取目标单数据
  const targetDataEntities = e.getTargetDatas();

  for (const targetEntity of targetDataEntities) {
    // 补充单据头字段
    targetEntity.set("remark", "由下推自动生成");
    targetEntity.set("sourcetype", "push");

    // 修改分录字段
    const entries = targetEntity.getDynamicObjectCollection("entryentity");
    for (let i = 0; i < entries.size(); i++) {
      const entry = entries.get(i);
      // 例：将源单数量按比例转换
      const srcQty = entry.get("qty") as BigDecimal;
      if (srcQty != null) {
        const convertedQty = srcQty.multiply(new BigDecimal("1.0"));
        entry.set("qty", convertedQty);
      }
    }
  }
}
```

### afterConvert - 转换完成后

所有转换操作完成后的最终调整，可用于分单、合单等逻辑。

```typescript
afterConvert(e: any): void {
  super.afterConvert(e);

  const targetDataEntities = e.getTargetDatas();

  for (const targetEntity of targetDataEntities) {
    // 最终计算：汇总分录金额到单据头
    let totalAmount = BigDecimal.ZERO;
    const entries = targetEntity.getDynamicObjectCollection("entryentity");

    for (let i = 0; i < entries.size(); i++) {
      const entry = entries.get(i);
      const amount = entry.get("amount") as BigDecimal;
      if (amount != null) {
        totalAmount = totalAmount.add(amount);
      }
    }

    targetEntity.set("totalamount", totalAmount);
  }
}
```

## 完整示例

### 采购订单下推入库单

```typescript
import { AbstractConvertPlugIn } from "@cosmic/bos-core/kd/bos/entity/botp/plugin";
import { ConvertConst } from "@cosmic/bos-core/kd/bos/entity/botp";
import { QFilter, QCP } from "@cosmic/bos-core/kd/bos/orm/query";

class PurorderToInstockPlugin extends AbstractConvertPlugIn {

  // 过滤：只允许已审核且有剩余数量的订单下推
  beforeBuildRowCondition(e: any): void {
    super.beforeBuildRowCondition(e);

    e.setCustFilterDesc("仅允许已审核且有剩余可入库数量的订单下推");
    e.getCustQFilters().add(new QFilter("billstatus", QCP.equals, "C"));
    e.getCustQFilters().add(new QFilter("remainqty", QCP.gt, 0));
  }

  // 映射后补充字段
  afterFieldMapping(e: any): void {
    super.afterFieldMapping(e);

    const targetDatas = e.getTargetDatas();
    for (const target of targetDatas) {
      // 设置入库类型为"采购入库"
      target.set("instocktype", "purchase");
      // 设置仓库默认值
      // target.set("warehouse", warehouseObj);
    }
  }

  // 转换完成后汇总
  afterConvert(e: any): void {
    super.afterConvert(e);

    const targetDatas = e.getTargetDatas();
    for (const target of targetDatas) {
      let totalQty = BigDecimal.ZERO;
      const entries = target.getDynamicObjectCollection("entryentity");

      for (let i = 0; i < entries.size(); i++) {
        const qty = entries.get(i).get("qty") as BigDecimal;
        if (qty != null) {
          totalQty = totalQty.add(qty);
        }
      }

      target.set("totalqty", totalQty);
    }
  }
}

let plugin = new PurorderToInstockPlugin();
export { plugin };
```
