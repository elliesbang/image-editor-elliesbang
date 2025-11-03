export const onRequestPost = async ({ request, env }) => {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64 || !Array.isArray(imageBase64) || imageBase64.length === 0) {
      throw new Error("이미지 데이터가 없거나 배열 형태가 아닙니다.");
    }

    const apiKey = env.OPENAI_API_KEY;

    // ✅ 1. 각 이미지 개별 분석 실행
    const results = [];
    for (const base64 of imageBase64) {
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
                    이 이미지를 보고 다음을 수행하세요:
                    1️⃣ 주요 객체, 색상, 분위기를 포함한 **25개의 키워드**를 쉼표로 구분해 나열하세요.
                    2️⃣ 핵심 2~3개 키워드를 조합해 제목을 생성하세요.
                    결과를 JSON으로:
                    {
                      "title": "제목",
                      "keywords": ["키워드1", "키워드2", ...]
                    }
                  `,
                },
                { type: "input_image", image_url: `data:image/png;base64,${base64}` },
              ],
            },
          ],
        }),
      });

      const data = await res.json();
      const text =
        data?.output?.[0]?.content?.[0]?.text ||
        data?.outputs?.[0]?.content?.[0]?.text ||
        "";

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        // JSON 파싱 실패 시 백업
        const keywords = text
          .split(/,|\n/)
          .map((k) => k.trim())
          .filter((k) => k.length > 1)
          .slice(0, 25);
        parsed = {
          title: keywords.slice(0, 3).join(" · ") || "이미지 분석 결과",
          keywords,
        };
      }

      results.push(parsed);
    }

    // ✅ 2. 공통 키워드 분석
    const allKeywordLists = results.map((r) => r.keywords || []);
    const allKeywordsFlat = allKeywordLists.flat();

    // 각 키워드 등장 횟수 계산
    const freqMap = allKeywordsFlat.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});

    const commonKeywords = Object.entries(freqMap)
      .filter(([_, count]) => count > 1)
      .map(([word]) => word)
      .slice(0, 15); // 공통 키워드 15개 제한

    // ✅ 3. 결과 반환
    return new Response(
      JSON.stringify({
        success: true,
        common_keywords: commonKeywords,
        images: results,
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
