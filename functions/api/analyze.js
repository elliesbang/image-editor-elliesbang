export const onRequestPost = async ({ request, env }) => {
  try {
    const contentType = request.headers.get("content-type") || "";
    let imageBase64 = "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      imageBase64 = body.imageBase64 || "";
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image");
      if (file) {
        const buffer = await file.arrayBuffer();
        imageBase64 = Buffer.from(buffer).toString("base64");
      }
    }

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "이미지가 없습니다. (imageBase64 누락)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const cleanBase64 = imageBase64.replace(
      /^data:image\/[a-zA-Z0-9+.-]+;base64,/,
      ""
    );

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
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
                text:
                  "이 이미지를 분석해줘.\n" +
                  "1️⃣ 연관된 핵심 키워드 25개 이하를 한국어로 쉼표로 구분해줘.\n" +
                  "2️⃣ 그 키워드들을 조합해서 자연스럽고 짧은 제목(5~10자)을 만들어줘.\n" +
                  "응답은 JSON 형식으로 반환해줘.\n" +
                  "{\n" +
                  '  "title": "제목",\n' +
                  '  "keywords": ["키워드1", "키워드2", ...]\n' +
                  "}",
              },
              {
                type: "input_image",
                image_url: `data:image/png;base64,${cleanBase64}`,
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("🚨 OpenAI API 호출 실패:", detail);
      return new Response(
        JSON.stringify({ error: "OpenAI API 호출 실패", detail }),
        { status: res.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    let resultText = "";

    if (Array.isArray(data.output)) {
      const message = data.output.find((i) => i.type === "message");
      const textEntry = message?.content?.find((c) => c.type === "output_text");
      resultText = textEntry?.text?.trim();
    }
    if (!resultText && data.output_text) resultText = data.output_text.trim();

    // ✅ JSON 파싱 보강
    let result;
    try {
      result = JSON.parse(resultText);
    } catch {
      result = { title: "키워드 분석 결과", keywords: [resultText] };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("🚨 analyze 오류:", err);
    return new Response(
      JSON.stringify({ error: "서버 처리 중 오류 발생", detail: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
