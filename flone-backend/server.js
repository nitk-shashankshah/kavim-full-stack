require('dotenv').config();
require('./schema'); // registers all models with sequelize before sync
const app = require('./app');
const { connectDB, sequelize } = require('./config/db');

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => sequelize.sync())  // creates tables that don't yet exist
  .then(() => {
    app.listen(PORT, () => console.log(`Flone API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Startup failed:', err.message);
    process.exit(1);
  });
