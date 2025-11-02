export const onRequestPost = async ({ request, env }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("image");
    if (!file)
      return new Response(JSON.stringify({ error: "이미지가 없습니다." }), { status: 400 });

    const apiKey = env.OPENAI_API_KEY;

    const forward = new FormData();
    forward.append("model", "dall-e-2"); // ✅ DALL·E 2 사용
    forward.append("image", file);
    forward.append("prompt", "배경을 제거하고 피사체만 남기세요.");

    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: forward,
    });

    const data = await res.json();
    console.log("OpenAI Response:", JSON.stringify(data, null, 2)); // ✅ 응답 확인용 로그

    const result = data?.data?.[0]?.b64_json;
    if (!result) throw new Error("OpenAI 응답에 결과 이미지가 없습니다.");

    return new Response(JSON.stringify({ result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("remove-bg 오류:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
