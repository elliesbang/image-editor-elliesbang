export const onRequestPost = async ({ request, env }) => {
  try {
    const { imageBase64, colorLimit = 6 } = await request.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "이미지가 없습니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const clean = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const bytes = Uint8Array.from(atob(clean), (c) => c.charCodeAt(0));

    // ✅ Cloudflare AI를 통한 SVG 벡터 변환
    const result = await env.AI.run("@cf/lykon/dreamshaper-8-lcm", {
      image: [...bytes],
      prompt: `convert to svg vector illustration with up to ${colorLimit} colors, clean transparent background, include viewBox, remove stroke attributes, file size under 150KB`,
    });

    if (!result?.output_svg) throw new Error("SVG 변환 실패");

    return new Response(
      JSON.stringify({
        success: true,
        svg: result.output_svg,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("🚨 SVG 변환 오류:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
