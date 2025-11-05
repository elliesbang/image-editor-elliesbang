export async function onRequestPost({ request, env }) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "이미지 데이터가 없습니다." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1️⃣ 배경제거
    const bgResult = await env.AI.run("@cf/unum/u2net", {
      image: imageBase64.startsWith("data:")
        ? imageBase64
        : `data:image/png;base64,${imageBase64}`,
    });

    const bgImage =
      bgResult.image || bgResult.output || bgResult.result || bgResult.data;
    if (!bgImage) throw new Error("배경제거 실패");

    // 2️⃣ 크롭
    const cropResult = await env.AI.run("@cf/unum/u2net-crop", {
      image: bgImage,
    });

    const cropped =
      cropResult.image || cropResult.output || cropResult.result || cropResult.data;
    if (!cropped) throw new Error("크롭 실패");

    const prefixed =
      cropped.startsWith("data:") ? cropped : `data:image/png;base64,${cropped}`;

    return new Response(
      JSON.stringify({
        success: true,
        image: prefixed,
        message: "✅ 배경제거+크롭 완료",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("🚨 remove-bg-crop 오류:", err);
    return new Response(
      JSON.stringify({ error: `remove-bg-crop 오류: ${err.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
