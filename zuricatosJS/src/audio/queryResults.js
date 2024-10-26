const AWS = require("aws-sdk");

module.exports.analyzeQueryResults = async (event) => {
  let data = event.data;

  try {
    const lambda = new AWS.Lambda();
    const lambdaParams = {
      FunctionName: "nanostores-dev-textToSpeech",
      Payload: JSON.stringify({ text: "Hola, este es un flujo completo" }),
    };

    const lambdaResponse = await lambda.invoke(lambdaParams).promise();
    console.log(lambdaResponse);
    const responseBody = JSON.parse(lambdaResponse.Payload);
    console.log(responseBody);

    // Access the responseAudio property
    const responseAudio = responseBody.responseAudio;
    console.log("Response audio key from S3:", responseAudio);

    return {
      statusCode: 200,
      responseAudio: responseAudio,
    };
  } catch (error) {
    return {
      statusCode: 500,
      responseAudio: responseAudio,
    };
  }
};
