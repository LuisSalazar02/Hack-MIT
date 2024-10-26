const axios = require("axios");

const openaiApiKey = process.env.OPENAI_API_KEY;

// Función principal para generar la consulta SQL basada en el texto transcrito
module.exports.generateQuery = async (event) => {
  try {
    // Parsear el cuerpo del evento para obtener el texto transcrito
    const { textoTranscrito } = JSON.parse(event.body);
    console.log(`Texto transcrito: ${textoTranscrito}`);

    // Determinar el tipo de operación (compra, venta o fianza)
    let tipoOperacion = determinarTipoOperacion(textoTranscrito);
    if (!tipoOperacion) {
      throw new Error("No se reconoció ningún comando válido en el texto.");
    }

    // Generar la consulta SQL correspondiente
    const { querySql, valores } = await generarQuerySql(textoTranscrito, tipoOperacion);
    if (!querySql) throw new Error("No se pudo generar la consulta SQL.");

    console.log(`Consulta SQL generada: ${querySql}`);
    console.log(`Valores separados: ${valores}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ queryEjecutada: querySql, valores: valores }),
    };
  } catch (error) {
    console.error("Error en el proceso:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// Función para determinar el tipo de operación basado en el texto transcrito
function determinarTipoOperacion(texto) {
  if (texto.includes("añade")) {
    return "compra";
  } else if (texto.includes("vendí")) {
    return "venta";
  } else if (texto.includes("fié") || texto.includes("me debe") || texto.includes("presté")) {
    return "fianza";
  }
  return null; // Si no se detecta un comando válido
}

// Función para generar una consulta SQL en PostgreSQL usando GPT-4
async function generarQuerySql(textoTranscrito, tipoOperacion) {
  try {
    let prompt = "";

    // Ajustar el prompt según el tipo de operación
    if (tipoOperacion === "compra") {
      prompt = `Genera una consulta SQL para insertar o actualizar productos en el inventario según este texto: ${textoTranscrito}. 
                Si el producto ya existe, actualiza la cantidad; si no, insértalo como un nuevo registro. 
                No incluyas explicaciones y separa los valores de la consulta SQL.`;
    } else if (tipoOperacion === "venta") {
      prompt = `Genera una consulta SQL para registrar una venta, disminuyendo la cantidad de productos en el inventario según este texto: ${textoTranscrito}. 
                No incluyas explicaciones y separa los valores de la consulta SQL.`;
    } else if (tipoOperacion === "fianza") {
      prompt = `Genera una consulta SQL para registrar una fianza de productos, incluyendo la verificación del deudor en la base de datos según este texto: ${textoTranscrito}. 
                No incluyas explicaciones y separa los valores de la consulta SQL.`;
    }

    // Llamar a la API de OpenAI para obtener la consulta SQL
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          { role: "system", content: "Eres un asistente experto en SQL para bases de datos PostgreSQL. Responde con la consulta SQL y separa los valores sin JSON." },
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

    // Buscar los valores separados en la respuesta
    let querySql = "";
    let valores = "";

    // Dividir la respuesta en la consulta SQL y los valores
    if (respuesta.includes("VALORES:")) {
      const partes = respuesta.split("VALORES:");
      querySql = partes[0].trim();  // La consulta SQL
      valores = partes[1].trim();   // Los valores separados
    } else {
      querySql = respuesta;  // Si no se encuentran valores separados, solo toma la consulta
    }

    return { querySql, valores };
  } catch (error) {
    console.error("Error al generar la consulta SQL:", error.response ? error.response.data : error.message);
    return { querySql: null, valores: null };
  }
}
