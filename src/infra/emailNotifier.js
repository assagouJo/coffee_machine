// Node version of: interface EmailNotifier { void notifyMissingDrink(String drink) }
// Here the "email" is logged. Replace the body with nodemailer (or any mail API) in production.
class ConsoleEmailNotifier {
  constructor({ to = 'maintenance@company.com', logger = console } = {}) {
    this.to = to;
    this.logger = logger;
  }

  notifyMissingDrink(drink) {
    this.logger.log(`[EMAIL to ${this.to}] The coffee machine can no longer serve: ${drink}. Please refill.`);
  }
}

module.exports = { ConsoleEmailNotifier };
