const axios = require("axios");
const AWS = require("aws-sdk");
const fs = require("fs");
const FormData = require("form-data");
const path = require("path");
const { Client } = require("pg");

// Inicializar el cliente de S3
const s3 = new AWS.S3();

const openaiApiKey = process.env.OPENAI_API_KEY;

module.exports.generateQuery = async (event) => {
  try {
    const { textoTranscrito } = JSON.parse(event.body);

    console.log(`Texto transcrito: ${textoTranscrito}`);

    // Determinar el tipo de operación
    let querySql = "";
    if (textoTranscrito.includes("añade")) {
      querySql = await generarQuerySql(textoTranscrito, "compra");
    } else if (textoTranscrito.includes("vendí")) {
      querySql = await generarQuerySql(textoTranscrito, "venta");
    } else if (textoTranscrito.includes("fié") || textoTranscrito.includes("me debe") || textoTranscrito.includes("presté")) {
      querySql = await generarQuerySql(textoTranscrito, "fianza");
    }

    if (!querySql) throw new Error("No se pudo generar la consulta SQL.");
    console.log(`Consulta SQL generada: ${querySql}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        queryEjecutada: querySql
      }),
    };
  } catch (error) {
    console.error("Error en el proceso:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
      }),
    };
  }
};

// Generar consulta SQL en PostgreSQL usando GPT-4
async function generarQuerySql(textoTranscrito, tipoOperacion) {
  try {
    let prompt = "";
    if (tipoOperacion === "compra") {
      prompt = `Genera una consulta SQL de inserción para añadir productos al inventario según este texto: ${textoTranscrito}.`;
    } else if (tipoOperacion === "venta") {
      prompt = `Genera una consulta SQL para registrar una venta y disminuir la cantidad de productos en el inventario según este texto: ${textoTranscrito}.`;
    } else if (tipoOperacion === "fianza") {
      prompt = `Genera una consulta SQL para registrar una fianza de productos y verificar si el deudor existe en la base de datos según este texto: ${textoTranscrito}.`;
    }

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Eres un asistente experto en SQL para bases de datos PostgreSQL.",
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
    console.error("Error al generar la consulta SQL:", error.response ? error.response.data : error.message);
    return null;
  }
}
