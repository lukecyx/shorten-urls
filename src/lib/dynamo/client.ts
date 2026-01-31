import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

let dynamoClient: DynamoDBDocumentClient | undefined;

export function getDynamoClient() {
  if (!dynamoClient) {
    dynamoClient = DynamoDBDocumentClient.from(
      new DynamoDBClient({ region: "eu-west-1" }),
    );

    return dynamoClient;
  }

  return dynamoClient;
}
