const axios = require("axios");
const dbPool = require("./dbPool");

module.exports.scanProduct = async (event) => {
  const { barcode } = JSON.parse(event.body);
  let client;

  try {
    const response = await axios.get(
      `https://api.barcodelookup.com/v3/products?barcode=${barcode}&formatted=y&key=rhrn0cnwx76fxu8meyug0xz377rm1w`
    );
    client = await dbPool.connect();
    const result = await client.query(
      "INSERT INTO productos (producto_nombre, marca, precio_compra, cantidad) VALUES ($1, $2, $3, $4)",
      [
        response.data.products[0].title,
        response.data.products[0].brand,
        response.data.products[0].stores[0].price,
        1,
      ]
    );
  } catch (error) {
    return {
      statusCode: 400,
      body: `Query execution failed: ${error.message}`,
    };
  } finally {
    if (client) {
      client.release();
    }
  }
};
