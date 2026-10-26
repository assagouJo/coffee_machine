const { CoffeeMachine } = require('./services/coffeeMachine');
const { InMemorySalesRepository } = require('./repositories/salesRepository');
const { InMemoryBeverageQuantityChecker } = require('./infra/beverageQuantityChecker');
const { ConsoleEmailNotifier } = require('./infra/emailNotifier');
const { ConsoleDrinkMaker } = require('./infra/drinkMaker');

function buildContainer() {
  const quantityChecker = new InMemoryBeverageQuantityChecker();
  const machine = new CoffeeMachine({
    drinkMaker: new ConsoleDrinkMaker(),
    quantityChecker,
    emailNotifier: new ConsoleEmailNotifier(),
    salesRepository: new InMemorySalesRepository(),
  });
  return { machine, quantityChecker };
}

module.exports = { buildContainer };
