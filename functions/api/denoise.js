export const onRequestPost = async ({ request, env }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("image");
    if (!file)
      return new Response(JSON.stringify({ error: "이미지가 없습니다." }), { status: 400 });

    const apiKey = env.OPENAI_API_KEY;
    const forward = new FormData();
    forward.append("model", "dall-e-2");
    forward.append("image", file);
    forward.append("prompt", "이미지의 노이즈를 제거하고 선명하게 복원하세요.");

    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: forward,
    });

    const data = await res.json();
    const result = data?.data?.[0]?.b64_json;
    if (!result) throw new Error("OpenAI 응답에 결과 이미지가 없습니다.");

    return new Response(JSON.stringify({ result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("denoise 오류:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
