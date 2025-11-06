export const handler = async (event) => {
  try {
    const { imageBase64 } = JSON.parse(event.body || "{}");
    if (!imageBase64)
      return { statusCode: 400, body: JSON.stringify({ error: "이미지 데이터가 없습니다." }) };

    return { statusCode: 200, body: JSON.stringify({ message: "convert-svg 함수 호출 성공" }) };
  } catch (error) {
    console.error("convert-svg error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
