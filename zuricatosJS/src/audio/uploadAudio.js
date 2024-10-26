const AWS = require("aws-sdk");
const parser = require("lambda-multipart-parser");

// Initialize the S3 client
const s3 = new AWS.S3({ region: "us-east-2" });

/**
 * Uploads a given file to an S3 bucket and returns a direct link
 * @param {Object} file - The file to upload
 * @param {string} bucketName - The name of the S3 bucket
 * @returns {string} - A direct URL to access the file
 */

async function uploadToS3(file, bucketName) {
  try {
    // Create a unique key using a timestamp and sanitized filename
    const timestamp = Date.now();
    const key = `${file.filename.replace(/\s+/g, "")}`;

    // Upload file to S3
    await s3
      .putObject({
        Bucket: bucketName,
        Key: key,
        Body: file.content,
        ContentType: file.contentType,
      })
      .promise();

    // Return a direct link to the uploaded file
    const url = `https://${bucketName}.s3.amazonaws.com/${key}`;
    console.log("File uploaded successfully. URL:", url);

    return url;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

module.exports.uploadAudio = async (event) => {
  const bucketName = "audio-files-mit";
  console.log("Event received:", JSON.stringify(event)); // Log the event

  try {
    // Parse the multipart form data from the event
    const parsedData = await parser.parse(event);
    console.log("Parsed data:", parsedData);

    // Check if any files were uploaded
    if (!parsedData.files || parsedData.files.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "No file uploaded" }),
      };
    }

    // Get the first file (assumes only one file is uploaded)
    const file = parsedData.files[0];
    console.log("Uploading file:", file.filename);

    // Upload to S3 and get the file URL
    const fileUrl = await uploadToS3(file, bucketName);

    // Return success response with the file URL
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "File uploaded successfully",
        fileUrl: fileUrl,
      }),
    };
  } catch (error) {
    console.error("Error handling file upload:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error uploading file" }),
    };
  }
};
