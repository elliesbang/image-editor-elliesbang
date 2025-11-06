import sharp from "sharp";

export const handler = async (event) => {
  try {
    const { imageBase64, strength = 0.5 } = JSON.parse(event.body || "{}");
    if (!imageBase64) return { statusCode: 400, body: JSON.stringify({ error: "이미지가 없습니다." }) };

    const img = Buffer.from(imageBase64.split(",")[1], "base64");
    const buffer = await sharp(img).blur(strength * 5).toBuffer();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: `data:image/png;base64,${buffer.toString("base64")}` }),
    };
  } catch (err) {
    console.error("denoise error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
