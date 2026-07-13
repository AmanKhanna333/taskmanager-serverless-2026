import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { taskId, completed } = body;
    const userId = event.requestContext.authorizer.jwt.claims.sub;

    const existing = await docClient.send(new GetCommand({
      TableName: "Tasks",
      Key: { taskId }
    }));
    const task = existing.Item;

    if (!task || task.userId !== userId) {
      return { statusCode: 403, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Not your task" }) };
    }

    let updateExpr, exprValues;

    if (completed && task.repeat && task.repeat !== "none") {
      // Recurring task checked off: push due date forward, keep it active
      const daysToAdd = task.repeat === "weekly" ? 7 : 1;
      const base = task.dueDate ? new Date(task.dueDate + "T00:00:00") : new Date();
      base.setDate(base.getDate() + daysToAdd);
      const newDueDate = base.toISOString().slice(0, 10);

      updateExpr = "SET completed = :completed, dueDate = :dueDate";
      exprValues = { ":completed": false, ":dueDate": newDueDate, ":userId": userId };
    } else {
      updateExpr = "SET completed = :completed";
      exprValues = { ":completed": completed, ":userId": userId };
    }

    await docClient.send(new UpdateCommand({
      TableName: "Tasks",
      Key: { taskId },
      UpdateExpression: updateExpr,
      ConditionExpression: "userId = :userId",
      ExpressionAttributeValues: exprValues
    }));

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Task updated" })
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
