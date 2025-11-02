// ✅ functions/denoise.js
import { parseImageInput } from "./_sharedImageHandler";

export const onRequestPost = async ({ request, env }) => {
  try {
    // ✅ JSON / FormData 모두 지원
    const imageBase64 = await parseImageInput(request);
    const apiKey = env.OPENAI_API_KEY;

    // ✅ Base64 → Blob 변환 후 FormData 구성
    const binary = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([binary], { type: "image/png" });
    const formData = new FormData();
    formData.append("image", blob, "input.png");
    formData.append("model", "gpt-image-1");
    formData.append("prompt", "이미지의 노이즈를 제거하고 선명하게 만드세요.");

    // ✅ OpenAI 이미지 편집 API 호출
    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    const data = await res.json();
    const result = data?.data?.[0]?.b64_json || null;

    if (!result) {
      console.error("⚠️ OpenAI 응답:", JSON.stringify(data, null, 2));
      throw new Error("노이즈 제거 실패 (OpenAI 응답에 이미지 없음)");
    }

    // ✅ Cloudflare 응답 반환
    return new Response(JSON.stringify({ success: true, result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("denoise 오류:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
