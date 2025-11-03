export const onRequestPost = async ({ request }) => {
  try {
    // ✅ 1. formData로 이미지 파일과 width 값 가져오기
    const formData = await request.formData();
    const imageFile = formData.get("image");
    const width = parseInt(formData.get("width"));

    if (!imageFile || !width) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "이미지 또는 width 값이 없습니다.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ 2. 이미지 ArrayBuffer로 변환
    const arrayBuffer = await imageFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // ✅ 3. Cloudflare의 built-in Image API 사용
    // (HTMLRewriter처럼 Edge 환경에서 이미지 조작 가능)
    const blob = new Blob([bytes]);
    const imageBitmap = await createImageBitmap(blob);

    // 비율 유지 계산
    const aspect = imageBitmap.width / imageBitmap.height;
    const newW = width;
    const newH = Math.round(width / aspect);

    // ✅ 4. Canvas 없이 WASM 기반 리사이즈 (ImageData → bitmaprenderer)
    const offscreen = new OffscreenCanvas(newW, newH);
    const ctx = offscreen.getContext("2d");
    ctx.drawImage(imageBitmap, 0, 0, newW, newH);

    // ✅ 5. Base64 변환
    const blobOut = await offscreen.convertToBlob({ type: "image/png" });
    const resultBuffer = await blobOut.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(resultBuffer)));

    // ✅ 6. 응답 반환
    return new Response(
      JSON.stringify({ success: true, result: base64 }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("🚨 리사이즈 오류:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "리사이즈 중 오류 발생: " + err.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
