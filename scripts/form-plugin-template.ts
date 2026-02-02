/**
 * 表单插件模板
 * 继承于单据表单插件基类 AbstractBillPlugIn
 */

import { AbstractBillPlugIn, BillShowParameter } from "@cosmic/bos-core/kd/bos/bill";
import { EventObject } from "@cosmic/bos-script/java/util";
import { DynamicObject, DynamicObjectCollection, LocaleString } from "@cosmic/bos-core/kd/bos/dataentity/entity";
import { BusinessDataServiceHelper, QueryServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper";
import { QFilter, QCP } from "@cosmic/bos-core/kd/bos/orm/query";
import { RequestContext } from "@cosmic/bos-core/kd/bos/context";
import { ItemClickEvent } from "@cosmic/bos-core/kd/bos/form/control/events";
import { PropertyChangedArgs } from "@cosmic/bos-core/kd/bos/entity/datamodel/events";

// =============================================================================
// 常量定义区 - 根据实际业务修改
// =============================================================================

/** 实体标识 */
const ENTITY = {
  // TODO: 替换为实际的实体标识
  MAIN: "your_bill_entity",
  ENTRY: "your_entry_entity"
};

/** 字段标识 */
const FIELD = {
  // TODO: 替换为实际的字段标识
  BILLNO: "billno",
  STATUS: "billstatus",
  CREATOR: "creator",
  REMARK: "remark"
};

/** 工具栏按钮标识 */
const BUTTON = {
  // TODO: 替换为实际的按钮标识
  CUSTOM_BTN: "baritem_custom"
};

// =============================================================================
// 插件类定义
// =============================================================================

class CustomBillPlugin extends AbstractBillPlugIn {

  /**
   * 界面初始化，注册监听器
   * 触发时机：用户与界面上的控件交互时
   */
  registerListener(e: EventObject): void {
    // TODO: 注册需要的监听器
    
    // 示例：注册工具栏监听
    // let toolbar = this.getView().getControl("tbmain");
    // toolbar.addItemClickListener(this);
    
    super.registerListener(e);
  }

  /**
   * 新增单据数据包初始化
   * 触发时机：仅新增单据时触发
   * 应用场景：设置字段初始值
   */
  afterCreateNewData(e: EventObject): void {
    try {
      // TODO: 设置字段初始值
      
      // 示例1：设置简单字段
      this.getModel().setValue(FIELD.REMARK, "系统自动生成");
      
      // 示例2：设置当前用户
      let userId = RequestContext.get().getCurrUserId();
      this.getModel().setValue(FIELD.CREATOR, userId);
      
      // 示例3：查询基础资料并赋值
      let material = BusinessDataServiceHelper.loadSingle("bd_material", [new QFilter("number", "=", "MAT001")]);
      if (material) {
        this.getModel().setValue("materialfield", material);
      }
      
      // 示例4：新增单据体行并赋值
      this.addEntryRows();
      
    } catch (error) {
      console.error("afterCreateNewData error:", error);
    }
    
    super.afterCreateNewData(e);
  }

  /**
   * 界面数据绑定后
   * 触发时机：界面数据加载完成后
   * 应用场景：设置控件属性（可见性、锁定性）
   */
  afterBindData(e: EventObject): void {
    try {
      // TODO: 设置控件属性
      
      // 示例：根据条件设置字段锁定
      let status = this.getModel().getValue(FIELD.STATUS);
      if (status === "C") { // 已审核
        this.getView().setEnable(false, FIELD.REMARK); // 锁定备注字段
      }
      
      // 示例：设置控件可见性
      // this.getView().setVisible(false, "field_key");
      
    } catch (error) {
      console.error("afterBindData error:", error);
    }
    
    super.afterBindData(e);
  }

  /**
   * 工具栏按钮点击事件
   * 触发时机：点击工具栏按钮时
   */
  itemClick(e: ItemClickEvent): void {
    try {
      if (e.getItemKey() === BUTTON.CUSTOM_BTN) {
        this.handleCustomButtonClick();
      }
    } catch (error) {
      console.error("itemClick error:", error);
      this.getView().showTipNotification("操作失败：" + error.message);
    }
    
    super.itemClick(e);
  }

  /**
   * 字段值变更事件
   * 触发时机：字段值发生变化时
   * 应用场景：联动处理其他字段
   */
  propertyChanged(e: PropertyChangedArgs): void {
    try {
      let fieldName = e.getProperty().getName();
      let changeSet = e.getChangeSet();
      
      if (!changeSet || changeSet.length === 0) return;
      
      // TODO: 根据字段变更处理联动逻辑
      
      // 示例：部门变更自动带出公司
      if (fieldName === "deptfield") {
        let dept = changeSet[0].getNewValue() as DynamicObject;
        if (dept) {
          // 这里需要根据实际业务调用相应的查询接口
          console.log("部门变更：", dept.getPkValue());
        }
      }
      
    } catch (error) {
      console.error("propertyChanged error:", error);
    }
    
    super.propertyChanged(e);
  }

  /**
   * 操作执行前（如保存、提交、审核等）
   * 应用场景：业务校验或修改操作参数
   */
  beforeDoOperation(e: BeforeDoOperationEventArgs): void {
    try {
      // TODO: 操作前处理
      
      // 示例：取消操作自带的提示
      // const source = e.getSource();
      // if (source instanceof Save) {
      //   source.getOption().setVariableValue(OperateOptionConst.ISSHOWMESSAGE, "false");
      // }
      
    } catch (error) {
      console.error("beforeDoOperation error:", error);
    }
    
    super.beforeDoOperation(e);
  }

  /**
   * 操作执行后
   * 应用场景：操作后处理，如发送通知、自动触发其他操作
   */
  afterDoOperation(e: AfterDoOperationEventArgs): void {
    try {
      // TODO: 操作后处理
      
      // 示例：操作成功后发送通知
      // const result = e.getOperationResult();
      // if (result.isSuccess()) {
      //   this.sendNotification();
      // }
      
    } catch (error) {
      console.error("afterDoOperation error:", error);
    }
    
    super.afterDoOperation(e);
  }

  // =============================================================================
  // 辅助方法
  // =============================================================================

  /**
   * 新增单据体行并赋值
   */
  private addEntryRows(): void {
    try {
      // 清空现有数据
      this.getModel().deleteEntryData(ENTITY.ENTRY);
      
      // 批量新增3行
      let indices = this.getModel().batchCreateNewEntryRow(ENTITY.ENTRY, 3);
      
      // 逐行赋值
      for (let i = 0; i < indices.length; i++) {
        let rowIndex = indices[i];
        this.getModel().setValue("qtyfield", (i + 1) * 10, rowIndex);
        this.getModel().setValue("pricefield", 100, rowIndex);
      }
      
    } catch (error) {
      console.error("addEntryRows error:", error);
    }
  }

  /**
   * 处理自定义按钮点击
   */
  private handleCustomButtonClick(): void {
    // TODO: 实现按钮点击逻辑
    
    // 示例：查询并显示数据
    let billno = this.getModel().getValue(FIELD.BILLNO);
    if (!billno) {
      this.getView().showTipNotification("请先输入单据编号");
      return;
    }
    
    // 使用QueryServiceHelper查询（仅查询，不修改）
    let filter = new QFilter(FIELD.BILLNO, QCP.equals, billno);
    let queryFields = "id,billno,entryentity.qty";
    let result = QueryServiceHelper.query(ENTITY.MAIN, queryFields, [filter], "id DESC");
    
    if (result && result.size() > 0) {
      let count = result.size();
      this.getView().showSuccessNotification(`查询到 ${count} 条数据`);
    } else {
      this.getView().showTipNotification("未查询到数据");
    }
  }

  /**
   * 发送通知
   */
  private sendNotification(): void {
    try {
      let userId = RequestContext.get().getCurrUserId();
      let messageInfos = new ArrayList();
      
      let messageInfo = new MessageInfo();
      messageInfo.setMessageTitle(new LocaleString("单据已提交"));
      messageInfo.setMessageContent(new LocaleString("您的单据已提交成功"));
      messageInfo.setUserIds([userId]);
      messageInfo.setMessageType(MessageInfo.TYPE_MESSAGE);
      messageInfo.setSenderId(userId);
      
      messageInfos.add(messageInfo);
      
      MessageCenterServiceHelper.batchSendMessages(messageInfos);
      
    } catch (error) {
      console.error("sendNotification error:", error);
    }
  }

  /**
   * 获取选中行（用于列表插件）
   */
  private getSelectedRows(): ListSelectedRowCollection | null {
    let billlist = this.getView().getControl("billlistap") as BillList;
    if (!billlist) return null;
    
    return billlist.getSelectedRows();
  }
}

// =============================================================================
// 导出插件实例（必须）
// =============================================================================

let plugin = new CustomBillPlugin();
export { plugin };
