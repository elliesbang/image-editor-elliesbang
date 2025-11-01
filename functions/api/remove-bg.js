export const onRequestPost = async ({ request, env }) => {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64)
      return new Response(JSON.stringify({ error: "이미지 데이터가 없습니다." }), { status: 400 });

    const apiKey = env.OPENAI_API_KEY;
    const formData = new FormData();
    const buffer = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
    formData.append("image", new Blob([buffer]), "input.png");
    formData.append("model", "gpt-image-1");
    formData.append("prompt", "배경을 제거하세요");

    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    const data = await res.json();
    const result = data?.data?.[0]?.b64_json || null;

    return new Response(JSON.stringify({ result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("remove-bg 오류:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
