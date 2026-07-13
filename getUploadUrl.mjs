import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const s3 = new S3Client({ region: "ap-south-1" });
const BUCKET_NAME = "aman-taskmanager-uploads";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { fileName, fileType } = body;
    const userId = event.requestContext.authorizer.jwt.claims.sub;

    const key = `${userId}/${randomUUID()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ uploadUrl, key })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
