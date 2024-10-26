const AWS = require("aws-sdk");
const polly = new AWS.Polly();

exports.textToSpeech = async (event) => {
  try {
    // Retrieve the text to convert from event data
    const text = event.data;

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
      // Convert audio stream to base64 to return in JSON response
      const audioBase64 = pollyResponse.AudioStream.toString("base64");

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "audio/mp3",
          "Content-Disposition": "attachment; filename=output.mp3",
        },
        body: audioBase64,
        isBase64Encoded: true, // Required to handle binary data in Lambda
      };
    } else {
      throw new Error("Polly did not return audio data.");
    }
  } catch (error) {
    console.error("Error generating speech:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error generating speech",
        details: error.message,
      }),
    };
  }
};
