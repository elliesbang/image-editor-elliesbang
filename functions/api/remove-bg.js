export async function onRequestPost({ request, env }) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64)
      return new Response(
        JSON.stringify({ error: "이미지 데이터가 없습니다." }),
        { status: 400 }
      );

    // Base64 → 바이너리 변환
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const binary = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // ✅ Hugging Face 모델 (briaai/RMBG-1.4)
    const response = await fetch(
      "https://api-inference.huggingface.co/models/briaai/RMBG-1.4",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.HF_API_KEY}`, // 환경변수 사용
          "Content-Type": "application/octet-stream",
        },
        body: binary, // 바이너리 직접 전송
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`허깅페이스 API 오류: ${response.status} ${errorText}`);
    }

    // 결과 이미지 (PNG) 반환
    const result = await response.arrayBuffer();
    return new Response(result, {
      headers: { "Content-Type": "image/png" },
    });
  } catch (err) {
    console.error("🚨 remove-bg 오류:", err);
    return new Response(
      JSON.stringify({ error: `remove-bg 오류: ${err.message}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
