// db.js
const { Pool } = require("pg");

// Create a pool instance with database configuration
const dbPool = new Pool({
  user: "nano_store_bd",
  host: "dpg-cse1m60gph6c73bo46og-a.oregon-postgres.render.com",
  database: "nano_store_bd",
  password: "DopMfU8fNwnMKdH8LGSWXd6lmMjt4fzt",
  port: 5432,
  ssl: false,
});

// Export the pool to be used in other files
module.exports = dbPool;
