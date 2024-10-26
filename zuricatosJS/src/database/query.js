const dbPool = require("./dbPool");

module.exports.hello = async (event) => {
  console.log(event);
  const { query, params } = event; // Destructure query and params from event input
  let client;

  try {
    client = await dbPool.connect(); // Acquire a client from the pool

    const result = await client.query(query, params);
    const isSelectQuery = query.trim().toLowerCase().startsWith("select");

    return {
      statusCode: 200,
      body: isSelectQuery
        ? JSON.stringify(result.rows)
        : "Query executed successfully",
    };
  } catch (error) {
    console.error("Database query failed", error); // Log the error details for debugging
    return {
      statusCode: 400,
      body: `Query execution failed: ${error.message}`,
    };
  } finally {
    if (client) {
      client.release(); // Always release the client
    }
  }
};
