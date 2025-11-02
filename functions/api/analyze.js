export const onRequestPost = async ({ request, env }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file)
      return new Response(JSON.stringify({ error: "이미지 파일이 없습니다." }), { status: 400 });

    const apiKey = env.OPENAI_API_KEY;
    const forwardForm = new FormData();

    forwardForm.append("model", "gpt-4o-mini");
    forwardForm.append("image", file);
    forwardForm.append(
      "prompt",
      `
      이 이미지를 분석해서 JSON 형태로 반환하세요.
      {
        "keywords": ["자연", "나무", "하늘", "햇살", ... (한글 25개 내외)],
        "title": "공통 키워드 2~3개 조합한 한글 제목"
      }
      ⚠️ 영어 단어 제외, 한글만 포함하세요.
      `
    );

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: forwardForm,
    });

    const data = await res.json();
    const outputText =
      data.output?.[0]?.content?.[0]?.text ||
      data.output_text ||
      data.choices?.[0]?.message?.content ||
      "";

    // ✅ 결과 JSON 파싱
    const jsonStart = outputText.indexOf("{");
    const jsonEnd = outputText.lastIndexOf("}");
    const jsonString = outputText.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonString);

    const keywords = (parsed.keywords || [])
      .filter((k) => /[가-힣]/.test(k))
      .slice(0, 25);

    const title = parsed.title || "이미지 키워드 분석";

    return new Response(
      JSON.stringify({ keywords, title }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Analyze Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
