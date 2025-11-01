export const onRequestPost = async ({ request, env }) => {
  try {
    const { images = [] } = await request.json();
    if (!images.length)
      return new Response(JSON.stringify({ error: "분석할 이미지가 없습니다." }), { status: 400 });

    const apiKey = env.OPENAI_API_KEY;
    const formData = new FormData();

    // Base64를 파일로 변환하여 업로드
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
        "common_keywords": ["공통 키워드 10개"],
        "individual_keywords": {
          "image1": ["개별 키워드 5개"],
          "image2": ["개별 키워드 5개"],
          ...
        },
        "title": "공통 키워드 기반 2~3개 조합 문장 제목"
      }

      각 키워드는 영어, 한국어 혼용 가능하며 총합 25개 내외로 구성하세요.
      `
    );

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    const data = await res.json();
    const text = data?.output_text || data?.choices?.[0]?.message?.content;
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    const json = text.slice(jsonStart, jsonEnd + 1);
    const result = JSON.parse(json);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Analyze Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
