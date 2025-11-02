import { parseImageInput } from "./_sharedImageHandler";

export const onRequestPost = async ({ request, env }) => {
  try {
    const imageBase64 = await parseImageInput(request);

    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        image: imageBase64,
        prompt: "배경을 제거하고 인물 또는 객체 중심으로 자동 크롭된 이미지를 생성하세요.",
      }),
    });

    const data = await res.json();
    const result = data?.data?.[0]?.b64_json;
    if (!result) throw new Error("배경제거+크롭 실패");

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("remove-bg-crop 오류:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
