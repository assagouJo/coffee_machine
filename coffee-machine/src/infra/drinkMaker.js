// Simulated drink maker: receives string commands ("T:1:0", "M:message"...).
class ConsoleDrinkMaker {
  constructor(logger = console) {
    this.logger = logger;
  }

  send(command) {
    this.logger.log(`[DRINK MAKER] ${command}`);
  }
}

module.exports = { ConsoleDrinkMaker };
