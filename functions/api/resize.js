export const onRequestPost = async ({ request }) => {
  try {
    // ✅ 1. 이미지와 리사이즈 크기 받기
    const formData = await request.formData();
    const imageFile = formData.get("image");
    const width = parseInt(formData.get("width"), 10);

    if (!imageFile || !width) {
      return new Response(
        JSON.stringify({ success: false, error: "이미지 또는 리사이즈 크기가 없습니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ 2. 원본 이미지 로드
    const buffer = await imageFile.arrayBuffer();
    const blob = new Blob([buffer]);
    const imageBitmap = await createImageBitmap(blob);

    // ✅ 3. 비율 유지하면서 리사이즈
    const aspect = imageBitmap.width / imageBitmap.height;
    const newW = width;
    const newH = Math.round(newW / aspect);

    const canvas = new OffscreenCanvas(newW, newH);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageBitmap, 0, 0, newW, newH);

    // ✅ 4. 리사이즈 결과를 base64로 변환
    const resizedBlob = await canvas.convertToBlob({ type: "image/png" });
    const resizedBuffer = await resizedBlob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(resizedBuffer)));

    // ✅ 5. 성공 응답
    return new Response(
      JSON.stringify({ success: true, result: base64 }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("🚨 resize 오류:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
