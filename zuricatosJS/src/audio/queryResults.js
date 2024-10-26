const AWS = require("aws-sdk");

module.exports.analyzeQueryResults = async (event) => {
  let data = event.data;

  const lambda = new AWS.Lambda();
  const lambdaParams = {
    FunctionName: "nanostores-dev-textToSpeech",
    Payload: JSON.stringify({ text: "Hola, este es un flujo completo" }),
  };

  const lambdaResponse = await lambda.invoke(lambdaParams).promise();
  console.log(lambdaResponse);
  const responseBody = JSON.parse(lambdaResponse.Payload);
  console.log(responseBody);
};
