const app = require('./app');
const { PORT } = require('./src/config/env');

require('./src/config/db');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
