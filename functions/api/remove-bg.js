export const onRequestPost = async ({ request, env }) => {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "이미지 데이터가 없습니다." }), {
        status: 400,
      });
    }

    const apiKey = env.HF_TOKEN; // ✅ Hugging Face API 키 (환경변수에 저장)
    if (!apiKey) {
      throw new Error("HF_TOKEN 환경 변수가 설정되지 않았습니다.");
    }

    // ✅ Base64 → Blob 변환
    const binary = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([binary], { type: "image/png" });

    // ✅ FormData 구성 (Hugging Face는 multipart/form-data만 허용)
    const formData = new FormData();
    formData.append("file", blob, "image.png");

    // ✅ Hugging Face 모델 엔드포인트
    const HF_MODEL = "briaai/RMBG-1.4"; // 예시 모델 (Remove Background)

    // ✅ API 요청
    const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("🚨 Hugging Face 응답 오류:", err);
      return new Response(JSON.stringify({ error: "Hugging Face 요청 실패", detail: err }), {
        status: 500,
      });
    }

    // ✅ 이미지 Blob으로 응답 수신
    const resultBlob = await response.blob();
    const arrayBuffer = await resultBlob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    // ✅ 최종 반환 (base64 PNG)
    return new Response(JSON.stringify({ image: `data:image/png;base64,${base64}` }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🚨 remove-bg 오류:", err);
    return new Response(
      JSON.stringify({ error: "remove-bg 처리 중 오류 발생", detail: err.message }),
      { status: 500 }
    );
  }
};
