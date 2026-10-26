# Coffee machine (Node.js + Express + Jest)

    npm install
    npm test          # 48 tests (unit + integration)
    npm start         # http://localhost:3000

| Method | Route               | Description                                              |
|--------|---------------------|----------------------------------------------------------|
| GET    | /menu               | Drinks and prices                                        |
| POST   | /orders             | `{ "drink": "tea", "sugars": 1, "extraHot": true, "money": 0.5 }` |
| GET    | /report             | Prints the sales report to the console and returns it    |
| PUT    | /stock/:ingredient  | `{ "quantity": 0 }` simulates a shortage / refill (water, milk, orange) |

POST /orders returns 201 (served), 402 (missing money), 503 (shortage), 400 (invalid order).
