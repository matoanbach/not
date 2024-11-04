import * as dotenv from "dotenv";
dotenv.config();
// db.config.js
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

// Set up DynamoDB client
const client = new DynamoDBClient({
  region: "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const db = DynamoDBDocument.from(client);

const TABLE_NAME = "jobs";

export { db, TABLE_NAME };
