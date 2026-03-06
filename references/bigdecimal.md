# BigDecimal 精确计算参考

财务计算必须使用 BigDecimal，禁止使用 number 类型进行金额、单价、数量等计算，避免浮点数精度问题。

BigDecimal 是内置类型，无需导入。

## 创建 BigDecimal

```typescript
// 使用字符串创建（推荐）
const amount = new BigDecimal("100.50");

// 使用整数创建
const qty = new BigDecimal(10);

// 常量
const zero = BigDecimal.ZERO;
const one = BigDecimal.ONE;
```

**禁止使用浮点数创建**：`new BigDecimal(0.1)` 会引入精度误差，必须用字符串 `new BigDecimal("0.1")`。

## 四则运算

```typescript
const a = new BigDecimal("100.50");

// 加法
const sum = a.add(new BigDecimal("50"));  // 150.50

// 减法
const diff = a.subtract(new BigDecimal("20"));  // 80.50

// 乘法
const product = a.multiply(new BigDecimal("1.1"));  // 110.55

// 除法（必须指定精度和舍入模式，否则无限循环小数会报错）
const quotient = a.divide(new BigDecimal("3"), 2, BigDecimal.ROUND_HALF_UP);  // 33.50
```

## 舍入模式

| 模式 | 说明 | 示例（2.5 → ？） |
|------|------|------------------|
| ROUND_HALF_UP | 四舍五入（推荐） | 3 |
| ROUND_HALF_DOWN | 五舍六入 | 2 |
| ROUND_HALF_EVEN | 银行家舍入 | 2 |
| ROUND_UP | 远离零舍入 | 3 |
| ROUND_DOWN | 截断舍入 | 2 |
| ROUND_CEILING | 向正无穷舍入 | 3 |
| ROUND_FLOOR | 向负无穷舍入 | 2 |

## 比较

```typescript
// 比较大小（不要用 == 或 ===）
if (amount.compareTo(BigDecimal.ZERO) > 0) {
  // 大于零
}
if (amount.compareTo(new BigDecimal("100")) === 0) {
  // 等于100
}

// compareTo 返回值：
//  1: 大于
//  0: 等于
// -1: 小于
```

## 设置精度

```typescript
const rounded = amount.setScale(2, BigDecimal.ROUND_HALF_UP);  // 保留2位小数
```

## 常见业务计算

### 分录金额汇总

```typescript
let total = BigDecimal.ZERO;
for (const entry of entries) {
  const amt = entry.get("amount") as BigDecimal;
  if (amt != null) {
    total = total.add(amt);
  }
}
```

### 单价计算

```typescript
const totalAmount = new BigDecimal("1000.00");
const totalQty = new BigDecimal("3");
// 单价保留6位小数
const unitPrice = totalAmount.divide(totalQty, 6, BigDecimal.ROUND_HALF_UP);
```

### 税额计算

```typescript
const taxRate = new BigDecimal("0.13");  // 13%税率
const taxAmount = amount.multiply(taxRate).setScale(2, BigDecimal.ROUND_HALF_UP);
const amountWithTax = amount.add(taxAmount);
```

### 数量 x 单价 = 金额

```typescript
const qty = this.getModel().getValue("qty", rowIndex) as BigDecimal;
const price = this.getModel().getValue("price", rowIndex) as BigDecimal;

if (qty != null && price != null) {
  const amount = qty.multiply(price).setScale(2, BigDecimal.ROUND_HALF_UP);
  this.getModel().setValue("amount", amount, rowIndex);
}
```

## 错误示例

```typescript
// 错误：使用 number 做财务计算
let amount = 0.1 + 0.2;  // 0.30000000000000004

// 正确：使用 BigDecimal
let amount = new BigDecimal("0.1").add(new BigDecimal("0.2"));  // 0.3

// 错误：除法不指定精度
let result = a.divide(b);  // 无限循环小数会报错

// 正确：除法指定精度
let result = a.divide(b, 2, BigDecimal.ROUND_HALF_UP);
```
