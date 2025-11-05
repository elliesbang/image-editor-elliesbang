export async function onRequestPost({ request, env }) {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "이미지 데이터가 없습니다." }), {
        status: 400,
      });
    }

    // ✅ U^2-Net 모델로 배경제거
    const aiResponse = await env.AI.run("@cf/unum/u2net", {
      image: imageBase64,
    });

    if (!aiResponse || !aiResponse.image) {
      throw new Error("AI 응답에 이미지 데이터가 없습니다.");
    }

    return new Response(
      JSON.stringify({
        result: aiResponse.image,
        message: "✅ 배경제거 완료",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `remove-bg 오류: ${err.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
