import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: "ap-south-1" });
const BUCKET_NAME = "aman-taskmanager-uploads";

export const handler = async (event) => {
  try {
    const key = event.queryStringParameters.key;

    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    const viewUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ viewUrl })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
