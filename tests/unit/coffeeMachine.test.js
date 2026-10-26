const { CoffeeMachine } = require('../../src/services/coffeeMachine');
const { InMemorySalesRepository } = require('../../src/repositories/salesRepository');
const { ValidationError } = require('../../src/domain/errors');

function setup() {
  const drinkMaker = { send: jest.fn() };
  const quantityChecker = { isEmpty: jest.fn().mockReturnValue(false) };
  const emailNotifier = { notifyMissingDrink: jest.fn() };
  const salesRepository = new InMemorySalesRepository();
  const logger = { log: jest.fn() };
  const machine = new CoffeeMachine({ drinkMaker, quantityChecker, emailNotifier, salesRepository, logger });
  return { machine, drinkMaker, quantityChecker, emailNotifier, salesRepository, logger };
}

describe('Iteration 1 - making drinks', () => {
  it.each([
    [{ drink: 'tea', sugars: 0 }, 'T::'],
    [{ drink: 'coffee', sugars: 0 }, 'C::'],
    [{ drink: 'chocolate', sugars: 0 }, 'H::'],
    [{ drink: 'tea', sugars: 1 }, 'T:1:0'],
    [{ drink: 'coffee', sugars: 2 }, 'C:2:0'],
    [{ drink: 'chocolate', sugars: 1 }, 'H:1:0'],
  ])('sends the right command for %j', (order, expected) => {
    const { machine, drinkMaker } = setup();
    machine.order({ ...order, money: 1 });
    expect(drinkMaker.send).toHaveBeenCalledTimes(1);
    expect(drinkMaker.send).toHaveBeenCalledWith(expected);
  });

  it('defaults to no sugar (and therefore no stick)', () => {
    const { machine, drinkMaker } = setup();
    machine.order({ drink: 'coffee', money: 1 });
    expect(drinkMaker.send).toHaveBeenCalledWith('C::');
  });

  it.each([
    [{ drink: 'soda', money: 1 }],
    [{ drink: 'tea', sugars: 3, money: 1 }],
    [{ drink: 'tea', sugars: -1, money: 1 }],
    [{ drink: 'tea', sugars: 1.5, money: 1 }],
    [{ drink: 'tea', money: -1 }],
    [{ drink: 'tea', money: '1' }],
  ])('rejects the invalid order %j and sends nothing', (order) => {
    const { machine, drinkMaker } = setup();
    expect(() => machine.order(order)).toThrow(ValidationError);
    expect(drinkMaker.send).not.toHaveBeenCalled();
  });
});

describe('Iteration 2 - going into business', () => {
  it.each([
    ['tea', 0.4, 'T::'],
    ['coffee', 0.6, 'C::'],
    ['chocolate', 0.5, 'H::'],
  ])('makes a %s when exactly %s euro is given', (drink, money, expected) => {
    const { machine, drinkMaker } = setup();
    const result = machine.order({ drink, money });
    expect(result.status).toBe('served');
    expect(drinkMaker.send).toHaveBeenCalledWith(expected);
  });

  it('makes the drink when too much money is given', () => {
    const { machine, drinkMaker } = setup();
    machine.order({ drink: 'tea', money: 5 });
    expect(drinkMaker.send).toHaveBeenCalledWith('T::');
  });

  it('sends a message with the missing amount when money is not enough', () => {
    const { machine, drinkMaker } = setup();
    const result = machine.order({ drink: 'coffee', money: 0.4 });
    expect(result).toMatchObject({ status: 'insufficient_money', missingCents: 20 });
    expect(drinkMaker.send).toHaveBeenCalledTimes(1);
    expect(drinkMaker.send).toHaveBeenCalledWith(expect.stringMatching(/^M:.*0\.20/));
  });

  it('does not make any drink when no money is given', () => {
    const { machine, drinkMaker } = setup();
    machine.order({ drink: 'tea' });
    expect(drinkMaker.send).toHaveBeenCalledWith(expect.stringMatching(/^M:.*0\.40/));
    expect(drinkMaker.send).not.toHaveBeenCalledWith(expect.stringMatching(/^T/));
  });

  it('handles floating point money safely (0.1 + 0.3 euro for a tea)', () => {
    const { machine } = setup();
    expect(machine.order({ drink: 'tea', money: 0.1 + 0.3 }).status).toBe('served');
  });
});

describe('Iteration 3 - extra hot and orange juice', () => {
  it('serves an orange juice for 0.6 euro', () => {
    const { machine, drinkMaker } = setup();
    machine.order({ drink: 'orange', money: 0.6 });
    expect(drinkMaker.send).toHaveBeenCalledWith('O::');
  });

  it('asks for the missing money for an orange juice', () => {
    const { machine, drinkMaker } = setup();
    machine.order({ drink: 'orange', money: 0.5 });
    expect(drinkMaker.send).toHaveBeenCalledWith(expect.stringMatching(/^M:.*0\.10/));
  });

  it.each([
    [{ drink: 'coffee', extraHot: true }, 'Ch::'],
    [{ drink: 'chocolate', extraHot: true, sugars: 1 }, 'Hh:1:0'],
    [{ drink: 'tea', extraHot: true, sugars: 2 }, 'Th:2:0'],
  ])('serves the extra hot order %j', (order, expected) => {
    const { machine, drinkMaker } = setup();
    machine.order({ ...order, money: 1 });
    expect(drinkMaker.send).toHaveBeenCalledWith(expected);
  });

  it('refuses sugar and extra hot on an orange juice', () => {
    const { machine } = setup();
    expect(() => machine.order({ drink: 'orange', sugars: 1, money: 1 })).toThrow(ValidationError);
    expect(() => machine.order({ drink: 'orange', extraHot: true, money: 1 })).toThrow(ValidationError);
  });
});

describe('Iteration 4 - making money (reporting)', () => {
  it('reports an empty history', () => {
    const { machine } = setup();
    const report = machine.printReport();
    expect(report.totalCents).toBe(0);
    expect(report.drinks.tea).toEqual({ count: 0, totalCents: 0 });
  });

  it('counts each drink sold and the total earned', () => {
    const { machine } = setup();
    machine.order({ drink: 'tea', money: 0.4 });
    machine.order({ drink: 'tea', money: 1 });
    machine.order({ drink: 'coffee', money: 0.6 });
    machine.order({ drink: 'orange', money: 0.6 });
    const report = machine.printReport();
    expect(report.drinks.tea).toEqual({ count: 2, totalCents: 80 });
    expect(report.drinks.coffee.count).toBe(1);
    expect(report.drinks.chocolate.count).toBe(0);
    expect(report.drinks.orange.count).toBe(1);
    expect(report.totalCents).toBe(200);
  });

  it('does not count orders that were not served', () => {
    const { machine, quantityChecker } = setup();
    machine.order({ drink: 'coffee', money: 0.1 });
    quantityChecker.isEmpty.mockReturnValue(true);
    machine.order({ drink: 'tea', money: 1 });
    expect(machine.printReport().totalCents).toBe(0);
  });

  it('prints the report to the console', () => {
    const { machine, logger } = setup();
    machine.order({ drink: 'tea', money: 0.4 });
    machine.printReport();
    expect(logger.log).toHaveBeenCalledTimes(1);
    const printed = logger.log.mock.calls[0][0];
    expect(printed).toContain('tea: 1');
    expect(printed).toContain('coffee: 0');
    expect(printed).toContain('Total earned: 0.40 euro');
  });
});

describe('Iteration 5 - running out', () => {
  it('asks the quantity checker about the ordered drink', () => {
    const { machine, quantityChecker } = setup();
    machine.order({ drink: 'chocolate', money: 1 });
    expect(quantityChecker.isEmpty).toHaveBeenCalledWith('chocolate');
  });

  it('notifies the company and informs the customer on shortage', () => {
    const { machine, quantityChecker, emailNotifier, drinkMaker } = setup();
    quantityChecker.isEmpty.mockReturnValue(true);
    const result = machine.order({ drink: 'coffee', money: 1 });
    expect(result.status).toBe('shortage');
    expect(emailNotifier.notifyMissingDrink).toHaveBeenCalledWith('coffee');
    expect(drinkMaker.send).toHaveBeenCalledTimes(1);
    expect(drinkMaker.send).toHaveBeenCalledWith(expect.stringMatching(/^M:.*coffee.*notification has been sent/));
  });

  it('does not notify anybody when the drink is available', () => {
    const { machine, emailNotifier } = setup();
    machine.order({ drink: 'tea', money: 1 });
    expect(emailNotifier.notifyMissingDrink).not.toHaveBeenCalled();
  });

  it('does not notify when the customer has not paid enough', () => {
    const { machine, quantityChecker, emailNotifier } = setup();
    quantityChecker.isEmpty.mockReturnValue(true);
    machine.order({ drink: 'coffee', money: 0.1 });
    expect(emailNotifier.notifyMissingDrink).not.toHaveBeenCalled();
  });
});
