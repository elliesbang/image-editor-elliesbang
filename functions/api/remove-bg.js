// functions/api/remove-bg.js

import { parseImageInput } from "../../_utils/parseImageInput";

export const onRequestPost = async ({ request, env }) => {
  try {
    const apiKey = env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error("환경 변수 HUGGINGFACE_API_KEY가 설정되지 않았습니다.");
    }

    // ✅ 이미지 파싱 (Base64 or FormData 모두 지원)
    const imageBase64 = await parseImageInput(request);
    const binary = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));

    // ✅ Hugging Face API 호출
    const response = await fetch("https://api-inference.huggingface.co/models/briaai/RMBG-1.4", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/octet-stream",
      },
      body: binary,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ Hugging Face 응답 오류:", text);
      throw new Error("배경제거 요청 실패");
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(arrayBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    // ✅ Cloudflare 응답 반환
    return new Response(JSON.stringify({ result: base64Image }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("remove-bg 오류:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};