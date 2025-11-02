// ✅ functions/remove-bg-crop.js
import { parseImageInput } from "./_sharedImageHandler";

export const onRequestPost = async ({ request, env }) => {
  try {
    // ✅ JSON 또는 FormData 모두 허용
    const imageBase64 = await parseImageInput(request);
    const apiKey = env.OPENAI_API_KEY;

    // ✅ Base64 → Blob 변환
    const binary = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([binary], { type: "image/png" });

    // ✅ OpenAI용 FormData 생성
    const formData = new FormData();
    formData.append("image", blob, "input.png");
    formData.append("model", "gpt-image-1");
    formData.append(
      "prompt",
      "이미지에서 피사체만 남기고 배경을 제거한 뒤, 피사체에 맞게 자동으로 크롭하세요."
    );

    // ✅ OpenAI API 호출
    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    const data = await res.json();
    const result = data?.data?.[0]?.b64_json || null;

    if (!result) {
      console.error("⚠️ OpenAI 응답:", JSON.stringify(data, null, 2));
      throw new Error("배경제거+크롭 실패 (OpenAI 응답에 이미지 없음)");
    }

    // ✅ 결과 반환
    return new Response(JSON.stringify({ success: true, result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("remove-bg-crop 오류:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
