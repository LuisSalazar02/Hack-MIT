const { Pool } = require("pg");

const dbPool = new Pool({
  user: "nano_store_bd",
  host: "dpg-cse1m60gph6c73bo46og-a.oregon-postgres.render.com",
  database: "nano_store_bd",
  password: "DopMfU8fNwnMKdH8LGSWXd6lmMjt4fzt",
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = dbPool;
