export async function onRequestPost({ request, env }) {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "이미지 데이터가 없습니다." }),
        { status: 400 }
      );
    }

    // ✅ base64 → Blob 변환
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const binary = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const blob = new Blob([binary], { type: "image/png" });

    // 1️⃣ 배경제거
    const bgRemoved = await env.AI.run("@cf/unum/u2net-portrait", { image: blob });
    if (!bgRemoved || !bgRemoved.image) throw new Error("배경제거 실패");

    // 2️⃣ 자동 크롭
    const cropped = await env.AI.run("@cf/unum/u2net-portrait-crop", {
      image: bgRemoved.image,
    });
    if (!cropped || !cropped.image) throw new Error("크롭 실패");

    const prefixed =
      cropped.image.startsWith("data:")
        ? cropped.image
        : `data:image/png;base64,${cropped.image}`;

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
