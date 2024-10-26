const axios = require("axios");
const AWS = require("aws-sdk");

const openaiApiKey = process.env.OPENAI_API_KEY;

// Función principal para generar la consulta SQL basada en el texto transcrito
module.exports.generateQuery = async (event) => {
  try {
    // Parsear el cuerpo del evento para obtener el texto transcrito
    const textoTranscrito = event.textoTranscrito;
    console.log(`Texto transcrito: ${textoTranscrito}`);

    // Determinar el tipo de operación (compra, venta o fianza)
    let tipoOperacion = determinarTipoOperacion(textoTranscrito);
    if (!tipoOperacion) {
      throw new Error("No se reconoció ningún comando válido en el texto.");
    }

    // Generar la consulta SQL correspondiente
    let { tipoConsulta, valores } = await generarQuerySql(
      textoTranscrito,
      tipoOperacion
    );
    if (!tipoConsulta) throw new Error("No se pudo generar la consulta SQL.");

    // Formatear la consulta en el formato esperado
    const consultaFormateada = `${tipoConsulta};`;

    console.log(`Consulta formateada: ${consultaFormateada}`);

    // Preparar los parámetros para la siguiente Lambda
    const lambda = new AWS.Lambda();
    const lambdaParams = {
      FunctionName: "nanostores-dev-queryDataBase",
      InvocationType: "RequestResponse",
      Payload: JSON.stringify({
        query: consultaFormateada, // Colocar la consulta generada
        params: valores, // Colocar los valores generados
      }),
    };

    // Invocar la siguiente Lambda
    const lambdaResponse = await lambda.invoke(lambdaParams).promise();
    const responseBody = JSON.parse(lambdaResponse.Payload);
    console.log("Respuesta de la Lambda:", responseBody);

    // Access the responseAudio property
    const responseAudio = responseBody.responseAudio;
    console.log("Response audio key from S3:", responseAudio);

    return {
      statusCode: 200,
      responseAudio: responseAudio,
    };
  } catch (error) {
    console.error("Error en el proceso:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      responseAudio: "",
    };
  }
};

// Función para determinar el tipo de operación basado en el texto transcrito
function determinarTipoOperacion(texto) {
  if (texto.includes("añade") || texto.includes("Añade")) {
    return "compra";
  } else if (
    texto.includes("vendí") ||
    texto.includes("Vendí") ||
    texto.includes("vendi") ||
    texto.includes("Vendi")
  ) {
    return "venta";
  } else if (
    texto.includes("fié") ||
    texto.includes("me debe") ||
    texto.includes("presté")
  ) {
    return "fianza";
  }
  return null;
}

// Función para generar una consulta SQL en PostgreSQL usando GPT-4
async function generarQuerySql(textoTranscrito, tipoOperacion) {
  try {
    let prompt = "";

    // Ajustar el prompt según el tipo de operación
    if (tipoOperacion === "compra") {
      prompt = `Genera una consulta SQL en el formato 'UPDATE productos SET column1 = value1, column2 = value2, ... WHERE condition' para actualizar o insertar productos según este texto: ${textoTranscrito}. Si el producto ya existe, actualiza la cantidad; si no, insértalo como un nuevo registro.`;
    } else if (tipoOperacion === "venta") {
      prompt = `Genera una consulta SQL en el formato 'UPDATE productos SET column1 = value1, column2 = value2, ... WHERE condition' para registrar una venta y disminuir la cantidad de productos según este texto: ${textoTranscrito}.`;
    } else if (tipoOperacion === "fianza") {
      prompt = `Genera una consulta SQL en el formato 'UPDATE productos SET column1 = value1, column2 = value2, ... WHERE condition' para registrar una fianza de productos, incluyendo la verificación del deudor según este texto: ${textoTranscrito}.`;
    }

    // Llamar a la API de OpenAI para obtener la consulta SQL
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente experto en SQL para bases de datos PostgreSQL. Responde solo con la consulta SQL en el formato 'UPDATE' y los valores separados.",
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

    // Procesar la respuesta de GPT-4
    const respuesta = response.data.choices[0].message.content.trim();

    // Dividir la respuesta en el tipo de consulta y los valores
    let tipoConsulta = "";
    let valores = [];

    if (respuesta.includes("VALORES:")) {
      const partes = respuesta.split("VALORES:");
      tipoConsulta = partes[0].trim().toLowerCase(); // Convertir a minúsculas
      // Separar y limpiar los valores
      const valoresRaw = partes[1].trim().split(",");
      valores = valoresRaw.map((v) => v.trim().replace(/'/g, ""));
    } else {
      tipoConsulta = respuesta.trim().toLowerCase(); // Convertir a minúsculas
    }

    return { tipoConsulta, valores };
  } catch (error) {
    console.error(
      "Error al generar la consulta SQL:",
      error.response ? error.response.data : error.message
    );
    return { tipoConsulta: null, valores: null };
  }
}
