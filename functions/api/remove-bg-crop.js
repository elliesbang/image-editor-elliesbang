/**
 * 배경제거 + 크롭 통합 API (Cloudflare Pages Functions)
 */
export async function onRequestPost({ request }) {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "이미지 데이터가 없습니다." }),
        { status: 400 }
      );
    }

    // 1️⃣ 배경제거 API 호출
    const removeBgRes = await fetch(`${new URL(request.url).origin}/api/remove-bg`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64 }),
    });
    if (!removeBgRes.ok) {
      throw new Error(`배경제거 실패 (${removeBgRes.status})`);
    }
    const { result: bgRemoved } = await removeBgRes.json();

    // 2️⃣ 자동 크롭 API 호출
    const cropRes = await fetch(`${new URL(request.url).origin}/api/crop-auto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: bgRemoved }),
    });
    if (!cropRes.ok) {
      throw new Error(`크롭 실패 (${cropRes.status})`);
    }
    const { result: cropped } = await cropRes.json();

    // 3️⃣ 최종 결과 반환
    return new Response(JSON.stringify({ result: cropped }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `remove-bg-crop 오류: ${err.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
