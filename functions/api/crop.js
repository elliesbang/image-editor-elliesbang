// ✅ functions/crop.js
import { parseImageInput } from "./_sharedImageHandler";

export const onRequestPost = async ({ request, env }) => {
  try {
    // ✅ JSON or FormData 모두 허용
    const imageBase64 = await parseImageInput(request);
    const apiKey = env.OPENAI_API_KEY;

    // ✅ Base64 → Blob 변환
    const binary = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([binary], { type: "image/png" });

    // ✅ OpenAI API용 FormData 구성
    const formData = new FormData();
    formData.append("image", blob, "input.png");
    formData.append("model", "gpt-image-1");
    formData.append("prompt", "이미지를 피사체 중심으로 자동 크롭하세요.");

    // ✅ OpenAI 호출
    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    const data = await res.json();
    const result = data?.data?.[0]?.b64_json || null;

    if (!result) {
      console.error("⚠️ OpenAI 응답:", JSON.stringify(data, null, 2));
      throw new Error("크롭 실패 (OpenAI 응답에 이미지 없음)");
    }

    // ✅ 성공 응답 반환
    return new Response(JSON.stringify({ success: true, result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("crop 오류:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
