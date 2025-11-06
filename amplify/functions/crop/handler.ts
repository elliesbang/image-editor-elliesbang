import sharp from "sharp";

export const handler = async (event) => {
  try {
    const { imageBase64 } = JSON.parse(event.body || "{}");
    if (!imageBase64) return { statusCode: 400, body: JSON.stringify({ error: "이미지가 없습니다." }) };

    const img = Buffer.from(imageBase64.split(",")[1], "base64");
    const metadata = await sharp(img).metadata();

    const { width, height } = metadata;
    const side = Math.min(width, height);

    const buffer = await sharp(img)
      .extract({ left: (width - side) / 2, top: (height - side) / 2, width: side, height: side })
      .toBuffer();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: `data:image/png;base64,${buffer.toString("base64")}` }),
    };
  } catch (err) {
    console.error("crop error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
