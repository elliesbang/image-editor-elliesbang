export const onRequestPost = async ({ request, env }) => {
  try {
    // ✅ 1. 이미지 파일 받기
    const formData = await request.formData();
    const imageFile = formData.get("image");

    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: "이미지가 없습니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ 2. 파일 → 바이트 배열 변환
    const arrayBuffer = await imageFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // ✅ 3. 허깅페이스 새 엔드포인트 (Inference Providers 라우터)
    // ❗ 모델 주소는 /hf-inference/models/{model} 형태로 접근해야 함
    const response = await fetch(
      "https://router.huggingface.co/models/Sanster/lama-cleaner",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/octet-stream",
        },
        body: bytes,
      }
    );

    // ✅ 4. 응답 상태 확인
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API 요청 실패 (${response.status}) - ${errText}`);
    }

    // ✅ 5. 결과 바이너리 → Base64 변환
    const resultBuffer = await response.arrayBuffer();
    const base64 = btoa(
      String.fromCharCode(...new Uint8Array(resultBuffer))
    );

    // ✅ 6. 성공 응답 반환
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
