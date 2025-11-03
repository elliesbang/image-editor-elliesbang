export const onRequestPost = async ({ request, env }) => {
  try {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY 누락");

    const body = await request.json();
    const imageBase64List = body.imageBase64List || [];
    if (!imageBase64List.length) {
      return new Response(
        JSON.stringify({ success: false, error: "분석할 이미지가 없습니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const perImageResults = [];

    for (const [i, img64] of imageBase64List.entries()) {
      const payload = {
        model: "gpt-4o-mini",
        input: [
          {
            role: "system",
            content: [
              {
                type: "text",
                text:
                  "당신은 디자인 마켓(Miricanvas, 위버딩 등)에 최적화된 SEO 키워드를 생성하는 전문가입니다. " +
                  "이미지를 보고 25개의 고유한 키워드와 짧은 제목을 만들어주세요. " +
                  "각 키워드는 1~3단어로 구성하며, 해시태그·기호·중복 단어는 제거합니다. " +
                  "설명은 포함하지 않습니다. 결과는 JSON 형식으로만 반환합니다.",
              },
            ],
          },
          {
            role: "user",
            content: [
              { type: "text", text: "이미지를 분석하고 JSON으로 반환하세요." },
              { type: "image_url", image_url: `data:image/png;base64,${img64}` },
            ],
          },
        ],
        response_format: { type: "json_object" }, // ✅ 최신 스펙
      };

      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI 분석 실패 (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const rawText =
        data.output?.[0]?.content?.[0]?.text ??
        data.outputs?.[0]?.content?.[0]?.text ??
        "";

      let parsed = {};
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = { title: `이미지 ${i + 1}`, keywords: [] };
      }

      perImageResults.push({
        index: i,
        title: parsed.title || `이미지 ${i + 1}`,
        keywords: parsed.keywords || [],
      });
    }

    // ✅ 공통 키워드 계산
    const sets = perImageResults.map((p) => new Set(p.keywords));
    const common =
      sets.length > 1
        ? [...sets[0]].filter((k) => sets.every((s) => s.has(k)))
        : [];

    return new Response(
      JSON.stringify({
        success: true,
        commonKeywords: common,
        perImage: perImageResults,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("🚨 analyze 오류:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
