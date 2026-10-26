const { DRINKS } = require('../domain/drinks');

class InMemorySalesRepository {
  constructor(clock = () => new Date()) {
    this.sales = [];
    this.clock = clock;
  }

  add({ drink, priceCents }) {
    this.sales.push({ drink, priceCents, soldAt: this.clock() });
  }

  report() {
    const drinks = {};
    for (const name of Object.keys(DRINKS)) {
      drinks[name] = { count: 0, totalCents: 0 };
    }
    let totalCents = 0;
    for (const sale of this.sales) {
      drinks[sale.drink].count += 1;
      drinks[sale.drink].totalCents += sale.priceCents;
      totalCents += sale.priceCents;
    }
    return { drinks, totalCents };
  }
}

module.exports = { InMemorySalesRepository };
