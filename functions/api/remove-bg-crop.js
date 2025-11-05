/**
 * 배경제거 + 크롭 통합 API (Cloudflare Pages Functions)
 */
export async function onRequestPost({ request, env }) {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "이미지 데이터가 없습니다." }),
        { status: 400 }
      );
    }

    // 🔹 1️⃣ 배경제거 (remove-bg API 호출)
    const removeBgResponse = await fetch(`${request.url.replace("/remove-bg-crop", "/remove-bg")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!removeBgResponse.ok) {
      throw new Error(`배경제거 실패 (${removeBgResponse.status})`);
    }

    const { result: bgRemoved } = await removeBgResponse.json();

    // 🔹 2️⃣ 크롭 (crop-auto API 호출)
    const cropResponse = await fetch(`${request.url.replace("/remove-bg-crop", "/crop-auto")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: bgRemoved }),
    });

    if (!cropResponse.ok) {
      throw new Error(`크롭 실패 (${cropResponse.status})`);
    }

    const { result: cropped } = await cropResponse.json();

    return new Response(JSON.stringify({ result: cropped }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `remove-bg-crop 오류: ${err.message}` }),
      { status: 500 }
    );
  }
}
