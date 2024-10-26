const AWS = require("aws-sdk");
const polly = new AWS.Polly();
const s3 = new AWS.S3();

module.exports.textToSpeech = async (event) => {
  try {
    // Retrieve the text to convert from event data
    const text = event.data;
    const bucketName = "audio-files-mit";

    // Set up Polly parameters
    const params = {
      Text: text,
      OutputFormat: "mp3",
      VoiceId: "Lucia", // Spanish voice; you can also try "Enrique" or "Conchita" for other accents
      LanguageCode: "es-ES", // Language code for Spanish (Spain)
    };

    // Call Polly to synthesize the speech
    const pollyResponse = await polly.synthesizeSpeech(params).promise();

    // Check for audio in the response
    if (pollyResponse.AudioStream) {
      // Get current date and time for unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      // Prepare file details
      const file = {
        filename: `responseAudio_${timestamp}.mp3`,
        content: pollyResponse.AudioStream,
        contentType: "audio/mp3",
      };

      // Upload audio file to S3
      const s3Key = await uploadToS3(file, bucketName);

      // Return success response with S3 file key
      return {
        statusCode: 200,
        responseAudio: s3Key,
      };
    } else {
      throw new Error("Polly did not return audio data.");
    }
  } catch (error) {
    console.error("Error generating speech:", error);
    return {
      statusCode: 500,
      responseAudio: "",
    };
  }
};

// Auxiliary function to upload to S3
async function uploadToS3(file, bucketName) {
  try {
    const key = file.filename.replace(/\s+/g, "");

    // Upload file to S3
    await s3
      .putObject({
        Bucket: bucketName,
        Key: key,
        Body: file.content,
        ContentType: file.contentType,
      })
      .promise();

    // Return the S3 key for reference
    console.log("File uploaded successfully. Key:", key);
    return key;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}
