# Kingscript 语法参考

## 概述
KingScript脚本语言是苍穹平台的服务端脚本语言，运行在JVM中，基本与TypeScript语言相同。支持在线调试、独立调试、即时生效，提供AI能力以及代码片段辅助编程。

## 模块系统

### 导出 export
先在类中定义，然后导出：
```typescript
let reqValidator = ReqValidator;
export { reqValidator }
```

### 导入 import
苍穹平台使用KingScript对Java SDK API进行了封装，封装后的SDK称为Script SDK API。

主要脚本模块：
- `@cosmic/bos-script`: 脚本引擎模块，定义了基本类型和全局变量
- `@cosmic/bos-util`: 公共工具模块，提供json、http等
- `@cosmic/bos-core`: 苍穹平台核心功能模块，包含id、db、orm、mq、algo、log等
- `@cosmic/bos-framework`: 应用框架模块，包括插件、控件、事件等

示例：
```typescript
import { FormShowParameter } from "@cosmic/bos-core/kd/bos/form";
import { reqValidator } from "./ReqValidator"; // 相同路径下直接./xx
```

**注意**: 模块名含 `-internal-` 字样的仅平台使用，二次开发勿用，如 `@cosmic/bos-internal-jdk`、`@cosmic/bos-internal-sdk`。

## 变量声明

### let 与 const
- `let`: 声明的变量值可被修改
- `const`: 声明的变量值不可修改

### 类型注解
```typescript
let variableName: type = value;
let age: number = 30; // 变量类型注解
greet(name: string): string { return "Hello, " + name; } // 参数和返回值类型注解
```

### 类型断言（强转）
```typescript
let a = xx as 类型; // 类型断言（强转）

// 示例
let someValue: any = "123";
let strLength: number = (someValue as string).length; // 断言someValue为字符串

// 父类转子类必须使用as进行强转
let billlistap: BillList = this.getView().getControl("billlistap") as BillList;
```

## 基础类型

```typescript
// 字符串
let name: string = "John";

// 数字（所有数字都是浮点数）
let decLiteral: number = 6;
let hexLiteral: number = 0xf00d;
let binaryLiteral: number = 0b1010;
let octalLiteral: number = 0o744;

// 布尔值
let isStudent: boolean = true;

// 数组（不需要指定大小）
let numbers: number[] = [1, 2, 3, 4];
let fruits: Array<string> = ["apple", "banana", "cherry"];

// 对象
let person: { name: string, age: number } = { name: "John", age: 30 };
```

## 循环

```typescript
// 过滤条件
let billQfilter = new QFilter("billno", "like", "REQ%");
// 单据标识、查询的字段标识，排序字段、查询前多少条数据
let load: DynamicObject[] = BusinessDataServiceHelper.load("kdtest_reqbill", "id,billno", [billQfilter], "billno DESC", 100);

for(let DynamicObject of load){
    let billno = DynamicObject.getString("billno"); // 获取单据编号
    // 其他业务逻辑
}

for (let i = 0; i < load.length; i++) {
    let obj = load[i] as DynamicObject; // 每一条数据是DynamicObject对象
    let billno = obj.getString("billno"); // 获取单据编号
    // 其他业务逻辑
}
```

## 命名空间

命名空间用于解决重名问题，可多层嵌套。

```typescript
namespace MyNamespace {
    export class MyClass {
        // ...
    }
}
```

## 插件开发约定

### 文件类型及命名
- KingScript文件只能在默认路径 `@产品/云-ISV/应用` 下创建
- 文件命名必须带 `.ts` 后缀
- 类名可以和文件名不一样（与Java不同）

### 插件结构
```typescript
class MyPlugin extends AbstractPlugin {
    // 事件处理逻辑
}

let plugin = new MyPlugin();
export { plugin };
```
