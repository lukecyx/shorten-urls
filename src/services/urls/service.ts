import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { ReturnValue } from "@aws-sdk/client-dynamodb";

import { getDynamoClient } from "~/lib/dynamo";
import { encodeBase62 } from "./encode";

export async function redirect(shortUrl: string) {
  const dyamoClient = getDynamoClient();
  const params = {
    TableName: "urls",
    Key: {
      shortUrl,
    },
  };

  try {
    console.log("getting from dynamo with params :: ", JSON.stringify(params));
    const item = await dyamoClient.send(new GetCommand(params));
    console.log("item fetched from dynamo :: ", item);
  } catch (error) {
    console.log("error happened at urls.redirect ", error);
  }
}

export async function createUrl(longUrl: string) {
  const dyamoClient = getDynamoClient();

  const nextIdParams = {
    TableName: "url_counter",
    Key: {
      counter_id: "global",
    },
    UpdateExpression: "ADD url_count :inc",
    ExpressionAttributeValues: {
      ":inc": 1,
    },
    ReturnValues: ReturnValue.UPDATED_NEW,
  };

  const result = await dyamoClient.send(new UpdateCommand(nextIdParams));
  console.log("result", result.Attributes);
  // if (nextId.Item) {
  // const value = unmarshall(nextId.Item);
  // console.log("value");
  // }

  const shortUrl = encodeBase62(result.Attributes?.url_count);
  console.log("shortUrl", shortUrl);

  const params = {
    TableName: "urls",
    Item: {
      longUrl,
      shortUrl: "a",
      createdAt: new Date().toISOString(),
    },
  };

  try {
    dyamoClient.send(new PutCommand(params));
    console.log("new item added to dynamo :: ", JSON.stringify(params));
  } catch (error) {
    console.log("error happened in urls.createUrl", error);
  }
}

createUrl("google.co.uk");
