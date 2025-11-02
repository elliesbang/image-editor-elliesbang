export const onRequestPost = async ({ request, env }) => {
  try {
    let imageBase64 = null;

    // ✅ Content-Type에 따라 JSON 또는 FormData 처리
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      imageBase64 = body.imageBase64;
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image");
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        imageBase64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      }
    }

    if (!imageBase64)
      return new Response(
        JSON.stringify({ error: "이미지 데이터가 없습니다." }),
        { status: 400 }
      );

    // ✅ OpenAI API 호출 (필요 시 다른 모델로 변경)
    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        image: imageBase64,
        prompt: "이미지의 노이즈를 제거하고 선명도를 향상시켜주세요.",
      }),
    });

    const data = await response.json();
    if (!data || !data.data || !data.data[0]?.b64_json)
      throw new Error("OpenAI 응답 오류");

    return new Response(
      JSON.stringify({ success: true, result: data.data[0].b64_json }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("denoise 오류:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
};
