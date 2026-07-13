import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { title, dueDate, fileKey, repeat } = body;
    const userId = event.requestContext.authorizer.jwt.claims.sub;

    const task = {
      taskId: randomUUID(),
      userId,
      title,
      dueDate: dueDate || null,
      fileKey: fileKey || null,
      repeat: repeat || "none",
      completed: false,
      createdAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({ TableName: "Tasks", Item: task }));

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(task)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
