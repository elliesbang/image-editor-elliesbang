import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: "us-east-1" });

export const handler = async (event) => {
  try {
    const { imageBase64 } = JSON.parse(event.body || "{}");
    if (!imageBase64) return { statusCode: 400, body: JSON.stringify({ error: "이미지가 없습니다." }) };

    const command = new InvokeModelCommand({
      modelId: "amazon.titan-image-generator-v1",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        taskType: "imageCaptioning",
        inputImage: imageBase64,
      }),
    });

    const res = await client.send(command);
    const parsed = JSON.parse(new TextDecoder().decode(res.body));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: parsed?.captions ?? [] }),
    };
  } catch (err) {
    console.error("analyze error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
