const AWS = require("aws-sdk");
const s3 = new AWS.S3();

module.exports.testReturnAudio = async (event) => {
  // Define bucket and key (hardcoded for testing purposes, can be fetched from event as well)
  console.log(event);
  const bucketName = "audio-files-mit";
  const objectKey = "pruebaAudio.mp3";

  try {
    // Retrieve the MP3 file from S3
    const s3Response = await s3
      .getObject({
        Bucket: bucketName,
        Key: objectKey,
      })
      .promise();

    // Encode the content in base64
    const encodedMp3 = s3Response.Body.toString("base64");

    // Return the encoded MP3 content in the response
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${objectKey}"`,
      },
      isBase64Encoded: true,
      body: encodedMp3,
    };
  } catch (error) {
    // Return an error message if something goes wrong
    return {
      statusCode: 500,
      body: JSON.stringify(`Error: ${error.message}`),
    };
  }
};
