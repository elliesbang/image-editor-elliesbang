export async function onRequestPost({ request, env }) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "이미지 데이터가 없습니다." }),
        { status: 400 }
      );
    }

    // Base64 → Binary 변환
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const binary = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // ✅ Gradio Space용 요청 (briaai/RMBG-1.4)
    const formData = new FormData();
    const blob = new Blob([binary], { type: "image/png" });
    formData.append("image", blob, "input.png");

    const response = await fetch("https://briaai-rmbg-14.hf.space/run/predict", {
      method: "POST",
      body: formData, // ✅ multipart/form-data
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Space API 오류: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    // ✅ 결과 Base64 이미지 추출
    const outputBase64 = result.data?.[0];
    if (!outputBase64) {
      throw new Error("배경제거 결과를 불러오지 못했습니다.");
    }

    // Base64 → Binary 변환 후 반환
    const outputBuffer = Uint8Array.from(
      atob(outputBase64.split(",")[1]),
      (c) => c.charCodeAt(0)
    );

    return new Response(outputBuffer, {
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
