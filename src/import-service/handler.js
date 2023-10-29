"use strict";

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const csv = require("csv-parser");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const FILE_QUERY_PARAM = process.env.FILE_NAME_PARAMETER;
const IMPORT_BUCKET_NAME = process.env.IMPORT_BUCKET_NAME;
const client = new S3Client({ region: "eu-central-1" });
const sqsClient = new SQSClient({ region: "eu-central-1" });

module.exports.getSignedProductImportUrl = async function (
  event,
  context,
  callback
) {
  const fileName = event.queryStringParameters[FILE_QUERY_PARAM];
  const command = new PutObjectCommand({
    Bucket: IMPORT_BUCKET_NAME,
    Key: `uploaded/${fileName}`,
  });

  const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

  callback(null, JSON.stringify(signedUrl));
};

module.exports.parseProductCsv = async function (event, context, callback) {
  const Key = event.Records[0].s3.object.key; //Can only handle 1 file upload, too lazy to write a for loop and print all. Maybe even safer for my wallet this way with the cloudwatch logging!

  const command = new GetObjectCommand({
    Bucket: IMPORT_BUCKET_NAME,
    Key,
  });

  const file = await client.send(command);
  const parser = csv();

  parser.on("data", async (product) => {
    const cmd = new SendMessageCommand({
      QueueUrl:
        "https://sqs.eu-central-1.amazonaws.com/135024919331/product-service-dev-catalogItemsQueue-k5LMSXnz6PsP",
      MessageBody: JSON.stringify(product),
    });

    await sqsClient.send(cmd);
  });

  file.Body.pipe(parser);

  callback(null, 201);
};
