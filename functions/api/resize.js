export const onRequestPost = async ({ request }) => {
  try {
    // ✅ 1. formData로 이미지와 width 받기
    const formData = await request.formData();
    const imageFile = formData.get("image");
    const width = parseInt(formData.get("width"));
    const keepAspect = formData.get("keepAspect") === "true";

    if (!imageFile || !width) {
      return new Response(
        JSON.stringify({ success: false, error: "이미지 또는 width 값이 없습니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ 2. 이미지 Blob을 ArrayBuffer로 변환
    const arrayBuffer = await imageFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode(...bytes));
    const imageUrl = `data:image/png;base64,${base64}`;

    // ✅ 3. HTMLCanvasElement 사용 (Cloudflare Workers에서도 지원)
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageUrl;
    });

    // ✅ 4. 비율 계산
    const aspect = image.width / image.height;
    const newW = width;
    const newH = keepAspect ? Math.round(width / aspect) : width;

    // ✅ 5. Canvas 생성 후 그리기
    const canvas = new OffscreenCanvas(newW, newH);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, newW, newH);

    // ✅ 6. Blob → Base64 변환
    const blob = await canvas.convertToBlob({ type: "image/png" });
    const resizedBuffer = await blob.arrayBuffer();
    const resizedBase64 = btoa(String.fromCharCode(...new Uint8Array(resizedBuffer)));

    // ✅ 7. 성공 응답
    return new Response(
      JSON.stringify({ success: true, result: resizedBase64 }),
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
