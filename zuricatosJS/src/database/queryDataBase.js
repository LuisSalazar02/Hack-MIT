const AWS = require("aws-sdk");
const dbPool = require("./dbPool");

module.exports.queryReceiver = async (event) => {
  //const { query, params } = JSON.parse(event.b);
  const query = event.query;
  console.log(query);
  let client;

  try {
    client = await dbPool.connect();

    const result = await client.query(query);
    const isSelectQuery = query.trim().toLowerCase().startsWith("select");

    if (isSelectQuery) {
      const lambda = new AWS.Lambda();
      const lambdaParams = {
        FunctionName: "nanostores-dev-analyzeQueryResults",
        InvocationType: "RequestResponse",
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
        responseAudio: "listo.mp3",
      };
    }
  } catch (error) {
    console.error("Database query failed", error);
    return {
      statusCode: 400,
      body: `Query execution failed: ${error.message}`,
      responseAudio: "noentendi.mp3",
    };
  } finally {
    if (client) {
      client.release();
    }
  }
};
