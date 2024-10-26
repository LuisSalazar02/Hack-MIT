const dbPool = require("./dbPool");

module.exports.queryReceiver = async (event) => {
  const { query, params } = JSON.parse(event.body);
  let client;

  try {
    client = await dbPool.connect();

    const result = await client.query(query, params);
    const isSelectQuery = query.trim().toLowerCase().startsWith("select");

    return {
      statusCode: 200,
      body: isSelectQuery
        ? JSON.stringify(result.rows)
        : "Query executed successfully",
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
