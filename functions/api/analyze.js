export const onRequestPost = async ({ request, env }) => {
  try {
    const contentType = request.headers.get("content-type") || "";
    let imageBase64 = "";

    // ✅ JSON 요청 처리
    if (contentType.includes("application/json")) {
      const body = await request.json();
      imageBase64 = body.imageBase64 || "";
    }

    // ✅ FormData 요청 처리
    else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image");
      if (file) {
        const buffer = await file.arrayBuffer();
        imageBase64 = Buffer.from(buffer).toString("base64");
      }
    }

    // ✅ 유효성 검사
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "이미지가 없습니다. (imageBase64 누락)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ Base64 정리 (prefix 제거)
    const cleanBase64 = imageBase64.replace(
      /^data:image\/[a-zA-Z0-9+.-]+;base64,/,
      ""
    );

    // ✅ OpenAI REST API 호출
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
                text: "이 이미지를 분석하고 핵심 키워드 10개를 한국어로 추출해줘. 쉼표로 구분해줘.",
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
        JSON.stringify({
          error: "OpenAI API 호출 실패",
          detail,
        }),
        { status: res.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();

    // ✅ output 파싱 보완
    let resultText = "";
    if (Array.isArray(data.output)) {
      const message = data.output.find((item) => item.type === "message");
      const textContent = message?.content?.find(
        (entry) => entry.type === "output_text"
      );
      resultText = textContent?.text?.trim();
    }

    if (!resultText && data.output_text) {
      resultText = data.output_text.trim();
    }

    const result = resultText || "키워드를 찾을 수 없습니다.";

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🚨 analyze 오류:", err);
    return new Response(
      JSON.stringify({
        error: "서버 처리 중 오류 발생",
        detail: err.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
