export const onRequestPost = async ({ request }) => {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image");
    const width = parseInt(formData.get("width"));
    const keepAspect = formData.get("keepAspect") === "true";

    if (!imageFile || !width) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "이미지 또는 width 값이 없습니다.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ Blob → ArrayBuffer → Base64 변환
    const buffer = await imageFile.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const base64 = btoa(String.fromCharCode(...bytes));
    const imageUrl = `data:image/png;base64,${base64}`;

    // ✅ Cloudflare 환경에서 Image 객체 생성
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("이미지 로드 실패"));
      img.src = imageUrl;
    });

    // ✅ 리사이즈 비율 계산
    const aspect = image.width / image.height;
    const newW = width;
    const newH = keepAspect ? Math.round(width / aspect) : width;

    // ✅ OffscreenCanvas로 리사이즈 처리
    const canvas = new OffscreenCanvas(newW, newH);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, newW, newH);

    // ✅ PNG Base64 변환
    const blob = await canvas.convertToBlob({ type: "image/png" });
    const resizedBuffer = await blob.arrayBuffer();
    const resizedBase64 = btoa(
      String.fromCharCode(...new Uint8Array(resizedBuffer))
    );

    // ✅ 응답 반환
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
