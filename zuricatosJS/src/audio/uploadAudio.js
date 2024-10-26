const AWS = require("aws-sdk");
const Busboy = require("busboy");
const s3 = new AWS.S3();

module.exports.uploadAudio = async (event) => {
  const bucketName = "audio-files-mit";

  return new Promise((resolve, reject) => {
    const busboy = new Busboy({
      headers: {
        "content-type":
          event.headers["Content-Type"] || event.headers["content-type"],
      },
    });

    let uploadParams = {
      Bucket: bucketName,
      Key: "", // This will be filled with the uploaded file's name
      Body: null,
    };

    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      uploadParams.Key = filename;
      uploadParams.Body = file;
    });

    busboy.on("finish", async () => {
      try {
        const data = await s3.upload(uploadParams).promise();
        resolve({
          statusCode: 200,
          body: JSON.stringify({
            message: "File uploaded successfully",
            fileUrl: data.Location,
          }),
        });
      } catch (error) {
        reject({
          statusCode: 500,
          body: JSON.stringify({
            message: "Error uploading file",
            error: error.message,
          }),
        });
      }
    });

    busboy.write(Buffer.from(event.body, "base64"));
    busboy.end();
  });
};
