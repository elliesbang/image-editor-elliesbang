export const onRequestPost = async ({ request, env }) => {
  try {
    // ✅ 1. 이미지 파일 받기
    const formData = await request.formData();
    const imageFile = formData.get("image");

    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: "이미지가 없습니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ 2. 파일 → 바이트 배열 변환
    const buffer = await imageFile.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // ✅ 3. 새로운 Hugging Face Inference Providers 엔드포인트로 배경제거 요청
    const bgRes = await fetch(
      // 🔁 여기를 최신 라우터 주소로 변경
      "https://router.huggingface.co/hf-inference/models/Sanster/lama-cleaner",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/octet-stream",
        },
        body: bytes,
      }
    );

    if (!bgRes.ok) {
      const errText = await bgRes.text();
      throw new Error(`배경제거 실패 (HTTP ${bgRes.status}) - ${errText}`);
    }

    const bgBuffer = await bgRes.arrayBuffer();

    // ✅ 4. 크롭 처리 (Cloudflare Workers 환경에서는 OffscreenCanvas 사용 가능)
    const blob = new Blob([bgBuffer]);
    const imageBitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageBitmap, 0, 0);

    // ✅ 중앙 기준 정사각 크롭
    const cropSize = Math.min(imageBitmap.width, imageBitmap.height);
    const sx = (imageBitmap.width - cropSize) / 2;
    const sy = (imageBitmap.height - cropSize) / 2;

    const cropped = ctx.getImageData(sx, sy, cropSize, cropSize);
    const canvasCrop = new OffscreenCanvas(cropSize, cropSize);
    const ctxCrop = canvasCrop.getContext("2d");
    ctxCrop.putImageData(cropped, 0, 0);

    // ✅ PNG로 변환 → Base64 인코딩
    const croppedBlob = await canvasCrop.convertToBlob({ type: "image/png" });
    const croppedBuffer = await croppedBlob.arrayBuffer();
    const base64 = btoa(
      String.fromCharCode(...new Uint8Array(croppedBuffer))
    );

    // ✅ 최종 응답
    return new Response(
      JSON.stringify({ success: true, result: base64 }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("🚨 remove-bg-crop 오류:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
