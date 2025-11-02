export const onRequestPost = async ({ request, env }) => {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64) {
      throw new Error("이미지 데이터가 없습니다.");
    }

    const apiKey = env.OPENAI_API_KEY;

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: "이 이미지의 주요 객체, 색상, 분위기를 설명하는 10개의 키워드를 쉼표로 나열하세요.",
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

    // ✅ 출력 위치 안전하게 처리
    const text =
      data?.output?.[0]?.content?.[0]?.text ||
      data?.outputs?.[0]?.content?.[0]?.text ||
      "";

    // ✅ 결과를 쉼표 기준으로 나누기
    const keywords = text
      .split(/,|\n/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    console.log("🎯 키워드 추출:", keywords);

    return new Response(JSON.stringify({ success: true, keywords }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze 오류:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
