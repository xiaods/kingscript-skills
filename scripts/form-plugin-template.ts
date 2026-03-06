/**
 * 表单插件模板 - 最小骨架
 * 基类：AbstractBillPlugIn（单据表单）/ AbstractFormPlugin（动态表单）
 * 详细事件说明见 references/form-plugin.md
 */

import { AbstractBillPlugIn } from "@cosmic/bos-core/kd/bos/bill";
import { EventObject } from "@cosmic/bos-script/java/util";
import { DynamicObject } from "@cosmic/bos-core/kd/bos/dataentity/entity";
import { PropertyChangedArgs } from "@cosmic/bos-core/kd/bos/entity/datamodel/events";
import { ItemClickEvent } from "@cosmic/bos-core/kd/bos/form/control/events";

class MyBillPlugin extends AbstractBillPlugIn {

  // 注册监听器（按钮、F7等）
  registerListener(e: EventObject): void {
    super.registerListener(e);
  }

  // 新增单据初始化（仅新增时触发，编辑不触发）
  afterCreateNewData(e: EventObject): void {
    super.afterCreateNewData(e);
  }

  // 编辑单据加载后（仅编辑时触发，新增不触发）
  afterLoadData(e: EventObject): void {
    super.afterLoadData(e);
  }

  // 数据绑定后（新增和编辑都触发，用于设置控件属性）
  afterBindData(e: EventObject): void {
    super.afterBindData(e);
  }

  // 字段值变更（联动计算）
  propertyChanged(e: PropertyChangedArgs): void {
    let fieldName = e.getProperty().getName();
    let changeSet = e.getChangeSet();

    // if (fieldName === "your_field") { ... }

    super.propertyChanged(e);
  }

  // 操作前校验
  beforeDoOperation(e: any): void {
    super.beforeDoOperation(e);
  }

  // 操作后处理
  afterDoOperation(e: any): void {
    super.afterDoOperation(e);
  }

  // 工具栏按钮点击
  itemClick(e: ItemClickEvent): void {
    // if (e.getItemKey() === "your_button") { ... }
    super.itemClick(e);
  }
}

let plugin = new MyBillPlugin();
export { plugin };
