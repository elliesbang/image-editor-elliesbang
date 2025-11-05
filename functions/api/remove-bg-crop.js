export async function onRequestPost({ request }) {
  try {
    const body = await request.text();
    return new Response(`✅ 요청 body 수신됨:\n\n${body.slice(0, 200)}...`, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    return new Response(`💥 함수 오류: ${err.message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
