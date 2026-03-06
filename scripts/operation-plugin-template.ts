/**
 * 操作插件模板 - 最小骨架
 * 基类：AbstractOperationServicePlugIn
 * 详细事件说明见 references/operation-plugin.md
 */

import { AbstractOperationServicePlugIn } from "@cosmic/bos-core/kd/bos/entity/plugin";
import { AbstractValidator, ValidationErrorInfo, ErrorLevel } from "@cosmic/bos-core/kd/bos/entity/validate";
import { DynamicObject, LocaleString } from "@cosmic/bos-core/kd/bos/dataentity/entity";

class MyOperationPlugin extends AbstractOperationServicePlugIn {

  // 预加载字段（列表执行操作时触发，单据上保存/提交/审核不触发）
  onPreparePropertys(e: any): void {
    super.onPreparePropertys(e);
    e.getFieldKeys().add("billno");
    // e.getFieldKeys().add("entryentity.fieldkey");  // 分录字段需加前缀
  }

  // 添加自定义校验器
  onAddValidators(e: any): void {
    super.onAddValidators(e);
    let InnerClass = this.getInnerClass();
    e.addValidator(new InnerClass());
  }

  getInnerClass() {
    class MyValidator extends AbstractValidator {
      validate(): void {
        let extdataentitys = this.getDataEntities();
        for (let rowEXTDataEntity of extdataentitys) {
          let dataentity = rowEXTDataEntity.getDataEntity();
          // 校验逻辑：校验失败时调用 this.getValidateResult().addErrorInfo(...)
        }
      }
    }
    return MyValidator;
  }

  // 事务前数据整理（耗时操作放这里，避免拉长事务）
  beforeExecuteOperationTransaction(e: any): void {
    super.beforeExecuteOperationTransaction(e);
  }

  // 事务内处理（关联数据同步，不支持跨库）
  beginOperationTransaction(e: any): void {
    super.beginOperationTransaction(e);
  }

  // 数据已入库，事务未提交
  endOperationTransaction(e: any): void {
    super.endOperationTransaction(e);
  }

  // 事务后处理（日志、通知，异常不会回滚事务）
  afterExecuteOperationTransaction(e: any): void {
    super.afterExecuteOperationTransaction(e);
  }

  // 事务回滚补偿（删除已同步到第三方的数据等）
  rollbackOperation(e: any): void {
    super.rollbackOperation(e);
  }
}

let plugin = new MyOperationPlugin();
export { plugin };
