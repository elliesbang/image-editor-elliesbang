export async function onRequestPost({ request }) {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64) {
      return new Response("❌ imageBase64 누락됨", { status: 400 });
    }

    // 1️⃣ remove-bg API 호출
    const removeBgRes = await fetch(`${new URL(request.url).origin}/api/remove-bg`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!removeBgRes.ok) {
      const errText = await removeBgRes.text();
      return new Response(`🚨 remove-bg 실패: ${removeBgRes.status}\n${errText}`, { status: 500 });
    }

    const data = await removeBgRes.json();
    if (!data.result) {
      return new Response("⚠️ remove-bg 응답에 result 필드 없음", { status: 500 });
    }

    return new Response("✅ remove-bg 성공! 다음 단계로 진행 가능", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    return new Response(`💥 함수 오류: ${err.message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
