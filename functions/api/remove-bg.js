// ✅ Cloudflare Pages Functions: functions/api/remove-bg.js

export const onRequestPost = async ({ request, env }) => {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "이미지 데이터가 없습니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 🔹 Base64 → Blob 변환
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const binary = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // ✅ Cloudflare Workers AI 호출
    const result = await env.AI.run("@cf/segment-anything", {
      image: [...binary],
    });

    // result.output_image = segmentation mask (흑백)
    const { output_image } = result;

    if (!output_image) {
      return new Response(
        JSON.stringify({ error: "AI 모델 결과가 없습니다." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ 결과 전달 (base64)
    return new Response(
      JSON.stringify({
        success: true,
        image: output_image, // base64 PNG
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("🚨 remove-bg AI 오류:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "AI 처리 중 오류 발생",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
