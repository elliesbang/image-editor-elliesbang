import sharp from "sharp";

export const handler = async (event) => {
  try {
    const { imageBase64 } = JSON.parse(event.body || "{}");
    if (!imageBase64) return { statusCode: 400, body: JSON.stringify({ error: "이미지가 없습니다." }) };

    const img = Buffer.from(imageBase64.split(",")[1], "base64");
    const svgBuffer = await sharp(img).toFormat("svg").toBuffer();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: `data:image/svg+xml;base64,${svgBuffer.toString("base64")}` }),
    };
  } catch (err) {
    console.error("convert-svg error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
