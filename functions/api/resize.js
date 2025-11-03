export const onRequestPost = async ({ request }) => {
  try {
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

    const buffer = await imageFile.arrayBuffer();
    const blob = new Blob([buffer]);

    // ✅ Cloudflare/Node 호환 ImageBitmap 생성
    let imageBitmap;
    try {
      imageBitmap = await createImageBitmap(blob);
    } catch {
      const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = URL.createObjectURL(blob);
      });
      imageBitmap = img;
    }

    // ✅ 비율 유지 리사이즈
    const aspect = imageBitmap.width / imageBitmap.height;
    const newW = width;
    const newH = Math.round(width / aspect);

    // ✅ Canvas 환경 호환 처리
    let canvas;
    if (typeof OffscreenCanvas !== "undefined") {
      canvas = new OffscreenCanvas(newW, newH);
    } else {
      canvas = new (require("canvas").Canvas)(newW, newH);
    }

    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageBitmap, 0, 0, newW, newH);

    // ✅ base64 변환
    const resizedBlob = await canvas.convertToBlob({ type: "image/png" });
    const resizedBuffer = await resizedBlob.arrayBuffer();
    const base64 = btoa(
      String.fromCharCode(...new Uint8Array(resizedBuffer))
    );

    // ✅ 응답 반환
    return new Response(
      JSON.stringify({
        success: true,
        message: "리사이즈 완료",
        result: base64,
      }),
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
