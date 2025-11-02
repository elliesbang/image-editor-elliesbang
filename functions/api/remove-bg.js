// ✅ functions/remove-bg.js
import { parseImageInput } from "./_sharedImageHandler";

export const onRequestPost = async ({ request, env }) => {
  try {
    const imageBase64 = await parseImageInput(request);
    const apiKey = env.OPENAI_API_KEY;

    // ✅ Base64 → Blob 변환
    const binary = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([binary], { type: "image/png" });

    // ✅ OpenAI 이미지 편집 API용 FormData 구성
    const formData = new FormData();
    formData.append("image", blob, "input.png");
    formData.append("model", "gpt-image-1");
    formData.append(
      "prompt",
      `
      아래 이미지를 기반으로, 인물 또는 주요 피사체만 남기고 
      배경을 완전히 투명하게 제거한 PNG 이미지를 생성하세요.
      결과는 투명 배경이어야 합니다.
      `
    );
    formData.append("size", "1024x1024"); // ✅ 결과 사이즈 명시 (권장)

    // ✅ OpenAI API 호출
    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    const data = await res.json();
    const result = data?.data?.[0]?.b64_json || null;

    if (!result) {
      console.error("⚠️ OpenAI 응답:", JSON.stringify(data, null, 2));
      throw new Error("배경제거 실패 (OpenAI 응답에 이미지 없음)");
    }

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("remove-bg 오류:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
