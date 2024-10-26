const AWS = require("aws-sdk");
const dbPool = require("./dbPool");

module.exports.queryReceiver = async (event) => {
  //const { query, params } = JSON.parse(event.b);
  const query = event.query;
  const params = event.params;
  let client;

  try {
    client = await dbPool.connect();

    const result = await client.query(query, params);
    const isSelectQuery = query.trim().toLowerCase().startsWith("select");

    if (isSelectQuery) {
      const lambda = new AWS.Lambda();
      const lambdaParams = {
        FunctionName: "nanostores-dev-analyzeQueryResults",
        Payload: JSON.stringify({ data: result.rows }),
      };

      const lambdaResponse = await lambda.invoke(lambdaParams).promise();
      const responseBody = JSON.parse(lambdaResponse.Payload);
      // Access the responseAudio property
      const responseAudio = responseBody.responseAudio;
      console.log("Response audio key from S3:", responseAudio);

      return {
        statusCode: 200,
        responseAudio: responseAudio,
      };
    } else {
      return {
        statusCode: 200,
        body: "AudioTestA.mp3", //TODO, set to the hardcoded right file
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
