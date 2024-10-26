const axios = require("axios");
const AWS = require("aws-sdk");
const fs = require("fs");
const FormData = require("form-data");
const path = require("path");

// Inicializar el cliente de S3
const s3 = new AWS.S3();

const openaiApiKey = process.env.OPENAI_API_KEY;

// Función principal de Lambda
exports.handler = async (event) => {
  try {
    // Obtener el nombre del archivo de audio desde el evento
    const bucketName = event.bucketName; // Nombre del bucket de S3
    const fileKey = event.fileKey; // Nombre del archivo en S3

    if (!bucketName || !fileKey) {
      throw new Error(
        "El nombre del bucket y el nombre del archivo son obligatorios."
      );
    }

    // Descargar el archivo de S3
    const archivoLocal = `/tmp/${path.basename(fileKey)}`;
    await descargarDeS3(bucketName, fileKey, archivoLocal);

    // Transcribir el archivo de audio
    const textoTranscrito = await transcribirAudio(archivoLocal);
    if (!textoTranscrito) {
      throw new Error("No se pudo transcribir el audio.");
    }
    console.log(`Texto transcrito: ${textoTranscrito}`);

    // Generar la consulta SQL a partir del texto transcrito
    const querySql = await generarQuerySql(textoTranscrito);
    if (!querySql) {
      throw new Error("No se pudo generar la consulta SQL.");
    }
    console.log(`Consulta SQL generada: ${querySql}`);

    // Respuesta exitosa
    return {
      statusCode: 200,
      body: JSON.stringify({
        textoTranscrito: textoTranscrito,
        querySql: querySql,
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

// Descargar el archivo de S3
async function descargarDeS3(bucketName, fileKey, destinoLocal) {
  const params = {
    Bucket: bucketName,
    Key: fileKey,
  };

  const fileStream = fs.createWriteStream(destinoLocal);

  return new Promise((resolve, reject) => {
    s3.getObject(params)
      .createReadStream()
      .pipe(fileStream)
      .on("finish", resolve)
      .on("error", reject);
  });
}

// Transcribir audio a texto usando Whisper de OpenAI
async function transcribirAudio(audioFilePath) {
  try {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(audioFilePath));
    formData.append("model", "whisper-1");

    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          ...formData.getHeaders(),
        },
      }
    );

    return response.data.text; // Retornar el texto transcrito
  } catch (error) {
    console.error(
      "Error al transcribir el audio:",
      error.response ? error.response.data : error.message
    );
    return null;
  }
}
