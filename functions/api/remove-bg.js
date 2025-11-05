export async function onRequestPost({ request, env }) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "이미지 데이터가 없습니다." }), {
        status: 400,
      });
    }

    // ✅ Cloudflare AI: 배경제거 모델 (U²-Net)
    const result = await env.AI.run("@cf/unum/u2net", {
      image: imageBase64.startsWith("data:") 
        ? imageBase64 
        : `data:image/png;base64,${imageBase64}`,
    });

    if (!result || !result.image) {
      throw new Error("AI 응답에 이미지 필드가 없습니다.");
    }

    return new Response(
      JSON.stringify({ result: result.image, message: "✅ 배경제거 성공" }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: `remove-bg 오류: ${err.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
