const request = require('supertest');
const { createApp } = require('../../src/app');
const { CoffeeMachine } = require('../../src/services/coffeeMachine');
const { InMemorySalesRepository } = require('../../src/repositories/salesRepository');
const { InMemoryBeverageQuantityChecker } = require('../../src/infra/beverageQuantityChecker');

function buildApp() {
  const drinkMaker = { send: jest.fn() };
  const emailNotifier = { notifyMissingDrink: jest.fn() };
  const quantityChecker = new InMemoryBeverageQuantityChecker();
  const machine = new CoffeeMachine({
    drinkMaker,
    quantityChecker,
    emailNotifier,
    salesRepository: new InMemorySalesRepository(),
    logger: { log: jest.fn() },
  });
  return { app: createApp({ machine, quantityChecker }), drinkMaker, emailNotifier };
}

describe('GET /menu', () => {
  it('lists the 4 drinks with their prices', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/menu');
    expect(res.status).toBe(200);
    expect(res.body.map((d) => d.drink)).toEqual(['tea', 'coffee', 'chocolate', 'orange']);
    expect(res.body.find((d) => d.drink === 'tea').price).toBe(0.4);
    expect(res.body.find((d) => d.drink === 'orange').extraHotAvailable).toBe(false);
  });
});

describe('POST /orders', () => {
  it('serves a drink (201) and sends the command to the drink maker', async () => {
    const { app, drinkMaker } = buildApp();
    const res = await request(app).post('/orders').send({ drink: 'tea', sugars: 1, extraHot: true, money: 0.5 });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ status: 'served', command: 'Th:1:0' });
    expect(drinkMaker.send).toHaveBeenCalledWith('Th:1:0');
  });

  it('answers 402 with the missing amount when money is not enough', async () => {
    const { app } = buildApp();
    const res = await request(app).post('/orders').send({ drink: 'coffee', money: 0.4 });
    expect(res.status).toBe(402);
    expect(res.body.missingCents).toBe(20);
    expect(res.body.message).toContain('0.20');
  });

  it('answers 503 and notifies the company on shortage', async () => {
    const { app, emailNotifier } = buildApp();
    await request(app).put('/stock/milk').send({ quantity: 0 }).expect(204);
    const res = await request(app).post('/orders').send({ drink: 'chocolate', money: 1 });
    expect(res.status).toBe(503);
    expect(emailNotifier.notifyMissingDrink).toHaveBeenCalledWith('chocolate');
  });

  it('answers 400 for an invalid order', async () => {
    const { app } = buildApp();
    const res = await request(app).post('/orders').send({ drink: 'soda', money: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Unknown drink/);
  });

  it('answers 400 for a malformed JSON body', async () => {
    const { app } = buildApp();
    const res = await request(app).post('/orders').set('Content-Type', 'application/json').send('{oops');
    expect(res.status).toBe(400);
  });
});

describe('GET /report', () => {
  it('returns what was sold and the money earned', async () => {
    const { app } = buildApp();
    await request(app).post('/orders').send({ drink: 'tea', money: 0.4 });
    await request(app).post('/orders').send({ drink: 'orange', money: 1 });
    const res = await request(app).get('/report');
    expect(res.status).toBe(200);
    expect(res.body.drinks.tea.count).toBe(1);
    expect(res.body.drinks.orange.count).toBe(1);
    expect(res.body.totalCents).toBe(100);
  });
});

describe('PUT /stock/:ingredient', () => {
  it('answers 400 for an unknown ingredient', async () => {
    const { app } = buildApp();
    const res = await request(app).put('/stock/sand').send({ quantity: 1 });
    expect(res.status).toBe(400);
  });
});
