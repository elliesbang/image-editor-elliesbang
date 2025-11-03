import OpenAI from "openai";

export const onRequestPost = async ({ request, env }) => {
  try {
    const body = await request.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "이미지가 없습니다." }),
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    // ✅ Base64 → 이미지 입력 (직접 바이너리 전달)
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "이 이미지를 보고 핵심 키워드 10개를 한국어로 추출해줘. 쉼표로 구분해줘.",
            },
            {
              type: "image",
              image_data: imageBase64, // ✅ Base64 직접 전달
            },
          ],
        },
      ],
    });

    // ✅ 결과 파싱
    const result =
      response.output?.[0]?.content?.[0]?.text?.trim() ||
      "키워드를 찾을 수 없습니다.";

    return new Response(JSON.stringify({ result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🚨 analyze 오류:", err);
    return new Response(
      JSON.stringify({ error: "OpenAI 분석 실패", detail: err.message }),
      { status: 500 }
    );
  }
};
