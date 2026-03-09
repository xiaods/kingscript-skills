# 表单插件开发参考

## 目录

- [概述](#概述) - 插件基类
- [插件事件总览](#插件事件总览) - 打开前/初始化/交互/关闭事件表
- [常见事件详解](#常见事件详解) - preOpenForm、afterCreateNewData、afterLoadData、afterBindData、itemClick、beforeF7Select、propertyChanged 等
- [父子页面弹窗及交互](#父子页面弹窗及交互) - 弹窗传参、CloseCallBack 回调
- [富文本/多选基础资料/子单据体](#富文本控件操作) - 特殊控件与数据结构操作
- [页面状态/锁定/选中行/触发控件](#页面状态判断) - 界面控制进阶
- [赋值不触发事件/确认框/单元格行点击](#赋值不触发值更新事件) - 交互进阶模式
- [修改控件名称/元数据/关闭控制/F7进阶](#修改控件名称) - 高级API
- [关键API汇总](#关键api汇总) - 模型/视图/上下文/缓存/刷新 API

---

## 概述

表单插件是表单页面加载和运行时执行的插件，可以在表单插件中对表单页面的前端样式和实体数据进行处理。

### 插件基类

- 动态表单的插件基类：`AbstractFormPlugin`
- 单据中的表单的插件基类：`AbstractBillPlugIn`（继承于`AbstractFormPlugin`）

## 插件事件总览

### 界面打开前事件（按顺序）

| 事件 | 触发时机 | 应用场景 |
|------|---------|---------|
| setPluginName | 显示界面，准备构建界面显示配置formConfig前 | 只有JS代码插件会触发，无实际用处 |
| preOpenForm | 显示界面前，准备构建界面显示参数时 | 取消页面的打开，修改被打开页面的参数 |
| loadCustomControlMetas | 显示界面前，构建界面显示参数时 | 向前端动态增加控件，相对复杂 |

### 界面初始化事件（按顺序）

| 事件 | 触发时机 | 应用场景 |
|------|---------|---------|
| setView | 表单视图模型初始化 | 二开用不上 |
| initialize | 表单视图模型初始化，创建插件后 | 表单界面在服务端是无状态的 |
| registerListener | 用户与界面上的控件交互时 | 注册监听器 |
| getEntityType | 表单基于实体模型，创建数据包之前 | - |
| createNewData | 界面初始化或刷新，开始新建数据包时 | - |
| afterCreateNewData | 界面初始化或刷新，新建数据包完毕后 | 常用于实体字段赋值，仅新增时触发 |
| beforeBindData | 界面数据包构建完毕，开始生成指令前 | - |
| afterBindData | 界面数据包构建完毕，生成指令后 | 常用于修改控件属性 |

### 用户点击交互事件

| 事件 | 触发时机 | 应用场景 |
|------|---------|---------|
| beforeItemClick | 用户点击界面菜单按钮，执行绑定的操作前 | 业务校验 |
| itemClick | 用户点击界面菜单按钮时 | 业务处理 |
| Beforeclick | 点击触发click事件前的校验事件 | 业务校验 |
| Click | 点击后触发操作事件 | 业务处理 |
| beforeDoOperation | 用户点击按钮、菜单，执行绑定的操作前 | 业务校验，干预操作 |
| afterDoOperation | 用户点击按钮、菜单，执行完绑定的操作后 | 操作后业务处理 |
| customEvent | 触发自定义控件的定制事件 | 后端响应自定义控件前端的请求 |
| beforef7Selected | 用户点击基础资料字段的按钮，打开选择列表前 | 基础资料F7过滤 |
| propertyChanged | 控件值更新事件 | 字段A变化时，同步修改字段B |

### 页面关闭事件

| 事件 | 触发时机 | 应用场景 |
|------|---------|---------|
| beforeClosed | 界面关闭之前 | 页面关闭前取消数据更新校验 |
| destory | 界面关闭后，释放资源时 | 不要在此事件中访问表单信息 |
| pageRelease | 界面关闭后，释放资源时 | 释放插件创建的资源 |

### 不同页面状态的触发差异

| 状态 | afterCreateNewData | afterLoadData |
|------|-------------------|---------------|
| 新增页面 | ✓ 触发 | ✗ 不触发 |
| 详情页面 | ✗ 不触发 | ✓ 触发（根据pkId加载） |
| 下推/列表引入 | ✗ 不触发 | - |

## 常见事件详解

### preOpenForm - 界面打开前

**触发时机**：显示界面前，准备构建界面显示参数时

**应用场景**：取消页面的打开，修改被打开页面的参数（如调整单据类型、页面布局、主题标识）

**示例**：
```typescript
preOpenForm(e: $.kd.bos.form.events.PreOpenFormEventArgs): void {
  let fsp = e.getSource() as BillShowParameter;
  
  if (1 == 1) { // 自行设置条件
    // e.setCancel(true); // 取消打开
    e.setCancelMessage("取消原因");
  } else {
    fsp.setCaption("界面标题"); // 设置标题
    // fsp.setBillTypeId(schemaOBJ.getString("id")); // 设置单据类型
  }
}
```

**注意**：此事件无法获取视图模型 view 以及设置表单控件的可见性。

### afterCreateNewData - 数据包初始化

**触发时机**：界面初始化或刷新，新建数据包完毕后触发，仅新增时触发

**应用场景**：常用于实体字段赋值，设置初始值

**示例**：
```typescript
afterCreateNewData(e: EventObject): void {
  // 简单字段赋值
  this.getModel().setValue("kdtest_remark", "备注字段的默认值");
  
  // 基础资料字段赋值 - 方式1：赋值为查询的DynamicObject对象
  let obj = BusinessDataServiceHelper.loadSingle("bos_user", [new QFilter("number", "=", "ID-000002")]);
  this.getModel().setValue("kdtest_registrant", obj);
  
  // 基础资料字段赋值 - 方式2：赋值为当前登录用户ID
  let currentUserId = RequestContext.get().getCurrUserId();
  this.getModel().setValue("kdtest_registrant", currentUserId);
  
  // 单据体字段赋值 - 方式1：批量新增行
  this.getModel().deleteEntryData("kdtest_reqentryentity");
  let index: number[] = this.getModel().batchCreateNewEntryRow("kdtest_reqentryentity", 2);
  
  for (let i = 0; i < index.length; i++) {
    this.getModel().setValue("kdtest_qtyfield", 10 * (i + 1), index[i]);
    this.getModel().setValue("kdtest_materielfield", bd_materialobj, index[i]);
  }
  
  // 单据体字段赋值 - 方式2：通过数据实体新增
  let dataentity = this.getModel().getDataEntity(true); // true表示包含分录数据
  let entrys = dataentity.get("kdtest_reqentryentity") as DynamicObjectCollection;
  let entry = entrys.addNew(); // 新增空行
  entry.set("kdtest_qtyfield", 30);
  entry.set("kdtest_materielfield", bd_materialobj);
  
  super.afterCreateNewData(e);
}
```

**重要**：要对字段赋值，首先要找到对应的字段标识。在表单设计器中单击对应字段，在右侧业务属性中查看字段标识。

**关键字段设置**：当通过 `setValue` 给单据体字段赋值时，如果用户没有在界面编辑字段，保存时会清空数据。需要在单据体右侧的业务属性中设置**关键字段**（如物料字段），这样代码给关键字段赋值后，点击保存会保留当前分录行。

### afterLoadData - 编辑加载后

**触发时机**：编辑已有单据，数据加载完成后。仅编辑/查看模式触发，新增不触发。

**与 afterCreateNewData 互斥**：新增时触发 `afterCreateNewData`，编辑时触发 `afterLoadData`。

**应用场景**：根据已有数据控制界面状态、显示计算结果、初始化编辑模式特有逻辑

**示例**：
```typescript
afterLoadData(e: EventObject): void {
  // 根据单据状态控制界面
  let status = this.getModel().getValue("billstatus") as string;
  if (status === "C") {
    // 已审核：锁定关键字段
    this.getView().setEnable(false, "kdtest_remark");
    this.getView().setEnable(false, "kdtest_currencyfield");
  }

  // 显示计算结果
  let total = BigDecimal.ZERO;
  let rowCount = this.getModel().getEntryRowCount("kdtest_reqentryentity");
  for (let i = 0; i < rowCount; i++) {
    let amt = this.getModel().getValue("kdtest_amountfield", i) as BigDecimal;
    if (amt != null) {
      total = total.add(amt);
    }
  }
  this.getModel().setValue("kdtest_totalamount", total);

  super.afterLoadData(e);
}
```

**注意**：如果在 `afterLoadData` 中修改了字段值，这些修改会被标记为脏数据，关闭页面时系统会提示"是否保存"。如果只是显示用途，考虑使用控件直接设值而非模型字段。

### afterBindData - 控件更新

**触发时机**：界面数据包构建完毕，生成指令后，刷新前端字段值、控件状态之后

**应用场景**：常用于修改控件属性（可见性、锁定性、颜色等）

**示例**：
```typescript
afterBindData(e: EventObject): void {
  // 修改控件锁定性
  let currency = this.getModel().getValue("kdtest_currencyfield");
  if (currency == null) {
    this.getView().setEnable(false, 0, "kdtest_pricefield"); // 锁定第一行的单价字段
  } else {
    this.getView().setEnable(true, 0, "kdtest_pricefield");
  }
  
  // 修改控件可见性（单据体字段不能按行设置）
  let price = this.getModel().getValue("kdtest_pricefield", 0) as BigDecimal;
  if (price.compareTo(BigDecimal.ZERO) == 0) {
    this.getView().setVisible(false, "kdtest_amountfield");
  } else {
    this.getView().setVisible(true, "kdtest_amountfield");
  }
  
  super.afterBindData(e);
}
```

**注意**：
- 禁止在此事件中修改实体字段值（无字段名的可以修改）
- 富文本控件不是实体字段，需要每次打开页面时重新赋值

### itemClick - 工具栏点击

**触发时机**：用户点击按钮、菜单，执行绑定的操作逻辑前

**应用场景**：工具栏点击下载按钮时，执行附件下载等

**示例**：
```typescript
itemClick(e: ItemClickEvent): void {
  if (e.getItemKey() == "kdtest_download") {
    let cols = this.getModel().getEntryEntity("kdtest_reqentryentity") as DynamicObjectCollection;
    let count = this.getModel().getEntryRowCount("kdtest_reqentryentity");
    
    for (let index = 0; index < count; index++) {
      let row = cols.get(index) as DynamicObject;
      let atts = row.get("kdtest_purattachmentfield") as DynamicObjectCollection;
      
      for (let i = 0; i < atts.size(); i++) {
        let doj = atts.get(i) as DynamicObject;
        let basedataobj = doj.getDynamicObject("fbasedataid"); // 附件值存储在fbasedataid属性
        let url = basedataobj.getString("url");
        let downurl = "attachment/download.do?path=" + url;
        this.getView().download(downurl); // 调用前端下载接口
      }
    }
  }
}
```

**批量下载**：附件多时，使用批量下载逻辑：https://vip.kingdee.com/article/266996196957528832

### beforeItemClick - 工具栏点击前校验

**触发时机**：用户点击界面菜单按钮时，执行绑定的操作前，在itemClick前执行

**应用场景**：下载附件前校验附件是否为空

**示例**：
```typescript
registerListener(e: EventObject): void {
  let mainToolBar = this.getView().getControl("tbmain") as Toolbar;
  mainToolBar.addItemClickListener({
    beforeItemClick: evt => {
      if (evt.getItemKey() == "kdtest_download") {
        let indextip = new StringBuilder();
        let cols = this.getModel().getEntryEntity("kdtest_reqentryentity") as DynamicObjectCollection;
        let count = this.getModel().getEntryRowCount("kdtest_reqentryentity");
        
        for (let index = 0; index < count; index++) {
          let row = cols.get(index) as DynamicObject;
          let atts = row.get("kdtest_purattachmentfield") as DynamicObjectCollection;
          
          if (atts.size() == 0) {
            indextip.append(index + 1).append(",");
          }
        }
        
        let length = indextip.length();
        if (length != 0) {
          indextip.deleteCharAt(length - 1);
          this.getView().showTipNotification("第" + indextip + "行分录的附件为空");
          evt.setCancel(true); // 取消操作
        }
      }
    }
  });
}
```

### Click / BeforeClick - 按钮点击

**触发时机**：
- `beforeClick`: 点击触发click事件前的校验事件
- `click`: 点击后触发操作事件

**应用场景**：文本字段的按钮点击时，弹出关联单据详情页面

**开发步骤**：
1. 设置字段编辑风格为"按钮+文本编辑"
2. 注册监听器
3. 实现beforeClick和click方法

**示例**：
```typescript
beforeClick(evt: $.kd.bos.form.control.events.BeforeClickEvent): void {
  if (evt.getSource() instanceof TextEdit && evt.getSource().getKey() == "kdtest_ordernumber") {
    let ordernumber = this.getModel().getValue("kdtest_ordernumber");
    if (ordernumber == "") {
      this.getView().showTipNotification("订单编号不能为空");
      evt.setCancel(true);
    }
  }
}

click(evt: $.java.util.EventObject): void {
  if (evt.getSource() instanceof TextEdit) {
    let textedit = evt.getSource() as TextEdit;
    if (textedit.getKey() == "kdtest_ordernumber") {
      let ordernumber = this.getModel().getValue("kdtest_ordernumber");
      let obj = BusinessDataServiceHelper.loadSingle("kdtest_order", [new QFilter("billno", "=", ordernumber)]);
      
      if (obj != null) {
        let billShowParameter = new BillShowParameter();
        billShowParameter.getOpenStyle().setShowType(ShowType.Modal);
        billShowParameter.setFormId("kdtest_order");
        billShowParameter.setPkId(obj.get("id"));
        this.getView().showForm(billShowParameter);
      }
    }
  }
}

// 注册监听器
registerListener(e: EventObject): void {
  let button = this.getView().getControl("kdtest_ordernumber") as Button;
  button.addClickListener(this);
}
```

### beforeDoOperation / afterDoOperation - 操作前后

**触发时机**：
- `beforeDoOperation`: 执行绑定的操作前
- `afterDoOperation`: 执行完绑定的操作后（无论成功与否）

**注意**：后台调用的OperationServiceHelper服务触发的操作不会触发这些表单插件事件

**应用场景**：
- `beforeDoOperation`: 修改操作参数；操作前校验业务数据
- `afterDoOperation`: 提交后自动审核通过；自定义操作成功提示

**示例**：
```typescript
// 操作前：取消自带提示
beforeDoOperation(e: $.kd.bos.form.events.BeforeDoOperationEventArgs): void {
  if (e.getSource() instanceof Submit) {
    let submit = e.getSource() as Submit;
    if (submit.getOperateKey() == "submit") {
      submit.getOption().setVariableValue(OperateOptionConst.ISSHOWMESSAGE, "false");
    }
  }
}

// 操作后：自动审核
afterDoOperation(e: $.kd.bos.form.events.AfterDoOperationEventArgs): void {
  if (e.getSource() instanceof Submit) {
    let submit = e.getSource() as Submit;
    if (submit.getOperateKey() == "customsubmit") {
      let result = e.getOperationResult();
      if (result.isSuccess()) {
        let auditOp = OperateOption.create();
        auditOp.setVariableValue(OperateOptionConst.ISSHOWMESSAGE, "false");
        let auditResult = this.getView().invokeOperation("audit", auditOp);
        
        if (auditResult.isSuccess()) {
          this.getView().showSuccessNotification("提交并审核成功");
        } else {
          this.showerrMessage(auditResult, "自动审核失败");
        }
      } else {
        this.showerrMessage(result, "提交失败");
      }
    }
  }
}
```

### beforeF7Select - 基础资料选择前

**触发时机**：用户点击基础资料字段的按钮，打开基础资料选择列表界面前

**应用场景**：物料选择弹出的F7列表数据过滤

**示例1：简单过滤**
```typescript
class DemoBillPlugin extends AbstractBillPlugIn implements BeforeF7SelectListener {
  registerListener(e: EventObject): void {
    let basedataEdit = this.getView().getControl("kdtest_materielfield") as BasedataEdit;
    basedataEdit.addBeforeF7SelectListener(this);
  }

  beforeF7Select(evt: $.kd.bos.form.field.events.BeforeF7SelectEvent): void {
    if (evt.getProperty().getName() == "kdtest_materielfield") {
      let filter = new ArrayList();
      filter.add(new QFilter("number", "like", "001.%"));
      filter.add(new QFilter("number", QCP.not_equals, "001.00002"));
      evt.setCustomQFilters(filter);
    }
  }
}
```

**示例2：分组基础资料左树过滤 + 右侧列表过滤**

选择"产品属性"后，点击"产品类型"F7弹窗时，左树和列表只显示对应属性的数据。

```typescript
import { ListShowParameter } from "@cosmic/bos-core/kd/bos/list";

class ProductInfoPlugin extends AbstractBillPlugIn implements BeforeF7SelectListener {
  registerListener(e: EventObject): void {
    let productCategory = this.getView().getControl("kdec_product_category") as BasedataEdit;
    productCategory.addBeforeF7SelectListener(this);
  }

  beforeF7Select(evt: BeforeF7SelectEvent): void {
    if (evt.getProperty().getName() === "kdec_product_category") {
      let attributeObj = this.getModel().getValue("kdec_product_attribute") as DynamicObject;
      if (attributeObj != null) {
        let attributeId = attributeObj.getLong("id");
        let attributeNumber = attributeObj.getString("number");

        // 构造过滤条件
        let listFilter = new QFilter("group.id", QCP.equals, attributeId);
        let treeFilter = new QFilter("number", QCP.equals, attributeNumber);

        // 获取F7弹窗参数
        let showParameter = evt.getFormShowParameter() as ListShowParameter;

        // 设置右侧列表过滤
        showParameter.getListFilterParameter().getQFilters().add(listFilter);

        // 设置左树过滤
        showParameter.getTreeFilterParameter().getQFilters().add(treeFilter);
      }
    }
  }
}
```

**示例3：F7弹窗设置单选 + 按仓库过滤仓位**

```typescript
beforeF7Select(evt: BeforeF7SelectEvent): void {
  if (evt.getProperty().getName() === "kdec_warehouse_position") {
    let warehouseObj = this.getModel().getValue("kdec_in_warehouse") as DynamicObject;
    if (warehouseObj != null) {
      let qFilter = new QFilter("kdec_warehouse.id", QCP.equals, warehouseObj.getLong("id"));
      let showParameter = evt.getFormShowParameter() as ListShowParameter;
      showParameter.getListFilterParameter().setFilter(qFilter);
      showParameter.setMultiSelect(false); // 强制单选
    }
  }
}
```

### propertyChanged - 值更新

**触发时机**：
- 文本、整数等简单类型字段：开启"即时触发值更新"属性，且鼠标失去焦点时
- 基础资料或其他复杂类型字段：更改数据时立即触发

**应用场景**：监控某字段变更时，同步处理其他业务逻辑

**示例1：字段联动**
```typescript
propertyChanged(e: PropertyChangedArgs): void {
  let changeSet = e.getChangeSet();

  // 部门变更时，自动带出公司
  if (e.getProperty().getName() == "kdtest_dept") {
    let departmennt = changeSet[0].getNewValue() as DynamicObject;
    if (departmennt != null) {
      let companyfromOrg = OrgUnitServiceHelper.getCompanyfromOrg(departmennt.getPkValue());
      this.getModel().setValue("kdtest_company", companyfromOrg.get("id"));
    }
  }
  // 币种变更时，设置单价锁定性
  else if (e.getProperty().getName() == "kdtest_currencyfield") {
    let currency = changeSet[0].getNewValue();
    if (currency == null) {
      this.getView().setEnable(false, 0, "kdtest_pricefield");
    } else {
      this.getView().setEnable(true, 0, "kdtest_pricefield");
    }
  }

  super.propertyChanged(e);
}
```

**示例2：多字段拼接编码**

选择所属仓库和填写仓位序号后，自动拼接生成仓位编码。

```typescript
propertyChanged(e: PropertyChangedArgs): void {
  super.propertyChanged(e);

  let fieldName = e.getProperty().getName();
  if ("kdec_warehouse" === fieldName || "kdec_position_num" === fieldName) {
    let positionNum = this.getModel().getValue("kdec_position_num") as string;
    let warehouseObj = this.getModel().getValue("kdec_warehouse") as DynamicObject;

    if (warehouseObj != null && positionNum != null && positionNum !== "") {
      // 拼接编码：仓库编码 + "_" + 仓位序号
      let code = warehouseObj.getString("number") + "_" + positionNum;
      this.getModel().setValue("number", code);
    }
  }
}
```

**示例3：选择产品后自动查询供应商价格**

```typescript
propertyChanged(e: PropertyChangedArgs): void {
  super.propertyChanged(e);

  if ("kdec_product" === e.getProperty().getName()) {
    let rowIndex = e.getChangeSet()[0].getRowIndex();
    let productObj = e.getChangeSet()[0].getNewValue() as DynamicObject;

    if (productObj != null) {
      let productId = productObj.getLong("id");
      let supplierObj = this.getModel().getValue("kdec_supplier") as DynamicObject;

      if (supplierObj != null) {
        // 查询供应商价格表
        let priceObj = QueryServiceHelper.queryOne(
          "kdec_supplier_price",
          "kdec_sup_price",
          [
            new QFilter("kdec_product.id", QCP.equals, productId),
            new QFilter("kdec_supplier.id", QCP.equals, supplierObj.getLong("id"))
          ]
        );

        if (priceObj != null) {
          this.getModel().setValue("kdec_purchase_price", priceObj.get("kdec_sup_price"), rowIndex);
        }
      }
    }
  }
}
```

## 父子页面弹窗及交互

**应用场景**：采购申请单采购分录信息很多时，用户需要批量录入数据

**示例**：
```typescript
itemClick(evt: $.kd.bos.form.control.events.ItemClickEvent): void {
  if (evt.getItemKey() == "kdtest_batchEdit") {
    let fsp = new FormShowParameter(); // 打开界面的参数对象
    fsp.getOpenStyle().setShowType(ShowType.Modal); // 弹出窗口
    fsp.setFormId("kdtest_batchedit"); // 要打开的界面的formid
    
    let billno = this.getModel().getValue("billno"); // 获取当前单据编号
    fsp.setCustomParam("param_billno", billno); // 传递自定义参数
    
    // 设置界面关闭时的回调函数
    fsp.setCloseCallBack(new CloseCallBack(plugin, "batchedit"));
    this.getView().showForm(fsp); // 调用前端接口打开界面
  }
}
```

### CloseCallBack - 子页面关闭回调

父页面通过 `setCloseCallBack` 设置回调，子页面关闭时父页面的 `closedCallBack` 方法被触发，接收子页面返回的数据。

**父页面设置回调**（与上方弹窗示例配合）：
```typescript
// 在打开弹窗前设置（已在上方示例中设置）
fsp.setCloseCallBack(new CloseCallBack(plugin, "batchedit"));
```

**父页面接收回调**：
```typescript
closedCallBack(e: $.kd.bos.form.events.ClosedCallBackEvent): void {
  let actionId = e.getActionId();

  if (actionId === "batchedit") {
    let returnData = e.getReturnData();
    if (returnData != null) {
      // 从子页面传回的数据中取值
      let entryData = returnData.get("entryData") as string;
      if (entryData) {
        let items = JSON.parse(entryData);
        // 清空并重建单据体
        this.getModel().deleteEntryData("kdtest_reqentryentity");
        for (let i = 0; i < items.length; i++) {
          this.getModel().createNewEntryRow("kdtest_reqentryentity");
          this.getModel().setValue("kdtest_qtyfield", items[i].qty, i);
          this.getModel().setValue("kdtest_materielfield", items[i].materialId, i);
        }
      }
    }
    // 刷新界面
    this.getView().updateView("kdtest_reqentryentity");
  }
}
```

**子页面返回数据**：
```typescript
import { HashMap } from "@cosmic/bos-script/java/util";

// 子页面点击确定按钮时，将数据返回给父页面
click(evt: any): void {
  let control = evt.getSource();
  if ("btnok" === control.getKey()) {
    // 构造返回数据
    let returnData = new HashMap();
    let entryList = [];
    let rowCount = this.getModel().getEntryRowCount("entryentity");
    for (let i = 0; i < rowCount; i++) {
      entryList.push({
        qty: this.getModel().getValue("qtyfield", i),
        materialId: this.getModel().getValue("materialfield", i)
      });
    }
    returnData.put("entryData", JSON.stringify(entryList));

    // 返回数据并关闭
    this.getView().returnDataToParent(returnData);
    this.getView().close();
  }
}
```

## 富文本控件操作

富文本控件是通用控件（非实体字段），不能通过 `this.getModel()` 取值赋值，需要通过控件模型操作。

```typescript
// 获取富文本内容
let richEdit = this.getView().getControl("richtexteditorap") as RichTextEditor;
let text = richEdit.getText();

// 设置富文本内容
richEdit.setText("要设置的内容");
```

**持久化模式**：富文本内容需要保存到大文本字段，打开时再加载到控件。

```typescript
// 保存时：将富文本内容存到大文本字段
beforeDoOperation(e: $.kd.bos.form.events.BeforeDoOperationEventArgs): void {
  let formOperate = e.getSource() as FormOperate;
  if (formOperate.getOperateKey() === "save") {
    let richEdit = this.getView().getControl("richtexteditorap") as RichTextEditor;
    let text = richEdit.getText();
    this.getModel().setValue("kdtest_longtextfield", text);
  }
}

// 打开时：从大文本字段加载到富文本控件
afterBindData(e: EventObject): void {
  super.afterBindData(e);
  let richEdit = this.getView().getControl("richtexteditorap") as RichTextEditor;
  let content = this.getModel().getValue("kdtest_longtextfield") as string;
  if (content) {
    richEdit.setText(content);
  }
}
```

## 多选基础资料操作

多选基础资料通过 model 获取的是数据集合，需遍历取出实际选择的基础资料对象。

```typescript
// 读取多选基础资料
let multiCols = this.getModel().getValue("kdtest_mulbasedatafield") as DynamicObjectCollection;
for (let i = 0; i < multiCols.size(); i++) {
  let col = multiCols.get(i) as DynamicObject;
  let baseData = col.getDynamicObject("fbasedataid"); // 值存储在fbasedataid属性
  let name = baseData.getString("name");
}

// 赋值参考：https://vip.kingdee.com/article/198799132897594368?productLineId=29
```

## 子单据体操作

子单据体挂在单据体行上，需要先获取单据体行，再从行获取子单据体集合。

```typescript
// 获取子单据体字段值（指定行号）
// 第一个整数是子单据体行号，第二个是父单据体行号
let value = this.getModel().getValue("kdtest_textfield2", 0, 0);

// 遍历子单据体
let dataEntity = this.getModel().getDataEntity(true);
let entryRows = dataEntity.getDynamicObjectCollection("entryentity");
for (let i = 0; i < entryRows.size(); i++) {
  let entryObj = entryRows.get(i) as DynamicObject;
  let subCols = entryObj.getDynamicObjectCollection("kdtest_subentryentity");
  for (let j = 0; j < subCols.size(); j++) {
    let subCol = subCols.get(j) as DynamicObject;
    let fieldValue = subCol.get("kdtest_textfield2");
  }
}

// 给子单据体新建行
// 先设置父单据体选中行
this.getModel().setEntryCurrentRowIndex("entryentity", 0);
// 创建子单据体行
let newRows = this.getModel().batchCreateNewEntryRow("kdtest_subentryentity", 1);
for (let index of newRows) {
  this.getModel().setValue("kdtest_textfield2", "文本值", index);
}
```

## 页面状态判断

判断当前页面是新增还是编辑状态：

```typescript
import { BillShowParameter } from "@cosmic/bos-core/kd/bos/bill";
import { OperationStatus } from "@cosmic/bos-core/kd/bos/form";

afterBindData(e: EventObject): void {
  super.afterBindData(e);
  let bsp = this.getView().getFormShowParameter() as BillShowParameter;
  if (bsp.getStatus() == OperationStatus.ADDNEW) {
    this.getView().showTipNotification("您正在新增单据");
  } else if (bsp.getStatus() == OperationStatus.EDIT) {
    this.getView().showTipNotification("您正在编辑单据");
  }
}
```

## 控件锁定性进阶场景

```typescript
// 锁定单据头字段
this.getView().setEnable(false, "字段标识");

// 锁定单据体某几行（所有字段都锁定）
let entryGrid = this.getView().getControl("entryentity") as EntryGrid;
entryGrid.setRowLock(true, [0, 1]); // 锁定第0行和第1行

// 锁定单据体某行某列
this.getView().setEnable(false, 2, "kdtest_dealdesc"); // 第2行的dealdesc字段

// 锁定整列（遍历所有行）
let rowCount = this.getModel().getEntryRowCount("entryentity");
for (let i = 0; i < rowCount; i++) {
  this.getView().setEnable(false, i, "kdtest_dealdesc");
}

// 锁定整个单据体
this.getView().setEnable(false, "entryentity");
```

## 设置单据体选中行

```typescript
// 设置默认选中第一行
let entryRowCount = this.getModel().getEntryRowCount("entryentity");
if (entryRowCount > 0) {
  let eg = this.getView().getControl("entryentity") as EntryGrid;
  eg.selectRows(0);
}

// 通过model设置当前行
this.getModel().setEntryCurrentRowIndex("entryentity", rowIndex);

// 获取当前选中行
let currentRow = this.getModel().getEntryCurrentRowIndex("entryentity");

// 获取所有选中行
let entryGrid = this.getView().getControl("entryentity") as EntryGrid;
let selectRows = entryGrid.getSelectRows(); // 返回 int[]
```

## 代码触发控件操作

```typescript
// 触发工具栏按钮点击
let toolbar = this.getView().getControl("tbmain") as Toolbar;
toolbar.itemClick("bar_save", "save"); // 工具栏项标识, 操作标识

// 触发按钮点击
let button = this.getView().getControl("kdtest_btsave") as Button;
button.click();

// 触发操作
this.getView().invokeOperation("save");
```

## 赋值不触发值更新事件

在某些场景下，代码赋值后不希望触发 `propertyChanged` 事件：

```typescript
// 方式1：在 afterCreateNewData 中赋值，天然不触发值更新事件

// 方式2：在其他事件中使用 beginInit/endInit 包裹
this.getModel().beginInit();
this.getModel().setValue("字段标识", "字段值");
this.getModel().endInit();
```

## 确认框回调模式

拦截操作前弹出确认提示，用户确认后再继续执行。

```typescript
import { ConfirmCallBackListener, MessageBoxOptions, MessageBoxResult } from "@cosmic/bos-core/kd/bos/form";

// 在 beforeItemClick 中弹出确认框
beforeItemClick(evt: BeforeItemClickEvent): void {
  if (evt.getItemKey() === "bar_submit") {
    evt.setCancel(true); // 先取消操作
    let confirmListener = new ConfirmCallBackListener("submitconfirm", this);
    this.getView().showConfirm(
      "您确认提交该单据吗？",
      MessageBoxOptions.YesNoCancel,
      confirmListener
    );
  }
  super.beforeItemClick(evt);
}

// 确认框回调
confirmCallBack(e: $.kd.bos.form.events.MessageBoxClosedEvent): void {
  super.confirmCallBack(e);
  if ("submitconfirm" === e.getCallBackId()) {
    if (MessageBoxResult.Yes === e.getResult()) {
      this.getView().invokeOperation("submit"); // 确认则执行提交
    } else if (MessageBoxResult.No === e.getResult()) {
      // 否 的处理逻辑
    }
  }
}
```

## 单据体单元格点击

监听单据体中单元格的点击事件（需注册监听器）。

```typescript
// 注册监听器
registerListener(e: EventObject): void {
  super.registerListener(e);
  let eg = this.getView().getControl("entryentity") as EntryGrid;
  eg.addCellClickListener(this);
}

// 实现 cellClick
cellClick(arg: $.kd.bos.form.control.events.CellClickEvent): void {
  let fieldKey = arg.getFieldKey();
  if (fieldKey === "kdtest_urlfield") {
    let url = this.getModel().getValue(fieldKey, arg.getRow()) as string;
    this.getView().openUrl(url);
    // 或 this.getView().download(url);
  }
}
```

## 单据体行点击

```typescript
registerListener(e: EventObject): void {
  super.registerListener(e);
  let eg = this.getView().getControl("entryentity") as EntryGrid;
  eg.addRowClickListener(this);
}

// 实现 RowClickEventListener 的 entryRowClick 方法
entryRowClick(e: any): void {
  let rowIndex = e.getRow();
  let material = this.getModel().getValue("kdtest_material", rowIndex);
  if (material == null) {
    this.getView().showTipNotification("请先选择物品");
  }
}
```

## 修改控件名称

```typescript
// 修改字段控件名称
let textField = this.getView().getControl("kdtest_textfield1") as TextEdit;
textField.setCaption(new LocaleString("新标题"));

// 同步修改元数据属性标题（避免退出时提示旧名称）
let allFields = this.getModel().getDataEntityType().getAllFields();
let field = allFields.get("kdtest_textfield1");
field.getDisplayName().setLocaleValue("新标题");

// 修改非字段控件名称（按钮、面板等）
let metaMap = new HashMap();
let textMap = new HashMap();
textMap.put("zh_CN", "新名称");
metaMap.put("text", textMap);
this.getView().updateControlMetadata("控件标识", metaMap);
```

## 获取元数据信息

```typescript
// 根据表单编码获取表单元数据
let formId = MetadataDao.getIdByNumber("kdtest_form", MetaCategory.Form);
let formMeta = MetadataDao.readRuntimeMeta(formId, MetaCategory.Form) as FormMetadata;

// 遍历所有控件
let items = formMeta.getItems();
for (let item of items) {
  let visible = item.getVisible();
  let name = item.getName().getLocaleValue();
  let key = item.getKey();
}
```

## beforeClosed - 关闭前控制

```typescript
// 取消关闭时"是否保存"的校验
beforeClosed(e: $.kd.bos.form.events.BeforeClosedEvent): void {
  super.beforeClosed(e);
  e.setCheckDataChange(false); // 不检查数据变更
}
```

## beforeF7Select 进阶

### 显示未审核数据
```typescript
beforeF7Select(evt: BeforeF7SelectEvent): void {
  if ("kdtest_basedatafield" === evt.getProperty().getName()) {
    let showParam = evt.getFormShowParameter() as ListShowParameter;
    showParam.setShowApproved(false); // 显示未审核的数据
  }
}
```

### 开启多选 + 显示已选
```typescript
beforeF7Select(evt: BeforeF7SelectEvent): void {
  if ("kdtest_basedatafield" === evt.getProperty().getName()) {
    let showParam = evt.getFormShowParameter() as ListShowParameter;

    let baseData = this.getModel().getValue("kdtest_basedatafield") as DynamicObject;
    if (baseData != null) {
      // 设置已选数据
      showParam.setSelectedRow(baseData.getPkValue());
      showParam.setSelectedRows([baseData.getPkValue()]);
      showParam.setMultiSelect(true); // 开启多选
    }
  }
}
```

## 关键API汇总

### 获取模型数据
```typescript
// 获取字段值
this.getModel().getValue(fieldKey: string, rowIndex?: number): any

// 设置字段值
this.getModel().setValue(fieldKey: string, value: any, rowIndex?: number): void

// 获取单据体行数
this.getModel().getEntryRowCount(entryKey: string): number

// 获取数据实体（包含分录数据）
this.getModel().getDataEntity(includeEntry: boolean = false): DynamicObject
```

### 操作视图
```typescript
// 获取控件
this.getView().getControl(key: string): Control

// 设置控件可见性
this.getView().setVisible(visible: boolean, fieldKey: string): void

// 设置控件锁定性
this.getView().setEnable(enabled: boolean, rowIndex: number, fieldKey: string): void

// 执行操作
this.getView().invokeOperation(operationKey: string, option?: OperateOption): OperationResult

// 刷新页面
this.getView().invokeOperation("refresh")

// 显示提示
this.getView().showMessage(message: string)
this.getView().showSuccessNotification(message: string, duration?: number)
this.getView().showTipNotification(message: string)
this.getView().showErrMessage(errorMessage: string, customMessage?: string)

// 下载文件
this.getView().download(url: string)

// 打开表单
this.getView().showForm(parameter: ShowParameter)
```

### 请求上下文
```typescript
// 获取当前用户ID
RequestContext.get().getCurrUserId(): number

// 获取客户端完整路径
RequestContext.get().getClientFullContextPath(): string
```

### 刷新视图
```typescript
// 刷新单个字段
this.getView().updateView("字段标识");

// 刷新单据体字段（指定行）
this.getView().updateView("单据体字段标识", rowIndex);

// 刷新整个单据体
this.getView().updateView("entryentity");

// 全局刷新（慎用，有性能消耗）
this.getView().updateView();

// 从数据库刷新整个页面数据
this.getView().invokeOperation("refresh");
```

### 页面关闭
```typescript
// 关闭当前页面
this.getView().close();
// 或者
this.getView().invokeOperation("close");
```

### 页面缓存
```typescript
// 存入缓存
this.getView().getPageCache().put("myKey", "myValue");

// 读取缓存
let value = this.getView().getPageCache().get("myKey") as string;
```

### ORM查询
参考 [数据服务接口](data-service.md) 文档
