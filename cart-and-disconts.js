class Voucher {
  constructor() {
    if (Voucher.exists) {
      return Voucher.instance;
    }
    Voucher.instance = this;
    Voucher.exists = true;

    this.vouchers = [
      {
        start: 1594674000000, // 14.07.2020
        end: 1595019600000, // 18.07.2020
        type: "interval",
        value: "",
        discount: 10, // 10% of discount
        active: true,
      },
      {
        start: 1597870800000, // 20.08.2020
        end: 1598043600000, // 22.08.2020
        type: "interval",
        value: "",
        discount: 5, // 5% of discount
        active: true,
      },
      {
        start: 1594674000000, // 14.07.2020
        end: 1598043600000, // 22.08.2020
        type: "code",
        value: "aabb",
        discount: 3, // 3% of discount
        active: true,
      },
      {
        start: 1594674000000, // 14.07.2020
        end: 1598043600000, // 22.08.2020
        type: "code",
        value: "bbbb",
        discount: 4, // 4% of discount
        active: true,
      },
      {
        start: 1594674000000, // 14.07.2020
        end: 1598043600000, // 22.08.2020
        type: "bundle",
        value: "4",
        discount: 0, // 1 item will be for free if the total count of items will be more  or equal than 4
        active: false,
      },
      {
        start: 1594674000000, // 14.07.2020
        end: 1598043600000, // 22.08.2020
        type: "bulk",
        value: "80",
        discount: 4, // 4% of discount
        active: true,
      },
    ];
  }

  applyVoucher(code) {
    let discountValue = 0;
    discountValue += this.checkIntervalDiscount();

    if (code != "") {
      discountValue += this.checkCodeDiscount(code);
    }

    //discountValue += this.checkBulkOrderDiscount();
    return discountValue;
  }

  getVoucherByType(type) {
    const now = Date.now();
    return this.vouchers.filter(
      (v) => v.active && now >= v.start && now <= v.end && v.type == type
    );
  }

  checkIntervalDiscount() {
    const d = this.getVoucherByType("interval");
    if (d.length === 0) return 0;
    const [discount] = d;
    return discount.discount;
  }

  checkBundleDiscount() {
    const d = this.getVoucherByType("bundle");
    if (d.length === 0) return [];
    const [discount] = d;
    const { value: bundleSize, discount: discountSize, ...rest } = discount;
    return [bundleSize, discountSize];
  }

  checkCodeDiscount(code) {
    const d = this.getVoucherByType("code").filter((v) => v.value === code);

    if (d.length === 0) return 0;
    const [discount] = d;
    const { value: discountCode, discount: discountValue, ...rest } = discount;

    // After discount code will applied we need remove it
    this.vouchers = this.vouchers.filter(
      (v) => !(v.type == "code" && v.value == code)
    );
    return discountValue;
  }

  checkBulkOrderDiscount() {
    const d = this.getVoucherByType("bulk");
    if (d.length === 0) return [];
    const [discount] = d;
    const { value: bulkSize, discount: discountSize, ...rest } = discount;
    return [bulkSize, discountSize];
  }
}

class Cart {
  constructor(name = "user cart", freeShipping = 100) {
    this.name = name;
    this.items = [];
    this.discount = 0;
    this.bulkOrderDiscount = 0;
    this.bulkOrderSize = 0;
    this.freeShipping = freeShipping;
    this.shippingPrice = 14;
    this.userDiscountCode = "";
    this.freeItem = null;
  }

  applyDiscountCode(code) {
    if (code === undefined || code == "") return;
    this.userDiscountCode = code;
  }

  getTotalPrice() {
    let totalPrice = this.items.reduce(
      (total, el) => total + el.price * el.count,
      0
    );

    let totalCount = this.items.reduce((total, el) => total + el.count, 0);

    const voucher = new Voucher();

    // check applying interval and code discounts
    this.discount = voucher.applyVoucher(this.userDiscountCode);
    totalPrice =
      this.discount > 0
        ? totalPrice - totalPrice * (this.discount / 100)
        : totalPrice;

    // check applying bundle discount
    const bundle = voucher.checkBundleDiscount();
    if (bundle.length > 0) {
      const [bundleSize] = bundle;

      // by default bundle discount is 3+1 free = 4 items
      if (totalCount >= bundleSize) {
        const [minPriceItem] = this.items.sort((a, b) => a.price - b.price);
        const { price, ...r } = minPriceItem;
        totalPrice -= price;
      }
    }

    // check applying bulk discount
    const bulk = voucher.checkBulkOrderDiscount();
    if (bulk.length > 0) {
      this.bulkOrderSize = bulk[0];
      this.bulkOrderDiscount = bulk[1];
      if (totalCount >= this.bulkOrderSize) {
        totalPrice = totalPrice - totalPrice * (this.bulkOrderDiscount / 100);
      }
    }

    return totalPrice.toFixed(2);
  }

  getTotalCount() {
    return this.items.reduce((total, el) => total + el.count, 0);
  }

  getShippingPrice(totalPrice) {
    return totalPrice >= this.freeShipping ? 0 : this.shippingPrice;
  }

  addItem(product) {
    return this.items.push(product);
  }

  renderCartItems() {
    let res = "";
    this.items.forEach((el) => (res += this.renderCartItem(el)));
    return res;
  }

  renderCartItem({ name, color, price, count }) {
    return `${name} (${color})\t\$${price}\tx${count} = ${price * count}\n`;
  }

  renderCartFooter() {
    let res = "";
    const totalPrice = this.getTotalPrice();
    const shippingPrice = this.getShippingPrice(totalPrice);
    const totalCount = this.getTotalCount();

    // Render total count
    res += "========================================\n";
    res += `Total count:\t\t\t${totalCount} pcs\n`;

    // Render total price
    res += `Total price:\t\t\t\$${totalPrice}${
      this.discount ? ` (-${this.discount}%)\n` : "\n"
    }`;

    // Render shipping price
    res += `Shipping:\t\t\t\$${shippingPrice}`;
    console.log(this.bulkOrderSize);
    if (this.bulkOrderSize > 0 && totalCount > this.bulkOrderSize) {
      res += "\n========================================\n";
      res += `Info: Bulk order discount applied (${this.bulkOrderDiscount}%) for total price because total items count in cart is more than ${this.bulkOrderSize} pcs`;
    }

    return res;
  }

  renderCart() {
    const items = this.renderCartItems();
    const footer = this.renderCartFooter();
    return `${this.name}:\n${items}${footer}`;
  }
}

const cart = new Cart("Cart #1");
// add some products to cart
cart.addItem({ name: "Product 1", color: "Blue", price: 10, count: 80 });
cart.addItem({ name: "Product 2", color: "Green", price: 15, count: 1 });
cart.addItem({ name: "Product 3", color: "White", price: 8, count: 1 });
cart.addItem({ name: "Product 4", color: "Yellow", price: 4, count: 1 });
cart.addItem({ name: "Product 5", color: "Yellow", price: 9, count: 1 });

// apply discount voucher by code
cart.applyDiscountCode("aabb");

// show the cart after discount code was applied
console.log(`\n\n\n${cart.renderCart()}`);

const cart2 = new Cart("Cart #2", 120);
cart2.addItem({ name: "Product 1", color: "White", price: 6, count: 10 });
cart2.addItem({ name: "Product 2", color: "Blue", price: 8, count: 2 });
cart2.addItem({ name: "Product 3", color: "Black", price: 11, count: 3 });
cart2.addItem({ name: "Product 4", color: "Yellow", price: 3, count: 4 });

// apply discount voucher by code
cart2.applyDiscountCode("aabb");
console.log(`\n\n\n${cart2.renderCart()}`);
