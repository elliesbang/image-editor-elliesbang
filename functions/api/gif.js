export const onRequestPost = async ({ request, env }) => {
  try {
    const { imageBase64, loop = true } = await request.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "이미지 데이터가 없습니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ Base64 → Binary
    const clean = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const bytes = Uint8Array.from(atob(clean), (c) => c.charCodeAt(0));

    // ✅ 1️⃣ Cloudflare AI GIF 변환 모델 실행
    const aiResponse = await env.AI.run("@cf/lykon/blink", {
      image: [...bytes],
      resize: { width: 700, height: null }, // 비율 유지
      dpi: 72,
      loop: loop ? 0 : 1, // 0 = infinite, 1 = once
    });

    if (!aiResponse?.output_gif) {
      throw new Error("GIF 변환 실패");
    }

    // ✅ 결과 base64 가져오기
    const gifBase64 = aiResponse.output_gif;

    return new Response(
      JSON.stringify({
        success: true,
        gif: `data:image/gif;base64,${gifBase64}`,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("🚨 GIF 변환 오류:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
