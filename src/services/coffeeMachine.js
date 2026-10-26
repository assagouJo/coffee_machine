const { DRINKS, formatEuros } = require('../domain/drinks');
const { normalizeOrder, toCommand } = require('../domain/order');
const { formatReport } = require('./reportPrinter');

/**
 * Collaborators (all injected, so they can be mocked in tests):
 *  - drinkMaker:       { send(command: string) }
 *  - quantityChecker:  { isEmpty(drink: string): boolean }      (BeverageQuantityChecker)
 *  - emailNotifier:    { notifyMissingDrink(drink: string) }    (EmailNotifier)
 *  - salesRepository:  { add({ drink, priceCents }), report() }
 *  - logger:           { log(message) }
 */
class CoffeeMachine {
  constructor({ drinkMaker, quantityChecker, emailNotifier, salesRepository, logger = console }) {
    this.drinkMaker = drinkMaker;
    this.quantityChecker = quantityChecker;
    this.emailNotifier = emailNotifier;
    this.salesRepository = salesRepository;
    this.logger = logger;
  }

  order(rawOrder) {
    const order = normalizeOrder(rawOrder);
    const { priceCents } = DRINKS[order.drink];

    if (order.moneyCents < priceCents) {
      const missingCents = priceCents - order.moneyCents;
      const message = `M:Not enough money, ${formatEuros(missingCents)} euro missing`;
      this.drinkMaker.send(message);
      return { status: 'insufficient_money', missingCents, message };
    }

    if (this.quantityChecker.isEmpty(order.drink)) {
      this.emailNotifier.notifyMissingDrink(order.drink);
      const message = `M:Shortage of ${order.drink}, a notification has been sent`;
      this.drinkMaker.send(message);
      return { status: 'shortage', message };
    }

    const command = toCommand(order);
    this.drinkMaker.send(command);
    this.salesRepository.add({ drink: order.drink, priceCents });
    return { status: 'served', command };
  }

  printReport() {
    const report = this.salesRepository.report();
    this.logger.log(formatReport(report));
    return report;
  }
}

module.exports = { CoffeeMachine };
