export async function onRequestPost({ request, env }) {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64)
      return new Response(JSON.stringify({ error: "이미지 데이터가 없습니다." }), { status: 400 });

    // Base64 → 바이너리 변환
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const binary = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // ✅ 올바른 모델명 (u2net)
    const result = await env.AI.run("@cf/unum/u2net", { image: binary });

    // Cloudflare AI는 결과를 바로 binary로 반환함
    return new Response(result, {
      headers: { "Content-Type": "image/png" },
    });

  } catch (err) {
    console.error("🚨 remove-bg 오류:", err);
    return new Response(JSON.stringify({ error: `remove-bg 오류: ${err.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
