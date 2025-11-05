export async function onRequestPost({ request, env }) {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "이미지 데이터 없음" }), { status: 400 });
    }

    // Cloudflare Workers AI 호출
    const response = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
      input: imageBase64,
    });

    return new Response(JSON.stringify({ result: response }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: `AI 오류: ${err.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
