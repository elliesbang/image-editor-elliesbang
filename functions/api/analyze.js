export const onRequestPost = async ({ request, env }) => {
  try {
    const { images } = await request.json();
    if (!images || !images.length)
      return new Response(JSON.stringify({ error: "이미지가 필요합니다." }), { status: 400 });

    const apiKey = env.OPENAI_API_KEY;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "당신은 이미지 기반 콘텐츠 분석 전문가입니다. 다음 규칙을 따르세요:\n1) 각 이미지에서 핵심 키워드 5개씩 추출\n2) 모든 이미지를 종합해 공통 키워드 25개 내외 제시\n3) 마지막으로 키워드 2~3개를 조합해 제목 문장을 생성하세요.\n결과는 JSON으로 출력:\n{\n  \"keywords\": [\"키워드1\", ...],\n  \"title\": \"제목 문장\"\n}",
          },
          {
            role: "user",
            content: images.map((img) => ({
              type: "image_url",
              image_url: `data:image/png;base64,${img}`,
            })),
          },
        ],
      }),
    });

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || "";
    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      const keywordsMatch = text.match(/\[(.*?)\]/s);
      const titleMatch = text.match(/"title"\s*:\s*"(.*?)"/s);
      parsed = {
        keywords: keywordsMatch
          ? keywordsMatch[1]
              .split(",")
              .map((k) => k.replace(/["\]]/g, "").trim())
              .slice(0, 25)
          : [],
        title: titleMatch ? titleMatch[1].trim() : "AI가 생성한 제목",
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze 오류:", err);
    return new Response(
      JSON.stringify({ error: "키워드 분석 중 오류가 발생했습니다." }),
      { status: 500 }
    );
  }
};
