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

    // ✅ 올바른 입력 형식 (Responses API)
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "이 이미지를 분석하고 핵심 키워드 10개를 한국어로 추출해줘. 쉼표로 구분해줘.",
            },
            {
              type: "input_image",
              image_url: `data:image/png;base64,${imageBase64}`,
            },
          ],
        },
      ],
    });

    const result =
      response.output?.[0]?.content?.[0]?.text?.trim() || "키워드를 찾을 수 없습니다.";

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
