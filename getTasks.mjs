import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.jwt.claims.sub;

    const result = await docClient.send(new ScanCommand({
      TableName: "Tasks",
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": userId }
    }));

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(result.Items)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
