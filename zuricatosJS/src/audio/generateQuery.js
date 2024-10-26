const AWS = require("aws-sdk");
const axios = require("axios");
const lambda = new AWS.Lambda();

const openaiApiKey = process.env.OPENAI_API_KEY;

module.exports.generateQuery = async (event) => {
  const textoTranscrito = event.textoTranscrito.toLowerCase();
  let query = "";

  const getParsedData = async (textoTranscrito) => {
    const prompt = `
            Analyze the following text and extract product information to generate the appropriate SQL query for the PostgreSQL 'productos' table. 
            If the text indicates adding a product, ensure all fields are filled for 'producto_nombre', 'marca', 'descripcion', 'precio_compra', and 'cantidad'. 
            For "vendí" or "presté", extract 'producto_nombre' and 'cantidad' only and decrease the quantity in stock. 
            Text: "${textoTranscrito}"
            Return only the SQL query as plain text.
        `;

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "Eres un experto en SQL para PostgreSQL",
            },
            { role: "user", content: prompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      return null;
    }
  };

  const queryResult = await getParsedData(textoTranscrito);

  if (!queryResult) {
    return {
      statusCode: 400,
      body: "No matching query found for the provided input.",
      responseAudio: "noentendi.mp3",
    };
  }

  const lambdaParams = {
    FunctionName: "nanostores-dev-queryDatabase",
    InvocationType: "RequestResponse",
    Payload: JSON.stringify({ query: queryResult }),
  };

  const lambdaResponse = await lambda.invoke(lambdaParams).promise();
  console.log(lambdaResponse);
  const responseBody = JSON.parse(lambdaResponse.Payload);
  console.log(responseBody);
  // Access the responseAudio property
  const responseAudio = responseBody.responseAudio;
  console.log("Response audio key from S3:", responseAudio);

  // Respuesta exitosa
  return {
    statusCode: 200,
    responseAudio: responseAudio,
    body: JSON.stringify({
      textoTranscrito: textoTranscrito,
    }),
  };
};
