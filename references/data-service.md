# 苍穹数据服务接口参考

## ORM 原理

### 什么是 ORM
ORM 即对象关系映射（Object Relation Mapping），把实体模型映射到数据库中，提供对象的操作，在数据库中体现为 CRUD（创建、读取、更新、删除）操作。

### 苍穹ORM框架的作用

1. **多数据库访问**：支持访问应用主库、基础资料库、工作流库、日志库、权限库等，跨库访问处理无需关注实体对象对应的数据库
2. **多表联查**：自动处理分录、子分录、多语言表、多选基础资料等关联操作
3. **基于元数据编程**：基于表单实体元数据，自动生成SQL语句，减少手动编写SQL的工作量，同时可以触发保存操作校验规则、工作流等
4. **集成计算框架**：集成计算框架接口（algo），可便捷地使用复杂的计算、大数据量的访问

### ORM 特点

#### OQL语法
ORM自定义了OQL（对象查询语言）语法和OQL解析器，类似于SQL但更加面向对象。

**OQL示例**：
```sql
select id, billno from gl_voucher
where org.number=? and bizdate>?
order by bizdate
```

**产生的分库SQL**：
```sql
/*ORM*/ SELECT B.FId "org.id"
FROM t_ORG_ORG B
WHERE B.FNumber = ?

/*ORM*/ SELECT A.FId "id", A.fnumber "billno", A.forgid "INNER_org"
FROM T_GL_VOUCHER A
WHERE A.Fbizdate > ?
ORDER BY A.Fbizdate
```

#### 查询优化器
优化SQL语句，提高查询性能，可以对跨库查询条件进行推送，减少不必要的数据库访问。

## ORM 接口详解

### 接口对比

| 接口 | 作用/区别1 | 作用/区别2 |
|------|-----------|-----------|
| BusinessDataServiceHelper | 查缓存数据/查出结构化的数据 | 创建新数据 |
| QueryServiceHelper | 单一功能：查出平铺对象 | - |
| SaveServiceHelper | save：只保存数据 | saveOperate：触发操作插件、校验规则、编码规则等 |
| DeleteServiceHelper | 直接删除、删除前校验 | - |
| OperationServiceHelper | executeOperate()用于调用各个实体操作 | - |

**重要说明**：
- SaveServiceHelper.save：会保存所有的变量、增量和删量，比如新增分录行
- SaveServiceHelper.update：只会保存变量
- save和update方法都是直接更新入库，不走操作校验

### BusinessDataServiceHelper 业务对象服务接口

#### 创建对象
```typescript
/**
 * 通过实体标识创建一个动态实体数据包
 * @param entityName 实体标识
 * @return 返回动态实体数据包
 */
newDynamicObject(entityName: string): $.kd.bos.dataentity.entity.DynamicObject;
```

**示例**：
```typescript
let doj = BusinessDataServiceHelper.newDynamicObject("kdtest_reqbill") as DynamicObject;
```

**注意**：BusinessDataServiceHelper.newDynamicObject创建的数据包是空的，即使元数据设置了默认值，也需要代码自行设置值。

#### 从数据库加载单个对象

```typescript
/**
 * 读取单张实体数据
 * 返回的数据包是树形结构：单据头包含单据体分录集合
 * 返回的数据包修改后可调用保存服务
 */
loadSingle(pk: any, entityName: string): $.kd.bos.dataentity.entity.DynamicObject;

// 按条件查询第一条
loadSingle(entityName: string, filters: QFilter[]): $.kd.bos.dataentity.entity.DynamicObject;

// 指定读取字段
loadSingle(pk: any, entityName: string, selectProperties: string): $.kd.bos.dataentity.entity.DynamicObject;
```

**字段格式**：
- 单据头字段：直接传入字段标识
- 单据体字段：格式为 `单据体标识.字段标识`，如：`entryentity.qty`

**示例**：
```typescript
let obj = BusinessDataServiceHelper.loadSingle("kdtest_reqbill", [new QFilter("billno", "=", billNo)]);

// 指定字段
let loadResult = BusinessDataServiceHelper.loadSingle(pk, "kdtest_reqbill", "id,billno,kdtest_reqentryentity.qty");
```

#### 从数据库加载多个对象

```typescript
/**
 * 按条件读取实体数据，指定读取字段、排序字段
 * 返回的数据包是树形结构
 * 返回的数据包修改后可调用保存服务
 */
load(entityName: string, selectProperties: string, filters: QFilter[], orderBy: string): DynamicObject[];
```

**示例**：
```typescript
let billQfilter = new QFilter("billno", "like", "REQ%");
let load: DynamicObject[] = BusinessDataServiceHelper.load(
  "kdtest_reqbill",
  "id,billno",
  [billQfilter],
  "billno DESC",
  100
);

for (let obj of load) {
  let billno = obj.getString("billno");
  // 其他业务逻辑
}
```

#### 从缓存加载

```typescript
// 从缓存加载单个对象
loadSingleFromCache(pk: any, type: DynamicObjectType): DynamicObject;

// 从缓存加载多个对象
loadFromCache(entityName: string, selectProperties: string, filters: QFilter[], orderBy: string): Map;
```

**注意**：
- 缓存的实体数据缺少数据状态（快照、脏标记），不能修改后保存
- 适用于少量取用基础资料数据
- 大批量查询推荐使用 QueryServiceHelper

### QueryServiceHelper - 数据查询

只用于查询数据，查询出来的数据是平铺对象（单层结构），不能用于保存。

**平铺对象**：将多层嵌套的数据结构转化为单一层次结构的处理过程。

#### 查询单条数据

```typescript
/**
 * 查询一条数据（第一条）
 * 返回的是单据头、单据体拉平后的数据行
 * 返回的数据包不能用于修改、保存
 */
queryOne(entityName: string, selectFields: string, filters: QFilter[]): DynamicObject;
```

#### 查询多条数据

```typescript
/**
 * 查询单据（排序），返回拉平的数据包
 * 返回的是单据头、单据体拉平后的数据行
 * 返回的数据包不能用于修改、保存
 */
query(entityName: string, selectFields: string, filters: QFilter[], orderBys: string): DynamicObjectCollection;
```

**BusinessDataServiceHelper vs QueryServiceHelper 对比**

| 对比维度 | BusinessDataServiceHelper | QueryServiceHelper |
|---------|--------------------------|-------------------|
| 查询结果 | 结构化数据，可保存回数据库 | 平铺数据，不能保存 |
| 结果取值 | 需先获取单据体对象，再获取行和字段 | 可直接获取单据头、单据体字段 |
| 性能 | 相对较低 | 更高（流式取数） |
| 适用场景 | 需要修改并保存的数据 | 仅查询、展示的数据 |

**示例对比**：
```typescript
// BusinessDataServiceHelper - 结构化数据
let loadResult = BusinessDataServiceHelper.loadSingle("kdtest_reqbill", [new QFilter("billno", "=", billNo)]);
let cols = loadResult.get("kdtest_reqentryentity") as DynamicObjectCollection;
let entry = cols.get(0) as DynamicObject;
let qty = entry.get("kdtest_qtyfield");

// QueryServiceHelper - 平铺对象
let queryResult = QueryServiceHelper.queryOne("kdtest_reqbill", selectFields, [new QFilter("billno", "=", billNo)]);
let queryqty = queryResult.get("kdtest_reqentryentity.kdtest_qtyfield");
```

### QFilter 过滤条件

QFilter作为ORM的过滤条件参数，最终被翻译为SQL的where部分。

```typescript
// 基本用法
let billQfilter = new QFilter("billno", "like", "REQ%");

// 多个条件组合
let filter1 = new QFilter("number", "like", "001.%");
let filter2 = new QFilter("qty", ">", 100);
let combinedFilter = filter1.and(filter2);

// 常用运算符
// QCP.equals: 等于
// QCP.not_equals: 不等于
// QCP.like: 模糊匹配
// QCP.in: 在集合中
// QCP.gt: 大于
// QCP.lt: 小于
// QCP.ge: 大于等于
// QCP.le: 小于等于
```

### SaveServiceHelper 保存服务

#### 调用保存操作 saveOperate

```typescript
/**
 * 调用单据保存操作
 * 先执行单据保存操作校验及操作插件，通过后才保存入库
 * 自动分析出实体数据中增加、删除、修改的分录行
 */
saveOperate(entityNumber: string, dataEntities: DynamicObject[], option: OperateOption): OperationResult;
```

**示例**：
```typescript
let result = SaveServiceHelper.saveOperate("kdtest_reqbill", [doj], OperateOption.create());

if (result.isSuccess()) {
  this.getView().showSuccessNotification("保存成功");
  this.getView().invokeOperation("refresh");
}
```

#### 直接保存 save/update

```typescript
// 直接保存入库，不走操作校验
save(dataEntities: DynamicObject[], option: OperateOption): any[];

// 直接更新入库，不走操作校验
update(dataEntities: DynamicObject[], option: OperateOption): void;
```

**注意**：不要随意使用直接保存或删除，避免业务校验无法触发。

### DeleteServiceHelper 删除服务

```typescript
deleteOperate(entityName: string, ids: any[], option: OperateOption): OperationResult;
```

示例：
```typescript
let deleteServiceHelper = new DeleteServiceHelper();
let result = deleteServiceHelper.deleteOperate(entityName, ids, OperateOption.create());

if (result.isSuccess()) {
  this.getView().showSuccessNotification("删除成功");
  this.getView().invokeOperation("refresh");
}
```

### OperationServiceHelper 操作服务

```typescript
/**
 * 调用操作服务
 * @param operationKey 操作key（操作代码），如save、submit、audit
 * @param entityNumber 实体ID
 * @param dataEntities 需要操作的数据
 * @param option 自定义参数
 */
executeOperate(operationKey: string, entityNumber: string, dataEntities: DynamicObject[], option: OperateOption): OperationResult;
```

**说明**：支持调用所有的实体操作，SaveServiceHelper服务底层也是调用了OperationServiceHelper服务。

## 实操示例

### 新增数据

需求：后台新增并保存一条采购申请单数据

```typescript
import { AbstractListPlugin } from "@cosmic/bos-core/kd/bos/list/plugin";
import { BusinessDataServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper";
import { DynamicObject, DynamicObjectCollection } from "@cosmic/bos-core/kd/bos/dataentity/entity";
import { SaveServiceHelper } from "@cosmic/bos-core/kd/bos/servicehelper/operation";
import { RequestContext } from "@cosmic/bos-core/kd/bos/context";

class ReqListPlugin extends AbstractListPlugin {
  itemClick(e: ItemClickEvent): void {
    if (e.getItemKey() == "kdtest_addnew") {
      // 创建空的数据包
      let doj = BusinessDataServiceHelper.newDynamicObject("kdtest_reqbill") as DynamicObject;
      
      // 字段赋值
      doj.set("billstatus", "A");
      doj.set("kdtest_remark", "addnewdemo备注");
      let userId = RequestContext.get().getCurrUserId();
      doj.set("creator", userId);
      doj.set("kdtest_registrant", userId);
      
      // 新增分录数据
      let entrys = doj.getDynamicObjectCollection("kdtest_reqentryentity") as DynamicObjectCollection;
      let entry = entrys.addNew() as DynamicObject;
      entry.set("kdtest_qtyfield", 10);
      
      // 保存
      const result = SaveServiceHelper.saveOperate("kdtest_reqbill", [doj], OperateOption.create());
      if (result.isSuccess()) {
        this.getView().showSuccessNotification("新增成功");
        this.getView().invokeOperation("refresh");
      }
    }
  }
}
```

### 查询数据（仅查询）

需求：查询选中行的单据数据，展示分录行数

```typescript
itemClick(e: ItemClickEvent): void {
  if (e.getItemKey() == "kdtest_query") {
    let billlist = this.getView().getControl("billlistap") as BillList;
    let selectedRows = billlist.getSelectedRows();
    
    if (selectedRows == null || selectedRows.size() == 0) {
      this.getView().showMessage("请先选择一行数据");
      return;
    }
    
    let billNo = selectedRows.get(0).getBillNo();
    let billnoQfilter = new QFilter("billno", QCP.equals, billNo);
    
    // 查询字段必须包含分录字段，格式：分录实体标识.分录字段标识
    let selectfieids = "id,billno,kdtest_reqentryentity.kdtest_qtyfield";
    let reqObj = QueryServiceHelper.query("kdtest_reqbill", selectfieids, [billnoQfilter]);
    
    // reqObj.size()是分录的行数（平铺对象）
    this.getView().showMessage(billNo + "的数据查出来的数据行：" + reqObj.size());
  }
}
```

### 查询并修改

需求：查询并修改选中行数据，将申请数量设置为两倍

```typescript
itemClick(e: ItemClickEvent): void {
  if (e.getItemKey() == "kdtest_edit") {
    let billlist = this.getView().getControl("billlistap") as BillList;
    let selectedRows = billlist.getSelectedRows();
    let pkIds = selectedRows.getPrimaryKeyValues();
    
    let billnoQfilter = new QFilter("id", QCP.in, pkIds);
    let selectfieids = "id,billno,kdtest_reqentryentity.kdtest_qtyfield,kdtest_reqentryentity.kdtest_materielfield";
    
    // 使用BusinessDataServiceHelper.load查询，返回结构化的数据包，可保存
    let laodobjs = BusinessDataServiceHelper.load("kdtest_reqbill", selectfieids, [billnoQfilter], "billno asc", 10);
    
    if (laodobjs != null) {
      for (let i = 0; i < laodobjs.length; i++) {
        let obj = laodobjs[i];
        let entrys = obj.getDynamicObjectCollection("kdtest_reqentryentity") as DynamicObjectCollection;
        
        if (entrys != null && entrys.size() > 0) {
          for (let j = 0; j < entrys.size(); j++) {
            let entry = entrys.get(j);
            let qty = entry.get("kdtest_qtyfield");
            entry.set("kdtest_qtyfield", qty * 2); // 数量乘以2
          }
        }
      }
      
      let reslut = SaveServiceHelper.saveOperate("kdtest_reqbill", laodobjs, OperateOption.create());
      if (reslut.isSuccess()) {
        this.getView().showSuccessNotification("编辑保存成功");
        this.getView().invokeOperation("refresh");
      }
    }
  }
}
```

## 常见问题

### 提示字段不存在
参考：https://vip.kingdee.com/article/227004142009745408

检查点：
1. 是否在onPreparePropertys中添加了字段
2. 查询时selectFields是否包含该字段
3. 字段标识是否正确（区分大小写）

### 性能问题
- 大量数据查询或复杂查询时，使用QueryServiceHelper性能更好
- 合理设置取数条件，避免OOM异常
- 控制一次传入的数据量，分批调用保存服务

### 慎用直接保存或直接删除
- 不要随意用SaveServiceHelper.save或DeleteServiceHelper.delete，避免业务校验无法触发
- 使用saveOperate触发完整的操作校验和插件

### 慎用缓存查询
- 要落库的数据，不能用loadFromCache查询
- 缓存数据不能修改后保存
- 大批量查询推荐使用QueryServiceHelper
