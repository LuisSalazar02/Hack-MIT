const axios = require("axios");
const dbPool = require("./dbPool");
const Quagga = require("@ericblade/quagga2");

module.exports.scanProduct = async (event) => {
  return event;
  /*return new Promise((resolve, reject) => {
    // Start barcode decoding
    Quagga.decodeSingle(
      {
        src: "photo2.jpg",
        numOfWorkers: 0,
        inputStream: { size: 800 },
        decoder: { readers: ["ean_reader"] },
        locate: true,
      },
      async (quaggaResult) => {
        if (!quaggaResult || !quaggaResult.codeResult) {
          console.error("Barcode not found or could not be read");
          return reject({
            statusCode: 400,
            body: "Barcode not found or could not be read",
          });
        }

        const barcode = quaggaResult.codeResult.code;
        let client;

        try {
          // Fetch product data from external API
          const apiResponse = await axios.get(
            `https://api.barcodelookup.com/v3/products?barcode=${barcode}&formatted=y&key=rhrn0cnwx76fxu8meyug0xz377rm1w`
          );

          const product = apiResponse.data.products[0];
          if (!product) {
            return reject({
              statusCode: 404,
              body: "Product information not found",
            });
          }

          client = await dbPool.connect();

          // Insert product data into the database
          await client.query(
            "INSERT INTO productos (producto_nombre, marca, precio_compra, cantidad) VALUES ($1, $2, $3, $4)",
            [product.title, product.brand, product.stores[0].price, 1]
          );

          resolve({
            statusCode: 200,
            body: "Product registered successfully",
          });
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
      }
    );
  });*/
};
