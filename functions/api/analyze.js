export const onRequestPost = async ({ request, env }) => {
  try {
    let imageBase64 = null;

    // ✅ Content-Type 확인 후 JSON 또는 FormData 모두 처리
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      imageBase64 = body.imageBase64;
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image");
      const arrayBuffer = await file.arrayBuffer();
      imageBase64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    }

    if (!imageBase64)
      return new Response(
        JSON.stringify({ error: "이미지 데이터가 없습니다." }),
        { status: 400 }
      );

    // ✅ OpenAI API 호출
    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        image: imageBase64,
        prompt: "이미지의 주요 특징을 분석해 키워드를 추출하세요.",
      }),
    });

    const data = await response.json();
    if (!data) throw new Error("분석 실패");

    return new Response(JSON.stringify({ success: true, keywords: data.keywords || [] }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Analyze Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
