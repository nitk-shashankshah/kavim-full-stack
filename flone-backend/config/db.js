const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_SERVER,
    port:    parseInt(process.env.DB_PORT) || 1433,
    dialect: 'mssql',
    dialectOptions: {
      options: {
        encrypt:                    true,   // Encrypt=True
        trustServerCertificate:     false,  // TrustServerCertificate=False
        enableArithAbort:           true,
        connectTimeout:             30000,  // Connection Timeout=30 (ms)
        multipleActiveResultSets:   false,  // MultipleActiveResultSets=False
      },
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  }
);

const connectDB = async () => {
  await sequelize.authenticate();
  console.log('Azure SQL connected');
};

module.exports = { sequelize, connectDB };
