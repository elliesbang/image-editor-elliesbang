export const onRequestPost = async ({ request, env }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("image");
    if (!file)
      return new Response(JSON.stringify({ error: "이미지를 업로드하세요." }), { status: 400 });

    const apiKey = env.OPENAI_API_KEY;

    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

    const body = {
      model: "gpt-4o", // ✅ 멀티모달 지원 모델
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
                이미지를 분석하여 한글 키워드 25개와 공통된 의미의 제목 1개를 JSON으로 만들어 주세요.
                형식 예시:
                {"keywords":["자연","하늘","초원",...],"title":"푸른 들판의 햇살"}
              `,
            },
            {
              type: "input_image",
              image_url: `data:image/png;base64,${base64}`,
            },
          ],
        },
      ],
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

    if (!outputText.includes("{")) throw new Error("OpenAI 응답이 비어 있습니다.");

    const jsonStart = outputText.indexOf("{");
    const jsonEnd = outputText.lastIndexOf("}");
    const parsed = JSON.parse(outputText.slice(jsonStart, jsonEnd + 1));

    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Analyze Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
