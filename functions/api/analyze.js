export const onRequestPost = async ({ request, env }) => {
  try {
    const { images = [] } = await request.json();
    if (!images.length)
      return new Response(
        JSON.stringify({ error: "분석할 이미지가 없습니다." }),
        { status: 400 }
      );

    const apiKey = env.OPENAI_API_KEY;
    const formData = new FormData();

    // Base64 → Blob 변환
    images.forEach((img, idx) => {
      const buffer = Uint8Array.from(atob(img), (c) => c.charCodeAt(0));
      formData.append(`image${idx}`, new Blob([buffer]), `image${idx}.png`);
    });

    formData.append("model", "gpt-4o-mini");
    formData.append(
      "prompt",
      `
      주어진 이미지들의 시각적, 개념적 특징을 분석하여  
      다음 정보를 JSON으로 반환하세요.

      {
        "keywords": ["자연", "나무", "하늘", "햇살", ... (한글 위주 25개)"],
        "title": "공통 키워드 2~3개 조합한 한글 제목"
      }

      ⚠️ 주의: 영어 키워드는 포함하지 말고,  
      반드시 한글 25개 내외의 단어만 포함하세요.
      `
    );

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    const data = await res.json();
    // ✅ OpenAI Responses API의 실제 텍스트 위치
    const outputText =
      data.output?.[0]?.content?.[0]?.text ||
      data.output_text ||
      data.choices?.[0]?.message?.content ||
      "";

    // ✅ JSON 파싱
    const jsonStart = outputText.indexOf("{");
    const jsonEnd = outputText.lastIndexOf("}");
    const jsonString = outputText.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonString);

    // ✅ 결과 정리 (안전 필터링)
    const keywords = (parsed.keywords || [])
      .filter((k) => /[가-힣]/.test(k)) // 한글만
      .slice(0, 25);

    const title = parsed.title || "이미지 키워드 분석";

    return new Response(
      JSON.stringify({ keywords, title }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Analyze Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
};
