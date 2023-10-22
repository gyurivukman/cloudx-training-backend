"use strict";
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");
const dbClient = new DynamoDBClient({ region: "eu-central-1" });
const uuid = require("uuid");

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const STOCKS_TABLE = process.env.STOCKS_TABLE;

const docClient = DynamoDBDocumentClient.from(dbClient);

module.exports.getProductList = async function (event, context, callback) {
  const getProductsCommand = new ScanCommand({ TableName: PRODUCTS_TABLE });
  const getStocksCommand = new ScanCommand({ TableName: STOCKS_TABLE });

  const productsResponse = await docClient.send(getProductsCommand);
  const stocksResponse = await docClient.send(getStocksCommand);

  const responseData = productsResponse.Items.map((product) => {
    const stockCount = stocksResponse.Items.find(
      (stock) => stock.product_id == product.id
    );
    return { ...product, count: stockCount.count };
  });

  callback(null, JSON.stringify(responseData));
};

module.exports.getProductsById = async function (event, context, callback) {
  const productId = event.pathParameters.productId;
  const getProductCommand = new GetCommand({
    TableName: PRODUCTS_TABLE,
    Key: { id: productId },
  });
  const getStockCommand = new GetCommand({
    TableName: STOCKS_TABLE,
    Key: { product_id: productId },
  });

  const productsResponse = await docClient.send(getProductCommand);
  const stocksResponse = await docClient.send(getStockCommand);

  const responseData = {
    ...productsResponse.Item,
    count: stocksResponse.Item.count,
  };

  callback(null, JSON.stringify(responseData));
};

module.exports.createProduct = async function (event, context, callback) {
  const { title, description, count, price } = JSON.parse(event.body);
  const generatedID = uuid.v4();

  const putProduct = new PutCommand({
    TableName: PRODUCTS_TABLE,
    Item: { id: generatedID, title, description, price },
  });

  const putStock = new PutCommand({
    TableName: STOCKS_TABLE,
    Item: { product_id: generatedID, count },
  });

  await docClient.send(putProduct);
  await docClient.send(putStock);

  callback(
    null,
    JSON.stringify({ id: generatedID, title, description, count, price })
  );
};
