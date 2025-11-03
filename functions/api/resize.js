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

    // ✅ 이미지 ArrayBuffer → Blob → ImageBitmap
    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBitmap = await createImageBitmap(
      new Blob([arrayBuffer], { type: imageFile.type || "image/png" })
    );

    const aspect = imageBitmap.width / imageBitmap.height;
    const newW = width;
    const newH = keepAspect ? Math.round(width / aspect) : width;

    // ✅ OffscreenCanvas 기반 리사이즈
    const canvas = new OffscreenCanvas(newW, newH);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageBitmap, 0, 0, newW, newH);

    // ✅ Blob → ArrayBuffer → Base64 (안정적 변환)
    const resizedBlob = await canvas.convertToBlob({ type: "image/png" });
    const resizedBuffer = await resizedBlob.arrayBuffer();

    // 👉 여기 핵심: Buffer.from() 사용 (Cloudflare 호환)
    const base64 = Buffer.from(resizedBuffer).toString("base64");

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
