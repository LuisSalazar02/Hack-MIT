const AWS = require("aws-sdk");
const axios = require("axios");

// Inicializar la API Key de OpenAI desde las variables de entorno
const openaiApiKey = process.env.OPENAI_API_KEY;

module.exports.analyzeQueryResults = async (event) => {
  try {
    let data = event.data;
    if (!data) {
      throw new Error("No se proporcionaron datos para analizar.");
    }

    // Convertir los resultados de la consulta a texto para el resumen
    const textoParaResumen = JSON.stringify(data);

    // Obtener un resumen del texto usando OpenAI
    const resumen = await obtenerResumen(textoParaResumen);

    // Invocar la Lambda textToSpeech con el resumen
    const lambda = new AWS.Lambda();
    const lambdaParams = {
      FunctionName: "nanostores-dev-textToSpeech",
      InvocationType: "RequestResponse",
      Payload: JSON.stringify({ text: resumen }),
    };

    const lambdaResponse = await lambda.invoke(lambdaParams).promise();
    const responseBody = JSON.parse(lambdaResponse.Payload);
    console.log(responseBody);

    // Acceder a la respuesta de audio
    const responseAudio = responseBody.responseAudio;
    console.log("Clave de audio en S3:", responseAudio);

    return {
      statusCode: 200,
      responseAudio: responseAudio,
    };
  } catch (error) {
    console.error("Error en el proceso:", error.message);
    return {
      statusCode: 500,
      error: error.message,
    };
  }
};

// Función para obtener un resumen usando la API de OpenAI
async function obtenerResumen(texto) {
  try {
    const prompt = `Por favor, resume el siguiente texto: ${texto}`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          { role: "system", content: "Eres un asistente que resume textos." },
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

    const resumen = response.data.choices[0].message.content.trim();
    console.log("Resumen generado por OpenAI:", resumen);

    return resumen;
  } catch (error) {
    console.error("Error al obtener el resumen de OpenAI:", error.response ? error.response.data : error.message);
    throw new Error("No se pudo generar el resumen.");
  }
}
