/**
 * 操作插件模板
 * 继承于操作插件基类 AbstractOperationServicePlugIn
 * 用于扩展单据、基础资料的服务端业务逻辑
 */

import { AbstractOperationServicePlugIn, AddValidatorsEventArgs, PreparePropertysEventArgs } from "@cosmic/bos-core/kd/bos/entity/plugin";
import { BeforeOperationArgs, BeginOperationTransactionArgs, AfterOperationArgs, RollbackOperationArgs } from "@cosmic/bos-core/kd/bos/entity/plugin/args";
import { AbstractValidator, ValidationErrorInfo, ErrorLevel } from "@cosmic/bos-core/kd/bos/entity/validate";
import { RowDataModel } from "@cosmic/bos-core/kd/bos/entity/formula";
import { DynamicPropertyCollection } from "@cosmic/bos-core/kd/bos/dataentity/metadata/dynamicobject";
import { DynamicObject, DynamicObjectCollection, LocaleString } from "@cosmic/bos-core/kd/bos/dataentity/entity";
import { BusinessDataServiceHelper, QueryServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper";
import { SaveServiceHelper, DeleteServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper/operation";
import { OperationResult, OperateErrorInfo } from "@cosmic/bos-core/kd/bos/entity/operate/result";
import { OperateOption } from "@cosmic/bos-core/kd/bos/dataentity";
import { KDException, ErrorCode } from "@cosmic/bos-core/kd/bos/exception";
import { QFilter, QCP } from "@cosmic/bos-core/kd/bos/orm/query";
import { MessageInfo } from "@cosmic/bos-core/kd/bos/workflow/engine/msg/info";
import { MessageCenterServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper/workflow";
import { RequestContext } from "@cosmic/bos-core/kd/bos/context";
import { ArrayList, List, Map } from "@cosmic/bos-script/java/util";
import { StringBuilder } from "@cosmic/bos-script/java/lang";

// =============================================================================
// 常量定义区 - 根据实际业务修改
// =============================================================================

/** 实体标识 */
const ENTITY = {
  // TODO: 替换为实际的实体标识
  MAIN: "your_bill_entity",
  ENTRY: "your_entry_entity",
  RELATE: "your_relate_entity"
};

/** 操作标识 */
const OPERATION = {
  SAVE: "save",
  SUBMIT: "submit",
  AUDIT: "audit"
};

/** 字段标识 */
const FIELD = {
  // TODO: 替换为实际的字段标识
  BILLNO: "billno",
  STATUS: "billstatus",
  AMOUNT: "amountfield",
  QTY: "qtyfield"
};

// =============================================================================
// 插件类定义
// =============================================================================

class CustomOperationPlugin extends AbstractOperationServicePlugIn {

  /**
   * 预指定加载字段事件
   * 触发时机：加载单据数据包之前
   * 说明：在操作正式执行时，准备加载待处理的单据数据包前触发
   *       在单据上执行保存、提交、审核操作时，不会触发此事件
   *       在单据上执行其他操作，或在列表上执行操作时会触发此事件
   * 注意：默认是按需加载，只加载最少量的字段
   *       插件要用到的字段，必须通过本事件指定
   */
  onPreparePropertys(e: PreparePropertysEventArgs): void {
    try {
      console.log("onPreparePropertys: " + e.getOperationKey());
      
      // TODO: 添加插件需要用到的字段
      // 注意：在其他事件中需要通过get/set访问的字段，必须在这里添加
      
      e.getFieldKeys().add(FIELD.BILLNO);
      e.getFieldKeys().add(FIELD.STATUS);
      e.getFieldKeys().add(FIELD.AMOUNT);
      e.getFieldKeys().add(ENTITY.ENTRY + "." + FIELD.QTY);
      e.getFieldKeys().add(ENTITY.ENTRY + "." + FIELD.AMOUNT);
      
    } catch (error) {
      console.error("onPreparePropertys error:", error);
    }
    
    super.onPreparePropertys(e);
  }

  /**
   * 添加自定义校验器
   * 触发时机：系统预置校验器加载完毕，执行校验前
   * 应用场景：添加业务逻辑校验
   */
  onAddValidators(e: AddValidatorsEventArgs): void {
    try {
      console.log("onAddValidators: " + e.getOperationCode());
      
      // TODO: 添加自定义校验器
      let validator = this.createCustomValidator();
      e.addValidator(validator);
      
    } catch (error) {
      console.error("onAddValidators error:", error);
    }
    
    super.onAddValidators(e);
  }

  /**
   * 事务开启前处理
   * 触发时机：操作校验通过，开启事务前
   * 说明：本事件参数只含已通过校验的单据
   *       推荐将数据处理逻辑放在事务外，避免拉长事务时间
   * 应用场景：数据整理，如计算字段值、格式化数据等
   */
  beforeExecuteOperationTransaction(e: BeforeOperationArgs): void {
    try {
      const operationKey = e.getOperationKey();
      console.log("beforeExecuteOperationTransaction: " + operationKey);
      
      // TODO: 在事务前处理数据
      if (operationKey === OPERATION.SUBMIT) {
        this.prepareDataBeforeTransaction(e.getValidExtDataEntities());
      }
      
    } catch (error) {
      console.error("beforeExecuteOperationTransaction error:", error);
    }
    
    super.beforeExecuteOperationTransaction(e);
  }

  /**
   * 事务内处理
   * 触发时机：事务已开启，数据提交到数据库前
   * 说明：不支持在该事件中实现跨库写的逻辑
   *       批量处理数据时，一条失败，所有数据都失败
   * 应用场景：关联数据同步，如生成下游单据、同步到第三方系统等
   */
  beginOperationTransaction(e: BeginOperationTransactionArgs): void {
    try {
      const operationKey = e.getOperationKey();
      console.log("beginOperationTransaction: " + operationKey);
      
      // TODO: 在事务内处理关联数据
      if (operationKey === OPERATION.SUBMIT) {
        this.syncRelateData(e.getDataEntities());
      }
      
    } catch (error) {
      console.error("beginOperationTransaction error:", error);
      // 主动抛出异常，回滚整个事务
      let errorCode = new ErrorCode("CUSTOM_ERROR", error.message);
      throw new KDException(errorCode, []);
    }
    
    super.beginOperationTransaction(e);
  }

  /**
   * 事务提交后处理
   * 触发时机：操作执行完毕，事务提交后
   * 说明：无论操作成功与否，都会触发此事件
   * 应用场景：记录日志、发送通知、调用外部接口等非事务性操作
   */
  afterExecuteOperationTransaction(e: AfterOperationArgs): void {
    try {
      const operationKey = e.getOperationKey();
      console.log("afterExecuteOperationTransaction: " + operationKey);
      
      // TODO: 操作后处理
      if (operationKey === OPERATION.SUBMIT) {
        const result = e.getOperationResult();
        if (result.isSuccess()) {
          this.sendNotification(e.getDataEntities());
          this.writeOperationLog(e.getDataEntities());
        }
      }
      
    } catch (error) {
      console.error("afterExecuteOperationTransaction error:", error);
      // 注意：这里的异常不会回滚事务，需要自行处理
    }
    
    super.afterExecuteOperationTransaction(e);
  }

  /**
   * 事务回滚后处理
   * 触发时机：事务回滚后
   * 说明：通常用于补偿处理，如删除第三方数据、回滚非事务性操作等
   */
  rollbackOperation(e: RollbackOperationArgs): void {
    try {
      console.log("rollbackOperation");
      
      // TODO: 回滚补偿处理
      const dataentities = e.getDataEntitys();
      if (dataentities && dataentities.length > 0) {
        this.compensateThirdPartyData(dataentities);
      }
      
    } catch (error) {
      console.error("rollbackOperation error:", error);
    }
    
    super.rollbackOperation(e);
  }

  // =============================================================================
  // 辅助方法
  // =============================================================================

  /**
   * 创建自定义校验器
   */
  private createCustomValidator(): AbstractValidator {
    const self = this; // 保留this引用
    
    class CustomValidator extends AbstractValidator {
      validate(): void {
        try {
          console.log("CustomValidator validate");
          
          const dataentities = self.getDataEntities();
          const entityKey = self.getEntityKey();
          const validateContext = self.getValidateContext();
          
          // 创建行数据模型（用于方便读取字段值）
          const rowDataModel = new RowDataModel(entityKey, validateContext.getSubEntityType());
          
          for (const extDataEntity of dataentities) {
            const dataEntity = extDataEntity.getDataEntity();
            rowDataModel.setRowContext(dataEntity);
            
            // TODO: 实现校验逻辑
            self.validateBusinessRules(dataEntity, extDataEntity, rowDataModel);
          }
          
        } catch (error) {
          console.error("CustomValidator error:", error);
        }
      }
    }
    
    return new CustomValidator();
  }

  /**
   * 校验业务规则
   * 示例：检查单据体分录不能为空
   */
  private validateBusinessRules(
    dataEntity: DynamicObject,
    extDataEntity: any,
    rowDataModel: RowDataModel
  ): void {
    try {
      // 示例1：检查单据体不能为空
      const entryCollection = dataEntity.get(ENTITY.ENTRY) as DynamicPropertyCollection;
      if (!entryCollection || entryCollection.size() <= 0) {
        this.addValidationError(
          extDataEntity,
          "ENTRY_EMPTY",
          "单据分录不能为空",
          ErrorLevel.Error
        );
        return;
      }
      
      // 示例2：检查分录字段值
      for (let i = 0; i < entryCollection.size(); i++) {
        const entry = entryCollection.get(i) as DynamicObject;
        const qty = entry.get(FIELD.QTY);
        const amount = entry.get(FIELD.AMOUNT);
        
        if (!qty || qty <= 0) {
          this.addValidationError(
            extDataEntity,
            "QTY_INVALID",
            `第${i + 1}行：数量必须大于0`,
            ErrorLevel.Error
          );
        }
        
        if (!amount || amount < 0) {
          this.addValidationError(
            extDataEntity,
            "AMOUNT_INVALID",
            `第${i + 1}行：金额不能为负数`,
            ErrorLevel.Error
          );
        }
      }
      
      // 示例3：检查单据头字段
      const totalAmount = dataEntity.get(FIELD.AMOUNT);
      if (!totalAmount || totalAmount <= 0) {
        this.addValidationError(
          extDataEntity,
          "TOTAL_AMOUNT_INVALID",
          "总金额必须大于0",
          ErrorLevel.Error
        );
      }
      
    } catch (error) {
      console.error("validateBusinessRules error:", error);
    }
  }

  /**
   * 添加校验错误
   */
  private addValidationError(
    extDataEntity: any,
    errorCode: string,
    errorMessage: string,
    errorLevel: ErrorLevel = ErrorLevel.Error
  ): void {
    try {
      const info = new ValidationErrorInfo(
        "", // 字段标识，空表示单据级错误
        extDataEntity.getBillPkId(),
        extDataEntity.getDataEntityIndex(),
        extDataEntity.getRowIndex(),
        errorCode,
        this.getValidateContext().getOperateName(),
        errorMessage,
        errorLevel
      );
      
      this.getValidateResult().addErrorInfo(info);
      
    } catch (error) {
      console.error("addValidationError error:", error);
    }
  }

  /**
   * 事务前数据准备
   * 示例：计算字段值、格式化数据、设置默认值等
   */
  private prepareDataBeforeTransaction(validExtDataEntities: ArrayList): void {
    try {
      console.log("prepareDataBeforeTransaction, count: " + validExtDataEntities.size());
      
      for (let i = 0; i < validExtDataEntities.size(); i++) {
        const extDataEntity = validExtDataEntities.get(i);
        const dataEntity = extDataEntity.getDataEntity();
        
        // TODO: 数据准备逻辑
        
        // 示例1：设置系统默认值
        const currentDate = new Date();
        dataEntity.set("submitdate", currentDate);
        
        // 示例2：计算总金额
        let totalAmount = 0;
        const entryCollection = dataEntity.get(ENTITY.ENTRY) as DynamicPropertyCollection;
        
        if (entryCollection && entryCollection.size() > 0) {
          for (let j = 0; j < entryCollection.size(); j++) {
            const entry = entryCollection.get(j) as DynamicObject;
            const amount = entry.get(FIELD.AMOUNT) || 0;
            totalAmount += amount;
          }
        }
        
        dataEntity.set(FIELD.AMOUNT, totalAmount);
      }
      
    } catch (error) {
      console.error("prepareDataBeforeTransaction error:", error);
    }
  }

  /**
   * 事务内同步关联数据
   * 示例：生成下游单据、同步到第三方系统等
   */
  private syncRelateData(dataEntities: DynamicObject[]): void {
    try {
      console.log("syncRelateData, count: " + dataEntities.length);
      
      // TODO: 关联数据同步逻辑
      
      // 示例1：生成下游单据
      // const relatedDocs = this.createRelatedDocuments(dataEntities);
      // const saveResult = SaveServiceHelper.saveOperate(ENTITY.RELATE, relatedDocs, OperateOption.create());
      // 
      // if (!saveResult.isSuccess()) {
      //   throw new Error("生成下游单据失败: " + saveResult.getMessage());
      // }
      
      // 示例2：同步到第三方系统（需要做好幂等和重试机制）
      // try {
      //   await this.syncToThirdParty(dataEntities);
      // } catch (syncError) {
      //   console.error("同步到第三方系统失败:", syncError);
      //   // 根据业务需求决定是否抛出异常回滚事务
      //   // throw syncError;
      // }
      
    } catch (error) {
      console.error("syncRelateData error:", error);
      throw error; // 抛出异常会回滚事务
    }
  }

  /**
   * 生成下游单据
   */
  private createRelatedDocuments(sourceEntities: DynamicObject[]): DynamicObject[] {
    try {
      const relateDocs: DynamicObject[] = [];
      
      for (const source of sourceEntities) {
        // 创建新的下游单据数据包
        const relateDoc = BusinessDataServiceHelper.newDynamicObject(ENTITY.RELATE);
        
        // TODO: 设置单据头字段
        relateDoc.set("billstatus", "A");
        relateDoc.set("sourcedocid", source.getPkValue());
        relateDoc.set("sourcedocno", source.get(FIELD.BILLNO));
        
        // TODO: 同步单据体数据
        const sourceEntries = source.get(ENTITY.ENTRY) as DynamicPropertyCollection;
        if (sourceEntries && sourceEntries.size() > 0) {
          const relateEntries = relateDoc.getDynamicObjectCollection(ENTITY.ENTRY + "_entry");
          
          for (let i = 0; i < sourceEntries.size(); i++) {
            const sourceEntry = sourceEntries.get(i) as DynamicObject;
            const relateEntry = relateEntries.addNew() as DynamicObject;
            
            // TODO: 复制字段值
            relateEntry.set("qty", sourceEntry.get(FIELD.QTY));
            relateEntry.set("price", sourceEntry.get("pricefield"));
          }
        }
        
        relateDocs.push(relateDoc);
      }
      
      return relateDocs;
      
    } catch (error) {
      console.error("createRelatedDocuments error:", error);
      throw error;
    }
  }

  /**
   * 发送通知
   * 触发时机：事务提交成功后
   */
  private sendNotification(dataEntities: DynamicObject[]): void {
    try {
      const userId = RequestContext.get().getCurrUserId();
      const receiver = new ArrayList();
      receiver.add(userId);
      
      const messageInfos = new ArrayList();
      
      for (const dataEntity of dataEntities) {
        const messageInfo = new MessageInfo();
        
        // 设置消息标题
        const title = new LocaleString(`单据 ${dataEntity.get(FIELD.BILLNO)} 已提交`);
        messageInfo.setMessageTitle(title);
        
        // 设置消息内容
        const content = new LocaleString("您的单据已提交成功，请及时处理后续审批流程。");
        messageInfo.setMessageContent(content);
        
        // 设置接收人
        messageInfo.setUserIds(receiver);
        messageInfo.setMessageType(MessageInfo.TYPE_MESSAGE);
        messageInfo.setSenderId(userId);
        
        // 关联业务数据
        messageInfo.setEntityNumber(ENTITY.MAIN);
        messageInfo.setBizDataId(dataEntity.getPkValue());
        messageInfo.setOperation(OPERATION.SUBMIT);
        messageInfo.setTag("submit_notify");
        
        messageInfos.add(messageInfo);
      }
      
      // 批量发送消息
      const result: Map = MessageCenterServiceHelper.batchSendMessages(messageInfos);
      
      if (!result.get("success")) {
        console.warn("发送通知失败:", result.get("message"));
      }
      
    } catch (error) {
      console.error("sendNotification error:", error);
    }
  }

  /**
   * 记录操作日志
   */
  private writeOperationLog(dataEntities: DynamicObject[]): void {
    try {
      const userId = RequestContext.get().getCurrUserId();
      const operationKey = this.getOption().getVariable("operationKey");
      
      // TODO: 记录日志到日志表或外部系统
      console.log(`用户[${userId}]执行了[${operationKey}]操作，处理了${dataEntities.length}条数据`);
      
      // 示例：循环记录每条数据的关键信息
      for (const dataEntity of dataEntities) {
        const logInfo = {
          docId: dataEntity.getPkValue(),
          docNo: dataEntity.get(FIELD.BILLNO),
          operation: operationKey,
          operator: userId,
          operationTime: new Date()
        };
        
        console.log("操作日志:", JSON.stringify(logInfo));
      }
      
    } catch (error) {
      console.error("writeOperationLog error:", error);
    }
  }

  /**
   * 补偿第三方数据
   * 说明：在rollbackOperation中调用，删除第三方系统的数据
   */
  private compensateThirdPartyData(dataEntities: DynamicObject[]): void {
    try {
      if (!dataEntities || dataEntities.length === 0) return;
      
      // TODO: 获取beginOperationTransaction中存储的变量
      // const relateDocIds = this.getOption().getVariable("relateDocIds");
      
      // TODO: 调用第三方接口删除数据
      // console.log(`补偿处理：删除${dataEntities.length}条单据在第三方系统的数据`);
      
    } catch (error) {
      console.error("compensateThirdPartyData error:", error);
    }
  }

  /**
   * 同步到第三方系统
   * 注意：做好幂等和重试机制
   */
  private async syncToThirdParty(dataEntities: DynamicObject[]): Promise<void> {
    try {
      console.log(`开始同步${dataEntities.length}条数据到第三方系统`);
      
      // TODO: 实现同步逻辑，建议使用异步方式
      // const syncData = this.buildSyncData(dataEntities);
      // const response = await fetch('https://api.third-party.com/sync', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(syncData)
      // });
      // 
      // if (!response.ok) {
      //   throw new Error(`同步失败: ${response.statusText}`);
      // }
      
    } catch (error) {
      console.error("syncToThirdParty error:", error);
      throw error;
    }
  }
}

// =============================================================================
// 导出插件实例（必须）
// =============================================================================

let plugin = new CustomOperationPlugin();
export { plugin };
