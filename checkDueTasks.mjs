import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const snsClient = new SNSClient({});

// Replace with your own SNS Topic ARN when deploying
const TOPIC_ARN = "YOUR_SNS_TOPIC_ARN_HERE";

export const handler = async () => {
  const todayStr = new Date().toISOString().slice(0, 10);

  const result = await docClient.send(new ScanCommand({
    TableName: "Tasks",
    FilterExpression: "dueDate = :today AND completed = :notDone",
    ExpressionAttributeValues: { ":today": todayStr, ":notDone": false }
  }));

  const dueTasks = result.Items || [];

  if (dueTasks.length === 0) {
    return { message: "No tasks due today." };
  }

  const messageBody = dueTasks.map(t => `- ${t.title}`).join("\n");

  await snsClient.send(new PublishCommand({
    TopicArn: TOPIC_ARN,
    Subject: `You have ${dueTasks.length} task(s) due today`,
    Message: `Tasks due today:\n\n${messageBody}`
  }));

  return { message: `Sent reminder for ${dueTasks.length} task(s).` };
};
