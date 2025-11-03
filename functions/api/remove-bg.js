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
    const buffer = await imageFile.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // ✅ 3. 허깅페이스 최신 엔드포인트로 배경제거 요청 (RMBG-1.4)
    const bgRes = await fetch(
      "https://router.huggingface.co/hf-inference/models/briaai/RMBG-1.4",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/octet-stream",
        },
        body: bytes,
      }
    );

    if (!bgRes.ok) {
      const errText = await bgRes.text();
      throw new Error(`배경제거 실패 (${bgRes.status}) - ${errText}`);
    }

    // ✅ 4. 결과 처리
    const bgBuffer = await bgRes.arrayBuffer();
    const base64 = btoa(
      String.fromCharCode(...new Uint8Array(bgBuffer))
    );

    return new Response(
      JSON.stringify({ success: true, result: base64 }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("🚨 remove-bg 오류:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
