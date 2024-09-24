const sql = require('mssql');

const poolPromise = new sql.ConnectionPool({
  user: process.env.DB_USER || 'demo2005',
  password: process.env.DB_PASSWORD || 'Spbxr@2005',
  server: process.env.DB_SERVER || 'demo2005.database.windows.net',
  database: process.env.DB_DATABASE || 'demo2005',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: true, // Use encryption for Azure SQL Database
    trustServerCertificate: false, // Set to true for self-signed certificates
  },
})
  .connect()  // Connect to the database
  .then(pool => {
    console.log('Connected to the database successfully!');
    return pool;
  })
  .catch(err => {
    console.error('Database connection failed: ', err);
  });

module.exports = { sql, poolPromise };
