export const onRequestPost = async ({ request, env }) => {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "이미지 데이터가 없습니다." }),
        { status: 400 }
      );
    }

    const HF_TOKEN = env.HF_TOKEN; // ✅ Hugging Face 토큰
    if (!HF_TOKEN) {
      throw new Error("HF_TOKEN 환경 변수가 설정되지 않았습니다.");
    }

    // ✅ Base64 → Binary 변환
    const cleanBase64 = imageBase64.replace(
      /^data:image\/[a-zA-Z0-9+.-]+;base64,/,
      ""
    );
    const binary = Uint8Array.from(atob(cleanBase64), (c) => c.charCodeAt(0));

    // ✅ FormData 구성 (Hugging Face는 multipart/form-data 형식만 허용)
    const formData = new FormData();
    formData.append("file", new Blob([binary], { type: "image/png" }), "image.png");

    // ✅ Hugging Face 모델 (Remove Background)
    const HF_MODEL = "briaai/RMBG-1.4"; // 배경제거 모델명

    // ✅ Hugging Face API 호출
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("🚨 Hugging Face 응답 오류:", errText);
      return new Response(
        JSON.stringify({
          error: "Hugging Face 요청 실패",
          detail: errText,
        }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ 결과 이미지(base64) 변환
    const resultBlob = await response.blob();
    const arrayBuffer = await resultBlob.arrayBuffer();
    const resultBase64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    // ✅ 최종 반환 (base64 PNG)
    return new Response(
      JSON.stringify({ image: `data:image/png;base64,${resultBase64}` }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("🚨 remove-bg 오류:", err);
    return new Response(
      JSON.stringify({
        error: "remove-bg 처리 중 오류 발생",
        detail: err.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
