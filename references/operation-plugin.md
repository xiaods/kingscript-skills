# 操作插件开发参考

## 概述

操作插件是扩展金蝶苍穹单据、基础资料的服务端业务逻辑的插件，继承 `AbstractOperationServicePlugin`，用于定制数据校验、事务处理等服务层功能。

**与表单插件的区别**：
- 操作插件：仅处理数据和业务流程，不能操控界面控件和交互
- 表单插件：专注于界面交互逻辑

## 支持的操作类型

| 操作 | 功能说明 |
|------|---------|
| 保存(save) | 把单据数据包中的数据存入单据表格 |
| 保存并新增(saveandnew) | 保存数据后清空界面进入新增状态 |
| 状态转换(statusconvert) | 切换单据状态字段值并更新表格 |
| 提交(submit) | 切换状态为"审核中"并更新表格 |
| 提交并新增(submitandnew) | 提交后清空界面进入新增状态 |
| 撤销(unsubmit) | 切换状态为"暂存"并更新表格 |
| 审核(audit) | 切换状态为"已审核"，记录审核人 |
| 反审核(unaudit) | 切换状态为"暂存"，清除审核人 |
| 禁用(disable) | 切换使用状态为"停用" |
| 启用(enable) | 切换使用状态为"启用" |
| 作废(invalid) | 切换作废状态为"作废" |
| 生效(valid) | 切换作废状态为"正常" |
| 删除(delete) | 从单据表格中删除数据 |
| 空操作(donothing) | 执行全部流程但不写入数据库 |

## 核心事件

| 事件名 | 触发时机 | 典型用途 |
|--------|---------|---------|
| onPreparePropertys | 加载数据包前 | 指定需加载的字段 |
| onAddValidators | 校验前 | 增加/移除校验器 |
| beforeExecuteOperationTransaction | 校验后、事务前 | 整理数据/取消操作 |
| beginOperationTransaction | 事务已开启，未入库 | 关联数据同步 |
| endOperationTransaction | 数据已入库，未提交 | 关联数据同步 |
| rollbackOperation | 事务回滚后 | 补偿处理 |
| afterExecuteOperationTransaction | 事务提交后 | 记录日志、发送通知 |
| onReturnOperation | 返回前 | 结果处理/释放资源 |

## 事件详解

### 1. onPreparePropertys - 指定加载字段

**触发时机**：加载单据数据包之前

**作用**：添加插件需要用到（get(field)取值、set(field)赋值字段时）的字段，避免因字段缺失导致异常。

**注意**：
- 在单据上执行保存、提交、审核操作时，直接把界面上的数据包传入操作服务，不会触发此事件
- 在单据上执行其他操作，或在列表上执行操作时会触发此事件
- 默认是按需加载，只加载最少量的字段

**示例**：
```typescript
onPreparePropertys(e: $.kd.bos.entity.plugin.PreparePropertysEventArgs): void {
  e.getFieldKeys().add("kdtest_reqdate"); // 添加申请日期字段
  e.getFieldKeys().add("kdtest_ordernumber"); // 添加采购订单编号字段
  e.getFieldKeys().add("kdtest_currencyfield"); // 添加币种字段
  e.getFieldKeys().add("billno"); // 添加单据编号字段
}
```

### 2. onAddValidators - 自定义校验

**触发时机**：系统预置校验器加载完毕，执行校验前

**应用场景**：采购申请单提交之前，校验采购申请单的采购分录不能为空

**开发步骤**：
1. 创建脚本继承 `AbstractOperationServicePlugin`
2. 重写 `onAddValidators`，添加自定义校验器（继承 `AbstractValidator`）
3. 在 `validate` 方法中添加校验逻辑

**示例**：
```typescript
import { AbstractOperationServicePlugIn, AddValidatorsEventArgs } from "@cosmic/bos-core/kd/bos/entity/plugin";
import { AbstractValidator, ErrorLevel, ValidationErrorInfo } from "@cosmic/bos-core/kd/bos/entity/validate";
import { RowDataModel } from "@cosmic/bos-core/kd/bos/entity/formula";
import { DynamicPropertyCollection } from "@cosmic/bos-core/kd/bos/dataentity/metadata/dynamicobject";
import { LocaleString } from "@cosmic/bos-core/kd/bos/dataentity/entity";

class SubmitOpPlugin extends AbstractOperationServicePlugIn {
  onAddValidators(e: AddValidatorsEventArgs) {
    let InnerClass = this.getInnerClass();
    e.addValidator(new InnerClass());
  }

  getInnerClass() {
    class MyValidator extends AbstractValidator {
      validate(): void {
        let entitykey = this.getEntityKey();
        let suentitytype = this.getValidateContext().getSubEntityType();
        let rowDataModel = new RowDataModel(entitykey, suentitytype);
        let extdataentitys = this.getDataEntities();
        
        for (let rowEXTDataEntity of extdataentitys) {
          let dataentity = rowEXTDataEntity.getDataEntity();
          rowDataModel.setRowContext(dataentity);
          
          let reqCols = dataentity.get("kdtest_reqentryentity") as DynamicPropertyCollection;
          // 判断采购申请单的采购分录不能为空
          if (reqCols.size() <= 0) {
            let message = new LocaleString(rowEXTDataEntity.getBillNo() + "采购分录不能为空");
            let info = new ValidationErrorInfo("",
              rowEXTDataEntity.getBillPkId(),
              rowEXTDataEntity.getDataEntityIndex(),
              rowEXTDataEntity.getRowIndex(),
              "MyValuedate_001",
              this.getValidateContext().getOperateName(),
              message.toString(),
              ErrorLevel.Error);
            this.getValidateResult().addErrorInfo(info);
          }
        }
      }
    }
    return MyValidator;
  }
}

let plugin = new SubmitOpPlugin();
export { plugin };
```

**效果**：
- 如果分录数据为空，执行提交操作时会触发自定义校验器逻辑
- 批量执行提交时，一条数据校验失败，不影响其他数据

### 3. beforeExecuteOperationTransaction - 数据整理/取消操作

**触发时机**：操作校验通过，开启事务前

**作用**：通知插件在事务开启前，对要处理的数据进行预处理。数据处理的逻辑推荐放在事务外进行，避免拉长事务占用时间，造成性能瓶颈。

**注意**：本事件参数只含已通过校验的单据，未通过校验的单据已被剔除；如果没有任何单据通过校验，则直接结束操作，不会进入此事件。

**应用场景**：提交事务前，设置申请日期的值为提交时的日期

**示例**：
```typescript
beforeExecuteOperationTransaction(e: $.kd.bos.entity.plugin.args.BeforeOperationArgs): void {
  console.log("beforeExecuteOperationTransaction");
  if (e.getOperationKey() == "customsubmit") {
    let resultExDatas: ArrayList = new ArrayList();
    let validExtDatas = e.getValidExtDataEntities();
    
    for (let i = 0; i < validExtDatas.size(); i++) {
      let extdataentity = validExtDatas.get(i);
      let dataEnty = extdataentity.getDataEntity();
      let registrant = dataEnty.get("kdtest_reqdate");
      let date = new Date();
      dataEnty.set("kdtest_reqdate", date); // 设置单据上的申请日期字段
      resultExDatas.add(extdataentity);
    }
    
    e.getValidExtDataEntities().clear();
    e.getValidExtDataEntities().addAll(resultExDatas);
  }
  super.beforeExecuteOperationTransaction(e);
}
```

### 4. beginOperationTransaction - 事务内数据同步

**触发时机**：事务已开启，数据提交到数据库前

**作用**：处理关联数据同步。不支持在该事件中实现跨库写的逻辑，批量处理数据时，一条失败，所有数据都失败。

**应用场景**：采购申请单提交时，同步生成采购订单的数据

**示例**：
```typescript
import { BusinessDataServiceHelper, SaveServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper";
import { OperateOption } from "@cosmic/bos-core/kd/bos/dataentity";
import { OperationResult, OperateErrorInfo } from "@cosmic/bos-core/kd/bos/entity/operate/result";
import { KDException, ErrorCode } from "@cosmic/bos-core/kd/bos/exception";

beginOperationTransaction(e: $.kd.bos.entity.plugin.args.BeginOperationTransactionArgs): void {
  let ordDojs: DynamicObject[] = [];
  // 获取人民币的币种数据包
  let currencyDoj = BusinessDataServiceHelper.loadSingle("bd_currency", [new QFilter("number", "=", "CNY")]);
  
  if (e.getOperationKey() == "customsubmit") {
    let dataentities = e.getDataEntities();
    for (let dataentity of dataentities) {
      dataentity.set("kdtest_currencyfield", currencyDoj);
      
      // 同步生成一条采购订单的数据
      let ordDoj: DynamicObject = BusinessDataServiceHelper.newDynamicObject("kdtest_order");
      ordDoj.set("kdtest_currencyfield", currencyDoj);
      ordDoj.set("billstatus", "A");
      ordDoj.set("creator", RequestContext.get().getCurrUserId());
      ordDojs.push(ordDoj);
    }
    
    let result: OperationResult = SaveServiceHelper.saveOperate("kdtest_order", ordDojs, OperateOption.create());
    let errorinfos = result.getAllErrorOrValidateInfo();
    
    if (result.isSuccess()) {
      // 如有同步数据到第三方系统，如果本事件后续逻辑出现异常，需要同步在rollbackOperation中删除第三方数据
      let successPkIds = result.getSuccessPkIds();
      let ordIds = new StringBuilder();
      successPkIds.forEach(function (pkId) {
        ordIds.append(pkId).append(",");
      });
      
      this.getOption().setVariableValue("orderids", ordIds.toString()); // 设置变量供rollbackOperation事件使用
      
      for (let index = 0; index < dataentities.length; index++) {
        let dataentity = dataentities[index];
        dataentity.set("kdtest_ordernumber", ordDojs[index].get("billno"));
      }
    } else if (errorinfos.size() > 0) {
      let errorinfo = errorinfos.get(0) as OperateErrorInfo;
      let message = errorinfo.getMessage();
      let massege = new LocaleString("自定义提交时生成采购订单失败：" + message).toString();
      let errorCode = new ErrorCode("kdtest_course.kdtest_reqord.customerror", massege);
      throw new KDException(errorCode, []); // 出异常后进入rollbackOperation回调事件，整个操作失败
    }
  }
  super.beginOperationTransaction(e);
}

// 事务提交失败并回滚后，处理非事务性操作的补偿逻辑
rollbackOperation(e: $.kd.bos.entity.plugin.args.RollbackOperationArgs): void {
  let dataentities: DynamicObject[] = e.getDataEntitys(); // 保存失败，被回滚的单据
  // 回滚逻辑，如前面beginOperationTransaction事件中有在第三方系统中新增数据，要在rollbackOperation事件中删除
  super.rollbackOperation(e);
}
```

### 5. afterExecuteOperationTransaction - 事务后处理

**触发时机**：操作执行完毕，事务提交后

**应用场景**：记录日志、发送通知等非事务性操作

**示例**：
```typescript
import { MessageCenterServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper/workflow";
import { MessageInfo } from "@cosmic/bos-core/kd/bos/workflow/engine/msg/info";
import { MessageTypes } from "@cosmic/bos-core/kd/bos/form";

afterExecuteOperationTransaction(e: AfterOperationArgs): void {
  // 设置接收用户
  let receiver: List = new ArrayList();
  let userId = RequestContext.get().getCurrUserId();
  receiver.add(userId); // 当前登录用户
  
  let messageInfos = new ArrayList();
  let dataentities = e.getDataEntities();
  
  for (let i = 0; i < dataentities.length; i++) {
    let messageInfo: MessageInfo = new MessageInfo();
    let title = new LocaleString("采购申请单已经提交，请注意" + e.getDataEntities()[i].get("billno")) as LocaleString;
    messageInfo.setMessageTitle(title);
    
    let content = new LocaleString("采购申请单已经提交，请注意审批情况") as LocaleString;
    messageInfo.setMessageContent(content);
    messageInfo.setUserIds(receiver);
    
    // 设置通知类型
    messageInfo.setMessageType(MessageInfo.TYPE_MESSAGE);
    messageInfo.setSenderId(userId);
    messageInfo.setSenderName("东风");
    messageInfo.setEntityNumber("kdtest_reqbill"); // 实体编号
    messageInfo.setBizDataId(e.getDataEntities()[i].getPkValue()); // 业务数据内码集合
    messageInfo.setOperation("customsubmit");
    messageInfo.setTag("submit_notify");
    
    let clientUrl = RequestContext.get().getClientFullContextPath();
    // 设置消息的超链接
    messageInfo.setContentUrl(clientUrl + "?formId=kdtest_reqbill&pkid=" + e.getDataEntities()[0].getPkValue());
    
    messageInfos.add(messageInfo);
  }
  
  let result: Map = MessageCenterServiceHelper.batchSendMessages(messageInfos);
  super.afterExecuteOperationTransaction(e);
}
```
