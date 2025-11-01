export const onRequestPost = async ({ request, env }) => {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64)
      return new Response(JSON.stringify({ error: "이미지를 선택해주세요." }), { status: 400 });

    const apiKey = env.OPENAI_API_KEY;
    const buffer = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
    const formData = new FormData();
    formData.append("image", new Blob([buffer]), "input.png");
    formData.append("model", "gpt-image-1");
    formData.append(
      "prompt",
      `
      주어진 이미지를 바탕으로, 실제 움직이지는 않지만  
      빛의 잔상, 흔들림, 반짝임, 잔광 효과가 있는 GIF 스타일의  
      예술적 이미지를 생성하세요.
      `
    );

    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    const data = await res.json();
    const result = data?.data?.[0]?.b64_json;
    if (!result) throw new Error("GIF 변환 실패");

    return new Response(JSON.stringify({ result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GIF Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
