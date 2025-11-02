export const onRequestPost = async ({ request, env }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("image");
    if (!file)
      return new Response(JSON.stringify({ error: "이미지를 업로드하세요." }), { status: 400 });

    const apiKey = env.OPENAI_API_KEY;

    const body = {
      model: "gpt-4o", // ✅ gpt-4o-mini → gpt-4o 변경
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "이 이미지를 분석해 한글 키워드 25개와 제목을 JSON으로 만들어줘." },
            { type: "input_image", image_data: await file.arrayBuffer() },
          ],
        },
      ],
      max_output_tokens: 500,
    };

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    const outputText =
      data.output?.[0]?.content?.[0]?.text ||
      data.output_text ||
      data.choices?.[0]?.message?.content ||
      "";

    // ✅ 방어 로직 추가
    if (!outputText.includes("{") || !outputText.includes("}")) {
      throw new Error("OpenAI 응답이 비어 있습니다.");
    }

    const jsonStart = outputText.indexOf("{");
    const jsonEnd = outputText.lastIndexOf("}");
    const jsonString = outputText.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonString);

    const keywords = (parsed.keywords || [])
      .filter((k) => /[가-힣]/.test(k))
      .slice(0, 25);
    const title = parsed.title || "이미지 키워드 분석";

    return new Response(JSON.stringify({ keywords, title }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Analyze Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
