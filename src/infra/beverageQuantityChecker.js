const { ValidationError } = require('../domain/errors');

const INGREDIENTS_BY_DRINK = {
  tea: ['water'],
  coffee: ['water'],
  chocolate: ['water', 'milk'],
  orange: ['orange'],
};

// Node version of: interface BeverageQuantityChecker { boolean isEmpty(String drink) }
class InMemoryBeverageQuantityChecker {
  constructor(initialStock = { water: 100, milk: 100, orange: 100 }) {
    this.stock = { ...initialStock };
  }

  isEmpty(drink) {
    const ingredients = INGREDIENTS_BY_DRINK[drink] ?? [];
    return ingredients.some((ingredient) => (this.stock[ingredient] ?? 0) <= 0);
  }

  // Simulates a refill or a shortage (used by PUT /stock/:ingredient).
  setQuantity(ingredient, quantity) {
    if (!(ingredient in this.stock)) {
      throw new ValidationError(`Unknown ingredient: ${ingredient}`);
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new ValidationError('quantity must be a non-negative integer');
    }
    this.stock[ingredient] = quantity;
  }
}

module.exports = { InMemoryBeverageQuantityChecker };
