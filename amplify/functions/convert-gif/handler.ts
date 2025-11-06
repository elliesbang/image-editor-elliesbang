export const handler = async (event) => {
  try {
    const { frames } = JSON.parse(event.body || "{}"); // base64 배열
    if (!frames || !Array.isArray(frames))
      return { statusCode: 400, body: JSON.stringify({ error: "GIF 프레임이 없습니다." }) };

    return { statusCode: 200, body: JSON.stringify({ message: "convert-gif 함수 호출 성공" }) };
  } catch (error) {
    console.error("convert-gif error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
