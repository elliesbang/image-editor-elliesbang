import { parseImageInput } from "./_sharedImageHandler";

export const onRequestPost = async ({ request, env }) => {
  try {
    const imageBase64 = await parseImageInput(request);

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: "이 이미지에서 핵심 키워드 10개를 추출해줘." },
              { type: "input_image", image_base64: imageBase64 },
            ],
          },
        ],
      }),
    });

    const data = await res.json();
    const text = data?.output_text || "";
    const keywords = text
      .split(/[,，]/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    return new Response(JSON.stringify({ success: true, keywords }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Analyze Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
