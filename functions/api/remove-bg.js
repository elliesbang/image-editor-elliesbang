export const onRequestPost = async ({ request, env }) => {
  try {
    // ✅ FormData로부터 이미지 파일 받기
    const formData = await request.formData();
    const imageFile = formData.get("image");

    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: "이미지가 없습니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ 파일 → 바이트 배열 변환
    const arrayBuffer = await imageFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // ✅ 새로운 Hugging Face Inference Providers 엔드포인트
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/Sanster/lama-cleaner",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/octet-stream",
        },
        body: bytes,
      }
    );

    if (!response.ok) {
      throw new Error(`API 요청 실패 (${response.status})`);
    }

    // ✅ 결과 변환 (바이너리 → Base64)
    const resultBuffer = await response.arrayBuffer();
    const base64 = btoa(
      String.fromCharCode(...new Uint8Array(resultBuffer))
    );

    // ✅ JSON 응답 반환
    return new Response(
      JSON.stringify({ success: true, result: base64 }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("🚨 remove-bg 오류:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
