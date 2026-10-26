const { createApp } = require('./app');
const { buildContainer } = require('./container');

const port = process.env.PORT || 3000;
const app = createApp(buildContainer());

app.listen(port, () => {
  console.log(`Coffee machine API listening on http://localhost:${port}`);
});
