"use strict";

const SECRET = process.env.gyurivukman;

function decodeToken(authHeaders) {
  const token = authHeaders.split("Basic ")[1];
  return Buffer.from(token, "base64").toString("ascii");
}

async function checkAuthorization(event, context, callback) {
  const authHeaders = event.headers["Authorization"];

  if (!authHeaders) {
    callback("Unauthorized");
  }

  const decodedToken = decodeToken(authHeaders);
  const [user, secret] = decodedToken.split(":");
  if (process.env[user] !== secret) {
    callback(null, generatePolicy(user, "Deny", event.methodArn));
  }

  callback(null, generatePolicy(user, "Allow", event.methodArn));
}

function generatePolicy(user, effect, resource) {
  const authResponse = {
    principalId: user,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        { Action: "execute-api:Invoke", Effect: effect, Resource: resource },
      ],
    },
  };

  return authResponse;
}

module.exports.hello = async (event) => checkAuthorization(event);
