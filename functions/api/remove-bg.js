export async function onRequestPost({ request, env }) {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64)
      return new Response(JSON.stringify({ error: "이미지 데이터가 없습니다." }), { status: 400 });

    // base64 → Blob 변환
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const binary = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const blob = new Blob([binary], { type: "image/png" });

    // ✅ 최신 Cloudflare AI 모델명
    const result = await env.AI.run("@cf/unum/u2net-hd", { image: blob });

    if (!result || !result.image) throw new Error("AI 응답에 이미지 필드가 없습니다.");

    const prefixed =
      result.image.startsWith("data:")
        ? result.image
        : `data:image/png;base64,${result.image}`;

    return new Response(JSON.stringify({ success: true, image: prefixed, message: "✅ 배경제거 성공" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🚨 remove-bg 오류:", err);
    return new Response(JSON.stringify({ error: `remove-bg 오류: ${err.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
