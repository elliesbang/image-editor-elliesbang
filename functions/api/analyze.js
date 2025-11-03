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

    // ✅ OpenAI API 직접 호출 (SDK 없이)
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // ✅ 최신 & Cloudflare-friendly 모델
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: "이 이미지를 보고 핵심 키워드 10개를 한국어로 추출해줘. 쉼표로 구분해줘.",
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

    if (!res.ok) {
      throw new Error(
        `OpenAI API 오류 (${res.status}): ${data.error?.message || "알 수 없는 오류"}`
      );
    }

    // ✅ 결과 텍스트 추출
    const result =
      data.output?.[0]?.content?.[0]?.text?.trim() ||
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
