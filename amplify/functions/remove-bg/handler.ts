export const handler = async (event) => {
  try {
    const { imageBase64 } = JSON.parse(event.body || "{}");
    if (!imageBase64)
      return { statusCode: 400, body: JSON.stringify({ error: "이미지가 없습니다." }) };

    // TODO: AWS Bedrock or OpenAI로 배경제거 로직 추가
    return { statusCode: 200, body: JSON.stringify({ message: "remove-bg 함수 호출 성공" }) };
  } catch (error) {
    console.error("remove-bg error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
