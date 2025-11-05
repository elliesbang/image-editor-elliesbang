// ✅ Cloudflare Pages Function: /functions/api/denoise.js

export const onRequestPost = async ({ request, env }) => {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "이미지 데이터가 없습니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Base64 → Binary 변환
    const clean = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const bytes = Uint8Array.from(atob(clean), (c) => c.charCodeAt(0));

    // ✅ Cloudflare Workers AI 호출 (Real-ESRGAN)
    const result = await env.AI.run("@cf/real-esrgan", {
      image: [...bytes],
    });

    if (!result?.output_image) {
      return new Response(
        JSON.stringify({ error: "AI 디노이즈 실패" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        image: result.output_image, // base64 PNG
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("🚨 denoise AI 오류:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "AI 디노이즈 처리 실패",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
