export const onRequestPost = async ({ request, env }) => {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64) {
      throw new Error("이미지 데이터가 없습니다.");
    }

    const apiKey = env.OPENAI_API_KEY;

    // ✅ GPT-4o Vision API 호출
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
                text: `
                당신은 이미지 분석 전문가입니다.
                아래 이미지를 보고 다음을 수행하세요:

                1️⃣ 이미지의 주요 객체, 색상, 질감, 분위기를 포함한
                    **25개의 키워드**를 쉼표로 구분해 나열하세요.
                2️⃣ 위 키워드 중 핵심적인 2~3개를 조합해 간결한 제목을 생성하세요.
                3️⃣ 이미지의 전체적인 분위기나 상황을 한 문장으로 요약 설명하세요.

                응답 형식은 반드시 JSON 형태로 반환하세요:
                {
                  "title": "제목",
                  "keywords": ["키워드1", "키워드2", ...],
                  "description": "짧은 설명"
                }
                `,
              },
              {
                type: "input_image",
                image_url: `data:image/png;base64,${imageBase64}`,
              },
            ],
          },
        ],
        max_output_tokens: 800,
      }),
    });

    const data = await res.json();

    // ✅ 안전하게 텍스트 파싱
    const rawText =
      data?.output?.[0]?.content?.[0]?.text ||
      data?.outputs?.[0]?.content?.[0]?.text ||
      "";

    console.log("🧠 GPT-4o 응답 원본:", rawText);

    // ✅ JSON 파싱
    let result = {};
    try {
      result = JSON.parse(rawText);
    } catch {
      // JSON 파싱 실패 시 대체 처리
      const allWords = rawText
        .split(/,|\n| /)
        .map((w) => w.trim())
        .filter((w) => w.length > 1);
      const keywords = Array.from(new Set(allWords)).slice(0, 25);
      const title = keywords.slice(0, 3).join(" · ") || "이미지 분석 결과";
      const description = rawText.slice(0, 200);
      result = { title, keywords, description };
    }

    // ✅ 결과 반환
    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🚨 analyze 오류:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
