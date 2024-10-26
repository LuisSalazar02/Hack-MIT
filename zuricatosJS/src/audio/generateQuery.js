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

    // Quitar los primeros 12 caracteres de la consulta SQL
    tipoConsulta = quitarPrimeros12Caracteres(tipoConsulta);

    // Formatear la respuesta en un solo texto corrido
    const respuestaFormateada = `{"${tipoConsulta}", "value": ${JSON.stringify(
      valores
    )}}`;

    console.log(`Respuesta formateada: ${respuestaFormateada}`);

    // Preparar los parámetros para la siguiente Lambda
    const lambda = new AWS.Lambda();
    const lambdaParams = {
      FunctionName: "nanostores-dev-queryDataBase",
      InvocationType: "RequestResponse",
      Payload: JSON.stringify({
        query: tipoConsulta, // Colocar la consulta generada
        params: valores, // Colocar los valores generados
      }),
    };

    // Invocar la siguiente Lambda
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
      prompt = `Genera una consulta SQL para insertar o actualizar productos en la tabla "productos" según este texto: ${textoTranscrito}. 
                Si el producto ya existe, actualiza la cantidad; si no, insértalo como un nuevo registro. 
                Devuelve solo la consulta SQL con los valores separados en el siguiente formato: 
                'CONSULTA: ...; VALORES: producto, cantidad'.`;
    } else if (tipoOperacion === "venta") {
      prompt = `Genera una consulta SQL para registrar una venta, disminuyendo la cantidad de productos en la tabla "productos" según este texto: ${textoTranscrito}. 
                Devuelve solo la consulta SQL con los valores separados en el siguiente formato: 
                'CONSULTA: ...; VALORES: producto, cantidad'.`;
    } else if (tipoOperacion === "fianza") {
      prompt = `Genera una consulta SQL para registrar una fianza de productos en la tabla "productos", incluyendo la verificación del deudor en la base de datos según este texto: ${textoTranscrito}. 
                Devuelve solo la consulta SQL con los valores separados en el siguiente formato: 
                'CONSULTA: ...; VALORES: deudor, producto, cantidad'.`;
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
              "Eres un asistente experto en SQL para bases de datos PostgreSQL. Responde solo con la consulta SQL y los valores separados.",
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
      tipoConsulta = partes[0].replace("inventario", "productos").trim();
      // Separar y limpiar los valores
      const valoresRaw = partes[1].trim().split(",");
      valores = valoresRaw.map((v) => v.trim().replace(/'/g, ""));
    } else {
      tipoConsulta = respuesta.replace("inventario", "productos").trim();
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

// Función para quitar los primeros 12 caracteres de una cadena
function quitarPrimeros12Caracteres(cadena) {
  if (cadena.length > 12) {
    return cadena.substring(12);
  }
  return cadena;
}
