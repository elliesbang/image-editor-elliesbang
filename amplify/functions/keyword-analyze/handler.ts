import fetch from "node-fetch";

export const handler = async (event) => {
  try {
    const { text } = JSON.parse(event.body || "{}");
    if (!text)
      return { statusCode: 400, body: JSON.stringify({ error: "분석할 텍스트가 없습니다." }) };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "너는 짧은 키워드 추출기야." },
          { role: "user", content: `이 문장에서 핵심 키워드 10개만 추출해줘: ${text}` },
        ],
      }),
    });

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "키워드 없음";

    return { statusCode: 200, body: JSON.stringify({ keywords: result }) };
  } catch (error) {
    console.error("keyword-analyze error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
