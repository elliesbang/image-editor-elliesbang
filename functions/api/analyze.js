export const onRequestPost = async ({ request, env }) => {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "이미지가 없습니다." }),
        { status: 400 }
      );
    }

    // ✅ OpenAI REST API 호출
    const cleanBase64 = imageBase64.replace(
      /^data:image\/[a-zA-Z0-9+.-]+;base64,/,
      ""
    );

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
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
                image_url: `data:image/png;base64,${cleanBase64}`,
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`OpenAI API 호출 실패: ${detail}`);
    }

    const data = await res.json();

    const message = data.output?.find((item) => item.type === "message");
    const textContent = message?.content?.find(
      (entry) => entry.type === "output_text"
    );
    const result = textContent?.text?.trim() || "키워드를 찾을 수 없습니다.";

    return new Response(JSON.stringify({ result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🚨 analyze 오류:", err);
    return new Response(
      JSON.stringify({ error: "OpenAI API 호출 실패", detail: err.message }),
      { status: 500 }
    );
  }
};
