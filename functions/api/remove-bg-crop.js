/**
 * 배경제거 + 자동 크롭 통합 API (Cloudflare Workers AI 버전)
 */
export async function onRequestPost({ request, env }) {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "이미지 데이터가 없습니다." }), {
        status: 400,
      });
    }

    // 1️⃣ 배경제거 (Remove Background)
    const removeBgResult = await env.AI.run("@cf/runwayml/stable-diffusion-v1-5-inpainting", {
      image: imageBase64,
      prompt: "remove background, keep subject clean",
      strength: 1,
    });

    if (!removeBgResult || !removeBgResult.image) {
      throw new Error("배경제거 실패 또는 결과 없음");
    }

    // 2️⃣ 자동 크롭 (crop-auto)
    const cropResult = await env.AI.run("@cf/unum/u2net", {
      image: removeBgResult.image,
    });

    if (!cropResult || !cropResult.image) {
      throw new Error("크롭 실패 또는 결과 없음");
    }

    // 3️⃣ 최종 결과 반환 (Base64 이미지)
    return new Response(
      JSON.stringify({
        result: cropResult.image,
        message: "✅ 배경제거+크롭 완료",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `remove-bg-crop 오류: ${err.message}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
