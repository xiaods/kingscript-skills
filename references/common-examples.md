# 常见开发案例

## 基础操作示例

### 1. 单选头字段操作

```typescript
// 获取字段值
let billno = this.getModel().getValue("billno");
let amount = this.getModel().getValue("amountfield");

// 设置字段值
this.getModel().setValue("remark", "这是一条备注");
this.getModel().setValue("applydate", new Date());

// 判断字段是否为空
if (!billno || billno === "") {
  this.getView().showTipNotification("单据编号不能为空");
}
```

### 2. 基础资料字段操作

```typescript
// 方式1：查询基础资料对象后赋值
let materialFilter = [new QFilter("number", "=", "MAT001")];
let materialObj = BusinessDataServiceHelper.loadSingle("bd_material", materialFilter);
if (materialObj) {
  this.getModel().setValue("materialfield", materialObj);
}

// 方式2：赋值为ID（适用于已知ID的情况）
let materialId = 10001;
this.getModel().setValue("materialfield", materialId);

// 方式3：赋值为当前登录用户
let currentUserId = RequestContext.get().getCurrUserId();
this.getModel().setValue("applyuser", currentUserId);
```

### 3. 单据体操作-基础

```typescript
// 获取单据体行数
let rowCount = this.getModel().getEntryRowCount("entryentity");

// 获取当前行索引（在事件中使用）
let currentRow = 0; // 通常在事件中通过参数获取

// 获取单据体字段值
let qty = this.getModel().getValue("qtyfield", currentRow);
let price = this.getModel().getValue("pricefield", currentRow);

// 设置单据体字段值
this.getModel().setValue("qtyfield", 100, currentRow);
this.getModel().setValue("pricefield", 50.5, currentRow);
```

### 4. 单据体操作-高级

```typescript
// 清空单据体数据
this.getModel().deleteEntryData("entryentity");

// 批量新增3行
let rowIndices = this.getModel().batchCreateNewEntryRow("entryentity", 3);

// 遍历所有行
for (let i = 0; i < rowCount; i++) {
  let qty = this.getModel().getValue("qtyfield", i);
  if (qty > 100) {
    this.getModel().setValue("remark", "数量超过100", i);
  }
}

// 从数据实体获取单据体（性能更好，但不更新界面）
let dataEntity = this.getModel().getDataEntity(true);
let entryCollection = dataEntity.getDynamicObjectCollection("entryentity");
let entryCount = entryCollection.size();
for (let i = 0; i < entryCount; i++) {
  let entry = entryCollection.get(i);
  let qty = entry.get("qtyfield");
  entry.set("amountfield", qty * 100);
}
```

## 查询操作示例

### 1. 根据条件查询（返回可保存对象）

```typescript
// 查询单条数据
let pkid = 12345;
let singleData = BusinessDataServiceHelper.loadSingle(pkid, "your_bill_entity");

// 查询单条数据（指定字段）
let fields = "id,billno,amount,entryentity.qty,entryentity.price";
let singleDataWithFields = BusinessDataServiceHelper.loadSingle(pkid, "your_bill_entity", fields);

// 按条件查询第一条
let filter = [new QFilter("billno", "=", "20240001")];
let firstData = BusinessDataServiceHelper.loadSingle("your_bill_entity", filter);

// 按条件查询多条数据
let filters = [
  new QFilter("billstatus", "=", "A"),
  new QFilter("billdate", ">=", "2024-01-01")
];
let orderBy = "billno DESC";
let limit = 100;
let dataList = BusinessDataServiceHelper.load(
  "your_bill_entity",
  fields,
  filters,
  orderBy,
  limit
);
```

### 2. 根据条件查询（返回平铺对象，性能更好）

```typescript
// 查询一条数据（平铺）
let fields = "id,billno,entryentity.qty,entryentity.price";
let filter = [new QFilter("billno", "=", "20240001")];
let flatData = QueryServiceHelper.queryOne("your_bill_entity", fields, filter);

// 查询多条数据（平铺）
let orderBy = "billno DESC";
let flatDataList = QueryServiceHelper.query("your_bill_entity", fields, filters, orderBy);

// 平铺对象的特点：直接字段.单据体字段
let qty = flatData.get("entryentity.qty");
```

### 3. 使用QFilter构建复杂查询

```typescript
// 等于
new QFilter("status", "=", "A");
new QFilter("status", QCP.equals, "A");

// 不等于
new QFilter("status", "!=", "C");
new QFilter("status", QCP.not_equals, "C");

// 模糊查询
new QFilter("billno", "like", "2024%");

// 大于、小于
new QFilter("amount", ">", 1000);
new QFilter("amount", QCP.gt, 1000);
new QFilter("date", "<", "2024-12-31");

// 在集合中
let statusList = ["A", "B", "D"];
new QFilter("status", "in", statusList);
new QFilter("status", QCP.in, statusList);

// AND组合
let filter1 = new QFilter("org", "=", 1);
let filter2 = new QFilter("dept", "=", 2);
let combined = filter1.and(filter2);

// OR组合
let filter3 = new QFilter("status", "=", "A");
let filter4 = new QFilter("status", "=", "B");
let orCombined = filter3.or(filter4);
```

### 4. 缓存查询（适用于基础资料）

```typescript
// 从缓存查询单条
let cachedData = BusinessDataServiceHelper.loadSingleFromCache(pk, "bd_material");

// 从缓存查询多条
let filters = [new QFilter("number", "like", "MAT%")];
let cachedMap = BusinessDataServiceHelper.loadFromCache("bd_material", "id,number,name", filters, "number");

// cachedMap是Map结构
let material = cachedMap.get(materialId);
```

## 保存操作示例

### 1. 新增数据并保存

```typescript
// 创建空的数据包
let newData = BusinessDataServiceHelper.newDynamicObject("your_bill_entity");

// 设置单据头字段
newData.set("billstatus", "A");
newData.set("billno", "AUTO");
newData.set("applydate", new Date());
newData.set("applyuser", RequestContext.get().getCurrUserId());

// 创建单据体数据
let entryCollection = newData.getDynamicObjectCollection("entryentity");

// 方式1：使用addNew添加
for (let i = 0; i < 3; i++) {
  let entry = entryCollection.addNew() as DynamicObject;
  entry.set("seq", i + 1);
  entry.set("material", materialObj);
  entry.set("qty", 100 * (i + 1));
  entry.set("price", 50.5);
  entry.set("amount", entry.get("qty") * entry.get("price"));
}

// 方式2：批量创建行（需要先获取到界面模型）
// let rowIndices = this.getModel().batchCreateNewEntryRow("entryentity", 3);

// 调用保存操作（推荐，触发校验和插件）
let option = OperateOption.create();
let result = SaveServiceHelper.saveOperate("your_bill_entity", [newData], option);

if (result.isSuccess()) {
  let billNo = result.getSuccessPkIds().get(0);
  console.log("保存成功，单据编号：", billNo);
  this.getView().showSuccessNotification("保存成功！");
  this.getView().invokeOperation("refresh");
} else {
  console.error("保存失败：", result.getMessage());
  this.getView().showErrMessage(result.getMessage(), "保存失败");
}
```

### 2. 修改数据并保存

```typescript
// 方式1：查询后修改
let pkid = this.getModel().getPkValue();
let data = BusinessDataServiceHelper.loadSingle(pkid, "your_bill_entity");

data.set("remark", "修改后的备注");
data.set("modifier", RequestContext.get().getCurrUserId());

// 修改单据体
let entryCollection = data.getDynamicObjectCollection("entryentity");
for (let i = 0; i < entryCollection.size(); i++) {
  let entry = entryCollection.get(i) as DynamicObject;
  let qty = entry.get("qty");
  entry.set("qty", qty * 2); // 数量翻倍
  entry.set("amount", entry.get("qty") * entry.get("price"));
}

let result = SaveServiceHelper.saveOperate("your_bill_entity", [data], OperateOption.create());

// 方式2：列表上批量修改选中行
let selectedRows = this.getSelectedRows();
let pkIds = selectedRows.getPrimaryKeyValues();

let filter = new QFilter("id", QCP.in, pkIds);
let dataList = BusinessDataServiceHelper.load("your_bill_entity", "id,amount,entryentity.qty", [filter], "", 100);

for (let data of dataList) {
  // 修改逻辑
}

SaveServiceHelper.saveOperate("your_bill_entity", dataList, OperateOption.create());
```

### 3. 直接保存（不走校验，慎用）

```typescript
// 直接保存（不走操作校验）
let result = SaveServiceHelper.save([newData], OperateOption.create());

// 直接更新（不走操作校验）
SaveServiceHelper.update([data], OperateOption.create());
```

### 4. 删除数据

```typescript
// 删除操作
let ids = [pkid1, pkid2, pkid3];
let deleteHelper = new DeleteServiceHelper();
let result = deleteHelper.deleteOperate("your_bill_entity", ids, OperateOption.create());

if (result.isSuccess()) {
  console.log("删除成功");
  this.getView().invokeOperation("refresh");
}
```

### 5. 调用其他实体操作

```typescript
import { OperationServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper/operation";

// 提交操作
let submitResult = OperationServiceHelper.executeOperate(
  "submit",
  "your_bill_entity",
  [dataEntity],
  OperateOption.create()
);

// 审核操作
let auditResult = OperationServiceHelper.executeOperate(
  "audit",
  "your_bill_entity",
  [dataEntity],
  OperateOption.create()
);
```

## 消息通知示例

### 发送系统通知

```typescript
import { MessageInfo } from "@cosmic/bos-core/kd/bos/workflow/engine/msg/info";
import { MessageCenterServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper/workflow";

// 创建消息
let messageInfo = new MessageInfo();
messageInfo.setMessageTitle(new LocaleString("单据已提交"));
messageInfo.setMessageContent(new LocaleString("您的采购申请单已提交成功，请及时审批"));

// 设置接收人
let receiverList = new ArrayList();
receiverList.add(10001); // 用户ID
receiverList.add(10002);
messageInfo.setUserIds(receiverList);

// 设置消息类型
messageInfo.setMessageType(MessageInfo.TYPE_MESSAGE); // 通知
// messageInfo.setMessageType(MessageInfo.TYPE_BP); // 待办

// 设置发送人
let senderId = RequestContext.get().getCurrUserId();
messageInfo.setSenderId(senderId);
messageInfo.setSenderName("系统");

// 关联业务数据
messageInfo.setEntityNumber("your_bill_entity");
messageInfo.setBizDataId(dataEntity.getPkValue());
messageInfo.setOperation("submit");

// 设置消息跳转链接
let clientUrl = RequestContext.get().getClientFullContextPath();
messageInfo.setContentUrl(`${clientUrl}?formId=your_bill_entity&pkid=${dataEntity.getPkValue()}`);

// 发送单条
MessageCenterServiceHelper.sendMessage(messageInfo);

// 批量发送多条
let messageInfos = new ArrayList();
messageInfos.add(messageInfo1);
messageInfos.add(messageInfo2);
let result = MessageCenterServiceHelper.batchSendMessages(messageInfos);

console.log("发送结果:", result.get("success"));
```

## 控件操作示例

### 1. 工具栏按钮操作

```typescript
// 注册工具栏监听
registerListener(e: EventObject): void {
  let toolbar = this.getView().getControl("tbmain") as Toolbar;
  toolbar.addItemClickListener(this);
}

// 处理按钮点击
itemClick(e: ItemClickEvent): void {
  if (e.getItemKey() === "btn_query") {
    this.handleQuery();
  } else if (e.getItemKey() === "btn_save") {
    this.handleSave();
  }
}

// 按钮点击前校验（在registerListener中注册）
registerListener(e: EventObject): void {
  let toolbar = this.getView().getControl("tbmain") as Toolbar;
  toolbar.addItemClickListener({
    beforeItemClick: (evt) => {
      if (evt.getItemKey() === "btn_download") {
        // 校验逻辑
        if (!this.validateBeforeDownload()) {
          evt.setCancel(true); // 取消操作
          return;
        }
      }
    },
    itemClick: (evt) => {
      // 处理点击
    }
  });
}
```

### 2. 控件可见性和锁定性

```typescript
// 在afterBindData中设置
afterBindData(e: EventObject): void {
  // 根据状态设置字段锁定性
  let status = this.getModel().getValue("billstatus");
  if (status === "C") { // 已审核
    // 锁定字段
    this.getView().setEnable(false, "remark");
    this.getView().setEnable(false, 0, "qtyfield"); // 锁定第一行
    this.getView().setEnable(false, "qtyfield"); // 锁定所有行
    
    // 隐藏字段
    this.getView().setVisible(false, "applyreason");
  } else {
    this.getView().setEnable(true, "remark");
    this.getView().setVisible(true, "applyreason");
  }
  
  // 动态表单设计器中可以设置字段属性表达式，实现条件锁定/可见
  // 例如：锁定性表达式：billstatus == 'C'
}
```

### 3. 基础资料字段操作

```typescript
// 基础资料F7选择前过滤
class MyPlugin extends AbstractBillPlugIn implements BeforeF7SelectListener {
  registerListener(e: EventObject): void {
    let basedataEdit = this.getView().getControl("materialfield") as BasedataEdit;
    basedataEdit.addBeforeF7SelectListener(this);
  }
  
  beforeF7Select(evt: BeforeF7SelectEvent): void {
    if (evt.getProperty().getName() === "materialfield") {
      let filter = new ArrayList();
      
      // 过滤条件
      filter.add(new QFilter("materialgroup.number", "=", "001"));
      filter.add(new QFilter("usestatus", "=", 1));
      
      evt.setCustomQFilters(filter);
    }
  }
}

// 基础资料值更新事件
propertyChanged(e: PropertyChangedArgs): void {
  if (e.getProperty().getName() === "materialfield") {
    let material = e.getChangeSet()[0].getNewValue();
    if (material) {
      // 根据物料自动带出计量单位
      let unit = material.get("baseunit");
      this.getModel().setValue("unitfield", unit);
    }
  }
}
```

### 4. 文件下载

```typescript
// 批量下载附件
itemClick(e: ItemClickEvent): void {
  if (e.getItemKey() === "btn_download_att") {
    let entryGrid = this.getView().getControl("entryentity") as EntryGrid;
    let selectedRows = entryGrid.getSelectedRows();
    
    for (let row of selectedRows) {
      let attachment = row.get("attachmentfield") as DynamicObjectCollection;
      
      for (let attach of attachment) {
        let fileUrl = attach.getString("url");
        let downloadUrl = "attachment/download.do?path=" + fileUrl;
        this.getView().download(downloadUrl);
      }
    }
  }
}
```

## 日期处理示例

```typescript
// 当前日期
let today = new Date();
let now = new Date();

// 设置字段为当前日期
this.getModel().setValue("applydate", today);

// 日期加减
let nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);

let lastMonth = new Date();
lastMonth.setMonth(lastMonth.getMonth() - 1);

// 格式化日期（根据业务需求）
let year = today.getFullYear();
let month = String(today.getMonth() + 1).padStart(2, '0');
let day = String(today.getDate()).padStart(2, '0');
let dateStr = `${year}-${month}-${day}`;

// 使用苍穹工具类（如果有）
// import { DateUtils } from "@cosmic/bos-core/kd/bos/util";
// let formattedDate = DateUtils.formatDate(today, "yyyy-MM-dd");
```

## 数值计算示例

```typescript
// 金额计算（注意精度问题）
let qty = this.getModel().getValue("qtyfield", rowIndex) || 0;
let price = this.getModel().getValue("pricefield", rowIndex) || 0;
let amount = qty * price;

// 设置金额（保留两位小数）
this.getModel().setValue("amountfield", Number(amount.toFixed(2)), rowIndex);

// 汇总计算
let totalAmount = 0;
let entryCount = this.getModel().getEntryRowCount("entryentity");
for (let i = 0; i < entryCount; i++) {
  totalAmount += this.getModel().getValue("amountfield", i) || 0;
}
this.getModel().setValue("totalamount", Number(totalAmount.toFixed(2)));
```

## 弹出窗体示例

```typescript
import { BillShowParameter } from "@cosmic/bos-core/kd/bos/bill";
import { ShowType } from "@cosmic/bos-core/kd/bos/form";

// 打开单据详情
openBillDetail(pkid: number): void {
  let billPara = new BillShowParameter();
  billPara.setPkId(pkid); // 设置主键
  billPara.setFormId("your_bill_entity"); // 设置表单标识
  billPara.getOpenStyle().setShowType(ShowType.Modal); // 模态窗口
  this.getView().showForm(billPara);
}

// 打开表单并传递参数
openCustomPage(): void {
  let para = new FormShowParameter();
  para.setFormId("your_custom_form");
  para.setCustomParam("param1", "value1"); // 传递自定义参数
  para.setCustomParam("param2", 123);
  
  // 设置回调函数
  para.setCloseCallBack(new CloseCallBack(this, "refreshCallback"));
  
  this.getView().showForm(para);
}

// 接收回调
// TODO: 需要在refreshCallback方法中处理
```

## 多语言处理示例

```typescript
import { LocaleString } from "@cosmic/bos-core/kd/bos/dataentity/entity";

// 创建多语言字符串
let msg = new LocaleString("这是一条消息");

// 带参数的多语言字符串
let msgWithParam = new LocaleString("单据{0}已提交成功", billNo);

// 显示消息时使用
this.getView().showMessage(msg.toString());
this.getView().showSuccessNotification(msg.toString());

// 在html控件中显示
// let htmlControl = this.getView().getControl("htmlap") as HtmlEditor;
// htmlControl.setText("<p>" + msg.toString() + "</p>");
```

## 性能优化建议

### 1. 查询优化
```typescript
// ✅ 推荐：指定需要的字段
let fields = "id,billno,amount,entryentity.qty";
let data = BusinessDataServiceHelper.load("entity", fields, filters, "", 100);

// ❌ 不推荐：查询所有字段
let data = BusinessDataServiceHelper.load("entity", null, filters, "", 100);

// ✅ 推荐：只读查询用QueryServiceHelper（性能更好）
let flatData = QueryServiceHelper.query("entity", fields, filters, "");

// ✅ 推荐：批量查询比循环查询单条性能好
let pkIds = [1, 2, 3, 4, 5];
let filter = new QFilter("id", QCP.in, pkIds);
let batchData = BusinessDataServiceHelper.load("entity", fields, [filter], "", 100);

// ❌ 不推荐
let dataList = [];
for (let id of pkIds) {
  let singleData = BusinessDataServiceHelper.loadSingle(id, "entity");
  dataList.push(singleData);
}
```

### 2. 保存优化
```typescript
// ✅ 推荐：批量保存
let dataList = [data1, data2, data3];
SaveServiceHelper.saveOperate("entity", dataList, OperateOption.create());

// ❌ 不推荐：循环保存
for (let data of dataList) {
  SaveServiceHelper.saveOperate("entity", [data], OperateOption.create());
}

// ✅ 推荐：仅更新变化的数据（update方法）
SaveServiceHelper.update([changedData], OperateOption.create());
```

### 3. 事务处理优化
```typescript
// ✅ 推荐：耗时操作放在事务外（beforeExecuteOperationTransaction）
beforeExecuteOperationTransaction(e: BeforeOperationArgs): void {
  // 数据计算、格式转换等耗时操作
  this.prepareData(e.getValidExtDataEntities());
}

// 事务内只做数据库操作
beginOperationTransaction(e: BeginOperationTransactionArgs): void {
  // 仅保存已准备好的数据
  SaveServiceHelper.saveOperate("entity", preparedData, option);
}

// ❌ 不推荐：在事务内做复杂计算
beginOperationTransaction(e: BeginOperationTransactionArgs): void {
  // 1000条数据的复杂计算
  for (let data of dataList) {
    let result = this.complexCalculation(data); // 耗时操作
    data.set("result", result);
  }
  // 保存...事务被长时间占用
}
```

## 调试技巧

### 1. 使用console
```typescript
// 打印日志
console.log("这是一条日志");
console.warn("这是一个警告");
console.error("这是一个错误");
console.info("这是一条信息");

// 打印对象
console.log("数据包:", dataEntity);

// 打印复杂信息
console.log(`单据${billno}处理完成，共${rowCount}行分录`);
```

### 2. 使用debugger断点
```typescript
// 在需要的地方添加debugger
function someMethod(): void {
  let data = this.getModel().getValue("field");
  debugger; // 执行到这里会暂停
  
  // ... 后续代码
  this.processData(data);
}
```

### 3. 错误捕获
```typescript
// 全局异常捕获
try {
  // 业务逻辑
  this.validateData();
  this.saveData();
} catch (error) {
  console.error("操作失败:", error);
  this.getView().showErrMessage(error.message, "操作失败");
}

// 在模板方法中捕获异常
itemClick(e: ItemClickEvent): void {
  try {
    if (e.getItemKey() === "btn_save") {
      this.handleSave();
    }
  } catch (error) {
    console.error("itemClick error:", error);
    this.getView().showTipNotification("操作失败：" + error.message);
  }
}
```

### 4. 查看调用栈
```typescript
// 在控制台查看调用栈
function method1(): void {
  method2();
}

function method2(): void {
  console.trace("查看调用栈");
}
```

## 错误处理示例

### 1. 统一错误处理
```typescript
// 统一的错误处理方法
private handleError(result: OperationResult, operation: string): void {
  if (result.isSuccess()) return;
  
  let message = result.getMessage();
  let errors = result.getAllErrorOrValidateInfo();
  
  for (let error of errors) {
    message += "\\n" + error.getMessage();
  }
  
  this.getView().showErrMessage(message, `${operation}失败`);
}

// 使用
let result = SaveServiceHelper.saveOperate("entity", [data], option);
this.handleError(result, "保存");
```

### 2. 操作结果验证
```typescript
// 保存并验证
function saveAndValidate(): boolean {
  let result = SaveServiceHelper.saveOperate("entity", [data], option);
  
  if (!result.isSuccess()) {
    this.handleError(result, "保存");
    return false;
  }
  
  // 额外验证
  let errors = result.getAllErrorOrValidateInfo();
  if (errors && errors.size() > 0) {
    for (let error of errors) {
      console.warn("验证信息:", error.getMessage());
    }
  }
  
  return true;
}
```
