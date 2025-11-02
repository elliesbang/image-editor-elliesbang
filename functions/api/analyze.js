// ✅ functions/analyze.js
import { parseImageInput } from "./_sharedImageHandler";

export const onRequestPost = async ({ request, env }) => {
  try {
    const imageBase64 = await parseImageInput(request);
    const apiKey = env.OPENAI_API_KEY;

    // ✅ OpenAI API 호출
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini", // ✅ 이미지 분석 가능한 모델
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: "이 이미지의 주요 객체, 배경, 색상, 분위기를 설명하는 10개의 키워드를 한글로 추출하세요.",
              },
              {
                type: "input_image",
                image_url: `data:image/png;base64,${imageBase64}`,
              },
            ],
          },
        ],
      }),
    });

    const data = await res.json();
    const text = data?.output?.[0]?.content?.[0]?.text || "";

    // ✅ 결과를 키워드 배열로 정리
    const keywords = text
      .split(/[,，\n]/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    return new Response(JSON.stringify({ success: true, keywords }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze 오류:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
