class Discount {
  constructor() {
    // We'll user the Singleton pattern in order to disable apply one code twice
    if (Discount.exists) {
      return Discount.instance;
    }
    Discount.instance = this;
    Discount.exists = true;
    // The table of codes. Each code means the value of discont in percents. when we aply the code it will remove from the list
    this.codes = [
      ["aabb", 3],
      ["babb", 3],
      ["babe", 7],
      ["aaab", 7],
      ["bbbb", 12],
      ["ddeb", 12],
    ];
    // This is the array of discounts by date. There are two discounts:
    // 1. from, 14.07.2020 to 18.07.2020 - 5% (active)
    // 2. from, 20.08.2020 to 22.08.2020 - 10% (active)
    // If current date Date.now() is between the startTimestamp and endTimestamp then
    // discountValue will apply automatically for total cart price
    this.discounts = [
      { start: 1594674000000, end: 1595019600000, value: 5, active: false }, // from, 14.07.2020 to 18.07.2020 5% of discount
      { start: 1597870800000, end: 1598043600000, value: 10, active: true }, // from, 20.08.2020 to 22.08.2020 10% of discount
    ];
  }

  applyCode(c) {
    const [, val] = this.codes.filter((code) => code[0] == c).flat();

    if (val != undefined) {
      this.codes = this.codes.filter((code) => code[0] != c);
      return val;
    } else return 0;
  }

  applyByDate() {
    const discount = this.discounts.filter((discount) => {
      const now = Date.now();
      return now >= discount.start && now <= discount.end;
    });
    let res = 0;
    if (discount.length > 0) {
      const [d] = discount;
      const { value, active, ...rest } = d;
      res = value > 0 && active ? value : 0;
    } else res = 0;
    return res;
  }
}

class Cart {
  constructor() {
    this.items = [];
    this.discount = 0;
  }

  getDiscount() {
    return this.discount;
  }
  applyByDate() {
    const discount = new Discount();
    const discountValue = discount.applyByDate();
    this.discount = discountValue ? discountValue : 0;
  }

  getTotalPrice() {
    this.applyByDate();
    let total = this.items.reduce((total, el) => total + el.price, 0);
    return this.discount > 0 ? total - total * (this.discount / 100) : total;
  }

  applyCode(code) {
    const discount = new Discount();
    const discountValue = discount.applyCode(code); // If discount by date has been applied, we don't apply discount by code

    if (discountValue > this.discount) {
      this.discount = discountValue;
    }
  }

  add(product) {
    return this.items.push(product);
  }

  show() {
    let res = "Cart includes:\n";
    this.items.forEach(
      (el, id) =>
        (res += `#${id + 1}\t${el.name} (${el.color})\t\$${el.price}\n`)
    );

    res += `===================================\nTotal:\t\t\t\t\$${this.getTotalPrice()}${
      this.discount ? ` (-${this.discount}%)\n` : "\n"
    }`;
    return res;
  }

  applyVoucher() {}
}

const cart = new Cart();
// add some products to cart
cart.add({ name: "Product 1", color: "Blue", price: 10 });
cart.add({ name: "Product 2", color: "Green", price: 15 });
cart.add({ name: "Product 3", color: "White", price: 5 });
cart.add({ name: "Product 4", color: "Yellow", price: 19 });

// show the cart before discount was applied
console.log(`!!!Before discount was applied!!!\n${cart.show()}`);

// apply discount voucher
//cart.applyCode("aabb");

// show the cart after discount was applied
//console.log(cart.show());

// const cart2 = new Cart();
// cart2.add({ name: "Product 1", color: "Blue", price: 10 });
// cart2.add({ name: "Product 2", color: "Green", price: 15 });
// cart2.add({ name: "Product 3", color: "White", price: 8 });
// cart2.add({ name: "Product 4", color: "Yellow", price: 19 });

// cart2.applyCode("bbbb");
// console.log(cart2.show());
