const axios = require("axios");
const dbPool = require("./dbPool");
const Quagga = require("@ericblade/quagga2");
const parser = require("lambda-multipart-parser");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const fs = require("fs");
const util = require("util");

// Promisify Quagga.decodeSingle for async/await usage
const decodeSingleAsync = (config) =>
  new Promise((resolve, reject) => {
    Quagga.decodeSingle(config, (result) => {
      if (result && result.codeResult) {
        resolve(result.codeResult.code);
      } else {
        reject(new Error("Barcode not found or could not be read"));
      }
    });
  });

module.exports.scanProduct = async (event) => {
  // Parse the multipart form data from the event
  const parsedData = await parser.parse(event);
  console.log("Parsed data:", parsedData);

  if (!parsedData.files || parsedData.files.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "No file uploaded" }),
    };
  }

  const file = parsedData.files[0];
  const fileBuffer = file.content;

  try {
    // Upload file to S3
    const uploadParams = {
      Bucket: "barcode-image-files",
      Key: "photo.jpg",
      Body: fileBuffer,
      ContentType: "image/jpeg",
    };
    const uploadResult = await s3.upload(uploadParams).promise();
    console.log("File uploaded successfully:", uploadResult.Location);

    // Download file to local path
    const downloadParams = { Bucket: "barcode-image-files", Key: "photo.jpg" };
    const localPath = "/tmp/photo.jpg";
    const s3Object = await s3.getObject(downloadParams).promise();
    fs.writeFileSync(localPath, s3Object.Body);
    console.log("File downloaded to:", localPath);

    // Decode barcode
    const eanCode = await decodeSingleAsync({
      src: localPath,
      numOfWorkers: 0,
      inputStream: { size: 800 },
      decoder: { readers: ["ean_reader"] },
      locate: true,
    });

    console.log("EAN-13 Code:", eanCode);

    // Fetch product data and insert into the database
    const apiResponse = await axios.get(
      `https://api.barcodelookup.com/v3/products?barcode=${eanCode}&formatted=y&key=rhrn0cnwx76fxu8meyug0xz377rm1w`
    );

    const product = apiResponse.data.products[0];
    const client = await dbPool.connect();

    try {
      await client.query(
        "INSERT INTO productos (producto_nombre, marca, precio_compra, cantidad) VALUES ($1, $2, $3, $4)",
        [product.title, product.brand, product.stores[0].price, 1]
      );
    } finally {
      client.release();
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Product registered successfully" }),
    };
  } catch (error) {
    console.error("Error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error occurred", error: error.message }),
    };
  }
};
