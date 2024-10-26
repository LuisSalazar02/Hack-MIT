const AWS = require("aws-sdk");
const dbPool = require("./dbPool");

module.exports.queryReceiver = async (event) => {
  const { query, params } = JSON.parse(event.body);
  let client;

  try {
    client = await dbPool.connect();

    const result = await client.query(query, params);
    const isSelectQuery = query.trim().toLowerCase().startsWith("select");

    if (isSelectQuery) {
      const lambda = new AWS.Lambda();
      const lambdaParams = {
        FunctionName: "analyzeQueryResults",
        Payload: JSON.stringify({ data: result.rows }),
      };

      const lambdaResponse = await lambda.invoke(lambdaParams).promise();
      const responseBody = JSON.parse(lambdaResponse.Payload);

      return {
        statusCode: 200,
        body: JSON.stringify(responseBody),
      };
    } else {
      const url = `https://audio-files-mit.s3.us-east-2.amazonaws.com/AudioTestA.mp3`;
      return {
        statusCode: 200,
        body: url,
      };
    }
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
