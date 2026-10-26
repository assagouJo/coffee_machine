const { InMemoryBeverageQuantityChecker } = require('../../src/infra/beverageQuantityChecker');
const { ValidationError } = require('../../src/domain/errors');

describe('InMemoryBeverageQuantityChecker', () => {
  it('is not empty when everything is in stock', () => {
    const checker = new InMemoryBeverageQuantityChecker({ water: 10, milk: 10, orange: 10 });
    expect(checker.isEmpty('chocolate')).toBe(false);
  });

  it('is empty for every water based drink when water runs out', () => {
    const checker = new InMemoryBeverageQuantityChecker({ water: 0, milk: 10, orange: 10 });
    expect(checker.isEmpty('tea')).toBe(true);
    expect(checker.isEmpty('coffee')).toBe(true);
    expect(checker.isEmpty('chocolate')).toBe(true);
    expect(checker.isEmpty('orange')).toBe(false);
  });

  it('only affects chocolate when milk runs out', () => {
    const checker = new InMemoryBeverageQuantityChecker({ water: 10, milk: 0, orange: 10 });
    expect(checker.isEmpty('chocolate')).toBe(true);
    expect(checker.isEmpty('coffee')).toBe(false);
  });

  it('can be refilled', () => {
    const checker = new InMemoryBeverageQuantityChecker({ water: 0, milk: 10, orange: 10 });
    checker.setQuantity('water', 50);
    expect(checker.isEmpty('tea')).toBe(false);
  });

  it('rejects unknown ingredients and invalid quantities', () => {
    const checker = new InMemoryBeverageQuantityChecker();
    expect(() => checker.setQuantity('sand', 1)).toThrow(ValidationError);
    expect(() => checker.setQuantity('constructor', 1)).toThrow(ValidationError);
    expect(() => checker.setQuantity('water', -1)).toThrow(ValidationError);
    expect(() => checker.setQuantity('water', undefined)).toThrow(ValidationError);
  });
});
