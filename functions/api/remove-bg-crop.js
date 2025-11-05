export async function onRequestPost({ request, env }) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "이미지 데이터가 없습니다." }), {
        status: 400,
      });
    }

    // 1️⃣ 배경제거
    const bgRemoved = await env.AI.run("@cf/unum/u2net", {
      image: imageBase64.startsWith("data:") 
        ? imageBase64 
        : `data:image/png;base64,${imageBase64}`,
    });

    if (!bgRemoved || !bgRemoved.image) {
      throw new Error("배경제거 실패");
    }

    // 2️⃣ 피사체 감지 + 크롭
    const cropped = await env.AI.run("@cf/unum/u2net-crop", {
      image: bgRemoved.image,
    });

    if (!cropped || !cropped.image) {
      throw new Error("크롭 실패");
    }

    return new Response(
      JSON.stringify({
        result: cropped.image,
        message: "✅ 배경제거+크롭 완료",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `remove-bg-crop 오류: ${err.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
