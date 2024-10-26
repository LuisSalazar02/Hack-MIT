const AWS = require("aws-sdk");
const Busboy = require("busboy");
const s3 = new AWS.S3();

module.exports.uploadAudio = async (event) => {
  const bucketName = "audio-files-mit";

  console.log("Event received:", JSON.stringify(event)); // Log the event

  new Promise((resolve, reject) => {
    const busboy = new Busboy({
      headers: {
        "content-type":
          event.headers["Content-Type"] || event.headers["content-type"],
      },
    });

    let uploadParams = {
      Bucket: bucketName,
      Key: "", // Will be set to the uploaded file's name
      Body: null,
    };

    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      console.log(`Receiving file [${fieldname}]: ${filename} (${mimetype})`); // Log file details

      uploadParams.Key = filename; // Set the file name as the S3 object key
      uploadParams.Body = file; // Set the file stream as the S3 object body

      // Add logging to capture file stream events
      file.on("data", (data) => {
        console.log(`File [${filename}] received ${data.length} bytes`);
      });

      file.on("end", () => {
        console.log(`Finished receiving file [${filename}]`);
      });
    });

    busboy.on("finish", async () => {
      console.log("Finished parsing form data");

      if (!uploadParams.Body) {
        console.error("No file body detected");
        return reject({
          statusCode: 400,
          body: JSON.stringify({
            message: "No file uploaded",
          }),
        });
      }

      try {
        console.log(
          "Uploading to S3 with parameters:",
          JSON.stringify(uploadParams)
        );
        const data = await s3.upload(uploadParams).promise();
        console.log("File uploaded successfully:", data.Location); // Log the S3 location of the file

        resolve({
          statusCode: 200,
          body: JSON.stringify({
            message: "File uploaded successfully",
            fileUrl: data.Location,
          }),
        });
      } catch (error) {
        console.error("Error uploading file to S3:", error); // Log the error if upload fails
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: "Error uploading file",
            error: error.message,
          }),
        });
      }
    });

    // Parse the incoming form data
    try {
      busboy.write(Buffer.from(event.body, "base64"));
      busboy.end();
    } catch (error) {
      console.error("Error processing form data:", error);
      reject({
        statusCode: 500,
        body: JSON.stringify({
          message: "Error processing form data",
          error: error.message,
        }),
      });
    }
  });

  return;
};
