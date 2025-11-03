export const onRequestPost = async ({ request, env }) => {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image");
    if (!imageFile)
      return new Response(JSON.stringify({ error: "이미지가 없습니다." }), { status: 400 });

    const buffer = await imageFile.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // 1️⃣ 배경제거 요청
    const bgRes = await fetch("https://api-inference.huggingface.co/models/Sanster/lama-cleaner", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/octet-stream",
      },
      body: bytes,
    });

    if (!bgRes.ok) throw new Error("배경제거 실패");
    const bgBuffer = await bgRes.arrayBuffer();

    // 2️⃣ 로컬 크롭 (중앙 기준)
    const imageBitmap = await createImageBitmap(await new Blob([bgBuffer]));
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageBitmap, 0, 0);

    const cropSize = Math.min(imageBitmap.width, imageBitmap.height);
    const sx = (imageBitmap.width - cropSize) / 2;
    const sy = (imageBitmap.height - cropSize) / 2;

    const cropped = ctx.getImageData(sx, sy, cropSize, cropSize);
    const canvasCrop = new OffscreenCanvas(cropSize, cropSize);
    const ctxCrop = canvasCrop.getContext("2d");
    ctxCrop.putImageData(cropped, 0, 0);

    const blob = await canvasCrop.convertToBlob({ type: "image/png" });
    const arrayBufferCrop = await blob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBufferCrop)));

    return new Response(JSON.stringify({ result: base64, success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🚨 remove-bg-crop 오류:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
    });
  }
};
