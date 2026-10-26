const express = require('express');
const { DRINKS, MAX_SUGARS } = require('./domain/drinks');
const { ValidationError } = require('./domain/errors');

const HTTP_STATUS_BY_RESULT = {
  served: 201,
  insufficient_money: 402,
  shortage: 503,
};

function createApp({ machine, quantityChecker }) {
  const app = express();
  app.use(express.json());

  app.get('/menu', (req, res) => {
    const menu = Object.entries(DRINKS).map(([drink, def]) => ({
      drink,
      price: def.priceCents / 100,
      maxSugars: def.supportsSugar ? MAX_SUGARS : 0,
      extraHotAvailable: def.supportsExtraHot,
    }));
    res.json(menu);
  });

  app.post('/orders', (req, res) => {
    const result = machine.order(req.body ?? {});
    res.status(HTTP_STATUS_BY_RESULT[result.status]).json(result);
  });

  app.get('/report', (req, res) => {
    res.json(machine.printReport());
  });

  app.put('/stock/:ingredient', (req, res) => {
    quantityChecker.setQuantity(req.params.ingredient, (req.body ?? {}).quantity);
    res.status(204).end();
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err.status && err.status < 500) {
      return res.status(err.status).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
