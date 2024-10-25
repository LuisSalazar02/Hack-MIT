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
    productos p ON tp.producto_id = p.id GROUP BY p.producto_nombre ORDER BY total_quantity_sold ASC LIMIT 2;"
    );
    const debtor = await client.query("SELECT nombre, adeudo FROM deudores");
    const budget = await client.query(
      "SELECT presupuesto_actual FROM usuarios"
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        best_sellers: best_sellers.rows,
        least_sellers: least_sellers.rows,
        debtor: debtor.rows,
        budget: budget.rows,
      }),
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
