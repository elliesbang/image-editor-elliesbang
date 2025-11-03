export const onRequestPost = async ({ request, env }) => {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("file");

    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: "이미지 파일이 없습니다." }),
        { status: 400 }
      );
    }

    const apiKey = env.HF_API_KEY;
    const model = "briaai/RMBG-1.4"; // ✅ 최신 배경제거 모델

    // ✅ Hugging Face 최신 라우터 엔드포인트
    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: imageFile, // ✅ multipart/form-data ❌ → Blob 직접 전송 ✅
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`배경제거 실패 (${response.status}): ${text}`);
    }

    // ✅ 결과 이미지 base64 인코딩
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return new Response(JSON.stringify({ result: base64 }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🚨 remove-bg 오류:", err);
    return new Response(
      JSON.stringify({ error: "배경제거 실패", detail: err.message }),
      { status: 500 }
    );
  }
};
