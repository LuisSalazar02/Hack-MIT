const dbPool = require("./dbPool");

module.exports.getMetrics = async (event) => {
  let client;
  try {
    client = await dbPool.connect();

    const best_sellers = await client.query(
      "SELECT p.producto_nombre, SUM(tp.cantidad) AS cantidad_vendida FROM transaccion_productos tp JOIN \
        productos p ON tp.producto_id = p.id GROUP BY p.producto_nombre ORDER BY cantidad_vendida DESC LIMIT 2;"
    );
    const least_sellers = await client.query(
      "SELECT p.producto_nombre, SUM(tp.cantidad) AS cantidad_vendida FROM transaccion_productos tp JOIN \
    productos p ON tp.producto_id = p.id GROUP BY p.producto_nombre ORDER BY cantidad_vendida ASC LIMIT 2;"
    );
    const debtor = await client.query("SELECT nombre, adeudo FROM deudores");
    const budget = await client.query(
      "SELECT presupuesto_actual FROM usuarios"
    );

    let jsonObject = {
      best_seller1: best_sellers.rows[0],
      best_seller2: best_sellers.rows[1],
      least_seller1: least_sellers.rows[0],
      least_seller2: least_sellers.rows[1],
      budget: budget.rows[0].presupuesto_actual,
    };

    for (let i = 0; i < debtor.rowCount; i++) {
      jsonObject[`debtor${i + 1}`] = debtor.rows[i];
    }

    return {
      statusCode: 200,
      body: JSON.stringify(jsonObject),
    };
  } catch (error) {
    console.error("Database query failed", error);
    return {
      statusCode: 400,
      body: `Query execution failed: ${error.message}`,
    };
  } finally {
    if (client) {
      client.release();
    }
  }
};
