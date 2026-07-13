import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { taskId } = body;
    const userId = event.requestContext.authorizer.jwt.claims.sub;

    await docClient.send(new DeleteCommand({
      TableName: "Tasks",
      Key: { taskId },
      ConditionExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": userId }
    }));

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Task deleted" })
    };
  } catch (err) {
    const statusCode = err.name === "ConditionalCheckFailedException" ? 403 : 500;
    return {
      statusCode,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.name === "ConditionalCheckFailedException" ? "Not your task" : err.message })
    };
  }
};
