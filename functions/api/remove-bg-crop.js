export async function onRequestGet() {
  return new Response("✅ remove-bg-crop 함수가 실행되었습니다.", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
