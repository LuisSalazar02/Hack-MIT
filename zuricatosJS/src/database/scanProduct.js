const axios = require("axios");
const dbPool = require("./dbPool");
const Quagga = require("@ericblade/quagga2");
const parser = require("lambda-multipart-parser");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const fs = require("fs");

module.exports.scanProduct = async (event) => {
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
  const fileBuffer = file.content; // Assuming the parser returns the file content as a buffer

  try {
    const params = {
      Bucket: "barcode-image-files",
      Key: "photo.jpg", // The desired name for the file in S3
      Body: fileBuffer,
      ContentType: "image/jpeg", // Adjust based on file type
    };

    const result = await s3.upload(params).promise();
    console.log("File uploaded successfully:", result.Location);

    const downloadParams = {
      Bucket: "barcode-image-files",
      Key: "photo.jpg",
    };
    const localPath = "/tmp/photo.jpg";
    const s3Object = await s3.getObject(downloadParams).promise();
    fs.writeFileSync(localPath, s3Object.Body);

    console.log("File downloaded to:", localPath);

    Quagga.decodeSingle(
      {
        src: localPath, // Path to your image
        numOfWorkers: 0, // 0 for Node.js (no web workers)
        inputStream: {
          size: 800, // Set the size of the input
        },
        decoder: {
          readers: ["ean_reader"], // Use the EAN reader for EAN-13
        },
        locate: true, // Improves detection accuracy
      },
      async (result) => {
        if (result && result.codeResult) {
          console.log("EAN-13 Code:", result.codeResult.code);
          let client;
          try {
            // Fetch product data from external API
            const apiResponse = await axios.get(
              `https://api.barcodelookup.com/v3/products?barcode=${result.codeResult.code}&formatted=y&key=rhrn0cnwx76fxu8meyug0xz377rm1w`
            );

            const product = apiResponse.data.products[0];

            client = await dbPool.connect();

            // Insert product data into the database
            await client.query(
              "INSERT INTO productos (producto_nombre, marca, precio_compra, cantidad) VALUES ($1, $2, $3, $4)",
              [product.title, product.brand, product.stores[0].price, 1]
            );

            return {
              statusCode: 200,
              body: "Product registered successfully",
            };
          } catch (error) {
            console.error("Error during API/database operation:", error);
            reject({
              statusCode: 500,
              body: `Error: ${error.message}`,
            });
          } finally {
            if (client) {
              client.release();
            }
          }
        } else {
          console.error("Barcode not found or could not be read");
        }
      }
    );
  } catch (error) {
    console.error("Error uploading file:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to upload file",
        error: error.message,
      }),
    };
  }
};
