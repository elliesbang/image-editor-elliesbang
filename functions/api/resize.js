export const onRequestPost = async ({ request }) => {
  try {
    // ✅ 1. formData로 이미지와 width 가져오기
    const formData = await request.formData();
    const imageFile = formData.get("image");
    const width = parseInt(formData.get("width"));

    if (!imageFile || !width) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "이미지 또는 가로(width) 값이 없습니다.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ 2. 이미지 → ArrayBuffer
    const buffer = await imageFile.arrayBuffer();
    const blob = new Blob([buffer]);
    const imageBitmap = await createImageBitmap(blob);

    // ✅ 3. 비율 유지 리사이즈 계산
    const aspect = imageBitmap.width / imageBitmap.height;
    const newW = width;
    const newH = Math.round(width / aspect);

    // ✅ 4. OffscreenCanvas로 리사이즈 처리
    const canvas = new OffscreenCanvas(newW, newH);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageBitmap, 0, 0, newW, newH);

    // ✅ 5. Base64 인코딩 결과 반환
    const resizedBlob = await canvas.convertToBlob({ type: "image/png" });
    const resizedBuffer = await resizedBlob.arrayBuffer();
    const base64 = btoa(
      String.fromCharCode(...new Uint8Array(resizedBuffer))
    );

    // ✅ 6. 성공 응답
    return new Response(
      JSON.stringify({ success: true, result: base64 }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("🚨 리사이즈 오류:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "리사이즈 처리 중 오류 발생: " + err.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
