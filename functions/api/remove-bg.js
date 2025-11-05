export async function onRequestPost({ request, env }) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "이미지 데이터가 없습니다." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ✅ Cloudflare AI 모델 호출
    const aiResult = await env.AI.run("@cf/unum/u2net", {
      image: imageBase64.startsWith("data:")
        ? imageBase64
        : `data:image/png;base64,${imageBase64}`,
    });

    // ✅ AI 응답 확인 (직접 구조 출력)
    console.log("🚀 AI 응답:", JSON.stringify(aiResult).slice(0, 200));

    // ✅ Cloudflare AI는 보통 image 속성으로 반환
    const resultImage =
      aiResult.image || aiResult.output || aiResult.result || aiResult.data;

    if (!resultImage) {
      throw new Error("AI 응답에 이미지 데이터가 없습니다.");
    }

    // ✅ Base64 prefix 강제 추가
    const prefixed =
      resultImage.startsWith("data:") ?
      resultImage :
      `data:image/png;base64,${resultImage}`;

    return new Response(
      JSON.stringify({
        success: true,
        image: prefixed,
        message: "✅ 배경제거 성공",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("🚨 remove-bg 오류:", err);
    return new Response(
      JSON.stringify({ error: `remove-bg 오류: ${err.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
