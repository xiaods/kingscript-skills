# 表单插件开发参考

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

**示例**：
```typescript
// 实现BeforeF7SelectListener接口
class DemoBillPlugin extends AbstractBillPlugIn implements BeforeF7SelectListener {
  registerListener(e: EventObject): void {
    let basedataEdit = this.getView().getControl("kdtest_materielfield") as BasedataEdit;
    basedataEdit.addBeforeF7SelectListener(this);
  }
  
  beforeF7Select(evt: $.kd.bos.form.field.events.BeforeF7SelectEvent): void {
    if (evt.getProperty().getName() == "kdtest_materielfield") {
      let filter = new ArrayList();
      filter.add(new QFilter("number", "like", "001.%")); // 编码以001.开头
      filter.add(new QFilter("number", QCP.not_equals, "001.00002")); // 且不等于001.00002
      evt.setCustomQFilters(filter);
    }
  }
}
```

### propertyChanged - 值更新

**触发时机**：
- 文本、整数等简单类型字段：开启"即时触发值更新"属性，且鼠标失去焦点时
- 基础资料或其他复杂类型字段：更改数据时立即触发

**应用场景**：监控某字段变更时，同步处理其他业务逻辑

**示例**：
```typescript
propertyChanged(e: PropertyChangedArgs): void {
  let changeSet = e.getChangeSet(); // 获取变更集合
  
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
  // 单价变更时，设置金额可见性
  else if (e.getProperty().getName() == "kdtest_pricefield") {
    let price = changeSet[0].getNewValue() as BigDecimal;
    if (price.compareTo(BigDecimal.ZERO) == 0) {
      this.getView().setVisible(false, "kdtest_amountfield");
    } else {
      this.getView().setVisible(true, "kdtest_amountfield");
    }
  }
  
  super.propertyChanged(e);
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

### ORM查询
参考 [数据服务接口](data-service.md) 文档
