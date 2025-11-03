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
    const model = "briaai/RMBG-1.4"; // ✅ 배경제거 모델 이름

    // ✅ 새로운 Hugging Face 엔드포인트 사용
    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: imageFile,
      }
    );

    if (!response.ok) {
      throw new Error(`배경제거 실패 (${response.status})`);
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
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
