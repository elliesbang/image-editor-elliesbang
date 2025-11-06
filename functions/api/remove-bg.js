import AWS from "aws-sdk";
import sharp from "sharp";

const rekognition = new AWS.Rekognition();

export const handler = async (event) => {
  try {
    const { imageBase64 } = JSON.parse(event.body);
    const buffer = Buffer.from(imageBase64.split(",")[1], "base64");

    const result = await rekognition.detectLabels({
      Image: { Bytes: buffer },
      MinConfidence: 70,
    }).promise();

    const mainObj = result.Labels.flatMap(l => l.Instances || [])
      .sort((a, b) => b.Confidence - a.Confidence)[0];

    if (!mainObj) throw new Error("피사체를 찾지 못했습니다.");

    const image = sharp(buffer);
    const metadata = await image.metadata();
    const left = Math.floor(mainObj.BoundingBox.Left * metadata.width);
    const top = Math.floor(mainObj.BoundingBox.Top * metadata.height);
    const width = Math.floor(mainObj.BoundingBox.Width * metadata.width);
    const height = Math.floor(mainObj.BoundingBox.Height * metadata.height);

    const cropped = await image.extract({ left, top, width, height }).toBuffer();
    const transparent = await sharp(cropped)
      .flatten({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        result: `data:image/png;base64,${transparent.toString("base64")}`,
      }),
    };
  } catch (err) {
    console.error("remove-bg 오류:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};