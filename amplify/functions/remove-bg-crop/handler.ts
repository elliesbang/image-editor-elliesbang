import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import sharp from "sharp";

const client = new BedrockRuntimeClient({ region: "us-east-1" });

export const handler = async (event) => {
  try {
    const { imageBase64 } = JSON.parse(event.body || "{}");
    if (!imageBase64) return { statusCode: 400, body: JSON.stringify({ error: "이미지가 없습니다." }) };

    const command = new InvokeModelCommand({
      modelId: "stability.stable-diffusion-xl-v1",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        taskType: "imageToImage",
        inputImage: imageBase64,
        prompt: "Remove background and crop tightly around the main subject.",
        imageGenerationConfig: { numberOfImages: 1, quality: "high" },
      }),
    });

    const res = await client.send(command);
    const parsed = JSON.parse(new TextDecoder().decode(res.body));
    const base64Image = parsed?.artifacts?.[0]?.base64 ?? parsed?.images?.[0]?.base64;
    const imgBuffer = Buffer.from(base64Image, "base64");

    const metadata = await sharp(imgBuffer).metadata();
    const side = Math.min(metadata.width, metadata.height);

    const cropped = await sharp(imgBuffer)
      .extract({
        left: (metadata.width - side) / 2,
        top: (metadata.height - side) / 2,
        width: side,
        height: side,
      })
      .toBuffer();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: `data:image/png;base64,${cropped.toString("base64")}` }),
    };
  } catch (err) {
    console.error("remove-bg-crop error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
