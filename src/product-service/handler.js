"use strict";
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");
const { randomUUID } = require("crypto");

const dbClient = new DynamoDBClient({ region: "eu-central-1" });
const docClient = DynamoDBDocumentClient.from(dbClient);

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const STOCKS_TABLE = process.env.STOCKS_TABLE;

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
  const result = await createProduct(event.body);

  callback(null, JSON.stringify(result));
};

module.exports.catalogBatchProcess = async function (event, context, callback) {
  for (let sqsProductEvent of event.Records) {
    await createProduct(sqsProductEvent.body);
  }

  return { batchItemFailures: [] };
};

const createProduct = async function (rawProductJSON) {
  const generatedID = randomUUID();
  const { title, description, count, price } = JSON.parse(rawProductJSON);
  const putProduct = new PutCommand({
    TableName: PRODUCTS_TABLE,
    Item: { id: generatedID, title, description, price },
  });

  const putStock = new PutCommand({
    TableName: STOCKS_TABLE,
    Item: { product_id: generatedID, count: count ?? 0 },
  });

  await docClient.send(putProduct);
  await docClient.send(putStock);

  return { id: generatedID, title, description, count, price };
};
