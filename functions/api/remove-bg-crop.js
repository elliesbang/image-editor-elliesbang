import sharp from "sharp";

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
    const model = "briaai/RMBG-1.4";

    // ✅ 1️⃣ 배경제거 (Hugging Face 최신 엔드포인트)
    const removeRes = await fetch(
      `https://router.huggingface.co/hf-inference/models/${model}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: imageFile,
      }
    );

    if (!removeRes.ok) {
      throw new Error(`배경제거 실패 (${removeRes.status})`);
    }

    const buffer = Buffer.from(await removeRes.arrayBuffer());

    // ✅ 2️⃣ Sharp로 피사체 경계 감지 후 여백 없이 크롭
    const trimmedBuffer = await sharp(buffer)
      .trim({ threshold: 10 }) // 투명 픽셀 기반 여백 제거
      .toBuffer();

    // ✅ 3️⃣ base64 변환
    const base64 = trimmedBuffer.toString("base64");

    return new Response(JSON.stringify({ result: base64 }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🚨 remove-bg-crop 오류:", err);
    return new Response(
      JSON.stringify({ error: "배경제거+크롭 실패", detail: err.message }),
      { status: 500 }
    );
  }
};
