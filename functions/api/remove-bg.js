// ✅ Hugging Face 배경제거 API (무료 모델 briaai/RMBG-1.4)
import { parseImageInput } from "../_utils/parseImageInput";

export const onRequestPost = async ({ request, env }) => {
  try {
    // 1️⃣ 업로드된 이미지(base64) 파싱
    const imageBase64 = await parseImageInput(request);
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "이미지 데이터가 없습니다." }), {
        status: 400,
      });
    }

    // 2️⃣ Hugging Face API 호출
    const apiUrl = "https://api-inference.huggingface.co/models/briaai/RMBG-1.4";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.HUGGINGFACE_API_KEY}`, // ✅ 환경변수에 토큰 추가
        "Content-Type": "application/octet-stream",
      },
      body: Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0)),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("⚠️ HuggingFace 응답 오류:", errorText);
      return new Response(JSON.stringify({ error: "Hugging Face API 요청 실패" }), {
        status: 500,
      });
    }

    // 3️⃣ 결과 이미지 Blob → base64로 변환
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64Result = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    // 4️⃣ 결과 반환
    return new Response(
      JSON.stringify({
        success: true,
        result: base64Result,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    console.error("remove-bg 오류:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};